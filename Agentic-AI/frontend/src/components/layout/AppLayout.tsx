import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useResearch } from '../../context/ResearchContext';

export const AppLayout: React.FC = () => {
  const { toastMessage } = useResearch();

  return (
    <div className="min-h-screen bg-[#FCFBFE] text-on-surface flex selection:bg-primary-fixed selection:text-primary">
      {/* Fixed Left Sidebar (w-64) */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen min-w-0 bg-[#FCFBFE]">
        {/* Fixed Topbar (h-14) */}
        <Topbar />

        {/* Page Viewport */}
        <main className="w-full pt-14 bg-[#FCFBFE] min-h-screen flex-1">
          <Outlet />
        </main>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-lg shadow-xl font-body-sm text-body-sm flex items-center gap-space-xs transition-all animate-bounce">
          <span className="material-symbols-outlined text-inverse-primary text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
