import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResearch } from '../../context/ResearchContext';
import { researchService } from '../../services/researchService';
import drRamanathanImg from '../../assets/dr_ramanathan.png';

export const Topbar: React.FC = () => {
  const { isAutoPilot, setIsAutoPilot, showToast } = useResearch();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const handleExportBibtex = () => {
    void researchService.generateBibTeX().then((bibtex) => {
      if (navigator.clipboard && bibtex) navigator.clipboard.writeText(bibtex);
      showToast(bibtex ? 'BibTeX entries copied to clipboard (real corpus metadata)!' : 'Backend offline — no corpus metadata to export.');
    });
    setShowExportMenu(false);
  };

  const handleExportCsv = () => {
    void researchService.exportMatrixCsv().then((csv) => {
      if (!csv) {
        showToast('Backend offline — no corpus metadata to export.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'R_Lens_Corpus_Metadata.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Corpus metadata (real fields only) exported as CSV!');
    });
    setShowExportMenu(false);
  };

  /* ── HOME TOPBAR ── */
  if (isHome) {
    return (
      <header className="fixed top-0 left-64 right-0 h-14 border-b border-[#EFE9F3] bg-white/90 backdrop-blur-md px-6 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-outline">Student Research Prototype</span>
        </div>

        <div className="flex items-center gap-3">
          {/* User avatar */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none px-2 py-1 rounded-lg hover:bg-[#F7F2F9] transition-colors"
            onClick={() => navigate('/')}
            title="Dr U Giridhar (Lead Researcher)"
          >
            <img
              src={drRamanathanImg}
              alt="Dr U Giridhar"
              className="w-7 h-7 rounded-full object-cover ring-1 ring-outline-variant/50"
            />
            <span className="text-[12.5px] font-medium text-[#1D1A20] hidden sm:inline">Dr. U. Giridhar</span>
          </div>
        </div>
      </header>
    );
  }

  /* ── INNER PAGE TOPBAR ── */
  const pageTitles: Record<string, string> = {
    '/research': 'Research Workspace',
    '/evidence': 'Evidence Matrix',
    '/compare': 'Comparison',
    '/report': 'Literature Review',
    '/agent-gallery': 'Agent Gallery',
    '/templates': 'Templates',
    '/chat-with-pdf': 'Chat with PDF',
    '/ai-writer': 'AI Writer',
    '/find-topics': 'Find Topics',
    '/paraphraser': 'Paraphraser',
    '/citation-generator': 'Citation Generator',
    '/extract-data': 'Extract Data',
    '/ai-detector': 'AI Detector',
  };

  const currentTitle =
    pageTitles[location.pathname] ??
    (location.pathname.startsWith('/paper/') ? 'Paper Analysis' : 'R-Lens');

  return (
    <header className="fixed top-0 left-64 right-0 h-14 border-b border-[#EFE9F3] bg-white/80 backdrop-blur-md px-6 flex items-center justify-between z-40 gap-4 shrink-0">
      {/* Left: Breadcrumb + Mode */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 text-[13px] text-on-surface-variant font-medium">
          <span
            className="text-outline hover:text-on-surface cursor-pointer transition-colors"
            onClick={() => navigate('/')}
          >
            Home
          </span>
          <span className="material-symbols-outlined text-[15px] text-outline">chevron_right</span>
          <span className="text-[#3F1A57] font-semibold truncate max-w-[220px]">{currentTitle}</span>
        </div>

        <div className="h-4 w-px bg-[#EFE9F3] mx-1" />

        {/* Mode Switcher */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F5EBF9] border border-[#ECD9F3] text-[11.5px] font-medium select-none">
          <button
            onClick={() => setIsAutoPilot(true)}
            id="topbar-autopilot-btn"
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${isAutoPilot
              ? 'bg-white text-[#3F1A57] font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
              }`}
            type="button"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#7E45A0]" />
            Agentic Auto-Pilot
          </button>
          <button
            onClick={() => setIsAutoPilot(false)}
            id="topbar-manual-btn"
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${!isAutoPilot
              ? 'bg-white text-[#3F1A57] font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
              }`}
            type="button"
          >
            Human-in-the-Loop
          </button>
        </div>
      </div>

      {/* Right: Evidence badge, export, notifications, user */}
      <div className="flex items-center gap-3">
        <button
          id="topbar-evidence-badge"
          onClick={() => navigate('/evidence')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FED889]/30 border border-[#FED889] text-[#785D1A] text-[12px] font-semibold hover:bg-[#FED889]/50 transition-colors cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[15px]">verified</span>
          18 Evidences
        </button>

        {/* Export */}
        <div className="relative">
          <button
            id="topbar-export-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5DDE9] hover:bg-[#F7F2F9] text-on-surface-variant hover:text-on-surface text-[12.5px] font-medium transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-[#E5DDE9] py-1 z-50">
              <button
                onClick={handleExportBibtex}
                className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-[#F7F2F9] flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#5F2781]">format_quote</span>
                Export BibTeX
              </button>
              <button
                onClick={handleExportCsv}
                className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-[#F7F2F9] flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#755A18]">table_chart</span>
                Export Matrix (CSV)
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          id="topbar-notifications-btn"
          className="relative p-1.5 text-outline hover:text-on-surface hover:bg-[#F3EBF4] rounded-lg transition-colors cursor-pointer"
          type="button"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[19px]">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error ring-2 ring-white" />
        </button>

        <div className="h-4 w-px bg-[#EFE9F3]" />

        {/* User */}
        <div className="flex items-center gap-1.5 pl-1 cursor-pointer select-none" onClick={() => navigate('/')}>
          <img
            src={drRamanathanImg}
            alt="Dr. U Giridhar"
            className="w-7 h-7 rounded-full object-cover ring-1 ring-outline-variant/50"
          />
          <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
        </div>
      </div>
    </header>
  );
};
