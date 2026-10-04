import React, { useState } from 'react';
import { useResearch } from '../context/ResearchContext';

const MODES = [
  { id: 'academic', label: 'Academic', desc: 'Formal scholarly tone' },
  { id: 'fluency', label: 'Fluency', desc: 'Natural, readable prose' },
  { id: 'standard', label: 'Standard', desc: 'Balanced clarity' },
  { id: 'creative', label: 'Creative', desc: 'Expressive rewriting' },
];

const SAMPLE_OUTPUT =
  'The experimental results demonstrate a statistically significant enhancement in predictive accuracy, surpassing conventional baseline methodologies by a considerable margin. The proposed architectural framework exhibits robust generalization capabilities across diverse evaluation benchmarks, substantiating its applicability in real-world deployment scenarios.';

export const Paraphraser: React.FC = () => {
  const { showToast, intentPayload, setIntentPayload } = useResearch();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [activeMode, setActiveMode] = useState('academic');
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  React.useEffect(() => {
    if (intentPayload && intentPayload.intent === 'PARAPHRASE') {
      if (intentPayload.text) {
        setInputText(intentPayload.text);
        setWordCount(intentPayload.text.trim().split(/\s+/).length);
      }
      setIntentPayload(null);
    }
  }, [intentPayload, setIntentPayload]);

  const handleInput = (val: string) => {
    setInputText(val);
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0);
  };

  const handleParaphrase = () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setOutputText('');
    setTimeout(() => {
      setIsLoading(false);
      setOutputText(SAMPLE_OUTPUT);
    }, 1200);
  };

  const handleCopy = () => {
    if (outputText && navigator.clipboard) {
      navigator.clipboard.writeText(outputText);
      showToast('Paraphrased text copied!');
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFC] px-4 sm:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Paraphraser
          </h1>
          <p className="text-[14px] text-gray-500">
            Rewrite any text in your preferred academic style
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2.5 mb-5 flex-wrap">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              id={`paraphrase-mode-${mode.id}`}
              onClick={() => setActiveMode(mode.id)}
              type="button"
              className={`flex flex-col px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeMode === mode.id
                  ? 'bg-purple-50 border-purple-300 text-primary shadow-2xs font-semibold'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-[13px]">{mode.label}</span>
              <span
                className={`text-[11px] font-normal ${
                  activeMode === mode.id ? 'text-primary/80' : 'text-gray-400'
                }`}
              >
                {mode.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Two-panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input */}
          <div className="bg-white border border-gray-200/90 rounded-2xl flex flex-col overflow-hidden shadow-2xs focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <span className="text-[13px] font-semibold text-gray-800">Original Text</span>
              <span className="text-[11.5px] text-gray-400">{wordCount} / 1000 words</span>
            </div>
            <textarea
              id="paraphrase-input"
              value={inputText}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Paste or type your text here..."
              className="flex-1 min-h-[280px] p-4 bg-transparent resize-none border-0 focus:outline-none text-[14px] text-gray-900 placeholder-gray-400 leading-relaxed font-body"
            />
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setOutputText('');
                  setWordCount(0);
                }}
                className="text-[12px] text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
              >
                Clear
              </button>
              <button
                id="paraphrase-btn"
                onClick={handleParaphrase}
                type="button"
                disabled={!inputText.trim() || isLoading}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all cursor-pointer ${
                  inputText.trim() && !isLoading
                    ? 'bg-primary hover:bg-primary-hover shadow-2xs'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">shuffle</span>
                <span>{isLoading ? 'Paraphrasing...' : 'Paraphrase'}</span>
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="bg-white border border-gray-200/90 rounded-2xl flex flex-col overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <span className="text-[13px] font-semibold text-gray-800">Paraphrased Output</span>
              {outputText && (
                <button
                  id="paraphrase-copy-btn"
                  onClick={handleCopy}
                  type="button"
                  className="flex items-center gap-1 text-[11.5px] text-primary hover:underline cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  Copy
                </button>
              )}
            </div>
            <div className="flex-1 min-h-[280px] p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-[12.5px] text-gray-500">
                    Rewriting in {MODES.find((m) => m.id === activeMode)?.label} tone...
                  </p>
                </div>
              ) : outputText ? (
                <p className="text-[14px] text-gray-900 leading-relaxed whitespace-pre-wrap">{outputText}</p>
              ) : (
                <p className="text-[13.5px] text-gray-400 italic text-center py-24">
                  Your paraphrased text will appear here
                </p>
              )}
            </div>
            {outputText && (
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <button
                  type="button"
                  onClick={handleParaphrase}
                  className="flex items-center gap-1.5 text-[12px] text-primary border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 cursor-pointer font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Regenerate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
