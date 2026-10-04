import React, { useState, useRef } from 'react';
import { useResearch } from '../context/ResearchContext';

interface ExtractedItem {
  type: 'table' | 'figure' | 'stat' | 'equation';
  title: string;
  content: string;
  page: number;
}

const EXTRACT_OPTIONS = [
  { id: 'tables', icon: 'table_chart', label: 'Tables', desc: 'Extract all data tables' },
  { id: 'figures', icon: 'image', label: 'Figures', desc: 'Identify charts and diagrams' },
  { id: 'stats', icon: 'bar_chart', label: 'Statistics', desc: 'Pull key numerical results' },
  { id: 'equations', icon: 'functions', label: 'Equations', desc: 'Extract mathematical notation' },
];

const MOCK_RESULTS: ExtractedItem[] = [
  { type: 'table', title: 'Table 1: Benchmark Results on ETTh1', page: 5, content: 'MSE: 0.386, MAE: 0.400 (H=96) | MSE: 0.459, MAE: 0.444 (H=192) | MSE: 0.491, MAE: 0.466 (H=336)' },
  { type: 'stat', title: 'Key Performance Metric', page: 6, content: '15.3% improvement in MAE over FEDformer baseline across all prediction horizons' },
  { type: 'figure', title: 'Figure 3: Architecture Diagram', page: 3, content: 'Multi-head attention with patch embedding layer — 6 encoder blocks, d_model=128, patch_len=16, stride=8' },
  { type: 'equation', title: 'Equation 4: Patch Embedding', page: 4, content: 'x_patch = Flatten(x[i:i+L_P]) ∈ ℝ^(d_model), where L_P is patch length and i is stride index' },
  { type: 'stat', title: 'Dataset Statistics', page: 2, content: 'ETTh1: 17,420 records | Training: 8,640 | Validation: 2,880 | Test: 2,880 | Frequency: 1h' },
];

const ICONS: Record<string, string> = {
  table: 'table_chart',
  figure: 'image',
  stat: 'bar_chart',
  equation: 'functions',
};

const COLORS: Record<string, { bg: string; text: string }> = {
  table: { bg: '#EEF6FF', text: '#1E5F9A' },
  figure: { bg: '#F5ECF9', text: '#5F2781' },
  stat: { bg: '#FEF6E4', text: '#755A18' },
  equation: { bg: '#E8F5ED', text: '#2D5A3D' },
};

export const ExtractData: React.FC = () => {
  const { showToast } = useResearch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(['tables', 'stats']);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ExtractedItem[]>([]);

  const toggleOption = (id: string) => {
    setSelectedOptions(prev =>
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleFile = (file: File) => {
    if (file.type === 'application/pdf') {
      setPdfName(file.name);
      showToast(`PDF loaded: ${file.name}`);
    } else {
      showToast('Please upload a PDF file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleExtract = () => {
    if (!pdfName) return;
    setIsLoading(true);
    setResults([]);
    setTimeout(() => {
      setIsLoading(false);
      setResults(MOCK_RESULTS.filter(r => selectedOptions.includes(r.type === 'stat' ? 'stats' : `${r.type}s`)));
    }, 1500);
  };

  const handleCopyItem = (item: ExtractedItem) => {
    if (navigator.clipboard) navigator.clipboard.writeText(`${item.title}\n${item.content}`);
    showToast('Data copied!');
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFC] px-6 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight mb-1">Extract Data</h1>
          <p className="text-[14px] text-gray-500">Pull structured data from research PDFs automatically</p>
        </div>

        {/* Upload + Options Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Upload */}
          <div
            id="extract-upload-area"
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`min-h-[180px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
              isDragging ? 'border-purple-600 bg-purple-50/50'
              : pdfName ? 'border-purple-400 bg-purple-50/20'
              : 'border-gray-200 bg-white hover:border-purple-400 hover:bg-gray-50/60'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            {pdfName ? (
              <div className="text-center px-4">
                <span className="material-symbols-outlined text-[36px] text-purple-600">picture_as_pdf</span>
                <p className="text-[13px] font-semibold text-gray-900 mt-2 break-all">{pdfName}</p>
                <p className="text-[11.5px] text-emerald-600 mt-0.5">✓ Ready to extract</p>
              </div>
            ) : (
              <div className="text-center px-4">
                <span className="material-symbols-outlined text-[36px] text-gray-300">upload_file</span>
                <p className="text-[13px] font-semibold text-gray-800 mt-2">Upload PDF</p>
                <p className="text-[12px] text-gray-400">Drag &amp; drop or click to browse</p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">What to extract</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {EXTRACT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  id={`extract-opt-${opt.id}`}
                  onClick={() => toggleOption(opt.id)}
                  type="button"
                  className={`flex flex-col items-start p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    selectedOptions.includes(opt.id)
                      ? 'border-purple-500 bg-purple-50/60'
                      : 'border-gray-200/80 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`material-symbols-outlined text-[16px] ${selectedOptions.includes(opt.id) ? 'text-purple-700' : 'text-gray-400'}`}>
                      {opt.icon}
                    </span>
                    <span className={`text-[12.5px] font-semibold ${selectedOptions.includes(opt.id) ? 'text-purple-700' : 'text-gray-800'}`}>
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{opt.desc}</span>
                </button>
              ))}
            </div>
            <button
              id="extract-btn"
              onClick={handleExtract}
              type="button"
              disabled={!pdfName || selectedOptions.length === 0}
              className={`w-full py-2.5 rounded-xl text-[13px] font-medium text-white transition-all cursor-pointer flex items-center justify-center gap-2 ${
                pdfName && selectedOptions.length > 0 ? 'bg-purple-600 hover:bg-purple-700 shadow-2xs' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">data_object</span>
                  Extract Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Extracted Data ({results.length} items)</h2>
              <button
                type="button"
                onClick={() => showToast('All data exported as JSON!')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200/80 text-[12px] font-medium text-purple-700 hover:bg-purple-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                Export All
              </button>
            </div>
            <div className="space-y-3">
              {results.map((item, i) => {
                const colors = COLORS[item.type];
                return (
                  <div key={i} id={`extract-result-${i}`} className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 text-purple-700 border border-purple-100">
                          <span className="material-symbols-outlined text-[16px]">{ICONS[item.type]}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[12px] font-semibold text-gray-900">{item.title}</span>
                            <span className="text-[10px] text-gray-400">p.{item.page}</span>
                          </div>
                          <p className="text-[13px] text-gray-800 font-mono leading-relaxed">{item.content}</p>
                        </div>
                      </div>
                      <button onClick={() => handleCopyItem(item)} type="button"
                        className="shrink-0 p-1.5 rounded-lg border border-gray-200/80 hover:border-purple-400 text-gray-400 hover:text-purple-700 cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
