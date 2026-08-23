import React, { useState, useEffect, useCallback } from 'react';
import {
  StopIcon,
  PauseIcon,
  PlayIcon,
  Mic01Icon,
  MicOff01Icon,
  Bookmark01Icon,
  Camera01Icon,
  MoveIcon,
  GridViewIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Activity01Icon,
} from 'hugeicons-react';
import { AudioVisualizer } from './AudioVisualizer';
import { AudioMixerController } from '../services/audioMixer';
import { PipPosition } from '../types';

interface LiveRecordingOverlayProps {
  durationSeconds: number;
  isPaused: boolean;
  bytesRecorded: number;
  bitrateMbps: number;
  audioMixer: AudioMixerController | null;
  micMuted: boolean;
  onTogglePause: () => void;
  onToggleMicMute: () => void;
  onAddBookmark: () => void;
  onTakeSnapshot: () => void;
  onStopRecording: () => void;
  onChangePipPosition?: (position: PipPosition) => void;
}

export const LiveRecordingOverlay: React.FC<LiveRecordingOverlayProps> = ({
  durationSeconds,
  isPaused,
  bytesRecorded,
  bitrateMbps,
  audioMixer,
  micMuted,
  onTogglePause,
  onToggleMicMute,
  onAddBookmark,
  onTakeSnapshot,
  onStopRecording,
  onChangePipPosition,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [bookmarkSuccess, setBookmarkSuccess] = useState<boolean>(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState<boolean>(false);
  const [audioActivePulse, setAudioActivePulse] = useState<boolean>(false);

  // Draggable HUD coordinates
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: Math.max(20, (window.innerWidth - 380) / 2),
    y: window.innerHeight - 84,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Listen to audio levels for small orange indicator
  useEffect(() => {
    if (!audioMixer || isPaused || micMuted) {
      setAudioActivePulse(false);
      return;
    }

    const interval = setInterval(() => {
      const data = audioMixer.getFrequencyData();
      if (data && data.length > 0) {
        let sum = 0;
        const len = Math.min(8, data.length);
        for (let i = 0; i < len; i++) {
          sum += data[i];
        }
        const avg = sum / len;
        setAudioActivePulse(avg > 15);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [audioMixer, isPaused, micMuted]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleBookmarkClick = () => {
    onAddBookmark();
    setBookmarkSuccess(true);
    setTimeout(() => setBookmarkSuccess(false), 1500);
  };

  const handleSnapshotClick = () => {
    onTakeSnapshot();
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 1500);
  };

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(10, Math.min(e.clientX - dragOffset.x, window.innerWidth - 420));
      const newY = Math.max(10, Math.min(e.clientY - dragOffset.y, window.innerHeight - 90));
      setPosition({ x: newX, y: newY });
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      id="live-recording-overlay"
      onMouseDown={handleMouseDown}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={`fixed z-50 select-none cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'shadow-2xl' : 'shadow-xl'
      }`}
    >
      <div
        id="recording-hud-card"
        className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl text-gray-800 backdrop-blur-md overflow-hidden"
      >
        {/* COMPACT MAIN BAR (Always visible) */}
        <div className="flex items-center gap-3 px-3.5 py-2">
          {/* Drag Handle */}
          <div className="text-gray-300 hover:text-gray-500 cursor-grab" title="Drag overlay">
            <MoveIcon className="w-3.5 h-3.5" />
          </div>

          {/* Rec Pulsing Dot */}
          <div className="flex items-center justify-center">
            {isPaused ? (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
              </span>
            )}
          </div>

          {/* Time Display */}
          <span id="hud-live-timer" className="text-sm font-bold font-mono text-gray-900 tracking-tight">
            {formatTimer(durationSeconds)}
          </span>

          {/* Small Orange Audio Activity Indicator */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-200/60 rounded-md">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-150 ${
                audioActivePulse && !isPaused && !micMuted
                  ? 'bg-amber-500 ring-2 ring-amber-300 scale-110 shadow-xs'
                  : 'bg-amber-300/60'
              }`}
            />
            <span className="text-[10px] font-bold text-amber-800">MIC</span>
          </div>

          {/* Pause / Resume Button */}
          <button
            id="btn-hud-pause"
            onClick={onTogglePause}
            title={isPaused ? 'Resume (Alt+P)' : 'Pause (Alt+P)'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            {isPaused ? (
              <>
                <PlayIcon className="w-3.5 h-3.5 fill-current text-green-600" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <PauseIcon className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Stop / Finish Recording Button with Alt+R label */}
          <button
            id="btn-hud-stop"
            onClick={onStopRecording}
            title="Stop & Save Recording (Alt+R)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-sm shadow-red-200 transition-all active:scale-95 cursor-pointer"
          >
            <StopIcon className="w-3.5 h-3.5 fill-current" />
            <span>Stop Rec</span>
            <kbd className="text-[10px] font-mono bg-red-700/80 px-1 py-0.2 rounded text-red-100">
              Alt+R
            </kbd>
          </button>

          {/* Details Expand/Collapse Toggle Button */}
          <button
            id="btn-hud-details-toggle"
            onClick={() => setShowDetails(!showDetails)}
            title={showDetails ? 'Hide Details' : 'Show More Actions & Spectrum'}
            className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span>Details</span>
            {showDetails ? <ArrowUp01Icon className="w-3 h-3" /> : <ArrowDown01Icon className="w-3 h-3" />}
          </button>
        </div>

        {/* EXPANDABLE DETAILS PANEL (Shows on click) */}
        {showDetails && (
          <div className="px-3.5 pb-3 pt-2 border-t border-gray-100 bg-gray-50/70 flex flex-col gap-2.5 animate-in slide-in-from-top-1 duration-150">
            {/* Audio Spectrum & Live Stats */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">Spectrum</span>
                <AudioVisualizer mixer={audioMixer} isActive={!isPaused && !micMuted} barCount={10} height={16} />
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-gray-500">
                <Activity01Icon className="w-3 h-3 text-red-500" />
                <span>{formatSize(bytesRecorded)}</span>
                <span>·</span>
                <span>{bitrateMbps} Mbps</span>
              </div>
            </div>

            {/* Move Camera PIP Presets if handler available */}
            {onChangePipPosition && (
              <div className="flex items-center justify-between gap-1 pt-1 text-[10px] text-gray-600 border-t border-gray-200/50">
                <span className="font-bold flex items-center gap-1">
                  <GridViewIcon className="w-3 h-3 text-red-500" />
                  Move Camera:
                </span>
                <div className="flex gap-1">
                  {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as PipPosition[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => onChangePipPosition(pos)}
                      className="px-2 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      {pos === 'bottom-right' ? '↘ BR' : pos === 'bottom-left' ? '↙ BL' : pos === 'top-right' ? '↗ TR' : '↖ TL'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Bookmark, Snapshot, Mic Mute */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60">
              {/* Bookmark Marker */}
              <button
                id="btn-hud-bookmark"
                onClick={handleBookmarkClick}
                title="Add Bookmark Marker (Alt+B)"
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                  bookmarkSuccess
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                <Bookmark01Icon className="w-3 h-3 text-red-500" />
                <span>Bookmark</span>
              </button>

              {/* Instant Frame Snapshot */}
              <button
                id="btn-hud-snapshot"
                onClick={handleSnapshotClick}
                title="Capture Frame Image (Alt+S)"
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                  snapshotSuccess
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                <Camera01Icon className="w-3 h-3" />
                <span>Snapshot</span>
              </button>

              {/* Mic Mute Toggle */}
              <button
                id="btn-hud-mic-toggle"
                onClick={onToggleMicMute}
                title={micMuted ? 'Unmute Mic (Alt+M)' : 'Mute Mic (Alt+M)'}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                  micMuted
                    ? 'bg-red-50 border-red-500 text-red-600'
                    : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700'
                }`}
              >
                {micMuted ? <MicOff01Icon className="w-3 h-3 text-red-600" /> : <Mic01Icon className="w-3 h-3 text-gray-600" />}
                <span>{micMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
