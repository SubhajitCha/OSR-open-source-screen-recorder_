import React from 'react';
import {
  ComputerIcon,
  SmartPhone01Icon,
} from 'hugeicons-react';
import {
  AudioSettings,
  CompositionLayout,
  InputSourceMode,
  MobileCameraFacing,
  MobileConnectionStatus,
  MobileDeviceInfo,
  PipConfig,
  PrompterConfig,
  RecorderAspectRatio,
  RecorderBackgroundConfig,
  RecordingMode,
  SmartRecordingConfig,
  VideoSettings,
} from '../types';
import { RecordingCanvas } from './recorder/RecordingCanvas';
import { RecorderToolbar } from './recorder/RecorderToolbar';

interface RecorderDashboardProps {
  mode: RecordingMode;
  onSelectMode: (mode: RecordingMode) => void;
  pipConfig: PipConfig;
  onUpdatePipConfig: (updates: Partial<PipConfig>) => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (updates: Partial<AudioSettings>) => void;
  videoSettings: VideoSettings;
  onUpdateVideoSettings: (updates: Partial<VideoSettings>) => void;
  onStartRecording: () => void;
  onStopRecording?: () => void;
  onTogglePause?: () => void;
  onRetake?: () => void;
  onAddBookmark?: () => void;
  onOpenSettings?: () => void;
  onOpenDocs?: () => void;
  onBackToModeSelect?: () => void;
  recordingState?: 'idle' | 'countdown' | 'recording' | 'paused' | 'review' | 'editing';
  durationSeconds?: number;
  webcamStream?: MediaStream | null;
  screenStream?: MediaStream | null;
  micStream?: MediaStream | null;
  onShareScreen?: () => void;
  onStopSharingScreen?: () => void;
  onToggleCamera?: (active: boolean) => void;
  isMicBlocked?: boolean;
  onEnableMic?: () => void;
  onToggleMic?: (active: boolean) => void;
  // Composition Props
  layout: CompositionLayout;
  onSelectLayout: (layout: CompositionLayout) => void;
  aspectRatio: RecorderAspectRatio;
  onSelectAspectRatio: (ratio: RecorderAspectRatio) => void;
  background: RecorderBackgroundConfig;
  onUpdateBackground: (updates: Partial<RecorderBackgroundConfig>) => void;
  smartConfig: SmartRecordingConfig;
  onUpdateSmartConfig: (updates: Partial<SmartRecordingConfig>) => void;
  prompter: PrompterConfig;
  onUpdatePrompter: (updates: Partial<PrompterConfig>) => void;
  // Mobile / Input Source Props
  inputSource?: InputSourceMode;
  onSelectInputSource?: (source: InputSourceMode) => void;
  mobileStatus?: MobileConnectionStatus;
  mobileDeviceInfo?: MobileDeviceInfo | null;
  onOpenMobilePairModal?: () => void;
  onFlipMobileCamera?: (facing: MobileCameraFacing) => void;
}

