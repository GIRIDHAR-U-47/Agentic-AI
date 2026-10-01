"""Dedicated "Chat with a single paper" endpoint.

Journey
-------
  SAVED PAPER → OPEN PAPER → CHAT WITH PAPER
  → USER QUESTION → RETRIEVE CHUNKS → VALIDATE EVIDENCE
  → ANSWER → PAGE CITATIONS → USER FOLLOW-UP → CONTINUE CHAT

Design decisions
----------------
* Retrieval is scoped **strictly** to the requested doc_id.  No other
  documents are searched.
* Conversation history is passed in from the frontend (stateless server),
  which means the caller owns the session memory.  This avoids the need for
  a new DB table and keeps the backend simple.
* Agentic query rewriting: if the first BM25 retrieval is insufficient
  (coverage_passes returns False), the LLM is asked to rewrite the query and
  we retrieve once more.  This is the "validate evidence" step that surfaces
  as "Validating sources..." in the UI.
* The endpoint is synchronous (no streaming) so it works with the existing
  FastAPI setup.  The frontend simulates streaming by rendering the response
  word-by-word.
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import db
from services import retrieval as retrieval_svc
from services.agent import reflection
from services.agent.tools import _assign_markers  # type: ignore[attr-defined]
from services.llm import build_llm
from services.pdf_rag_service import pdf_rag_service

router = APIRouter(prefix="/pdf", tags=["Paper Chat"])

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ConversationTurn(BaseModel):
    role: str          # "user" | "assistant"
    content: str


class PaperChatRequest(BaseModel):
    doc_id: Optional[str] = None
    doc_ids: List[str] = Field(default_factory=list)
    query: str
    history: List[ConversationTurn] = Field(default_factory=list)


class SourceChunk(BaseModel):
    chunk_id: str = ""
    doc_id: str
    doc_title: str
    filename: str
    page: int
    section: str
    quote: str          # the retrieved passage text
    marker: str         # e.g. "[S1]"
    score: float = 0.0


class PaperChatResponse(BaseModel):
    query: str
    answer: str
    sources: List[SourceChunk] = Field(default_factory=list)
    verified: bool = False
    support_rate: float = 0.0
    insufficient_evidence: bool = False
    query_rewritten: bool = False
    rewritten_query: str = ""
    agent_status: List[str] = Field(default_factory=list)
    latency_ms: int = 0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_history_context(history: List[ConversationTurn], max_turns: int = 6) -> str:
    """Format the last N turns of conversation history for the prompt."""
    if not history:
        return ""
    recent = history[-max_turns:]
    lines = []
    for turn in recent:
        prefix = "Researcher" if turn.role == "user" else "R-Lens"
        lines.append(f"{prefix}: {turn.content.strip()}")
    return "\n".join(lines)


def _build_paper_chat_prompt(
    query: str,
    hits: List[Dict[str, Any]],
    history_ctx: str,
) -> str:
    """Assemble the grounded-answer prompt for a single or multi-paper chat turn."""
    blocks = []
    for c in hits:
        title = c.get("doc_title") or c.get("doc_filename", "")
        blocks.append(
            f"[EVIDENCE {c['marker']}] Source Paper: {title} | "
            f"Page {c.get('page')} | Section: {c.get('section')}\n"
            f"{c.get('text', '')}"
        )

    evidence_section = "=== RETRIEVED EVIDENCE FROM SELECTED PAPERS ===\n\n" + "\n\n---\n\n".join(blocks)

    history_section = ""
    if history_ctx:
        history_section = f"\n\n=== PREVIOUS CONVERSATION ===\n{history_ctx}\n"

    return (
        evidence_section
        + history_section
        + f"\n\n=== CURRENT USER QUESTION ===\n{query}\n\n"
        "=== GROUNDED ANSWER (cite evidence markers like [S1] and page numbers) ==="
    )


def _rewrite_query_with_llm(llm, original_query: str, paper_title: str) -> str:
    """Ask the LLM to rewrite a query into better keyword terms."""
    if getattr(llm, "offline", False):
        import re
        stopwords = {"what", "which", "where", "when", "does", "they", "this", "that", "with", "from", "the", "did", "authors", "evaluate", "propose", "on"}
        words = [w for w in re.sub(r"[^\w\s]", " ", original_query).split() if len(w) > 2 and w.lower() not in stopwords]
        return " ".join(words) if words else original_query

    system = (
        "You rewrite natural-language questions into short, keyword-style search "
        "terms optimised for BM25 retrieval over academic paper text.  "
        "Output ONLY the rewritten query — no explanation, no punctuation, "
        "no quotes."
    )
    prompt = (
        f"Context Title: {paper_title}\n"
        f"Original question: {original_query}\n"
        "Rewrite into keyword terms:"
    )
    try:
        result = llm.generate(prompt, system=system)
        text = result.text.strip().split("\n")[0][:200]
        if "insufficient" in text.lower() or "no supporting" in text.lower():
            return original_query
        return text
    except Exception:
        return original_query


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/paper-chat", response_model=PaperChatResponse)
def paper_chat(req: PaperChatRequest) -> PaperChatResponse:
    """Run the agentic RAG pipeline scoped strictly to the specified paper(s)."""
    t0 = time.perf_counter()
    agent_status: List[str] = []

    target_doc_ids: List[str] = []
    if req.doc_id:
        target_doc_ids.append(req.doc_id)
    for did in req.doc_ids:
        if did and did not in target_doc_ids:
            target_doc_ids.append(did)

    if not target_doc_ids:
        raise HTTPException(
            status_code=400,
            detail="No document ID provided for paper chat.",
        )

    # -- 1. Validate documents exist ----------------------------------------
    docs = []
    for did in target_doc_ids:
        doc = pdf_rag_service.get_document(did)
        if doc:
            docs.append(doc)

    if not docs:
        raise HTTPException(
            status_code=404,
            detail=f"Paper(s) {target_doc_ids} not found in index. Make sure they are saved and indexed first.",
        )

    paper_titles = ", ".join([d.title or d.filename for d in docs])
    agent_status.append(f"Loaded {len(docs)} paper(s) from index...")

    # -- 2. Retrieval strictly scoped to target documents ---------------------
    agent_status.append("Retrieving evidence passages...")
    all_hits: List[Dict[str, Any]] = []

    for d in docs:
        doc_chunks = db.get_chunks([d.id])
        if not doc_chunks:
            continue
        doc_hits = retrieval_svc.retrieve(
            req.query,
            doc_chunks,
            top_k=6 if len(docs) > 1 else 8,
            per_doc_cap=6 if len(docs) > 1 else 8,
        )
        for h in doc_hits:
            h["doc_title"] = d.title or d.filename
            h["doc_filename"] = d.filename
            h["doc_id"] = d.id
        all_hits.extend(doc_hits)

    hits = all_hits

    if not hits:
        return PaperChatResponse(
            query=req.query,
            answer="I couldn't find this information in the uploaded paper.",
            insufficient_evidence=True,
            agent_status=agent_status + ["No indexed chunks found for the query."],
            latency_ms=int((time.perf_counter() - t0) * 1000),
        )

    # -- 3. Query rewriting if coverage is weak -------------------------------
    query_rewritten = False
    rewritten_query = ""
    llm = build_llm()

    coverage_ok = retrieval_svc.coverage_passes(req.query, hits)
    if not coverage_ok:
        agent_status.append("Validating evidence coverage...")
        agent_status.append("Rewriting query for deeper retrieval...")
        rewritten_query = _rewrite_query_with_llm(llm, req.query, paper_titles)
        if rewritten_query and rewritten_query != req.query:
            query_rewritten = True
            retry_hits: List[Dict[str, Any]] = []
            for d in docs:
                doc_chunks = db.get_chunks([d.id])
                if not doc_chunks:
                    continue
                d_hits = retrieval_svc.retrieve(
                    rewritten_query,
                    doc_chunks,
                    top_k=6 if len(docs) > 1 else 8,
                    per_doc_cap=6 if len(docs) > 1 else 8,
                )
                for h in d_hits:
                    h["doc_title"] = d.title or d.filename
                    h["doc_filename"] = d.filename
                    h["doc_id"] = d.id
                retry_hits.extend(d_hits)
            if len(retry_hits) >= len(hits):
                hits = retry_hits
    else:
        agent_status.append("Validating evidence coverage...")

    # -- 4. Strict grounding check -------------------------------------------
    has_coverage = retrieval_svc.coverage_passes(req.query, hits)
    if not has_coverage and query_rewritten and rewritten_query:
        has_coverage = retrieval_svc.coverage_passes(rewritten_query, hits)

    if not hits or not has_coverage:
        return PaperChatResponse(
            query=req.query,
            answer="I couldn't find this information in the uploaded paper.",
            insufficient_evidence=True,
            query_rewritten=query_rewritten,
            rewritten_query=rewritten_query,
            agent_status=agent_status + ["No relevant passages found in the selected paper."],
            latency_ms=int((time.perf_counter() - t0) * 1000),
        )

    # -- 5. Generate grounded answer via LLM ----------------------------------
    agent_status.append("Generating grounded answer with Gemini...")
    _assign_markers(hits)

    history_ctx = _build_history_context(req.history)
    prompt = _build_paper_chat_prompt(req.query, hits, history_ctx)

    paper_system = (
        "You are R-Lens, an academic research assistant.\n\n"
        "Answer only using the supplied evidence from the selected paper(s).\n\n"
        "Do not use:\n"
        "- unrelated documents\n"
        "- previous papers\n"
        "- previous research sessions\n"
        "- demo data\n"
        "- unsupported assumptions\n"
        "- invented facts\n\n"
        "If the requested information is not supported by the supplied evidence, say:\n"
        "'I couldn't find this information in the uploaded paper.'\n\n"
        "Every factual claim must be traceable to a source page. Cite sources inline using "
        "evidence markers and page numbers, e.g. [S1, p. 4] or [Paper.pdf, p. 4].\n"
        "Keep the answer clear, rigorous and well-formatted in markdown."
    )

    result = llm.generate(prompt, system=paper_system)
    answer_text = result.text or ""

    # -- 6. Reflection / verification ----------------------------------------
    agent_status.append("Verifying citations & page anchors...")
    refl = reflection.verify(
        answer_text, hits, approved_doc_ids=target_doc_ids, correct=False
    )

    sources: List[SourceChunk] = []
    seen_markers: set = set()
    for h in hits:
        m = h.get("marker", "")
        if m in seen_markers:
            continue
        seen_markers.add(m)
        sources.append(
            SourceChunk(
                chunk_id=str(h.get("id", "")),
                doc_id=str(h.get("doc_id", target_doc_ids[0])),
                doc_title=str(h.get("doc_title", "")),
                filename=str(h.get("doc_filename", "")),
                page=int(h.get("page", 1)),
                section=str(h.get("section", "")),
                quote=str(h.get("text", ""))[:600],
                marker=m,
                score=float(h.get("_score", 0.0)),
            )
        )

    return PaperChatResponse(
        query=req.query,
        answer=answer_text,
        sources=sources,
        verified=refl.verified,
        support_rate=refl.support_rate,
        insufficient_evidence=not refl.citations and not answer_text,
        query_rewritten=query_rewritten,
        rewritten_query=rewritten_query,
        agent_status=agent_status,
        latency_ms=int((time.perf_counter() - t0) * 1000),
    )
