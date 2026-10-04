import React, { useState } from 'react';
import { useResearch } from '../context/ResearchContext';

type WritingMode = 'outline' | 'draft' | 'improve';

const TEMPLATES = [
  'IEEE Research Paper',
  'Conference Abstract',
  'Literature Review',
  'Research Proposal',
  'Technical Report',
];

const SUGGESTIONS = [
  '✨ Improve clarity',
  '📐 Make more concise',
  '📚 Add academic tone',
  '🔁 Restructure paragraph',
];

const AI_SAMPLE = `The proposed PatchTST architecture demonstrates remarkable efficacy in long-horizon time series forecasting tasks. By segmenting temporal sequences into subseries-level patches, the model substantially reduces the computational complexity associated with traditional point-wise attention mechanisms. Empirical evaluations on standard benchmarks, including ETTh1, ETTh2, and Weather datasets, corroborate the model's superiority over contemporary baselines, achieving a 15.3% reduction in Mean Absolute Error (MAE).`;

export const AIWriter: React.FC = () => {
  const { showToast, intentPayload, setIntentPayload } = useResearch();
  const [mode, setMode] = useState<WritingMode>('draft');
  const [content, setContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [wordCount, setWordCount] = useState(0);

  React.useEffect(() => {
    if (intentPayload && intentPayload.intent === 'WRITING_DRAFT') {
      if (intentPayload.prompt) {
        setAiPrompt(intentPayload.prompt);
      }
      if (intentPayload.template) {
        setSelectedTemplate(intentPayload.template);
        setContent(`# ${intentPayload.template}\n\n## Abstract\n\n[Write abstract here...]\n\n## Introduction\n\n${intentPayload.prompt || ''}\n\n## Methodology\n\n[Describe methodology...]\n\n## Results\n\n[Present results...]\n\n## Conclusion\n\n[Conclusion...]`);
      }
      setIntentPayload(null);
    }
  }, [intentPayload, setIntentPayload]);

  const handleContentChange = (val: string) => {
    setContent(val);
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0);
  };

  const handleAIAssist = () => {
    if (!aiPrompt.trim() && !content.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setContent(prev => (prev ? prev + '\n\n' : '') + AI_SAMPLE);
      setAiPrompt('');
      setWordCount(prev => prev + AI_SAMPLE.trim().split(/\s+/).length);
    }, 1200);
  };

  const handleCopy = () => {
    if (content && navigator.clipboard) {
      navigator.clipboard.writeText(content);
      showToast('Content copied to clipboard!');
    }
  };

  const handleTemplateLoad = (tpl: string) => {
    setSelectedTemplate(tpl);
    setContent(`# ${tpl}\n\n## Abstract\n\n[Write your abstract here...]\n\n## Introduction\n\n[Introduction goes here...]\n\n## Methodology\n\n[Describe your methodology...]\n\n## Results\n\n[Present your results...]\n\n## Conclusion\n\n[Conclude your findings...]`);
    setWordCount(30);
    showToast(`Template loaded: ${tpl}`);
  };

  const MODES: { id: WritingMode; label: string; icon: string }[] = [
    { id: 'outline', label: 'Outline', icon: 'list' },
    { id: 'draft', label: 'Draft', icon: 'edit_note' },
    { id: 'improve', label: 'Improve', icon: 'auto_fix_high' },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFC] flex flex-col md:flex-row">
      {/* ── LEFT PANEL: Settings ── */}
      <div className="w-full md:w-64 border-r border-gray-200/80 bg-white flex flex-col p-4 gap-4 shrink-0">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900 mb-0.5">AI Writer</h2>
          <p className="text-[11.5px] text-gray-500">Academic writing assistant</p>
        </div>

        {/* Mode */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Mode</p>
          <div className="flex flex-col gap-1">
            {MODES.map((m) => (
              <button
                key={m.id}
                id={`writer-mode-${m.id}`}
                onClick={() => setMode(m.id)}
                type="button"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer text-left ${
                  mode === m.id
                    ? 'bg-purple-50 text-primary font-semibold border border-purple-200/60'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Templates</p>
          <div className="flex flex-col gap-1">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                id={`writer-tpl-${tpl.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleTemplateLoad(tpl)}
                type="button"
                className={`text-left px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer ${
                  selectedTemplate === tpl
                    ? 'bg-purple-50 text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tpl}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-auto bg-gray-50 rounded-xl p-3 border border-gray-200/60">
          <p className="text-[11px] text-gray-400 font-medium mb-1">Document Stats</p>
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-900 font-semibold">{wordCount}</span>
            <span className="text-gray-500">words</span>
          </div>
          <div className="flex justify-between text-[12px] mt-0.5">
            <span className="text-gray-900 font-semibold">{content.length}</span>
            <span className="text-gray-500">characters</span>
          </div>
        </div>
      </div>

      {/* ── MAIN EDITOR ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-200/80 bg-white">
          <div className="flex gap-1">
            {['Bold', 'Italic', 'Quote', 'List'].map((action, i) => (
              <button
                key={action}
                id={`editor-${action.toLowerCase()}`}
                type="button"
                onClick={() => showToast(`${action} formatting applied`)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:bg-purple-50 cursor-pointer transition-colors"
                title={action}
              >
                <span className="material-symbols-outlined text-[17px]">
                  {['format_bold', 'format_italic', 'format_quote', 'format_list_bulleted'][i]}
                </span>
              </button>
            ))}
          </div>
          <button
            id="writer-copy-btn"
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12.5px] font-medium text-gray-700 hover:text-primary hover:border-primary cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            Copy
          </button>
        </div>

        {/* Text area */}
        <div className="flex-1 flex flex-col p-4 sm:p-6">
          <textarea
            id="writer-editor"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your research paper, or select a template from the sidebar..."
            className="flex-1 min-h-[360px] bg-white border border-gray-200/90 rounded-2xl p-5 text-[14px] text-gray-900 leading-relaxed resize-none focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/10 transition-colors font-body shadow-2xs"
          />
        </div>

        {/* AI Assist Bar */}
        <div className="px-4 sm:px-6 pb-5">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-3 focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/10 transition-colors shadow-2xs">
            <div className="flex gap-2 items-center mb-2.5 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setAiPrompt(s.replace(/^\S+\s/, ''))}
                  type="button"
                  className="text-[12px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-primary hover:text-primary cursor-pointer transition-colors whitespace-nowrap bg-gray-50/70"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 bg-purple-50 text-primary border border-purple-200/60 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[15px]">smart_toy</span>
              </div>
              <input
                id="writer-ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIAssist()}
                placeholder="Ask AI to write, expand, or improve..."
                className="flex-1 text-[13.5px] bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
              />
              <button
                id="writer-ai-btn"
                onClick={handleAIAssist}
                type="button"
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all cursor-pointer ${
                  aiPrompt.trim()
                    ? 'bg-primary hover:bg-primary-hover shadow-2xs'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
