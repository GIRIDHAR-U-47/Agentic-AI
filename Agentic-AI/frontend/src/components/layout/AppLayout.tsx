import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useResearch } from '../../context/ResearchContext';

export const AppLayout: React.FC = () => {
  const { toastMessage } = useResearch();

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-gray-900 flex selection:bg-purple-100 selection:text-primary">
      {/* Responsive Left Sidebar (~260px) */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 pl-0 md:pl-[260px] bg-[#FAFAFC] transition-all duration-200">
        {/* Fixed Topbar */}
        <Topbar />

        {/* Page Viewport */}
        <main className="w-full pt-14 min-h-[calc(100vh-56px)] flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-[13px] flex items-center gap-2 transition-all animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
