from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from services.pdf_rag_service import pdf_rag_service, PDFDocument, AgenticRAGResponse

router = APIRouter(prefix="/pdf", tags=["Chat With PDF"])


class QueryRequest(BaseModel):
    query: str
    active_doc_ids: Optional[List[str]] = None


@router.get("/documents", response_model=List[PDFDocument])
def get_all_documents():
    """Returns list of currently indexed PDF documents in this session"""
    return pdf_rag_service.get_all_documents()


@router.get("/documents/{doc_id}", response_model=PDFDocument)
def get_document(doc_id: str):
    doc = pdf_rag_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/upload", response_model=PDFDocument)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF. Extracts real text via PyMuPDF, chunks it, and indexes it.
    Returns 400 for non-PDF files.
    Returns 422 if text extraction fails (e.g. scanned/image-only PDF).
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported (.pdf extension required)")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")

    try:
        doc = pdf_rag_service.process_uploaded_pdf(contents, file.filename)
        return doc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/query", response_model=AgenticRAGResponse)
def query_pdf_rag(req: QueryRequest):
    """
    Multi-step Agentic RAG over the uploaded PDF session.
    Retrieval is strictly isolated to active_doc_ids.
    """
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return pdf_rag_service.query_agentic_rag(req.query, req.active_doc_ids)


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    """Removes a document from the active session"""
    success = pdf_rag_service.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "success", "message": f"Document {doc_id} removed from session"}
