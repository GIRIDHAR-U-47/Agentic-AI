import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import { api } from '../services/api';
import { analyzeIntent, IntentAnalysisResult } from '../services/intentService';
import { Conversation } from '../types';
import rlensIcon from '../assets/rlens_icon.jpg';

function formatTimeAgo(timestampSeconds: number): string {
  if (!timestampSeconds) return 'Recently';
  const nowSec = Date.now() / 1000;
  const diffSec = Math.max(0, nowSec - timestampSeconds);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `${days}d ago`;
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ResearchHome: React.FC = () => {
  const {
    setQuery,
    setCurrentSessionTitle,
    showToast,
  } = useResearch();

  const [localInput, setLocalInput] = useState('');
  const [liveIntent, setLiveIntent] = useState<IntentAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);

  // Glow is active only when the input is empty (idle state)
  const isIdle = localInput.trim().length === 0 && !isLoading;

  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const h = Math.min(Math.max(el.scrollHeight, 60), 200);
    el.style.height = `${h}px`;
  }, [localInput]);

  // Analyze intent on keystroke
  useEffect(() => {
    if (localInput.trim().length > 3) {
      const detected = analyzeIntent(localInput);
      setLiveIntent(detected);
    } else {
      setLiveIntent(null);
    }
  }, [localInput]);

  // Load real recent conversations from backend
  const loadRecent = useCallback(async () => {
    try {
      const res = await api.conversations.list(undefined, 5);
      if (res.conversations && res.conversations.length > 0) {
        setRecentChats(res.conversations);
      }
    } catch {
      // Backend maybe offline
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const QUICK_ACTIONS = [
    {
      label: 'Search Papers',
      icon: 'search',
      action: () =>
        startResearch(
          localInput ||
            'Explainable Deep Learning for Short-Term Electricity Load Forecasting'
        ),
    },
    {
      label: 'Literature Review',
      icon: 'menu_book',
      action: () =>
        startLiteratureReview(
          localInput || 'Deep learning methods in multi-horizon time series forecasting'
        ),
    },
    {
      label: 'Research Gaps',
      icon: 'troubleshoot',
      action: () =>
        startResearch(
          localInput || 'Research gaps in explainable AI for energy systems'
        ),
    },
    {
      label: 'Compare Methods',
      icon: 'compare_arrows',
      action: () =>
        startResearch(
          localInput || 'Transformer vs LSTM vs TCN for time series load forecasting'
        ),
    },
    {
      label: 'Chat with Papers',
      icon: 'chat',
      action: () => navigate('/chat-with-pdf'),
    },
  ];

  const startResearch = async (topicToSearch: string) => {
    const trimmed = topicToSearch.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    showToast(`Initializing persistent research conversation...`);

    try {
      const conv = await api.conversations.create({
        mode: 'research',
        research_topic: trimmed,
        metadata: { source: 'home_composer' },
      });
      setQuery(trimmed);
      setCurrentSessionTitle(conv.title || trimmed);
      navigate(`/chat/${conv.id}`);
    } catch {
      // Fallback
      setQuery(trimmed);
      setCurrentSessionTitle(trimmed);
      navigate('/research');
    } finally {
      setIsLoading(false);
    }
  };

  const startLiteratureReview = async (topicToSearch: string) => {
    const trimmed = topicToSearch.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    showToast(`Initializing Literature Review workspace...`);

    try {
      const conv = await api.conversations.create({
        mode: 'literature_review',
        research_topic: trimmed,
        metadata: { source: 'home_composer', review_mode: 'agentic_rag' },
      });
      setQuery(trimmed);
      setCurrentSessionTitle(conv.title || trimmed);
      navigate(`/report/${conv.id}`);
    } catch {
      navigate('/report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (liveIntent?.intent === 'LITERATURE_REVIEW') {
      startLiteratureReview(localInput);
    } else {
      startResearch(localInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const openRecentChat = (conv: Conversation) => {
    setQuery(conv.research_topic || conv.title);
    setCurrentSessionTitle(conv.title);
    if (conv.mode === 'literature_review') {
      navigate(`/report/${conv.id}`);
    } else if (conv.mode === 'chat_with_paper' && conv.metadata?.doc_id) {
      navigate(`/paper-chat/${conv.metadata.doc_id}/${conv.id}`);
    } else {
      navigate(`/chat/${conv.id}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto min-h-[calc(100vh-56px)] select-none overflow-visible">
      <div className="w-full flex-1 flex flex-col items-center justify-center max-w-3xl my-auto overflow-visible">
        {/* R-Lens Brand Header */}
        <div className="flex flex-col items-center text-center mb-8 animate-fadeIn">
          <img
            src={rlensIcon}
            alt="R-Lens"
            className="w-16 h-16 rounded-2xl object-cover shadow-lg mb-4 ring-2 ring-purple-200/60"
            style={{ filter: 'drop-shadow(0 4px 24px rgba(124,58,237,0.25))' }}
          />

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            What are you researching today?
          </h1>
          <p className="text-[14.5px] sm:text-[15.5px] text-gray-500 max-w-lg leading-relaxed">
            Ask a question, paste a topic, or describe what you want to investigate.
          </p>
        </div>

        {/* Large ChatGPT / Gemini-Style Composer Card */}
        {/* ──────────────────────────────────────────────────────────── */}
        {/* MOON GLOW — a giant circular purple orb behind the card     */}
        {/* Fixed so it escapes container clipping like a real moon     */}
        {/* ──────────────────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="pointer-events-none"
          style={{
            position: 'fixed',
            width: '900px',
            height: '900px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -40%)',
            borderRadius: '50%',
            background: [
              'radial-gradient(circle at 50% 50%,',
              '  rgba(124, 58, 237, 0.45) 0%,',
              '  rgba(139, 92, 246, 0.32) 20%,',
              '  rgba(167, 139, 250, 0.18) 45%,',
              '  rgba(196, 181, 253, 0.07) 65%,',
              '  transparent 80%)',
            ].join(''),
            filter: 'blur(72px)',
            opacity: isIdle ? 1 : 0.12,
            transition: 'opacity 1s ease-in-out',
            animation: isIdle ? 'moonGlow 5s ease-in-out infinite' : 'none',
            zIndex: 0,
          }}
        />

        <div className="relative w-full" style={{ zIndex: 1 }}>
          <div
            id="home-input-card"
            className="relative w-full bg-white border border-gray-200/90 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:border-gray-300 focus-within:border-primary/80 focus-within:ring-3 focus-within:ring-primary/10 transition-all duration-200 flex flex-col"
          >
          {/* Live Intent Pill */}
          {liveIntent && (
            <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs animate-fadeIn">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium bg-purple-50 text-primary border border-purple-200/60">
                <span className="material-symbols-outlined text-[14px]">
                  {liveIntent.badgeIcon}
                </span>
                Detected: {liveIntent.badgeLabel}
              </span>
              <span className="text-gray-400">Press Enter ↵ to research</span>
            </div>
          )}

          {/* Multiline Textarea */}
          <textarea
            ref={textareaRef}
            id="home-query-input"
            rows={2}
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can explainable deep learning and metaheuristic optimization improve multi-horizon data center power forecasting?"
            className="w-full bg-transparent border-0 resize-none px-5 pt-4 pb-2 text-[15px] sm:text-[16px] text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed min-h-[64px] max-h-[220px]"
            autoFocus
          />

          {/* Composer Footer Actions */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="material-symbols-outlined text-[16px] text-primary">
                travel_explore
              </span>
              <span className="hidden sm:inline">
                OpenAlex · Semantic Scholar · Crossref · arXiv
              </span>
              <span className="sm:hidden">Global Academic Literature</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="home-send-btn"
                type="button"
                onClick={handleSubmit}
                disabled={!localInput.trim() || isLoading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13.5px] font-medium transition-all duration-150 cursor-pointer ${
                  localInput.trim() && !isLoading
                    ? 'bg-primary hover:bg-primary-hover shadow-sm active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>{isLoading ? 'Researching...' : 'Research'}</span>
                {isLoading ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[17px]">
                    arrow_upward
                  </span>
                )}
              </button>
            </div>
          </div>
          </div>{/* end inner card */}
        </div>{/* end glow wrapper */}

        {/* Compact Quick Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {QUICK_ACTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200/90 text-gray-600 hover:text-gray-900 text-[12.5px] font-medium transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Real Persistent Recent Research Section */}
      {recentChats.length > 0 && (
        <div className="w-full max-w-3xl mt-6 pt-4 border-t border-gray-200/60">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              Recent Research
            </span>
            <span className="text-[11.5px] text-gray-400">Click to resume</span>
          </div>

          <div className="divide-y divide-gray-100 rounded-xl bg-white border border-gray-200/70 overflow-hidden shadow-2xs">
            {recentChats.map((item) => {
              const modeIcon =
                item.mode === 'literature_review'
                  ? 'menu_book'
                  : item.mode === 'chat_with_paper'
                  ? 'picture_as_pdf'
                  : 'history';

              return (
                <div
                  key={item.id}
                  onClick={() => openRecentChat(item)}
                  className="px-4 py-3 hover:bg-gray-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-[17px] text-gray-400 group-hover:text-primary transition-colors shrink-0">
                      {modeIcon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13.5px] font-medium text-gray-800 group-hover:text-primary truncate transition-colors">
                        {item.title || item.research_topic || 'Untitled Research'}
                      </span>
                      <span className="text-[11.5px] text-gray-400 truncate">
                        {item.research_topic || 'Academic Research Conversation'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                    <span>{formatTimeAgo(item.updated_at)}</span>
                    <span className="material-symbols-outlined text-[15px] text-gray-300 group-hover:text-gray-500 transition-colors">
                      chevron_right
                    </span>
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
