"""Vector collection management.

Vectors are upserted when a paper is ingested/synced and are **never** removed
by feedback or a review revision. The only way to delete vectors is to
explicitly delete the paper from the collection here (which also removes the
document and its chunks -- the corpus router does the same via this module).
"""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException

import db
import config
from services import vectorstore

router = APIRouter(prefix="/api/collection", tags=["Vector Collection"])


@router.get("")
def collection_health() -> Dict[str, Any]:
    store = vectorstore.build_vector_store()
    if store is None:
        return {
            "enabled": False,
            "backend": config.VECTOR_BACKEND or "off",
            "embedding_real": False,
            "reason": "vector backend is off (set RLENS_VECTOR_BACKEND=chroma)",
        }
    return {
        "enabled": True,
        **store.health(),
        "documents": db.corpus_stats().get("documents", 0),
    }


@router.post("/sync")
def sync_all() -> Dict[str, Any]:
    try:
        return vectorstore.sync_all()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Vector sync failed: {exc}")


@router.post("/{doc_id}/sync")
def sync_paper(doc_id: str) -> Dict[str, Any]:
    if not db.get_document(doc_id):
        raise HTTPException(status_code=404, detail=f"Unknown document {doc_id!r}")
    try:
        return vectorstore.sync_paper_vectors(doc_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Vector sync failed: {exc}")


@router.delete("/{doc_id}")
def delete_paper(doc_id: str) -> Dict[str, str]:
    """Explicitly delete a paper from the collection: vectors + document."""
    if not db.get_document(doc_id):
        raise HTTPException(status_code=404, detail=f"Unknown document {doc_id!r}")
    store = vectorstore.build_vector_store()
    removed_vectors = 0
    if store is not None:
        try:
            removed_vectors = int(store.delete_paper(doc_id) or 0)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Vector delete failed: {exc}")
    db.delete_document(doc_id)
    return {
        "status": "deleted",
        "doc_id": doc_id,
        "vectors_removed": str(removed_vectors),
    }