import { PDFDocumentModel, PDFRAGResult } from '../types';

const API_BASE = 'http://localhost:8000';

class PDFService {
  private localDocs: Map<string, PDFDocumentModel> = new Map();

  async getDocuments(): Promise<PDFDocumentModel[]> {
    try {
      const res = await fetch(`${API_BASE}/pdf/documents`);
      if (res.ok) {
        const data: PDFDocumentModel[] = await res.json();
        this.localDocs.clear();
        data.forEach(d => this.localDocs.set(d.id, d));
        return data;
      }
    } catch {
      // Backend offline
    }
    return Array.from(this.localDocs.values());
  }

  /**
   * Upload a PDF to the backend for real text extraction and indexing.
   * Throws an Error with a human-readable message on failure (HTTP 4xx/5xx or network error).
   * No client-side fallback — real extraction must happen on the backend.
   */
  async uploadPDF(file: File): Promise<PDFDocumentModel> {
    const formData = new FormData();
    formData.append('file', file);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/pdf/upload`, {
        method: 'POST',
        body: formData,
      });
    } catch {
      throw new Error(
        'Cannot reach the R-Lens backend. Make sure the backend server is running on port 8000.'
      );
    }

    if (res.ok) {
      const doc: PDFDocumentModel = await res.json();
      // Use doc.id as the canonical key to prevent duplicate registration
      this.localDocs.set(doc.id, doc);
      return doc;
    }

    // Surface real backend errors to the user
    // 422 = text extraction failure (scanned PDF, etc.)
    // 400 = bad file type / empty file
    let detail = `Upload failed (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch { /* ignore JSON parse errors */ }
    throw new Error(detail);
  }

  async deleteDocument(docId: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/pdf/documents/${docId}`, { method: 'DELETE' });
    } catch {
      // ignore network errors on delete
    }
    return this.localDocs.delete(docId);
  }

  /**
   * Query the Agentic RAG pipeline on the backend.
   * Strictly uses backend retrieval — no client-side fallback with fabricated answers.
   * Throws an Error if the backend is unreachable.
   */
  async queryAgenticRAG(query: string, activeDocIds: string[]): Promise<PDFRAGResult> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/pdf/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, active_doc_ids: activeDocIds }),
      });
    } catch {
      throw new Error(
        'Cannot reach the R-Lens backend. Make sure the backend server is running on port 8000.'
      );
    }

    if (res.ok) {
      return await res.json() as PDFRAGResult;
    }

    let detail = `Query failed (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch { /* ignore */ }
    throw new Error(detail);
  }
}

export const pdfService = new PDFService();
