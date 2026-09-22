import React, { useState, useRef, useEffect } from 'react';
import {
  Download01Icon,
  Video01Icon,
  RotateLeft01Icon,
  Folder01Icon,
  PlayIcon,
  PauseIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
  Maximize01Icon,
  Minimize01Icon,
  Tick01Icon,
  CheckmarkCircle02Icon,
  PencilEdit02Icon,
  Cancel01Icon,
  SparklesIcon,
} from 'hugeicons-react';
import { formatBytes } from '../../services/db';
import { downloadBlob } from '../../services/videoTrimmer';
import { convertWebmToMp4, ensureMp4Blob } from '../../services/mp4Converter';
import { CompositionLayout, RecorderBackgroundConfig, RecordingMetadata, VideoBookmark } from '../../types';

interface RecordingReviewScreenProps {
  videoBlob: Blob;
  duration: number;
  mimeType: string;
  bookmarks?: VideoBookmark[];
  metadata?: RecordingMetadata;
  layout?: CompositionLayout;
  onSelectLayout?: (layout: CompositionLayout) => void;
  background?: RecorderBackgroundConfig;
  onUpdateBackground?: (updates: Partial<RecorderBackgroundConfig>) => void;
  onDownload?: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onRetake: () => void;
  onSaveToLibrary: () => void;
}

