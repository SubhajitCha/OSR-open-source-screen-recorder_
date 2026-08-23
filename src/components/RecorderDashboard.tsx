import React, { useRef } from 'react';
import {
  PlayIcon,
  Camera01Icon,
  Mic01Icon,
  MicOff01Icon,
  ComputerIcon,
  Layers01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
  StopIcon,
  PauseIcon,
} from 'hugeicons-react';
import {
  AudioSettings,
  PipConfig,
  PipPosition,
  RecordingMode,
  VideoSettings,
  FrameRatePreset,
} from '../types';

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
  onOpenSettings?: () => void;
  onOpenDocs?: () => void;
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
  recordingState = 'idle',
  durationSeconds = 0,
}) => {
  const isRecording = recordingState === 'recording' || recordingState === 'paused';
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingStagePip, setIsDraggingStagePip] = React.useState<boolean>(false);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remMins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sizeRatio = pipConfig.size === 'small' ? 0.15 : pipConfig.size === 'large' ? 0.30 : 0.22;
  const sizePct = Math.round(sizeRatio * 100);

  const getStagePipStyle = (): React.CSSProperties => {
    const marginXPct = 3;
    const marginYPct = 4;
    const maxXPct = 100 - sizePct;
    const maxYPct = 100 - sizePct;

    if (pipConfig.position === 'custom' && pipConfig.customX !== undefined && pipConfig.customY !== undefined) {
      const leftPct = (Math.max(0, Math.min(100, pipConfig.customX)) / 100) * maxXPct;
      const topPct = (Math.max(0, Math.min(100, pipConfig.customY)) / 100) * maxYPct;
      return {
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${sizePct}%`,
      };
    }

    switch (pipConfig.position) {
      case 'top-left':
        return {
          left: `${marginXPct}%`,
          top: `${marginYPct}%`,
          width: `${sizePct}%`,
        };
      case 'top-right':
        return {
          left: `${maxXPct - marginXPct}%`,
          top: `${marginYPct}%`,
          width: `${sizePct}%`,
        };
      case 'bottom-left':
        return {
          left: `${marginXPct}%`,
          top: `${maxYPct - marginYPct}%`,
          width: `${sizePct}%`,
        };
      case 'bottom-right':
      default:
        return {
          left: `${maxXPct - marginXPct}%`,
          top: `${maxYPct - marginYPct}%`,
          width: `${sizePct}%`,
        };
    }
  };

  // Drag handler for positioning camera on the preview stage
  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingStagePip || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const pipWidth = rect.width * sizeRatio;
    const pipHeight = rect.width * sizeRatio; // 1:1 aspect ratio

    const maxLeft = rect.width - pipWidth;
    const maxTop = rect.height - pipHeight;

    if (maxLeft <= 0 || maxTop <= 0) return;

    const mouseX = e.clientX - rect.left - pipWidth / 2;
    const mouseY = e.clientY - rect.top - pipHeight / 2;

    const clampedX = Math.max(0, Math.min(maxLeft, mouseX));
    const clampedY = Math.max(0, Math.min(maxTop, mouseY));

    const pctX = Math.round((clampedX / maxLeft) * 100);
    const pctY = Math.round((clampedY / maxTop) * 100);

    onUpdatePipConfig({
      position: 'custom',
      customX: pctX,
      customY: pctY,
    });
  };

  return (
    <div
      id="recorder-dashboard-container"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col justify-start lg:h-[calc(100vh-4.25rem)] overflow-hidden"
    >
      {/* 2-Column Responsive Viewport Grid: Left Preview Column (Controls Bar + Video Preview) & Right Settings Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 flex-1 min-h-0 items-start">
        
        {/* LEFT COLUMN: Top Preview Control Bar (Matching Video Preview Width exactly) + Video Preview Stage */}
        <div className="lg:col-span-8 flex flex-col space-y-3 min-h-0">
          
          {/* TOP PREVIEW CONTROL BAR (Width strictly locked to video preview column) */}
          <div className="w-full bg-white px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-2 flex-wrap">
            
            {/* Capture Mode Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                Mode:
              </span>
              <div className="inline-flex items-center p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/70 gap-1">
                {/* Screen + Camera */}
                <button
                  id="mode-tab-screen-cam"
                  type="button"
                  onClick={() => onSelectMode('screen_cam')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'screen_cam'
                      ? 'bg-white text-blue-800 shadow-xs ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Layers01Icon className={`w-3.5 h-3.5 ${mode === 'screen_cam' ? 'text-blue-700' : 'text-slate-500'}`} />
                  <span>Screen + Camera</span>
                </button>

                {/* Screen Only */}
                <button
                  id="mode-tab-screen"
                  type="button"
                  onClick={() => onSelectMode('screen')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'screen'
                      ? 'bg-white text-blue-800 shadow-xs ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <ComputerIcon className={`w-3.5 h-3.5 ${mode === 'screen' ? 'text-blue-700' : 'text-slate-500'}`} />
                  <span>Screen Only</span>
                </button>
              </div>
            </div>

            {/* Premium Refined Audio Source Toggles */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                Audio:
              </span>

              {/* Refined Microphone Toggle */}
              <button
                type="button"
                onClick={() => onUpdateAudioSettings({ includeMic: !audioSettings.includeMic })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                  audioSettings.includeMic
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/70 text-blue-800 border-blue-200/90 shadow-xs ring-1 ring-blue-500/15'
                    : 'bg-slate-50/80 text-slate-500 border-slate-200/80 hover:bg-slate-100 hover:text-slate-700'
                }`}
                title={audioSettings.includeMic ? 'Microphone enabled (Click to mute)' : 'Microphone disabled (Click to enable)'}
              >
                <div
                  className={`p-0.5 rounded-md ${
                    audioSettings.includeMic ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/80 text-slate-500'
                  }`}
                >
                  {audioSettings.includeMic ? (
                    <Mic01Icon className="w-3.5 h-3.5 text-blue-700" />
                  ) : (
                    <MicOff01Icon className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <span className="font-semibold">Mic</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    audioSettings.includeMic
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {audioSettings.includeMic ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Refined System Audio Toggle */}
              <button
                type="button"
                onClick={() => onUpdateAudioSettings({ includeSystemAudio: !audioSettings.includeSystemAudio })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                  audioSettings.includeSystemAudio
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/70 text-blue-800 border-blue-200/90 shadow-xs ring-1 ring-blue-500/15'
                    : 'bg-slate-50/80 text-slate-500 border-slate-200/80 hover:bg-slate-100 hover:text-slate-700'
                }`}
                title={
                  audioSettings.includeSystemAudio
                    ? 'System desktop audio enabled (Click to mute)'
                    : 'System desktop audio disabled (Click to enable)'
                }
              >
                <div
                  className={`p-0.5 rounded-md ${
                    audioSettings.includeSystemAudio ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/80 text-slate-500'
                  }`}
                >
                  {audioSettings.includeSystemAudio ? (
                    <VolumeHighIcon className="w-3.5 h-3.5 text-blue-700" />
                  ) : (
                    <VolumeMute01Icon className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <span className="font-semibold">System</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    audioSettings.includeSystemAudio
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {audioSettings.includeSystemAudio ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Video Preview Stage */}
          <div
            ref={stageRef}
            id="compositor-preview-stage"
            onMouseMove={handleStageMouseMove}
            onMouseUp={() => setIsDraggingStagePip(false)}
            onMouseLeave={() => setIsDraggingStagePip(false)}
            className="relative aspect-video w-full rounded-3xl bg-[#0B0F17] border border-slate-800/90 overflow-hidden shadow-lg flex flex-col justify-between p-4 sm:p-5 select-none ring-1 ring-white/5"
          >
            {/* Top ambient studio spotlight */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-sky-500/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none" />

            {/* Stage Background fine grid pattern */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Stage Header Info */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#161D2B]/90 backdrop-blur-md border border-slate-700/60 text-slate-200 text-xs shadow-xs">
                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                <span className="font-mono font-medium text-[11px]">
                  {videoSettings.resolution === 'native' ? 'Native Screen' : videoSettings.resolution.toUpperCase()} · {videoSettings.fps} FPS
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 bg-[#161D2B]/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-700/60">
                  Codec: {videoSettings.codec.split(';')[0]}
                </span>
              </div>
            </div>

            {/* Stage Center Graphic / Target Representation */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-4 space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-[#141B26] border border-slate-700/70 flex items-center justify-center text-sky-400 shadow-xl">
                {mode === 'screen_cam' ? (
                  <Layers01Icon className="w-6 h-6 text-sky-400" />
                ) : (
                  <ComputerIcon className="w-6 h-6 text-sky-400" />
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
                style={getStagePipStyle()}
                className={`absolute z-20 cursor-grab active:cursor-grabbing transition-all aspect-square ${
                  pipConfig.shape === 'circle'
                    ? 'rounded-full'
                    : pipConfig.shape === 'rounded'
                    ? 'rounded-2xl'
                    : 'rounded-xl'
                } bg-gradient-to-b from-slate-800/90 via-slate-900/95 to-slate-950/95 border border-white/20 ring-2 ring-sky-500/50 shadow-2xl shadow-blue-950/60 backdrop-blur-md flex flex-col items-center justify-center text-white overflow-hidden group hover:ring-sky-400`}
              >
                <div className="absolute inset-1 rounded-[inherit] border border-white/10 opacity-70 pointer-events-none" />
                <div className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" />
                <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10 blur-sm pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center justify-center p-1 text-center">
                  <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-0.5 group-hover:scale-105 transition-transform">
                    <Camera01Icon className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 tracking-tight">Camera</span>
                </div>
              </div>
            )}

            {/* Stage Bottom Bar */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-400 text-[11px]">Zero Server Uploads · 100% Private Offline Storage</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {isRecording ? formatTimer(durationSeconds) : ''}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Studio Settings & Action Panel (Compact layout fitted neatly in 100vh) */}
        <aside className="lg:col-span-4 flex flex-col">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            
            {/* Framerate & Performance Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Frame Rate (FPS)
                </h4>
                <span className="text-[10px] font-mono text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                  {videoSettings.fps} FPS
                </span>
              </div>

              {/* Framerate Preset Selector Button Row */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
                {([60, 30, 24] as FrameRatePreset[]).map((fpsVal) => (
                  <button
                    key={fpsVal}
                    type="button"
                    onClick={() => onUpdateVideoSettings({ fps: fpsVal })}
                    className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      videoSettings.fps === fpsVal
                        ? 'bg-white text-blue-800 shadow-xs ring-1 ring-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fpsVal} FPS
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                <span>{videoSettings.fps === 60 ? 'Ultra Smooth' : videoSettings.fps === 30 ? 'Standard Video' : 'Cinematic Rate'}</span>
                <span>~{videoSettings.fps === 60 ? '6.0' : videoSettings.fps === 30 ? '3.5' : '2.5'} Mbps</span>
              </div>
            </div>

            {/* Camera PIP Options if mode === screen_cam */}
            {mode === 'screen_cam' && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Camera Frame
                </h4>

                {/* Position Preset Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 text-xs">Placement</span>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">
                      {pipConfig.position === 'custom' ? 'Custom Drag' : pipConfig.position.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-2xl border border-slate-200/60">
                    {[
                      { id: 'top-left', label: 'TL' },
                      { id: 'top-right', label: 'TR' },
                      { id: 'bottom-left', label: 'BL' },
                      { id: 'bottom-right', label: 'BR' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => onUpdatePipConfig({ position: pos.id as PipPosition, customX: undefined, customY: undefined })}
                        className={`py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                          pipConfig.position === pos.id
                            ? 'bg-white text-blue-800 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                        title={pos.id.replace('-', ' ')}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape & Size Selectors in a clean 2-column group */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Shape Selector */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-700">Shape</span>
                    <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/60 justify-between">
                      {(['circle', 'rounded', 'square'] as const).map((sh) => (
                        <button
                          key={sh}
                          type="button"
                          onClick={() => onUpdatePipConfig({ shape: sh })}
                          className={`flex-1 py-0.5 text-[10px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                            pipConfig.shape === sh ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {sh === 'rounded' ? 'Rnd' : sh === 'circle' ? 'Circ' : 'Sqr'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-700">Size</span>
                    <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/60 justify-between">
                      {(['small', 'medium', 'large'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => onUpdatePipConfig({ size: sz })}
                          className={`flex-1 py-0.5 text-[10px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                            pipConfig.size === sz ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mirror Camera Toggle */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="font-semibold text-slate-700 text-xs">Mirror Camera</span>
                  <button
                    type="button"
                    onClick={() => onUpdatePipConfig({ mirror: !pipConfig.mirror })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pipConfig.mirror ? 'bg-blue-700' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        pipConfig.mirror ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Countdown Delay Setting */}
            <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 text-xs">Countdown Delay</span>
                <select
                  value={videoSettings.countdownSeconds}
                  onChange={(e) => onUpdateVideoSettings({ countdownSeconds: Number(e.target.value) as 0 | 3 | 5 | 10 })}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>Instant (0s)</option>
                  <option value={3}>3 Seconds</option>
                  <option value={5}>5 Seconds</option>
                  <option value={10}>10 Seconds</option>
                </select>
              </div>
            </div>

            {/* Start / Stop Recording Main Button with Modern Gradient Styling */}
            <div className="pt-2">
              {isRecording ? (
                <div className="space-y-2">
                  <button
                    id="btn-stop-recording-main"
                    onClick={onStopRecording}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md shadow-red-500/25 transition-all duration-200 cursor-pointer animate-pulse"
                  >
                    <div className="flex items-center gap-2">
                      <StopIcon className="w-4 h-4 fill-current text-white" />
                      <span>Stop Recording ({formatTimer(durationSeconds)})</span>
                    </div>
                    <span className="text-xs bg-red-950/40 px-2 py-0.5 rounded-lg font-mono">Alt + R</span>
                  </button>

                  {onTogglePause && (
                    <button
                      id="btn-toggle-pause-dashboard"
                      onClick={onTogglePause}
                      className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs border border-slate-200 transition-all cursor-pointer"
                    >
                      {recordingState === 'paused' ? (
                        <>
                          <PlayIcon className="w-3.5 h-3.5 fill-current text-blue-700" />
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
                  className="w-full relative group overflow-hidden flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:via-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer"
                >
                  {/* Gradient Shimmer Highlight Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform pointer-events-none" />

                  <div className="relative flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <PlayIcon className="w-3.5 h-3.5 fill-current text-white ml-0.5" />
                    </div>
                    <span className="font-black tracking-tight">Start Recording</span>
                  </div>
                  
                  <div className="relative flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-lg text-xs text-white font-mono font-bold shadow-xs">
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
