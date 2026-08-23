import React, { useState, useEffect } from 'react';
import {
  Video01Icon,
  Film01Icon,
  BookOpen01Icon,
  Settings01Icon,
  CodeIcon,
  SparklesIcon,
} from 'hugeicons-react';
import { ActiveView } from '../types';
import { logbook } from '../services/logbook';

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
  const [errorCount, setErrorCount] = useState<number>(0);

  useEffect(() => {
    const unsub = logbook.subscribe((logs) => {
      const errs = logs.filter((l) => l.level === 'error').length;
      setErrorCount(errs);
    });
    return () => unsub();
  }, []);

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/70 transition-all select-none shadow-[0_2px_12px_rgba(15,23,42,0.03)]"
    >
      <div className="max-w-7xl mx-auto h-15 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Identity / Creative Logo */}
        <div
          id="brand-logo-btn"
          onClick={() => !isRecording && onSelectView('studio')}
          className="flex items-center gap-3 cursor-pointer group"
          title="OSR - Open Source Recorder"
        >
          {/* Glowing Multi-layer Holographic Lens Badge */}
          <div className="relative flex items-center justify-center">
            {/* Ambient Glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-500 blur-sm opacity-40 group-hover:opacity-75 transition-opacity" />
            
            {/* Main Badge Container */}
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-950 p-[1.5px] shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center overflow-hidden relative">
                {/* Center Aperture Iris */}
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-400 p-[1.5px] shadow-xs flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                </div>

                {/* Subtle Lens Flare Shimmer */}
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-white/20 blur-[2px] pointer-events-none" />
              </div>
            </div>

            {/* Live Recording Pulse Indicator */}
            {isRecording && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white" />
              </span>
            )}
          </div>

          {/* Clean Modern Typography & Tagline */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-slate-900 font-sans group-hover:text-blue-900 transition-colors">
                OSR Studio
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50/80 text-[10px] font-bold text-blue-700 border border-blue-200/50">
                <SparklesIcon className="w-2.5 h-2.5 text-blue-600" />
                <span>v2.4</span>
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-600 tracking-tight leading-tight hidden sm:block">
              100% Client-Side Screen & Camera Engine
            </span>
          </div>
        </div>

        {/* Center Pill Segmented Switcher */}
        <nav className="flex items-center gap-1 p-1 bg-slate-100/80 border border-slate-200/80 rounded-2xl shadow-xs">
          {/* Studio Tab */}
          <button
            id="nav-tab-studio"
            disabled={isRecording}
            onClick={() => onSelectView('studio')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Video01Icon className={`w-3.5 h-3.5 ${activeView === 'studio' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Studio</span>
          </button>

          {/* Library Tab */}
          <button
            id="nav-tab-library"
            disabled={isRecording}
            onClick={() => onSelectView('library')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeView === 'library'
                ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Film01Icon className={`w-3.5 h-3.5 ${activeView === 'library' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Library</span>
            {recordingsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-black bg-blue-100/80 text-blue-700 rounded-full">
                {recordingsCount}
              </span>
            )}
          </button>

          {/* Logbook Tab */}
          <button
            id="nav-tab-logbook"
            disabled={isRecording}
            onClick={() => onSelectView('logbook')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeView === 'logbook'
                ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CodeIcon className={`w-3.5 h-3.5 ${activeView === 'logbook' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Logbook</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-black bg-rose-100 text-rose-700 rounded-full animate-pulse">
                {errorCount}
              </span>
            )}
          </button>

          {/* Docs Tab */}
          <button
            id="nav-tab-docs"
            disabled={isRecording}
            onClick={() => onSelectView('docs')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeView === 'docs'
                ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200/80 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BookOpen01Icon className={`w-3.5 h-3.5 ${activeView === 'docs' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Docs</span>
          </button>
        </nav>

        {/* Right Nav: Interactive Services Diagnostic Button & Settings */}
        <div className="flex items-center gap-2">
          <button
            id="nav-services-status-btn"
            onClick={() => onSelectView('services')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95 ${
              activeView === 'services'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs hover:border-slate-300'
            }`}
            title="Inspect running offline web engines & diagnostics"
          >
            <span>Services</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </button>

          <button
            id="nav-btn-settings"
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Configure Output & Audio Settings"
          >
            <Settings01Icon className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
