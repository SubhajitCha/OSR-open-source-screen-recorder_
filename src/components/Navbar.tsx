import React, { useState, useEffect, useRef } from 'react';
import {
  Video01Icon,
  Film01Icon,
  BookOpen01Icon,
  Settings01Icon,
  CodeIcon,
  SparklesIcon,
  Sun01Icon,
  Moon02Icon,
  ComputerIcon,
} from 'hugeicons-react';
import { ActiveView } from '../types';
import { logbook } from '../services/logbook';
import { useTheme, Theme } from '../context/ThemeContext';

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
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = logbook.subscribe((logs) => {
      const errs = logs.filter((l) => l.level === 'error').length;
      setErrorCount(errs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#09090B]/90 backdrop-blur-xl border-b border-slate-200/70 dark:border-zinc-800/80 transition-all select-none shadow-[0_2px_12px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
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
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-500 dark:from-emerald-500 dark:via-emerald-400 dark:to-cyan-500 blur-sm opacity-40 group-hover:opacity-75 transition-opacity" />
            
            {/* Main Badge Container */}
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-950 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-950 p-[1.5px] shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] dark:from-[#09090B] dark:to-[#18181B] flex items-center justify-center overflow-hidden relative">
                {/* Center Aperture Iris */}
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-400 dark:from-emerald-400 dark:via-emerald-500 dark:to-teal-400 p-[1.5px] shadow-xs flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-emerald-300 shadow-xs" />
                </div>

                {/* Subtle Lens Flare Shimmer */}
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-white/20 blur-[2px] pointer-events-none" />
              </div>
            </div>

            {/* Live Recording Pulse Indicator */}
            {isRecording && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white dark:border-zinc-900" />
              </span>
            )}
          </div>

          {/* Clean Modern Typography & Tagline */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-zinc-100 font-sans group-hover:text-blue-900 dark:group-hover:text-white transition-colors">
                OSR Studio
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50/80 dark:bg-emerald-950/50 text-[10px] font-bold text-blue-700 dark:text-emerald-400 border border-blue-200/50 dark:border-emerald-800/60 font-mono">
                <SparklesIcon className="w-2.5 h-2.5 text-blue-600 dark:text-emerald-400" />
                <span>v2.4</span>
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 tracking-tight leading-tight hidden sm:block">
              100% Client-Side Screen & Camera Engine
            </span>
          </div>
        </div>

        {/* Center Pill Segmented Switcher */}
        <nav className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xs">
          {/* Studio Tab */}
          <button
            id="nav-tab-studio"
            disabled={isRecording}
            onClick={() => onSelectView('studio')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeView === 'studio'
                ? 'bg-white dark:bg-zinc-800 text-blue-900 dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-zinc-700 font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50 font-semibold'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Video01Icon className={`w-3.5 h-3.5 ${activeView === 'studio' ? 'text-blue-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}`} />
            <span>Studio</span>
          </button>

          {/* Library Tab */}
          <button
            id="nav-tab-library"
            disabled={isRecording}
            onClick={() => onSelectView('library')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeView === 'library'
                ? 'bg-white dark:bg-zinc-800 text-blue-900 dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-zinc-700 font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50 font-semibold'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Film01Icon className={`w-3.5 h-3.5 ${activeView === 'library' ? 'text-blue-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}`} />
            <span>Library</span>
            {recordingsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-black bg-blue-100/80 dark:bg-emerald-950/80 text-blue-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/60 rounded-full">
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
                ? 'bg-white dark:bg-zinc-800 text-blue-900 dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-zinc-700 font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50 font-semibold'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CodeIcon className={`w-3.5 h-3.5 ${activeView === 'logbook' ? 'text-blue-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}`} />
            <span>Logbook</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-transparent dark:border-rose-800/60 rounded-full animate-pulse">
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
                ? 'bg-white dark:bg-zinc-800 text-blue-900 dark:text-white shadow-xs ring-1 ring-slate-200/80 dark:ring-zinc-700 font-black'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/50 font-semibold'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <BookOpen01Icon className={`w-3.5 h-3.5 ${activeView === 'docs' ? 'text-blue-600 dark:text-emerald-400' : 'text-slate-400 dark:text-zinc-500'}`} />
            <span>Docs</span>
          </button>
        </nav>

        {/* Right Nav: Theme Switcher, Services Diagnostic Button & Settings */}
        <div className="flex items-center gap-2">
          {/* Theme Selector (Outbid style) */}
          <div className="relative" ref={themeMenuRef}>
            <button
              id="nav-theme-toggle-btn"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs active:scale-95"
              title={`Current theme: ${theme} (Click to toggle)`}
            >
              {resolvedTheme === 'dark' ? (
                <Moon02Icon className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Sun01Icon className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="hidden sm:inline-block capitalize text-[11px] font-mono font-bold">
                {theme}
              </span>
            </button>

            {/* Dropdown Menu for Quick Theme Switch */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setTheme('light');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl text-left transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Sun01Icon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Mode</span>
                </button>

                <button
                  onClick={() => {
                    setTheme('dark');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl text-left transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-emerald-50 dark:bg-zinc-800 text-emerald-900 dark:text-emerald-400 font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Moon02Icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dark (Outbid)</span>
                </button>

                <button
                  onClick={() => {
                    setTheme('system');
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl text-left transition-colors cursor-pointer ${
                    theme === 'system'
                      ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <ComputerIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Auto</span>
                </button>
              </div>
            )}
          </div>

          <button
            id="nav-services-status-btn"
            onClick={() => onSelectView('services')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95 ${
              activeView === 'services'
                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-slate-900 dark:border-zinc-100 shadow-xs'
                : 'bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700'
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
            className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
            title="Configure Output & Audio Settings"
          >
            <Settings01Icon className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

