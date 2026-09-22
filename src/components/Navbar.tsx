import React, { useState, useEffect, useRef } from 'react';
import {
  Film01Icon,
  Sun01Icon,
  Moon02Icon,
  ComputerIcon,
  Camera01Icon,
  Mic01Icon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  Download01Icon,
  ComputerVideoIcon,
} from 'hugeicons-react';
import { ActiveView, RecordingMode } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeView: ActiveView;
  recordingsCount: number;
  onSelectView: (view: ActiveView) => void;
  onOpenSettings?: () => void;
  isRecording: boolean;
  recordingState?: 'idle' | 'countdown' | 'recording' | 'paused' | 'review' | 'editing';
  durationSeconds?: number;
  mode?: RecordingMode;
  onSelectMode?: (mode: RecordingMode) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isStoppingRecording?: boolean;
  onTogglePause?: () => void;
  onBackToModeSelect?: () => void;
  hasSelectedInitialMode?: boolean;
  onOpenEditorExport?: () => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  recordingsCount,
  onSelectView,
  isRecording,
  recordingState = 'idle',
  durationSeconds = 0,
  mode = 'screen_cam',
  onSelectMode,
  onStartRecording,
  onStopRecording,
  isStoppingRecording = false,
  onTogglePause,
  onBackToModeSelect,
  hasSelectedInitialMode = false,
  onOpenEditorExport,
  onGoHome,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  const recordingModes: {
    id: RecordingMode;
    tooltip: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'screen_cam',
      tooltip: 'Screen & Camera',
      icon: (
        <div className="flex items-center gap-0.5 sm:gap-1">
          <ComputerIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <Camera01Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      ),
    },
    {
      id: 'screen',
      tooltip: 'Screen only',
      icon: <ComputerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    },
    {
      id: 'cam_only',
      tooltip: 'Camera only',
      icon: <Camera01Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    },
    {
      id: 'audio_only',
      tooltip: 'Audio only',
      icon: <Mic01Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    },
  ];

  const handleBrandClick = () => {
    if (isRecording) return;
    if (onGoHome) {
      onGoHome();
      return;
    }
    if (onBackToModeSelect) {
      onBackToModeSelect();
    }
    onSelectView('studio');
  };

  // Center element content: either live recording timer badge + pause, or mode switcher
  const renderCenterContent = () => {
    if (isRecording) {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            id="header-live-recording-badge"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#D90000]/10 dark:bg-[#D90000]/20 border border-[#D90000]/30 text-[#D90000] dark:text-red-400 font-bold text-xs sm:text-sm animate-in fade-in shadow-xs"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  recordingState === 'paused' ? 'bg-[#FFEA93]' : 'bg-[#D90000]'
                } opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  recordingState === 'paused' ? 'bg-[#FFEA93]' : 'bg-[#D90000]'
                }`}
              />
            </span>
            <span className="font-mono font-bold tracking-wider text-xs sm:text-sm">
              {Math.floor(durationSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :
              {Math.floor(durationSeconds % 60)
                .toString()
                .padStart(2, '0')}
            </span>
            <span
              className={`text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold px-1 sm:px-1.5 py-0.5 rounded ${
                recordingState === 'paused' ? 'bg-[#FFEA93] text-black font-bold' : 'bg-[#D90000] text-white'
              }`}
            >
              {recordingState === 'paused' ? 'PAUSED' : 'REC'}
            </span>
          </div>

          {/* Pause / Resume Button beside Timer */}
          {onTogglePause && (
            <button
              type="button"
              id="header-pause-btn"
              onClick={onTogglePause}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                recordingState === 'paused'
                  ? 'bg-[#FFEA93] hover:bg-[#fae178] text-black border-[#FFEA93] shadow-md shadow-[#FFEA93]/30'
                  : 'bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border-slate-200/90 dark:border-white/10'
              }`}
              title={recordingState === 'paused' ? 'Resume Recording (Alt + P)' : 'Pause Recording (Alt + P)'}
            >
              {recordingState === 'paused' ? (
                <>
                  <PlayIcon className="w-3.5 h-3.5 fill-current text-black" />
                  <span className="hidden xs:inline">Resume</span>
                </>
              ) : (
                <>
                  <PauseIcon className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Pause</span>
                </>
              )}
            </button>
          )}
        </div>
      );
    }

    if (
      activeView === 'studio' &&
      hasSelectedInitialMode &&
      recordingState !== 'editing' &&
      recordingState !== 'review' &&
      onSelectMode
    ) {
      return (
        <div
          id="header-mode-switcher"
          role="radiogroup"
          aria-label="Recording Mode Switcher"
          className="flex items-center p-0.5 sm:p-1 bg-slate-100/90 dark:bg-zinc-900/90 rounded-full border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-md gap-0.5"
        >
          {recordingModes.map((item) => {
            const isSelected = mode === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  id={`header-mode-btn-${item.id}`}
                  onClick={() => onSelectMode(item.id)}
                  title={item.tooltip}
                  aria-label={item.tooltip}
                  className={`flex items-center justify-center ${
                    item.id === 'screen_cam' ? 'px-1.5 sm:px-2 h-7 sm:h-8' : 'w-7 h-7 sm:w-8 sm:h-8'
                  } rounded-full transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-white dark:bg-zinc-800 text-slate-950 dark:text-white shadow-xs font-bold border border-slate-200/90 dark:border-zinc-700/80 scale-100'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {item.icon}
                </button>

                {/* Sleek Tooltip Label on Hover */}
                <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center select-none">
                    {item.tooltip}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const centerContent = renderCenterContent();

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full relative bg-white/90 dark:bg-[#000000]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 transition-all select-none shadow-[0_1px_6px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
    >
      <div className="max-w-7xl mx-auto h-13 sm:h-14 px-2 sm:px-6 flex items-center justify-between gap-1 sm:gap-4 relative">
        {/* ── LEFT: Clean Brand Identity ── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 z-10">
          <button
            id="brand-logo-btn"
            type="button"
            onClick={handleBrandClick}
            className="flex items-center gap-2 cursor-pointer group text-left border-0 bg-transparent p-0"
            title="OSR Studio - Go to start screen"
          >
            {/* Minimalist Studio Aperture Badge */}
            <div className="relative flex items-center justify-center shrink-0">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#000000] via-zinc-800 to-zinc-950 dark:from-[#000000] dark:via-zinc-900 dark:to-zinc-800 p-[1.5px] shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform border border-white/10">
                <div className="w-full h-full rounded-[10px] bg-[#000000] flex items-center justify-center overflow-hidden relative">
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gradient-to-tr from-[#8DB355] to-[#FFEA93] p-[1px] shadow-xs flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D90000] shadow-xs" />
                  </div>
                </div>
              </div>

              {/* Live Recording Pulse Dot */}
              {isRecording && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D90000] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D90000] border border-white dark:border-[#000000]" />
                </span>
              )}
            </div>

            {/* Clean Brand Name - hidden on small mobile to prevent any collision */}
            <span className="hidden sm:inline text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-zinc-100 font-sans group-hover:text-slate-700 dark:group-hover:text-white transition-colors whitespace-nowrap">
              OSR Studio
            </span>
          </button>
        </div>

        {/* ── MOBILE CENTER: In-flow flex item so it NEVER overlaps sibling elements (< md) ── */}
        {centerContent && (
          <div className="md:hidden flex-1 flex items-center justify-center min-w-0 px-1 z-10">
            {centerContent}
          </div>
        )}

        {/* ── DESKTOP CENTER: Mathematically centered via absolute positioning (>= md) ── */}
        {centerContent && (
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-none z-20">
            <div className="pointer-events-auto">{centerContent}</div>
          </div>
        )}

        {/* ── RIGHT: Library button, Theme Switcher & Primary Action ── */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 z-10">
          {/* Library Button - shown on desktop, or on mobile when not in studio recorder mode */}
          <button
            id="nav-tab-library"
            disabled={isRecording}
            onClick={() => onSelectView(activeView === 'library' ? 'studio' : 'library')}
            className={`items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer active:scale-95 ${
              activeView === 'library'
                ? 'bg-[#000000] dark:bg-white text-white dark:text-[#000000] border-[#000000] dark:border-white shadow-xs'
                : 'bg-white dark:bg-[#000000] hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200/90 dark:border-white/10 shadow-xs'
            } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''} ${
              hasSelectedInitialMode && activeView === 'studio' ? 'hidden sm:flex' : 'flex'
            }`}
            title="View Saved Recordings"
          >
            <Film01Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Library</span>
            {recordingsCount > 0 && (
              <span
                className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
                  activeView === 'library'
                    ? 'bg-[#FFEA93] text-black'
                    : 'bg-[#FFEA93]/30 text-amber-900 dark:text-[#FFEA93]'
                }`}
              >
                {recordingsCount}
              </span>
            )}
          </button>

          {/* Theme Toggle: Compact circle on mobile (< sm) */}
          <button
            id="nav-theme-toggle-btn-mobile"
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="sm:hidden flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 cursor-pointer active:scale-95 shadow-xs"
          >
            {resolvedTheme === 'dark' ? (
              <Sun01Icon className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon02Icon className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </button>

          {/* Theme Toggle: Full sliding pill on desktop (>= sm) */}
          <button
            id="nav-theme-toggle-btn"
            type="button"
            role="switch"
            aria-checked={resolvedTheme === 'dark'}
            aria-label="Toggle theme"
            onClick={toggleTheme}
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="hidden sm:inline-flex relative items-center justify-between w-[52px] h-7 p-1 rounded-full bg-slate-200/90 dark:bg-zinc-800 border border-slate-300/80 dark:border-zinc-700/80 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-xs active:scale-95"
          >
            {/* Sun slot on left */}
            <span className="w-5 h-5 flex items-center justify-center pointer-events-none">
              <Sun01Icon className="w-3.5 h-3.5 text-amber-500/80 dark:text-zinc-500 transition-colors" />
            </span>

            {/* Moon slot on right */}
            <span className="w-5 h-5 flex items-center justify-center pointer-events-none">
              <Moon02Icon className="w-3.5 h-3.5 text-slate-400 dark:text-indigo-400/80 transition-colors" />
            </span>

            {/* Sliding Thumb */}
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-950 shadow-sm border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-center transition-transform duration-200 ease-out pointer-events-none ${
                resolvedTheme === 'dark' ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {resolvedTheme === 'dark' ? (
                <Moon02Icon className="w-3 h-3 text-indigo-400" />
              ) : (
                <Sun01Icon className="w-3 h-3 text-amber-500" />
              )}
            </span>
          </button>

          {/* Small Download Button in Top Header during Video Editing */}
          {activeView === 'studio' && recordingState === 'editing' && onOpenEditorExport && (
            <button
              id="nav-editor-download-button"
              type="button"
              onClick={onOpenEditorExport}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#D90000] hover:bg-[#b80000] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#D90000]/25 transition-all cursor-pointer whitespace-nowrap"
              title="Download / Export video"
            >
              <Download01Icon className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Download</span>
            </button>
          )}

          {/* Primary Quick Record / Pause & Stop Action Buttons */}
          {activeView === 'studio' &&
            hasSelectedInitialMode &&
            recordingState !== 'editing' &&
            recordingState !== 'review' &&
            onStartRecording &&
            onStopRecording && (
            <div className="shrink-0 flex items-center">
              {!isRecording ? (
                <button
                  id="top-record-button"
                  type="button"
                  onClick={onStartRecording}
                  disabled={recordingState === 'countdown'}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-full bg-[#D90000] hover:bg-[#b80000] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#D90000]/30 transition-all cursor-pointer whitespace-nowrap"
                  title="Start Recording"
                >
                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white animate-pulse" />
                  <span>Record</span>
                </button>
              ) : (
                /* Stop Button ONLY */
                <button
                  id="top-stop-recording-button"
                  type="button"
                  disabled={isStoppingRecording}
                  onClick={onStopRecording}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full ${
                    isStoppingRecording
                      ? 'bg-[#b80000] opacity-80 cursor-wait'
                      : 'bg-[#D90000] hover:bg-[#b80000] active:scale-95 cursor-pointer'
                  } text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#D90000]/40 transition-all whitespace-nowrap`}
                  title={isStoppingRecording ? 'Finalizing recording...' : 'Stop Recording'}
                >
                  <StopIcon className="w-3.5 h-3.5 fill-current" />
                  <span>{isStoppingRecording ? 'Saving...' : 'Stop'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
