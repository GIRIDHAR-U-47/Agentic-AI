"""Fresh-topic discovery endpoint: search arXiv, refine, cache."""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import discovery

router = APIRouter(prefix="/api/discover", tags=["Discovery"])


class DiscoverIn(BaseModel):
    question: str
    top_k: int = 12


class PlanIn(BaseModel):
    topic: str


class IngestCandidateIn(BaseModel):
    candidate: Dict[str, Any]


@router.post("")
def discover(payload: DiscoverIn) -> Dict[str, Any]:
    try:
        return discovery.discover(payload.question, top_k=max(1, min(payload.top_k, 25)))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Academic search failed: {exc}")


@router.post("/plan")
def plan_search(payload: PlanIn) -> Dict[str, Any]:
    try:
        from services.search_planner import plan_research_search
        plan = plan_research_search(payload.topic)
        return plan.model_dump()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Search planning failed: {exc}")


@router.post("/ingest-candidate")
def ingest_candidate_route(payload: IngestCandidateIn) -> Dict[str, Any]:
    try:
        res = discovery.ingest_candidate(payload.candidate)
        # Also sync to vectorstore if available
        try:
            from services.vectorstore import ChromaVectorStore
            vec = ChromaVectorStore()
            if vec.available and res.get("id"):
                vec.upsert_paper(res["id"])
        except Exception:
            pass
        return res
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Paper ingestion failed: {exc}")


@router.get("/cache")
def cache() -> Dict[str, Any]:
    return {"searches": discovery.list_cached_discoveries()}