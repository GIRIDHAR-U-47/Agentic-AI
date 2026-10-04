import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AGENTS = [
  {
    icon: 'travel_explore',
    color: 'bg-[#5F2781]',
    name: 'Research Discovery Agent',
    desc: 'Autonomously searches global academic literature and synthesizes SOTA findings.',
    tags: ['Papers', 'SOTA', 'Discovery'],
    uses: '12.4k uses',
  },
  {
    icon: 'menu_book',
    color: 'bg-[#3F1A57]',
    name: 'Literature Review Agent',
    desc: 'Generates full manuscripts with IEEE-formatted references and structured sections.',
    tags: ['Writing', 'IEEE', 'Review'],
    uses: '8.7k uses',
  },
  {
    icon: 'data_object',
    color: 'bg-[#755A18]',
    name: 'Evidence Extraction Agent',
    desc: 'Extracts tables, figures, equations and statistical data from PDF documents.',
    tags: ['PDF', 'Data', 'Tables'],
    uses: '6.2k uses',
  },
  {
    icon: 'bar_chart',
    color: 'bg-[#3F6B8B]',
    name: 'Benchmark Matrix Agent',
    desc: 'Compares MSE, MAE, RMSE, latency and memory across multiple models.',
    tags: ['Benchmark', 'Compare', 'Metrics'],
    uses: '5.1k uses',
  },
  {
    icon: 'edit_note',
    color: 'bg-[#2D5A3D]',
    name: 'AI Writing Agent',
    desc: 'Assists with academic writing, paraphrasing and improving text quality.',
    tags: ['Writing', 'Grammar', 'Style'],
    uses: '9.3k uses',
  },
  {
    icon: 'format_quote',
    color: 'bg-[#7A2C3E]',
    name: 'Citation Agent',
    desc: 'Generates accurate citations in APA, MLA, IEEE, Chicago and Vancouver styles.',
    tags: ['Citation', 'References', 'Formats'],
    uses: '14.8k uses',
  },
  {
    icon: 'policy',
    color: 'bg-[#4A4A4A]',
    name: 'AI Detector Agent',
    desc: 'Analyzes text to determine the probability of AI-generated content.',
    tags: ['Detection', 'Originality', 'AI'],
    uses: '7.5k uses',
  },
  {
    icon: 'shuffle',
    color: 'bg-[#5A3878]',
    name: 'Paraphrase Agent',
    desc: 'Rewrites text in academic, fluent, standard or creative styles.',
    tags: ['Paraphrase', 'Rewrite', 'Style'],
    uses: '11.2k uses',
  },
  {
    icon: 'slideshow',
    color: 'bg-[#3A5C7A]',
    name: 'Presentation Agent',
    desc: 'Converts your research findings into structured presentation outlines.',
    tags: ['Slides', 'Presentation', 'Outline'],
    uses: '4.9k uses',
  },
];

const FILTERS = ['All', 'Research', 'Writing', 'Analysis', 'Citation', 'Detection'];

export const AgentGallery: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = AGENTS.filter(a => {
    const matchFilter = activeFilter === 'All' || a.tags.some(t => t.toLowerCase().includes(activeFilter.toLowerCase()));
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFC] px-6 sm:px-8 py-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight mb-1">Agent Gallery</h1>
          <p className="text-[14px] text-gray-500">Autonomous AI agents for every research workflow</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400 pointer-events-none">search</span>
            <input
              id="agent-gallery-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="w-full pl-9 pr-4 py-2 text-[13.5px] bg-white border border-gray-200/80 rounded-xl focus:outline-none focus:border-purple-600 transition-colors shadow-2xs"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                id={`agent-filter-${f.toLowerCase()}`}
                onClick={() => setActiveFilter(f)}
                type="button"
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all cursor-pointer ${
                  activeFilter === f
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-white border border-gray-200/80 text-gray-700 hover:border-purple-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(agent => (
            <div
              key={agent.name}
              id={`agent-card-${agent.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col gap-4 hover:border-purple-300 hover:shadow-sm transition-all group cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                  <span className="material-symbols-outlined text-[20px]">{agent.icon}</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{agent.uses}</span>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-gray-900 group-hover:text-purple-700 transition-colors mb-1">{agent.name}</h3>
                <p className="text-[12.5px] text-gray-500 leading-snug">{agent.desc}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {agent.tags.map(tag => (
                  <span key={tag} className="text-[10.5px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100/60">{tag}</span>
                ))}
              </div>
              <button
                type="button"
                className="w-full mt-auto py-2 text-[13px] font-medium text-purple-700 bg-purple-50/60 border border-purple-200/80 rounded-xl hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all cursor-pointer"
              >
                Use Agent
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
