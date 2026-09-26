import React, { useState, useEffect, useRef } from 'react';
import {
  ComputerIcon,
  Camera01Icon,
  CameraOff01Icon,
  Mic01Icon,
  MicOff01Icon,
  Layers01Icon,
  ColorsIcon,
  Settings01Icon,
  ArrowUp01Icon,
  SparklesIcon,
  ArrowDown01Icon,
  AlertCircleIcon,
} from 'hugeicons-react';
import {
  CompositionLayout,
  PipConfig,
  RecorderAspectRatio,
  RecorderBackgroundConfig,
  SmartRecordingConfig,
  PrompterConfig,
  AudioSettings,
  VideoSettings,
  RecordingMode,
} from '../../types';
import { ScreenPopover } from './popovers/ScreenPopover';
import { CameraPopover } from './popovers/CameraPopover';
import { MicPopover } from './popovers/MicPopover';
import { LayoutPopover } from './popovers/LayoutPopover';
import { BackgroundPopover } from './popovers/BackgroundPopover';
import { SmartRecordingPopover } from './popovers/SmartRecordingPopover';
import { MicPulseButton } from './MicPulseButton';

interface RecorderToolbarProps {
  layout: CompositionLayout;
  onSelectLayout: (layout: CompositionLayout) => void;
  aspectRatio: RecorderAspectRatio;
  onSelectAspectRatio: (ratio: RecorderAspectRatio) => void;
  background: RecorderBackgroundConfig;
  onUpdateBackground: (updates: Partial<RecorderBackgroundConfig>) => void;
  pipConfig: PipConfig;
  onUpdatePipConfig: (updates: Partial<PipConfig>) => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (updates: Partial<AudioSettings>) => void;
  videoSettings: VideoSettings;
  smartConfig: SmartRecordingConfig;
  onUpdateSmartConfig: (updates: Partial<SmartRecordingConfig>) => void;
  prompter: PrompterConfig;
  onUpdatePrompter: (updates: Partial<PrompterConfig>) => void;
  mode?: RecordingMode;
  isCameraActive: boolean;
  onToggleCamera: (active: boolean) => void;
  isScreenActive?: boolean;
  onToggleScreen?: (active: boolean) => void;
  isMicActive?: boolean;
  isMicBlocked?: boolean;
  onToggleMic?: (active: boolean) => void;
  onEnableMic?: () => void;
  micStream?: MediaStream | null;
  onOpenSettings?: () => void;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  height?: number | null;
}

type ActivePopover =
  | null
  | 'screen'
  | 'camera'
  | 'mic'
  | 'layout'
  | 'size'
  | 'background'
  | 'prompter'
  | 'smart';

