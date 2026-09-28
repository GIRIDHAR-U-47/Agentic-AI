import React, { useEffect, useState } from 'react';
import { BookOpen, Check, ExternalLink, X, Gauge } from 'lucide-react';
import { CandidatePaper } from '../types';

/**
 * The human-approval gate, front and center. Nothing is retrieved from a paper
 * until the researcher approves it. Candidates carry the relevance score the
 * corpus ranker computed -- or, for arXiv-discovery sessions, canonical arXiv
 * links and an honest "abstract only" badge when no full text is available.
 * Approve/reject feeds `POST /api/sessions/{id}/approval`.
 */
interface Props {
  question: string;
  candidates: CandidatePaper[];
  initialApproved: string[];
  initialRejected: string[];
  onSave: (decisions: { doc_id: string; decision: 'approved' | 'rejected' }[]) => Promise<void>;
  saving?: boolean;
}

export const SourceApprovalPanel: React.FC<Props> = ({
  question,
  candidates,
  initialApproved,
  initialRejected,
  onSave,
  saving = false,
}) => {
  const [approved, setApproved] = useState<Set<string>>(() => new Set(initialApproved));
  const [rejected, setRejected] = useState<Set<string>>(() => new Set(initialRejected));

  useEffect(() => {
    setApproved(new Set(initialApproved));
    setRejected(new Set(initialRejected));
  }, [initialApproved, initialRejected]);

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          The corpus is empty, so there is nothing to approve. Ingest papers
          first (see <span className="font-code-sm">scripts/fetch_corpus.py</span>{' '}
          or the corpus upload endpoint), then re-run this question.
        </p>
      </div>
    );
  }

  const toggle = (id: string) => {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setRejected((r) => {
          const r2 = new Set(r);
          r2.delete(id);
          return r2;
        });
      }
      return next;
    });
  };

  const toggleReject = (id: string) => {
    setRejected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setApproved((a) => {
          const a2 = new Set(a);
          a2.delete(id);
          return a2;
        });
      }
      return next;
    });
  };

  const save = () => {
    const decisions = [...approved, ...rejected].map((id) => ({
      doc_id: id,
      decision: approved.has(id) ? 'approved' as const : 'rejected' as const,
    }));
    void onSave(decisions);
  };

  const anyChosen = approved.size + rejected.size > 0;

  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-space-md pb-space-sm border-b border-outline-variant/30">
        <div className="min-w-0">
          <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-widest">
            Human-in-the-loop approval
          </span>
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">
            Approve the sources the review may retrieve from
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 max-w-2xl">
            “{question}”
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-code-sm text-code-sm text-on-surface-variant">
            {approved.size} approved · {rejected.size} rejected
          </span>
          <button
            className={`inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-lg font-title-sm text-title-sm transition-all ${
              anyChosen && !saving
                ? 'bg-primary-container text-on-primary hover:bg-tertiary'
                : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
            }`}
            onClick={save}
            disabled={!anyChosen || saving}
            type="button"
          >
            {saving ? 'Saving…' : 'Save approvals & continue'}
          </button>
        </div>
      </div>

      <ul className="mt-space-sm flex flex-col divide-y divide-outline-variant/20">
        {candidates.map((c, i) => {
          const isA = approved.has(c.doc_id);
          const isR = rejected.has(c.doc_id);
          return (
            <li key={c.doc_id} className="py-space-sm flex flex-col sm:flex-row gap-space-sm items-start">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-code-sm text-code-sm text-outline">{i + 1}.</span>
                  <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                    {c.title || '(untitled)'}
                  </span>
                  {c.full_text_available === 0 || c.abstract_only ? (
                    <span
                      title="The paper's full text could not be fetched; only its abstract can be cited."
                      className="inline-flex items-center gap-1 font-code-sm text-code-sm text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded px-1.5 py-0.5"
                    >
                      <BookOpen className="w-3 h-3" /> abstract only
                    </span>
                  ) : null}
                  {typeof c.relevance === 'number' && isFinite(c.relevance) && (
                    <span className="inline-flex items-center gap-1 font-code-sm text-code-sm text-primary">
                      <Gauge className="w-3 h-3" /> {c.relevance.toFixed(3)}
                    </span>
                  )}
                  {c.pdf_url && (
                    <a
                      href={c.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-code-sm text-code-sm text-outline hover:text-primary transition-colors"
                      title="Open the arXiv PDF"
                    >
                      <ExternalLink className="w-3 h-3" /> PDF
                    </a>
                  )}
                  {c.abs_url && (
                    <a
                      href={c.abs_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-code-sm text-code-sm text-outline hover:text-primary transition-colors"
                      title="Open the arXiv abstract page"
                    >
                      <ExternalLink className="w-3 h-3" /> arXiv
                    </a>
                  )}
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant text-[12.5px] mt-0.5">
                  {[c.authors, c.year && `(${c.year})`, c.venue, c.arxiv_id && `arXiv:${c.arxiv_id}`]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                {c.abstract && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[12.5px] leading-relaxed line-clamp-2 mt-1">
                    {c.abstract}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isR && <span className="font-code-sm text-code-sm text-rose-400 text-[11px]">excluded</span>}
                <button
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-title-sm text-title-sm transition-all ${
                    isA
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700'
                      : 'border-outline-variant/50 text-on-surface-variant hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                  onClick={() => toggle(c.doc_id)}
                  title="Approve this paper as a review source"
                  type="button"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-title-sm text-title-sm transition-all ${
                    isR
                      ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-700'
                      : 'border-outline-variant/50 text-on-surface-variant hover:border-rose-400 hover:text-rose-600'
                  }`}
                  onClick={() => toggleReject(c.doc_id)}
                  title="Reject this paper"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] flex items-start gap-1.5 mt-space-sm pt-space-sm border-t border-outline-variant/20">
        <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
        The agent can only search passages whose paper you approve. Approving a paper
        is not an endorsement of its claims — every claim still has to survive
        source-backing verification before it appears in the review.
      </p>
    </div>
  );
};