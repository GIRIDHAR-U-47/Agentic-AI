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

  const filtered = TEMPLATES.filter(t => activeCategory === 'All' || t.category === activeCategory);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FCFBFE] px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1D1A20] tracking-tight mb-1">Research Templates</h1>
          <p className="text-[14px] text-on-surface-variant">Pre-built workflows to accelerate your research process</p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              id={`template-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setActiveCategory(cat)}
              type="button"
              className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#5F2781] text-white shadow-sm'
                  : 'bg-white border border-[#E5DDE9] text-[#4D4450] hover:border-[#9C68BC]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tpl => (
            <div
              key={tpl.name}
              id={`template-${tpl.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white border border-[#E5DDE9] rounded-2xl p-5 flex flex-col gap-3.5 hover:border-[#9C68BC] hover:shadow-md transition-all group cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: tpl.bg }}
              >
                <span className="material-symbols-outlined text-[22px]" style={{ color: tpl.color }}>{tpl.icon}</span>
              </div>
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-[14px] font-semibold text-[#1D1A20] group-hover:text-[#5F2781] transition-colors leading-snug">
                    {tpl.name}
                  </h3>
                </div>
                <p className="text-[12.5px] text-on-surface-variant leading-snug">{tpl.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-[11px] text-outline font-medium">{tpl.steps} steps · {tpl.category}</span>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#5F2781] hover:underline cursor-pointer"
                  onClick={e => { e.stopPropagation(); navigate('/'); }}
                >
                  Use template →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
