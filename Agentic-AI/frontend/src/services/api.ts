/**
 * Typed client for the review-workflow backend (`backend/routers/sessions.py`
 * and `backend/routers/corpus.py`). Every method either returns real backend
 * data or throws; there are no mock fallbacks here, because the point of the
 * Research Pilot is that what the UI shows is what the backend verified.
 */
import {
  ApprovalDecision,
  CandidatePaper,
  CorpusDocument,
  CorpusStats,
  CreateSessionResponse,
  HealthInfo,
  ReviewMode,
  RunResponse,
  SessionListItem,
  SessionView,
} from '../types';

const API_BASE = 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error(
      'Cannot reach the R-Lens backend. Start it with start.bat (it must run on http://localhost:8000).'
    );
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body && body.detail) detail = String(body.detail);
    } catch {
      /* keep status text */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthInfo>('/api/health'),

  corpus: {
    list: () => request<{ documents: CorpusDocument[]; stats: CorpusStats }>('/api/corpus'),
    suggest: (q: string, topK = 8) =>
      request<{ query: string; candidates: CandidatePaper[] }>(
        `/api/corpus/suggest?q=${encodeURIComponent(q)}&top_k=${topK}`
      ),
  },

  discover: {
    /** Search arXiv for a fresh topic (returns candidates with abs/pdf links). */
    search: (question: string, topK = 8) =>
      request<{
        question: string;
        candidates: CandidatePaper[];
        refined: boolean;
        search_events: { pass?: number; query?: string; note?: string; error?: string }[];
        skipped_known: number;
        cached: boolean;
        error?: string;
      }>('/api/discover', {
        method: 'POST',
        body: JSON.stringify({ question, top_k: topK }),
      }),
    cache: () =>
      request<{ searches: { question: string; refined: boolean; searched_at: string }[] }>(
        '/api/discover/cache'
      ),
  },

  collection: {
    health: () =>
      request<{
        enabled: boolean;
        backend: string;
        embedding_real: boolean;
        reason?: string;
        documents?: number;
      }>('/api/collection'),
    syncAll: () => request<{ papers: number; synced: number }>('/api/collection/sync', { method: 'POST' }),
    syncPaper: (docId: string) =>
      request<{ doc_id: string; synced: number }>(`/api/collection/${encodeURIComponent(docId)}/sync`, {
        method: 'POST',
      }),
    deletePaper: (docId: string) =>
      request<{ status: string; doc_id: string; vectors_removed: string }>(
        `/api/collection/${encodeURIComponent(docId)}`,
        { method: 'DELETE' }
      ),
  },

  sessions: {
    list: () => request<{ sessions: SessionListItem[] }>('/api/sessions?limit=50'),

    create: (question: string, mode: ReviewMode = 'agentic_rag', discover = false) =>
      request<CreateSessionResponse>('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ question, mode, discover }),
      }),

    get: (id: string) => request<SessionView>(`/api/sessions/${id}`),

    approve: (id: string, decisions: ApprovalDecision[]) =>
      request<{
        session_id: string;
        approved: string[];
        rejected: string[];
        decisions: { doc_id: string; decision: string; note?: string }[];
        ingested: { doc_id: string; full_text_available?: number; abstract_only?: boolean; duplicate?: boolean }[];
      }>(`/api/sessions/${id}/approval`, {
        method: 'POST',
        body: JSON.stringify({ decisions }),
      }),

    run: (id: string) =>
      request<RunResponse>(`/api/sessions/${id}/run`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),

    reply: (id: string, reply: string) =>
      request<RunResponse>(`/api/sessions/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply }),
      }),

    /** Researcher feedback on a completed review -> revised draft (HITL round 2). */
    feedback: (id: string, feedback: string, excludeDocIds: string[] = []) =>
      request<RunResponse & { revision?: boolean }>(`/api/sessions/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback, exclude_doc_ids: excludeDocIds }),
      }),

    markdown: (id: string) =>
      request<{ markdown: string }>(`/api/sessions/${id}/markdown`),
  },
};

export const MODE_DESCRIPTIONS: Record<ReviewMode, string> = {
  no_rag: 'No retrieval. The agent answers from the prompt only — expected to be weakest; kept as the baseline.',
  basic_rag: 'Single-shot retrieval: top passages are pulled once and quoted. Fast, but cannot iterate or refuse.',
  agentic_rag: 'Agent loop with search / read / verify tools, bounded budgets, and a source-backing check on every claim.',
};