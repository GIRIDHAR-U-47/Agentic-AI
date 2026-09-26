import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';
import { analyzeIntent, IntentAnalysisResult } from '../services/intentService';

const TOOLS = [
  { icon: 'picture_as_pdf', label: 'Chat with PDF', path: '/chat-with-pdf' },
  { icon: 'menu_book', label: 'Literature Review', path: '/report' },
  { icon: 'edit_note', label: 'AI Writer', path: '/ai-writer' },
  { icon: 'shuffle', label: 'Paraphraser', path: '/paraphraser' },
  { icon: 'format_quote', label: 'Citation Generator', path: '/citation-generator' },
  { icon: 'policy', label: 'AI Detector', path: '/ai-detector' },
];

const TOOL_ROW = [
  { icon: 'picture_as_pdf', label: 'Chat with PDF', path: '/chat-with-pdf' },
  { icon: 'menu_book', label: 'Literature Review', path: '/report' },
  { icon: 'edit_note', label: 'AI Writer', path: '/ai-writer' },
  { icon: 'shuffle', label: 'Paraphraser', path: '/paraphraser' },
  { icon: 'format_quote', label: 'Citation Generator', path: '/citation-generator' },
  { icon: 'policy', label: 'AI Detector', path: '/ai-detector' },
];

interface WorkspaceCard {
  id: string;
  type: 'recent' | 'suggested';
  tag: string;
  topic: string;
  domain: string;
  paperCount: number;
  lastActivity: string;
  statusColor?: string;
}

const WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    id: 'ws-1',
    type: 'recent',
    tag: 'Recent Workspace',
    topic: 'Explainable Metaheuristic Optimized Deep Temporal Learning for Multi-Horizon Data Center Power Forecasting',
    domain: 'Power Grid Telemetry & Deep Time-Series',
    paperCount: 18,
    lastActivity: 'Active 5m ago',
    statusColor: 'bg-emerald-500',
  },
  {
    id: 'ws-2',
    type: 'suggested',
    tag: 'Suggested Workspace',
    topic: 'Interpretable Machine Learning Models for Industrial Energy Consumption & Load Shedding',
    domain: 'Energy Optimization & Systematic Review',
    paperCount: 14,
    lastActivity: 'Updated 2h ago',
    statusColor: 'bg-[#FED889]',
  },
  {
    id: 'ws-3',
    type: 'suggested',
    tag: 'Suggested Workspace',
    topic: 'Comparative Analysis of Spatio-Temporal Graph Neural Networks for Renewable Grid Forecasting',
    domain: 'ST-GNN Architecture & Benchmarks',
    paperCount: 12,
    lastActivity: 'Updated yesterday',
    statusColor: 'bg-[#9C68BC]',
  },
];

