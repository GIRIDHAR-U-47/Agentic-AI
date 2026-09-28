"""Fresh-topic discovery endpoint: search arXiv, refine, cache."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import discovery

router = APIRouter(prefix="/api/discover", tags=["Discovery"])


class DiscoverIn(BaseModel):
    question: str
    top_k: int = 8


@router.post("")
def discover(payload: DiscoverIn) -> Dict[str, Any]:
    try:
        return discovery.discover(payload.question, top_k=max(1, min(payload.top_k, 25)))
    except Exception as exc:  # network failures surface as an honest 502
        raise HTTPException(status_code=502, detail=f"arXiv search failed: {exc}")


@router.get("/cache")
def cache() -> Dict[str, Any]:
    return {"searches": discovery.list_cached_discoveries()}