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
  HardDriveIcon,
  Bookmark01Icon,
  RotateLeft01Icon,
  Maximize01Icon,
  Minimize01Icon,
} from 'hugeicons-react';
import confetti from 'canvas-confetti';
import { SavedRecording, VideoBookmark } from '../types';
import { saveRecordingToDB, generateThumbnailFromBlob, formatBytes } from '../services/db';
import {
  captureVideoSnapshot,
  downloadBlob,
  saveWithFileSystemApi,
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
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(`Recording ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  const [notes, setNotes] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('screencast, demo');

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
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ef4444', '#10b981', '#3b82f6'],
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
      // Ignore if user is currently typing in an input or textarea
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
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Play error:', e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, currentDuration));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleApplyTrim = async () => {
    if (trimStart >= trimEnd) return;
    setIsProcessingTrim(true);
    setTrimProgress(0);

    try {
      const trimmed = await trimVideoClientSide(currentBlob, trimStart, trimEnd, (progress) => {
        setTrimProgress(Math.round(progress * 100));
      });
      setCurrentBlob(trimmed);
      const newDur = Math.max(1, Math.round(trimEnd - trimStart));
      setCurrentDuration(newDur);
      setTrimStart(0);
      setTrimEnd(newDur);
      setIsTrimmingMode(false);
    } catch (err) {
      console.error('Failed to trim video:', err);
    } finally {
      setIsProcessingTrim(false);
    }
  };

  const handleTakeSnapshot = async () => {
    try {
      const { blob } = await captureVideoSnapshot(currentBlob, currentTime);
      downloadBlob(blob, `${title.replace(/\s+/g, '_')}_frame_${Math.round(currentTime)}s.png`);
      setSnapshotMsg('Snapshot downloaded as PNG');
      setTimeout(() => setSnapshotMsg(null), 3000);
    } catch (err) {
      console.error('Snapshot failed:', err);
    }
  };

  const handleDirectSave = async () => {
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    await saveWithFileSystemApi(currentBlob, filename);
  };

  const handleSaveToIndexedDB = async () => {
    try {
      const thumbnail = await generateThumbnailFromBlob(currentBlob, 0.5);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const recordingItem: SavedRecording = {
        id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title,
        blob: currentBlob,
        mimeType,
        duration: currentDuration,
        size: currentBlob.size,
        createdAt: Date.now(),
        thumbnailUrl: thumbnail,
        mode: 'screen',
        resolution: `${videoRef.current?.videoWidth || 1920}x${videoRef.current?.videoHeight || 1080}`,
        fps: 60,
        bookmarks: initialBookmarks,
        notes,
        tags,
      };

      await saveRecordingToDB(recordingItem);
      setIsSaved(true);
      setTimeout(() => {
        onSavedToLibrary();
      }, 1000);
    } catch (err) {
      console.error('Failed to save recording to DB:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="post-recording-studio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gray-100 text-gray-900 border border-gray-200">
            <Film01Icon className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Recording Review</h1>
              <span className="px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full">
                Ready in Memory
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Preview, trim, extract snapshots, and save directly to disk or local storage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-record-another"
            onClick={onRecordAnother}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RotateLeft01Icon className="w-4 h-4 text-gray-500" />
            <span>Record Another</span>
          </button>

          <button
            id="btn-save-to-library"
            disabled={isSaved}
            onClick={handleSaveToIndexedDB}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer ${
              isSaved
                ? 'bg-green-600 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-200'
            }`}
          >
            {isSaved ? <Tick01Icon className="w-4 h-4" /> : <FloppyDiskIcon className="w-4 h-4" />}
            <span>{isSaved ? 'Saved to Library!' : 'Save to Library'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player on left, Metadata & Export on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Video Player & Trimmer Controls */}
        <div className="lg:col-span-8 space-y-4">
          <div
            ref={playerContainerRef}
            id="video-player-stage"
            onClick={handleTogglePlay}
            className="relative aspect-video w-full rounded-3xl bg-gray-950 border border-gray-200 shadow-md overflow-hidden group flex items-center justify-center cursor-pointer select-none"
          >
            {/* Background Poster if video is not yet ready */}
            {posterUrl && (
              <img
                src={posterUrl}
                alt="Recording Preview"
                className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${
                  isPlaying ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}

            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              preload="auto"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.currentTime === 0) {
                  v.currentTime = 0.05;
                }
              }}
              onLoadedData={(e) => {
                const v = e.currentTarget;
                if (v.currentTime === 0) {
                  v.currentTime = 0.05;
                }
              }}
              onCanPlay={(e) => {
                const v = e.currentTarget;
                if (v.currentTime === 0) {
                  v.currentTime = 0.05;
                }
              }}
              className="w-full h-full object-contain relative z-0"
              playsInline
            />

            {/* Centered Large Play Button Overlay when Paused */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-all z-10"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 backdrop-blur-xs ring-4 ring-white/20">
                  <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Quick Play/Pause Ripple Indicator */}
            {showPlayRipple && isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-out fade-out zoom-out-90 duration-300">
                <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md">
                  <PlayIcon className="w-8 h-8 fill-current ml-0.5" />
                </div>
              </div>
            )}

            {/* Custom Overlay Controls - Stop click propagation so clicks on controls don't toggle video */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent space-y-2 z-20 cursor-default"
            >
              {/* Progress Scrubber */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={currentDuration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-between text-xs text-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTogglePlay}
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-transform active:scale-95 shadow-sm cursor-pointer"
                  >
                    {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 fill-current" />}
                  </button>

                  <span className="font-mono text-white font-medium">
                    {formatTime(currentTime)} / {formatTime(currentDuration)}
                  </span>
                </div>

                {/* Right controls: Speed, Snapshots, Trim toggle, Fullscreen */}
                <div className="flex items-center gap-2">
                  {/* Playback speed selector */}
                  <div className="flex items-center gap-1 bg-black/50 border border-white/20 rounded-lg p-0.5">
                    {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleChangeSpeed(s)}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded cursor-pointer ${
                          playbackSpeed === s ? 'bg-red-600 text-white font-bold' : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Extract Snapshot */}
                  <button
                    onClick={handleTakeSnapshot}
                    title="Extract PNG Snapshot at current frame"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 border border-white/20 rounded-lg text-white transition-colors cursor-pointer"
                  >
                    <Camera01Icon className="w-3.5 h-3.5 text-gray-200" />
                    <span>Snapshot</span>
                  </button>

                  {/* Trimmer Mode Toggle */}
                  <button
                    onClick={() => setIsTrimmingMode(!isTrimmingMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isTrimmingMode
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-black/50 hover:bg-black/70 border-white/20 text-white'
                    }`}
                  >
                    <ScissorIcon className="w-3.5 h-3.5" />
                    <span>Trim</span>
                  </button>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={handleToggleFullscreen}
                    title="Toggle Fullscreen (F)"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 hover:bg-black/70 border border-white/20 rounded-lg text-white transition-colors cursor-pointer"
                  >
                    {isFullscreen ? <Minimize01Icon className="w-3.5 h-3.5" /> : <Maximize01Icon className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {snapshotMsg && (
            <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2">
              <Tick01Icon className="w-4 h-4 text-green-600" />
              <span>{snapshotMsg}</span>
            </div>
          )}

          {/* Bookmarks Timeline Pills */}
          {initialBookmarks.length > 0 && (
            <div className="p-4 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Bookmark01Icon className="w-3.5 h-3.5 text-red-500" />
                Keyframe Bookmarks ({initialBookmarks.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {initialBookmarks.map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => handleSeek(bm.timestamp)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 transition-colors cursor-pointer"
                  >
                    <span className="font-mono text-red-600 font-bold">{formatTime(bm.timestamp)}</span>
                    <span className="text-gray-600">{bm.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trimmer Drawer */}
          {isTrimmingMode && (
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <ScissorIcon className="w-4 h-4 text-red-500" />
                  Client-Side Video Trimmer
                </h3>
                <span className="text-xs font-mono text-gray-500">
                  Cut Duration: {formatTime(Math.max(0, trimEnd - trimStart))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Start Time</span>
                    <span className="font-mono text-gray-900 font-bold">{formatTime(trimStart)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={currentDuration}
                    step={0.1}
                    value={trimStart}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val < trimEnd) {
                        setTrimStart(val);
                        handleSeek(val);
                      }
                    }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>End Time</span>
                    <span className="font-mono text-gray-900 font-bold">{formatTime(trimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={currentDuration}
                    step={0.1}
                    value={trimEnd}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > trimStart) {
                        setTrimEnd(val);
                        handleSeek(val);
                      }
                    }}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setIsTrimmingMode(false)}
                  className="px-4 py-1.5 text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  disabled={isProcessingTrim}
                  onClick={handleApplyTrim}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-md shadow-red-200 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessingTrim ? (
                    <span>Processing {trimProgress}%...</span>
                  ) : (
                    <>
                      <ScissorIcon className="w-3.5 h-3.5" />
                      <span>Trim Video Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Metadata, Tagging & Instant Export */}
        <div className="lg:col-span-4 space-y-6">
          {/* Export Options Card */}
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Export & Direct Save
            </h3>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>File Size:</span>
                <span className="font-mono text-gray-900 font-semibold">{formatBytes(currentBlob.size)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Duration:</span>
                <span className="font-mono text-gray-900 font-semibold">{formatTime(currentDuration)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>MIME Format:</span>
                <span className="font-mono text-gray-900 font-semibold">{mimeType.split(';')[0]}</span>
              </div>
            </div>

            {/* Direct Disk Save Button */}
            <button
              id="btn-direct-disk-save"
              onClick={handleDirectSave}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <HardDriveIcon className="w-4 h-4 text-green-400" />
              <span>Save Directly to Computer Disk</span>
            </button>

            {/* Standard Browser Download Button */}
            <button
              id="btn-standard-download"
              onClick={() => {
                const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
                downloadBlob(currentBlob, `${title.replace(/\s+/g, '_')}.${ext}`);
              }}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-200 transition-all active:scale-98 cursor-pointer"
            >
              <Download01Icon className="w-4 h-4" />
              <span>Download File ({mimeType.includes('mp4') ? 'MP4' : 'WebM'})</span>
            </button>
          </div>

          {/* Metadata & Tagging Card */}
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Recording Details & Organization
            </h3>

            {/* Title Input */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Recording Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Tags Input */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="demo, tutorial, meeting"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Notes & Summary
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context or meeting agenda notes..."
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
