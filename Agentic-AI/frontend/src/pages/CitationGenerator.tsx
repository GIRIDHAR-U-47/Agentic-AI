import React, { useState } from 'react';
import { useResearch } from '../context/ResearchContext';

const FORMATS = ['APA 7th', 'MLA 9th', 'IEEE', 'Chicago', 'Vancouver', 'Harvard'];

interface CitationResult {
  format: string;
  text: string;
}

const SAMPLE_CITATIONS: Record<string, string> = {
  'APA 7th':
    'Nie, Y., Nguyen, N. H., Sinthong, P., & Kalagnanam, J. (2023). A time series is worth 64 words: Long-term forecasting with transformers. *International Conference on Learning Representations*.',
  'MLA 9th':
    'Nie, Yuqi, et al. "A Time Series Is Worth 64 Words: Long-Term Forecasting with Transformers." *International Conference on Learning Representations*, 2023.',
  IEEE:
    'Y. Nie, N. H. Nguyen, P. Sinthong, and J. Kalagnanam, "A time series is worth 64 words: Long-term forecasting with transformers," in *Proc. ICLR*, 2023.',
  Chicago:
    'Nie, Yuqi, Nam H. Nguyen, Phanwadee Sinthong, and Jayant Kalagnanam. "A Time Series Is Worth 64 Words: Long-Term Forecasting with Transformers." Paper presented at ICLR, 2023.',
  Vancouver:
    'Nie Y, Nguyen NH, Sinthong P, Kalagnanam J. A time series is worth 64 words: Long-term forecasting with transformers. ICLR. 2023.',
  Harvard:
    'Nie, Y., Nguyen, N.H., Sinthong, P. and Kalagnanam, J., 2023. A time series is worth 64 words: Long-term forecasting with transformers. *ICLR*.',
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
            FORMATS.map((fmt) => ({
              format: fmt,
              text: SAMPLE_CITATIONS[fmt] ?? SAMPLE_CITATIONS['APA 7th'],
            }))
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
        FORMATS.map((fmt) => ({
          format: fmt,
          text: SAMPLE_CITATIONS[fmt] ?? SAMPLE_CITATIONS['APA 7th'],
        }))
      );
    }, 1000);
  };

  const handleCopy = (text: string, idx: number) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    showToast('Citation copied!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFC] px-4 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Citation Generator
          </h1>
          <p className="text-[14px] text-gray-500">
            Generate accurate citations in any format from a DOI, URL, or manual entry
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 mb-6 shadow-2xs">
          {/* Type tabs */}
          <div className="flex gap-1 mb-4 p-1 bg-gray-100/90 rounded-xl w-fit border border-gray-200/50">
            {(['doi', 'url', 'manual'] as const).map((type) => (
              <button
                key={type}
                id={`citation-type-${type}`}
                onClick={() => setInputType(type)}
                type="button"
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer capitalize ${
                  inputType === type
                    ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {type === 'doi' ? 'DOI' : type === 'url' ? 'URL / ArXiv' : 'Manual Entry'}
              </button>
            ))}
          </div>

          {/* Input field */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400 pointer-events-none">
                {inputType === 'doi' ? 'tag' : inputType === 'url' ? 'link' : 'edit'}
              </span>
              <input
                id="citation-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder={
                  inputType === 'doi'
                    ? 'e.g. 10.1145/3394486.3403084'
                    : inputType === 'url'
                    ? 'e.g. https://arxiv.org/abs/2211.14730'
                    : 'Author, Year, Title, Journal...'
                }
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/10 transition-all font-body"
              />
            </div>
            <button
              id="citation-generate-btn"
              onClick={handleGenerate}
              type="button"
              disabled={!inputValue.trim() || isLoading}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all cursor-pointer flex items-center gap-2 ${
                inputValue.trim() && !isLoading
                  ? 'bg-primary hover:bg-primary-hover shadow-2xs'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">format_quote</span>
              <span>{isLoading ? 'Generating...' : 'Generate'}</span>
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] text-gray-500 font-medium">Fetching citation metadata...</span>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3 animate-fadeIn">
            <h2 className="text-[14px] font-bold text-gray-900 mb-2">Available Formats</h2>
            {results.map((r, idx) => (
              <div
                key={r.format}
                id={`citation-result-${r.format.toLowerCase().replace(/\s+/g, '-')}`}
                className={`bg-white border rounded-2xl p-4 transition-all duration-150 shadow-2xs ${
                  selectedFormat === r.format
                    ? 'border-purple-300 ring-2 ring-purple-100'
                    : 'border-gray-200/80 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFormat(r.format)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="inline-block text-[11px] font-semibold text-primary bg-purple-50 border border-purple-200/60 px-2.5 py-0.5 rounded-full mb-2">
                      {r.format}
                    </span>
                    <p
                      className="text-[13.5px] text-gray-900 leading-relaxed font-body"
                      dangerouslySetInnerHTML={{
                        __html: r.text.replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>'),
                      }}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(r.text.replace(/\*(.*?)\*/g, '$1'), idx);
                    }}
                    type="button"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-primary text-[12px] text-gray-700 hover:text-primary font-medium cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedIdx === idx ? 'check' : 'content_copy'}
                    </span>
                    {copiedIdx === idx ? 'Copied' : 'Copy'}
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
