import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResearch } from '../../context/ResearchContext';
import { researchService } from '../../services/researchService';
import drRamanathanImg from '../../assets/dr_ramanathan.png';

export const Topbar: React.FC = () => {
  const { isAutoPilot, setIsAutoPilot, showToast, isMobileNavOpen, setIsMobileNavOpen } = useResearch();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const handleExportBibtex = () => {
    void researchService.generateBibTeX().then((bibtex) => {
      if (navigator.clipboard && bibtex) navigator.clipboard.writeText(bibtex);
      showToast(
        bibtex
          ? 'BibTeX entries copied to clipboard (real corpus metadata)!'
          : 'Backend offline — no corpus metadata to export.'
      );
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
      showToast('Corpus metadata exported as CSV!');
    });
    setShowExportMenu(false);
  };

  const pageTitles: Record<string, string> = {
    '/': 'Home',
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
    (location.pathname.startsWith('/paper-chat/')
      ? 'Paper Chat'
      : location.pathname.startsWith('/paper/')
      ? 'Paper Analysis'
      : 'R-Lens');

  return (
    <header className="fixed top-0 left-0 md:left-[260px] right-0 h-14 border-b border-gray-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 transition-all duration-200">
      {/* Left: Mobile hamburger + Breadcrumb / Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 md:hidden cursor-pointer"
          title="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {isHome ? (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-gray-500">
              Academic Research Assistant
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[13px] text-gray-600 font-medium min-w-0">
            <span
              className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
              onClick={() => navigate('/')}
            >
              Home
            </span>
            <span className="material-symbols-outlined text-[15px] text-gray-400 shrink-0">
              chevron_right
            </span>
            <span className="text-gray-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {currentTitle}
            </span>
          </div>
        )}
      </div>

      {/* Center/Right: Agent Mode Switcher (on inner pages) + Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        {!isHome && (
          <div className="hidden sm:inline-flex items-center p-0.5 rounded-lg bg-gray-100/90 border border-gray-200/60 text-[12px] font-medium select-none">
            <button
              onClick={() => setIsAutoPilot(true)}
              id="topbar-autopilot-btn"
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                isAutoPilot
                  ? 'bg-white text-primary font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Auto-Pilot
            </button>
            <button
              onClick={() => setIsAutoPilot(false)}
              id="topbar-manual-btn"
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                !isAutoPilot
                  ? 'bg-white text-gray-900 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              Human-in-the-Loop
            </button>
          </div>
        )}

        {/* Evidence matrix link button */}
        {!isHome && (
          <button
            id="topbar-evidence-badge"
            onClick={() => navigate('/evidence')}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100/80 border border-purple-200/70 text-primary text-[12px] font-medium transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
            Evidence Matrix
          </button>
        )}

        {/* Export dropdown */}
        <div className="relative">
          <button
            id="topbar-export-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-[12.5px] font-medium transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span className="hidden sm:inline">Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-gray-200 py-1.5 z-50 animate-fadeIn">
              <button
                onClick={handleExportBibtex}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-primary flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">format_quote</span>
                Export BibTeX
              </button>
              <button
                onClick={handleExportCsv}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-700 hover:bg-purple-50 hover:text-primary flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-600">table_chart</span>
                Export Matrix (CSV)
              </button>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none p-1 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => navigate('/')}
          title="Dr. U. Giridhar (Lead Researcher)"
        >
          <img
            src={drRamanathanImg}
            alt="Dr. U. Giridhar"
            className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
          />
        </div>
      </div>
    </header>
  );
};
