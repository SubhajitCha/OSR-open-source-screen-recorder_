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
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

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
  const { t } = useLanguage();

  const [isScrolled, setIsScrolled] = useState(false);
  const [canHide, setCanHide] = useState(false);
  const prevYRef = useRef(0);
  const rafPendingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 8);

      if (rafPendingRef.current) return;
      rafPendingRef.current = true;
      requestAnimationFrame(() => {
        const deltaY = currentY - prevYRef.current;
        // Google Labs scroll interaction:
        // Keep header locked visible in hero area (< 180px) so cards pass behind frosted blur
        if (!isRecording) {
          if (currentY < 180) {
            setCanHide(false);
          } else if (deltaY > 10 && currentY > 200) {
            setCanHide(true);
          } else if (deltaY < -5) {
            setCanHide(false);
          }
        } else {
          setCanHide(false);
        }
        prevYRef.current = currentY;
        rafPendingRef.current = false;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isRecording]);

  const isModeSwitcherVisible =
    !isRecording &&
    activeView === 'studio' &&
    hasSelectedInitialMode &&
    recordingState !== 'editing' &&
    recordingState !== 'review' &&
    Boolean(onSelectMode);

  const [prevModeSwitcherVisible, setPrevModeSwitcherVisible] = useState(isModeSwitcherVisible);
  const [isIntroPeeking, setIsIntroPeeking] = useState(isModeSwitcherVisible);
  const [isModeSwitcherHovered, setIsModeSwitcherHovered] = useState(false);
  const [isModeSwitcherFocused, setIsModeSwitcherFocused] = useState(false);
  const [isTouchExpanded, setIsTouchExpanded] = useState(false);

  const hoverLeaveTimerRef = useRef<number | null>(null);
  const peekTimerRef = useRef<number | null>(null);

  if (isModeSwitcherVisible !== prevModeSwitcherVisible) {
    setPrevModeSwitcherVisible(isModeSwitcherVisible);
    setIsIntroPeeking(isModeSwitcherVisible);
    if (!isModeSwitcherVisible) {
      setIsModeSwitcherHovered(false);
      setIsModeSwitcherFocused(false);
      setIsTouchExpanded(false);
    }
  }

  // Peek all 4 options briefly when entering Studio so users discover the switcher,
  // then squeeze smoothly down to the active mode.
  useEffect(() => {
    if (peekTimerRef.current) {
      window.clearTimeout(peekTimerRef.current);
      peekTimerRef.current = null;
    }

    if (isModeSwitcherVisible && isIntroPeeking) {
      peekTimerRef.current = window.setTimeout(() => {
        setIsIntroPeeking(false);
        peekTimerRef.current = null;
      }, 1400);
    }

    return () => {
      if (peekTimerRef.current) {
        window.clearTimeout(peekTimerRef.current);
        peekTimerRef.current = null;
      }
    };
  }, [isModeSwitcherVisible, isIntroPeeking]);

  // Dismiss touch-expanded mode switcher when tapping outside
  useEffect(() => {
    if (!isTouchExpanded) return;

    const handleOutsidePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('#header-mode-switcher')) {
        setIsTouchExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [isTouchExpanded]);

  useEffect(() => {
    return () => {
      if (hoverLeaveTimerRef.current) {
        window.clearTimeout(hoverLeaveTimerRef.current);
      }
    };
  }, []);

  const isModeSwitcherExpanded =
    isIntroPeeking || isModeSwitcherHovered || isModeSwitcherFocused || isTouchExpanded;

  const handleModeSwitcherMouseEnter = () => {
    if (hoverLeaveTimerRef.current) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    setIsModeSwitcherHovered(true);
  };

  const handleModeSwitcherMouseLeave = () => {
    if (hoverLeaveTimerRef.current) {
      window.clearTimeout(hoverLeaveTimerRef.current);
    }
    hoverLeaveTimerRef.current = window.setTimeout(() => {
      setIsModeSwitcherHovered(false);
      hoverLeaveTimerRef.current = null;
    }, 140);
  };

  const handleModeSwitcherFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement)?.matches?.(':focus-visible')) {
      setIsModeSwitcherFocused(true);
    }
  };

  const handleModeSwitcherBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsModeSwitcherFocused(false);
    }
  };

  const recordingModes: {
    id: RecordingMode;
    tooltip: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'screen_cam',
      tooltip: t.hero.modes.screenCam.title,
      icon: (
        <div className="flex items-center gap-0.5 sm:gap-1">
          <ComputerIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <Camera01Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      ),
    },
    {
      id: 'screen',
      tooltip: t.hero.modes.screen.title,
      icon: <ComputerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    },
    {
      id: 'cam_only',
      tooltip: t.hero.modes.camOnly.title,
      icon: <Camera01Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
    },
    {
      id: 'audio_only',
      tooltip: t.hero.modes.audioOnly.title,
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
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-900 dark:bg-[#252C3B] border border-slate-700/80 dark:border-white/15 text-white font-bold text-xs sm:text-sm animate-in fade-in shadow-xs"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  recordingState === 'paused' ? 'bg-[#FFEA93]' : 'bg-rose-400'
                } opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  recordingState === 'paused' ? 'bg-[#FFEA93]' : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="font-mono font-bold tracking-wider text-xs sm:text-sm text-white">
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
                recordingState === 'paused' ? 'bg-[#FFEA93] text-black font-bold' : 'bg-rose-600 text-white'
              }`}
            >
              {recordingState === 'paused' ? 'PAUSED' : 'REC'}
            </span>
          </div>

          {/* Pause / Resume Button beside Timer */}
          {onTogglePause && (
            <div className="relative group flex items-center">
              <button
                type="button"
                id="header-pause-btn"
                onClick={onTogglePause}
                aria-label={recordingState === 'paused' ? 'Resume Recording (Alt + P)' : 'Pause Recording (Alt + P)'}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                  recordingState === 'paused'
                    ? 'bg-[#FFEA93] hover:bg-[#fae178] text-black border-[#FFEA93] shadow-md shadow-[#FFEA93]/30'
                    : 'bg-white hover:bg-slate-100 dark:bg-[#252C3B] dark:hover:bg-[#30394D] text-slate-800 dark:text-zinc-200 border-slate-200/90 dark:border-white/15'
                }`}
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
              <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 select-none">
                  {recordingState === 'paused' ? 'Resume Recording (Alt + P)' : 'Pause Recording (Alt + P)'}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isModeSwitcherVisible && onSelectMode) {
      return (
        <div
          id="header-mode-switcher"
          role="radiogroup"
          aria-label="Recording Mode Switcher"
          onMouseEnter={handleModeSwitcherMouseEnter}
          onMouseLeave={handleModeSwitcherMouseLeave}
          onFocus={handleModeSwitcherFocus}
          onBlur={handleModeSwitcherBlur}
          className={`flex items-center p-0.5 sm:p-1 bg-slate-200/55 dark:bg-white/[0.08] rounded-full border border-slate-300/60 dark:border-white/15 backdrop-blur-md gap-0 transition-shadow duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isModeSwitcherExpanded
              ? 'shadow-md shadow-black/5 dark:shadow-black/30'
              : 'shadow-xs'
          }`}
        >
          {recordingModes.map((item) => {
            const isSelected = mode === item.id;
            const shouldShow = isSelected || isModeSwitcherExpanded;
            return (
              <div key={item.id} className="relative group flex items-center">
                <div
                  className={`overflow-hidden flex items-center transition-[max-width,opacity,transform,margin] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    shouldShow
                      ? `${item.id === 'screen_cam' ? 'max-w-[56px]' : 'max-w-[38px]'} opacity-100 scale-100 ${
                          isModeSwitcherExpanded ? 'mx-[1px]' : 'mx-0'
                        }`
                      : 'max-w-0 opacity-0 scale-75 mx-0 pointer-events-none'
                  }`}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-hidden={!shouldShow}
                    tabIndex={shouldShow ? 0 : -1}
                    id={`header-mode-btn-${item.id}`}
                    onClick={() => {
                      if (!isModeSwitcherExpanded) {
                        setIsTouchExpanded(true);
                        return;
                      }
                      onSelectMode(item.id);
                      setIsTouchExpanded(false);
                    }}
                    aria-label={item.tooltip}
                    className={`shrink-0 flex items-center justify-center ${
                      item.id === 'screen_cam' ? 'px-1.5 sm:px-2 h-7 sm:h-8' : 'w-7 h-7 sm:w-8 sm:h-8'
                    } rounded-full transition-colors duration-200 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-white dark:bg-[#2E3648] text-slate-950 dark:text-white shadow-xs font-bold border border-slate-200/90 dark:border-white/15'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {item.icon}
                  </button>
                </div>

                {/* Sleek Tooltip Label on Hover */}
                <div
                  className={`pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block ${
                    shouldShow
                      ? 'opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
                      : 'opacity-0 scale-95'
                  }`}
                >
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
      className={`header ${resolvedTheme === 'dark' ? 'surface--dark' : 'surface--light'}`}
      data-can-hide={canHide ? 'true' : 'false'}
      data-scrolled={isScrolled ? 'true' : 'false'}
      data-open="false"
    >
      {/* Google Labs Multi-Layer Progressive Blur System */}
      <div aria-hidden="true" className="header__blur">
        <span className="header__blur-layer header__blur-layer--1" />
        <span className="header__blur-layer header__blur-layer--2" />
        <span className="header__blur-layer header__blur-layer--3" />
        <span className="header__blur-layer header__blur-layer--4" />
        <span className="header__blur-layer header__blur-layer--5" />
      </div>

      <nav aria-label="Main navigation" className="header__nav">
        <div className="max-w-7xl mx-auto w-full h-13 sm:h-14 px-2 sm:px-4 lg:px-6 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2.5 lg:gap-4 relative z-10">
          {/* ── LEFT: Clean Brand Identity ── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 justify-self-start z-10">
          <div className="relative group flex items-center">
            <button
              id="brand-logo-btn"
              type="button"
              onClick={handleBrandClick}
              aria-label="FSR Studio - Go to start screen"
              className="flex items-center gap-2 cursor-pointer text-left border-0 bg-transparent p-0"
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
              FSR Studio
            </span>
          </button>
            <div className="pointer-events-none absolute top-full left-0 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 select-none">
                FSR Studio — Start Screen
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER: In-flow grid track (mathematically centered on wide viewports, never overlaps siblings on narrower ones) ── */}
        <div className="justify-self-center flex items-center justify-center min-w-0 z-30">
          {centerContent}
        </div>

        {/* ── RIGHT: Library button, Theme Switcher & Primary Action ── */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 justify-self-end z-10">
          {/* Library Button - shown on desktop, or on mobile when not in studio recorder mode */}
          <div
            className={`relative group items-center ${
              hasSelectedInitialMode && activeView === 'studio' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            <button
              id="nav-tab-library"
              disabled={isRecording}
              onClick={() => onSelectView(activeView === 'library' ? 'studio' : 'library')}
              aria-label="View Saved Recordings"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                activeView === 'library'
                  ? 'bg-slate-200/95 dark:bg-[#31394D] text-slate-950 dark:text-white border-slate-300/90 dark:border-white/25 ring-2 ring-slate-400/25 dark:ring-white/10 shadow-xs'
                  : 'bg-slate-100/90 hover:bg-slate-200/80 dark:bg-[#232936]/90 dark:hover:bg-[#2D3546] text-slate-700 dark:text-zinc-200 border-slate-200/80 dark:border-white/15 shadow-2xs backdrop-blur-md'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Film01Icon className="w-3.5 h-3.5 shrink-0" />
              <span className={centerContent ? 'hidden md:inline' : 'hidden sm:inline'}>{t.nav.library}</span>
              {recordingsCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
                    activeView === 'library'
                      ? 'bg-white text-slate-900 dark:bg-[#1E232E] dark:text-white shadow-2xs'
                      : 'bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-zinc-200'
                  }`}
                >
                  {recordingsCount}
                </span>
              )}
            </button>
            <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 select-none">
                {t.nav.library}
              </div>
            </div>
          </div>

          {/* Theme Toggle: Compact circle on mobile (< sm) */}
          <button
            id="nav-theme-toggle-btn-mobile"
            type="button"
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="sm:hidden flex items-center justify-center w-7 h-7 rounded-full bg-slate-200/60 dark:bg-[#252C3B]/90 backdrop-blur-md border border-slate-300/70 dark:border-white/15 text-slate-700 dark:text-zinc-200 cursor-pointer active:scale-95 shadow-xs"
          >
            {resolvedTheme === 'dark' ? (
              <Sun01Icon className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon02Icon className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </button>

          {/* Theme Toggle: Full sliding pill on desktop (>= sm) */}
          <div className="hidden sm:flex relative group items-center">
            <button
              id="nav-theme-toggle-btn"
              type="button"
              role="switch"
              aria-checked={resolvedTheme === 'dark'}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
              className="inline-flex relative items-center justify-between w-[52px] h-7 p-1 rounded-full bg-slate-200/70 dark:bg-[#252C3B] backdrop-blur-md border border-slate-300/80 dark:border-white/15 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-xs active:scale-95"
            >
              {/* Sun slot on left */}
              <span className="w-5 h-5 flex items-center justify-center pointer-events-none">
                <Sun01Icon className="w-3.5 h-3.5 text-amber-500/80 dark:text-zinc-400 transition-colors" />
              </span>

              {/* Moon slot on right */}
              <span className="w-5 h-5 flex items-center justify-center pointer-events-none">
                <Moon02Icon className="w-3.5 h-3.5 text-slate-400 dark:text-indigo-400/80 transition-colors" />
              </span>

              {/* Sliding Thumb */}
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white dark:bg-[#1A202B] shadow-sm border border-slate-200/80 dark:border-white/15 flex items-center justify-center transition-transform duration-200 ease-out pointer-events-none ${
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
            <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 select-none">
                {resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </div>
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <LanguageSelector variant="compact" />

          {/* Small Download Button in Top Header during Video Editing */}
          {activeView === 'studio' && recordingState === 'editing' && onOpenEditorExport && (
            <div className="relative group flex items-center">
              <button
                id="nav-editor-download-button"
                type="button"
                onClick={onOpenEditorExport}
                aria-label={t.review.downloadMp4}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#D90000] hover:bg-[#b80000] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#D90000]/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <Download01Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t.common.download}</span>
              </button>
              <div className="pointer-events-none absolute top-full right-0 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 select-none">
                  {t.review.downloadMp4}
                </div>
              </div>
            </div>
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
                <div className="relative group flex items-center">
                  <button
                    id="top-record-button"
                    type="button"
                    onClick={onStartRecording}
                    disabled={recordingState === 'countdown'}
                    aria-label={t.recorder.startRecordBtn}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-full bg-[#D90000] hover:bg-[#b80000] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#D90000]/30 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white animate-pulse" />
                    <span>{t.common.record}</span>
                  </button>
                  <div className="pointer-events-none absolute top-full right-0 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 select-none">
                      {t.recorder.startRecordBtn}
                    </div>
                  </div>
                </div>
              ) : (
                /* Stop Button ONLY */
                <div className="relative group flex items-center">
                  <button
                    id="top-stop-recording-button"
                    type="button"
                    disabled={isStoppingRecording}
                    onClick={onStopRecording}
                    aria-label={isStoppingRecording ? t.common.processing : t.recorder.stopRecordBtn}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full border ${
                      isStoppingRecording
                        ? 'bg-slate-800 dark:bg-[#252C3B] border-slate-700 dark:border-white/15 opacity-80 cursor-wait'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-[#252C3B] dark:hover:bg-[#30394D] border-slate-700/80 dark:border-white/15 active:scale-95 cursor-pointer'
                    } text-white font-bold text-xs sm:text-sm shadow-md shadow-black/20 transition-all whitespace-nowrap`}
                  >
                    <StopIcon className="w-3.5 h-3.5 fill-current text-rose-400" />
                    <span className="text-white">{isStoppingRecording ? t.common.processing : t.common.stop}</span>
                  </button>
                  <div className="pointer-events-none absolute top-full right-0 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 select-none">
                      {isStoppingRecording ? t.common.processing : t.recorder.stopRecordBtn}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </nav>
    </header>
  );
};
