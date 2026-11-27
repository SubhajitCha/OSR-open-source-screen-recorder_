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
import { useLanguage } from '../../context/LanguageContext';
import { getReviewUiStrings } from '../../i18n/formatters';

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
  const { currentLang, t } = useLanguage();
  const ui = getReviewUiStrings(currentLang);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [timestampSuffix] = useState<string>(() => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '-');
    return `${dateStr}_${timeStr}`;
  });
  const [hasCustomTitle, setHasCustomTitle] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(() => `${ui.recordingPrefix}_${timestampSuffix}`);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [videoContainerWidth, setVideoContainerWidth] = useState<number | null>(null);

  // MP4 Client-Side Conversion State (only converted when user clicks download)
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(() => (mimeType.includes('mp4') ? videoBlob : null));
  const [isConvertingMp4, setIsConvertingMp4] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionStatus, setConversionStatus] = useState<string>('');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);

  const [isFrameReady, setIsFrameReady] = useState<boolean>(false);
  const [isPlayerHovered, setIsPlayerHovered] = useState<boolean>(false);
  const [hideControlsUntilMove, setHideControlsUntilMove] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const hasPrimedInitialFrameRef = useRef<boolean>(false);
  const isPrimingFrameRef = useRef<boolean>(false);
  const primeTimerRef = useRef<number | null>(null);
  const userMutedRef = useRef<boolean>(false);
  const userVolumeRef = useRef<number>(1);
  const playStartedAtRef = useRef<number>(0);

  // Sync default generated recording title prefix when active language changes (unless customized)
  useEffect(() => {
    if (!hasCustomTitle) {
      setTitle(`${ui.recordingPrefix}_${timestampSuffix}`);
    }
  }, [ui.recordingPrefix, timestampSuffix, hasCustomTitle]);

  useEffect(() => {
    userMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    userVolumeRef.current = volume;
  }, [volume]);

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
    hasPrimedInitialFrameRef.current = false;
    isPrimingFrameRef.current = false;
    if (primeTimerRef.current !== null) {
      window.clearTimeout(primeTimerRef.current);
      primeTimerRef.current = null;
    }
    setIsFrameReady(false);
    setIsPlaying(false);
    setHideControlsUntilMove(false);
    setCurrentTime(0);
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);
    return () => {
      if (primeTimerRef.current !== null) {
        window.clearTimeout(primeTimerRef.current);
        primeTimerRef.current = null;
      }
      isPrimingFrameRef.current = false;
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

  // Decode & present frame 0 immediately via a silent muted 1-frame warm-up
  const primeInitialVideoFrame = async (vid: HTMLVideoElement) => {
    if (hasPrimedInitialFrameRef.current) return;
    hasPrimedInitialFrameRef.current = true;

    if (mimeType.startsWith('audio/')) {
      setIsFrameReady(true);
      return;
    }

    isPrimingFrameRef.current = true;
    const finishPrime = () => {
      if (!isPrimingFrameRef.current) return;
      isPrimingFrameRef.current = false;
      if (primeTimerRef.current !== null) {
        window.clearTimeout(primeTimerRef.current);
        primeTimerRef.current = null;
      }
      if (videoRef.current === vid) {
        try {
          if (!vid.paused) vid.pause();
          vid.muted = userMutedRef.current || userVolumeRef.current === 0;
          vid.volume = userVolumeRef.current;
        } catch (_) {}
      }
      setIsPlaying(false);
      setHideControlsUntilMove(false);
      setIsFrameReady(true);
    };

    try {
      vid.muted = true;
      await vid.play();
      const vWithCallback = vid as HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      };
      if (typeof vWithCallback.requestVideoFrameCallback === 'function') {
        vWithCallback.requestVideoFrameCallback(() => {
          finishPrime();
        });
        primeTimerRef.current = window.setTimeout(finishPrime, 260);
      } else {
        primeTimerRef.current = window.setTimeout(finishPrime, 120);
      }
    } catch {
      try {
        const dur = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : duration;
        vid.currentTime = Math.min(0.08, Math.max(0.02, (dur || 1) * 0.05));
      } catch (_) {}
      finishPrime();
    }
  };

  const handleTogglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;

    // If user clicked Play while the initial silent 1-frame prime is in flight, seamlessly transition into real playback
    if (isPrimingFrameRef.current) {
      isPrimingFrameRef.current = false;
      if (primeTimerRef.current !== null) {
        window.clearTimeout(primeTimerRef.current);
        primeTimerRef.current = null;
      }
      vid.muted = userMutedRef.current || userVolumeRef.current === 0;
      vid.volume = userVolumeRef.current;
      playStartedAtRef.current = Date.now();
      setIsFrameReady(true);
      setIsPlaying(true);
      setHideControlsUntilMove(true);
      if (vid.paused) {
        vid.play().catch(() => {});
      }
      return;
    }

    if (vid.paused) {
      const total = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : duration;
      if (vid.ended || (total > 0 && vid.currentTime >= total - 0.05)) {
        try {
          vid.currentTime = Math.min(0.05, total * 0.05);
        } catch (_) {}
      }
      vid.play().catch(() => {});
    } else {
      vid.pause();
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
    setConversionStatus(ui.initializingMp4);

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
      className="w-full flex-1 flex flex-col justify-between bg-white dark:bg-[#161A22] text-slate-900 dark:text-white select-none transition-colors duration-200 overflow-x-hidden min-h-[calc(100vh-3.75rem)]"
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
                      onChange={(e) => {
                        setHasCustomTitle(true);
                        setTitle(e.target.value);
                      }}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingTitle(false);
                      }}
                      className="text-xs font-semibold bg-white dark:bg-[#252C3B] border border-zinc-400 dark:border-white/20 rounded px-2 py-0.5 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="p-1 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 cursor-pointer"
                      aria-label={ui.saveTitle}
                    >
                      <CheckmarkCircle02Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative group/rename flex items-center min-w-0">
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      className="group flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer truncate"
                      aria-label={ui.clickToRename}
                    >
                      <span className="truncate max-w-[200px] sm:max-w-[320px]">{title}</span>
                      <PencilEdit02Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
                    </button>
                    <div className="pointer-events-none absolute top-full left-0 mt-1.5 z-40 opacity-0 -translate-y-1 scale-95 group-hover/rename:opacity-100 group-hover/rename:translate-y-0 group-hover/rename:scale-100 transition-all duration-150 whitespace-nowrap hidden sm:block">
                      <div className="px-2 py-0.5 rounded-md bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-[11px] font-semibold shadow-lg select-none">
                        {ui.clickToRename}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-400 dark:text-zinc-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#252C3B] border border-slate-200/60 dark:border-white/10 font-mono">
                  {formatTimer(duration)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#252C3B] border border-slate-200/60 dark:border-white/10 font-mono">
                  {formatBytes(videoBlob.size, 1, currentLang)}
                </span>
              </div>
            </div>

            {/* Direct Video Player matching preview stage frame */}
            <div
              ref={containerRef}
              onMouseEnter={() => {
                setIsPlayerHovered(true);
                setHideControlsUntilMove(false);
              }}
              onMouseMove={() => {
                if (!isPlayerHovered) setIsPlayerHovered(true);
                if (hideControlsUntilMove && Date.now() - playStartedAtRef.current > 220) {
                  setHideControlsUntilMove(false);
                }
              }}
              onMouseLeave={() => {
                setIsPlayerHovered(false);
                setHideControlsUntilMove(false);
              }}
              className={`${
                isFullscreen
                  ? 'relative group w-full h-full max-h-screen rounded-none border-none'
                  : 'relative group rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/15 dark:shadow-black/45 bg-[#12161E] border border-slate-700/40 dark:border-white/15 flex items-center justify-center shrink-0 transition-[background-color,border-color,box-shadow] duration-150'
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
                  preload="auto"
                  playsInline
                  onClick={handleTogglePlay}
                  onLoadedMetadata={() => {
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      if (rect.width > 0) setVideoContainerWidth(Math.round(rect.width));
                    }
                  }}
                  onLoadedData={(e) => {
                    const vid = e.currentTarget;
                    if (containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      if (rect.width > 0) setVideoContainerWidth(Math.round(rect.width));
                    }
                    void primeInitialVideoFrame(vid);
                  }}
                  onSeeked={() => {
                    if (!isPrimingFrameRef.current) {
                      setIsFrameReady(true);
                    }
                  }}
                  onTimeUpdate={(e) => {
                    if (!isPrimingFrameRef.current) {
                      setCurrentTime(e.currentTarget.currentTime);
                    }
                  }}
                  onEnded={() => {
                    if (isPrimingFrameRef.current) return;
                    setIsPlaying(false);
                    setHideControlsUntilMove(false);
                  }}
                  onPlaying={() => {
                    if (isPrimingFrameRef.current) return;
                    playStartedAtRef.current = Date.now();
                    setIsFrameReady(true);
                    setIsPlaying(true);
                    setHideControlsUntilMove(true);
                  }}
                  onPause={() => {
                    if (isPrimingFrameRef.current) return;
                    setIsPlaying(false);
                    setHideControlsUntilMove(false);
                  }}
                  className={`${
                    isFullscreen
                      ? 'w-full h-full object-contain cursor-pointer'
                      : 'max-h-[62vh] max-w-[min(760px,calc(100vw-7rem))] w-auto h-auto block object-contain cursor-pointer'
                  }`}
                />
              )}

              {videoUrl && !isFrameReady && !mimeType.startsWith('audio/') && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#12161E]">
                  <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                </div>
              )}

            {/* Video Scrubber & Playback Controls: visible by default when paused, fades away on play, reappears on hover */}
            <div
              className={`absolute inset-x-0 bottom-0 pt-10 pb-3 px-4 sm:px-5 bg-gradient-to-t from-black/70 via-black/35 to-transparent text-white space-y-2 z-10 select-none transition-opacity duration-300 ease-in-out ${
                !isPlaying || (isPlayerHovered && !hideControlsUntilMove)
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
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
                  <div className="relative group/play flex items-center">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="p-1.5 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      aria-label={isPlaying ? ui.pauseVideo : ui.playVideo}
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-4 h-4 fill-white" />
                      ) : (
                        <PlayIcon className="w-4 h-4 fill-white" />
                      )}
                    </button>
                    <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-30 opacity-0 translate-y-1 scale-95 group-hover/play:opacity-100 group-hover/play:translate-y-0 group-hover/play:scale-100 transition-all duration-150 whitespace-nowrap hidden sm:block">
                      <div className="px-2 py-0.5 rounded-md bg-slate-900/95 text-white text-[11px] font-semibold shadow-lg border border-white/15 select-none">
                        {isPlaying ? ui.pauseVideo : ui.playVideo}
                      </div>
                    </div>
                  </div>

                  {/* Mute / Volume */}
                  <div className="relative flex items-center group/volume">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="p-1.5 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      aria-label={isMuted ? ui.unmute : ui.mute}
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
                  <div className="relative group/fs flex items-center">
                    <button
                      type="button"
                      onClick={handleToggleFullscreen}
                      className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      aria-label={isFullscreen ? ui.exitFullscreen : ui.enterFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize01Icon className="w-4 h-4" />
                      ) : (
                        <Maximize01Icon className="w-4 h-4" />
                      )}
                    </button>
                    <div className="pointer-events-none absolute bottom-full right-0 mb-2 z-30 opacity-0 translate-y-1 scale-95 group-hover/fs:opacity-100 group-hover/fs:translate-y-0 group-hover/fs:scale-100 transition-all duration-150 whitespace-nowrap hidden sm:block">
                      <div className="px-2 py-0.5 rounded-md bg-slate-900/95 text-white text-[11px] font-semibold shadow-lg border border-white/15 select-none">
                        {isFullscreen ? ui.exitFullscreen : ui.enterFullscreen}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Buttons beside Video Window: centered with the preview screen, z-30 so header dropdowns stay on top */}
        <aside className="shrink-0 flex flex-col items-center justify-center gap-2 sm:gap-2.5 z-30 w-10 sm:w-11 select-none md:translate-y-3">
          {/* 1. RETAKE BUTTON */}
            <div className="relative flex items-center justify-center group">
              <button
                id="action-retake-recording"
                type="button"
                onClick={onRetake}
                aria-label={ui.retakeTitle}
                className="cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm bg-slate-200 dark:bg-[#262C3A] hover:bg-slate-300 dark:hover:bg-[#333B4D] text-slate-600 dark:text-zinc-200 hover:scale-105 active:scale-95">
                  <RotateLeft01Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
              </button>

              {/* Sleek Tooltip Label on Hover (smooth left-to-right emergence with easing) */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-30 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{ui.retake}</span>
                </div>
              </div>
            </div>

            {/* 2. EDIT BUTTON */}
            <div className="relative flex items-center justify-center group">
              <button
                id="action-edit-recording"
                type="button"
                onClick={onEdit}
                aria-label={t.review.openInEditor}
                className="cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm bg-slate-200 dark:bg-[#262C3A] hover:bg-slate-300 dark:hover:bg-[#333B4D] text-slate-600 dark:text-zinc-200 hover:scale-105 active:scale-95">
                  <Video01Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
              </button>

              {/* Sleek Tooltip Label on Hover */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-30 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>{t.review.openInEditor}</span>
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
                aria-label={isSaved ? t.review.savedSuccess : t.review.saveToLibrary}
                className="cursor-pointer"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm hover:scale-105 active:scale-95 ${
                    isSaved
                      ? 'bg-[#8DB355] text-white shadow-md shadow-[#8DB355]/30'
                      : 'bg-slate-200 dark:bg-[#262C3A] hover:bg-slate-300 dark:hover:bg-[#333B4D] text-slate-600 dark:text-zinc-200'
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
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-30 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 flex items-center gap-1.5 select-none">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSaved ? 'bg-[#8DB355]' : 'bg-indigo-400'
                    }`}
                  />
                  <span>{isSaved ? t.review.savedSuccess : t.review.saveToLibrary}</span>
                </div>
              </div>
            </div>

            {/* 4. DOWNLOAD BUTTON WITH FORMAT CHOICES */}
            <div className="relative flex items-center justify-center group">
              <button
                id="action-download-recording"
                type="button"
                onClick={() => setIsDownloadMenuOpen((prev) => !prev)}
                aria-label={
                  isConvertingMp4
                    ? `${ui.convertingMp4} (${conversionProgress}%)...`
                    : ui.downloadTitle
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
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-30 opacity-0 -translate-x-2.5 scale-95 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap">
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
                        ? ui.downloaded
                        : isConvertingMp4
                        ? `${ui.convertingMp4} (${conversionProgress}%)`
                        : ui.download}
                    </span>
                  </div>
                </div>
              )}

              {/* Sleek Format Selector Popover */}
              {isDownloadMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30 bg-transparent"
                    onClick={() => {
                      if (!isConvertingMp4) setIsDownloadMenuOpen(false);
                    }}
                  />
                  <div className="absolute left-full ml-3 bottom-0 z-40 w-44 sm:w-48 p-2 bg-white dark:bg-[#232936] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/15 animate-in fade-in zoom-in-95 duration-150 select-none">
                    <div className="flex items-center justify-between px-1.5 py-1 mb-1 border-b border-slate-100 dark:border-white/10">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        {ui.format}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDownloadMenuOpen(false)}
                        disabled={isConvertingMp4}
                        className="p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                        aria-label={ui.closeMenu}
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
                        className="w-full flex flex-col p-2 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-[#D90000] dark:hover:border-[#D90000] bg-slate-50/70 dark:bg-[#2B3242] hover:bg-red-50/40 dark:hover:bg-[#343C4F] transition-all cursor-pointer group/opt text-left"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            MP4
                          </span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-[#D90000]/10 text-[#D90000] border border-[#D90000]/20">
                            {ui.universal}
                          </span>
                        </div>

                        {isConvertingMp4 && (
                          <div className="mt-1.5 w-full pt-1.5 border-t border-slate-200/60 dark:border-white/10">
                            <div className="flex items-center justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                              <span className="truncate mr-1">{conversionStatus || `${ui.convertingMp4}...`}</span>
                              <span>{conversionProgress}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
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
                        className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/25 bg-slate-50/70 dark:bg-[#2B3242] hover:bg-slate-100/60 dark:hover:bg-[#343C4F] transition-all cursor-pointer group/opt text-left"
                      >
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          WebM
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-slate-200 dark:bg-[#1E232E] text-slate-700 dark:text-zinc-300">
                          {ui.original}
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
