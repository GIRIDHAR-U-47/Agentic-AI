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
    <div className="min-h-[calc(100vh-56px)] bg-[#FCFBFE] flex">
      {/* ── LEFT PANEL: Settings ── */}
      <div className="w-64 border-r border-[#EFE9F3] flex flex-col p-4 gap-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#1D1A20] mb-0.5">AI Writer</h2>
          <p className="text-[11.5px] text-outline">Academic writing assistant</p>
        </div>

        {/* Mode */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">Mode</p>
          <div className="flex flex-col gap-1">
            {MODES.map(m => (
              <button
                key={m.id}
                id={`writer-mode-${m.id}`}
                onClick={() => setMode(m.id)}
                type="button"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer text-left ${
                  mode === m.id
                    ? 'bg-[#5F2781] text-white'
                    : 'bg-white border border-[#E5DDE9] text-[#4D4450] hover:border-[#9C68BC]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">Templates</p>
          <div className="flex flex-col gap-1">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl}
                id={`writer-tpl-${tpl.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleTemplateLoad(tpl)}
                type="button"
                className={`text-left px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer ${
                  selectedTemplate === tpl
                    ? 'bg-[#F5ECF9] text-[#5F2781] font-semibold'
                    : 'text-on-surface-variant hover:bg-[#F7F2F9]'
                }`}
              >
                {tpl}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-auto bg-[#F7F2F9] rounded-xl p-3 border border-[#EFE9F3]">
          <p className="text-[11px] text-outline font-medium mb-1">Document Stats</p>
          <div className="flex justify-between text-[12px]">
            <span className="text-[#1D1A20] font-semibold">{wordCount}</span>
            <span className="text-outline">words</span>
          </div>
          <div className="flex justify-between text-[12px] mt-0.5">
            <span className="text-[#1D1A20] font-semibold">{content.length}</span>
            <span className="text-outline">characters</span>
          </div>
        </div>
      </div>

      {/* ── MAIN EDITOR ── */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#EFE9F3] bg-white">
          <div className="flex gap-1">
            {['Bold', 'Italic', 'Quote', 'List'].map((action, i) => (
              <button
                key={action}
                id={`editor-${action.toLowerCase()}`}
                type="button"
                onClick={() => showToast(`${action} formatting applied`)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-[#5F2781] hover:bg-[#F5ECF9] cursor-pointer transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5DDE9] text-[12.5px] font-medium text-[#5F2781] hover:bg-[#F5ECF9] cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            Copy
          </button>
        </div>

        {/* Text area */}
        <div className="flex-1 flex flex-col p-6">
          <textarea
            id="writer-editor"
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Start writing your research paper, or select a template from the sidebar..."
            className="flex-1 min-h-[400px] bg-white border border-[#E5DDE9] rounded-2xl p-5 text-[14px] text-[#1D1A20] leading-relaxed resize-none focus:outline-none focus:border-[#9C68BC] transition-colors font-body"
          />
        </div>

        {/* AI Assist Bar */}
        <div className="px-6 pb-5">
          <div className="bg-white border border-[#E5DDE9] rounded-2xl p-3 focus-within:border-[#9C68BC] transition-colors">
            <div className="flex gap-3 items-center mb-2.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setAiPrompt(s.replace(/^\S+\s/, ''))}
                  type="button"
                  className="text-[12px] px-2.5 py-1 rounded-full border border-[#E5DDE9] text-[#4D4450] hover:border-[#9C68BC] hover:text-[#5F2781] cursor-pointer transition-colors whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-6 h-6 bg-[#5F2781] rounded-md flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-[14px]">smart_toy</span>
              </div>
              <input
                id="writer-ai-prompt"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAIAssist()}
                placeholder="Ask AI to write, expand, or improve..."
                className="flex-1 text-[13px] bg-transparent focus:outline-none text-[#1D1A20] placeholder-[#8F8495]"
              />
              <button
                id="writer-ai-btn"
                onClick={handleAIAssist}
                type="button"
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all cursor-pointer ${
                  aiPrompt.trim() ? 'bg-[#5F2781] hover:bg-[#4A176B]' : 'bg-[#C4B2CC] cursor-not-allowed'
                }`}
              >
                {isLoading
                  ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