export const RecorderDashboard: React.FC<RecorderDashboardProps> = ({
  mode,
  onSelectMode,
  pipConfig,
  onUpdatePipConfig,
  audioSettings,
  onUpdateAudioSettings,
  videoSettings,
  onUpdateVideoSettings,
  onStartRecording,
  onStopRecording = () => {},
  onTogglePause = () => {},
  onRetake,
  onAddBookmark,
  onOpenSettings = () => {},
  onOpenDocs = () => {},
  onBackToModeSelect,
  recordingState = 'idle',
  durationSeconds = 0,
  webcamStream = null,
  screenStream = null,
  micStream = null,
  onShareScreen,
  onStopSharingScreen,
  onToggleCamera,
  isMicBlocked = false,
  onEnableMic,
  onToggleMic,
  layout,
  onSelectLayout,
  aspectRatio,
  onSelectAspectRatio,
  background,
  onUpdateBackground,
  smartConfig,
  onUpdateSmartConfig,
  prompter,
  onUpdatePrompter,
  inputSource = 'system',
  onSelectInputSource,
  mobileStatus = 'disconnected',
  mobileDeviceInfo = null,
  onOpenMobilePairModal,
  onFlipMobileCamera,
}) => {
  const isRecording = recordingState === 'recording' || recordingState === 'paused';
  const isScreenActive =
    !!screenStream && screenStream.getVideoTracks().some((t) => t.readyState === 'live');
  const isCameraActive =
    !!webcamStream && webcamStream.getVideoTracks().some((t) => t.readyState === 'live');
  const isMicActive =
    !!micStream &&
    audioSettings.includeMic &&
    micStream.getAudioTracks().some((t) => t.readyState === 'live');

  const handleInternalToggleCamera = (active?: boolean) => {
    const nextActive = active !== undefined ? active : !isCameraActive;
    if (onToggleCamera) {
      onToggleCamera(nextActive);
    }
    if (!nextActive) {
      if (mode === 'screen_cam') {
        onSelectMode('screen');
        if (layout === 'spaced-far') {
          onSelectLayout('spaced-far');
        } else if (layout === 'framed') {
          onSelectLayout('framed');
        } else {
          onSelectLayout('overlay');
        }
      }
    } else {
      if (mode === 'screen') {
        onSelectMode('screen_cam');
        if (layout === 'framed') {
          onSelectLayout('framed');
        } else {
          onSelectLayout('overlay');
        }
      }
    }
  };

  const handleInternalToggleScreen = (active?: boolean) => {
    const nextActive = active !== undefined ? active : !isScreenActive;
    if (nextActive) {
      if (onShareScreen) onShareScreen();
      if (mode === 'cam_only') {
        onSelectMode('screen_cam');
        onSelectLayout('overlay');
      }
    } else {
      if (onStopSharingScreen) onStopSharingScreen();
      if (mode === 'screen') {
        // keep mode but stops feed
      } else if (mode === 'screen_cam') {
        onSelectMode('cam_only');
        onSelectLayout('cam-only');
      }
    }
  };

  const handleInternalToggleMic = (active?: boolean) => {
    const nextActive = active !== undefined ? active : !isMicActive;
    if (onToggleMic) {
      onToggleMic(nextActive);
    }
    onUpdateAudioSettings({ includeMic: nextActive });
    if (nextActive && !onToggleMic && onEnableMic) {
      onEnableMic();
    }
  };

  return (
    <div
      id="main-recorder-dashboard"
      className="w-full flex-1 flex flex-col justify-between bg-white dark:bg-[#161A22] text-slate-900 dark:text-white select-none transition-colors duration-200 overflow-x-hidden min-h-[calc(100vh-3.75rem)]"
    >
      {/* ─────────────────────────────────────────────────────────────
          STAGE: VIDEO PREVIEW WINDOW + VERTICAL BUTTONS BESIDE IT
         ───────────────────────────────────────────────────────────── */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 gap-3 min-h-0 my-auto">
        {/* Direct Two-Option Input Source Switcher: System Cam & Audio vs Mobile Cam & Audio */}
        {onSelectInputSource && (
          <div
            id="input-source-switcher-bar"
            className="flex flex-wrap items-center justify-center gap-2 z-30 select-none"
          >
            <div
              role="radiogroup"
              aria-label="Camera and Audio Input Source"
              className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#232936] border border-slate-200/90 dark:border-white/15 shadow-xs gap-1"
            >
              <button
                id="source-btn-system"
                type="button"
                role="radio"
                aria-checked={inputSource === 'system'}
                disabled={isRecording}
                onClick={() => onSelectInputSource('system')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isRecording ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  inputSource === 'system'
                    ? 'bg-white dark:bg-[#31394D] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/15'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <ComputerIcon className="w-3.5 h-3.5 shrink-0" />
                <span>System Cam &amp; Audio</span>
              </button>

              <button
                id="source-btn-mobile"
                type="button"
                role="radio"
                aria-checked={inputSource === 'mobile'}
                disabled={isRecording}
                onClick={() => onSelectInputSource('mobile')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isRecording ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  inputSource === 'mobile'
                    ? 'bg-white dark:bg-[#31394D] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/15'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
              >
                <SmartPhone01Icon className="w-3.5 h-3.5 shrink-0" />
                <span>Mobile Cam &amp; Audio</span>
                {mobileStatus === 'connected' ? (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                    aria-label="Phone connected"
                  />
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                    · Pair
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Centered Preview + Vertical Buttons cluster */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2.5 sm:gap-3 max-w-full">
          {/* Video Preview Window */}
          <div className="flex items-center justify-center shrink-0">
            <RecordingCanvas
              layout={layout}
              aspectRatio={aspectRatio}
              background={background}
              pipConfig={pipConfig}
              onUpdatePipConfig={onUpdatePipConfig}
              prompter={prompter}
              onUpdatePrompter={onUpdatePrompter}
              webcamStream={webcamStream}
              screenStream={screenStream}
              micStream={micStream}
              isRecording={isRecording}
              mode={mode}
              onShareScreen={onShareScreen}
              onStopSharingScreen={onStopSharingScreen}
              onToggleCamera={handleInternalToggleCamera}
              onEnableMic={onEnableMic}
            />
          </div>

          {/* Vertical Buttons beside Video Preview Window: vertically centered with compact gap */}
          <aside className="shrink-0 flex flex-col items-center justify-center z-30 select-none">
            <RecorderToolbar
              orientation="vertical"
              layout={layout}
              mode={mode}
              onSelectLayout={(l) => {
                onSelectLayout(l);
                if (mode === 'screen' || mode === 'cam_only' || mode === 'audio_only') {
                  // In single-source modes, stay strictly in the current mode; do not switch mode or open camera
                  return;
                }
                if (l === 'screen') {
                  onSelectMode('screen');
                } else if (l === 'cam-only') {
                  onSelectMode('cam_only');
                } else {
                  onSelectMode('screen_cam');
                }
              }}
              aspectRatio={aspectRatio}
              onSelectAspectRatio={onSelectAspectRatio}
              background={background}
              onUpdateBackground={onUpdateBackground}
              pipConfig={pipConfig}
              onUpdatePipConfig={onUpdatePipConfig}
              audioSettings={audioSettings}
              onUpdateAudioSettings={onUpdateAudioSettings}
              videoSettings={videoSettings}
              smartConfig={smartConfig}
              onUpdateSmartConfig={onUpdateSmartConfig}
              prompter={prompter}
              onUpdatePrompter={onUpdatePrompter}
              isCameraActive={isCameraActive}
              onToggleCamera={handleInternalToggleCamera}
              isScreenActive={isScreenActive}
              onToggleScreen={handleInternalToggleScreen}
              isMicActive={isMicActive}
              isMicBlocked={isMicBlocked}
              onToggleMic={handleInternalToggleMic}
              onEnableMic={onEnableMic}
              micStream={micStream}
              onOpenSettings={onOpenSettings}
              disabled={isRecording}
              inputSource={inputSource}
              onSelectInputSource={onSelectInputSource}
              mobileStatus={mobileStatus}
              mobileDeviceInfo={mobileDeviceInfo}
              onOpenMobilePairModal={onOpenMobilePairModal}
              onFlipMobileCamera={onFlipMobileCamera}
            />
          </aside>
        </div>
      </main>
    </div>
  );
};
