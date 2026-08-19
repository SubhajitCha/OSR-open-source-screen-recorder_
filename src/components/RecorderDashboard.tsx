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
import {
  StopIcon,
  PauseIcon,
} from 'hugeicons-react';

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
      {/* Top Banner / Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              Screen Recording Studio
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Open-source browser capture with moveable single camera PIP, multi-track audio mixing, and offline storage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-all"
          >
            <InformationCircleIcon className="w-3.5 h-3.5 text-gray-500" />
            <span>Architecture Docs</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-all"
          >
            <Settings01Icon className="w-3.5 h-3.5 text-gray-500" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* COMPACT INPUT SOURCE SELECTION BAR: ONLY TWO CAPTURE MODES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
            Capture Mode
          </h3>
          <span className="text-[11px] text-gray-400">Permissions requested upon recording start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card: Screen + Webcam */}
          <button
            id="mode-btn-screen-cam"
            onClick={() => onSelectMode('screen_cam')}
            className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === 'screen_cam'
                ? 'bg-red-50/70 border-red-500 shadow-sm ring-1 ring-red-500/20'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              mode === 'screen_cam' ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : 'bg-gray-100 text-gray-700'
            }`}>
              <Layers01Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-gray-900 block truncate">Screen + Camera</span>
              <span className="text-[11px] text-gray-500 block truncate">Display capture with moveable camera bubble</span>
            </div>
          </button>

          {/* Card: Screen Only */}
          <button
            id="mode-btn-screen"
            onClick={() => onSelectMode('screen')}
            className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              mode === 'screen'
                ? 'bg-red-50/70 border-red-500 shadow-sm ring-1 ring-red-500/20'
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${
              mode === 'screen' ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : 'bg-gray-100 text-gray-700'
            }`}>
              <ComputerIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-gray-900 block truncate">Screen Only</span>
              <span className="text-[11px] text-gray-500 block truncate">Entire screen, application window, or browser tab</span>
            </div>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recording Stage & Moveable Camera Positioning */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              Recording Stage & Moveable Camera Position
            </h3>
            {mode === 'screen_cam' && (
              <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                <MoveIcon className="w-3 h-3 text-red-500" />
                Click or drag camera anywhere on stage
              </span>
            )}
          </div>

          <div className="bg-white p-3.5 rounded-3xl border border-gray-200 shadow-sm space-y-3">
            <div
              ref={stageRef}
              onMouseMove={handleStageMouseMove}
              onMouseUp={() => setIsDraggingStagePip(false)}
              className="relative aspect-video w-full rounded-2xl bg-gray-900 border-[4px] border-white shadow-inner overflow-hidden flex items-center justify-center select-none"
            >
              {/* Top status badges */}
              <div className="absolute top-3 left-3 flex gap-2 z-10">
                <div className={`px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border backdrop-blur-md ${
                  isRecording ? 'bg-red-950/80 border-red-500/50 text-red-100' : 'bg-black/50 border-white/10 text-white'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-red-500'}`} />
                  <span className="text-[11px] font-mono font-bold">
                    {isRecording ? formatTimer(durationSeconds) : '00:00:00'}
                  </span>
                </div>
                <div className="bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                  <span className="text-[11px] text-white font-mono">
                    {videoSettings.fps} FPS · {videoSettings.resolution.toUpperCase()}
                  </span>
                </div>
              </div>

              {isRecording ? (
                /* Active Recording Live Monitor */
                <div className="text-center p-6 space-y-3 pointer-events-none animate-in fade-in duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-950/50 animate-pulse">
                    <span className="w-4 h-4 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight flex items-center justify-center gap-2">
                      <span>Live Recording In Progress</span>
                    </h4>
                    <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                      {mode === 'screen_cam'
                        ? 'Your single interactive camera bubble is live on your screen. You can drag and position it freely.'
                        : 'Capturing high-quality stream with zero latency.'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Idle Stage setup preview */
                <>
                  <div className="text-center p-6 space-y-2 pointer-events-none">
                    <div className="w-12 h-12 border-2 border-white/20 rounded-full flex items-center justify-center mx-auto">
                      {mode === 'screen_cam' ? (
                        <Layers01Icon className="w-5 h-5 text-white/50" />
                      ) : mode === 'cam_only' ? (
                        <Video01Icon className="w-5 h-5 text-white/50" />
                      ) : mode === 'audio_only' ? (
                        <RadioIcon className="w-5 h-5 text-white/50" />
                      ) : (
                        <ComputerIcon className="w-5 h-5 text-white/50" />
                      )}
                    </div>
                    <p className="text-white/70 text-xs font-semibold">
                      {mode === 'screen_cam'
                        ? 'Screen + Moveable Camera PIP Ready'
                        : mode === 'cam_only'
                        ? 'Webcam Capture Ready'
                        : mode === 'audio_only'
                        ? 'Opus Audio Capture Ready'
                        : 'Display Screen Capture Ready'}
                    </p>
                    <p className="text-white/40 text-[11px]">
                      Permissions will be requested when you click Start Recording
                    </p>
                  </div>

                  {/* Moveable PIP overlay placement setup box (ONLY when idle) */}
                  {mode === 'screen_cam' && (
                    <div
                      onMouseDown={() => setIsDraggingStagePip(true)}
                      style={{
                        right:
                          pipConfig.position === 'custom' && pipConfig.customX !== undefined
                            ? 'auto'
                            : pipConfig.position === 'top-left' || pipConfig.position === 'bottom-left'
                            ? 'auto'
                            : '18px',
                        left:
                          pipConfig.position === 'custom' && pipConfig.customX !== undefined
                            ? `calc(${pipConfig.customX}% - 36px)`
                            : pipConfig.position === 'top-left' || pipConfig.position === 'bottom-left'
                            ? '18px'
                            : 'auto',
                        top:
                          pipConfig.position === 'custom' && pipConfig.customY !== undefined
                            ? `calc(${pipConfig.customY}% - 36px)`
                            : pipConfig.position === 'top-left' || pipConfig.position === 'top-right'
                            ? '18px'
                            : 'auto',
                        bottom:
                          pipConfig.position === 'custom' && pipConfig.customY !== undefined
                            ? 'auto'
                            : pipConfig.position === 'bottom-left' || pipConfig.position === 'bottom-right'
                            ? '18px'
                            : 'auto',
                      }}
                      className={`absolute border-2 border-white bg-red-500/40 backdrop-blur-md flex flex-col items-center justify-center text-[10px] text-white font-bold shadow-2xl cursor-grab active:cursor-grabbing transition-all ${
                        pipConfig.shape === 'circle'
                          ? 'rounded-full w-20 h-20'
                          : pipConfig.shape === 'rounded'
                          ? 'rounded-2xl w-24 h-16'
                          : 'rounded-lg w-24 h-16'
                      }`}
                    >
                      <Video01Icon className="w-3.5 h-3.5" />
                      <span className="text-[9px]">Camera PIP</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Moveable Camera Position Controls */}
            {mode === 'screen_cam' && (
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Camera Placement</span>
                  <div className="flex gap-1">
                    {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as PipPosition[]).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => onUpdatePipConfig({ position: pos })}
                        className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-all ${
                          pipConfig.position === pos
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {pos.replace('-', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-700">Webcam Shape</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdatePipConfig({ shape: 'circle' })}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-all ${
                        pipConfig.shape === 'circle'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <CircleIcon className="w-3 h-3 inline mr-1" />
                      Circle
                    </button>
                    <button
                      onClick={() => onUpdatePipConfig({ shape: 'rounded' })}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-all ${
                        pipConfig.shape === 'rounded'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <SquareIcon className="w-3 h-3 inline mr-1 rounded" />
                      Rounded
                    </button>
                    <button
                      onClick={() => onUpdatePipConfig({ mirror: !pipConfig.mirror })}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-all ${
                        pipConfig.mirror ? 'bg-red-50 text-red-700 border-red-300' : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      <RefreshIcon className="w-3 h-3 inline mr-1" />
                      Mirror
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Audio & Session Target Inline Preferences */}
        <aside className="lg:col-span-5 flex flex-col gap-5">
          {/* Audio Inputs Card */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              Audio Sources
            </h3>

            {/* Microphone Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    audioSettings.includeMic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {audioSettings.includeMic ? <Mic01Icon className="w-3.5 h-3.5" /> : <MicOff01Icon className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 block">Microphone Audio</span>
                      {audioSettings.includeMic && (
                        <button
                          type="button"
                          onClick={() => setShowMicVolumeSlider(!showMicVolumeSlider)}
                          className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          {showMicVolumeSlider ? 'Hide Slider' : `${Math.round(audioSettings.micVolume * 100)}% Volume`}
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">Voice narration & commentary</span>
                  </div>
                </div>

                <div
                  onClick={() => onUpdateAudioSettings({ includeMic: !audioSettings.includeMic })}
                  className={`w-9 h-5 rounded-full relative p-0.5 cursor-pointer transition-colors ${
                    audioSettings.includeMic ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    audioSettings.includeMic ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {/* Microphone Volume Slider - HIDDEN BY DEFAULT */}
              {audioSettings.includeMic && showMicVolumeSlider && (
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Microphone Gain / Volume</span>
                    <span className="font-mono font-bold text-gray-900">{Math.round(audioSettings.micVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.05}
                    value={audioSettings.micVolume}
                    onChange={(e) => onUpdateAudioSettings({ micVolume: Number(e.target.value) })}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                </div>
              )}
            </div>

            {/* System Audio Toggle */}
            <div className="pt-2.5 border-t border-gray-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    audioSettings.includeSystemAudio ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {audioSettings.includeSystemAudio ? <VolumeHighIcon className="w-3.5 h-3.5" /> : <VolumeMute01Icon className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">System Audio</span>
                    <span className="text-[10px] text-gray-500">Desktop, music, video & tab sound</span>
                  </div>
                </div>

                <div
                  onClick={() => onUpdateAudioSettings({ includeSystemAudio: !audioSettings.includeSystemAudio })}
                  className={`w-9 h-5 rounded-full relative p-0.5 cursor-pointer transition-colors ${
                    audioSettings.includeSystemAudio ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    audioSettings.includeSystemAudio ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {audioSettings.includeSystemAudio && (
                <p className="text-[10px] text-gray-400 leading-tight pl-9">
                  Note: When the browser screen share prompt opens, check the <strong className="text-gray-600">"Share audio"</strong> or <strong className="text-gray-600">"Also share tab audio"</strong> checkbox in the dialog.
                </p>
              )}
            </div>
          </div>

          {/* SESSION TARGET & INLINE PREFERENCES CARD */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between flex-1 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
                  <PreferenceHorizontalIcon className="w-3.5 h-3.5 text-red-500" />
                  Session Target & Preferences
                </h3>
                <button
                  onClick={() => setIsAdvancedTargetOpen(!isAdvancedTargetOpen)}
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <span>{isAdvancedTargetOpen ? 'Compact' : 'More Options'}</span>
                  <ArrowDown01Icon className={`w-3.5 h-3.5 transition-transform ${isAdvancedTargetOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Inline Editable Quick Preferences */}
              <div className="space-y-2.5 text-xs">
                {/* Resolution */}
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Resolution:</span>
                  <select
                    value={videoSettings.resolution}
                    onChange={(e) => onUpdateVideoSettings({ resolution: e.target.value as ResolutionPreset })}
                    className="px-2 py-0.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none"
                  >
                    <option value="native">Native Display</option>
                    <option value="1080p">1080p (FHD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="1440p">1440p (2K)</option>
                    <option value="4k">4K (UHD)</option>
                  </select>
                </div>

                {/* Frame Rate */}
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Frame Rate:</span>
                  <select
                    value={videoSettings.fps}
                    onChange={(e) => onUpdateVideoSettings({ fps: Number(e.target.value) as FrameRatePreset })}
                    className="px-2 py-0.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none"
                  >
                    <option value={60}>60 FPS (Smooth)</option>
                    <option value={30}>30 FPS (Standard)</option>
                    <option value={24}>24 FPS (Cinematic)</option>
                    <option value={15}>15 FPS (Eco)</option>
                  </select>
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Delay Countdown:</span>
                  <select
                    value={videoSettings.countdownSeconds}
                    onChange={(e) => onUpdateVideoSettings({ countdownSeconds: Number(e.target.value) as 0 | 3 | 5 | 10 })}
                    className="px-2 py-0.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none"
                  >
                    <option value={0}>0s (Immediate)</option>
                    <option value={3}>3 Seconds</option>
                    <option value={5}>5 Seconds</option>
                  </select>
                </div>

                {/* Target Bitrate */}
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Video Bitrate:</span>
                  <select
                    value={videoSettings.bitrateMbps}
                    onChange={(e) => onUpdateVideoSettings({ bitrateMbps: Number(e.target.value) })}
                    className="px-2 py-0.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none"
                  >
                    <option value={4}>4 Mbps (Standard)</option>
                    <option value={8}>8 Mbps (High Quality)</option>
                    <option value={12}>12 Mbps (Studio)</option>
                    <option value={16}>16 Mbps (Lossless)</option>
                  </select>
                </div>

                {/* Advanced audio DSP accordion if expanded */}
                {isAdvancedTargetOpen && (
                  <div className="pt-2 space-y-2 text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-700 block text-[10px] uppercase">Audio DSP Filters</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audioSettings.noiseSuppression}
                        onChange={(e) => onUpdateAudioSettings({ noiseSuppression: e.target.checked })}
                        className="rounded text-red-600 accent-red-600"
                      />
                      <span>Background Noise Suppression</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={audioSettings.echoCancellation}
                        onChange={(e) => onUpdateAudioSettings({ echoCancellation: e.target.checked })}
                        className="rounded text-red-600 accent-red-600"
                      />
                      <span>Acoustic Echo Cancellation</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Main Start / Stop / Pause Recording Button with Clear Key Mapping */}
            <div className="pt-2 space-y-2">
              {isRecording ? (
                <div className="space-y-2">
                  <button
                    id="btn-stop-recording-main"
                    onClick={onStopRecording}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 transition-all duration-200 cursor-pointer animate-pulse"
                  >
                    <div className="flex items-center gap-2.5">
                      <StopIcon className="w-4 h-4 fill-current text-white" />
                      <span>Stop Recording ({formatTimer(durationSeconds)})</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-red-800/80 px-2.5 py-1 rounded-lg text-[11px] text-red-100 font-mono">
                      <span>Alt + R</span>
                      <span className="text-[10px] text-red-200">(Stop)</span>
                    </div>
                  </button>

                  {onTogglePause && (
                    <button
                      id="btn-toggle-pause-dashboard"
                      onClick={onTogglePause}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-xs border border-gray-200 transition-all cursor-pointer"
                    >
                      {recordingState === 'paused' ? (
                        <>
                          <PlayIcon className="w-3.5 h-3.5 fill-current text-red-600" />
                          <span>Resume Recording (Alt + P)</span>
                        </>
                      ) : (
                        <>
                          <PauseIcon className="w-3.5 h-3.5 text-gray-700" />
                          <span>Pause Recording (Alt + P)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : recordingState === 'countdown' ? (
                <button
                  id="btn-countdown-active-main"
                  onClick={onStopRecording}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-200 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Countdown in progress... (Click to cancel)</span>
                  </div>
                  <span className="text-xs bg-amber-600/80 px-2 py-0.5 rounded-md font-mono">Esc</span>
                </button>
              ) : (
                <button
                  id="btn-start-recording-main"
                  onClick={onStartRecording}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-red-600 hover:bg-red-500 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 hover:shadow-red-300 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <PlayIcon className="w-4 h-4 fill-current" />
                    <span>Start Recording</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-red-700/80 px-2.5 py-1 rounded-lg text-[11px] text-red-100 font-mono">
                    <span>Alt + R</span>
                    <span className="text-[10px] text-red-200">(Start / Stop Rec)</span>
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
