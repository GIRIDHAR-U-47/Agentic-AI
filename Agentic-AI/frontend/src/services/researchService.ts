import { CorpusDocument, EvidenceMatrixRow } from '../types';
import { MOCK_EVIDENCE_ROWS } from '../data/mockResearchData';

const API_BASE = 'http://localhost:8000';

/**
 * The evidence matrix kept in the mock dataset is display scaffolding for the
 * older demo pages (EvidenceValidation / workspace table), not verified data.
 * BibTeX and CSV exports are NEVER built from it: they are built from the real
 * corpus endpoint (`/api/corpus`), which carries the metadata the ingest
 * pipeline extracted from the actual PDFs — including only the DOIs the PDFs
 * print. Fields the corpus does not know are omitted, never guessed.
 */
async function fetchCorpusDocs(): Promise<CorpusDocument[]> {
  try {
    const res = await fetch(`${API_BASE}/api/corpus`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data.documents) ? data.documents : [];
    }
  } catch {
    /* backend offline */
  }
  return [];
}

function bibKey(d: CorpusDocument): string {
  const stem = (d.title || 'untitled')
    .split(/\s+/)
    .slice(0, 3)
    .join('')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
  return `rlens_${stem}${d.year || ''}`;
}

class ResearchService {
  private evidenceRows: EvidenceMatrixRow[] = [...MOCK_EVIDENCE_ROWS];

  getEvidenceMatrix(): EvidenceMatrixRow[] {
    return [...this.evidenceRows];
  }

  updateEvidenceStatus(rowId: string, status: EvidenceMatrixRow['status']): void {
    const row = this.evidenceRows.find((r) => r.id === rowId);
    if (row) {
      row.status = status;
    }
  }

  /** BibTeX entries built from real corpus metadata only. */
  async generateBibTeX(): Promise<string> {
    const docs = (await fetchCorpusDocs()).filter((d) => (d.title || '').trim());
    if (docs.length === 0) return '';
    return docs
      .map((d) => {
        const fields: string[] = [`title={${d.title}}`];
        if (d.authors) fields.push(`author={${d.authors}}`);
        if (d.year) fields.push(`year={${d.year}}`);
        if (d.venue) fields.push(`journal={${d.venue}}`);
        if (d.arxiv_id) fields.push(`note={arXiv:${d.arxiv_id}}`);
        if (d.doi) fields.push(`doi={${d.doi}}`);
        return `@misc{${bibKey(d)},\n  ${fields.join(',\n  ')}\n}`;
      })
      .join('\n\n');
  }

  /** CSV built from real corpus metadata only (no invented metrics). */
  async exportMatrixCsv(): Promise<string> {
    const docs = await fetchCorpusDocs();
    const headers = ['Key (Source)', 'Title', 'Venue', 'Year', 'arXiv', 'DOI', 'Pages', 'Chunks'];
    const rows = docs.map((d) =>
      [
        `${d.id}`,
        `"${(d.title || '').replace(/"/g, '""')}"`,
        `"${(d.venue || '').replace(/"/g, '""')}"`,
        d.year || '',
        d.arxiv_id || '',
        d.doi || '',
        d.page_count ?? '',
        d.chunk_count ?? '',
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}

export const researchService = new ResearchService();