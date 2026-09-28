import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  FileDiff,
  FileText,
  GitBranch,
  History,
  Loader2,
  MessageSquareText,
  Play,
  Plus,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { api, MODE_DESCRIPTIONS } from '../services/api';
import { AgentActivityLog } from '../components/AgentActivityLog';
import { SourceApprovalPanel } from '../components/SourceApprovalPanel';
import {
  ActivityEvent,
  HealthInfo,
  Review,
  ReviewCitation,
  ReviewMode,
  Revision,
  SessionListItem,
  SessionView,
} from '../types';

/* ------------------------------------------------------------------ */
/* Tiny markdown renderer for the backend's plain-markdown output.     */
/* Renders only the shapes review_service.render_markdown emits:       */
/* #/## headings, **bold**, - bullets and | tables. No innerHTML.      */
/* ------------------------------------------------------------------ */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-on-surface">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{p}</span>
    )
  );
}

function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  let bulletKey = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const body = line.replace(/^#+\s*/, '');
      out.push(
        level === 1 ? (
          <h2 key={`h${i}`} className="font-title-md text-title-md font-bold text-on-surface mt-4 mb-1">
            {inline(body, `h${i}`)}
          </h2>
        ) : (
          <h3 key={`h${i}`} className="font-title-sm text-title-sm font-bold text-primary mt-4 mb-1">
            {inline(body, `h${i}`)}
          </h3>
        )
      );
      i += 1;
      continue;
    }
    if (line.startsWith('|') && i + 1 < lines.length && /^\|[\s\-|]+$/.test(lines[i + 1])) {
      const rows: string[][] = [];
      while (i < lines.length && line.startsWith('|')) {
        const cells = lines[i]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        if (!/^-+$/.test(cells[0] || '')) rows.push(cells);
        i += 1;
      }
      const [head, ...body] = rows;
      if (head) {
        out.push(
          <div key={`t${i}`} className="overflow-x-auto my-2">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr>
                  {head.map((c, j) => (
                    <th key={j} className="text-left font-semibold text-on-surface px-2 py-1 border-b border-outline-variant/40">
                      {inline(c, `th${i}-${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (
                      <td key={k} className="px-2 py-1 border-b border-outline-variant/20 text-on-surface-variant align-top">
                        {inline(c, `td${i}-${j}-${k}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    if (/^[-*•]\s+/.test(line)) {
      const body = line.replace(/^[-*•]\s+/, '');
      out.push(
        <p key={`b${i}-${bulletKey++}`} className="font-body-sm text-body-sm text-on-surface-variant pl-4 -indent-4 leading-relaxed my-1">
          <span className="text-primary mr-1">•</span>
          {inline(body, `b${i}`)}
        </p>
      );
      i += 1;
      continue;
    }
    out.push(
      <p key={`p${i}`} className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed my-1.5 text-justify">
        {inline(line, `p${i}`)}
      </p>
    );
    i += 1;
  }
  return <div className="text-body-sm">{out}</div>;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export const LiteratureReview: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('session');

  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [session, setSession] = useState<SessionView | null>(null);
  const [corpusTitleById, setCorpusTitleById] = useState<Record<string, string>>({});

  const [question, setQuestion] = useState(
    'How does channel independence work in PatchTST, and what does it buy compared with attention-based baselines?'
  );
  const [mode, setMode] = useState<ReviewMode>('agentic_rag');
  const [discover, setDiscover] = useState(false);
  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [running, setRunning] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [excludeDocs, setExcludeDocs] = useState<string[]>([]);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [draftIndex, setDraftIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const review = session?.review ?? null;

  // Draft history: the latest review is shown first, older drafts after it.
  // Draft 0 is the original review; every completed revision adds a draft.
  const drafts = useMemo<{ review: Review; label: string; feedback?: string }[]>(() => {
    const revs = session?.revisions ?? [];
    const out: { review: Review; label: string; feedback?: string }[] = [];
    for (let i = revs.length - 1; i >= 0; i--) {
      const r = revs[i];
      if (r.review) out.push({ review: r.review, label: `Revised draft ${i + 2}`, feedback: r.feedback });
    }
    const original = revs.length > 0 ? revs[0]?.prior_review : null;
    if (original) out.push({ review: original, label: 'Draft 1 (original)' });
    if (out.length === 0 && review) out.push({ review, label: 'Draft 1' });
    return out;
  }, [session, review]);

  const displayReview = drafts[draftIndex]?.review ?? review;

  // The "cited passages" list on this page is the *current* verified set; for
  // older drafts we fall back to the sources embedded in that draft's review.
  const displayCitations = useMemo(() => {
    if (draftIndex === 0) return session?.citations ?? [];
    if (!displayReview) return [];
    return (displayReview.sources as ReviewCitation[]) ?? [];
  }, [draftIndex, displayReview, session]);

  useEffect(() => {
    // Every session switch starts from the latest draft + clean feedback state.
    setDraftIndex(0);
    setFeedbackText('');
    setExcludeDocs([]);
  }, [activeId]);

  const loadSessions = useCallback(async () => {
    try {
      const r = await api.sessions.list();
      setSessions(r.sessions);
    } catch {
      /* keep the previous list */
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    try {
      const view = await api.sessions.get(id);
      // GET /sessions/{id} does not carry candidates; the approval panel needs
      // them, so re-suggest whenever the session has not been approved yet.
      if (!view.candidates && (view.state === 'created' || view.state === 'awaiting_approval')) {
        try {
          const sugg = await api.corpus.suggest(view.question);
          view.candidates = sugg.candidates;
        } catch {
          view.candidates = [];
        }
      }
      setSession(view);
      return view;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, []);

  useEffect(() => {
    api.health().then(
      (h) => {
        setHealth(h);
        setBackendUp(true);
      },
      () => setBackendUp(false)
    );
    api.corpus
      .list()
      .then((r) => {
        const m: Record<string, string> = {};
        for (const d of r.documents) m[d.id] = d.title;
        setCorpusTitleById(m);
      })
      .catch(() => undefined);
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (activeId) void loadSession(activeId);
    else setSession(null);
  }, [activeId, loadSession]);

  const create = async () => {
    if (!question.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const r = await api.sessions.create(question.trim(), mode, discover);
      setSearchParams({ session: r.session_id });
      setSession({
        ...r,
        title: r.question,
        approved: [],
        rejected: [],
        decisions: [],
        citations: [],
        can_run: false,
        can_resume: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      showToast(
        discover
          ? 'Session created — approve the arXiv sources it may cite.'
          : 'Session created — approve the sources it may cite.'
      );
      void loadSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const saveApprovals = async (decisions: { doc_id: string; decision: 'approved' | 'rejected' }[]) => {
    if (!session) return;
    setApproving(true);
    setError(null);
    try {
      const resp = await api.sessions.approve(session.session_id, decisions);
      const view = await api.sessions.get(session.session_id);
      setSession(view);
      const ingested = resp.ingested || [];
      const abstractOnly = ingested.filter(
        (r) => r.abstract_only || r.full_text_available === 0
      );
      const duplicates = ingested.filter((r) => r.duplicate);
      const notes: string[] = [];
      if (abstractOnly.length > 0) {
        notes.push(
          `${abstractOnly.length} had no full text — stored as abstract-only (clearly labelled).`
        );
      }
      if (duplicates.length > 0) {
        notes.push(
          `${duplicates.length} matched a paper already in the corpus — skipped as a duplicate.`
        );
      }
      if (view.can_run) {
        const base = `${view.approved.length} paper(s) approved — ready to run the review.`;
        showToast(notes.length ? `${base} ${notes.join(' ')}` : base);
      } else {
        showToast('No papers approved. The agent cannot retrieve without sources.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setApproving(false);
    }
  };

  const toggleExclude = (id: string) => {
    setExcludeDocs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submitFeedback = async () => {
    if (!session || !feedbackText.trim() || submittingFeedback) return;
    setSubmittingFeedback(true);
    setError(null);
    try {
      const resp = await api.sessions.feedback(session.session_id, feedbackText.trim(), excludeDocs);
      await loadSession(session.session_id);
      setFeedbackText('');
      setExcludeDocs([]);
      showToast(
        resp.revision
          ? `Revised draft ready (feedback applied${excludeDocs.length ? `, ${excludeDocs.length} paper(s) excluded` : ''}).`
          : 'Feedback recorded.'
      );
      void loadSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const run = async () => {
    if (!session || running) return;
    setRunning(true);
    setError(null);
    try {
      const resp = await api.sessions.run(session.session_id);
      // The run response is partial; re-fetch the full resumable view.
      const fresh = await loadSession(session.session_id);
      if (!fresh) return;
      if (fresh.state === 'awaiting_user') {
        showToast('The agent paused — it wants your input before continuing.');
      } else if (resp.insufficient_evidence || (fresh.review && fresh.review.claims_total === 0 && fresh.citations.length === 0)) {
        showToast('The agent reported insufficient evidence rather than guessing.');
      } else {
        showToast(`Review complete — ${fresh.citations.length} source-backed citation(s).`);
      }
      void loadSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  const submitReply = async () => {
    if (!session || !replyText.trim() || replying) return;
    setReplying(true);
    setError(null);
    try {
      await api.sessions.reply(session.session_id, replyText.trim());
      setReplyText('');
      const fresh = await loadSession(session.session_id);
      showToast(
        fresh && fresh.state === 'complete'
          ? `Review complete — ${fresh.citations.length} citation(s).`
          : 'Resumed with your clarification.'
      );
      void loadSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReplying(false);
    }
  };

  const copyMarkdown = async () => {
    if (!session) return;
    try {
      const r = await api.sessions.markdown(session.session_id);
      if (navigator.clipboard) await navigator.clipboard.writeText(r.markdown);
      setCopied(true);
      showToast('Review copied as Markdown.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const phase = useMemo(() => {
    if (!session) return 'idle';
    return session.state;
  }, [session]);

  if (backendUp === false) {
    return (
      <div className="w-full bg-surface-container-lowest min-h-screen text-on-surface flex items-center justify-center p-gutter-desktop">
        <div className="max-w-lg text-center space-y-4">
          <TriangleAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h1 className="font-headline-md text-headline-md font-bold">
            Backend is offline
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            This page only shows verified backend state — there is no mock fallback.
            Start the server with <span className="font-code-sm">start.bat</span>{' '}
            (backend on <span className="font-code-sm">http://localhost:8000</span>) and reload.
          </p>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-tertiary font-title-sm text-title-sm"
            onClick={() => window.location.reload()}
            type="button"
          >
            <RefreshCw className="w-4 h-4" /> Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-container-lowest min-h-screen text-on-surface">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-xl font-body-sm text-body-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-surface-container-lowest px-gutter-desktop py-space-md flex flex-wrap items-center justify-between gap-space-md border-b border-outline-variant/40 shadow-sm sticky top-16 z-30">
        <div className="flex flex-col min-w-0 max-w-2xl">
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md uppercase tracking-wider font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>R-Lens Research Pilot</span>
            <span className="text-outline-variant">•</span>
            <span className="font-code-sm text-code-sm text-outline">v2.5.0</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface truncate font-bold mt-0.5">
            Source-backed review workflow
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            Real papers → retrieval → your approval → verified, cited review. Every number shown here comes from the backend.
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-space-xs">
          {health && (
            <>
              <span className="inline-flex items-center gap-1.5 px-space-sm py-space-2xs rounded border border-outline-variant/30 font-code-sm text-code-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {health.corpus.documents} docs · {health.corpus.chunks} chunks
              </span>
              <span className="inline-flex items-center gap-1.5 px-space-sm py-space-2xs rounded border border-outline-variant/30 font-code-sm text-code-sm text-on-surface-variant">
                max {health.limits.max_agent_iterations} iter · {health.limits.max_tool_calls} tools ·{' '}
                {health.limits.max_query_refinements} refinements
              </span>
              {session && session.state === 'complete' && (
                <button
                  className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container font-title-sm text-title-sm transition-all"
                  onClick={copyMarkdown}
                  type="button"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  Copy Markdown
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {error && (
        <div className="mx-gutter-desktop mt-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 px-4 py-3 flex items-start gap-2 font-body-sm text-body-sm text-rose-800 dark:text-rose-300">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button className="hover:opacity-70 font-semibold" onClick={() => setError(null)} type="button">
            Dismiss
          </button>
        </div>
      )}

      <div className="p-gutter-desktop grid grid-cols-12 gap-space-lg items-start">
        {/* LEFT: sessions + new session */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-space-md">
          {/* New session */}
          <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
            <div className="flex items-center gap-2 pb-space-sm border-b border-outline-variant/30">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                New review
              </span>
            </div>
            <textarea
              className="w-full mt-3 rounded-lg bg-surface-container p-3 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/40 focus:outline-none focus:border-primary resize-none"
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a research question — the approved corpus answers it, or turn on “Discover on arXiv” for any fresh topic…"
            />
            <div className="flex flex-col gap-2 mt-3">
              {(['agentic_rag', 'basic_rag', 'no_rag'] as ReviewMode[]).map((m) => (
                <label
                  key={m}
                  className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    mode === m
                      ? 'border-primary bg-primary-container/40'
                      : 'border-outline-variant/40 hover:border-outline'
                  }`}
                >
                  <input
                    type="radio"
                    name="review-mode"
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="mt-0.5 accent-[var(--primary,#7c3aed)]"
                  />
                  <span className="min-w-0">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface block">
                      {m.replace(/_/g, ' ')}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-[11.5px] leading-snug block">
                      {MODE_DESCRIPTIONS[m]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <label
              className={`mt-3 flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                discover ? 'border-primary bg-primary-container/40' : 'border-outline-variant/40 hover:border-outline'
              }`}
            >
              <input
                type="checkbox"
                checked={discover}
                onChange={(e) => setDiscover(e.target.checked)}
                className="mt-0.5 accent-[var(--primary,#7c3aed)]"
              />
              <span className="min-w-0">
                <span className="font-label-sm text-label-sm font-semibold text-on-surface block">
                  Discover on arXiv (any topic)
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11.5px] leading-snug block">
                  Search arXiv for fresh candidates instead of ranking the fixed
                  corpus. Papers whose full text is unavailable are stored as
                  clearly-labelled abstract-only sources.
                </span>
              </span>
            </label>
            <button
              className="mt-3 w-full inline-flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary hover:bg-tertiary font-title-sm text-title-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={create}
              disabled={creating || !question.trim()}
              type="button"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Start review session
            </button>
          </div>

          {/* Recent sessions */}
          <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
              <span className="inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                <History className="w-4 h-4 text-secondary" /> Sessions
              </span>
              <button
                className="text-primary hover:opacity-80 font-code-sm text-code-sm"
                onClick={() => void loadSessions()}
                type="button"
              >
                refresh
              </button>
            </div>
            {sessions.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant py-3 text-center">
                No sessions yet — start one above.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1 max-h-[420px] overflow-y-auto">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <button
                      className={`w-full text-left px-2 py-1.5 rounded-lg flex flex-col gap-0.5 transition-colors ${
                        s.id === activeId
                          ? 'bg-surface-container text-on-surface'
                          : 'hover:bg-surface-container-low'
                      }`}
                      onClick={() => setSearchParams({ session: s.id })}
                      type="button"
                    >
                      <span className="font-title-sm text-title-sm text-[12.5px] font-semibold truncate">
                        {s.title || s.question}
                      </span>
                      <span className="font-code-sm text-code-sm text-outline flex items-center gap-1.5">
                        <span
                          title={s.state}
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.state === 'complete'
                              ? 'bg-emerald-400'
                              : s.state === 'awaiting_user'
                                ? 'bg-amber-400'
                                : s.state === 'created' || s.state === 'awaiting_approval'
                                  ? 'bg-sky-400'
                                  : 'bg-violet-400 animate-pulse'
                          }`}
                        />
                        {s.state} · {s.mode} · {s.provider}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* CENTER: workflow driver */}
        <main className="col-span-12 lg:col-span-6 flex flex-col gap-space-md">
          {phase === 'idle' && (
            <div className="rounded-xl bg-surface-container-lowest p-space-xl border border-outline-variant/30 shadow-sm text-center">
              <BrainCircuit className="w-12 h-12 text-primary mx-auto" />
              <h2 className="font-title-md text-title-md font-bold mt-4 text-on-surface">
                Run a source-backed literature review
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto mt-2">
                Start a session on the left. The flow is: the corpus is ranked for
                your question → you approve the sources → the agent searches, reads
                and re-verifies every claim → the review is assembled from claims
                that survived with real passages behind them.
              </p>
              <p className="font-code-sm text-code-sm text-outline mt-4">
                state machine: created → awaiting_approval → complete / awaiting_user
              </p>
            </div>
          )}

          {session && session.discovery && (phase === 'created' || phase === 'awaiting_approval') && (
            <div className="rounded-xl bg-surface-container-lowest p-space-md border border-primary/30 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                  arXiv discovery
                </span>
                {session.discovery.refined ? (
                  <span
                    className="ml-auto inline-flex items-center gap-1 font-code-sm text-code-sm text-emerald-500 border border-emerald-300 dark:border-emerald-700 rounded px-1.5 py-0.5"
                    title="The first search did not cover the question's vocabulary, so the agent refined it."
                  >
                    <RefreshCw className="w-3 h-3" /> refined — poor first pass
                  </span>
                ) : (
                  <span className="ml-auto font-code-sm text-code-sm text-outline">single pass</span>
                )}
              </div>
              <ul className="mt-2 flex flex-col gap-1">
                {(session.discovery.search_events || []).map((ev, i) => (
                  <li key={i} className="font-code-sm text-code-sm text-on-surface-variant text-[11px] leading-snug">
                    <span className="text-primary font-semibold">pass {ev.pass}</span>
                    {ev.query ? <span className="text-outline"> · “{ev.query}”</span> : null}
                    {ev.note ? <span className="text-amber-500"> · {ev.note}</span> : null}
                    {ev.error ? <span className="text-rose-400"> · error: {ev.error}</span> : null}
                  </li>
                ))}
                {typeof session.discovery.skipped_known === 'number' &&
                  session.discovery.skipped_known > 0 && (
                    <li className="font-code-sm text-code-sm text-outline text-[11px]">
                      · deduped against the corpus: {session.discovery.skipped_known} known paper(s)
                      skipped
                    </li>
                  )}
                {session.discovery.cached ? (
                  <li className="font-code-sm text-code-sm text-outline text-[11px]">
                    · served from the discovery cache (the network was not hit again)
                  </li>
                ) : null}
              </ul>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-relaxed mt-2 border-t border-outline-variant/20 pt-2">
                Candidates below came from the arXiv search above — not from the
                fixed corpus. Approving a paper fetches its PDF; if the full text
                cannot be fetched it is stored and labelled as{' '}
                <span className="text-amber-500 font-medium">abstract only</span>.
              </p>
            </div>
          )}

          {session && (phase === 'created' || phase === 'awaiting_approval') && (
            <SourceApprovalPanel
              question={session.question}
              candidates={session.candidates || []}
              initialApproved={session.approved}
              initialRejected={session.rejected}
              onSave={saveApprovals}
              saving={approving}
            />
          )}

          {session && session.state === 'awaiting_approval' && session.candidates && session.candidates.length === 0 && (
            <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                No approval decisions recorded. Refresh to re-suggest candidates.
              </p>
              <button
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-tertiary font-title-sm text-title-sm"
                onClick={() => void loadSession(session.session_id)}
                type="button"
              >
                <RefreshCw className="w-4 h-4" /> Suggest candidates
              </button>
            </div>
          )}

          {session && session.can_run && (
            <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-title-sm text-title-sm font-semibold text-on-surface">
                    {session.approved.length} source(s) approved
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                    Runs as {session.mode} on {session.provider}/{session.model}
                  </div>
                </div>
              </div>
              <button
                className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary hover:bg-tertiary font-title-sm text-title-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={run}
                disabled={running}
                type="button"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? 'Running agent…' : 'Run review'}
              </button>
            </div>
          )}

          {session && session.state === 'awaiting_user' && session.pending && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-space-md shadow-sm">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-title-sm text-title-sm font-semibold">
                <ExternalLink className="w-4 h-4" />
                The agent needs your input before it can continue
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                {session.pending.question}
              </p>
              {session.pending.options && session.pending.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {session.pending.options.map((o) => (
                    <button
                      key={o}
                      className="px-3 py-1 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 font-title-sm text-title-sm text-[12.5px] hover:border-primary"
                      onClick={() => {
                        setReplyText(o);
                      }}
                      type="button"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <input
                  className="flex-1 rounded-lg bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Your answer to the agent…"
                />
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-title-sm text-title-sm disabled:opacity-60"
                  onClick={submitReply}
                  disabled={replying || !replyText.trim()}
                  type="button"
                >
                  {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Resume
                </button>
              </div>
            </div>
          )}

          {session && (session.state === 'complete' || session.state === 'planning') && (
            <AgentActivityLog
              events={session.activity as ActivityEvent[]}
              running={session.state === 'planning'}
            />
          )}

          {session && session.state === 'complete' && displayReview && displayReview.unverified && (
            <div className="rounded-xl bg-surface-container-low p-space-md border border-rose-300/50 shadow-sm flex items-start gap-2">
              <TriangleAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                The review is marked <b>INCOMPLETE</b> — some claims could not be
                verified against the retrieved passages (support rate{' '}
                <b>{(displayReview.support_rate * 100).toFixed(0)}%</b>). No
                unverified claim appears in the sections above.
              </p>
            </div>
          )}

          {session && session.state === 'complete' && session.can_revise && (
            <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
              <div className="flex items-center gap-2 pb-space-sm border-b border-outline-variant/30">
                <MessageSquareText className="w-4 h-4 text-primary" />
                <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                  Researcher feedback
                </span>
                <span className="font-code-sm text-code-sm text-outline ml-auto">
                  {(session.revisions ?? []).length} revision(s) so far
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-relaxed mt-2">
                Tell the agent what to change — e.g. <i>“exclude this paper”</i>,{' '}
                <i>“focus on newer studies”</i>, or <i>“compare the datasets”</i>{' '}
                — and optionally tick papers to exclude. The earlier draft stays
                saved; the agent re-retrieves and produces a revised draft.
              </p>
              <textarea
                className="w-full mt-2 rounded-lg bg-surface-container p-3 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/40 focus:outline-none focus:border-primary resize-none"
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Your feedback for the revised draft…"
              />
              {session.approved.length > 0 && (
                <div className="mt-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium text-[11px]">
                    Exclude from this revision (approvals stay intact)
                  </span>
                  <div className="mt-1 flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {session.approved.map((id) => (
                      <label
                        key={id}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md border cursor-pointer text-[12.5px] transition-colors ${
                          excludeDocs.includes(id)
                            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30'
                            : 'border-outline-variant/40 hover:border-outline'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={excludeDocs.includes(id)}
                          onChange={() => toggleExclude(id)}
                          className="accent-[#e11d48]"
                        />
                        <span className="truncate min-w-0 flex-1 font-body-sm text-body-sm text-on-surface-variant">
                          {corpusTitleById[id] || id}
                        </span>
                        {excludeDocs.includes(id) && (
                          <span className="font-code-sm text-code-sm text-rose-400 shrink-0">excluded</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 mt-3">
                <button
                  className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary hover:bg-tertiary font-title-sm text-title-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => void submitFeedback()}
                  disabled={submittingFeedback || !feedbackText.trim()}
                  type="button"
                >
                  {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submittingFeedback ? 'Revising…' : 'Revise with this feedback'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT: review document */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-space-md">
          {session && session.state === 'complete' && displayReview ? (
            <>
              {drafts.length > 1 && (
                <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 pb-space-sm border-b border-outline-variant/30">
                    <GitBranch className="w-4 h-4 text-secondary" />
                    <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                      Drafts
                    </span>
                    <span className="font-code-sm text-code-sm text-outline ml-auto">
                      {drafts.length} total
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1">
                    {drafts.map((d, i) => (
                      <button
                        key={i}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex flex-col gap-0.5 transition-colors border ${
                          i === draftIndex
                            ? 'bg-surface-container text-on-surface border-primary/50'
                            : 'border-transparent hover:bg-surface-container-low'
                        }`}
                        onClick={() => setDraftIndex(i)}
                        type="button"
                      >
                        <span className="font-title-sm text-title-sm text-[12.5px] font-semibold flex items-center gap-1.5">
                          <FileDiff className="w-3.5 h-3.5 text-primary shrink-0" />
                          {d.label}
                          {i === 0 && (
                            <span className="font-code-sm text-code-sm text-emerald-500 ml-auto">current</span>
                          )}
                        </span>
                        {d.feedback && (
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-snug line-clamp-2">
                            feedback: “{d.feedback}”
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics strip */}
              <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-lg p-3">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Support rate</span>
                  <div className="font-headline-md text-headline-md font-bold text-on-surface mt-0.5">
                    {(displayReview.support_rate * 100).toFixed(0)}%
                  </div>
                  <span className="font-code-sm text-code-sm text-outline">per claim, mechanical</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Citations</span>
                  <div className="font-headline-md text-headline-md font-bold text-on-surface mt-0.5">
                    {displayCitations.length}
                  </div>
                  <span className="font-code-sm text-code-sm text-outline">marker + page + quote</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Sources</span>
                  <div className="font-headline-md text-headline-md font-bold text-on-surface mt-0.5">
                    {displayReview.comparison_table.length}
                  </div>
                  <span className="font-code-sm text-code-sm text-outline">approved papers cited</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-3">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Verified</span>
                  <div
                    className={`font-headline-md text-headline-md font-bold mt-0.5 ${
                      displayReview.verified ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {displayReview.verified ? 'Yes' : 'No'}
                  </div>
                  <span className="font-code-sm text-code-sm text-outline">all claims backed</span>
                </div>
              </div>

              {/* The review */}
              <div
                className="rounded-xl bg-surface-container-lowest p-space-lg border border-outline-variant/30 shadow-sm"
                id="review-document"
              >
                <div className="flex items-center gap-2 pb-space-sm border-b border-outline-variant/30">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                    Review
                  </span>
                  <span className="font-code-sm text-code-sm text-outline ml-auto">{session.provider}/{session.model}</span>
                </div>

                <div className="mt-3">
                  <h2 className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-primary mb-1">
                    Direct answer
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface leading-relaxed text-justify">
                    {displayReview.direct_answer}
                  </p>
                </div>

                {displayReview.claims_total > 0 && (
                  <div className="mt-4">
                    <h2 className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-primary mb-1">
                      Key findings ({displayReview.claims_total})
                    </h2>
                    <ul className="flex flex-col gap-1.5">
                      {displayReview.sections.key_findings.map((f, i) => (
                        <li key={i} className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed flex gap-1.5">
                          <span className="text-primary shrink-0">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(['comparison', 'themes', 'limitations', 'gaps'] as const).map((key) =>
                  displayReview.sections[key].filter((s) => !s.startsWith('_Not established')).length > 0 ? (
                    <div key={key} className="mt-4">
                      <h2 className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-primary mb-1">
                        {key.replace(/_/g, ' ')}
                      </h2>
                      <ul className="flex flex-col gap-1.5">
                        {displayReview.sections[key].map((s, i) => (
                          <li key={i} className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed flex gap-1.5">
                            <span className="text-secondary shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </div>

              {/* Citations */}
              <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
                <div className="flex items-center gap-2 pb-space-sm border-b border-outline-variant/30">
                  <BookOpenCheck className="w-4 h-4 text-secondary" />
                  <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                    Cited passages
                  </span>
                </div>
                {displayCitations.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant py-3 text-center">
                    Nothing survived verification — the review is empty by design.
                  </p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-2 max-h-[480px] overflow-y-auto">
                    {displayCitations.map((c: ReviewCitation, i) => {
                      const sourceUrl =
                        c.source_url ||
                        (c.arxiv_id ? `https://arxiv.org/abs/${c.arxiv_id}` : '');
                      return (
                        <li key={`${c.marker}-${i}`} className="rounded-lg bg-surface-container-low p-3">
                          <div className="font-code-sm text-code-sm text-primary font-semibold flex items-center gap-2">
                            [{c.marker}]
                            <span className="text-outline font-normal">{c.locator || `p.${c.page ?? '?'}`}</span>
                            {c.full_text_available === 0 && (
                              <span
                                title="Full text was not available; this citation points at the abstract only."
                                className="font-code-sm text-code-sm text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded px-1"
                              >
                                abstract only
                              </span>
                            )}
                            {c.supported === false && (
                              <span className="text-rose-400 font-code-sm text-code-sm">unsupported</span>
                            )}
                            {sourceUrl && (
                              <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto text-outline hover:text-primary transition-colors shrink-0"
                                title="Open the canonical source"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-relaxed mt-1 italic line-clamp-3">
                            “{c.quote}”
                          </p>
                          <div className="font-code-sm text-code-sm text-outline text-[11px] mt-1 truncate">
                            {corpusTitleById[c.doc_id] || c.doc_title || c.title || c.doc_id}
                            {c.source_url && (
                              <span className="text-outline/70"> · {c.source_url}</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Automated citation-check disclaimer */}
              {displayReview.disclaimer && (
                <div className="rounded-xl bg-surface-container-lowest p-space-md border border-amber-300/50 dark:border-amber-700/50 shadow-sm flex items-start gap-2">
                  <TriangleAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-relaxed">
                    {displayReview.disclaimer}
                  </p>
                </div>
              )}

              {/* Comparison table */}
              {displayReview.comparison_table.length > 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 pb-space-sm border-b border-outline-variant/30">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                      Sources consulted
                    </span>
                  </div>
                  <table className="w-full mt-2 text-[12px]">
                    <thead>
                      <tr className="text-on-surface-variant border-b border-outline-variant/30">
                        <th className="text-left py-1 font-semibold">marker</th>
                        <th className="text-left py-1 font-semibold">paper</th>
                        <th className="text-left py-1 font-semibold">cited</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayReview.comparison_table.map((r) => (
                        <tr key={r.marker} className="border-b border-outline-variant/20">
                          <td className="py-1 font-code-sm text-code-sm text-primary align-top">[{r.marker}]</td>
                          <td className="py-1 text-on-surface-variant align-top">
                            <span className="block truncate" title={r.title}>
                              {r.title}
                            </span>
                            <span className="font-code-sm text-code-sm text-outline">{r.year || ''} {r.venue ? `· ${r.venue}` : ''}</span>
                          </td>
                          <td className="py-1 font-code-sm text-code-sm align-top">
                            {r.cited ? (
                              <span className="text-emerald-500">yes · pp. {r.pages_cited.join(', ')}</span>
                            ) : (
                              <span className="text-outline">approved, uncited</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {displayReview.reflection_notes.length > 0 && (
                <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2 pb-space-sm border-b border-outline-variant/30">
                    <Clipboard className="w-4 h-4 text-amber-500" />
                    <span className="font-label-md text-label-md text-on-surface uppercase font-bold tracking-wider">
                      Reflection notes
                    </span>
                  </div>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {displayReview.reflection_notes.map((n, i) => (
                      <li key={i} className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-relaxed flex gap-1.5">
                        <span className="text-amber-500 shrink-0">•</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm text-center py-10">
              <FileText className="w-10 h-10 text-outline mx-auto" />
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">
                {session ? 'The review appears here once the agent finishes and its claims are verified.' : 'Start a session to see the verified review.'}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};