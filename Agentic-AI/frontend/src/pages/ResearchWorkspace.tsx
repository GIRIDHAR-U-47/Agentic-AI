import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useResearch } from '../context/ResearchContext';
import { api } from '../services/api';
import { CandidatePaper } from '../types';
import { ChatComposer } from '../components/ChatComposer';

interface InChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'agent-activity';
  text?: string;
  timestamp: string;
  activityDone?: boolean;
  activityRunning?: boolean;
  activityMilestones?: { label: string; done: boolean; active?: boolean }[];
  activityEventsCount?: number;
  candidates?: CandidatePaper[];
  citations?: {
    marker: string;
    page?: number;
    section?: string;
    quote: string;
    doc_title?: string;
    filename?: string;
  }[];
  isStreaming?: boolean;
}

export const ResearchWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionIdParam = searchParams.get('session');

  const {
    query,
    setQuery,
    currentSessionTitle,
    setCurrentSessionTitle,
    setGeneratedSubQueries,
    selectedPaperIds,
    togglePaperSelection,
    selectAllPapers,
    showToast,
  } = useResearch();

  const navigate = useNavigate();

  // Active view: 'chat' (SciSpace/ChatGPT conversational flow) or 'table' (Structured matrix)
  const [viewMode, setViewMode] = useState<'chat' | 'table'>('chat');

  // Conversation history for the workspace
  const [conversation, setConversation] = useState<InChatTurn[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Discovery & Candidate state
  const [candidates, setCandidates] = useState<CandidatePaper[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<Record<string, string>>({});

  // Right-side Context Drawer: 'sources' | 'evidence' | 'pdf'
  const [drawerTab, setDrawerTab] = useState<'sources' | 'evidence' | 'pdf'>('sources');
  const [activeEvidencePassages, setActiveEvidencePassages] = useState<any[]>([]);
  const [activePdfViewer, setActivePdfViewer] = useState<{ url: string; title: string; page?: number } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Table filters
  const [filterQuery, setFilterQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterOpenAccessOnly, setFilterOpenAccessOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'citations'>('relevance');

  // Abstract expansions
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  const activeTopic = useMemo(() => {
    return query.trim() || currentSessionTitle.trim() || 'Explainable Deep Learning for Short-Term Electricity Load Forecasting';
  }, [query, currentSessionTitle]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchedRef = useRef<string>('');

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isProcessing]);

  // Execute Search Planning & Multi-Source Academic Discovery
  const runAcademicResearchWorkflow = useCallback(
    async (topicToSearch: string) => {
      const q = topicToSearch.trim();
      if (!q) return;

      setIsLoadingDiscovery(true);
      setIsProcessing(true);

      const turnId = `turn-${Date.now()}`;
      const userMsgId = `user-${Date.now()}`;

      // 1. Add User query message & Agent activity card
      setConversation((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          text: q,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: turnId,
          role: 'agent-activity',
          text: `Searching academic literature across OpenAlex, Semantic Scholar, Crossref, and arXiv...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activityRunning: true,
          activityDone: false,
          activityMilestones: [
            { label: 'Understanding research question & parameters', done: false, active: true },
            { label: 'Generating search queries across academic databases', done: false },
            { label: 'Searching academic sources (OpenAlex, Semantic Scholar, Crossref, arXiv)', done: false },
            { label: 'Filtering & ranking relevant candidate papers', done: false },
          ],
        },
      ]);

      try {
        // Step A: Search Plan
        let planRes: any = null;
        try {
          planRes = await api.discover.plan(q);
          if (planRes && planRes.search_queries) {
            setGeneratedSubQueries(planRes.search_queries);
          }
        } catch {
          // fallback plan handled by search
        }

        // Update milestone status
        setConversation((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  activityMilestones: [
                    { label: 'Understood research question & parameters', done: true },
                    {
                      label: planRes?.summary || 'Formulated targeted search strategy across baseline models',
                      done: true,
                    },
                    {
                      label: 'Searching academic sources (OpenAlex, Semantic Scholar, Crossref, arXiv)...',
                      done: false,
                      active: true,
                    },
                    { label: 'Filtering & ranking relevant papers', done: false },
                  ],
                }
              : t
          )
        );

        // Step B: Real Federated Academic Discovery
        const res = await api.discover.search(q, 15);
        const candidatesFound = res.candidates || [];
        setCandidates(candidatesFound);

        if (candidatesFound.length > 0) {
          const topIds = candidatesFound.slice(0, 3).map((c) => c.doc_id || c.arxiv_id || '');
          selectAllPapers(true, topIds.filter(Boolean));
        }

        // Finalize activity message with real candidate papers
        setConversation((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  activityRunning: false,
                  activityDone: true,
                  activityEventsCount: res.search_events ? res.search_events.length : 4,
                  activityMilestones: [
                    { label: 'Understood research question & parameters', done: true },
                    { label: planRes?.summary || 'Formulated targeted search strategy', done: true },
                    {
                      label: `Queried OpenAlex, Semantic Scholar, Crossref & arXiv`,
                      done: true,
                    },
                    {
                      label: `Deduplicated and filtered into ${candidatesFound.length} relevant candidate papers`,
                      done: true,
                    },
                  ],
                  candidates: candidatesFound,
                }
              : t
          )
        );

        showToast(`Discovered ${candidatesFound.length} verified academic papers.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`Notice: ${msg}`);

        // Local corpus fallback
        try {
          const fallback = await api.corpus.suggest(q, 8);
          if (fallback.candidates && fallback.candidates.length > 0) {
            setCandidates(fallback.candidates);
            selectAllPapers(true, fallback.candidates.slice(0, 3).map((c) => c.doc_id));
            setConversation((prev) =>
              prev.map((t) =>
                t.id === turnId
                  ? {
                      ...t,
                      activityRunning: false,
                      activityDone: true,
                      candidates: fallback.candidates,
                    }
                  : t
              )
            );
          }
        } catch {
          // keep clean state
        }
      } finally {
        setIsLoadingDiscovery(false);
        setIsProcessing(false);
      }
    },
    [selectAllPapers, setGeneratedSubQueries, showToast]
  );

  // Trigger discovery on initial mount or topic change
  useEffect(() => {
    if (activeTopic && searchedRef.current !== activeTopic) {
      searchedRef.current = activeTopic;
      void runAcademicResearchWorkflow(activeTopic);
    }
  }, [activeTopic, runAcademicResearchWorkflow]);

  // Handle saving and indexing single paper
  const handleSaveAndIndexPaper = async (paper: CandidatePaper) => {
    const paperId = paper.doc_id || paper.arxiv_id || '';
    if (!paperId) return;

    setIndexingStatus((prev) => ({ ...prev, [paperId]: 'DOWNLOADING' }));
    showToast(`Indexing "${paper.title.slice(0, 35)}..."`);

    try {
      setIndexingStatus((prev) => ({ ...prev, [paperId]: 'EXTRACTING' }));
      const res = await api.discover.ingestCandidate(paper as any);

      if (res.full_text_available === 1) {
        setIndexingStatus((prev) => ({ ...prev, [paperId]: 'CHAT_READY' }));
        showToast(`✓ "${paper.title.slice(0, 30)}" indexed & ready for chat!`);
      } else {
        setIndexingStatus((prev) => ({ ...prev, [paperId]: 'ABSTRACT_ONLY' }));
        showToast(`Metadata & Abstract saved (PDF full text not available online).`);
      }
    } catch (e) {
      setIndexingStatus((prev) => ({ ...prev, [paperId]: 'FAILED' }));
      showToast(`Indexing issue: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Batch index selected papers
  const handleSaveSelectedPapers = async () => {
    const selected = candidates.filter((c) =>
      selectedPaperIds.includes(c.doc_id || c.arxiv_id || '')
    );
    if (selected.length === 0) {
      showToast('Select at least 1 paper first.');
      return;
    }

    showToast(`Indexing ${selected.length} paper(s)...`);
    for (const p of selected) {
      await handleSaveAndIndexPaper(p);
    }
  };

  // In-chat follow-up Q&A submission
  const handleSendMessage = async (directText?: string) => {
    const txt = (directText || chatInput).trim();
    if (!txt || isProcessing) return;

    setChatInput('');
    setIsProcessing(true);

    const userMsgId = `msg-${Date.now()}`;
    const assistantMsgId = `ans-${Date.now()}`;

    // Add user question + streaming placeholder
    setConversation((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        text: txt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: assistantMsgId,
        role: 'assistant',
        text: 'Analyzing paper evidence & retrieving passages...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      },
    ]);

    // Check if user is asking for a new search
    const lower = txt.toLowerCase();
    if (
      lower.startsWith('find ') ||
      lower.startsWith('search ') ||
      lower.includes('papers from 2024')
    ) {
      await runAcademicResearchWorkflow(txt.replace(/^(find|search)\s+/i, ''));
      setIsProcessing(false);
      return;
    }

    try {
      const selected = candidates.filter((c) =>
        selectedPaperIds.includes(c.doc_id || c.arxiv_id || '')
      );
      const targetDocIds = selected.map((c) => c.doc_id || c.arxiv_id || '').filter(Boolean);

      const res = await api.paperChat.send({
        docIds: targetDocIds.length > 0 ? targetDocIds : undefined,
        query: txt,
        history: conversation
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text || '' })),
      });

      // Update right drawer with retrieved evidence passages
      if (res.sources && res.sources.length > 0) {
        setActiveEvidencePassages(res.sources);
        setDrawerTab('evidence');
      }

      setConversation((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: res.answer,
                citations: res.sources,
                isStreaming: false,
              }
            : m
        )
      );
    } catch (err) {
      setConversation((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: `I couldn't find sufficient grounded evidence in the selected papers for this query. ${
                  err instanceof Error ? err.message : ''
                }`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered candidate list for Matrix table
  const displayedCandidates = useMemo(() => {
    return candidates
      .filter((p) => {
        if (filterQuery.trim()) {
          const q = filterQuery.toLowerCase();
          const match =
            (p.title || '').toLowerCase().includes(q) ||
            (p.authors || '').toLowerCase().includes(q) ||
            (p.venue || '').toLowerCase().includes(q) ||
            (p.abstract || '').toLowerCase().includes(q);
          if (!match) return false;
        }
        if (filterYear !== 'All') {
          if (p.year !== filterYear) return false;
        }
        if (filterOpenAccessOnly && !p.is_open_access && !p.pdf_url) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'year') {
          return (parseInt(b.year || '0') || 0) - (parseInt(a.year || '0') || 0);
        }
        if (sortBy === 'citations') {
          return (b.citations_count || 0) - (a.citations_count || 0);
        }
        return 0;
      });
  }, [candidates, filterQuery, filterYear, filterOpenAccessOnly, sortBy]);

  const uniqueYears = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.year && c.year !== 'Unavailable') set.add(c.year);
    });
    return Array.from(set).sort().reverse();
  }, [candidates]);

  return (
    <div className="flex w-full h-[calc(100vh-56px)] bg-[#FAFAFC] overflow-hidden text-gray-900">
      {/* ── MAIN CONVERSATIONAL WORKSPACE ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Workspace Top Header */}
        <header className="px-4 sm:px-6 py-2.5 bg-white border-b border-gray-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-700 text-xs font-medium cursor-pointer transition-colors"
            >
              Home
            </span>
            <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
            <span className="text-xs font-semibold text-gray-800 truncate max-w-sm sm:max-w-md">
              {activeTopic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Chat vs Matrix */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === 'chat'
                    ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">table_rows</span>
                <span>Paper Matrix</span>
              </button>
            </div>

            {/* Context Panel Toggle */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDrawerOpen
                  ? 'bg-purple-50 border-purple-200 text-primary'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title="Toggle Context Panel (Sources / Evidence / PDF)"
            >
              <span className="material-symbols-outlined text-[17px]">
                {isDrawerOpen ? 'view_sidebar' : 'dock_to_right'}
              </span>
              <span className="hidden sm:inline">
                {isDrawerOpen ? 'Close Panel' : 'Panel'}
              </span>
            </button>
          </div>
        </header>

        {/* ── VIEW A: CONVERSATIONAL AI CHAT (PRIMARY) ── */}
        {viewMode === 'chat' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Scrollable Chat Stream */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
              <div className="w-full max-w-3xl mx-auto space-y-6">
                {conversation.map((turn) => (
                  <div key={turn.id} className="space-y-4 animate-fadeIn">
                    {/* User Turn */}
                    {turn.role === 'user' && (
                      <div className="flex items-start gap-3 justify-end">
                        <div className="bg-gray-100/90 text-gray-900 px-4 py-2.5 rounded-2xl rounded-tr-xs text-[14.5px] leading-relaxed max-w-[85%] border border-gray-200/50">
                          {turn.text}
                        </div>
                      </div>
                    )}

                    {/* Agent Activity Turn (Polished Collapsible Card) */}
                    {turn.role === 'agent-activity' && (
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
                          {/* Header */}
                          <div className="px-4 py-3 flex items-center justify-between bg-gray-50/60 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                              {turn.activityRunning ? (
                                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                                  check_circle
                                </span>
                              )}
                              <span className="text-[13px] font-semibold text-gray-900">
                                {turn.activityRunning
                                  ? 'Researching your topic'
                                  : 'Research completed'}
                              </span>
                            </div>

                            {turn.candidates && (
                              <span className="text-xs text-gray-500 font-medium">
                                {turn.candidates.length} relevant papers found
                              </span>
                            )}
                          </div>

                          {/* Milestones list */}
                          <div className="p-4 space-y-2 text-xs">
                            {turn.activityMilestones?.map((m, idx) => (
                              <div key={idx} className="flex items-center gap-2.5 text-gray-700">
                                {m.done ? (
                                  <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0">
                                    check
                                  </span>
                                ) : m.active ? (
                                  <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-gray-300 shrink-0" />
                                )}
                                <span className={m.active ? 'text-primary font-medium' : m.done ? 'text-gray-800' : 'text-gray-400'}>
                                  {m.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Real Candidate Papers Results */}
                        {turn.candidates && turn.candidates.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between px-1">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Strongest Paper Matches ({turn.candidates.length})
                              </h3>
                              <span className="text-[11.5px] text-gray-400">
                                Select papers to ground follow-up questions
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {turn.candidates.map((paper) => {
                                const pId = paper.doc_id || paper.arxiv_id || '';
                                const isSelected = selectedPaperIds.includes(pId);
                                const status = indexingStatus[pId];

                                return (
                                  <div
                                    key={pId}
                                    className={`p-4 rounded-xl border transition-all duration-150 ${
                                      isSelected
                                        ? 'bg-purple-50/40 border-purple-300 shadow-xs'
                                        : 'bg-white border-gray-200/90 hover:border-gray-300 hover:shadow-xs'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => togglePaperSelection(pId)}
                                          className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                                        />
                                        <div className="min-w-0">
                                          <h4 className="text-[14px] font-bold text-gray-900 leading-snug">
                                            {paper.title}
                                          </h4>
                                          <p className="text-[12px] text-gray-500 mt-1">
                                            {paper.authors} · <span className="font-medium text-gray-700">{paper.year}</span> ·{' '}
                                            <span className="italic">{paper.venue}</span>
                                          </p>
                                        </div>
                                      </div>

                                      {/* Tags */}
                                      <div className="flex flex-col items-end gap-1 shrink-0">
                                        {paper.sources_found && paper.sources_found.length > 1 && (
                                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                            {paper.sources_found.length} sources
                                          </span>
                                        )}
                                        {paper.is_open_access && (
                                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                                            Open Access
                                          </span>
                                        )}
                                        {paper.citations_count ? (
                                          <span className="text-[11px] text-gray-400">
                                            {paper.citations_count} citations
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    {/* Abstract snippet */}
                                    {paper.abstract && (
                                      <div className="mt-2 text-[12.5px] text-gray-600 leading-relaxed pl-7">
                                        <p className={expandedAbstracts[pId] ? '' : 'line-clamp-2'}>
                                          {paper.abstract}
                                        </p>
                                        {paper.abstract.length > 150 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedAbstracts((prev) => ({
                                                ...prev,
                                                [pId]: !prev[pId],
                                              }))
                                            }
                                            className="text-primary hover:underline text-[11px] font-medium mt-0.5 cursor-pointer"
                                          >
                                            {expandedAbstracts[pId] ? 'Show less' : 'Read abstract'}
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap text-xs pl-7">
                                      <div className="flex items-center gap-2">
                                        {paper.doi && (
                                          <a
                                            href={`https://doi.org/${paper.doi}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-gray-400 hover:text-primary flex items-center gap-1 font-mono text-[11px]"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">link</span>
                                            DOI
                                          </a>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {paper.pdf_url && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActivePdfViewer({
                                                url: paper.pdf_url || '',
                                                title: paper.title,
                                              });
                                              setDrawerTab('pdf');
                                              setIsDrawerOpen(true);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                          >
                                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                                            <span>Open Paper</span>
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleSaveAndIndexPaper(paper)}
                                          disabled={status === 'DOWNLOADING' || status === 'EXTRACTING'}
                                          className={`px-3 py-1 rounded-lg font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                                            status === 'CHAT_READY'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : 'bg-primary text-white hover:bg-primary-hover'
                                          }`}
                                        >
                                          <span className="material-symbols-outlined text-[14px]">
                                            {status === 'CHAT_READY' ? 'check' : 'save'}
                                          </span>
                                          <span>
                                            {status === 'CHAT_READY'
                                              ? 'Indexed'
                                              : status === 'DOWNLOADING' || status === 'EXTRACTING'
                                              ? 'Indexing...'
                                              : 'Save & Index'}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => navigate(`/paper-chat/${pId}`)}
                                          className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-primary hover:text-primary text-gray-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">forum</span>
                                          <span>Chat</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assistant Response Turn */}
                    {turn.role === 'assistant' && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-primary flex items-center justify-center shrink-0 border border-purple-200/60 mt-0.5">
                          <span className="material-symbols-outlined text-[18px]">psychology</span>
                        </div>
                        <div className="flex-1 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
                          <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                            <ReactMarkdown>{turn.text || ''}</ReactMarkdown>
                          </div>

                          {/* Grounded Citation Buttons */}
                          {turn.citations && turn.citations.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                                Cited Sources &amp; Evidence:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {turn.citations.map((c, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      setActiveEvidencePassages([c]);
                                      setDrawerTab('evidence');
                                      setIsDrawerOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-primary text-[11.5px] font-medium border border-purple-200/60 cursor-pointer transition-colors"
                                  >
                                    <span className="font-semibold">{c.marker}</span>
                                    <span className="truncate max-w-[140px]">
                                      {c.doc_title ? c.doc_title : 'Paper'}
                                    </span>
                                    {c.page && <span className="text-gray-500 font-normal">p. {c.page}</span>}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Sticky Selection Bar (if papers selected) */}
            {selectedPaperIds.length > 0 && (
              <div className="px-4 sm:px-6 py-2 bg-white/95 backdrop-blur-sm border-t border-gray-200/80 flex items-center justify-between gap-3 shrink-0 shadow-xs">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-semibold text-gray-800">
                    {selectedPaperIds.length} paper{selectedPaperIds.length === 1 ? '' : 's'} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSelectedPapers}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer"
                  >
                    Index Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSendMessage('Compare the architectures and methodology of the selected papers.');
                    }}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-primary text-gray-700 text-xs font-medium cursor-pointer"
                  >
                    Compare
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/report?topic=${encodeURIComponent(activeTopic)}`)}
                    className="px-3 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    Generate Review
                  </button>
                </div>
              </div>
            )}

            {/* Quick Starters Row */}
            <div className="px-4 sm:px-6 py-1.5 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
              <span className="text-[11px] font-semibold text-gray-400 uppercase shrink-0">Prompts:</span>
              {[
                'Find papers from 2024 onward',
                'Which ones use TCN?',
                'Compare their forecasting horizons',
                'What benchmark datasets were used?',
                'Summarize methodology and empirical results',
              ].map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-primary border border-gray-200/80 shrink-0 cursor-pointer transition-colors"
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Sticky Bottom Chat Composer */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200/80 shrink-0">
              <div className="max-w-3xl mx-auto">
                <ChatComposer
                  value={chatInput}
                  onChange={setChatInput}
                  onSubmit={() => handleSendMessage()}
                  isLoading={isProcessing}
                  placeholder="Ask a question about the papers, compare methods, or request evidence..."
                  minRows={1}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ── VIEW B: STRUCTURED PAPER MATRIX VIEW ── */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="material-symbols-outlined text-gray-400">search</span>
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter by title, author, venue..."
                  className="w-full bg-transparent text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="relevance">Relevance</option>
                  <option value="year">Year</option>
                  <option value="citations">Citations</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOpenAccessOnly}
                    onChange={(e) => setFilterOpenAccessOnly(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span>Open Access</span>
                </label>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200/80">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          displayedCandidates.length > 0 &&
                          displayedCandidates.every((p) =>
                            selectedPaperIds.includes(p.doc_id || p.arxiv_id || '')
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllPapers(
                              true,
                              displayedCandidates.map((p) => p.doc_id || p.arxiv_id || '')
                            );
                          } else {
                            selectAllPapers(false);
                          }
                        }}
                        className="rounded text-primary"
                      />
                    </th>
                    <th className="p-3">Paper Title &amp; Authors</th>
                    <th className="p-3 w-20">Year</th>
                    <th className="p-3 w-36">Venue</th>
                    <th className="p-3 w-28">Source</th>
                    <th className="p-3 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedCandidates.map((paper) => {
                    const pId = paper.doc_id || paper.arxiv_id || '';
                    const isSel = selectedPaperIds.includes(pId);
                    return (
                      <tr key={pId} className={`hover:bg-gray-50/70 transition-colors ${isSel ? 'bg-purple-50/30' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => togglePaperSelection(pId)}
                            className="rounded text-primary"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-gray-900">{paper.title}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{paper.authors}</div>
                        </td>
                        <td className="p-3 font-medium text-gray-700">{paper.year}</td>
                        <td className="p-3 italic text-gray-600">{paper.venue}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-gray-100 text-gray-700">
                            {paper.source || 'OpenAlex'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveAndIndexPaper(paper)}
                              className="px-2 py-1 rounded bg-primary text-white font-medium text-[11px] hover:bg-primary-hover"
                            >
                              Index
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/paper-chat/${pId}`)}
                              className="px-2 py-1 rounded border border-gray-200 text-gray-700 font-medium text-[11px] hover:bg-gray-50"
                            >
                              Chat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── OPTIONAL CONTEXT PANEL (COLLAPSIBLE, PER REQUIREMENT 10) ── */}
      {isDrawerOpen && (
        <aside className="w-80 sm:w-96 bg-white border-l border-gray-200/80 flex flex-col h-full shrink-0 shadow-sm animate-fadeIn">
          {/* Panel Header & Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200/80 bg-gray-50/60 px-3 pt-2">
            <div className="flex items-center gap-1">
              {[
                { id: 'sources', label: 'Sources', count: candidates.length },
                { id: 'evidence', label: 'Evidence', count: activeEvidencePassages.length },
                ...(activePdfViewer ? [{ id: 'pdf', label: 'PDF View', count: undefined }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDrawerTab(tab.id as any)}
                  className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    drawerTab === tab.id
                      ? 'border-primary text-primary bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              title="Close Panel"
            >
              <span className="material-symbols-outlined text-[17px]">close</span>
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB: SOURCES */}
            {drawerTab === 'sources' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Saved &amp; Active Papers
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveSelectedPapers}
                    className="text-[11.5px] text-primary font-medium hover:underline"
                  >
                    Index Selected
                  </button>
                </div>

                <div className="space-y-2">
                  {candidates.map((paper) => {
                    const pId = paper.doc_id || paper.arxiv_id || '';
                    const st = indexingStatus[pId] || 'DISCOVERED';

                    return (
                      <div
                        key={pId}
                        className="p-3 bg-gray-50/70 border border-gray-200/70 rounded-xl text-xs space-y-1.5"
                      >
                        <div className="font-semibold text-gray-900 line-clamp-2">{paper.title}</div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>{paper.year}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              st === 'CHAT_READY'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {st === 'CHAT_READY' ? 'Ready' : st}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/paper-chat/${pId}`)}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary text-white hover:bg-primary-hover"
                          >
                            Chat with Paper
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: EVIDENCE */}
            {drawerTab === 'evidence' && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Retrieved Passages ({activeEvidencePassages.length})
                </h4>
                {activeEvidencePassages.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4 text-center">
                    Ask a question in chat to retrieve grounded evidence from the papers.
                  </p>
                ) : (
                  activeEvidencePassages.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-gray-50/70 border border-gray-200/70 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-semibold text-primary">
                        <span>{ev.marker || `[E${idx + 1}]`} {ev.section || 'Passage'}</span>
                        {ev.page && <span className="text-gray-500">p. {ev.page}</span>}
                      </div>
                      <p className="text-gray-700 italic leading-relaxed">
                        &quot;{ev.quote || ev.text}&quot;
                      </p>
                      {ev.doc_title && (
                        <div className="text-[10.5px] text-gray-400 pt-1 border-t border-gray-200/50">
                          {ev.doc_title}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: PDF VIEWER */}
            {drawerTab === 'pdf' && activePdfViewer && (
              <div className="flex flex-col h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    {activePdfViewer.title}
                  </span>
                  <a
                    href={activePdfViewer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium"
                  >
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    External
                  </a>
                </div>
                <iframe
                  src={activePdfViewer.url}
                  className="w-full flex-1 min-h-[500px] border border-gray-200 rounded-xl"
                  title="PDF Viewer"
                />
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
