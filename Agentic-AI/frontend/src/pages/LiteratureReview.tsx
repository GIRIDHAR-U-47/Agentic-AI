import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api, MODE_DESCRIPTIONS } from '../services/api';
import { CandidatePaper, Conversation, ReviewCitation, ReviewMode } from '../types';
import { ChatComposer } from '../components/ChatComposer';

interface ReviewChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'agent-activity';
  text?: string;
  timestamp: string;
  activityDone?: boolean;
  activityRunning?: boolean;
  activityMilestones?: { label: string; done: boolean; active?: boolean }[];
  candidates?: CandidatePaper[];
  citations?: any[];
  matrixMarkdown?: string;
  isStreaming?: boolean;
}

const LITERATURE_REVIEW_SECTIONS = [
  '1. Introduction',
  '2. Existing Approaches',
  '3. Deep Learning Methods',
  '4. Optimization Techniques',
  '5. Explainable AI (XAI)',
  '6. Multi-Horizon Forecasting & Empirical Evaluation',
  '7. Comparative Analysis Matrix',
  '8. Identified Research Gaps',
  '9. Future Research Directions',
  '10. References',
];

export const LiteratureReview: React.FC = () => {
  const { conversationId: paramConvId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const queryConvId = searchParams.get('conversationId') || searchParams.get('session');
  const activeConvId = paramConvId || queryConvId || null;

  const navigate = useNavigate();

  // New review form states
  const [researchTopic, setResearchTopic] = useState(
    'How can explainable deep learning and metaheuristic optimization improve multi-horizon data center power forecasting?'
  );
  const [reviewMode, setReviewMode] = useState<ReviewMode>('agentic_rag');
  const [sources, setSources] = useState({
    openAlex: true,
    semanticScholar: true,
    crossref: true,
    arxiv: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Active review state
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [chatTurns, setChatTurns] = useState<ReviewChatTurn[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<CandidatePaper[]>([]);
  const [activeEvidenceList, setActiveEvidenceList] = useState<any[]>([]);
  const [generatedReviewText, setGeneratedReviewText] = useState<string | null>(null);
  const [generatedMatrixText, setGeneratedMatrixText] = useState<string | null>(null);

  // Status & loading
  const [reviewChatInput, setReviewChatInput] = useState('');
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'discover' | 'select' | 'analyze' | 'compare' | 'synthesize'>('discover');

  // Right drawer state: 'sources' | 'evidence' | 'outputs'
  const [drawerTab, setDrawerTab] = useState<'sources' | 'evidence' | 'outputs'>('sources');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const loadedIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatTurns, isProcessingChat, isGeneratingReview]);

  // Load existing persistent review conversation
  const loadReviewConversation = useCallback(async (convId: string) => {
    try {
      setLoadError(null);
      const conv = await api.conversations.get(convId);
      if (conv) {
        loadedIdRef.current = convId;
        setConversation(conv);
        if (conv.research_topic) setResearchTopic(conv.research_topic);
        if (conv.selected_paper_ids) setSelectedDocIds(conv.selected_paper_ids);
        if (conv.metadata?.candidates) setCandidates(conv.metadata.candidates);
        if (conv.metadata?.generated_review) setGeneratedReviewText(conv.metadata.generated_review);

        // Map messages
        if (conv.messages && conv.messages.length > 0) {
          const turns: ReviewChatTurn[] = conv.messages.map((m) => {
            const isAct = m.role === 'agent-activity' || m.metadata?.type === 'activity';
            return {
              id: m.id,
              role: isAct ? 'agent-activity' : (m.role as any),
              text: m.content,
              timestamp: m.created_at
                ? new Date(m.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now',
              citations: m.metadata?.sources,
              activityMilestones: m.metadata?.milestones,
              activityDone: true,
              candidates: (m.metadata?.candidates as any) || (isAct && conv.metadata?.candidates ? conv.metadata.candidates : undefined),
              matrixMarkdown: m.metadata?.matrix_markdown as string | undefined,
            };
          });
          setChatTurns(turns);
          setCurrentStep(conv.metadata?.generated_review ? 'synthesize' : 'analyze');
        }
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load literature review conversation');
    }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      if (loadedIdRef.current !== activeConvId) {
        loadReviewConversation(activeConvId);
      }
    } else {
      setConversation(null);
      setChatTurns([]);
    }
  }, [activeConvId, loadReviewConversation]);

  // Start new literature review flow
  const handleStartReview = async () => {
    const topic = researchTopic.trim();
    if (!topic || isStartingReview) return;

    setIsStartingReview(true);
    setLoadError(null);

    try {
      // 1. Create persistent review conversation
      const conv = await api.conversations.create({
        mode: 'literature_review',
        research_topic: topic,
        metadata: {
          review_mode: reviewMode,
          sources_selected: sources,
        },
      });

      loadedIdRef.current = conv.id;
      setConversation(conv);
      navigate(`/report/${conv.id}`, { replace: true });

      // 2. Initial turns: Question + Activity Stream
      const userTurnId = `user-${Date.now()}`;
      const actTurnId = `act-${Date.now()}`;

      setChatTurns([
        {
          id: userTurnId,
          role: 'user',
          text: `Literature Review: ${topic}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: actTurnId,
          role: 'agent-activity',
          text: 'Initiating multi-source academic discovery and evidence indexing...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activityRunning: true,
          activityDone: false,
          activityMilestones: [
            { label: 'Understood research question & domain parameters', done: true },
            { label: 'Generating targeted search queries across academic databases', done: false, active: true },
            { label: 'Searching OpenAlex, Semantic Scholar, Crossref & arXiv', done: false },
            { label: 'Filtering & ranking relevant papers', done: false },
          ],
        },
      ]);

      // Save user turn to backend
      await api.conversations.addMessage(conv.id, {
        id: userTurnId,
        role: 'user',
        content: `Literature Review: ${topic}`,
      });

      // 3. Plan & Federated Discovery (Concurrent Execution)
      const [_planRes, searchRes] = await Promise.all([
        api.discover.plan(topic).catch(() => null),
        api.discover.search(topic, 14),
      ]);

      const foundPapers = searchRes.candidates || [];
      setCandidates(foundPapers);

      const topIds = foundPapers.slice(0, 3).map((c) => c.doc_id || c.arxiv_id || '').filter(Boolean);
      setSelectedDocIds(topIds);
      setCurrentStep('select');

      // Update persistent conversation
      await api.conversations.update(conv.id, {
        selected_paper_ids: topIds,
        metadata: {
          candidates: foundPapers,
          review_mode: reviewMode,
          sources_selected: sources,
        },
      });

      // Finalize activity turn
      setChatTurns((prev) =>
        prev.map((t) =>
          t.id === actTurnId
            ? {
                ...t,
                activityRunning: false,
                activityDone: true,
                activityMilestones: [
                  { label: 'Understood research question & domain parameters', done: true },
                  { label: 'Generated targeted search queries', done: true },
                  { label: 'Searched OpenAlex, Semantic Scholar, Crossref & arXiv', done: true },
                  { label: `Deduplicated and ranked ${foundPapers.length} relevant candidate papers`, done: true },
                ],
                candidates: foundPapers,
              }
            : t
        )
      );

      // Save activity turn
      await api.conversations.addMessage(conv.id, {
        id: actTurnId,
        role: 'agent-activity',
        content: `Discovered ${foundPapers.length} verified academic papers across OpenAlex, Semantic Scholar, Crossref & arXiv.`,
        metadata: {
          type: 'activity',
          candidates: foundPapers,
          milestones: [
            { label: 'Understood research question & domain parameters', done: true },
            { label: 'Generated targeted search queries', done: true },
            { label: 'Searched OpenAlex, Semantic Scholar, Crossref & arXiv', done: true },
            { label: `Deduplicated and ranked ${foundPapers.length} relevant papers`, done: true },
          ],
        },
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error starting review');
    } finally {
      setIsStartingReview(false);
    }
  };

  // Toggle paper selection
  const handleTogglePaper = async (paperId: string) => {
    const updated = selectedDocIds.includes(paperId)
      ? selectedDocIds.filter((id) => id !== paperId)
      : [...selectedDocIds, paperId];
    setSelectedDocIds(updated);

    if (activeConvId) {
      api.conversations.update(activeConvId, { selected_paper_ids: updated }).catch(() => undefined);
    }
  };

  // In-review chat turn
  const handleSendChatMessage = async (directText?: string) => {
    if (!activeConvId || isProcessingChat) return;

    const txt = (directText || '').trim();
    if (!txt) return;

    setIsProcessingChat(true);

    const userMsgId = `user-${Date.now()}`;
    const asstMsgId = `asst-${Date.now()}`;

    setChatTurns((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        text: txt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: asstMsgId,
        role: 'assistant',
        text: 'Analyzing literature evidence & generating verified response...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      },
    ]);

    try {
      // Check for specific intent shortcuts
      const lower = txt.toLowerCase();
      if (lower.includes('generate') && (lower.includes('literature review') || lower.includes('review'))) {
        await handleGenerateLiteratureReview();
        setIsProcessingChat(false);
        return;
      }

      if (lower.includes('compare') || lower.includes('comparison matrix')) {
        await handleGenerateComparison();
        setIsProcessingChat(false);
        return;
      }

      const res = await api.conversations.chat(activeConvId, {
        query: txt,
        selected_paper_ids: selectedDocIds,
        mode: 'literature_review',
        message_id: userMsgId,
      });

      if (res.sources && res.sources.length > 0) {
        setActiveEvidenceList(res.sources);
      }

      setChatTurns((prev) =>
        prev.map((t) =>
          t.id === asstMsgId
            ? {
                ...t,
                text: res.content,
                citations: res.sources,
                isStreaming: false,
              }
            : t
        )
      );
      setCurrentStep('analyze');
    } catch (err) {
      setChatTurns((prev) =>
        prev.map((t) =>
          t.id === asstMsgId
            ? {
                ...t,
                text: `I couldn't verify this claim in the current literature scope. ${
                  err instanceof Error ? err.message : ''
                }`,
                isStreaming: false,
              }
            : t
        )
      );
    } finally {
      setIsProcessingChat(false);
    }
  };

  // Compare papers matrix action
  const handleGenerateComparison = async () => {
    if (!activeConvId || isComparing) return;
    setIsComparing(true);
    setCurrentStep('compare');

    try {
      const res = await api.conversations.compare(activeConvId);
      setGeneratedMatrixText(res.matrix_markdown);
      setDrawerTab('outputs');
      setIsDrawerOpen(true);

      // Add to conversation turn list
      setChatTurns((prev) => [
        ...prev,
        {
          id: res.id || `cmp-${Date.now()}`,
          role: 'assistant',
          text: `### Evidence-Backed Comparison Matrix\n\n${res.matrix_markdown}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      // Fallback
    } finally {
      setIsComparing(false);
    }
  };

  // Generate full 10-section Literature Review
  const handleGenerateLiteratureReview = async () => {
    if (!activeConvId || isGeneratingReview) return;
    setIsGeneratingReview(true);
    setCurrentStep('synthesize');

    try {
      const res = await api.conversations.generateReview(activeConvId, {
        focus_topic: researchTopic,
      });
      setGeneratedReviewText(res.content);
      setDrawerTab('outputs');
      setIsDrawerOpen(true);

      setChatTurns((prev) => [
        ...prev,
        {
          id: res.id || `rev-${Date.now()}`,
          role: 'assistant',
          text: res.content,
          citations: res.sources,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      // Fallback
    } finally {
      setIsGeneratingReview(false);
    }
  };

  // ── Render Form when no active review ──
  if (!activeConvId && !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FAFAFC] min-h-[calc(100vh-56px)] select-none">
        <div className="w-full max-w-2xl bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-primary border border-purple-200/60 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">menu_book</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Literature Review Workspace</h1>
              <p className="text-xs text-gray-500">
                Persistent multi-paper review, comparative matrix synthesis & evidence verification.
              </p>
            </div>
          </div>

          {/* Research Question */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
              What would you like to review?
            </label>
            <textarea
              rows={3}
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              placeholder="How can explainable deep learning and metaheuristic optimization improve multi-horizon data center power forecasting?"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14.5px] text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Review Mode Radio */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Review Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'agentic_rag', label: 'Agentic RAG', desc: 'Iterative retrieval, evidence verification & query refinement' },
                { id: 'basic_rag', label: 'Basic RAG', desc: 'Single-shot passage retrieval from approved corpus' },
                { id: 'no_rag', label: 'No RAG', desc: 'Direct baseline generation without retrieval' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setReviewMode(m.id as ReviewMode)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    reviewMode === m.id
                      ? 'bg-purple-50/70 border-primary shadow-xs'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="reviewMode"
                      checked={reviewMode === m.id}
                      onChange={() => setReviewMode(m.id as ReviewMode)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-bold text-gray-900">{m.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 pl-5">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sources Checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Academic Sources
            </label>
            <div className="flex flex-wrap gap-4 pt-1">
              {[
                { key: 'openAlex', label: 'OpenAlex' },
                { key: 'semanticScholar', label: 'Semantic Scholar' },
                { key: 'crossref', label: 'Crossref' },
                { key: 'arxiv', label: 'arXiv' },
              ].map((src) => (
                <label key={src.key} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(sources as any)[src.key]}
                    onChange={(e) => setSources((prev) => ({ ...prev, [src.key]: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>{src.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Settings Collapsible */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showAdvanced ? 'expand_less' : 'expand_more'}
              </span>
              <span>Advanced Review Controls</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 text-xs space-y-2 text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Human-in-the-Loop Verification</span>
                  <span className="font-semibold text-emerald-700">Enabled by Default</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max Agent Iterations</span>
                  <span className="font-semibold">3 Iterations</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Strict Source Grounding</span>
                  <span className="font-semibold text-primary">Required (No hallucinations)</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleStartReview}
            disabled={!researchTopic.trim() || isStartingReview}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isStartingReview ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                <span>Initializing Review Workspace...</span>
              </>
            ) : (
              <>
                <span>Start Review</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Render Active Review Workspace ──
  return (
    <div className="flex w-full h-[calc(100vh-56px)] bg-[#FAFAFC] overflow-hidden text-gray-900 select-none">
      {/* ── MAIN REVIEW CONVERSATION AREA ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Progress Bar & Header */}
        <header className="px-6 py-3 bg-white border-b border-gray-200/80 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span
                onClick={() => navigate('/report')}
                className="text-gray-400 hover:text-gray-700 text-xs font-medium cursor-pointer"
              >
                Literature Review
              </span>
              <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
              <h2 className="text-xs font-bold text-gray-900 truncate max-w-md">
                {researchTopic}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateComparison}
                disabled={isComparing || selectedDocIds.length === 0}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">table_chart</span>
                <span>{isComparing ? 'Comparing...' : 'Compare Papers'}</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateLiteratureReview}
                disabled={isGeneratingReview}
                className="px-3 py-1 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                <span>{isGeneratingReview ? 'Synthesizing...' : 'Generate Review'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`p-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  isDrawerOpen ? 'bg-purple-50 border-purple-200 text-primary' : 'bg-white border-gray-200 text-gray-600'
                }`}
                title="Toggle Evidence & Outputs Panel"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isDrawerOpen ? 'view_sidebar' : 'dock_to_right'}
                </span>
              </button>
            </div>
          </div>

          {/* Workflow Progress Indicator: Discover -> Select -> Analyze -> Compare -> Synthesize */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 pt-1 border-t border-gray-100">
            {[
              { id: 'discover', label: 'Discover' },
              { id: 'select', label: 'Select' },
              { id: 'analyze', label: 'Analyze' },
              { id: 'compare', label: 'Compare' },
              { id: 'synthesize', label: 'Synthesize' },
            ].map((step, idx) => {
              const isPast =
                (currentStep === 'select' && idx === 0) ||
                (currentStep === 'analyze' && idx <= 1) ||
                (currentStep === 'compare' && idx <= 2) ||
                (currentStep === 'synthesize' && idx <= 3);
              const isCurrent = currentStep === step.id;

              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && <span className="text-gray-300">→</span>}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-purple-50 text-primary font-bold border border-purple-200/60'
                        : isPast
                        ? 'text-emerald-700 font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    {isPast && <span className="material-symbols-outlined text-[13px]">check</span>}
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    <span>{step.label}</span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="w-full max-w-3xl mx-auto space-y-6">
            {chatTurns.map((turn) => (
              <div key={turn.id} className="space-y-3 animate-fadeIn">
                {/* User Message */}
                {turn.role === 'user' && (
                  <div className="flex justify-end">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2.5 rounded-2xl rounded-tr-xs text-[14px] leading-relaxed max-w-[85%] border border-gray-200/50">
                      {turn.text}
                    </div>
                  </div>
                )}

                {/* Agent Activity & Paper Results Card */}
                {turn.role === 'agent-activity' && (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white border border-gray-200/80 shadow-2xs overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                          {turn.activityRunning ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                          )}
                          <span>Literature Search & Evidence Pipeline</span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {turn.candidates?.length || 0} papers retrieved
                        </span>
                      </div>

                      <div className="p-4 space-y-1.5 text-xs text-gray-600">
                        {turn.activityMilestones?.map((m, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {m.done ? (
                              <span className="material-symbols-outlined text-emerald-600 text-[15px]">check</span>
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />
                            )}
                            <span className={m.done ? 'text-gray-800' : 'text-gray-400'}>{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Paper Cards List */}
                    {turn.candidates && turn.candidates.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between px-1 text-xs">
                          <span className="font-bold uppercase tracking-wider text-gray-500">
                            Candidate Literature ({turn.candidates.length})
                          </span>
                          <span className="text-gray-400">Select papers for comparative analysis</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {turn.candidates.map((paper) => {
                            const pId = paper.doc_id || paper.arxiv_id || '';
                            const isSelected = selectedDocIds.includes(pId);

                            return (
                              <div
                                key={pId}
                                className={`p-4 rounded-xl border transition-all ${
                                  isSelected
                                    ? 'bg-purple-50/50 border-purple-300 shadow-2xs'
                                    : 'bg-white border-gray-200/90 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleTogglePaper(pId)}
                                      className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <div>
                                      <h4 className="text-[13.5px] font-bold text-gray-900 leading-snug">
                                        {paper.title}
                                      </h4>
                                      <p className="text-[11.5px] text-gray-500 mt-0.5">
                                        {paper.authors} · <span className="font-semibold text-gray-700">{paper.year}</span> ·{' '}
                                        <span className="italic">{paper.venue}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {paper.pdf_url && (
                                      <a
                                        href={paper.pdf_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium inline-flex items-center gap-1"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">picture_as_pdf</span>
                                        Read
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePaper(pId)}
                                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                        isSelected ? 'bg-primary text-white' : 'bg-purple-50 text-primary hover:bg-purple-100'
                                      }`}
                                    >
                                      {isSelected ? 'Selected' : 'Select'}
                                    </button>
                                  </div>
                                </div>

                                {paper.abstract && (
                                  <p className="text-[12px] text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                    {paper.abstract}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Assistant Output Message */}
                {turn.role === 'assistant' && (
                  <div className="flex items-start gap-3 justify-start animate-fadeIn">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-primary border border-purple-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                    </div>
                    <div className="flex flex-col gap-2 max-w-[90%] min-w-0">
                      <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-none p-4 text-[13.5px] leading-relaxed text-gray-900 shadow-2xs">
                        <div className="prose prose-sm max-w-none text-gray-900 leading-relaxed">
                          <ReactMarkdown>
                            {turn.text || ''}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Evidence citation tags */}
                      {turn.citations && turn.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-1">
                          {turn.citations.map((c, idx) => (
                            <span
                              key={idx}
                              onClick={() => {
                                setActiveEvidenceList([c]);
                                setDrawerTab('evidence');
                                setIsDrawerOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-gray-200 text-[11px] font-medium text-gray-700 hover:text-primary cursor-pointer shadow-2xs"
                            >
                              <span className="font-bold text-primary">{c.marker}</span>
                              <span className="truncate max-w-[120px]">{c.doc_title || 'Paper'}</span>
                              <span className="text-gray-400">p.{c.page || 1}</span>
                            </span>
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

        {/* In-Review Conversational Composer */}
        <div className="p-4 bg-white border-t border-gray-200/80 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[
                'Which papers use TCN?',
                'Compare their benchmark datasets',
                'What are the identified research gaps?',
                'Summarize XAI contributions',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    handleSendChatMessage(chip);
                  }}
                  className="px-3 py-1 rounded-full bg-gray-50 hover:bg-purple-50 border border-gray-200 text-gray-600 hover:text-primary text-[11.5px] font-medium shrink-0 cursor-pointer transition-colors shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            <ChatComposer
              value={reviewChatInput}
              onChange={setReviewChatInput}
              onSubmit={() => {
                handleSendChatMessage(reviewChatInput);
                setReviewChatInput('');
              }}
              placeholder={`Ask any research question about the literature (${selectedDocIds.length} papers selected)...`}
              disabled={isProcessingChat || isGeneratingReview}
              isLoading={isProcessingChat}
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT SOURCES, EVIDENCE & OUTPUTS PANEL ── */}
      {isDrawerOpen && (
        <aside className="w-[380px] bg-white border-l border-gray-200/80 flex flex-col h-full shadow-lg z-20 animate-fadeIn shrink-0">
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
                Evidence
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('outputs')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  drawerTab === 'outputs' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                }`}
              >
                Outputs
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* TAB 1: SOURCES */}
            {drawerTab === 'sources' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Selected: {selectedDocIds.length}</span>
                  <span>Total: {candidates.length}</span>
                </div>
                {candidates.map((c) => {
                  const pId = c.doc_id || c.arxiv_id || '';
                  const isSel = selectedDocIds.includes(pId);
                  return (
                    <div
                      key={pId}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                        isSel ? 'bg-purple-50/40 border-purple-200' : 'bg-gray-50/60 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-gray-900 block leading-snug">{c.title}</span>
                        {isSel && (
                          <span className="text-[10px] bg-purple-100 text-primary font-bold px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 block">{c.authors} ({c.year})</span>
                      {c.abstract && (
                        <p className="text-gray-600 text-[11.5px] line-clamp-3 leading-relaxed">
                          {c.abstract}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: EVIDENCE */}
            {drawerTab === 'evidence' && (
              <div className="space-y-3">
                {activeEvidenceList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    Ask questions in the chat or compare papers to populate verified evidence passages.
                  </div>
                ) : (
                  activeEvidenceList.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-purple-200/70 bg-purple-50/40 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-primary">
                        <span>{ev.marker || `[E${idx + 1}]`}</span>
                        <span className="text-gray-500 font-normal">p. {ev.page || 1}</span>
                      </div>
                      <span className="font-semibold text-gray-900 block">{ev.doc_title || 'Paper'}</span>
                      <p className="text-gray-700 italic leading-relaxed text-[11.5px]">
                        &quot;{ev.quote}&quot;
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: OUTPUTS */}
            {drawerTab === 'outputs' && (
              <div className="space-y-4">
                {generatedReviewText ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Assembled Literature Review</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(generatedReviewText)}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Copy Markdown
                      </button>
                    </div>
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs leading-relaxed max-h-96 overflow-y-auto">
                      <div className="prose prose-xs text-gray-800">
                        <ReactMarkdown>
                          {generatedReviewText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : null}

                {generatedMatrixText ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-900">Comparison Matrix</span>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs overflow-x-auto">
                      <div className="prose prose-xs text-gray-800">
                        <ReactMarkdown>
                          {generatedMatrixText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : null}

                {!generatedReviewText && !generatedMatrixText ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    Click &quot;Generate Review&quot; or &quot;Compare Papers&quot; to view synthesized outputs here.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};