export const RecorderToolbar: React.FC<RecorderToolbarProps> = ({
  layout,
  onSelectLayout,
  aspectRatio,
  onSelectAspectRatio,
  background,
  onUpdateBackground,
  pipConfig,
  onUpdatePipConfig,
  audioSettings,
  onUpdateAudioSettings,
  videoSettings,
  smartConfig,
  onUpdateSmartConfig,
  prompter,
  onUpdatePrompter,
  mode = 'screen_cam',
  isCameraActive,
  onToggleCamera,
  isScreenActive = false,
  onToggleScreen,
  isMicActive = false,
  isMicBlocked = false,
  onToggleMic,
  onEnableMic,
  micStream = null,
  onOpenSettings,
  disabled = false,
  orientation = 'vertical',
  height,
}) => {
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const isVertical = orientation === 'vertical';
  const popoverPlacement = isVertical ? 'left' : 'top';

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePopover = (popover: ActivePopover) => {
    if (disabled) return;
    setActivePopover((prev) => (prev === popover ? null : popover));
  };

  // ─────────────────────────────────────────────────────────────
  // VERTICAL MODE: Compact circular buttons + Sleek Left-to-Right Hover Badges + Top-to-Bottom Distribution
  // ─────────────────────────────────────────────────────────────
  if (isVertical) {
    return (
      <div
        ref={toolbarRef}
        id="recorder-compact-toolbar"
        className="relative z-30 flex flex-col items-center justify-center gap-2 sm:gap-2.5 select-none w-10 sm:w-11 py-0.5"
      >
        {/* 1. CAMERA BUTTON (Toggle + Dropdown + Sleek Hover Badge) */}
        <div className="relative flex items-center justify-center group">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => onToggleCamera(!isCameraActive)}
              title={isCameraActive ? 'Hide camera' : 'Add camera'}
              className="cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm ${
                  isCameraActive
                    ? 'bg-[#8DB355] hover:bg-[#7ea248] text-white shadow-md shadow-[#8DB355]/30'
                    : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {isCameraActive ? (
                  <Camera01Icon className="w-5 h-5 stroke-[2]" />
                ) : (
                  <CameraOff01Icon className="w-5 h-5 stroke-[2]" />
                )}
              </div>
            </button>

            {/* Dedicated Chevron for Camera Device Selection */}
            <button
              type="button"
              title="Choose Camera Device & Settings"
              onClick={(e) => {
                e.stopPropagation();
                togglePopover('camera');
              }}
              className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border shadow-xs cursor-pointer hover:scale-115 transition-all z-20 ${
                activePopover === 'camera'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-zinc-700 dark:border-white'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
            >
              <ArrowDown01Icon className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Sleek Tooltip Label on Hover (smooth left-to-right emergence with easing) */}
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCameraActive ? 'bg-[#8DB355]' : 'bg-slate-400 dark:bg-zinc-500'
                }`}
              />
              <span>{isCameraActive ? 'Hide Cam' : 'Add Cam'}</span>
            </div>
          </div>

          <CameraPopover
            isOpen={activePopover === 'camera'}
            onClose={() => setActivePopover(null)}
            pipConfig={pipConfig}
            onUpdatePipConfig={onUpdatePipConfig}
            isCameraActive={isCameraActive}
            onToggleCamera={onToggleCamera}
            placement={popoverPlacement}
          />
        </div>

        {/* 2. MIC BUTTON (Reactive pulse toggle + Dropdown + Sleek Hover Badge + Blocked Indicator) */}
        <div className="relative flex items-center justify-center group">
          <div className="relative flex items-center justify-center">
            <MicPulseButton
              size="sm"
              isMicActive={isMicActive}
              isMicBlocked={isMicBlocked}
              micStream={micStream}
              disabled={disabled}
              onClick={() => {
                if (isMicBlocked) {
                  if (onEnableMic) onEnableMic();
                  else if (onToggleMic) onToggleMic(true);
                } else if (onToggleMic) {
                  onToggleMic(!isMicActive);
                } else {
                  onUpdateAudioSettings({ includeMic: !audioSettings.includeMic });
                }
              }}
              isPopoverOpen={activePopover === 'mic'}
              onTogglePopover={() => togglePopover('mic')}
            />
          </div>

          {/* If microphone is blocked by browser, show small persistent format beside the mic button */}
          {isMicBlocked ? (
            <div
              id="mic-permission-error-pill"
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 dark:bg-[#1a0808] text-[#D90000] dark:text-red-400 border border-red-200 dark:border-red-900/60 shadow-xl shadow-red-950/15 backdrop-blur-md text-[11px] font-medium whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200"
            >
              <AlertCircleIcon className="w-3.5 h-3.5 shrink-0 text-[#D90000]" />
              <span>Mic blocked by browser</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEnableMic) onEnableMic();
                  else if (onToggleMic) onToggleMic(true);
                }}
                className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#D90000] hover:bg-[#b80000] text-white rounded-md transition-colors cursor-pointer"
                title="Retry requesting microphone access"
              >
                Allow
              </button>
            </div>
          ) : (
            /* Sleek Tooltip Label on Hover (when not blocked) */
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isMicActive ? 'bg-[#8DB355]' : 'bg-[#D90000]'
                  }`}
                />
                <span>{isMicActive ? 'Mute Mic' : 'Unmute Mic'}</span>
              </div>
            </div>
          )}

          <MicPopover
            isOpen={activePopover === 'mic'}
            onClose={() => setActivePopover(null)}
            audioSettings={audioSettings}
            onUpdateAudioSettings={onUpdateAudioSettings}
            isMicActive={isMicActive}
            onToggleMic={onToggleMic}
            placement={popoverPlacement}
          />
        </div>

        {/* 3. SCREEN BUTTON (Toggle + Sleek Hover Badge) */}
        <div className="relative flex items-center justify-center group">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (onToggleScreen) {
                  onToggleScreen(!isScreenActive);
                }
              }}
              title={isScreenActive ? 'Stop sharing screen' : 'Start sharing screen'}
              className="cursor-pointer"
            >
              <div
                className={`relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm ${
                  isScreenActive
                    ? 'bg-[#8DB355] hover:bg-[#7ea248] text-white shadow-md shadow-[#8DB355]/30'
                    : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-400'
                }`}
              >
                <ArrowUp01Icon className="w-5 h-5 stroke-[2.5]" />
              </div>
            </button>
          </div>

          {/* Sleek Tooltip Label on Hover */}
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isScreenActive ? 'bg-[#8DB355]' : 'bg-slate-400 dark:bg-zinc-500'
                }`}
              />
              <span>{isScreenActive ? 'Stop Sharing' : 'Share Screen'}</span>
            </div>
          </div>

          <ScreenPopover
            isOpen={activePopover === 'screen'}
            onClose={() => setActivePopover(null)}
            audioSettings={audioSettings}
            onUpdateAudioSettings={onUpdateAudioSettings}
            videoSettings={videoSettings}
            isScreenActive={isScreenActive}
            onToggleScreen={onToggleScreen}
            placement={popoverPlacement}
          />
        </div>

        {/* ── SUBTLE HORIZONTAL DIVIDER ── */}
        <div className="w-6 h-[1.5px] bg-slate-300/80 dark:bg-white/15 rounded-full my-0.5" />

        {/* 4. LAYOUTS BUTTON (Popover trigger + Sleek Hover Badge) - Hidden in Audio Only Mode */}
        {mode !== 'audio_only' && (
          <div className="relative flex items-center justify-center group">
            <button
              type="button"
              onClick={() => {
                if (!disabled) togglePopover('layout');
              }}
              title="Choose Recording Composition Layout"
              className={`cursor-pointer ${disabled ? 'opacity-35 cursor-not-allowed' : ''}`}
            >
              <div className="relative w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all duration-150 shadow-sm">
                <Layers01Icon className="w-5 h-5 stroke-[1.8]" />
              </div>
            </button>

            {/* Sleek Tooltip Label on Hover */}
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center select-none">
                <span>Layouts</span>
              </div>
            </div>

            <LayoutPopover
              isOpen={activePopover === 'layout'}
              onClose={() => setActivePopover(null)}
              layout={layout}
              onSelectLayout={onSelectLayout}
              background={background}
              placement={popoverPlacement}
              mode={mode}
            />
          </div>
        )}

        {/* 5. BACKGROUND BUTTON (Popover trigger + Swatch + Sleek Hover Badge) */}
        <div className="relative flex items-center justify-center group">
          <button
            type="button"
            onClick={() => togglePopover('background')}
            title="Choose Stage Background & Backdrop"
            className="cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all duration-150 shadow-sm">
              <ColorsIcon className="w-5 h-5 stroke-[1.8]" />
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-800 shadow-sm"
                style={{
                  background:
                    background.type === 'solid'
                      ? background.value
                      : background.type === 'gradient'
                      ? background.value
                      : '#111418',
                }}
              />
            </div>
          </button>

          {/* Sleek Tooltip Label on Hover */}
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
              <span
                className="w-2 h-2 rounded-full border border-white/30"
                style={{
                  background:
                    background.type === 'solid'
                      ? background.value
                      : background.type === 'gradient'
                      ? background.value
                      : '#8DB355',
                }}
              />
              <span>Background</span>
            </div>
          </div>

          <BackgroundPopover
            isOpen={activePopover === 'background'}
            onClose={() => setActivePopover(null)}
            background={background}
            onUpdateBackground={onUpdateBackground}
            placement={popoverPlacement}
          />
        </div>

        {/* 6. SETTINGS BUTTON (Popover trigger + Gear + Sleek Hover Badge) */}
        <div className="relative flex items-center justify-center group">
          <button
            type="button"
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else togglePopover('smart');
            }}
            title="Audio, Video & AI Studio Settings"
            className="cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all duration-150 shadow-sm">
              <Settings01Icon className="w-5 h-5 stroke-[1.8]" />
            </div>
          </button>

          {/* Sleek Tooltip Label on Hover */}
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
              <Settings01Icon className="w-3 h-3 stroke-[2]" />
              <span>Settings</span>
            </div>
          </div>

          <SmartRecordingPopover
            isOpen={activePopover === 'smart'}
            onClose={() => setActivePopover(null)}
            smartConfig={smartConfig}
            onUpdateSmartConfig={onUpdateSmartConfig}
            placement={popoverPlacement}
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // HORIZONTAL FALLBACK MODE: For bottom toolbars
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={toolbarRef}
      id="recorder-compact-toolbar"
      className="relative z-30 flex items-center justify-center gap-3 sm:gap-6 flex-wrap py-2 px-3 sm:px-4 max-w-fit mx-auto select-none"
    >
      {/* ── SECTION 1: Media Inputs (Cam, Mic, Screen) ── */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* 1. CAMERA BUTTON */}
        <div className="relative flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => onToggleCamera(!isCameraActive)}
              title={isCameraActive ? 'Hide camera' : 'Add camera'}
              className="group flex flex-col items-center cursor-pointer"
            >
              <div
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm ${
                  isCameraActive
                    ? 'bg-[#8DB355] hover:bg-[#7a9d47] text-white shadow-md shadow-[#8DB355]/30'
                    : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {isCameraActive ? (
                  <Camera01Icon className="w-5 h-5 stroke-[2]" />
                ) : (
                  <CameraOff01Icon className="w-5 h-5 stroke-[2]" />
                )}
              </div>
            </button>

            <button
              type="button"
              title="Choose Camera Device & Settings"
              onClick={(e) => {
                e.stopPropagation();
                togglePopover('camera');
              }}
              className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border shadow-xs cursor-pointer hover:scale-115 transition-all z-20 ${
                activePopover === 'camera'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-zinc-700 dark:border-white'
                  : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-zinc-700'
              }`}
            >
              <ArrowDown01Icon className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
          </div>

          <span
            className={`text-xs font-semibold whitespace-nowrap mt-1 cursor-pointer ${
              isCameraActive
                ? 'text-[#8DB355] dark:text-[#a2c86b]'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
            onClick={() => onToggleCamera(!isCameraActive)}
          >
            {isCameraActive ? 'Hide Cam' : 'Add Cam'}
          </span>

          <CameraPopover
            isOpen={activePopover === 'camera'}
            onClose={() => setActivePopover(null)}
            pipConfig={pipConfig}
            onUpdatePipConfig={onUpdatePipConfig}
            isCameraActive={isCameraActive}
            onToggleCamera={onToggleCamera}
            placement={popoverPlacement}
          />
        </div>

        {/* 2. MIC BUTTON */}
        <div className="relative flex flex-col items-center">
          <MicPulseButton
            size="sm"
            isMicActive={isMicActive}
            isMicBlocked={isMicBlocked}
            micStream={micStream}
            disabled={disabled}
            onClick={() => {
              if (isMicBlocked) {
                if (onEnableMic) onEnableMic();
                else if (onToggleMic) onToggleMic(true);
              } else if (onToggleMic) {
                onToggleMic(!isMicActive);
              } else {
                onUpdateAudioSettings({ includeMic: !audioSettings.includeMic });
              }
            }}
            isPopoverOpen={activePopover === 'mic'}
            onTogglePopover={() => togglePopover('mic')}
          />

          {isMicBlocked ? (
            <div
              id="mic-blocked-badge-horizontal"
              className="flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded-md bg-red-50 dark:bg-[#1a0808] text-[#D90000] dark:text-red-400 border border-red-200 dark:border-red-900/60 text-[10px] font-semibold whitespace-nowrap cursor-pointer"
              onClick={() => {
                if (onEnableMic) onEnableMic();
                else if (onToggleMic) onToggleMic(true);
              }}
              title="Microphone blocked by browser — click to allow"
            >
              <AlertCircleIcon className="w-2.5 h-2.5 text-[#D90000] shrink-0" />
              <span>Mic blocked</span>
            </div>
          ) : (
            <span
              className={`text-xs font-semibold whitespace-nowrap mt-1 cursor-pointer ${
                isMicActive
                  ? 'text-[#8DB355] dark:text-[#a2c86b]'
                  : 'text-[#D90000]'
              }`}
              onClick={() => {
                if (onToggleMic) {
                  onToggleMic(!isMicActive);
                } else {
                  onUpdateAudioSettings({ includeMic: !audioSettings.includeMic });
                }
              }}
            >
              {isMicActive ? 'Mute Mic' : 'Unmute Mic'}
            </span>
          )}

          <MicPopover
            isOpen={activePopover === 'mic'}
            onClose={() => setActivePopover(null)}
            audioSettings={audioSettings}
            onUpdateAudioSettings={onUpdateAudioSettings}
            isMicActive={isMicActive}
            onToggleMic={onToggleMic}
            placement={popoverPlacement}
          />
        </div>

        {/* 3. SCREEN BUTTON */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              if (onToggleScreen) {
                onToggleScreen(!isScreenActive);
              }
            }}
            title={isScreenActive ? 'Stop sharing screen' : 'Start sharing screen'}
            className="group flex flex-col items-center gap-1 cursor-pointer"
          >
            <div
              className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm ${
                isScreenActive
                  ? 'bg-[#8DB355] hover:bg-[#7a9d47] text-white shadow-md shadow-[#8DB355]/30'
                  : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-400'
              }`}
            >
              <ArrowUp01Icon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span
              className={`text-xs font-semibold whitespace-nowrap ${
                isScreenActive
                  ? 'text-[#8DB355] dark:text-[#a2c86b]'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Screen
            </span>
          </button>

          <ScreenPopover
            isOpen={activePopover === 'screen'}
            onClose={() => setActivePopover(null)}
            audioSettings={audioSettings}
            onUpdateAudioSettings={onUpdateAudioSettings}
            videoSettings={videoSettings}
            isScreenActive={isScreenActive}
            onToggleScreen={onToggleScreen}
            placement={popoverPlacement}
          />
        </div>
      </div>

      {/* ── SEPARATOR GAP & SUBTLE DIVIDER ── */}
      <div className="hidden sm:block h-8 w-[1.5px] bg-slate-300/80 dark:bg-white/15 rounded-full self-center mx-1" />

      {/* ── SECTION 2: Studio Controls (Layouts, Background, Settings) ── */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* 4. LAYOUTS BUTTON - Hidden in Audio Only Mode */}
        {mode !== 'audio_only' && (
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  togglePopover('layout');
                }
              }}
              title="Choose Recording Composition Layout"
              className={`group flex flex-col items-center gap-1 transition-all ${
                disabled
                  ? 'opacity-35 cursor-not-allowed'
                  : 'cursor-pointer hover:opacity-90'
              }`}
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all duration-150 shadow-sm">
                <Layers01Icon className="w-5 h-5 stroke-[1.8]" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                Layouts
              </span>
            </button>

            <LayoutPopover
              isOpen={activePopover === 'layout'}
              onClose={() => setActivePopover(null)}
              layout={layout}
              onSelectLayout={onSelectLayout}
              background={background}
              placement={popoverPlacement}
              mode={mode}
            />
          </div>
        )}

        {/* 5. BACKGROUND BUTTON */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => togglePopover('background')}
            className="group flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all duration-150 shadow-sm">
              <ColorsIcon className="w-5 h-5 stroke-[1.8]" />
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-800 shadow-sm"
                style={{
                  background:
                    background.type === 'solid'
                      ? background.value
                      : background.type === 'gradient'
                      ? background.value
                      : '#111418',
                }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 whitespace-nowrap">
              Background
            </span>
          </button>

          <BackgroundPopover
            isOpen={activePopover === 'background'}
            onClose={() => setActivePopover(null)}
            background={background}
            onUpdateBackground={onUpdateBackground}
            placement={popoverPlacement}
          />
        </div>

        {/* 6. SETTINGS BUTTON */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else togglePopover('smart');
            }}
            className="group flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all duration-150 shadow-sm">
              <Settings01Icon className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 whitespace-nowrap">
              Settings
            </span>
          </button>

          <SmartRecordingPopover
            isOpen={activePopover === 'smart'}
            onClose={() => setActivePopover(null)}
            smartConfig={smartConfig}
            onUpdateSmartConfig={onUpdateSmartConfig}
            placement={popoverPlacement}
          />
        </div>
      </div>
    </div>
  );
};
