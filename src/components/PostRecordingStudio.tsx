import React, { useState, useRef, useEffect } from 'react';
import {
  Download01Icon,
  FloppyDiskIcon,
  PlayIcon,
  PauseIcon,
  ScissorIcon,
  Camera01Icon,
  Tick01Icon,
  Film01Icon,
  Bookmark01Icon,
  RotateLeft01Icon,
  Maximize01Icon,
  Minimize01Icon,
  FileEditIcon,
  Clock01Icon,
  HardDriveIcon,
  Share01Icon,
  Copy01Icon,
  HelpCircleIcon,
  LinkSquare01Icon,
  PencilEdit02Icon,
  GlobalIcon,
  Image01Icon,
} from 'hugeicons-react';
import confetti from 'canvas-confetti';
import { SavedRecording, VideoBookmark } from '../types';
import { saveRecordingToDB, generateThumbnailFromBlob, formatBytes } from '../services/db';
import {
  captureVideoSnapshot,
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
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(`Let's tidy up! ${new Date().toLocaleDateString()}`);
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Screenity Share Card States
  const [isPublicAccess, setIsPublicAccess] = useState<boolean>(true);
  const [thumbnailMode, setThumbnailMode] = useState<'auto' | 'custom'>('auto');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState<boolean>(true);

  // Trimming states
  const [isTrimmingMode, setIsTrimmingMode] = useState<boolean>(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(initialDuration);
  const [isProcessingTrim, setIsProcessingTrim] = useState<boolean>(false);
  const [trimProgress, setTrimProgress] = useState<number>(0);

  // Status indicators
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);
  const [showPlayRipple, setShowPlayRipple] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(currentBlob);
    setVideoUrl(url);

    // Generate immediate first frame poster image
    generateThumbnailFromBlob(currentBlob, 0.1)
      .then((thumb) => {
        if (thumb) setPosterUrl(thumb);
      })
      .catch((e) => console.warn('Poster generation error:', e));

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#2563eb', '#3b82f6', '#10b981', '#6366f1'],
      });
    } catch {
      // ignore
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentBlob]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard shortcut listener (Space = play/pause, Arrow Left/Right = seek)
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDuration]);

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
    setTimeout(() => setShowPlayRipple(false), 500);

    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn('Play error:', e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
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

  const handleCaptureSnapshot = async () => {
    if (!videoRef.current) return;
    try {
      const snap = await captureVideoSnapshot(currentBlob, videoRef.current.currentTime || 0);
      setPosterUrl(snap.dataUrl);
      setSnapshotMsg('Thumbnail captured!');
      setTimeout(() => setSnapshotMsg(null), 2500);
    } catch {
      setSnapshotMsg('Snapshot failed');
      setTimeout(() => setSnapshotMsg(null), 2000);
    }
  };

  const handleSaveToIndexedDB = async () => {
    try {
      let finalPoster = posterUrl;
      if (!finalPoster && videoRef.current) {
        const snap = await captureVideoSnapshot(currentBlob, 0);
        finalPoster = snap.dataUrl;
      }

      const rec: SavedRecording = {
        id: 'rec_' + Date.now(),
        title: title.trim() || 'Untitled Recording',
        blob: currentBlob,
        duration: Math.round(currentDuration),
        mimeType,
        size: currentBlob.size,
        thumbnailUrl: finalPoster || '',
        notes: notes.trim(),
        tags: [],
        createdAt: Date.now(),
        mode: 'screen_cam',
        resolution: '1080p',
        fps: 30,
        bookmarks: [],
      };

      await saveRecordingToDB(rec);
      setIsSaved(true);
      setTimeout(() => {
        onSavedToLibrary();
      }, 700);
    } catch (err) {
      console.error('Error saving recording to DB:', err);
    }
  };

  const handleDownloadFile = () => {
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const filename = `${title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'recording'}.${ext}`;
    downloadBlob(currentBlob, filename);
  };

  const handleCopyShareLink = () => {
    if (videoUrl) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
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
    <div id="post-recording-studio" className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] pb-16">
      {/* SCREENITY FLOATING HEADER BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-3 sm:px-6 sm:py-3.5 rounded-full border border-slate-200/80 shadow-xs">
          {/* Breadcrumb Title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Screenity Vibrant Orb */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1.5px] shrink-0 shadow-sm shadow-blue-500/25">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline shrink-0">My videos</span>
              <span className="text-slate-300 font-light hidden sm:inline">/</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Recording Title..."
                className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 rounded transition-all truncate"
              />
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 shrink-0">
                <Tick01Icon className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
            </div>
          </div>

          {/* Center Mode Switcher: Edit / Preview Pill */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200/60 rounded-full">
            <button
              onClick={() => {
                setActiveTab('edit');
                setIsTrimmingMode(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === 'edit' || isTrimmingMode
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <PencilEdit02Icon className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('preview');
                setIsTrimmingMode(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === 'preview' && !isTrimmingMode
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <PlayIcon className="w-3.5 h-3.5 fill-current text-blue-600" />
              <span>Preview</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareCardOpen(!isShareCardOpen)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              title="Help & Info"
            >
              <HelpCircleIcon className="w-4 h-4" />
            </button>

            <button
              onClick={handleSaveToIndexedDB}
              disabled={isSaved}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              {isSaved ? <Tick01Icon className="w-3.5 h-3.5 text-emerald-600" /> : <FloppyDiskIcon className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isSaved ? 'Saved' : 'Save to Library'}</span>
            </button>

            {/* Screenity Signature Vibrant Blue Share Button */}
            <button
              onClick={() => setIsShareCardOpen(!isShareCardOpen)}
              className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm shadow-blue-500/30 transition-all cursor-pointer active:scale-95"
            >
              <Share01Icon className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center border border-white shrink-0">
              OS
            </div>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Stage & Player */}
        <div className={`${isShareCardOpen ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all space-y-6`}>
          {/* Main Video Canvas Frame */}
          <div
            ref={playerContainerRef}
            className="group relative rounded-3xl bg-slate-950 border border-slate-200/80 shadow-lg overflow-hidden flex flex-col"
          >
            {/* Video Viewport */}
            <div
              onClick={handleTogglePlay}
              className="relative w-full aspect-video flex items-center justify-center cursor-pointer bg-slate-950 select-none overflow-hidden"
            >
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  poster={posterUrl || undefined}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <Film01Icon className="w-12 h-12 mb-2 animate-pulse text-blue-500" />
                  <p className="text-xs">Processing local recording buffer...</p>
                </div>
              )}

              {/* Big Play/Pause Center Indicator Ripple */}
              {showPlayRipple && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-600/90 text-white shadow-2xl animate-ping opacity-75">
                    {isPlaying ? <PlayIcon className="w-8 h-8 fill-current" /> : <PauseIcon className="w-8 h-8 fill-current" />}
                  </div>
                </div>
              )}

              {/* Hover Big Play Button */}
              {!isPlaying && videoUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/40 group-hover:scale-110 transition-transform">
                    <PlayIcon className="w-7 h-7 fill-current ml-1" />
                  </div>
                </div>
              )}

              {/* Snapshot confirmation overlay */}
              {snapshotMsg && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-blue-600/95 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5">
                  <Tick01Icon className="w-4 h-4" />
                  <span>{snapshotMsg}</span>
                </div>
              )}
            </div>

            {/* Scrubber & Player Controls Bar */}
            <div className="bg-slate-900/95 backdrop-blur-md p-4 text-white space-y-2 border-t border-slate-800">
              {/* Range Scrubber */}
              <div className="relative flex items-center group/scrubber">
                <input
                  type="range"
                  min={0}
                  max={currentDuration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 group-hover/scrubber:h-2 transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {/* Left Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTogglePlay}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <PauseIcon className="w-4 h-4 fill-current" /> : <PlayIcon className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <div className="text-xs font-mono text-slate-300 font-semibold">
                    <span className="text-white">{formatTime(currentTime)}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span>{formatTime(currentDuration)}</span>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                  {/* Speed Selector */}
                  <div className="flex items-center bg-slate-800 rounded-full p-0.5 text-xs font-semibold border border-slate-700">
                    {[1, 1.25, 1.5, 2].map((spd) => (
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
                    onClick={handleCaptureSnapshot}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                    title="Capture Thumbnail Snapshot"
                  >
                    <Camera01Icon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleToggleFullscreen}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                    title="Toggle Fullscreen (F)"
                  >
                    {isFullscreen ? <Minimize01Icon className="w-4 h-4" /> : <Maximize01Icon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TRIM TIMELINE ACCORDION */}
          {isTrimmingMode && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScissorIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Lossless Client-Side Video Trimmer
                  </h3>
                </div>
                <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  Trimmed: <span className="text-blue-600 font-bold">{formatTime(Math.max(0, trimEnd - trimStart))}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Start: {formatTime(trimStart)}</span>
                  <span>End: {formatTime(trimEnd)}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Trim Start</label>
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
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Trim End</label>
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
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsTrimmingMode(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyTrim}
                  disabled={isProcessingTrim || trimStart >= trimEnd}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  <ScissorIcon className="w-4 h-4" />
                  <span>{isProcessingTrim ? `Trimming (${trimProgress}%)...` : 'Apply Trim'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Details & Notes Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Recording Details & Notes</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock01Icon className="w-3.5 h-3.5 text-slate-400" />
                  {formatTime(currentDuration)}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <HardDriveIcon className="w-3.5 h-3.5 text-slate-400" />
                  {formatBytes(currentBlob.size)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Notes / Description</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, timestamp references, or summary for this recording..."
                rows={3}
                className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* UNIFIED ACTION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={onRecordAnother}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <RotateLeft01Icon className="w-4 h-4" />
                  <span>Record Again</span>
                </button>

                <button
                  onClick={() => setIsTrimmingMode(!isTrimmingMode)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                    isTrimmingMode
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  <ScissorIcon className="w-4 h-4 text-blue-600" />
                  <span>Trim Video</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToIndexedDB}
                  disabled={isSaved}
                  className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  {isSaved ? <Tick01Icon className="w-4 h-4 text-emerald-600" /> : <FloppyDiskIcon className="w-4 h-4 text-slate-600" />}
                  <span>{isSaved ? 'Saved to Library' : 'Save to Library'}</span>
                </button>

                <button
                  onClick={handleDownloadFile}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Download01Icon className="w-4 h-4" />
                  <span>Download Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Screenity Share & Export Card (Exact match of Reference Image) */}
        {isShareCardOpen && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Share</h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  100% Offline
                </span>
              </div>

              {/* Public Access Toggle inspired by Screenity */}
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600">
                    <GlobalIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Public access</span>
                    <span className="text-[11px] text-slate-500 block">Anyone with the link can view</span>
                  </div>
                </div>

                {/* iOS Royal Blue Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setIsPublicAccess(!isPublicAccess)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPublicAccess ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isPublicAccess ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Shareable Link Input with Copy Link Button */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      readOnly
                      value={`https://app.osr.io/view/${Date.now().toString(36)}`}
                      className="w-full px-3.5 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-2xl text-slate-600 font-mono focus:outline-none truncate"
                    />
                  </div>
                  <button
                    onClick={handleCopyShareLink}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Tick01Icon className="w-3.5 h-3.5" /> : <Copy01Icon className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
                  </button>
                </div>
              </div>

              {/* Thumbnail Selector Segmented Control */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Thumbnail</label>
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200/60">
                    <button
                      onClick={() => setThumbnailMode('auto')}
                      className={`px-3 py-0.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                        thumbnailMode === 'auto' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      onClick={() => {
                        setThumbnailMode('custom');
                        handleCaptureSnapshot();
                      }}
                      className={`px-3 py-0.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                        thumbnailMode === 'custom' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Thumbnail Preview Tile */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 group">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt="Thumbnail Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Image01Icon className="w-8 h-8" />
                    </div>
                  )}

                  <button
                    onClick={handleCaptureSnapshot}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-bold transition-opacity cursor-pointer"
                  >
                    <Camera01Icon className="w-4 h-4" />
                    <span>Change Frame</span>
                  </button>
                </div>
              </div>

              {/* Instant Download Action */}
              <div className="pt-2">
                <button
                  onClick={handleDownloadFile}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <Download01Icon className="w-4 h-4" />
                  <span>Download MP4 / WebM</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
