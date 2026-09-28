import React from 'react';
import {
  Brain,
  Search,
  GitBranch,
  ShieldAlert,
  TriangleAlert,
  CheckCircle2,
  CircleDot,
} from 'lucide-react';
import { ActivityEvent } from '../types';

/**
 * Renders the agent's activity log. This is the visible proof that a review
 * went through the loop (plan -> search -> read -> verify -> decide) instead of
 * being a canned script, so it refuses to prettify: events render in sequence
 * order with their real kind and detail text.
 */
const KIND_META: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  plan: { icon: <Brain className="w-3.5 h-3.5" />, cls: 'text-violet-400', label: 'plan' },
  tool: { icon: <Search className="w-3.5 h-3.5" />, cls: 'text-sky-400', label: 'tool' },
  decision: { icon: <GitBranch className="w-3.5 h-3.5" />, cls: 'text-amber-400', label: 'decision' },
  limit: { icon: <ShieldAlert className="w-3.5 h-3.5" />, cls: 'text-rose-400', label: 'limit' },
  error: { icon: <TriangleAlert className="w-3.5 h-3.5" />, cls: 'text-rose-500', label: 'error' },
  verification: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'text-emerald-400', label: 'verify' },
};

export const AgentActivityLog: React.FC<{ events: ActivityEvent[]; running?: boolean }> = ({
  events,
  running = false,
}) => {
  const sorted = [...events].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  return (
    <div className="rounded-xl bg-surface-container-lowest p-space-md border border-outline-variant/30 shadow-sm">
      <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
        <span className="font-label-md text-label-md text-outline uppercase font-bold tracking-wider">
          Agent Activity Log
        </span>
        <span className="inline-flex items-center gap-1.5 font-code-sm text-code-sm text-primary">
          <CircleDot className={`w-3 h-3 ${running ? 'animate-pulse' : ''}`} />
          {sorted.length} event{sorted.length === 1 ? '' : 's'}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant py-4 text-center">
          No activity recorded yet — the agent has not run.
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-1">
          {sorted.map((e) => {
            const meta = KIND_META[e.kind] || KIND_META.plan;
            return (
              <li
                key={`${e.seq}-${e.kind}-${e.name}`}
                className="flex items-start gap-2 py-1 group"
              >
                <span className="font-code-sm text-code-sm text-outline w-6 text-right mt-0.5 shrink-0 select-none">
                  {e.seq}
                </span>
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-md bg-surface-container shrink-0 ${meta.cls}`}
                >
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-code-sm text-code-sm font-semibold text-on-surface">
                      {meta.label}
                    </span>
                    <span className="font-code-sm text-code-sm text-outline truncate">
                      {e.name}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[12.5px] leading-relaxed break-words">
                    {e.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};