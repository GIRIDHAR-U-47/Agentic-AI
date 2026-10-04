import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['All', 'Literature Review', 'Research', 'Writing', 'Analysis', 'Presentations'];

const TEMPLATES = [
  {
    icon: 'menu_book',
    color: '#5F2781',
    bg: '#F5ECF9',
    name: 'Systematic Literature Review',
    desc: 'Full SLR workflow: PRISMA protocol, inclusion/exclusion criteria, data extraction.',
    category: 'Literature Review',
    steps: 8,
  },
  {
    icon: 'science',
    color: '#755A18',
    bg: '#FEF6E4',
    name: 'Research Proposal Template',
    desc: 'Structured proposal with objectives, methodology, timeline and budget sections.',
    category: 'Research',
    steps: 6,
  },
  {
    icon: 'bar_chart',
    color: '#3F6B8B',
    bg: '#E8F4F8',
    name: 'Benchmark Comparison Report',
    desc: 'Side-by-side model comparison with metrics table, radar chart and analysis.',
    category: 'Analysis',
    steps: 5,
  },
  {
    icon: 'edit_note',
    color: '#2D5A3D',
    bg: '#E8F5ED',
    name: 'IEEE Journal Paper Draft',
    desc: 'Standard IEEE format with abstract, introduction, methodology, results sections.',
    category: 'Writing',
    steps: 10,
  },
  {
    icon: 'slideshow',
    color: '#3A5C7A',
    bg: '#E8EFF5',
    name: 'Research Presentation Deck',
    desc: '12-slide template for conference presentations with figures and citation slides.',
    category: 'Presentations',
    steps: 4,
  },
  {
    icon: 'summarize',
    color: '#7A2C3E',
    bg: '#F5E8EC',
    name: 'Executive Research Summary',
    desc: 'Concise 2-page summary of findings for non-technical stakeholders.',
    category: 'Writing',
    steps: 3,
  },
  {
    icon: 'schema',
    color: '#5A3878',
    bg: '#F0EBF6',
    name: 'Research Gap Analysis',
    desc: 'Identify and map research gaps in existing literature with structured framework.',
    category: 'Research',
    steps: 7,
  },
  {
    icon: 'analytics',
    color: '#3F1A57',
    bg: '#F0E8F5',
    name: 'Statistical Analysis Report',
    desc: 'Data analysis template with statistical tests, visualizations and interpretation.',
    category: 'Analysis',
    steps: 9,
  },
  {
    icon: 'format_quote',
    color: '#4A4A4A',
    bg: '#EFEFEF',
    name: 'Annotated Bibliography',
    desc: 'Organize and annotate 20-50 sources with critical summaries and relevance notes.',
    category: 'Literature Review',
    steps: 5,
  },
];

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = TEMPLATES.filter((t) => activeCategory === 'All' || t.category === activeCategory);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFC] px-4 sm:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">
            Research Templates
          </h1>
          <p className="text-[14px] text-gray-500">
            Pre-built academic workflows to accelerate your research and writing
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`template-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveCategory(cat)}
              type="button"
              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-purple-50 text-primary border border-purple-200/80 shadow-2xs font-semibold'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.name}
              id={`template-${tpl.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-purple-200 hover:shadow-xs transition-all group cursor-pointer shadow-2xs"
              onClick={() => navigate('/')}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: tpl.bg }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ color: tpl.color }}>
                  {tpl.icon}
                </span>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 group-hover:text-primary transition-colors leading-snug mb-1">
                  {tpl.name}
                </h3>
                <p className="text-[12.5px] text-gray-500 leading-relaxed">{tpl.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span className="text-[11px] text-gray-400 font-medium">
                  {tpl.steps} steps · {tpl.category}
                </span>
                <span className="text-[12px] font-medium text-primary group-hover:underline flex items-center gap-0.5">
                  Use template
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
