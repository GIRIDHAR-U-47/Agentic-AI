import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TRENDING_TOPICS = [
  { label: 'Large Language Models', count: '4.2k papers', hot: true },
  { label: 'Transformer Architectures', count: '2.8k papers', hot: true },
  { label: 'Multi-modal Learning', count: '1.9k papers', hot: false },
  { label: 'Federated Learning', count: '1.4k papers', hot: false },
  { label: 'Graph Neural Networks', count: '3.1k papers', hot: true },
  { label: 'Diffusion Models', count: '2.3k papers', hot: true },
  { label: 'Reinforcement Learning', count: '2.7k papers', hot: false },
  { label: 'Time Series Forecasting', count: '1.6k papers', hot: false },
];

const TOPIC_CARDS = [
  {
    area: 'Electrical Engineering',
    color: '#5F2781',
    bg: '#F5ECF9',
    topics: ['Smart Grid Optimization', 'Power Forecasting', 'EV Battery Management', 'Microgrid Control'],
  },
  {
    area: 'Computer Science',
    color: '#3F6B8B',
    bg: '#E8F4F8',
    topics: ['Neural Architecture Search', 'Efficient Transformers', 'Continual Learning', 'Explainable AI'],
  },
  {
    area: 'Data Science',
    color: '#755A18',
    bg: '#FEF6E4',
    topics: ['Anomaly Detection', 'Feature Selection', 'AutoML', 'Data Augmentation'],
  },
  {
    area: 'Interdisciplinary',
    color: '#2D5A3D',
    bg: '#E8F5ED',
    topics: ['AI for Climate', 'Digital Twins', 'Human-AI Collaboration', 'AI Ethics'],
  },
];

export const FindTopics: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeArea, setActiveArea] = useState<string | null>(null);

  const handleTopicClick = (topic: string) => {
    navigate(`/research?q=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FAFAFC] px-6 sm:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight mb-1">Find Topics</h1>
          <p className="text-[14px] text-gray-500">Discover trending research areas and explore topics in your field</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-gray-400 pointer-events-none">search</span>
          <input
            id="find-topics-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics, research areas, keywords..."
            className="w-full pl-12 pr-4 py-3 text-[14px] bg-white border border-gray-200/80 rounded-2xl focus:outline-none focus:border-purple-600 shadow-2xs transition-colors"
          />
        </div>

        {/* Trending */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[18px] text-purple-600">trending_up</span>
            <h2 className="text-[15px] font-semibold text-gray-900">Trending Right Now</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TOPICS.map(t => (
              <button
                key={t.label}
                id={`trending-${t.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleTopicClick(t.label)}
                type="button"
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-gray-200/80 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer shadow-2xs"
              >
                {t.hot && <span className="material-symbols-outlined text-[14px] text-amber-600">local_fire_department</span>}
                <span className="text-[12.5px] font-medium text-gray-800 group-hover:text-purple-700">{t.label}</span>
                <span className="text-[11px] text-gray-400">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Domain Cards */}
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Browse by Research Area</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOPIC_CARDS.map(card => (
              <div
                key={card.area}
                id={`topic-area-${card.area.toLowerCase().replace(/\s+/g, '-')}`}
                className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all ${
                  activeArea === card.area ? 'border-purple-500 shadow-sm' : 'border-gray-200/80 hover:border-purple-300 hover:shadow-2xs'
                }`}
                onClick={() => setActiveArea(activeArea === card.area ? null : card.area)}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-700 border border-purple-100"
                  >
                    <span className="material-symbols-outlined text-[18px]">science</span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-gray-900">{card.area}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {card.topics.map(topic => (
                    <button
                      key={topic}
                      onClick={e => { e.stopPropagation(); handleTopicClick(topic); }}
                      type="button"
                      className="text-left px-3 py-2 rounded-xl bg-gray-50 hover:bg-purple-50/60 hover:text-purple-700 text-[12.5px] text-gray-700 font-medium cursor-pointer transition-colors border border-gray-100"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