export const ResearchHome: React.FC = () => {
  const {
    setQuery,
    setCurrentSessionTitle,
    setGeneratedSubQueries,
    setIntentPayload,
    showToast
  } = useResearch();

  const [localInput, setLocalInput] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [liveIntent, setLiveIntent] = useState<IntentAnalysisResult | null>(null);

  // Agentic RAG Modal State
  const [isRagRunning, setIsRagRunning] = useState(false);
  const [ragProgress, setRagProgress] = useState(0);
  const [activeRagStep, setActiveRagStep] = useState(0);
  const [currentRagTopic, setCurrentRagTopic] = useState('');
  const [discoveredSubQueries, setDiscoveredSubQueries] = useState<string[]>([]);

  const navigate = useNavigate();
  const toolsRef = useRef<HTMLDivElement>(null);

  // Analyze intent on keystroke
  useEffect(() => {
    if (localInput.trim().length > 3) {
      const detected = analyzeIntent(localInput);
      setLiveIntent(detected);
    } else {
      setLiveIntent(null);
    }
  }, [localInput]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setShowTools(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = () => {
    const trimmed = localInput.trim();
    if (!trimmed) return;

    const analysis = analyzeIntent(trimmed);

    // If dedicated single tool command (e.g. paraphrase or citation extraction), route appropriately
    if (
      analysis.intent !== 'RESEARCH_TOPIC' &&
      analysis.intent !== 'RESEARCH_QUESTION'
    ) {
      setIntentPayload({
        intent: analysis.intent,
        text: analysis.extractedPayload,
        prompt: analysis.extractedPayload,
        doi: analysis.citationDoi,
        template: analysis.suggestedTemplate,
        topic: analysis.extractedTopic
      });
      showToast(`🎯 ${analysis.badgeLabel} detected → Launching workflow...`);
      navigate(analysis.targetPath);
      return;
    }

    // Default flow: Launch Agentic RAG sequence and open Workspace
    setCurrentRagTopic(analysis.sessionTitle || trimmed);
    setDiscoveredSubQueries(analysis.generatedSubQueries);
    setIsRagRunning(true);
    setRagProgress(15);
    setActiveRagStep(1);

    // Step 2: Generating search queries
    setTimeout(() => {
      setRagProgress(38);
      setActiveRagStep(2);
    }, 600);

    // Step 3: Searching academic sources
    setTimeout(() => {
      setRagProgress(65);
      setActiveRagStep(3);
    }, 1300);

    // Step 4: Analyzing papers
    setTimeout(() => {
      setRagProgress(85);
      setActiveRagStep(4);
    }, 2000);

    // Step 5: Synthesizing findings & Workspace opening
    setTimeout(() => {
      setRagProgress(100);
      setActiveRagStep(5);
    }, 2700);

    setTimeout(() => {
      setQuery(trimmed);
      setCurrentSessionTitle(analysis.sessionTitle || trimmed);
      setGeneratedSubQueries(analysis.generatedSubQueries);
      setIsRagRunning(false);
      navigate('/research');
    }, 3400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleToolSelect = (tool: typeof TOOLS[0]) => {
    setShowTools(false);
    navigate(tool.path);
  };

  const handleCardSelect = (card: WorkspaceCard) => {
    setLocalInput(card.topic);
    const analysis = analyzeIntent(card.topic);
    setCurrentRagTopic(card.topic);
    setDiscoveredSubQueries(analysis.generatedSubQueries);
    setIsRagRunning(true);
    setRagProgress(25);
    setActiveRagStep(1);

    setTimeout(() => { setRagProgress(55); setActiveRagStep(2); }, 500);
    setTimeout(() => { setRagProgress(85); setActiveRagStep(3); }, 1100);
    setTimeout(() => { setRagProgress(100); setActiveRagStep(5); }, 1700);

    setTimeout(() => {
      setQuery(card.topic);
      setCurrentSessionTitle(card.topic);
      setGeneratedSubQueries(analysis.generatedSubQueries);
      setIsRagRunning(false);
      navigate('/research');
    }, 2200);
  };

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-0 w-full max-w-5xl mx-auto min-h-[calc(100vh-56px)] bg-[#FCFBFE] relative">
      {/* ── HERO ── */}
      <div className="w-full flex flex-col items-center justify-center pt-16 pb-6">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md bg-gradient-to-tr from-[#3F1A57] to-[#7B3A9E] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[26px]">science</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[22px] font-bold text-[#3F1A57] tracking-tight leading-none">R-Lens</span>
            <span className="text-[11.5px] text-outline font-medium tracking-wide">Research Intelligence Bench</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-[32px] sm:text-[38px] font-bold text-[#1D1A20] text-center leading-tight tracking-tight mb-8 max-w-2xl">
          What are you researching today?
        </h1>

        {/* ── HERO RESEARCH INPUT CARD ── */}
        <div
          id="home-input-card"
          className="w-full max-w-[760px] bg-white border-2 border-[#E3D9E8] rounded-2xl shadow-[0_8px_32px_rgba(63,26,87,0.07)] flex flex-col transition-all duration-200 focus-within:border-[#5F2781] focus-within:shadow-[0_12px_40px_rgba(95,39,129,0.14)]"
        >
          {/* Live Intent Classification Pill */}
          {liveIntent && (
            <div className="px-5 pt-3 pb-1 flex items-center justify-between animate-fadeIn">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F5ECF9] text-[#5F2781] border border-[#E8DCF0]">
                <span className="material-symbols-outlined text-[14px] text-[#5F2781]">{liveIntent.badgeIcon}</span>
                <span>Detected: {liveIntent.badgeLabel}</span>
              </div>
              <span className="text-[11px] text-outline">Press Enter to start research</span>
            </div>
          )}

          {/* Hero Textarea */}
          <textarea
            id="home-query-input"
            className="w-full bg-transparent border-0 resize-none font-body text-[16px] text-[#1D1A20] placeholder-[#8F8495] focus:outline-none leading-relaxed px-5 pt-4 pb-3 min-h-[92px]"
            placeholder="What are you researching today?"
            value={localInput}
            onChange={e => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            rows={3}
          />

          {/* Toolbar */}
          <div className="px-4 pb-3.5 pt-2 flex items-center justify-between gap-3 border-t border-[#F5EDFA]">
            {/* Left: Tools Dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                id="home-tools-btn"
                type="button"
                onClick={() => setShowTools(!showTools)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-[#F5ECF9] hover:text-[#5F2781] text-[13px] font-medium transition-colors border border-transparent hover:border-[#EBDFF1] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-[#5F2781]">widgets</span>
                <span>Tools</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>

              {showTools && (
                <div className="absolute bottom-11 left-0 w-64 bg-white rounded-xl shadow-xl border border-[#E5DDE9] py-2 z-50 animate-scaleIn">
                  <div className="px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-outline">
                    Research Features
                  </div>
                  {TOOLS.map(tool => (
                    <button
                      key={tool.label}
                      id={`tool-${tool.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => handleToolSelect(tool)}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#F7F2F9] flex items-center gap-2.5 cursor-pointer text-on-surface transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[17px] text-[#5F2781]">{tool.icon}</span>
                      <span>{tool.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Send / Action Button */}
            <div className="flex items-center gap-2">
              <button
                id="home-send-btn"
                type="button"
                onClick={handleSubmit}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-[13.5px] transition-all shadow-sm cursor-pointer ${
                  localInput.trim()
                    ? 'bg-gradient-to-r from-[#5F2781] to-[#7B3A9E] hover:from-[#4A176B] hover:to-[#6A2B8A] scale-100 hover:scale-[1.02] shadow-[#5F2781]/20'
                    : 'bg-[#C4B2CC] cursor-not-allowed opacity-60'
                }`}
                disabled={!localInput.trim()}
                title="Start Agentic Research"
              >
                <span>Start Research</span>
                <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── ACTUAL FEATURES ROW ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          {TOOL_ROW.map(tool => (
            <button
              key={tool.label}
              id={`feature-chip-${tool.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => navigate(tool.path)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E5DDE9] hover:border-[#9C68BC] hover:bg-[#FAF7FC] text-[#4D4450] text-[13px] font-medium transition-all shadow-xs cursor-pointer hover:shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px] text-[#5F2781]">{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── RECENT & SUGGESTED WORKSPACES ── */}
      <div className="w-full max-w-[760px] mt-4 mb-12">
        <div className="flex items-center justify-between gap-2 mb-3.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-outline">
              Recent &amp; Suggested Workspaces
            </span>
          </div>
          <span className="text-[11.5px] text-outline font-medium">Click to resume research</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {WORKSPACE_CARDS.map(card => (
            <div
              key={card.id}
              id={`workspace-card-${card.id}`}
              onClick={() => handleCardSelect(card)}
              className="bg-white border border-[#E5DDE9] hover:border-[#7B3A9E] rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md group bg-gradient-to-b hover:from-[#FAF7FC] hover:to-white"
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] font-bold text-[#5F2781] bg-[#F5ECF9] px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {card.tag}
                  </span>
                  {card.statusColor && (
                    <span className={`w-2 h-2 rounded-full ${card.statusColor} ring-2 ring-white`} title="Workspace Status" />
                  )}
                </div>

                {/* Research Topic Title */}
                <h3 className="text-[13.5px] font-semibold text-[#1D1A20] group-hover:text-[#5F2781] leading-snug line-clamp-3 transition-colors mb-1.5">
                  {card.topic}
                </h3>

                {/* Research Domain / Category */}
                <p className="text-[11.5px] text-[#7A6E82] line-clamp-1">
                  {card.domain}
                </p>
              </div>

              {/* Stats Footer: Paper count & Last activity */}
              <div className="pt-4 border-t border-[#F5EDFA] mt-3 flex items-center justify-between text-[11.5px] text-outline">
                <div className="flex items-center gap-1 font-medium text-[#4D4450]">
                  <span className="material-symbols-outlined text-[15px] text-[#5F2781]">description</span>
                  <span>{card.paperCount} papers</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-outline">
                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                  <span>{card.lastActivity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AGENTIC RAG PROGRESS MODAL ── */}
      {isRagRunning && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E3D9E8] p-6 sm:p-7 animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E6F4]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F5ECF9] text-[#5F2781] flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1D1A20]">R-Lens Agentic RAG in Progress</h3>
                  <p className="text-[12px] text-outline line-clamp-1">{currentRagTopic}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E8F5ED] text-[#2D5A3D]">
                {ragProgress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#F2ECF5] h-2 rounded-full mt-4 mb-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#5F2781] to-[#9C68BC] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${ragProgress}%` }}
              />
            </div>

            {/* Agent Steps */}
            <div className="space-y-3.5 mb-6">
              {[
                { step: 1, title: 'Understanding research scope & key parameters', desc: 'Identified multi-horizon, power grid telemetry & deep sequence domain' },
                { step: 2, title: 'Decomposing into 5 sub-queries', desc: 'Generated orthogonal search directions across transformer and linear baselines' },
                { step: 3, title: 'Searching academic papers (arXiv, IEEE Xplore, CrossRef)', desc: 'Federated retrieval across 42 candidate paper abstracts' },
                { step: 4, title: 'Analyzing relevant papers & extracting empirical metrics', desc: 'Cross-encoder scoring (Threshold ≥ 85%) & extracting MSE/MAE benchmarks' },
                { step: 5, title: 'Identifying research gaps & synthesizing workspace', desc: 'Compiled evidence matrix and initializing research session' }
              ].map(s => {
                const isCompleted = activeRagStep > s.step;
                const isActive = activeRagStep === s.step;

                return (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                      ) : isActive ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#5F2781] border-t-transparent animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[#C4B2CC] text-[18px]">radio_button_unchecked</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[13px] font-semibold ${isActive ? 'text-[#5F2781]' : isCompleted ? 'text-[#1D1A20]' : 'text-outline'}`}>
                        {s.title}
                      </p>
                      <p className="text-[11.5px] text-outline">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-queries preview */}
            {discoveredSubQueries.length > 0 && activeRagStep >= 2 && (
              <div className="bg-[#FAF7FC] border border-[#EFE5F5] rounded-xl p-3 mb-2">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#5F2781] mb-1.5">
                  Generated Search Directions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {discoveredSubQueries.map((sq, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] bg-white border border-[#E3D9E8] text-[#3F1A57]">
                      • {sq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
