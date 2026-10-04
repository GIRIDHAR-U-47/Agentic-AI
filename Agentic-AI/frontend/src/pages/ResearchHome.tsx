import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import { api } from '../services/api';
import { analyzeIntent, IntentAnalysisResult } from '../services/intentService';

interface RecentResearchItem {
  id: string;
  topic: string;
  domain: string;
  timeAgo: string;
  papersCount: number;
}

const RECENT_RESEARCH: RecentResearchItem[] = [
  {
    id: 'ws-1',
    topic: 'Explainable Metaheuristic Optimized Deep Temporal Learning for Multi-Horizon Data Center Power Forecasting',
    domain: 'Power Grid Telemetry & Deep Time-Series',
    timeAgo: '5m ago',
    papersCount: 18,
  },
  {
    id: 'ws-2',
    topic: 'Interpretable Machine Learning Models for Industrial Energy Consumption & Load Shedding',
    domain: 'Energy Optimization & Review',
    timeAgo: '2h ago',
    papersCount: 14,
  },
  {
    id: 'ws-3',
    topic: 'Comparative Analysis of Spatio-Temporal Graph Neural Networks for Renewable Grid Forecasting',
    domain: 'ST-GNN Architecture & Benchmarks',
    timeAgo: 'Yesterday',
    papersCount: 12,
  },
];

export const ResearchHome: React.FC = () => {
  const {
    setQuery,
    setCurrentSessionTitle,
    showToast,
  } = useResearch();

  const [localInput, setLocalInput] = useState('');
  const [liveIntent, setLiveIntent] = useState<IntentAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        startResearch(
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
    showToast(`Initializing research session for "${trimmed.slice(0, 45)}..."`);

    try {
      const res = await api.sessions.create(trimmed, 'agentic_rag', true);
      setQuery(trimmed);
      setCurrentSessionTitle(trimmed);
      navigate(`/research?session=${res.session_id}`);
    } catch {
      // If backend session creation fails, proceed to workspace with query
      setQuery(trimmed);
      setCurrentSessionTitle(trimmed);
      navigate('/research');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    startResearch(localInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto min-h-[calc(100vh-56px)] select-none">
      <div className="w-full flex-1 flex flex-col items-center justify-center max-w-3xl my-auto">
        {/* R-Lens Brand Header */}
        <div className="flex flex-col items-center text-center mb-8 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B21B6] to-[#7C3AED] flex items-center justify-center shadow-md mb-4">
            <span className="material-symbols-outlined text-white text-[28px]">
              science
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            What are you researching today?
          </h1>
          <p className="text-[14.5px] sm:text-[15.5px] text-gray-500 max-w-lg leading-relaxed">
            Ask a question, paste a topic, or describe what you want to investigate.
          </p>
        </div>

        {/* Large ChatGPT / Gemini-Style Composer Card */}
        <div
          id="home-input-card"
          className="w-full bg-white border border-gray-200/90 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:border-gray-300 focus-within:border-primary/80 focus-within:ring-3 focus-within:ring-primary/10 transition-all duration-200 flex flex-col"
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
        </div>

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

      {/* Lightweight Recent Research Section (Per Requirement 13) */}
      <div className="w-full max-w-3xl mt-6 pt-4 border-t border-gray-200/60">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
            Recent Research
          </span>
          <span className="text-[11.5px] text-gray-400">Click to resume</span>
        </div>

        <div className="divide-y divide-gray-100 rounded-xl bg-white border border-gray-200/70 overflow-hidden shadow-2xs">
          {RECENT_RESEARCH.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setLocalInput(item.topic);
                startResearch(item.topic);
              }}
              className="px-4 py-3 hover:bg-gray-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-[17px] text-gray-400 group-hover:text-primary transition-colors shrink-0">
                  history
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13.5px] font-medium text-gray-800 group-hover:text-primary truncate transition-colors">
                    {item.topic}
                  </span>
                  <span className="text-[11.5px] text-gray-400 truncate">
                    {item.domain}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                <span className="hidden sm:inline text-gray-500">
                  {item.papersCount} papers
                </span>
                <span>{item.timeAgo}</span>
                <span className="material-symbols-outlined text-[15px] text-gray-300 group-hover:text-gray-500 transition-colors">
                  chevron_right
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
