"""Persistent ChatGPT-style conversations & Literature Review workspace endpoints.

Supports:
  - Research (chat over papers, queries, discovery)
  - Literature Review (iterative exploration, comparison matrix, gap analysis, synthesis)
  - Chat with Paper (scoped paper chat)
  - General Research
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

import config
import db
from services import retrieval as retrieval_svc
from services.agent import reflection
from services.agent.tools import _assign_markers
from services.llm import build_llm
from services.llm.base import LLMError
from services.llm.context_builder import build_llm_context, compact_conversation_summary
from services.pdf_rag_service import pdf_rag_service

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


# ---------------------------------------------------------------------------
# Request & Response Models
# ---------------------------------------------------------------------------

class CreateConversationIn(BaseModel):
    title: Optional[str] = None
    mode: str = "research"  # 'research' | 'chat_with_paper' | 'literature_review' | 'general_research'
    user_id: str = "user"
    research_topic: str = ""
    selected_paper_ids: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    initial_message: Optional[str] = None


class UpdateConversationIn(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None
    status: Optional[str] = None
    research_topic: Optional[str] = None
    selected_paper_ids: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class MessageIn(BaseModel):
    id: Optional[str] = None
    role: str  # 'user' | 'assistant' | 'agent-activity'
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    sequence: Optional[int] = None


class ConversationChatIn(BaseModel):
    message_id: Optional[str] = None
    query: str
    selected_paper_ids: Optional[List[str]] = None
    doc_id: Optional[str] = None
    mode: Optional[str] = None


class GenerateReviewIn(BaseModel):
    focus_topic: Optional[str] = None
    mode: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("")
def list_conversations(
    mode: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
) -> Dict[str, Any]:
    convs = db.list_conversations(mode=mode, limit=limit)
    return {"conversations": convs}


@router.post("")
def create_conversation_endpoint(payload: CreateConversationIn) -> Dict[str, Any]:
    conv = db.create_conversation(
        title=payload.title or "",
        mode=payload.mode,
        user_id=payload.user_id,
        research_topic=payload.research_topic,
        selected_paper_ids=payload.selected_paper_ids,
        metadata=payload.metadata,
    )
    if payload.initial_message:
        db.add_message(
            conv["id"],
            role="user",
            content=payload.initial_message,
            metadata={},
        )
    conv["messages"] = db.get_messages(conv["id"])
    return conv


@router.get("/{conv_id}")
def get_conversation_endpoint(conv_id: str) -> Dict[str, Any]:
    conv = db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv["messages"] = db.get_messages(conv_id)
    return conv


@router.patch("/{conv_id}")
def update_conversation_endpoint(conv_id: str, payload: UpdateConversationIn) -> Dict[str, Any]:
    existing = db.get_conversation(conv_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = db.update_conversation(conv_id, **update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Failed to update conversation")
    updated["messages"] = db.get_messages(conv_id)
    return updated


@router.delete("/{conv_id}")
def delete_conversation_endpoint(conv_id: str) -> Dict[str, Any]:
    if not db.delete_conversation(conv_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted", "id": conv_id}


@router.get("/{conv_id}/messages")
def get_messages_endpoint(conv_id: str) -> Dict[str, Any]:
    conv = db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"messages": db.get_messages(conv_id)}


@router.post("/{conv_id}/messages")
def add_message_endpoint(conv_id: str, payload: MessageIn) -> Dict[str, Any]:
    conv = db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    msg = db.add_message(
        conv_id=conv_id,
        role=payload.role,
        content=payload.content,
        metadata=payload.metadata,
        message_id=payload.id,
        sequence=payload.sequence,
    )
    return msg


@router.post("/{conv_id}/chat")
def conversation_chat_endpoint(conv_id: str, payload: ConversationChatIn) -> Dict[str, Any]:
    """Execute a contextual RAG/chat turn inside a persistent conversation."""
    t0 = time.perf_counter()
    conv = db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    q = payload.query.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # 1. Update title deterministically if untitled or default
    if not conv.get("title") or conv["title"] in ("New Research", "Untitled Conversation", ""):
        new_title = db.generate_conversation_title(q)
        db.update_conversation(conv_id, title=new_title, research_topic=conv.get("research_topic") or q)

    # 2. Persist user message (idempotently with message_id)
    user_msg_id = payload.message_id or db.new_id("msg-user")
    db.add_message(
        conv_id=conv_id,
        role="user",
        content=q,
        message_id=user_msg_id,
    )

    # 3. Determine target papers & mode
    target_mode = payload.mode or conv.get("mode", "research")
    target_doc_ids = []
    
    if payload.doc_id:
        target_doc_ids.append(payload.doc_id)
    if payload.selected_paper_ids:
        target_doc_ids.extend([d for d in payload.selected_paper_ids if d and d not in target_doc_ids])
    if not target_doc_ids and conv.get("selected_paper_ids"):
        target_doc_ids.extend([d for d in conv["selected_paper_ids"] if d and d not in target_doc_ids])

    # If metadata has doc_id (for chat_with_paper mode)
    if not target_doc_ids and (conv.get("metadata") or {}).get("doc_id"):
        target_doc_ids.append(conv["metadata"]["doc_id"])

    # 4. Retrieve evidence chunks (bounded to top 4-6 chunks)
    milestones = []
    milestones.append({"label": "Understood question and context", "done": True})
    
    hits: List[Dict[str, Any]] = []
    if target_doc_ids:
        milestones.append({"label": f"Searching evidence across {len(target_doc_ids)} selected paper(s)", "done": True})
        doc_chunks = db.get_chunks(target_doc_ids)
        if doc_chunks:
            hits = retrieval_svc.retrieve(
                q,
                doc_chunks,
                top_k=config.RETRIEVAL_TOP_K,
                per_doc_cap=4 if len(target_doc_ids) > 1 else config.RETRIEVAL_TOP_K,
            )
    else:
        # Check all corpus chunks if no specific papers selected
        all_chunks = db.get_chunks()
        if all_chunks:
            hits = retrieval_svc.retrieve(q, all_chunks, top_k=config.RETRIEVAL_TOP_K, per_doc_cap=3)

    _assign_markers(hits)

    # 5. Build prompt with recent turns + compact summary + evidence via centralized builder
    messages = db.get_messages(conv_id)
    
    summary = None
    if len(messages) > config.RECENT_MESSAGE_LIMIT:
        summary = compact_conversation_summary(
            messages[:-config.RECENT_MESSAGE_LIMIT],
            current_topic=conv.get("research_topic") or conv.get("title") or "",
        )

    ctx_bundle = build_llm_context(
        current_question=q,
        recent_messages=messages,
        conversation_summary=summary,
        retrieved_chunks=hits,
        max_chunks=config.RETRIEVAL_TOP_K,
        max_history_turns=config.RECENT_MESSAGE_LIMIT,
    )

    system_prompt = (
        "You are R-Lens, an expert academic research assistant.\n"
        "Provide rigorous, objective, evidence-backed answers in clean markdown format.\n\n"
        "Rules:\n"
        "- Cite evidence markers such as [S1, p. 4] or [Paper Title, p. 2] for all factual claims.\n"
        "- When asked for comparisons, structure the output clearly (e.g. comparison tables with Method, Dataset, Horizon, Metrics, Findings).\n"
        "- If information is unavailable or not reported in the retrieved evidence, state clearly: 'Not reported in the available source.' Never invent values.\n"
        "- Ground all conclusions strictly in the provided evidence."
    )

    milestones.append({"label": "Synthesizing answer with Gemini", "done": True})
    
    try:
        llm = build_llm()
        result = llm.generate(
            ctx_bundle["prompt"],
            system=system_prompt,
            max_tokens=config.RAG_ANSWER_MAX_OUTPUT_TOKENS if hits else config.NORMAL_CHAT_MAX_OUTPUT_TOKENS,
        )
        answer_text = result.text or "I was unable to find sufficient grounded evidence in the selected papers for this query."
    except LLMError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"LLM synthesis failed: {exc}")

    # 6. Reflection / verification
    verified = False
    support_rate = 0.0
    if hits:
        refl = reflection.verify(answer_text, hits, approved_doc_ids=target_doc_ids or None, correct=False)
        verified = refl.verified
        support_rate = refl.support_rate

    milestones.append({"label": "Verified citation support and page anchors", "done": True})

    # 7. Format source chunks for frontend
    sources = []
    seen = set()
    for h in ctx_bundle["used_chunks"]:
        m = h.get("marker", "")
        if m in seen:
            continue
        seen.add(m)
        sources.append({
            "chunk_id": str(h.get("id", "")),
            "doc_id": str(h.get("doc_id", "")),
            "doc_title": str(h.get("doc_title", "")),
            "filename": str(h.get("doc_filename", "")),
            "page": int(h.get("page", 1)),
            "section": str(h.get("section", "")),
            "quote": str(h.get("text", ""))[:500],
            "marker": m,
            "score": float(h.get("_score", 0.0)),
        })

    # 8. Persist assistant message
    asst_msg_id = db.new_id("msg-asst")
    asst_meta = {
        "sources": sources,
        "verified": verified,
        "support_rate": support_rate,
        "milestones": milestones,
        "latency_ms": int((time.perf_counter() - t0) * 1000),
    }
    db.add_message(
        conv_id=conv_id,
        role="assistant",
        content=answer_text,
        metadata=asst_meta,
        message_id=asst_msg_id,
    )

    return {
        "id": asst_msg_id,
        "role": "assistant",
        "content": answer_text,
        "sources": sources,
        "verified": verified,
        "support_rate": support_rate,
        "milestones": milestones,
        "latency_ms": int((time.perf_counter() - t0) * 1000),
    }


@router.post("/{conv_id}/literature-review/generate")
def generate_review_endpoint(conv_id: str, payload: GenerateReviewIn) -> Dict[str, Any]:
    """Generate a structured, evidence-backed literature review for the conversation."""
    t0 = time.perf_counter()
    conv = db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    selected_ids = conv.get("selected_paper_ids", [])
    if not selected_ids:
        # Fallback to all corpus documents (bounded to top 4)
        selected_ids = [d["id"] for d in db.list_documents()][:4]

    chunks = db.get_chunks(selected_ids)
    if not chunks:
        chunks = db.get_chunks()[:12]

    _assign_markers(chunks)

    topic = payload.focus_topic or conv.get("research_topic") or conv.get("title") or "Academic Literature Review"

    # Limit chunk excerpts to avoid oversized prompts
    evidence_text = "\n\n".join([
        f"[{c['marker']}] {c.get('doc_title', 'Paper')} (Page {c.get('page', 1)}):\n{c.get('text', '')[:450]}"
        for c in chunks[:10]
    ])

    prompt = (
        f"Generate a comprehensive, publication-ready Literature Review on the topic:\n"
        f"\"{topic}\"\n\n"
        f"Use the following verified evidence passages from analyzed papers:\n\n"
        f"{evidence_text}\n\n"
        f"Structure the review with these 10 distinct sections:\n"
        f"1. Introduction\n"
        f"2. Existing Approaches\n"
        f"3. Deep Learning Methods\n"
        f"4. Optimization Techniques\n"
        f"5. Explainable AI (XAI)\n"
        f"6. Multi-Horizon Forecasting / Empirical Evaluation\n"
        f"7. Comparative Analysis Matrix (include a markdown table with Paper | Method | Dataset | Horizon | XAI | Optimization | Results)\n"
        f"8. Identified Research Gaps (derive strictly from literature limitations)\n"
        f"9. Future Research Directions\n"
        f"10. References\n\n"
        f"Cite evidence inline using markers like [S1, p. 3]. If any aspect is not reported, state 'Not reported in the available source'."
    )

    try:
        llm = build_llm()
        result = llm.generate(
            prompt,
            system="You are R-Lens, an academic literature synthesis specialist.",
            max_tokens=config.LITERATURE_SYNTHESIS_MAX_OUTPUT_TOKENS,
        )
        review_markdown = result.text
    except LLMError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Review generation failed: {exc}")

    # Store in conversation metadata
    meta = conv.get("metadata", {})
    meta["generated_review"] = review_markdown
    meta["review_generated_at"] = time.time()
    db.update_conversation(conv_id, metadata=meta)

    # Add as assistant message
    sources = [{
        "chunk_id": str(c.get("id", "")),
        "doc_id": str(c.get("doc_id", "")),
        "doc_title": str(c.get("doc_title", "")),
        "page": int(c.get("page", 1)),
        "marker": c.get("marker", ""),
        "quote": str(c.get("text", ""))[:350],
    } for c in chunks[:8]]

    msg_id = db.new_id("msg-rev")
    db.add_message(
        conv_id=conv_id,
        role="assistant",
        content=review_markdown,
        metadata={
            "type": "literature_review",
            "sources": sources,
            "topic": topic,
            "latency_ms": int((time.perf_counter() - t0) * 1000),
        },
        message_id=msg_id,
    )

    return {
        "id": msg_id,
        "content": review_markdown,
        "sources": sources,
        "topic": topic,
        "latency_ms": int((time.perf_counter() - t0) * 1000),
    }


@router.post("/{conv_id}/compare")
def compare_papers_endpoint(conv_id: str) -> Dict[str, Any]:
    """Generate an evidence-backed comparison matrix for the selected papers in the conversation."""
    conv = db.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    selected_ids = conv.get("selected_paper_ids", [])
    if not selected_ids:
        selected_ids = [d["id"] for d in db.list_documents()][:4]

    docs = [db.get_document(did) for did in selected_ids if db.get_document(did)]
    chunks = db.get_chunks(selected_ids)
    _assign_markers(chunks)

    doc_summaries = []
    for d in docs:
        d_chunks = [c for c in chunks if c.get("doc_id") == d["id"]]
        excerpt = "\n".join([f"Page {c.get('page')}: {c.get('text')[:250]}" for c in d_chunks[:2]])
        doc_summaries.append(
            f"Paper: {d.get('title', 'Untitled')} (Authors: {d.get('authors', 'N/A')}, Year: {d.get('year', 'N/A')})\n"
            f"Abstract: {d.get('abstract', 'N/A')[:300]}\n"
            f"Passages:\n{excerpt}"
        )

    prompt = (
        "Generate a structured academic comparison matrix table for the following papers.\n"
        "Table columns MUST be:\n"
        "| Paper | Primary Method | Dataset Tested | Forecast Horizon | Explainability (XAI) | Optimization | Empirical Results / Key Findings |\n\n"
        "Rules:\n"
        "- Only use the provided paper details.\n"
        "- If any column information is missing or not extracted, write 'Not reported in the available source'. Do NOT invent numbers or dataset names.\n\n"
        + "\n\n---\n\n".join(doc_summaries)
    )

    try:
        llm = build_llm()
        result = llm.generate(
            prompt,
            system="You are R-Lens, comparing academic papers based strictly on verified evidence.",
            max_tokens=config.LITERATURE_SYNTHESIS_MAX_OUTPUT_TOKENS,
        )
        table_markdown = result.text
    except LLMError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Comparison generation failed: {exc}")

    asst_msg_id = db.new_id("msg-cmp")
    db.add_message(
        conv_id=conv_id,
        role="assistant",
        content=f"### Evidence-Backed Comparison Matrix\n\n{table_markdown}",
        metadata={"type": "comparison_matrix", "papers_compared": len(docs)},
        message_id=asst_msg_id,
    )

    return {
        "id": asst_msg_id,
        "matrix_markdown": table_markdown,
        "papers_count": len(docs),
    }
