import React from 'react';
import {
  Video01Icon,
  Film01Icon,
  BookOpen01Icon,
  Settings01Icon,
  SecurityCheckIcon,
  Tick01Icon,
} from 'hugeicons-react';
import { ActiveView } from '../types';

interface NavbarProps {
  activeView: ActiveView;
  recordingsCount: number;
  onSelectView: (view: ActiveView) => void;
  onOpenSettings: () => void;
  isRecording: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  recordingsCount,
  onSelectView,
  onOpenSettings,
  isRecording,
}) => {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all select-none"
    >
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand / Breadcrumb inspired by Screenity */}
        <div
          id="brand-logo-btn"
          onClick={() => !isRecording && onSelectView('studio')}
          className="flex items-center gap-3 cursor-pointer group"
          title="OSR - Open Source Recorder"
        >
          {/* Screenity Gradient Orb Icon */}
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
            </div>
            {isRecording && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>

          {/* Breadcrumb Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
              OSR
            </span>
            <span className="text-slate-200 font-light">/</span>
            <span className="text-xs font-semibold text-slate-800 tracking-tight">
              {activeView === 'studio' ? 'Open Source Recorder' : activeView === 'library' ? 'My Recordings' : activeView === 'docs' ? 'Architecture Docs' : 'Services Diagnostics'}
            </span>
          </div>
        </div>

        {/* Center Pill Segmented Switcher */}
        <nav className="flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-full shadow-inner">
          <button
            id="nav-tab-studio"
            disabled={isRecording}
            onClick={() => onSelectView('studio')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Video01Icon className={`w-3.5 h-3.5 ${activeView === 'studio' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Studio</span>
          </button>

          <button
            id="nav-tab-library"
            disabled={isRecording}
            onClick={() => onSelectView('library')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeView === 'library'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Film01Icon className={`w-3.5 h-3.5 ${activeView === 'library' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Library</span>
            {recordingsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                {recordingsCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-docs"
            disabled={isRecording}
            onClick={() => onSelectView('docs')}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              activeView === 'docs'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BookOpen01Icon className={`w-3.5 h-3.5 ${activeView === 'docs' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>Docs</span>
          </button>
        </nav>

        {/* Right Nav: Interactive Services Diagnostic Button & Settings */}
        <div className="flex items-center gap-2.5">
          <button
            id="nav-services-status-btn"
            onClick={() => onSelectView('services')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
              activeView === 'services'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
            title="Inspect running offline web engines & diagnostics"
          >
            <span className="text-slate-700 font-medium">Services</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <SecurityCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
          </button>

          <button
            id="nav-btn-settings"
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Configure Output & Audio Settings"
          >
            <Settings01Icon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
