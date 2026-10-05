import React, { useEffect, useState, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useResearch } from '../../context/ResearchContext';
import { api } from '../../services/api';
import { Conversation } from '../../types';
import drRamanathanImg from '../../assets/dr_ramanathan.png';
import rlensIcon from '../../assets/rlens_icon.jpg';

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

function formatTimeAgo(timestampSeconds: number): string {
  if (!timestampSeconds) return 'Recently';
  const nowSec = Date.now() / 1000;
  const diffSec = Math.max(0, nowSec - timestampSeconds);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `${days}d ago`;
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileNavOpen, setIsMobileNavOpen, setQuery, setCurrentSessionTitle } = useResearch();

  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // Load conversations from backend
  const loadConversations = useCallback(async () => {
    try {
      setLoadingChats(true);
      const res = await api.conversations.list(undefined, 30);
      setRecentConversations(res.conversations || []);
    } catch {
      // Backend may be starting or offline
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, location.pathname]);

  const handleNewResearch = () => {
    setQuery('');
    setCurrentSessionTitle('');
    navigate('/');
    setIsMobileNavOpen(false);
  };

  const handleNavClick = () => {
    setIsMobileNavOpen(false);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setQuery(conv.research_topic || conv.title);
    setCurrentSessionTitle(conv.title);

    if (conv.mode === 'literature_review') {
      navigate(`/report/${conv.id}`);
    } else if (conv.mode === 'chat_with_paper' && conv.metadata?.doc_id) {
      navigate(`/paper-chat/${conv.metadata.doc_id}/${conv.id}`);
    } else {
      navigate(`/chat/${conv.id}`);
    }
    setIsMobileNavOpen(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await api.conversations.delete(convId);
      setRecentConversations((prev) => prev.filter((c) => c.id !== convId));
      if (location.pathname.includes(convId)) {
        navigate('/');
      }
    } catch {
      // Handle error
    }
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
            <img
              src={rlensIcon}
              alt="R-Lens"
              className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm ring-1 ring-purple-200/60 group-hover:scale-105 transition-transform duration-200"
            />
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

          {/* Persistent Recent Chats Section */}
          {recentConversations.length > 0 && (
            <div className="space-y-1">
              <div className="px-2.5 py-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <span>Recent Chats</span>
                <span className="text-[10px] lowercase font-normal text-gray-400">
                  {recentConversations.length} saved
                </span>
              </div>
              <div className="space-y-0.5 font-medium text-[13px] max-h-56 overflow-y-auto no-scrollbar">
                {recentConversations.map((conv) => {
                  const isActive = location.pathname.includes(conv.id);
                  const modeIcon =
                    conv.mode === 'literature_review'
                      ? 'menu_book'
                      : conv.mode === 'chat_with_paper'
                      ? 'picture_as_pdf'
                      : 'chat_bubble_outline';

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`group flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-[12.5px] cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-primary font-semibold'
                          : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                      }`}
                      title={conv.title || 'Untitled Conversation'}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`material-symbols-outlined text-[16px] shrink-0 ${
                            isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                          }`}
                        >
                          {modeIcon}
                        </span>
                        <span className="truncate leading-tight">{conv.title || 'Untitled'}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400 group-hover:hidden">
                          {formatTimeAgo(conv.updated_at)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          className="hidden group-hover:flex p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Delete chat"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
