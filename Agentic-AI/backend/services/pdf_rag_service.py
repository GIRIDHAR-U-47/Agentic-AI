"""Backward-compatible facade over the new ingestion/retrieval/agent stack.

The original `PDFRAGService` was the only genuinely working part of the project.
Its extraction and chunking logic is preserved verbatim in `services/ingest.py`,
and its grounded-answer prompt is preserved in `services/agent/prompts.py`. What
was removed, deliberately:

* ``self.documents = {}`` -- an in-memory dict that lost the entire corpus on
  restart. Now SQLite (`db.py`).
* ``agent_steps=[...]`` with hardcoded strings like "Retrieved relevant
  context" -- a fake activity log that reported steps the code never took. The
  real log is now produced by `ActivityRecorder` from actual LangChain callbacks.
* ``verified=True`` as a literal -- "verified" is now computed by
  `services.agent.reflection.verify`, which checks that every citation resolves
  and that every number appears in the cited passage.
* ``_expand_query``, a static dict lookup. Superseded by
  `services.agent.offline_policy.expand_query` plus a real BM25 ranker.

This module exists so the original `/pdf/*` routes and
`frontend/src/services/pdfService.ts` keep working unchanged.
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

import config
import db
from services import retrieval
from services.agent import reflection
from services.agent.prompts import SYNTHESIS_SYSTEM
from services.ingest import extract_pages, ingest_pdf
from services.llm import build_llm


class PDFDocument(BaseModel):
    id: str
    filename: str
    title: str
    authors: str
    year: Optional[str] = None
    page_count: int = 0
    chunk_count: int = 0
    text_chars: int = 0
    sha256: Optional[str] = None
    source: str = "upload"
    abstract: str = ""


class Citation(BaseModel):
    marker: str
    title: Optional[str] = None
    page: Optional[int] = None
    section: Optional[str] = None
    quote: str = ""


class AgenticRAGResponse(BaseModel):
    query: str
    answer: str
    sources: List[Citation] = Field(default_factory=list)
    documents_used: List[str] = Field(default_factory=list)
    activity: List[Dict[str, Any]] = Field(default_factory=list)
    verified: bool = False
    support_rate: float = 0.0
    insufficient_evidence: bool = False
    latency_ms: int = 0


class PDFRAGService:
    """Thin adapter: the real logic lives in `ingest`, `retrieval`, `agent`."""

    def process_uploaded_pdf(self, file_bytes: bytes, filename: str) -> PDFDocument:
        doc = ingest_pdf(file_bytes, filename, source="upload")
        return self._to_document(doc)

    def get_all_documents(self) -> List[PDFDocument]:
        out = []
        for d in db.list_documents():
            chunks = db.get_chunks([d["id"]])
            item = dict(d)
            item["chunk_count"] = len(chunks)
            out.append(self._to_document(item))
        return out

    def get_document(self, doc_id: str) -> Optional[PDFDocument]:
        d = db.get_document(doc_id)
        if not d:
            return None
        item = dict(d)
        item["chunk_count"] = len(db.get_chunks([doc_id]))
        return self._to_document(item)

    def delete_document(self, doc_id: str) -> bool:
        return db.delete_document(doc_id)

    def query_agentic_rag(
        self, query: str, active_doc_ids: Optional[List[str]] = None
    ) -> AgenticRAGResponse:
        """Grounded answer over an explicit document set.

        This is the *basic RAG* path (one retrieve, one generate). The multi-step
        agentic loop lives behind `services.agent.run_agentic`; this endpoint is
        kept because the Chat-with-PDF page calls it directly.
        """
        t0 = time.perf_counter()
        scope = active_doc_ids or [d["id"] for d in db.list_documents()]
        chunks = db.get_chunks(scope)
        hits = retrieval.retrieve(query, chunks, top_k=config.RETRIEVAL_TOP_K)
        activity: List[Dict[str, Any]] = [
            {
                "seq": 1, "kind": "plan", "name": "Single-shot retrieval",
                "detail": f"Searching {len(scope)} document(s) for this query.",
                "status": "done", "data": {}, "latency_ms": None,
            }
        ]
        if not hits:
            return AgenticRAGResponse(
                query=query,
                answer=(
                    "Insufficient evidence: no passage in the selected documents "
                    "matches this query."
                ),
                activity=activity + [{
                    "seq": 2, "kind": "limit", "name": "Retrieval",
                    "detail": "No passages matched; declining to answer.",
                    "status": "blocked", "data": {}, "latency_ms": None,
                }],
                insufficient_evidence=True,
                latency_ms=int((time.perf_counter() - t0) * 1000),
            )

        # Reuse the shared marker assignment so citations are stable.
        from services.agent.tools import _assign_markers

        _assign_markers(hits)
        llm = build_llm()
        blocks = []
        for c in hits:
            title = c.get("doc_title") or c.get("doc_filename")
            blocks.append(
                f"[EVIDENCE {c['marker']}] Source: {title} | Page {c.get('page')} | "
                f"Section: {c.get('section')}\n{c.get('text', '')}"
            )
        prompt = (
            "=== RETRIEVED EVIDENCE ===\n\n" + "\n\n---\n\n".join(blocks)
            + f"\n\n=== USER QUESTION ===\n{query}\n\n=== GROUNDED ANSWER ==="
        )
        result = llm.generate(prompt, system=SYNTHESIS_SYSTEM)

        refl = reflection.verify(result.text, hits, approved_doc_ids=scope, correct=False)
        activity.append({
            "seq": len(activity) + 1, "kind": "tool", "name": "search_papers",
            "detail": f"Retrieved {len(hits)} passage(s)", "status": "done",
            "data": {"hits": len(hits)},
            "latency_ms": int((time.perf_counter() - t0) * 1000),
        })
        activity.append({
            "seq": len(activity) + 1, "kind": "decision", "name": "Verification",
            "detail": (
                f"{sum(1 for c in refl.checks if c.ok)}/{len(refl.checks)} claim(s) "
                f"supported (rate {refl.support_rate:.2f})"
            ),
            "status": "done", "data": {"verified": refl.verified}, "latency_ms": None,
        })
        return AgenticRAGResponse(
            query=query,
            answer=result.text,
            sources=[Citation(**c) for c in refl.citations],
            documents_used=sorted({c.get("doc_id") for c in refl.citations if c.get("doc_id")}),
            activity=activity,
            verified=refl.verified,
            support_rate=refl.support_rate,
            insufficient_evidence=not refl.citations,
            latency_ms=int((time.perf_counter() - t0) * 1000),
        )

    @staticmethod
    def _to_document(d: Dict[str, Any]) -> PDFDocument:
        return PDFDocument(
            id=d["id"], filename=d.get("filename", ""), title=d.get("title", ""),
            authors=d.get("authors", "Unavailable"), year=d.get("year"),
            page_count=int(d.get("page_count", 0)),
            chunk_count=int(d.get("chunk_count", 0)),
            text_chars=int(d.get("text_chars", 0)), sha256=d.get("sha256"),
            source=d.get("source", "upload"), abstract=d.get("abstract", ""),
        )


pdf_rag_service = PDFRAGService()
