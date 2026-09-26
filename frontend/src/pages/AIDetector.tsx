import React, { useState } from 'react';

interface AnalysisResult {
  score: number; // 0-100: % AI generated
  breakdown: { label: string; pct: number }[];
  highlights: { text: string; aiProb: number }[];
}

const MOCK_RESULT: AnalysisResult = {
  score: 72,
  breakdown: [
    { label: 'Very likely AI', pct: 42 },
    { label: 'Possibly AI', pct: 30 },
    { label: 'Unclear', pct: 14 },
    { label: 'Likely Human', pct: 14 },
  ],
  highlights: [
    { text: 'The proposed methodology demonstrates significant efficacy in addressing the inherent complexities associated with multi-horizon temporal prediction tasks.', aiProb: 91 },
    { text: 'Empirical evaluations substantiate the model\'s superiority over contemporary baselines, yielding a 15.3% reduction in Mean Absolute Error metrics.', aiProb: 85 },
    { text: 'We ran experiments on three public datasets.', aiProb: 22 },
    { text: 'The results were better than we expected, especially for long-term forecasts.', aiProb: 18 },
  ],
};

function getScoreLabel(score: number) {
  if (score >= 75) return { label: 'Likely AI-Generated', color: '#BA1A1A', bg: '#FFDAD6' };
  if (score >= 50) return { label: 'Possibly AI-Generated', color: '#B45309', bg: '#FEF3C7' };
  if (score >= 25) return { label: 'Possibly Human-Written', color: '#755A18', bg: '#FEF6E4' };
  return { label: 'Likely Human-Written', color: '#2D5A3D', bg: '#E8F5ED' };
}

function getHighlightColor(prob: number) {
  if (prob >= 80) return 'bg-red-100 border-b-2 border-red-400';
  if (prob >= 50) return 'bg-amber-100 border-b-2 border-amber-400';
  if (prob >= 30) return 'bg-yellow-50 border-b border-yellow-300';
  return '';
}

import { useResearch } from '../context/ResearchContext';

export const AIDetector: React.FC = () => {
  const { intentPayload, setIntentPayload } = useResearch();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  React.useEffect(() => {
    if (intentPayload && intentPayload.intent === 'AI_DETECTION') {
      const val = intentPayload.text || '';
      if (val) {
        setInputText(val);
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setResult(MOCK_RESULT);
        }, 1100);
      }
      setIntentPayload(null);
    }
  }, [intentPayload, setIntentPayload]);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  const handleAnalyze = () => {
    if (!inputText.trim() || wordCount < 30) return;
    setIsLoading(true);
    setResult(null);
    setTimeout(() => {
      setIsLoading(false);
      setResult(MOCK_RESULT);
    }, 1400);
  };

  const scoreInfo = result ? getScoreLabel(result.score) : null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FCFBFE] px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-[#1D1A20] tracking-tight mb-1">AI Detector</h1>
          <p className="text-[14px] text-on-surface-variant">Detect AI-generated content in research papers and academic writing</p>
        </div>

        {/* Input */}
        <div className="bg-white border border-[#E5DDE9] rounded-2xl mb-5 overflow-hidden focus-within:border-[#9C68BC] transition-colors">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFE9F3]">
            <span className="text-[13px] font-semibold text-[#1D1A20]">Paste text to analyze</span>
            <span className={`text-[12px] font-medium ${wordCount < 30 && wordCount > 0 ? 'text-error' : 'text-outline'}`}>
              {wordCount} words {wordCount < 30 ? '(min. 30)' : ''}
            </span>
          </div>
          <textarea
            id="ai-detector-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste your research text, abstract, or paragraphs here (minimum 30 words)..."
            className="w-full min-h-[200px] p-5 bg-transparent resize-none border-0 focus:outline-none text-[14px] text-[#1D1A20] placeholder-[#8F8495] leading-relaxed"
          />
          <div className="px-4 py-3 border-t border-[#EFE9F3] flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setInputText(''); setResult(null); }}
              className="text-[12px] text-outline hover:text-error cursor-pointer"
            >
              Clear
            </button>
            <button
              id="ai-detector-btn"
              onClick={handleAnalyze}
              type="button"
              disabled={wordCount < 30}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer ${
                wordCount >= 30 ? 'bg-[#5F2781] hover:bg-[#4A176B]' : 'bg-[#C4B2CC] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">policy</span>
              Analyze Text
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-[#ECD9F3] rounded-full" />
              <div className="absolute inset-0 border-4 border-[#5F2781] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[13px] text-outline">Analyzing writing patterns and AI signatures...</p>
          </div>
        )}

        {/* Results */}
        {result && scoreInfo && (
          <div className="space-y-4">
            {/* Score Card */}
            <div className="bg-white border border-[#E5DDE9] rounded-2xl p-6">
              <div className="flex items-start gap-6">
                {/* Gauge */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#EFE9F3" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={scoreInfo.color}
                        strokeWidth="10"
                        strokeDasharray={`${result.score * 2.638} ${263.8}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[22px] font-bold text-[#1D1A20]">{result.score}%</span>
                      <span className="text-[10px] text-outline font-medium">AI</span>
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ color: scoreInfo.color, backgroundColor: scoreInfo.bg }}
                  >
                    {scoreInfo.label}
                  </span>
                </div>

                {/* Breakdown */}
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-[#1D1A20] mb-3">Breakdown</h3>
                  <div className="space-y-2.5">
                    {result.breakdown.map(b => (
                      <div key={b.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12.5px] text-[#1D1A20]">{b.label}</span>
                          <span className="text-[12px] font-semibold text-outline">{b.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#EFE9F3] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#5F2781] transition-all"
                            style={{ width: `${b.pct}%`, opacity: b.label.includes('AI') ? 1 : 0.4 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Highlighted text */}
            <div className="bg-white border border-[#E5DDE9] rounded-2xl p-5">
              <h3 className="text-[14px] font-semibold text-[#1D1A20] mb-4">Sentence Analysis</h3>
              <div className="space-y-3">
                {result.highlights.map((h, i) => (
                  <div key={i} id={`highlight-${i}`} className="flex items-start gap-3">
                    <span className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                      h.aiProb >= 80 ? 'bg-red-100 text-red-700'
                      : h.aiProb >= 50 ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {h.aiProb}%
                    </span>
                    <p className={`text-[13.5px] leading-relaxed px-1 rounded ${getHighlightColor(h.aiProb)}`}>
                      {h.text}
                    </p>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-4 pt-3 border-t border-[#EFE9F3]">
                {[
                  { color: 'bg-red-200', label: 'Likely AI (>80%)' },
                  { color: 'bg-amber-200', label: 'Possibly AI (50-80%)' },
                  { color: 'bg-emerald-200', label: 'Likely Human (<30%)' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${l.color}`} />
                    <span className="text-[11px] text-outline">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
