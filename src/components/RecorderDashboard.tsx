import React, { useState, useRef } from 'react';
import {
  PlayIcon,
  Video01Icon,
  Mic01Icon,
  MicOff01Icon,
  Settings01Icon,
  PreferenceHorizontalIcon,
  InformationCircleIcon,
  ArrowDown01Icon,
  ComputerIcon,
  Layers01Icon,
  RadioIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
  MoveIcon,
  CircleIcon,
  SquareIcon,
  RefreshIcon,
  StopIcon,
  PauseIcon,
  Tick01Icon,
  SparklesIcon,
} from 'hugeicons-react';
import {
  AudioSettings,
  PipConfig,
  PipPosition,
  RecordingMode,
  VideoSettings,
  ResolutionPreset,
  FrameRatePreset,
} from '../types';
import { AudioVisualizer } from './AudioVisualizer';

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
  onOpenSettings: () => void;
  onOpenDocs: () => void;
  recordingState?: 'idle' | 'countdown' | 'recording' | 'paused' | 'review';
  durationSeconds?: number;
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
  onStopRecording,
  onTogglePause,
  onOpenSettings,
  onOpenDocs,
  recordingState = 'idle',
  durationSeconds = 0,
}) => {
  const isRecording = recordingState === 'recording' || recordingState === 'paused';
  const [isAdvancedTargetOpen, setIsAdvancedTargetOpen] = useState<boolean>(false);
  const [showMicVolumeSlider, setShowMicVolumeSlider] = useState<boolean>(false);
  const [isDraggingStagePip, setIsDraggingStagePip] = useState<boolean>(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remMins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Drag handler for positioning camera on the preview stage
  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingStagePip || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    onUpdatePipConfig({
      position: 'custom',
      customX: x,
      customY: y,
    });
  };

  return (
    <div id="recorder-dashboard-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner / Session Header styled like Screenity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Screen Recording Studio
            </h2>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              Screenity Style
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Open-source browser capture with moveable camera PIP, multi-track audio mixing, and offline storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 rounded-full transition-all cursor-pointer"
          >
            <InformationCircleIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Architecture Docs</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 rounded-full transition-all cursor-pointer"
          >
            <Settings01Icon className="w-3.5 h-3.5 text-slate-500" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* COMPACT INPUT SOURCE SELECTION BAR: ONLY TWO CAPTURE MODES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Capture Mode
          </h3>
          <span className="text-[11px] text-slate-400">Permissions requested upon recording start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card: Screen + Webcam */}
          <button
            id="mode-btn-screen-cam"
            onClick={() => onSelectMode('screen_cam')}
            className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === 'screen_cam'
                ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              mode === 'screen_cam' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25' : 'bg-slate-100 text-slate-700'
            }`}>
              <Layers01Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Screen + Camera</span>
              <span className="text-[11px] text-slate-500 block truncate">Display capture with floating camera bubble</span>
            </div>
          </button>

          {/* Card: Screen Only */}
          <button
            id="mode-btn-screen"
            onClick={() => onSelectMode('screen')}
            className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === 'screen'
                ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              mode === 'screen' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25' : 'bg-slate-100 text-slate-700'
            }`}>
              <ComputerIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Screen Only</span>
              <span className="text-[11px] text-slate-500 block truncate">Full desktop or window presentation recording</span>
            </div>
          </button>
        </div>
      </div>

      {/* STAGE & CONFIGURATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Composition Stage (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          <div
            ref={stageRef}
            id="compositor-preview-stage"
            onMouseMove={handleStageMouseMove}
            onMouseUp={() => setIsDraggingStagePip(false)}
            onMouseLeave={() => setIsDraggingStagePip(false)}
            className="relative aspect-video w-full rounded-3xl bg-slate-950 border border-slate-200/80 overflow-hidden shadow-md flex flex-col justify-between p-6 select-none"
          >
            {/* Stage Background subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Stage Header Info */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-200 text-xs">
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
                <span className="font-mono font-medium">
                  {videoSettings.resolution === 'native' ? 'Native Screen' : videoSettings.resolution.toUpperCase()} · {videoSettings.fps} FPS
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800">
                  Codec: {videoSettings.codec.split(';')[0]}
                </span>
              </div>
            </div>

            {/* Stage Center Graphic / Target Representation */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-blue-400 shadow-xl">
                {mode === 'screen_cam' ? (
                  <Layers01Icon className="w-7 h-7" />
                ) : (
                  <ComputerIcon className="w-7 h-7" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {mode === 'screen_cam' ? 'Screen + Camera Composite' : 'Screen Only Capture'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Click Start Recording to select your screen, window, or tab. The camera bubble floats smoothly over your workspace.
              </p>
            </div>

            {/* Virtual Stage Camera PiP overlay indicator if Screen + Cam */}
            {mode === 'screen_cam' && (
              <div
                onMouseDown={() => setIsDraggingStagePip(true)}
                style={{
                  left: pipConfig.position === 'custom' && pipConfig.customX !== undefined
                    ? `${pipConfig.customX}%`
                    : pipConfig.position === 'top-left' || pipConfig.position === 'bottom-left'
                    ? '24px'
                    : 'auto',
                  right: pipConfig.position === 'top-right' || pipConfig.position === 'bottom-right'
                    ? '24px'
                    : 'auto',
                  top: pipConfig.position === 'top-left' || pipConfig.position === 'top-right'
                    ? '60px'
                    : 'auto',
                  bottom: pipConfig.position === 'bottom-left' || pipConfig.position === 'bottom-right'
                    ? '24px'
                    : 'auto',
                  transform: pipConfig.position === 'custom' ? 'translate(-50%, -50%)' : 'none',
                }}
                className={`absolute z-20 cursor-grab active:cursor-grabbing transition-shadow ${
                  pipConfig.size === 'small' ? 'w-20 h-20' : pipConfig.size === 'large' ? 'w-32 h-32' : 'w-24 h-24'
                } ${
                  pipConfig.shape === 'circle'
                    ? 'rounded-full'
                    : pipConfig.shape === 'rounded'
                    ? 'rounded-2xl'
                    : 'rounded-xl'
                } bg-slate-900/90 border-2 border-blue-500 shadow-xl flex flex-col items-center justify-center text-white overflow-hidden group`}
              >
                <Video01Icon className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-[9px] font-bold text-slate-300">Camera PIP</span>
                <span className="text-[8px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Drag here</span>
              </div>
            )}

            {/* Stage Bottom Bar */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Zero Server Uploads · 100% Private Offline Storage</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">
                {isRecording ? formatTimer(durationSeconds) : 'Ready to record'}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Controls (4 Columns) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            {/* Audio Sources Configuration */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Audio Mixing
              </h4>

              {/* Microphone Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${audioSettings.includeMic ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                    {audioSettings.includeMic ? <Mic01Icon className="w-4 h-4" /> : <MicOff01Icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Microphone</span>
                    <span className="text-[11px] text-slate-500">Voice narration</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUpdateAudioSettings({ includeMic: !audioSettings.includeMic })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    audioSettings.includeMic ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      audioSettings.includeMic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* System Audio Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${audioSettings.includeSystemAudio ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                    {audioSettings.includeSystemAudio ? <VolumeHighIcon className="w-4 h-4" /> : <VolumeMute01Icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">System Audio</span>
                    <span className="text-[11px] text-slate-500">Tab / Desktop sound</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUpdateAudioSettings({ includeSystemAudio: !audioSettings.includeSystemAudio })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    audioSettings.includeSystemAudio ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      audioSettings.includeSystemAudio ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Camera PIP Options if mode === screen_cam */}
            {mode === 'screen_cam' && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Camera Frame
                </h4>

                {/* Shape Selector */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Shape</span>
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200/60">
                    {(['circle', 'rounded', 'square'] as const).map((sh) => (
                      <button
                        key={sh}
                        onClick={() => onUpdatePipConfig({ shape: sh })}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize transition-all cursor-pointer ${
                          pipConfig.shape === sh ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {sh}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selector */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Size</span>
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200/60">
                    {(['small', 'medium', 'large'] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => onUpdatePipConfig({ size: sz })}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize transition-all cursor-pointer ${
                          pipConfig.size === sz ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mirror Camera Toggle */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-semibold text-slate-700">Mirror Camera</span>
                  <button
                    type="button"
                    onClick={() => onUpdatePipConfig({ mirror: !pipConfig.mirror })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pipConfig.mirror ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        pipConfig.mirror ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Countdown Delay Setting */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Countdown Delay</span>
                <select
                  value={videoSettings.countdownSeconds}
                  onChange={(e) => onUpdateVideoSettings({ countdownSeconds: Number(e.target.value) as 0 | 3 | 5 | 10 })}
                  className="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>No Delay (Instant)</option>
                  <option value={3}>3 Seconds (Recommended)</option>
                  <option value={5}>5 Seconds</option>
                  <option value={10}>10 Seconds</option>
                </select>
              </div>
            </div>

            {/* Start / Stop Recording Main Button */}
            <div className="pt-3">
              {isRecording ? (
                <div className="space-y-2">
                  <button
                    id="btn-stop-recording-main"
                    onClick={onStopRecording}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-full font-bold text-sm shadow-lg shadow-red-200 transition-all duration-200 cursor-pointer animate-pulse"
                  >
                    <div className="flex items-center gap-2.5">
                      <StopIcon className="w-4 h-4 fill-current text-white" />
                      <span>Stop Recording ({formatTimer(durationSeconds)})</span>
                    </div>
                    <span className="text-xs bg-red-800/80 px-2.5 py-0.5 rounded-full font-mono">Alt + R</span>
                  </button>

                  {onTogglePause && (
                    <button
                      id="btn-toggle-pause-dashboard"
                      onClick={onTogglePause}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-semibold text-xs border border-slate-200 transition-all cursor-pointer"
                    >
                      {recordingState === 'paused' ? (
                        <>
                          <PlayIcon className="w-3.5 h-3.5 fill-current text-blue-600" />
                          <span>Resume Recording (Alt + P)</span>
                        </>
                      ) : (
                        <>
                          <PauseIcon className="w-3.5 h-3.5 text-slate-700" />
                          <span>Pause Recording (Alt + P)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  id="btn-start-recording-main"
                  onClick={onStartRecording}
                  className="w-full flex items-center justify-between px-6 py-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-full font-bold text-sm shadow-md shadow-blue-500/25 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <PlayIcon className="w-4 h-4 fill-current" />
                    <span>Start Recording</span>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-800/80 px-2.5 py-0.5 rounded-full text-xs text-blue-100 font-mono">
                    <span>Alt + R</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
