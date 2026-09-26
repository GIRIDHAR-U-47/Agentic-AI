import React, { useState } from 'react';
import { useResearch } from '../context/ResearchContext';

const FORMATS = ['APA 7th', 'MLA 9th', 'IEEE', 'Chicago', 'Vancouver', 'Harvard'];

interface CitationResult {
  format: string;
  text: string;
}

const SAMPLE_CITATIONS: Record<string, string> = {
  'APA 7th': 'Nie, Y., Nguyen, N. H., Sinthong, P., & Kalagnanam, J. (2023). A time series is worth 64 words: Long-term forecasting with transformers. *International Conference on Learning Representations*.',
  'MLA 9th': 'Nie, Yuqi, et al. "A Time Series Is Worth 64 Words: Long-Term Forecasting with Transformers." *International Conference on Learning Representations*, 2023.',
  'IEEE': 'Y. Nie, N. H. Nguyen, P. Sinthong, and J. Kalagnanam, "A time series is worth 64 words: Long-term forecasting with transformers," in *Proc. ICLR*, 2023.',
  'Chicago': 'Nie, Yuqi, Nam H. Nguyen, Phanwadee Sinthong, and Jayant Kalagnanam. "A Time Series Is Worth 64 Words: Long-Term Forecasting with Transformers." Paper presented at ICLR, 2023.',
  'Vancouver': 'Nie Y, Nguyen NH, Sinthong P, Kalagnanam J. A time series is worth 64 words: Long-term forecasting with transformers. ICLR. 2023.',
  'Harvard': 'Nie, Y., Nguyen, N.H., Sinthong, P. and Kalagnanam, J., 2023. A time series is worth 64 words: Long-term forecasting with transformers. *ICLR*.',
};

export const CitationGenerator: React.FC = () => {
  const { showToast, intentPayload, setIntentPayload } = useResearch();
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'doi' | 'url' | 'manual'>('doi');
  const [selectedFormat, setSelectedFormat] = useState('APA 7th');
  const [results, setResults] = useState<CitationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  React.useEffect(() => {
    if (intentPayload && intentPayload.intent === 'CITATION') {
      const val = intentPayload.doi || intentPayload.text || '';
      if (val) {
        setInputValue(val);
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          setResults(
            FORMATS.map(fmt => ({ format: fmt, text: SAMPLE_CITATIONS[fmt] ?? SAMPLE_CITATIONS['APA 7th'] }))
          );
        }, 900);
      }
      setIntentPayload(null);
    }
  }, [intentPayload, setIntentPayload]);

  const handleGenerate = () => {
    if (!inputValue.trim()) return;
    setIsLoading(true);
    setResults([]);
    setTimeout(() => {
      setIsLoading(false);
      setResults(
        FORMATS.map(fmt => ({ format: fmt, text: SAMPLE_CITATIONS[fmt] ?? SAMPLE_CITATIONS['APA 7th'] }))
      );
    }, 1100);
  };

  const handleCopy = (text: string, idx: number) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    showToast('Citation copied!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FCFBFE] px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-[#1D1A20] tracking-tight mb-1">Citation Generator</h1>
          <p className="text-[14px] text-on-surface-variant">Generate accurate citations in any format from a DOI, URL, or manual entry</p>
        </div>

        {/* Input Section */}
        <div className="bg-white border border-[#E5DDE9] rounded-2xl p-5 mb-5">
          {/* Type tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-[#F5EBF9] rounded-xl w-fit">
            {(['doi', 'url', 'manual'] as const).map(type => (
              <button
                key={type}
                id={`citation-type-${type}`}
                onClick={() => setInputType(type)}
                type="button"
                className={`px-4 py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer capitalize ${
                  inputType === type
                    ? 'bg-white text-[#3F1A57] shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {type === 'doi' ? 'DOI' : type === 'url' ? 'URL / ArXiv' : 'Manual Entry'}
              </button>
            ))}
          </div>

          {/* Input field */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">
                {inputType === 'doi' ? 'tag' : inputType === 'url' ? 'link' : 'edit'}
              </span>
              <input
                id="citation-input"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder={
                  inputType === 'doi'
                    ? 'e.g. 10.1145/3394486.3403084'
                    : inputType === 'url'
                    ? 'e.g. https://arxiv.org/abs/2211.14730'
                    : 'Author, Year, Title, Journal...'
                }
                className="w-full pl-9 pr-4 py-2.5 border border-[#E5DDE9] rounded-xl text-[13.5px] focus:outline-none focus:border-[#9C68BC] transition-colors"
              />
            </div>
            <button
              id="citation-generate-btn"
              onClick={handleGenerate}
              type="button"
              disabled={!inputValue.trim()}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer flex items-center gap-2 ${
                inputValue.trim() ? 'bg-[#5F2781] hover:bg-[#4A176B]' : 'bg-[#C4B2CC] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">format_quote</span>
              Generate
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-10">
            <div className="w-6 h-6 border-2 border-[#5F2781] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] text-outline">Fetching citation metadata...</span>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-semibold text-[#1D1A20] mb-2">Citations — All Formats</h2>
            {results.map((r, idx) => (
              <div
                key={r.format}
                id={`citation-result-${r.format.toLowerCase().replace(/\s+/g, '-')}`}
                className={`bg-white border rounded-xl p-4 transition-all ${
                  selectedFormat === r.format ? 'border-[#9C68BC] shadow-md' : 'border-[#E5DDE9]'
                }`}
                onClick={() => setSelectedFormat(r.format)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="inline-block text-[10.5px] font-bold text-[#5F2781] bg-[#F1E8F4] px-2 py-0.5 rounded-full mb-2">
                      {r.format}
                    </span>
                    <p className="text-[13px] text-[#1D1A20] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: r.text.replace(/\*(.*?)\*/g, '<em>$1</em>') }}
                    />
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleCopy(r.text.replace(/\*(.*?)\*/g, '$1'), idx); }}
                    type="button"
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5DDE9] hover:border-[#9C68BC] text-[12px] text-[#5F2781] font-medium cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedIdx === idx ? 'check' : 'content_copy'}
                    </span>
                    {copiedIdx === idx ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
