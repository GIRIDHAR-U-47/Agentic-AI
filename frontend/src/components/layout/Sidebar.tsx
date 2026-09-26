import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import drRamanathanImg from '../../assets/dr_ramanathan.png';

const primaryNavItems = [
  { label: 'Home', path: '/', icon: 'home', exact: true },
  { label: 'Chat with PDF', path: '/chat-with-pdf', icon: 'picture_as_pdf' },
  { label: 'Literature Review', path: '/report', icon: 'menu_book' },
  { label: 'AI Writer', path: '/ai-writer', icon: 'edit_note' },
  { label: 'Paraphraser', path: '/paraphraser', icon: 'shuffle' },
  { label: 'Citation Generator', path: '/citation-generator', icon: 'format_quote' },
  { label: 'AI Detector', path: '/ai-detector', icon: 'policy' },
];

const secondaryNavItems = [
  { label: 'Agent Gallery', path: '/agent-gallery', icon: 'smart_toy' },
  { label: 'Templates', path: '/templates', icon: 'auto_awesome_mosaic' },
  { label: 'Find Topics', path: '/find-topics', icon: 'travel_explore' },
  { label: 'Extract Data', path: '/extract-data', icon: 'data_object' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#FCFBFE] border-r border-[#EFE9F3] z-50 flex flex-col select-none">
      {/* Scrollable Nav Area */}
      <div className="flex flex-col p-4 overflow-y-auto flex-1 no-scrollbar">
        {/* Brand Header */}
        <div
          className="flex items-center gap-2.5 cursor-pointer mb-4"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-full h-full" fill="none" viewBox="0 0 40 40">
              <rect fill="#5F2781" height="40" rx="10" width="40" />
              <circle cx="20" cy="20" fill="none" r="10" stroke="#FAF7FC" strokeOpacity="0.9" strokeWidth="2.5" />
              <path d="M14 12V28" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2.5" />
              <path d="M14 13H20.5C23.5 13 25.5 15 25.5 18C25.5 21 23.5 23 20.5 23H14" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              <path d="M19.5 22.5L25.5 28" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2.5" />
              <circle cx="25.5" cy="13.5" fill="#FED889" r="2.5" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight text-[#3F1A57] text-[15px]">R-Lens</span>
            <span className="text-[11px] text-outline font-medium">Research Prototype</span>
          </div>
        </div>

        {/* New Research CTA */}
        <button
          id="sidebar-new-chat-btn"
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 bg-white border border-[#E5DDE9] hover:border-[#9C68BC] hover:bg-[#FAF7FC] text-[#4D4450] py-2 px-3 rounded-lg text-[13px] font-medium transition-all mb-4 cursor-pointer shadow-sm"
          type="button"
        >
          <span className="material-symbols-outlined text-[17px] text-[#5F2781]">add</span>
          <span>New Research</span>
        </button>

        {/* Primary Research Navigation */}
        <nav className="flex flex-col gap-0.5 font-medium text-[13px]">
          {primaryNavItems.map(item => (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.exact}
              id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${isActive
                  ? 'text-[#5F2781] bg-[#F5ECF9] font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-[#F7F2F9]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#5F2781]' : 'text-outline'
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

        {/* Divider */}
        <div className="flex items-center gap-2 my-3 px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Workspace</span>
          <div className="flex-1 h-px bg-[#EFE9F3]" />
        </div>

        {/* Workspace Nav */}
        <nav className="flex flex-col gap-0.5 font-medium text-[13px]">
          <NavLink
            to="/research"
            className={({ isActive }) =>
              `flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${isActive
                ? 'text-[#5F2781] bg-[#F5ECF9] font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-[#F7F2F9]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#5F2781]' : 'text-outline'}`}>layers</span>
                  <span>Active Workspace</span>
                </div>
                <span className="text-[10.5px] font-medium text-[#5F2781] bg-[#F1E8F4] px-1.5 py-0.5 rounded">4</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/evidence"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${isActive
                ? 'text-[#5F2781] bg-[#F5ECF9] font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-[#F7F2F9]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#5F2781]' : 'text-outline'}`}>grid_view</span>
                <span>Evidence Matrix</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${isActive
                ? 'text-[#5F2781] bg-[#F5ECF9] font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-[#F7F2F9]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#5F2781]' : 'text-outline'}`}>view_column</span>
                <span>Comparison</span>
              </>
            )}
          </NavLink>
        </nav>

        {/* Divider */}
        <div className="flex items-center gap-2 my-3 px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Resources</span>
          <div className="flex-1 h-px bg-[#EFE9F3]" />
        </div>

        {/* Secondary Nav Items (Gallery, Templates, etc.) */}
        <nav className="flex flex-col gap-0.5 font-medium text-[13px]">
          {secondaryNavItems.map(item => (
            <NavLink
              key={item.label}
              to={item.path}
              id={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${isActive
                  ? 'text-[#5F2781] bg-[#F5ECF9] font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-[#F7F2F9]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#5F2781]' : 'text-outline'
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

      {/* Bottom: Agent Status + Researcher Profile */}
      <div className="p-3 flex flex-col gap-2 border-t border-[#EFE9F3] shrink-0">
        {/* Agent Status */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#F7F2F9] border border-[#EFE9F3] text-[11.5px]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-medium text-[#3F1A57]">R-Lens Agent: Active</span>
          </div>
          <span className="text-[10px] text-[#7E45A0] font-semibold bg-[#F0E6F6] px-1.5 py-0.5 rounded">Prototype</span>
        </div>

        {/* User profile */}
        <div
          className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F8F3FA] border border-[#ECD9F3] cursor-pointer hover:bg-[#F3EBF4] transition-colors"
          onClick={() => navigate('/')}
        >
          <img
            src={drRamanathanImg}
            alt="Dr U Giridhar"
            className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-outline-variant/50"
          />
          <div className="flex flex-col min-w-0 leading-tight flex-1">
            <span className="text-[12.5px] font-semibold text-[#1D1A20] truncate">Dr. U. Giridhar</span>
            <span className="text-[10.5px] text-on-surface-variant truncate">Faculty / Lead Researcher</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
