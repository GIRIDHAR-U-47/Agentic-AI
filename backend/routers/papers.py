from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from models.schemas import Paper, UpdateValidationRequest
from services.paper_service import paper_service

router = APIRouter(prefix="/api/papers", tags=["Papers"])

@router.get("", response_model=List[Paper])
def list_papers(
    search: Optional[str] = Query(None, description="Search query across title, author, abstract, tags"),
    methods: Optional[List[str]] = Query(None, description="Filter by method category or tag"),
    min_relevance: Optional[int] = Query(None, ge=0, le=100, description="Minimum relevance score"),
    year_min: Optional[int] = Query(None, description="Start year"),
    year_max: Optional[int] = Query(None, description="End year"),
    sort_by: Optional[str] = Query(None, description="Sort order (relevance, citations, year, evidenceDensity)")
):
    return paper_service.get_papers(
        search_query=search,
        methods=methods,
        min_relevance=min_relevance,
        year_min=year_min,
        year_max=year_max,
        sort_by=sort_by
    )

@router.get("/{paper_id}", response_model=Paper)
def get_paper(paper_id: str):
    paper = paper_service.get_paper_by_id(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper

@router.patch("/{paper_id}/validation", response_model=Paper)
def update_validation(paper_id: str, payload: UpdateValidationRequest):
    updated = paper_service.update_paper_validation(paper_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Paper not found")
    return updated
