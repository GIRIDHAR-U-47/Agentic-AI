import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useResearch } from '../../context/ResearchContext';
import drRamanathanImg from '../../assets/dr_ramanathan.png';

const primaryNavItems = [
  { label: 'Home', path: '/', icon: 'home', exact: true },
  { label: 'Chat with PDF', path: '/chat-with-pdf', icon: 'picture_as_pdf' },
  { label: 'Literature Review', path: '/report', icon: 'menu_book' },
];

const aiToolsNavItems = [
  { label: 'AI Writer', path: '/ai-writer', icon: 'edit_note' },
  { label: 'Paraphraser', path: '/paraphraser', icon: 'shuffle' },
  { label: 'Citation Generator', path: '/citation-generator', icon: 'format_quote' },
  { label: 'AI Detector', path: '/ai-detector', icon: 'policy' },
];

const workspaceNavItems = [
  { label: 'Active Workspace', path: '/research', icon: 'layers' },
  { label: 'Evidence Matrix', path: '/evidence', icon: 'grid_view' },
  { label: 'Comparison', path: '/compare', icon: 'view_column' },
];

const resourcesNavItems = [
  { label: 'Agent Gallery', path: '/agent-gallery', icon: 'smart_toy' },
  { label: 'Templates', path: '/templates', icon: 'auto_awesome_mosaic' },
  { label: 'Find Topics', path: '/find-topics', icon: 'travel_explore' },
  { label: 'Extract Data', path: '/extract-data', icon: 'data_object' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { isMobileNavOpen, setIsMobileNavOpen, setQuery, setCurrentSessionTitle } = useResearch();

  const handleNewResearch = () => {
    setQuery('');
    setCurrentSessionTitle('');
    navigate('/');
    setIsMobileNavOpen(false);
  };

  const handleNavClick = () => {
    setIsMobileNavOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-200/80 z-50 flex flex-col select-none transition-transform duration-200 ease-in-out ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Brand Header */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => {
              navigate('/');
              setIsMobileNavOpen(false);
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5B21B6] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-white text-[19px]">science</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight text-gray-900 text-[15px] group-hover:text-primary transition-colors">
                R-Lens
              </span>
              <span className="text-[11px] text-gray-500 font-normal">
                Academic Research Assistant
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Close navigation"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
          {/* + New Research Button (ChatGPT / Gemini style) */}
          <button
            id="sidebar-new-chat-btn"
            type="button"
            onClick={handleNewResearch}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-purple-50/70 border border-gray-200/80 hover:border-purple-200 text-gray-700 hover:text-primary text-[13px] font-medium transition-all duration-150 cursor-pointer shadow-2xs group"
          >
            <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
              add
            </span>
            <span>New Research</span>
          </button>

          {/* Primary Nav */}
          <nav className="space-y-0.5 font-medium text-[13px]">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.exact}
                onClick={handleNavClick}
                id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'text-primary bg-purple-50 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isActive ? 'text-primary' : 'text-gray-400'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* AI Tools Section */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              AI Tools
            </div>
            <nav className="space-y-0.5 font-medium text-[13px]">
              {aiToolsNavItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={handleNavClick}
                  id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isActive ? 'text-primary' : 'text-gray-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Workspace Section */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Workspace
            </div>
            <nav className="space-y-0.5 font-medium text-[13px]">
              {workspaceNavItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={handleNavClick}
                  id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isActive ? 'text-primary' : 'text-gray-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Resources Section */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Resources
            </div>
            <nav className="space-y-0.5 font-medium text-[13px]">
              {resourcesNavItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={handleNavClick}
                  id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary bg-purple-50 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isActive ? 'text-primary' : 'text-gray-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Area: Agent Status & User Profile */}
        <div className="p-3 border-t border-gray-100 bg-white space-y-2 shrink-0">
          {/* R-Lens Agent Status */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200/60 text-[11.5px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-gray-700">R-Lens Agent</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
              Active
            </span>
          </div>

          {/* User Profile */}
          <div
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200/60 cursor-pointer transition-colors"
            onClick={() => {
              navigate('/');
              setIsMobileNavOpen(false);
            }}
          >
            <img
              src={drRamanathanImg}
              alt="Dr. U. Giridhar"
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
            />
            <div className="flex flex-col min-w-0 leading-tight flex-1">
              <span className="text-[12.5px] font-semibold text-gray-900 truncate">
                Dr. U. Giridhar
              </span>
              <span className="text-[11px] text-gray-500 truncate">
                Faculty / Lead Researcher
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
