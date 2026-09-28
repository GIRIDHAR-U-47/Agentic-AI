"""Evidence + citation export endpoints.

These now require an optional `session_id`, because the evidence matrix is
derived from the citations a *specific* review actually verified. Without a
session the matrix is empty rather than populated with the six static mock rows
the original returned.
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel

from services.research_service import research_service

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])


class StatusUpdate(BaseModel):
    status: str
    session_id: str


@router.get("/matrix")
def get_evidence_matrix(
    session_id: Optional[str] = Query(None, description="Review session to scope to"),
) -> List[Dict[str, Any]]:
    return [r.model_dump() for r in research_service.get_evidence_matrix(session_id)]


@router.patch("/matrix/{row_id}/status")
def update_matrix_row_status(row_id: str, payload: StatusUpdate) -> Dict[str, Any]:
    row = research_service.update_evidence_status(row_id, payload.status, payload.session_id)
    if not row:
        raise HTTPException(
            status_code=404,
            detail="Evidence row not found for this session, or no session_id given.",
        )
    return row.model_dump()


@router.get("/citations")
def get_citations(
    session_id: Optional[str] = Query(None),
) -> Dict[str, Any]:
    return research_service.get_report_citations(session_id)


@router.get("/export/bibtex")
def export_bibtex(session_id: Optional[str] = Query(None)) -> Response:
    """BibTeX from real document metadata. No invented DOIs or entries."""
    return Response(
        content=research_service.generate_bibtex(session_id),
        media_type="application/x-bibtex",
        headers={"Content-Disposition": "attachment; filename=references.bib"},
    )


@router.get("/export/csv")
def export_matrix_csv(session_id: Optional[str] = Query(None)) -> Response:
    return Response(
        content=research_service.export_matrix_csv(session_id),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=evidence_matrix.csv"},
    )
