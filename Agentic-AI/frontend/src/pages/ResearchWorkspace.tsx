import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useResearch } from '../context/ResearchContext';
import { api } from '../services/api';
import { CandidatePaper, CorpusDocument } from '../types';

interface AgentStepLog {
  id: string;
  title: string;
  detail?: string;
  status: 'done' | 'running' | 'pending' | 'error';
  source?: string;
}

interface InChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'agent-activity';
  text?: string;
  timestamp: string;
  steps?: AgentStepLog[];
  candidates?: CandidatePaper[];
  citations?: { marker: string; page?: number; section?: string; quote: string; doc_title?: string; filename?: string }[];
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
    generatedSubQueries,
    setGeneratedSubQueries,
    selectedPaperIds,
    togglePaperSelection,
    selectAllPapers,
    showToast,
  } = useResearch();

  const navigate = useNavigate();

  // Active view: 'chat' (SciSpace conversational flow) or 'table' (Structured matrix)
  const [viewMode, setViewMode] = useState<'chat' | 'table'>('chat');

  // Conversation history for the workspace
  const [conversation, setConversation] = useState<InChatTurn[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Discovery & Candidate state
  const [candidates, setCandidates] = useState<CandidatePaper[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [searchPlanSummary, setSearchPlanSummary] = useState<string>('');
  const [searchPlanQueries, setSearchPlanQueries] = useState<string[]>([]);
  const [discoveryEvents, setDiscoveryEvents] = useState<any[]>([]);

  // Paper indexing status tracker: doc_id -> status string
  const [indexingStatus, setIndexingStatus] = useState<Record<string, string>>({});

  // Right-side drawer state: 'library' | 'evidence' | 'artifacts' | 'pdf'
  const [drawerTab, setDrawerTab] = useState<'library' | 'evidence' | 'artifacts' | 'pdf'>('library');
  const [activeEvidencePassages, setActiveEvidencePassages] = useState<any[]>([]);
  const [activePdfViewer, setActivePdfViewer] = useState<{ url: string; title: string; page?: number } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Filters
  const [filterQuery, setFilterQuery] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterOpenAccessOnly, setFilterOpenAccessOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'citations'>('relevance');

  // Expansion states
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  const activeTopic = useMemo(() => {
    return query.trim() || currentSessionTitle.trim() || 'Explainable Deep Learning for Short-Term Electricity Load Forecasting';
  }, [query, currentSessionTitle]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const searchedRef = useRef<string>('');

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isProcessing]);

  // Execute Search Planning & Multi-Source Academic Discovery
  const runAcademicResearchWorkflow = useCallback(async (topicToSearch: string) => {
    const q = topicToSearch.trim();
    if (!q) return;

    setIsLoadingDiscovery(true);
    setIsProcessing(true);
    setDiscoveryError(null);

    const turnId = `turn-${Date.now()}`;
    const userMsgId = `user-${Date.now()}`;

    // 1. Add User query message to chat
    setConversation(prev => [
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
        text: `I will search the academic literature across OpenAlex, Semantic Scholar, Crossref, and arXiv for relevant forecasting models, datasets, explainability techniques, evaluation methods, and recent studies.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: [
          { id: 's1', title: 'Understanding research scope & parameters', status: 'running' },
          { id: 's2', title: 'Formulating multi-angle search plan', status: 'pending' },
          { id: 's3', title: 'Searching academic sources (OpenAlex, Semantic Scholar, Crossref, arXiv)', status: 'pending' },
          { id: 's4', title: 'Deduplicating & ranking candidate papers', status: 'pending' },
        ],
      }
    ]);

    try {
      // Step A: Search Plan
      let planRes: any = null;
      try {
        planRes = await api.discover.plan(q);
        if (planRes && planRes.search_queries) {
          setSearchPlanSummary(planRes.summary || '');
          setSearchPlanQueries(planRes.search_queries || []);
          setGeneratedSubQueries(planRes.search_queries);
        }
      } catch {
        // Fallback plan
      }

      // Update step status: plan done, searching running
      setConversation(prev =>
        prev.map(t =>
          t.id === turnId
            ? {
                ...t,
                steps: [
                  { id: 's1', title: 'Understood research question & domain scope', status: 'done' },
                  {
                    id: 's2',
                    title: planRes?.summary || `Created 4 search queries covering core models & explainability`,
                    detail: planRes?.search_queries?.join(' • '),
                    status: 'done',
                  },
                  { id: 's3', title: 'Searching academic databases (OpenAlex, Semantic Scholar, Crossref, arXiv)...', status: 'running' },
                  { id: 's4', title: 'Deduplicating & ranking candidate papers', status: 'pending' },
                ],
              }
            : t
        )
      );

      // Step B: Real Federated Academic Discovery
      const res = await api.discover.search(q, 15);
      const candidatesFound = res.candidates || [];
      const events = res.search_events || [];
      setDiscoveryEvents(events);

      // Build source execution summary steps
      const sourceSteps: AgentStepLog[] = events.map((ev: any, i: number) => ({
        id: `src-${i}`,
        title: `[${ev.source || 'Academic Source'}] ${ev.status === 'success' ? '✓ Search completed' : 'Notice'}`,
        detail: ev.count ? `${ev.count} papers retrieved` : (ev.message || ev.note || 'Queried repository'),
        status: ev.status === 'success' ? 'done' : 'error',
      }));

      // Deduplication summary
      const dedupeStep: AgentStepLog = {
        id: 'dedupe',
        title: `Deduplicated ${res.skipped_known ? `and merged cross-source duplicates` : 'and filtered'} into ${candidatesFound.length} candidate papers`,
        status: 'done',
      };

      setCandidates(candidatesFound);

      // Pre-select top 3 papers
      if (candidatesFound.length > 0) {
        const topIds = candidatesFound.slice(0, 3).map(c => c.doc_id || c.arxiv_id || '');
        selectAllPapers(true, topIds.filter(Boolean));
      }

      // Finalize activity message with candidates attached
      setConversation(prev =>
        prev.map(t =>
          t.id === turnId
            ? {
                ...t,
                steps: [
                  { id: 's1', title: 'Understood research question & scope', status: 'done' },
                  {
                    id: 's2',
                    title: planRes?.summary || `Generated structured search strategy`,
                    detail: planRes?.search_queries?.slice(0, 3).join(' | '),
                    status: 'done',
                  },
                  ...sourceSteps,
                  dedupeStep,
                ],
                candidates: candidatesFound,
              }
            : t
        )
      );

      showToast(`Discovered ${candidatesFound.length} real academic papers.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setDiscoveryError(msg);
      showToast(`Search notice: ${msg}`);

      // Attempt fallback from local corpus
      try {
        const fallback = await api.corpus.suggest(q, 8);
        if (fallback.candidates && fallback.candidates.length > 0) {
          setCandidates(fallback.candidates);
          selectAllPapers(true, fallback.candidates.slice(0, 3).map(c => c.doc_id));
        }
      } catch {
        // keep empty
      }
    } finally {
      setIsLoadingDiscovery(false);
      setIsProcessing(false);
    }
  }, [selectAllPapers, setGeneratedSubQueries, showToast]);

  // Initial trigger on mount or topic change
  useEffect(() => {
    if (activeTopic && searchedRef.current !== activeTopic) {
      searchedRef.current = activeTopic;
      void runAcademicResearchWorkflow(activeTopic);
    }
  }, [activeTopic, runAcademicResearchWorkflow]);

  // Handle saving & indexing an individual paper
  const handleSaveAndIndexPaper = async (paper: CandidatePaper) => {
    const paperId = paper.doc_id || paper.arxiv_id || '';
    if (!paperId) return;

    setIndexingStatus(prev => ({ ...prev, [paperId]: 'DOWNLOADING' }));
    showToast(`Indexing "${paper.title.slice(0, 35)}..."`);

    try {
      setIndexingStatus(prev => ({ ...prev, [paperId]: 'EXTRACTING' }));
      const res = await api.discover.ingestCandidate(paper as any);

      if (res.full_text_available === 1) {
        setIndexingStatus(prev => ({ ...prev, [paperId]: 'CHAT_READY' }));
        showToast(`✓ "${paper.title.slice(0, 30)}" indexed & ready for chat!`);
      } else {
        setIndexingStatus(prev => ({ ...prev, [paperId]: 'ABSTRACT_ONLY' }));
        showToast(`Metadata & Abstract saved (full text PDF unavailable online).`);
      }
    } catch (e) {
      setIndexingStatus(prev => ({ ...prev, [paperId]: 'FAILED' }));
      showToast(`Indexing failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Handle batch Save & Index for selected papers
  const handleSaveSelectedPapers = async () => {
    const selected = candidates.filter(c => selectedPaperIds.includes(c.doc_id || c.arxiv_id || ''));
    if (selected.length === 0) {
      showToast('Please select at least 1 paper first.');
      return;
    }

    showToast(`Indexing ${selected.length} selected paper(s)...`);
    for (const p of selected) {
      await handleSaveAndIndexPaper(p);
    }
  };

  // Handle in-chat Q&A / Paper Chat submission
  const handleSendMessage = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const txt = (directText || chatInput).trim();
    if (!txt || isProcessing) return;

    setChatInput('');
    setIsProcessing(true);

    const userMsgId = `msg-${Date.now()}`;
    const assistantMsgId = `ans-${Date.now()}`;

    // Add user message
    setConversation(prev => [
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
      }
    ]);

    // Check if user is asking to trigger a new research search
    const lower = txt.toLowerCase();
    if (lower.startsWith('find ') || lower.startsWith('search ') || lower.includes('recent papers that build on')) {
      await runAcademicResearchWorkflow(txt.replace(/^(find|search)\s+/i, ''));
      setIsProcessing(false);
      return;
    }

    try {
      // Find active paper target(s)
      const selected = candidates.filter(c => selectedPaperIds.includes(c.doc_id || c.arxiv_id || ''));
      const targetDocIds = selected.map(c => c.doc_id || c.arxiv_id || '').filter(Boolean);

      // Call dedicated agentic Paper Chat endpoint
      const res = await api.paperChat.send({
        docIds: targetDocIds.length > 0 ? targetDocIds : undefined,
        query: txt,
        history: conversation
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text || '' })),
      });

      // Update right-side evidence drawer with retrieved chunks
      if (res.sources && res.sources.length > 0) {
        setActiveEvidencePassages(res.sources);
        setDrawerTab('evidence');
      }

      // Update conversation with grounded answer & page citations
      setConversation(prev =>
        prev.map(m =>
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
      setConversation(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: `I couldn't find this information in the selected paper(s). ${err instanceof Error ? err.message : ''}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered & Sorted Candidate Papers
  const displayedCandidates = useMemo(() => {
    return candidates
      .filter(p => {
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
        return 0; // default relevance
      });
  }, [candidates, filterQuery, filterYear, filterOpenAccessOnly, sortBy]);

  const uniqueYears = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => {
      if (c.year && c.year !== 'Unavailable') set.add(c.year);
    });
    return Array.from(set).sort().reverse();
  }, [candidates]);

  return (
    <div className="flex w-full h-[calc(100vh-56px)] bg-[#FAF8FC] overflow-hidden text-[#1D1A20]">
      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Control Bar */}
        <header className="px-5 py-3 bg-white border-b border-[#EAE0F0] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              onClick={() => navigate('/')}
              className="text-[#7A6E82] hover:text-[#5F2781] text-xs font-semibold cursor-pointer transition-colors"
            >
              Research Home
            </span>
            <span className="material-symbols-outlined text-xs text-[#7A6E82]">chevron_right</span>
            <span className="text-xs font-bold text-[#5F2781] truncate max-w-md">
              {activeTopic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Chat vs Matrix */}
            <div className="flex items-center bg-[#F5ECF9] p-0.5 rounded-lg border border-[#ECD9F3]">
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'chat'
                    ? 'bg-white text-[#5F2781] shadow-xs'
                    : 'text-[#7A6E82] hover:text-[#5F2781]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Research Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#5F2781] shadow-xs'
                    : 'text-[#7A6E82] hover:text-[#5F2781]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">table_rows</span>
                <span>Paper Matrix</span>
              </button>
            </div>

            {/* Right Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-1.5 rounded-lg border border-[#EAE0F0] hover:bg-[#F5ECF9] text-[#5F2781] cursor-pointer"
              title="Toggle Right Panel"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDrawerOpen ? 'right_panel_close' : 'right_panel_open'}
              </span>
            </button>
          </div>
        </header>

        {/* ── CONVERSATIONAL CHAT WORKSPACE (DEFAULT) ── */}
        {viewMode === 'chat' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Chat Stream Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {conversation.map(turn => (
                <div key={turn.id} className="w-full max-w-4xl mx-auto space-y-3">
                  {/* User Turn */}
                  {turn.role === 'user' && (
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-[#5F2781] text-white px-4 py-3 rounded-2xl rounded-tr-xs shadow-xs max-w-2xl text-[14.5px] leading-relaxed">
                        {turn.text}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#EBDFF1] text-[#5F2781] font-bold text-xs flex items-center justify-center shrink-0">
                        You
                      </div>
                    </div>
                  )}

                  {/* Agent Activity Turn (Planning, Source Search, Deduplication, Candidates) */}
                  {turn.role === 'agent-activity' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3F1A57] to-[#7B3A9E] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[17px]">science</span>
                      </div>
                      <div className="flex-1 bg-white border border-[#EAE0F0] rounded-2xl p-5 shadow-xs space-y-4">
                        <p className="text-[14px] text-[#3F1A57] font-medium leading-relaxed">
                          {turn.text}
                        </p>

                        {/* Agent Step Status Cards */}
                        {turn.steps && (
                          <div className="bg-[#FAF7FC] border border-[#EFE5F5] rounded-xl p-3.5 space-y-2">
                            {turn.steps.map(s => (
                              <div key={s.id} className="flex items-start gap-2.5 text-xs">
                                {s.status === 'done' ? (
                                  <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0 mt-0.5">
                                    check_circle
                                  </span>
                                ) : s.status === 'running' ? (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#5F2781] border-t-transparent animate-spin shrink-0 mt-0.5" />
                                ) : s.status === 'error' ? (
                                  <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0 mt-0.5">
                                    info
                                  </span>
                                ) : (
                                  <span className="material-symbols-outlined text-[#C4B2CC] text-[16px] shrink-0 mt-0.5">
                                    radio_button_unchecked
                                  </span>
                                )}
                                <div className="flex-1">
                                  <span className={`font-semibold ${s.status === 'running' ? 'text-[#5F2781]' : 'text-[#2C2433]'}`}>
                                    {s.title}
                                  </span>
                                  {s.detail && (
                                    <p className="text-[#7A6E82] text-[11px] mt-0.5">{s.detail}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Candidate Papers Returned Inside Chat Stream */}
                        {turn.candidates && turn.candidates.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F2781]">
                                Candidate Papers Found ({turn.candidates.length})
                              </h4>
                              <span className="text-[11px] text-[#7A6E82]">
                                Select papers to save, index, and chat
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {turn.candidates.map(paper => {
                                const pId = paper.doc_id || paper.arxiv_id || '';
                                const isSelected = selectedPaperIds.includes(pId);
                                const status = indexingStatus[pId];

                                return (
                                  <div
                                    key={pId}
                                    className={`p-4 rounded-xl border transition-all ${
                                      isSelected
                                        ? 'bg-[#FAF5FC] border-[#7B3A9E] shadow-xs'
                                        : 'bg-white border-[#EAE0F0] hover:border-[#C4B2CC]'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      {/* Checkbox & Paper Title */}
                                      <div className="flex items-start gap-2.5 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => togglePaperSelection(pId)}
                                          className="mt-1 w-4 h-4 rounded text-[#5F2781] focus:ring-[#5F2781] cursor-pointer"
                                        />
                                        <div>
                                          <h5 className="text-[14.5px] font-bold text-[#1D1A20] leading-snug">
                                            {paper.title}
                                          </h5>
                                          <p className="text-xs text-[#7A6E82] mt-1">
                                            {paper.authors} • <span className="font-semibold">{paper.year}</span> • <span className="italic">{paper.venue}</span>
                                          </p>
                                        </div>
                                      </div>

                                      {/* Source Badges */}
                                      <div className="flex flex-col items-end gap-1 shrink-0">
                                        {paper.sources_found && paper.sources_found.length > 1 && (
                                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#E8F5ED] text-[#2D5A3D]">
                                            Found across {paper.sources_found.length} sources
                                          </span>
                                        )}
                                        {paper.is_open_access && (
                                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#E3F2FD] text-[#1565C0]">
                                            Open Access PDF
                                          </span>
                                        )}
                                        {paper.citations_count ? (
                                          <span className="text-[11px] font-medium text-[#7A6E82]">
                                            {paper.citations_count} citations
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    {/* Abstract */}
                                    <div className="mt-2 text-xs text-[#4D4450] leading-relaxed">
                                      <p className={expandedAbstracts[pId] ? '' : 'line-clamp-2'}>
                                        {paper.abstract}
                                      </p>
                                      {paper.abstract && paper.abstract.length > 150 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedAbstracts(prev => ({
                                              ...prev,
                                              [pId]: !prev[pId],
                                            }))
                                          }
                                          className="text-[#5F2781] hover:underline text-[11px] font-semibold mt-0.5 cursor-pointer"
                                        >
                                          {expandedAbstracts[pId] ? 'Show less' : 'Read full abstract'}
                                        </button>
                                      )}
                                    </div>

                                    {/* Card Actions */}
                                    <div className="mt-3 pt-2.5 border-t border-[#F5EDFA] flex items-center justify-between gap-2 flex-wrap text-xs">
                                      <div className="flex items-center gap-2">
                                        {paper.doi && (
                                          <a
                                            href={`https://doi.org/${paper.doi}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[#7A6E82] hover:text-[#5F2781] flex items-center gap-1 font-mono text-[11px]"
                                          >
                                            <span className="material-symbols-outlined text-[13px]">link</span>
                                            DOI: {paper.doi.slice(0, 20)}...
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
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-[#F5ECF9] text-[#5F2781] hover:bg-[#ECD9F3] font-semibold flex items-center gap-1 cursor-pointer"
                                          >
                                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                                            <span>Open Paper</span>
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleSaveAndIndexPaper(paper)}
                                          disabled={status === 'DOWNLOADING' || status === 'EXTRACTING'}
                                          className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                                            status === 'CHAT_READY'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-[#5F2781] text-white hover:bg-[#4A176B]'
                                          }`}
                                        >
                                          <span className="material-symbols-outlined text-[14px]">
                                            {status === 'CHAT_READY' ? 'check' : 'save'}
                                          </span>
                                          <span>
                                            {status === 'CHAT_READY'
                                              ? '✓ Indexed & Ready'
                                              : status === 'DOWNLOADING' || status === 'EXTRACTING'
                                              ? 'Indexing...'
                                              : 'Save & Index'}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => navigate(`/paper-chat/${pId}`)}
                                          className="px-2.5 py-1 rounded-lg border border-[#5F2781] text-[#5F2781] hover:bg-[#F5ECF9] font-semibold flex items-center gap-1 cursor-pointer"
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
                    </div>
                  )}

                  {/* Assistant Message Turn (Grounded Answer + Page Citations) */}
                  {turn.role === 'assistant' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3F1A57] to-[#7B3A9E] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[17px]">psychology</span>
                      </div>
                      <div className="flex-1 bg-white border border-[#EAE0F0] rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="prose prose-sm max-w-none text-[#1D1A20] leading-relaxed">
                          <ReactMarkdown>{turn.text || ''}</ReactMarkdown>
                        </div>

                        {/* Page Citations Anchors */}
                        {turn.citations && turn.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#F5EDFA] space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F2781] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              Page Citations &amp; Retrieved Evidence:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {turn.citations.map((c, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setActiveEvidencePassages([c]);
                                    setDrawerTab('evidence');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F5ECF9] hover:bg-[#ECD9F3] text-[#5F2781] text-xs font-semibold border border-[#E8DCF0] cursor-pointer"
                                >
                                  <span className="font-bold">{c.marker}</span>
                                  <span>{c.doc_title ? c.doc_title.slice(0, 20) : 'Paper'}</span>
                                  {c.page ? <span className="text-[#7A6E82]">p. {c.page}</span> : null}
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

            {/* Selection Sticky Action Bar */}
            {selectedPaperIds.length > 0 && (
              <div className="px-5 py-2.5 bg-gradient-to-r from-[#FAF5FC] to-white border-t border-[#EAE0F0] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5F2781] animate-pulse" />
                  <span className="text-xs font-bold text-[#5F2781]">
                    {selectedPaperIds.length} paper(s) selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSelectedPapers}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#5F2781] text-[#5F2781] hover:bg-[#F5ECF9] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    <span>Save &amp; Index Selected</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChatInput(`Compare the architectures and methodology of the selected papers.`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#5F2781] text-[#5F2781] hover:bg-[#F5ECF9] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">compare</span>
                    <span>Compare Methods</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/report?topic=${encodeURIComponent(activeTopic)}`);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#5F2781] hover:bg-[#4A176B] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">menu_book</span>
                    <span>Start Literature Review</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Starters Row */}
            <div className="px-5 py-2 bg-white border-t border-[#F5EDFA] flex items-center gap-1.5 overflow-x-auto shrink-0">
              <span className="text-[11px] font-bold text-[#7A6E82] uppercase shrink-0">Prompts:</span>
              {[
                'Summarize the key findings',
                'Explain the forecasting methodology',
                'What benchmark datasets were used?',
                'What are the limitations and research gaps?',
                'Find 5 recent papers that build on this approach',
              ].map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(undefined, promptText)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF7FC] hover:bg-[#F5ECF9] text-[#5F2781] border border-[#EAE0F0] shrink-0 cursor-pointer transition-colors"
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* In-Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#EAE0F0] shrink-0">
              <div className="max-w-4xl mx-auto flex items-center gap-2 bg-[#FAF7FC] border border-[#EAE0F0] focus-within:border-[#5F2781] rounded-2xl px-4 py-2 shadow-xs transition-colors">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask anything about the discovered papers, methodology, datasets, limitations..."
                  className="flex-1 bg-transparent border-0 text-[14px] text-[#1D1A20] placeholder-[#8F8495] focus:outline-none"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isProcessing}
                  className={`p-2 rounded-xl text-white transition-all cursor-pointer ${
                    chatInput.trim() && !isProcessing
                      ? 'bg-[#5F2781] hover:bg-[#4A176B]'
                      : 'bg-[#C4B2CC] cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ── STRUCTURED PAPER MATRIX VIEW ── */
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-[#EAE0F0] flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <span className="material-symbols-outlined text-[#7A6E82]">search</span>
                <input
                  type="text"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Filter papers by title, author, venue..."
                  className="w-full bg-transparent text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Year filter */}
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  className="text-xs bg-[#FAF7FC] border border-[#EAE0F0] rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="text-xs bg-[#FAF7FC] border border-[#EAE0F0] rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="year">Sort by Year</option>
                  <option value="citations">Sort by Citations</option>
                </select>

                {/* Open Access Toggle */}
                <label className="flex items-center gap-1.5 text-xs text-[#4D4450] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOpenAccessOnly}
                    onChange={e => setFilterOpenAccessOnly(e.target.checked)}
                    className="rounded text-[#5F2781]"
                  />
                  <span>Open Access Only</span>
                </label>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-xl border border-[#EAE0F0] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5ECF9] text-[#5F2781] font-bold border-b border-[#EAE0F0]">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={displayedCandidates.length > 0 && displayedCandidates.every(p => selectedPaperIds.includes(p.doc_id || p.arxiv_id || ''))}
                        onChange={e => {
                          if (e.target.checked) {
                            selectAllPapers(true, displayedCandidates.map(p => p.doc_id || p.arxiv_id || ''));
                          } else {
                            selectAllPapers(false);
                          }
                        }}
                        className="rounded text-[#5F2781]"
                      />
                    </th>
                    <th className="p-3">Paper Title &amp; Authors</th>
                    <th className="p-3 w-24">Year</th>
                    <th className="p-3 w-36">Venue / Journal</th>
                    <th className="p-3 w-28">Source(s)</th>
                    <th className="p-3 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EDFA]">
                  {displayedCandidates.map(paper => {
                    const pId = paper.doc_id || paper.arxiv_id || '';
                    const isSel = selectedPaperIds.includes(pId);
                    return (
                      <tr key={pId} className={`hover:bg-[#FAF7FC] transition-colors ${isSel ? 'bg-[#FDFCFF]' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => togglePaperSelection(pId)}
                            className="rounded text-[#5F2781]"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#1D1A20]">{paper.title}</div>
                          <div className="text-[11px] text-[#7A6E82] mt-0.5">{paper.authors}</div>
                        </td>
                        <td className="p-3 font-semibold">{paper.year}</td>
                        <td className="p-3 italic text-[#4D4450]">{paper.venue}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#F5ECF9] text-[#5F2781]">
                            {paper.source || 'OpenAlex'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveAndIndexPaper(paper)}
                              className="px-2 py-1 rounded bg-[#5F2781] text-white font-semibold text-[11px] hover:bg-[#4A176B]"
                            >
                              Index
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/paper-chat/${pId}`)}
                              className="px-2 py-1 rounded border border-[#5F2781] text-[#5F2781] font-semibold text-[11px] hover:bg-[#F5ECF9]"
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

      {/* ── RIGHT-SIDE DRAWER (SAVED PAPERS / EVIDENCE / ARTIFACTS / PDF) ── */}
      {isDrawerOpen && (
        <aside className="w-80 sm:w-96 bg-white border-l border-[#EAE0F0] flex flex-col h-full shrink-0 shadow-sm">
          {/* Drawer Tabs */}
          <div className="flex items-center border-b border-[#EAE0F0] bg-[#FAF8FC] px-3 pt-2">
            {[
              { id: 'library', label: 'Library', icon: 'collections_bookmark' },
              { id: 'evidence', label: 'Evidence', icon: 'verified' },
              { id: 'artifacts', label: 'Outputs', icon: 'folder' },
              ...(activePdfViewer ? [{ id: 'pdf', label: 'PDF View', icon: 'picture_as_pdf' }] : []),
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDrawerTab(tab.id as any)}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  drawerTab === tab.id
                    ? 'border-[#5F2781] text-[#5F2781] bg-white rounded-t-lg'
                    : 'border-transparent text-[#7A6E82] hover:text-[#5F2781]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TAB: LIBRARY / SAVED PAPERS */}
            {drawerTab === 'library' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F2781]">
                    Saved Papers ({candidates.filter(c => selectedPaperIds.includes(c.doc_id || c.arxiv_id || '')).length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveSelectedPapers}
                    className="text-[11px] text-[#5F2781] font-bold hover:underline"
                  >
                    Sync All
                  </button>
                </div>

                <div className="space-y-2">
                  {candidates
                    .filter(c => selectedPaperIds.includes(c.doc_id || c.arxiv_id || ''))
                    .map(paper => {
                      const pId = paper.doc_id || paper.arxiv_id || '';
                      const st = indexingStatus[pId] || 'SAVED';

                      return (
                        <div key={pId} className="p-3 bg-[#FAF7FC] border border-[#EAE0F0] rounded-xl text-xs space-y-1.5">
                          <div className="font-bold text-[#1D1A20] line-clamp-2">{paper.title}</div>
                          <div className="flex items-center justify-between text-[11px] text-[#7A6E82]">
                            <span>{paper.year}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st === 'CHAT_READY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {st === 'CHAT_READY' ? '✓ Chat Ready' : st}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/paper-chat/${pId}`)}
                              className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#5F2781] text-white hover:bg-[#4A176B]"
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

            {/* TAB: RETRIEVED EVIDENCE */}
            {drawerTab === 'evidence' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F2781]">
                  Retrieved Passages ({activeEvidencePassages.length})
                </h4>
                {activeEvidencePassages.length === 0 ? (
                  <p className="text-xs text-[#7A6E82] italic">
                    No passages retrieved yet. Ask a question about the paper to retrieve grounded evidence.
                  </p>
                ) : (
                  activeEvidencePassages.map((ev, idx) => (
                    <div key={idx} className="p-3.5 bg-white border border-[#EAE0F0] rounded-xl text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-[#5F2781]">
                        <span>{ev.marker || `[E${idx+1}]`} {ev.section || 'Document Passage'}</span>
                        {ev.page ? <span className="text-[#7A6E82] font-semibold">p. {ev.page}</span> : null}
                      </div>
                      <p className="text-[#4D4450] italic leading-relaxed">
                        &quot;{ev.quote || ev.text}&quot;
                      </p>
                      {ev.doc_title && (
                        <div className="text-[10.5px] text-[#7A6E82] pt-1 border-t border-[#F5EDFA]">
                          Source: {ev.doc_title}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: OUTPUTS & ARTIFACTS */}
            {drawerTab === 'artifacts' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F2781]">
                  Generated Research Artifacts
                </h4>
                <div className="space-y-2">
                  <div
                    onClick={() => navigate(`/report?topic=${encodeURIComponent(activeTopic)}`)}
                    className="p-3 bg-[#FAF7FC] border border-[#EAE0F0] hover:border-[#5F2781] rounded-xl flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5F2781]">article</span>
                      <span className="font-semibold text-[#1D1A20]">Literature Review Report</span>
                    </div>
                    <span className="material-symbols-outlined text-[#7A6E82] text-sm">open_in_new</span>
                  </div>

                  <div
                    onClick={() => navigate(`/compare`)}
                    className="p-3 bg-[#FAF7FC] border border-[#EAE0F0] hover:border-[#5F2781] rounded-xl flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5F2781]">table_chart</span>
                      <span className="font-semibold text-[#1D1A20]">Methods Comparison Matrix</span>
                    </div>
                    <span className="material-symbols-outlined text-[#7A6E82] text-sm">open_in_new</span>
                  </div>

                  <div
                    onClick={() => navigate(`/evidence`)}
                    className="p-3 bg-[#FAF7FC] border border-[#EAE0F0] hover:border-[#5F2781] rounded-xl flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#5F2781]">verified</span>
                      <span className="font-semibold text-[#1D1A20]">Evidence Validation Matrix</span>
                    </div>
                    <span className="material-symbols-outlined text-[#7A6E82] text-sm">open_in_new</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PDF VIEWER */}
            {drawerTab === 'pdf' && activePdfViewer && (
              <div className="flex flex-col h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5F2781] truncate">{activePdfViewer.title}</span>
                  <a
                    href={activePdfViewer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#5F2781] font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    External
                  </a>
                </div>
                <iframe
                  src={activePdfViewer.url}
                  className="w-full flex-1 min-h-[500px] border border-[#EAE0F0] rounded-xl"
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
