"""Corpus endpoints: what is in the collection, and how to add to it.

The legacy `/pdf/*` routes (used by the Chat-with-PDF page) are still registered
alongside these; this router is the one the review workflow depends on because it
exposes author/venue/DOI metadata and the derived abstract that `/pdf/documents`
omits.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

import db
from services import arxiv, ingest
from services.retrieval import rank_papers

router = APIRouter(prefix="/api/corpus", tags=["Corpus"])


class DocumentOut(BaseModel):
    id: str
    title: str
    authors: str
    year: Optional[str] = None
    venue: str = ""
    doi: str = ""
    arxiv_id: Optional[str] = None
    page_count: int = 0
    source: str = "upload"
    abstract: str = ""
    text_chars: int = 0
    chunk_count: int = 0
    # Evidence-quality transparency: where the paper's text came from, and
    # whether the collection holds the full text (0 => abstract only).
    source_url: str = ""
    full_text_available: int = 1


class ArxivLookupIn(BaseModel):
    arxiv_id: str


@router.get("")
def list_corpus(source: Optional[str] = None) -> Dict[str, Any]:
    docs = db.list_documents(source=source)
    # One grouped query rather than a per-document lookup.
    with db.cursor() as cur:
        rows = cur.execute(
            "SELECT doc_id, COUNT(*) c FROM chunks GROUP BY doc_id"
        ).fetchall()
    chunk_counts = {r["doc_id"]: r["c"] for r in rows}
    out = []
    for d in docs:
        item = {k: d.get(k) for k in DocumentOut.model_fields}
        item["chunk_count"] = chunk_counts.get(d["id"], 0)
        out.append(item)
    return {"documents": out, "stats": db.corpus_stats()}


@router.get("/stats")
def corpus_stats() -> Dict[str, Any]:
    stats = db.corpus_stats()
    stats["providers"] = __import__("config").llm_status()
    return stats


@router.get("/suggest")
def suggest(q: str, top_k: int = 8) -> Dict[str, Any]:
    """Rank the corpus for a question. Used to populate the approval panel."""
    if not q.strip():
        raise HTTPException(status_code=400, detail="q is required")
    docs = db.list_documents()
    ranked = [d for d in rank_papers(q, docs, top_k=top_k) if d.get("_score", 0) > 0]
    return {
        "query": q,
        "candidates": [
            {
                "doc_id": d["id"],
                "title": d.get("title"),
                "authors": d.get("authors"),
                "year": d.get("year"),
                "venue": d.get("venue"),
                "arxiv_id": d.get("arxiv_id"),
                "abstract": (d.get("abstract") or "")[:600],
                "relevance": round(float(d.get("_score", 0)), 4),
            }
            for d in ranked
        ],
    }


@router.get("/{doc_id}")
def get_doc(doc_id: str) -> Dict[str, Any]:
    doc = db.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    chunks = db.get_chunks([doc_id])
    doc["chunk_count"] = len(chunks)
    doc["sections"] = sorted({c["section"] for c in chunks})
    return doc


@router.delete("/{doc_id}")
def remove_doc(doc_id: str) -> Dict[str, str]:
    if not db.get_document(doc_id):
        raise HTTPException(status_code=404, detail="Document not found")
    # Deleting a paper from the corpus also removes its vectors (the only path
    # that ever erases them -- revisions/feedback never touch the collection).
    from services import vectorstore

    store = vectorstore.build_vector_store()
    if store is not None:
        try:
            store.delete_paper(doc_id)
        except Exception:  # pragma: no cover - never block a corpus delete
            pass
    db.delete_document(doc_id)
    return {"status": "deleted", "doc_id": doc_id}


@router.post("/upload")
async def upload(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Ingest an uploaded PDF. Fails loudly on scans rather than indexing blanks."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only .pdf files are supported")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    try:
        doc = ingest.ingest_pdf(contents, file.filename, source="upload")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return {
        "status": "ok",
        "duplicate": bool(doc.get("duplicate")),
        "document": {
            "id": doc["id"], "title": doc["title"], "authors": doc["authors"],
            "year": doc["year"], "page_count": doc["page_count"],
            "chunk_count": doc["chunk_count"], "sha256": doc["sha256"],
            "duplicate": bool(doc.get("duplicate")),
        },
    }


@router.post("/arxiv/lookup")
def arxiv_lookup(payload: ArxivLookupIn) -> Dict[str, Any]:
    aid = payload.arxiv_id.strip().replace("arXiv:", "").replace("arxiv:", "")
    if not aid:
        raise HTTPException(status_code=400, detail="arxiv_id is required")
    try:
        meta = arxiv.lookup(aid)
    except arxiv.ArxivError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    if not meta:
        raise HTTPException(status_code=404, detail=f"No arXiv paper found for {aid!r}")
    return meta
