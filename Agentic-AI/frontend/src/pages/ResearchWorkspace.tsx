import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useResearch } from '../context/ResearchContext';
import { api } from '../services/api';
import { CandidatePaper, Conversation } from '../types';
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
  const { conversationId: paramConvId } = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryConvId = searchParams.get('conversationId') || searchParams.get('session');
  const activeConversationId = paramConvId || queryConvId || null;

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingConv, setIsLoadingConv] = useState(false);

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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const loadedConvIdRef = useRef<string | null>(null);

  const activeTopic = useMemo(() => {
    return query.trim() || currentSessionTitle.trim() || 'Explainable Deep Learning for Short-Term Electricity Load Forecasting';
  }, [query, currentSessionTitle]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isProcessing]);

  // Load persistent conversation when conversationId changes
  const loadPersistentConversation = useCallback(async (convId: string) => {
    try {
      setIsLoadingConv(true);
      setLoadError(null);
      const conv = await api.conversations.get(convId);
      
      if (conv) {
        loadedConvIdRef.current = convId;
        if (conv.title) setCurrentSessionTitle(conv.title);
        if (conv.research_topic) setQuery(conv.research_topic);
        if (conv.selected_paper_ids && conv.selected_paper_ids.length > 0) {
          selectAllPapers(true, conv.selected_paper_ids);
        }

        // Restore candidates from metadata if available
        if (conv.metadata?.candidates) {
          setCandidates(conv.metadata.candidates);
        }

        // Map messages
        if (conv.messages && conv.messages.length > 0) {
          const mapped: InChatTurn[] = conv.messages.map((m) => {
            const isActivity = m.role === 'agent-activity' || m.metadata?.type === 'activity';
            return {
              id: m.id,
              role: isActivity ? 'agent-activity' : (m.role as any),
              text: m.content,
              timestamp: m.created_at
                ? new Date(m.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now',
              citations: m.metadata?.sources,
              activityMilestones: m.metadata?.milestones,
              activityDone: true,
              candidates: (m.metadata?.candidates as any) || (isActivity && conv.metadata?.candidates ? conv.metadata.candidates : undefined),
            };
          });
          setConversation(mapped);
        } else {
          // If no messages yet, run discovery
          setConversation([]);
        }
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load conversation');
    } finally {
      setIsLoadingConv(false);
    }
  }, [selectAllPapers, setCurrentSessionTitle, setQuery]);

  useEffect(() => {
    if (activeConversationId) {
      if (loadedConvIdRef.current !== activeConversationId) {
        loadPersistentConversation(activeConversationId);
      }
    } else {
      // Create a persistent conversation automatically for new queries
      (async () => {
        try {
          const newConv = await api.conversations.create({
            mode: 'research',
            research_topic: activeTopic,
          });
          loadedConvIdRef.current = newConv.id;
          navigate(`/chat/${newConv.id}`, { replace: true });
        } catch {
          // Fallback
        }
      })();
    }
  }, [activeConversationId, activeTopic, loadPersistentConversation, navigate]);

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
        // Save user message in persistent conversation if active
        if (activeConversationId) {
          api.conversations.addMessage(activeConversationId, {
            id: userMsgId,
            role: 'user',
            content: q,
          }).catch(() => undefined);
        }

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

        // Save candidates in persistent conversation metadata
        if (activeConversationId) {
          api.conversations.update(activeConversationId, {
            metadata: { candidates: candidatesFound },
            selected_paper_ids: candidatesFound.slice(0, 3).map((c) => c.doc_id || c.arxiv_id || '').filter(Boolean),
          }).catch(() => undefined);

          // Save activity message
          api.conversations.addMessage(activeConversationId, {
            id: turnId,
            role: 'agent-activity',
            content: `Searched OpenAlex, Semantic Scholar, Crossref & arXiv. Found ${candidatesFound.length} relevant candidate papers.`,
            metadata: {
              type: 'activity',
              candidates: candidatesFound,
              milestones: [
                { label: 'Understood research question & parameters', done: true },
                { label: planRes?.summary || 'Formulated targeted search strategy', done: true },
                { label: 'Queried OpenAlex, Semantic Scholar, Crossref & arXiv', done: true },
                { label: `Deduplicated and filtered into ${candidatesFound.length} relevant candidate papers`, done: true },
              ],
            },
          }).catch(() => undefined);
        }

        // Finalize activity message with real candidate papers in UI
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
    [activeConversationId, selectAllPapers, setGeneratedSubQueries, showToast]
  );

  // Trigger initial discovery if conversation has no messages
  useEffect(() => {
    if (activeTopic && conversation.length === 0 && !isLoadingConv && !isProcessing) {
      void runAcademicResearchWorkflow(activeTopic);
    }
  }, [activeTopic, conversation.length, isLoadingConv, isProcessing, runAcademicResearchWorkflow]);

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

      let answer = '';
      let sources: any[] = [];

      if (activeConversationId) {
        const res = await api.conversations.chat(activeConversationId, {
          query: txt,
          selected_paper_ids: targetDocIds,
          message_id: userMsgId,
        });
        answer = res.content;
        sources = res.sources || [];
      } else {
        const res = await api.paperChat.send({
          docIds: targetDocIds.length > 0 ? targetDocIds : undefined,
          query: txt,
          history: conversation
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text || '' })),
        });
        answer = res.answer;
        sources = res.sources || [];
      }

      // Update right drawer with retrieved evidence passages
      if (sources && sources.length > 0) {
        setActiveEvidencePassages(sources);
        setDrawerTab('evidence');
      }

      setConversation((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: answer,
                citations: sources,
                isStreaming: false,
              }
            : m
        )
      );
    } catch (err) {
      showToast('Your message could not be saved. Please retry.');
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

  // Error boundary state
  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAFAFC] min-h-[calc(100vh-56px)]">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[26px]">error_outline</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Couldn't load this conversation.</h2>
        <p className="text-xs text-gray-500 mb-5 max-w-sm">{loadError}</p>
        <button
          type="button"
          onClick={() => activeConversationId && loadPersistentConversation(activeConversationId)}
          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

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
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                            {paper.sources_found.join(' + ')}
                                          </span>
                                        )}
                                        {paper.is_open_access && (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                            Open Access PDF
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Abstract snippet */}
                                    {paper.abstract && (
                                      <p className="text-[12.5px] text-gray-600 mt-2.5 leading-relaxed line-clamp-2">
                                        {paper.abstract}
                                      </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 text-xs">
                                      <div className="flex items-center gap-2">
                                        {paper.pdf_url && (
                                          <a
                                            href={paper.pdf_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                                          >
                                            <span className="material-symbols-outlined text-[14px]">
                                              picture_as_pdf
                                            </span>
                                            View PDF
                                          </a>
                                        )}
                                        {paper.abs_url && (
                                          <a
                                            href={paper.abs_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1"
                                          >
                                            <span className="material-symbols-outlined text-[14px]">
                                              open_in_new
                                            </span>
                                            arXiv
                                          </a>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveAndIndexPaper(paper)}
                                          disabled={status === 'DOWNLOADING' || status === 'EXTRACTING' || status === 'CHAT_READY'}
                                          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer text-xs ${
                                            status === 'CHAT_READY'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : status === 'DOWNLOADING' || status === 'EXTRACTING'
                                              ? 'bg-gray-100 text-gray-500'
                                              : 'bg-purple-50 hover:bg-purple-100 text-primary border border-purple-200/60'
                                          }`}
                                        >
                                          {status === 'DOWNLOADING'
                                            ? 'Downloading...'
                                            : status === 'EXTRACTING'
                                            ? 'Extracting...'
                                            : status === 'CHAT_READY'
                                            ? '✓ Indexed'
                                            : 'Save & Index'}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (pId) {
                                              navigate(`/paper-chat/${encodeURIComponent(pId)}`);
                                            }
                                          }}
                                          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium cursor-pointer transition-colors"
                                        >
                                          Chat
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
                      <div className="flex items-start gap-3 justify-start animate-fadeIn">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-primary border border-purple-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <span className="material-symbols-outlined text-[17px]">psychology</span>
                        </div>
                        <div className="flex flex-col gap-2 max-w-[85%] min-w-0">
                          <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-none p-4 text-[13.5px] leading-relaxed text-gray-900 shadow-2xs">
                            <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                              <ReactMarkdown>
                                {turn.text || ''}
                              </ReactMarkdown>
                            </div>
                          </div>

                          {/* Citations Footer */}
                          {turn.citations && turn.citations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 px-1">
                              {turn.citations.map((c, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setActiveEvidencePassages([c]);
                                    setDrawerTab('evidence');
                                    setIsDrawerOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-purple-50 border border-gray-200 text-gray-700 hover:text-primary text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                                >
                                  <span className="font-bold text-primary">{c.marker}</span>
                                  <span className="truncate max-w-[140px]">{c.doc_title || 'Paper'}</span>
                                  <span className="text-gray-400">p.{c.page || 1}</span>
                                </button>
                              ))}
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

            {/* In-Chat Fixed Bottom Composer */}
            <div className="p-4 bg-white border-t border-gray-200/80 shrink-0">
              <div className="max-w-3xl mx-auto">
                <ChatComposer
                  value={chatInput}
                  onChange={setChatInput}
                  onSubmit={() => handleSendMessage()}
                  placeholder={`Ask a follow-up question about the selected ${selectedPaperIds.length} paper(s)...`}
                  disabled={isProcessing}
                  isLoading={isProcessing}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ── VIEW B: STRUCTURED PAPER MATRIX TABLE ── */
          <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter papers by keyword..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs w-64 focus:outline-none focus:border-primary"
                />
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveSelectedPapers}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Save & Index Selected ({selectedPaperIds.length})
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs text-gray-700 border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 font-semibold text-gray-900 uppercase text-[10.5px]">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedPaperIds.length === candidates.length && candidates.length > 0}
                        onChange={(e) => selectAllPapers(e.target.checked, candidates.map((c) => c.doc_id || c.arxiv_id || ''))}
                      />
                    </th>
                    <th className="p-3">Title & Authors</th>
                    <th className="p-3">Year</th>
                    <th className="p-3">Venue</th>
                    <th className="p-3">Source</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedCandidates.map((p) => {
                    const pId = p.doc_id || p.arxiv_id || '';
                    const isSelected = selectedPaperIds.includes(pId);
                    return (
                      <tr key={pId} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePaperSelection(pId)}
                          />
                        </td>
                        <td className="p-3 max-w-md">
                          <span className="font-bold text-gray-900 block">{p.title}</span>
                          <span className="text-gray-500 text-[11px] block mt-0.5">{p.authors}</span>
                        </td>
                        <td className="p-3">{p.year}</td>
                        <td className="p-3 italic text-gray-600">{p.venue}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-gray-100 text-gray-700">
                            {p.sources_found?.join(', ') || 'Academic Source'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSaveAndIndexPaper(p)}
                            className="px-2.5 py-1 rounded bg-purple-50 text-primary hover:bg-purple-100 font-medium text-[11px] cursor-pointer"
                          >
                            Index
                          </button>
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

      {/* ── RIGHT CONTEXT DRAWER (SOURCES / EVIDENCE / PDF) ── */}
      {isDrawerOpen && (
        <aside className="w-[360px] bg-white border-l border-gray-200/80 flex flex-col h-full shadow-lg z-20 animate-fadeIn shrink-0">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setDrawerTab('sources')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  drawerTab === 'sources' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                }`}
              >
                Sources ({candidates.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('evidence')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  drawerTab === 'evidence' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                }`}
              >
                Evidence ({activeEvidencePassages.length})
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {drawerTab === 'sources' && (
              <div className="space-y-3">
                {candidates.map((c) => (
                  <div
                    key={c.doc_id || c.arxiv_id}
                    className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/50 text-xs space-y-1.5"
                  >
                    <span className="font-bold text-gray-900 block leading-snug">{c.title}</span>
                    <span className="text-gray-500 block">{c.authors} ({c.year})</span>
                    {c.abstract && (
                      <p className="text-gray-600 leading-relaxed text-[11.5px] line-clamp-3">
                        {c.abstract}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {drawerTab === 'evidence' && (
              <div className="space-y-3">
                {activeEvidencePassages.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-purple-200/60 bg-purple-50/30 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-primary">
                      <span>{ev.marker || `[E${idx + 1}]`}</span>
                      <span className="text-gray-500 font-normal">p. {ev.page || 1}</span>
                    </div>
                    <span className="font-semibold text-gray-900 block">{ev.doc_title || 'Paper Source'}</span>
                    <p className="text-gray-700 italic leading-relaxed text-[11.5px]">
                      &quot;{ev.quote}&quot;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
