import React, { useState } from 'react';
import { useResearch } from '../context/ResearchContext';

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
    {
      text:
        'The proposed methodology demonstrates significant efficacy in addressing the inherent complexities associated with multi-horizon temporal prediction tasks.',
      aiProb: 91,
    },
    {
      text:
        "Empirical evaluations substantiate the model's superiority over contemporary baselines, yielding a 15.3% reduction in Mean Absolute Error metrics.",
      aiProb: 85,
    },
    { text: 'We ran experiments on three public datasets.', aiProb: 22 },
    { text: 'The results were better than we expected, especially for long-term forecasts.', aiProb: 18 },
  ],
};

function getScoreLabel(score: number) {
  if (score >= 75) return { label: 'Likely AI-Generated', color: '#DC2626', bg: '#FEE2E2' };
  if (score >= 50) return { label: 'Possibly AI-Generated', color: '#D97706', bg: '#FEF3C7' };
  if (score >= 25) return { label: 'Possibly Human-Written', color: '#B45309', bg: '#FEF9C3' };
  return { label: 'Likely Human-Written', color: '#059669', bg: '#D1FAE5' };
}

function getHighlightColor(prob: number) {
  if (prob >= 80) return 'bg-red-50 border-b-2 border-red-300';
  if (prob >= 50) return 'bg-amber-50 border-b-2 border-amber-300';
  if (prob >= 30) return 'bg-yellow-50 border-b border-yellow-200';
  return '';
}

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
    }, 1300);
  };

  const scoreInfo = result ? getScoreLabel(result.score) : null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFC] px-4 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">
            AI Detector
          </h1>
          <p className="text-[14px] text-gray-500">
            Detect AI-generated content in research papers and academic writing
          </p>
        </div>

        {/* Input */}
        <div className="bg-white border border-gray-200/90 rounded-2xl mb-6 overflow-hidden shadow-2xs focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <span className="text-[13px] font-semibold text-gray-800">Paste text to analyze</span>
            <span
              className={`text-[12px] font-medium ${
                wordCount < 30 && wordCount > 0 ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {wordCount} words {wordCount < 30 ? '(min. 30)' : ''}
            </span>
          </div>
          <textarea
            id="ai-detector-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your research text, abstract, or paragraphs here (minimum 30 words)..."
            className="w-full min-h-[180px] p-4 bg-transparent resize-none border-0 focus:outline-none text-[14px] text-gray-900 placeholder-gray-400 leading-relaxed font-body"
          />
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setResult(null);
              }}
              className="text-[12px] text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
            >
              Clear
            </button>
            <button
              id="ai-detector-btn"
              onClick={handleAnalyze}
              type="button"
              disabled={wordCount < 30 || isLoading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all cursor-pointer ${
                wordCount >= 30 && !isLoading
                  ? 'bg-primary hover:bg-primary-hover shadow-2xs'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">policy</span>
              <span>{isLoading ? 'Analyzing...' : 'Analyze Text'}</span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-gray-500 font-medium">
              Analyzing writing style, vocabulary distributions, and AI patterns...
            </p>
          </div>
        )}

        {/* Results */}
        {result && scoreInfo && (
          <div className="space-y-4 animate-fadeIn">
            {/* Score Card */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Gauge */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={scoreInfo.color}
                        strokeWidth="10"
                        strokeDasharray={`${result.score * 2.638} ${263.8}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[22px] font-bold text-gray-900">{result.score}%</span>
                      <span className="text-[10.5px] text-gray-400 font-medium">AI Match</span>
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: scoreInfo.color, backgroundColor: scoreInfo.bg }}
                  >
                    {scoreInfo.label}
                  </span>
                </div>

                {/* Breakdown */}
                <div className="flex-1 w-full">
                  <h3 className="text-[14px] font-bold text-gray-900 mb-3">Classification Breakdown</h3>
                  <div className="space-y-2.5">
                    {result.breakdown.map((b) => (
                      <div key={b.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12.5px] text-gray-700">{b.label}</span>
                          <span className="text-[12px] font-semibold text-gray-900">{b.pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{
                              width: `${b.pct}%`,
                              opacity: b.label.includes('AI') ? 1 : 0.4,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Highlighted text */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs">
              <h3 className="text-[14px] font-bold text-gray-900 mb-4">Sentence Breakdown</h3>
              <div className="space-y-3">
                {result.highlights.map((h, i) => (
                  <div key={i} id={`highlight-${i}`} className="flex items-start gap-3">
                    <span
                      className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        h.aiProb >= 80
                          ? 'bg-red-100 text-red-700'
                          : h.aiProb >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {h.aiProb}%
                    </span>
                    <p className={`text-[13.5px] leading-relaxed px-1 rounded font-body ${getHighlightColor(h.aiProb)}`}>
                      {h.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-5 pt-3 border-t border-gray-100 text-xs">
                {[
                  { color: 'bg-red-200', label: 'Likely AI (>80%)' },
                  { color: 'bg-amber-200', label: 'Possibly AI (50-80%)' },
                  { color: 'bg-emerald-200', label: 'Likely Human (<30%)' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${l.color}`} />
                    <span className="text-[11px] text-gray-500">{l.label}</span>
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