export const RecordingReviewScreen: React.FC<RecordingReviewScreenProps> = ({
  videoBlob,
  duration,
  mimeType,
  onDownload,
  onEdit,
  onRetake,
  onSaveToLibrary,
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(() => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '-');
    return `Recording_${dateStr}_${timeStr}`;
  });
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [videoContainerWidth, setVideoContainerWidth] = useState<number | null>(null);

  // MP4 Client-Side Conversion State (only converted when user clicks download)
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(() => (mimeType.includes('mp4') ? videoBlob : null));
  const [isConvertingMp4, setIsConvertingMp4] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const formatLabel = mimeType.includes('mp4') ? 'MP4 (H.264/AAC)' : 'WebM (VP9/Opus)';

  // Synchronize title bar width with the exact rendered width of the video preview
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      const rounded = Math.round(rect.width);
      if (rounded > 0 && Math.abs(rounded - (videoContainerWidth || 0)) >= 1) {
        setVideoContainerWidth(rounded);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(() => {
      updateWidth();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [videoUrl, videoContainerWidth]);

  // Create & revoke object URL for video
  useEffect(() => {
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoBlob]);

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0 || isNaN(totalSeconds)) {
      return '00:00';
    }
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleDownloadWebm = () => {
    const filename = `${title.trim() || 'ScreenRecording'}.webm`;
    downloadBlob(videoBlob, filename);
    setIsDownloaded(true);
    setIsDownloadMenuOpen(false);
    if (onDownload) onDownload();
    setTimeout(() => setIsDownloaded(false), 4000);
  };

  const handleDownloadMp4 = async () => {
    if (mp4Blob) {
      const filename = `${title.trim() || 'ScreenRecording'}.mp4`;
      downloadBlob(mp4Blob, filename);
      setIsDownloaded(true);
      setIsDownloadMenuOpen(false);
      if (onDownload) onDownload();
      setTimeout(() => setIsDownloaded(false), 4000);
      return;
    }

    if (isConvertingMp4) return;

    setIsConvertingMp4(true);
    setConversionProgress(5);
    setConversionStatus('Initializing MP4 transcode...');

    try {
      const converted = await convertWebmToMp4(videoBlob, {
        duration: duration > 0 ? duration : undefined,
        fps: 30,
        onProgress: (p) => {
          setConversionProgress(Math.round(p.progress * 100));
          if (p.message) setConversionStatus(p.message);
        },
      });
      setMp4Blob(converted);
      const filename = `${title.trim() || 'ScreenRecording'}.mp4`;
      downloadBlob(converted, filename);
      setIsDownloaded(true);
      setIsDownloadMenuOpen(false);
      if (onDownload) onDownload();
      setTimeout(() => setIsDownloaded(false), 4000);
    } catch (err) {
      console.warn('MP4 conversion error, falling back to WebM download:', err);
      const filename = `${title.trim() || 'ScreenRecording'}.webm`;
      downloadBlob(videoBlob, filename);
      setIsDownloaded(true);
      setIsDownloadMenuOpen(false);
      if (onDownload) onDownload();
      setTimeout(() => setIsDownloaded(false), 4000);
    } finally {
      setIsConvertingMp4(false);
      setConversionStatus('');
    }
  };

  return (
    <div
      id="recording-review-screen"
      className="w-full flex-1 flex flex-col justify-between bg-white dark:bg-[#090B0E] text-slate-900 dark:text-white select-none transition-colors duration-200 overflow-x-hidden min-h-[calc(100vh-3.75rem)]"
    >
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 min-h-0 my-auto">
        {/* Centered Preview + Vertical Buttons cluster */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2.5 sm:gap-3 max-w-full">
          {/* Video Column: Title bar is strictly bound to the exact rendered width of the video preview */}
          <div className="flex flex-col items-center justify-center shrink-0 max-w-full">
            {/* Subtle, compact title and metadata bar directly above video preview, aligned precisely to video width */}
            <div
              style={videoContainerWidth ? { width: `${videoContainerWidth}px`, maxWidth: `${videoContainerWidth}px` } : undefined}
              className="w-full max-w-[min(760px,calc(100vw-7rem))] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 px-1 pb-2 gap-3 transition-[width] duration-75"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingTitle(false);
                      }}
                      className="text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-400 dark:border-zinc-600 rounded px-2 py-0.5 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="p-1 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 cursor-pointer"
                      title="Save title"
                    >
                      <CheckmarkCircle02Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="group flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer truncate"
                    title="Click to rename recording"
                  >
                    <span className="truncate max-w-[200px] sm:max-w-[320px]">{title}</span>
                    <PencilEdit02Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-400 dark:text-zinc-500">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 font-mono">
                  {formatTimer(duration)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 font-mono">
                  {formatBytes(videoBlob.size)}
                </span>
              </div>
            </div>

            {/* Direct Video Player matching preview stage frame */}
            <div
              ref={containerRef}
              className={`${
                isFullscreen
                  ? 'w-full h-full max-h-screen rounded-none border-none'
                  : 'relative group rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 dark:shadow-black/70 bg-black border border-slate-700/40 dark:border-white/10 flex items-center justify-center shrink-0 transition-[background-color,border-color,box-shadow] duration-150'
              }`}
            >
              {/* Crisp Border Overlay across the Video Preview */}
              {!isFullscreen && (
                <div className="pointer-events-none absolute inset-0 rounded-2xl border border-black/10 dark:border-white/15 z-20" />
              )}

              {videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  playsInline
                  onClick={handleTogglePlay}
                  onLoadedMetadata={() => {
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      if (rect.width > 0) setVideoContainerWidth(Math.round(rect.width));
                    }
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className={`${
                    isFullscreen
                      ? 'w-full h-full object-contain cursor-pointer'
                      : 'max-h-[62vh] max-w-[min(760px,calc(100vw-7rem))] w-auto h-auto block object-contain cursor-pointer'
                  }`}
                />
              )}

            {/* Center Play/Pause Overlay Icon on hover/pause */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handleTogglePlay}
                className="absolute inset-0 m-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl cursor-pointer z-10"
                title="Play video"
              >
                <PlayIcon className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-0.5" />
              </button>
            )}

            {/* Video Scrubber & Playback Controls with Subtle Bottom Gradient Overlay, smoothly fading on unhover */}
            <div className="absolute inset-x-0 bottom-0 pt-10 pb-3 px-4 sm:px-5 bg-gradient-to-t from-black/70 via-black/35 to-transparent text-white space-y-2 z-10 select-none opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 ease-in-out">
              {/* Progress Bar Scrubber */}
              {(() => {
                const progressPercent =
                  duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
                return (
                  <div className="relative flex items-center group/scrubber cursor-pointer w-full py-2">
                    {/* Visual Track */}
                    <div className="relative w-full h-1 group-hover/scrubber:h-2 bg-white/25 rounded-full transition-all duration-150">
                      {/* Filled progression */}
                      <div
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full pointer-events-none transition-[width] duration-75"
                        style={{ width: `${progressPercent}%` }}
                      />
                      {/* Progression Dot */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 opacity-0 group-hover/scrubber:scale-100 group-hover/scrubber:opacity-100 transition-all duration-150 pointer-events-none z-10"
                        style={{ left: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Native input range for seeking */}
                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.01}
                      value={currentTime}
                      onChange={(e) => handleSeek(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      aria-label="Seek video progress"
                    />
                  </div>
                );
              })()}

              {/* Controls Row */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  {/* Play / Pause */}
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="p-1.5 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-4 h-4 fill-white" />
                    ) : (
                      <PlayIcon className="w-4 h-4 fill-white" />
                    )}
                  </button>

                  {/* Mute / Volume */}
                  <div className="flex items-center group/volume">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="p-1.5 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeMute01Icon className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <VolumeHighIcon className="w-4 h-4" />
                      )}
                    </button>
                    <div className="w-0 opacity-0 group-hover/volume:w-16 group-hover/volume:opacity-100 group-hover/volume:ml-1.5 overflow-hidden transition-all duration-200 flex items-center">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        aria-label="Volume slider"
                      />
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="font-mono text-[11px] text-zinc-200 font-medium select-none ml-1">
                    {formatTimer(currentTime)} / {formatTimer(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Playback Speed selector */}
                  <div className="flex items-center gap-0.5 bg-white/10 backdrop-blur-xs rounded-lg p-0.5">
                    {[0.5, 1, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSpeedChange(s)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          playbackSpeed === s
                            ? 'bg-white text-zinc-950 font-bold shadow-xs'
                            : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Fullscreen Expand Button */}
                  <button
                    type="button"
                    onClick={handleToggleFullscreen}
                    className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
                  >
                    {isFullscreen ? (
                      <Minimize01Icon className="w-4 h-4" />
                    ) : (
                      <Maximize01Icon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Buttons beside Video Window: centered with the preview screen, compact vertical gap */}
        <aside className="shrink-0 flex flex-col items-center justify-center gap-2 sm:gap-2.5 z-40 w-10 sm:w-11 select-none md:translate-y-3">
          {/* 1. RETAKE BUTTON */}
            <div className="relative flex items-center justify-center group">
              <button
                id="action-retake-recording"
                type="button"
                onClick={onRetake}
                title="Discard this take and record again"
                className="cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300 hover:scale-105 active:scale-95">
                  <RotateLeft01Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
              </button>

              {/* Sleek Tooltip Label on Hover (smooth left-to-right emergence with easing) */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Retake</span>
                </div>
              </div>
            </div>

            {/* 2. EDIT BUTTON */}
            <div className="relative flex items-center justify-center group">
              <button
                id="action-edit-recording"
                type="button"
                onClick={onEdit}
                title="Open video in Screen Studio editor"
                className="cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300 hover:scale-105 active:scale-95">
                  <Video01Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
              </button>

              {/* Sleek Tooltip Label on Hover */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Edit in Studio</span>
                </div>
              </div>
            </div>

            {/* 3. SAVE TO LIBRARY BUTTON */}
            <div className="relative flex items-center justify-center group">
              <button
                id="action-save-to-library"
                type="button"
                onClick={() => {
                  onSaveToLibrary();
                  setIsSaved(true);
                }}
                title={isSaved ? 'Saved to Library' : 'Save to Library'}
                className="cursor-pointer"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm hover:scale-105 active:scale-95 ${
                    isSaved
                      ? 'bg-[#8DB355] text-white shadow-md shadow-[#8DB355]/30'
                      : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-zinc-300'
                  }`}
                >
                  {isSaved ? (
                    <CheckmarkCircle02Icon className="w-5 h-5 stroke-[2]" />
                  ) : (
                    <Folder01Icon className="w-5 h-5 stroke-[1.8]" />
                  )}
                </div>
              </button>

              {/* Sleek Tooltip Label on Hover */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSaved ? 'bg-[#8DB355]' : 'bg-indigo-400'
                    }`}
                  />
                  <span>{isSaved ? 'Saved to Library' : 'Save to Library'}</span>
                </div>
              </div>
            </div>

            {/* 4. DOWNLOAD BUTTON WITH FORMAT CHOICES */}
            <div className="relative flex items-center justify-center">
              <button
                id="action-download-recording"
                type="button"
                onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                title={
                  isConvertingMp4
                    ? `Converting to MP4 (${conversionProgress}%)...`
                    : 'Download Recording (MP4 or WebM)'
                }
                className="cursor-pointer"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm hover:scale-105 active:scale-95 ${
                    isDownloaded
                      ? 'bg-[#8DB355] text-white shadow-md shadow-[#8DB355]/30'
                      : isConvertingMp4
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 animate-pulse'
                      : 'bg-[#D90000] hover:bg-[#b80000] text-white shadow-md shadow-[#D90000]/25'
                  }`}
                >
                  {isDownloaded ? (
                    <Tick01Icon className="w-5 h-5 stroke-[2]" />
                  ) : (
                    <Download01Icon className="w-5 h-5 stroke-[2]" />
                  )}
                </div>
              </button>

              {/* Sleek Tooltip Label on Hover (when menu is closed) */}
              {!isDownloadMenuOpen && (
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-40 opacity-0 -translate-x-2.5 scale-95 hover:opacity-100 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDownloaded
                          ? 'bg-[#8DB355]'
                          : isConvertingMp4
                          ? 'bg-amber-400'
                          : 'bg-[#D90000]'
                      }`}
                    />
                    <span>
                      {isDownloaded
                        ? 'Downloaded'
                        : isConvertingMp4
                        ? `Converting MP4 (${conversionProgress}%)`
                        : 'Download (MP4 / WebM)'}
                    </span>
                  </div>
                </div>
              )}

              {/* Sleek Format Selector Popover */}
              {isDownloadMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => {
                      if (!isConvertingMp4) setIsDownloadMenuOpen(false);
                    }}
                  />
                  <div className="absolute left-full ml-3 bottom-0 z-50 w-44 sm:w-48 p-2 bg-white dark:bg-[#12141a] rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150 select-none">
                    <div className="flex items-center justify-between px-1.5 py-1 mb-1 border-b border-slate-100 dark:border-zinc-800/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Format
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDownloadMenuOpen(false)}
                        disabled={isConvertingMp4}
                        className="p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                        title="Close format menu"
                      >
                        <Cancel01Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      {/* Option 1: MP4 */}
                      <button
                        type="button"
                        onClick={handleDownloadMp4}
                        disabled={isConvertingMp4}
                        className="w-full flex flex-col p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-[#D90000] dark:hover:border-[#D90000] bg-slate-50/70 dark:bg-zinc-900/60 hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-all cursor-pointer group/opt text-left"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            MP4
                          </span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-[#D90000]/10 text-[#D90000] border border-[#D90000]/20">
                            Universal
                          </span>
                        </div>

                        {isConvertingMp4 && (
                          <div className="mt-1.5 w-full pt-1.5 border-t border-slate-200/60 dark:border-zinc-800">
                            <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                              <span className="truncate mr-1">{conversionStatus || 'Converting...'}</span>
                              <span>{conversionProgress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-[#D90000] transition-all duration-150 rounded-full"
                                style={{ width: `${conversionProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </button>

                      {/* Option 2: WebM */}
                      <button
                        type="button"
                        onClick={handleDownloadWebm}
                        disabled={isConvertingMp4}
                        className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-50/70 dark:bg-zinc-900/60 hover:bg-slate-100/60 dark:hover:bg-zinc-800/40 transition-all cursor-pointer group/opt text-left"
                      >
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          WebM
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          Original
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
