from typing import List, Dict
from fastapi import APIRouter, HTTPException, Response
from models.schemas import EvidenceMatrixRow, UpdateEvidenceStatusRequest, ReportCitation
from services.research_service import research_service

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])

@router.get("/matrix", response_model=List[EvidenceMatrixRow])
def get_evidence_matrix():
    return research_service.get_evidence_matrix()

@router.patch("/matrix/{row_id}/status", response_model=EvidenceMatrixRow)
def update_matrix_row_status(row_id: str, payload: UpdateEvidenceStatusRequest):
    row = research_service.update_evidence_status(row_id, payload.status)
    if not row:
        raise HTTPException(status_code=404, detail="Evidence row not found")
    return row

@router.get("/citations", response_model=Dict[str, ReportCitation])
def get_citations():
    return research_service.get_report_citations()

@router.get("/export/bibtex")
def export_bibtex():
    bibtex_content = research_service.generate_bibtex()
    return Response(
        content=bibtex_content,
        media_type="application/x-bibtex",
        headers={"Content-Disposition": "attachment; filename=references.bib"}
    )

@router.get("/export/csv")
def export_matrix_csv():
    csv_content = research_service.export_matrix_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=evidence_matrix.csv"}
    )
