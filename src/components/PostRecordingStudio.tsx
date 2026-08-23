import React, { useState, useRef, useEffect } from 'react';
import {
  Download01Icon,
  FloppyDiskIcon,
  PlayIcon,
  PauseIcon,
  ScissorIcon,
  RotateLeft01Icon,
  Maximize01Icon,
  Minimize01Icon,
  PencilEdit02Icon,
  Clock01Icon,
  HardDriveIcon,
  Film01Icon,
  Tick01Icon,
  VolumeHighIcon,
  VolumeMute01Icon,
} from 'hugeicons-react';
import confetti from 'canvas-confetti';
import { SavedRecording, VideoBookmark } from '../types';
import { saveRecordingToDB, generateThumbnailFromBlob, formatBytes } from '../services/db';
import {
  downloadBlob,
  trimVideoClientSide,
} from '../services/videoTrimmer';

interface PostRecordingStudioProps {
  videoBlob: Blob;
  duration: number;
  mimeType: string;
  bookmarks: VideoBookmark[];
  onRecordAnother: () => void;
  onSavedToLibrary: () => void;
}

export const PostRecordingStudio: React.FC<PostRecordingStudioProps> = ({
  videoBlob: initialBlob,
  duration: initialDuration,
  mimeType,
  bookmarks: initialBookmarks,
  onRecordAnother,
  onSavedToLibrary,
}) => {
  const [currentBlob, setCurrentBlob] = useState<Blob>(initialBlob);
  const [currentDuration, setCurrentDuration] = useState<number>(initialDuration);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(
    `Recording_${new Date().toISOString().slice(0, 10)}_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '-')}`
  );

  // Trimming states
  const [isTrimmingMode, setIsTrimmingMode] = useState<boolean>(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(initialDuration);
  const [isProcessingTrim, setIsProcessingTrim] = useState<boolean>(false);
  const [trimProgress, setTrimProgress] = useState<number>(0);

  // Status indicators
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showPlayRipple, setShowPlayRipple] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const fileTypeLabel = mimeType.includes('mp4') ? 'MP4 Video' : 'WebM Video';

  useEffect(() => {
    setCurrentBlob(initialBlob);
    setCurrentDuration(initialDuration);
    setTrimStart(0);
    setTrimEnd(initialDuration);
    setIsSaved(false);
  }, [initialBlob, initialDuration]);

  useEffect(() => {
    const url = URL.createObjectURL(currentBlob);
    setVideoUrl(url);

    // Subtle celebratory confetti on initial review load
    try {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#2563eb', '#3b82f6', '#10b981'],
      });
    } catch {
      // ignore
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentBlob]);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard shortcut listener (Space = play/pause, Arrow Left/Right = seek, F = fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          handleSeek(Math.max(0, videoRef.current.currentTime - 5));
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) {
          handleSeek(Math.min(currentDuration, videoRef.current.currentTime + 5));
        }
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDuration, isMuted]);

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current && !videoRef.current) return;
    const target = playerContainerRef.current || videoRef.current;
    if (!document.fullscreenElement) {
      target?.requestFullscreen().catch((e) => console.warn('FS error:', e));
    } else {
      document.exitFullscreen().catch((e) => console.warn('Exit FS error:', e));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    setShowPlayRipple(true);
    setTimeout(() => setShowPlayRipple(false), 450);

    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn('Play error:', e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSetSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSaveToIndexedDB = async () => {
    try {
      let finalPoster = '';
      try {
        const thumb = await generateThumbnailFromBlob(currentBlob, 0.1);
        if (thumb) finalPoster = thumb;
      } catch {
        // optional thumbnail for library display
      }

      const rec: SavedRecording = {
        id: 'rec_' + Date.now(),
        title: title.trim() || 'Untitled Recording',
        blob: currentBlob,
        duration: Math.round(currentDuration),
        mimeType,
        size: currentBlob.size,
        thumbnailUrl: finalPoster,
        notes: '',
        tags: [],
        createdAt: Date.now(),
        mode: 'screen_cam',
        resolution: '1080p',
        fps: 30,
        bookmarks: initialBookmarks || [],
      };

      await saveRecordingToDB(rec);
      setIsSaved(true);
      setTimeout(() => {
        onSavedToLibrary();
      }, 500);
    } catch (err) {
      console.error('Error saving recording to DB:', err);
    }
  };

  const handleDownloadLocal = () => {
    const cleanTitle = title.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'recording';
    const filename = `${cleanTitle}.${fileExtension}`;
    downloadBlob(currentBlob, filename);
  };

  const handleApplyTrim = async () => {
    if (trimStart >= trimEnd) return;
    setIsProcessingTrim(true);
    setTrimProgress(15);

    try {
      const trimmedBlob = await trimVideoClientSide(currentBlob, trimStart, trimEnd, (progress) => {
        setTrimProgress(Math.round(progress * 100));
      });

      const newDuration = Math.max(1, trimEnd - trimStart);
      setCurrentBlob(trimmedBlob);
      setCurrentDuration(newDuration);
      setTrimStart(0);
      setTrimEnd(newDuration);
      setIsTrimmingMode(false);
      setIsSaved(false);

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } catch (err) {
      console.error('Trim error:', err);
    } finally {
      setIsProcessingTrim(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div id="post-recording-studio" className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] pb-16 pt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        
        {/* HEADER BAR: Editable File Name, Metadata Badges & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-4 rounded-3xl border border-slate-200 shadow-xs">
          {/* Editable File Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
                <Film01Icon className="w-4 h-4" />
              </div>

              {isEditingTitle ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setIsEditingTitle(false);
                      }
                    }}
                    placeholder="Enter file name..."
                    className="w-full text-base font-bold text-slate-900 bg-slate-50 border border-blue-500 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                    title="Confirm Name"
                  >
                    <Tick01Icon className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  className="group/title flex items-center gap-2 cursor-pointer min-w-0"
                  title="Click to rename recording"
                >
                  <h2 className="text-base font-bold text-slate-900 tracking-tight truncate hover:text-blue-600 transition-colors">
                    {title}
                  </h2>
                  <span className="text-xs font-mono text-slate-400">.{fileExtension}</span>
                  <div className="p-1 text-slate-400 group-hover/title:text-blue-600 rounded-md transition-colors opacity-60 group-hover/title:opacity-100">
                    <PencilEdit02Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Pills: File Size, File Type, Duration */}
            <div className="flex items-center flex-wrap gap-2 mt-2 ml-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                <HardDriveIcon className="w-3 h-3 text-slate-500" />
                {formatBytes(currentBlob.size)}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                <Film01Icon className="w-3 h-3 text-slate-500" />
                {fileTypeLabel} ({fileExtension.toUpperCase()})
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                <Clock01Icon className="w-3 h-3 text-slate-500" />
                {formatTime(currentDuration)}
              </span>
            </div>
          </div>

          {/* Action Buttons: Record Again, Save to Library, Download Local */}
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            <button
              onClick={onRecordAnother}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-full transition-all cursor-pointer active:scale-95"
              title="Start a new recording"
            >
              <RotateLeft01Icon className="w-3.5 h-3.5 text-slate-500" />
              <span>Record Again</span>
            </button>

            <button
              onClick={() => setIsTrimmingMode(!isTrimmingMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer active:scale-95 ${
                isTrimmingMode
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
              title="Trim recording start and end"
            >
              <ScissorIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>{isTrimmingMode ? 'Close Trimmer' : 'Trim'}</span>
            </button>

            <button
              onClick={handleSaveToIndexedDB}
              disabled={isSaved}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer active:scale-95 ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              {isSaved ? (
                <Tick01Icon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              ) : (
                <FloppyDiskIcon className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isSaved ? 'Saved to Library' : 'Save to Library'}</span>
            </button>

            <button
              id="download-local-btn"
              onClick={handleDownloadLocal}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Download01Icon className="w-4 h-4 stroke-[2.5]" />
              <span>Download Local</span>
            </button>
          </div>
        </div>

        {/* TRIM CONTROL PANEL (Expandable) */}
        {isTrimmingMode && (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScissorIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Client-Side Video Trimmer
                </h3>
              </div>
              <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                Trimmed Length:{' '}
                <span className="text-blue-600 font-bold">{formatTime(Math.max(0, trimEnd - trimStart))}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Start: {formatTime(trimStart)}</span>
                <span>End: {formatTime(trimEnd)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Trim Start ({formatTime(trimStart)})</label>
                  <input
                    type="range"
                    min={0}
                    max={currentDuration}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), trimEnd - 0.5);
                      setTrimStart(val);
                      handleSeek(val);
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Trim End ({formatTime(trimEnd)})</label>
                  <input
                    type="range"
                    min={0}
                    max={currentDuration}
                    step={0.1}
                    value={trimEnd}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), trimStart + 0.5);
                      setTrimEnd(val);
                      handleSeek(val);
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsTrimmingMode(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTrim}
                disabled={isProcessingTrim || trimStart >= trimEnd}
                className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                <ScissorIcon className="w-3.5 h-3.5" />
                <span>{isProcessingTrim ? `Trimming (${trimProgress}%)...` : 'Apply Trim'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MAIN VIDEO PREVIEW CENTERPIECE */}
        <div
          ref={playerContainerRef}
          className="group relative rounded-3xl bg-[#0F141C] border border-slate-800/90 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5"
        >
          {/* Top ambient spotlight */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-blue-500/15 to-transparent blur-3xl pointer-events-none" />

          {/* Video Viewport */}
          <div
            onClick={handleTogglePlay}
            className="relative w-full aspect-video flex items-center justify-center cursor-pointer bg-[#0F141C] select-none overflow-hidden"
          >
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <Film01Icon className="w-12 h-12 mb-2 animate-pulse text-blue-500" />
                <p className="text-xs">Processing local recording...</p>
              </div>
            )}

            {/* Ripple on play/pause */}
            {showPlayRipple && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-600/90 text-white shadow-2xl animate-ping opacity-75">
                  {isPlaying ? <PlayIcon className="w-8 h-8 fill-current" /> : <PauseIcon className="w-8 h-8 fill-current" />}
                </div>
              </div>
            )}

            {/* Center Big Play Button when paused */}
            {!isPlaying && videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/40 group-hover:scale-110 transition-transform">
                  <PlayIcon className="w-7 h-7 fill-current ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Scrubber & Player Controls Bar */}
          <div className="bg-[#141A24]/95 backdrop-blur-md p-4 text-white space-y-2 border-t border-slate-800/80">
            {/* Scrubber track */}
            <div className="relative flex items-center group/scrubber">
              <input
                type="range"
                min={0}
                max={currentDuration || 1}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-blue-500 group-hover/scrubber:h-2 transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {/* Left Controls: Play/Pause, Mute, Timecode */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePlay}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors cursor-pointer active:scale-90"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <PauseIcon className="w-4 h-4 fill-current" /> : <PlayIcon className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={handleToggleMute}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer active:scale-90"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted ? <VolumeMute01Icon className="w-4 h-4 text-red-400" /> : <VolumeHighIcon className="w-4 h-4" />}
                </button>

                <div className="text-xs font-mono text-slate-300 font-semibold">
                  <span className="text-white">{formatTime(currentTime)}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span>{formatTime(currentDuration)}</span>
                </div>
              </div>

              {/* Right Controls: Speed Selector, Fullscreen */}
              <div className="flex items-center gap-2">
                {/* Speed Selector */}
                <div className="flex items-center bg-slate-800/90 rounded-full p-0.5 text-xs font-semibold border border-slate-700/60">
                  {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSetSpeed(spd)}
                      className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                        playbackSpeed === spd ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleToggleFullscreen}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer active:scale-90"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize01Icon className="w-4 h-4" /> : <Maximize01Icon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM QUICK FOOTER BAR */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Saved in local memory buffer. Click "Download Local" to save to disk.</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 hidden sm:block">
            Keyboard Shortcuts: Space (Play/Pause) · F (Fullscreen) · ← / → (Seek 5s)
          </div>
        </div>
      </div>
    </div>
  );
};
