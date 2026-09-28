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
    <div className="min-h-[calc(100vh-56px)] bg-[#FCFBFE] px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-[#1D1A20] tracking-tight mb-1">Paraphraser</h1>
          <p className="text-[14px] text-on-surface-variant">Rewrite any text in your preferred academic style</p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {MODES.map(mode => (
            <button
              key={mode.id}
              id={`paraphrase-mode-${mode.id}`}
              onClick={() => setActiveMode(mode.id)}
              type="button"
              className={`flex flex-col px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeMode === mode.id
                  ? 'bg-[#5F2781] border-[#5F2781] text-white shadow-sm'
                  : 'bg-white border-[#E5DDE9] text-[#4D4450] hover:border-[#9C68BC]'
              }`}
            >
              <span className="text-[13px] font-semibold">{mode.label}</span>
              <span className={`text-[11px] ${activeMode === mode.id ? 'text-[#E5B4FF]' : 'text-outline'}`}>
                {mode.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Two-panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input */}
          <div className="bg-white border border-[#E5DDE9] rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFE9F3]">
              <span className="text-[13px] font-semibold text-[#1D1A20]">Original Text</span>
              <span className="text-[11.5px] text-outline">{wordCount} / 1000 words</span>
            </div>
            <textarea
              id="paraphrase-input"
              value={inputText}
              onChange={e => handleInput(e.target.value)}
              placeholder="Paste or type your text here..."
              className="flex-1 min-h-[280px] p-4 bg-transparent resize-none border-0 focus:outline-none text-[14px] text-[#1D1A20] placeholder-[#8F8495] leading-relaxed"
            />
            <div className="px-4 py-3 border-t border-[#EFE9F3] flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setInputText(''); setOutputText(''); setWordCount(0); }}
                className="text-[12px] text-outline hover:text-error cursor-pointer"
              >
                Clear
              </button>
              <button
                id="paraphrase-btn"
                onClick={handleParaphrase}
                type="button"
                disabled={!inputText.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer ${
                  inputText.trim() ? 'bg-[#5F2781] hover:bg-[#4A176B]' : 'bg-[#C4B2CC] cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">shuffle</span>
                Paraphrase
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="bg-white border border-[#E5DDE9] rounded-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFE9F3]">
              <span className="text-[13px] font-semibold text-[#1D1A20]">Paraphrased Text</span>
              {outputText && (
                <button
                  id="paraphrase-copy-btn"
                  onClick={handleCopy}
                  type="button"
                  className="flex items-center gap-1 text-[11.5px] text-[#5F2781] hover:underline cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  Copy
                </button>
              )}
            </div>
            <div className="flex-1 min-h-[280px] p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-8 h-8 border-2 border-[#5F2781] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[13px] text-outline">Paraphrasing in {MODES.find(m => m.id === activeMode)?.label} mode...</p>
                </div>
              ) : outputText ? (
                <p className="text-[14px] text-[#1D1A20] leading-relaxed">{outputText}</p>
              ) : (
                <p className="text-[14px] text-outline italic text-center mt-8">
                  Your paraphrased text will appear here
                </p>
              )}
            </div>
            {outputText && (
              <div className="px-4 py-3 border-t border-[#EFE9F3] flex gap-2">
                <button
                  type="button"
                  onClick={handleParaphrase}
                  className="flex items-center gap-1.5 text-[12px] text-[#5F2781] border border-[#C4A8D6] px-3 py-1.5 rounded-lg hover:bg-[#F5ECF9] cursor-pointer font-medium"
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
