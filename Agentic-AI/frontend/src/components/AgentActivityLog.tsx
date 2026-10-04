import React, { useState } from 'react';
import {
  Brain,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCheck,
  Check,
  Loader2,
  Layers,
} from 'lucide-react';
import { ActivityEvent } from '../types';

interface AgentActivityLogProps {
  events: ActivityEvent[];
  running?: boolean;
  topic?: string;
  paperCount?: number;
  evidenceCount?: number;
}

/**
 * Polished, collapsible research activity card.
 * Never exposes raw internal reasoning, Thought/Action/Observation, or tool_Exception.
 * Converts real backend events into clean, dignified human-readable research milestones.
 */
export const AgentActivityLog: React.FC<AgentActivityLogProps> = ({
  events,
  running = false,
  topic,
  paperCount,
  evidenceCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sorted = [...events].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  // Sanitize detail: remove internal reasoning/chain-of-thought/tool_Exception
  const sanitizeText = (txt: string): string => {
    if (!txt) return '';
    return txt
      .replace(/^(Thought|Action|Observation|tool_Exception|Exception):\s*/gi, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();
  };

  // Extract clean milestones based on actual backend activity events
  const milestones = React.useMemo(() => {
    const list: { id: string; label: string; done: boolean; active: boolean; detail?: string }[] = [];

    const hasPlan = sorted.some((e) => e.kind === 'plan' || e.name.toLowerCase().includes('plan'));
    const hasSearch = sorted.some((e) => e.kind === 'tool' || e.name.toLowerCase().includes('search'));
    const hasRead = sorted.some(
      (e) => e.name.toLowerCase().includes('read') || e.name.toLowerCase().includes('evidence')
    );
    const hasVerify = sorted.some((e) => e.kind === 'verification' || e.name.toLowerCase().includes('verify'));
    const hasDone = !running && sorted.length > 0;

    list.push({
      id: 'm1',
      label: 'Understanding research question & scope',
      done: hasSearch || hasRead || hasDone,
      active: running && !hasSearch,
    });

    list.push({
      id: 'm2',
      label: 'Generating search queries across academic databases',
      done: hasSearch || hasRead || hasDone,
      active: running && hasPlan && !hasSearch,
    });

    list.push({
      id: 'm3',
      label: 'Searching academic literature (OpenAlex, Semantic Scholar, Crossref, arXiv)',
      done: hasRead || hasDone,
      active: running && hasSearch && !hasRead,
    });

    list.push({
      id: 'm4',
      label: 'Filtering & ranking relevant papers',
      done: hasVerify || hasDone,
      active: running && hasRead && !hasVerify,
    });

    list.push({
      id: 'm5',
      label: 'Analyzing evidence & synthesizing grounded insights',
      done: hasDone,
      active: running && hasVerify,
    });

    return list;
  }, [sorted, running]);

  const completed = !running && sorted.length > 0;

  return (
    <div className="rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/70 transition-colors select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              running
                ? 'bg-purple-100 text-primary'
                : completed
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : completed ? (
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-gray-900">
                {running ? 'Researching your topic...' : completed ? 'Research completed' : 'Research activity'}
              </span>
              {completed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[12px] text-gray-500 mt-0.5">
              {paperCount !== undefined && paperCount > 0 && (
                <span>{paperCount} relevant paper{paperCount === 1 ? '' : 's'} found</span>
              )}
              {evidenceCount !== undefined && evidenceCount > 0 && (
                <span>• {evidenceCount} passage{evidenceCount === 1 ? '' : 's'} analyzed</span>
              )}
              {sorted.length > 0 && (
                <span>• {sorted.length} step{sorted.length === 1 ? '' : 's'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-[12px] font-medium hidden sm:inline text-gray-500">
            {isExpanded ? 'Hide activity' : 'Show details'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Progress Checklist (always visible in compact or expanded view) */}
      <div className="px-4 pb-3.5 pt-1 border-t border-gray-100 bg-gray-50/40">
        <div className="space-y-2 mt-2">
          {milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 text-[13px]">
              {m.done ? (
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              ) : m.active ? (
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
              )}
              <span
                className={
                  m.active
                    ? 'text-primary font-medium'
                    : m.done
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded detailed event log (clean, no raw exception dumps) */}
      {isExpanded && sorted.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-white space-y-2 max-h-72 overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            Execution Provenance ({sorted.length} verified events)
          </p>
          <div className="space-y-2">
            {sorted.map((e, idx) => {
              const cleanDetail = sanitizeText(e.detail || '');
              if (!cleanDetail && !e.name) return null;

              return (
                <div key={idx} className="flex items-start gap-2.5 text-[12px] text-gray-700 py-1">
                  <span className="font-mono text-[11px] text-gray-400 w-5 shrink-0 text-right mt-0.5">
                    {e.seq || idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800">{e.name || e.kind}</span>
                    {cleanDetail && <p className="text-gray-600 mt-0.5 leading-relaxed">{cleanDetail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};