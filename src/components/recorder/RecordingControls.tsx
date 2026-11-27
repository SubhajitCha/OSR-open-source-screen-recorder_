import React from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  RotateLeft01Icon,
  Bookmark01Icon,
} from 'hugeicons-react';

interface RecordingControlsProps {
  recordingState: 'idle' | 'countdown' | 'recording' | 'paused' | 'review';
  durationSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isStopping?: boolean;
  onTogglePause: () => void;
  onRetake?: () => void;
  onAddBookmark?: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  durationSeconds,
  onStartRecording,
  onStopRecording,
  isStopping = false,
  onTogglePause,
  onRetake,
  onAddBookmark,
}) => {
  const isRecording = recordingState === 'recording' || recordingState === 'paused';

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div
        id="active-recording-controls"
        className="flex flex-col items-center justify-center gap-2 pt-2 animate-in fade-in duration-200"
      >
        {/* Live Status Pill & Timer */}
        <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#232936] border border-white/15 shadow-lg text-white">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                recordingState === 'paused' ? 'bg-amber-400' : 'bg-rose-400'
              } opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                recordingState === 'paused' ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="font-mono font-bold text-sm tracking-wide">
            {formatTimer(durationSeconds)}
          </span>
          <span className="text-[10px] uppercase font-bold text-zinc-400">
            {recordingState === 'paused' ? 'Paused' : 'Live'}
          </span>
        </div>

        {/* Reassuring Background Capture Note */}
        <div className="text-[11px] text-zinc-400/90 font-medium flex items-center gap-1.5 -mt-0.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active background recording</span>
          <span className="text-zinc-600">•</span>
          <span>Switch tabs or apps anytime</span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2.5">
          {/* Pause / Resume */}
          <div className="relative group flex items-center">
            <button
              type="button"
              onClick={onTogglePause}
              aria-label={recordingState === 'paused' ? 'Resume (Alt + P)' : 'Pause (Alt + P)'}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#2A3142] hover:bg-[#353E54] active:scale-95 text-zinc-200 font-semibold text-xs border border-white/10 transition-all cursor-pointer shadow-md"
            >
              {recordingState === 'paused' ? (
                <>
                  <PlayIcon className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <PauseIcon className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Pause</span>
                </>
              )}
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 whitespace-nowrap hidden sm:block">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 select-none">
                Pause/Resume (Alt + P)
              </div>
            </div>
          </div>

          {/* Huge Stop Button */}
          <div className="relative group flex items-center">
            <button
              type="button"
              disabled={isStopping}
              onClick={onStopRecording}
              aria-label={isStopping ? 'Saving recording...' : 'Stop Recording (Alt + R)'}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl ${
                isStopping
                  ? 'bg-[#D90000]/80 opacity-80 cursor-wait'
                  : 'bg-[#D90000] hover:bg-[#b80000] active:scale-95 cursor-pointer'
              } text-white font-black text-sm shadow-xl shadow-[#D90000]/30 transition-all`}
            >
              <StopIcon className="w-4 h-4 fill-current" />
              <span>{isStopping ? 'Saving...' : 'Stop Recording'}</span>
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 whitespace-nowrap hidden sm:block">
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 select-none">
                {isStopping ? 'Saving recording...' : 'Stop Recording (Alt + R)'}
              </div>
            </div>
          </div>

          {/* Retake Button */}
          {onRetake && (
            <div className="relative group flex items-center">
              <button
                type="button"
                onClick={onRetake}
                aria-label="Discard & Retake"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#2A3142] hover:bg-[#353E54] active:scale-95 text-zinc-300 hover:text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer shadow-md"
              >
                <RotateLeft01Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Retake</span>
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 whitespace-nowrap hidden sm:block">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 select-none">
                  Discard &amp; Retake
                </div>
              </div>
            </div>
          )}

          {/* Add Bookmark */}
          {onAddBookmark && (
            <div className="relative group flex items-center">
              <button
                type="button"
                onClick={onAddBookmark}
                aria-label="Add Bookmark (Alt + B)"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#2A3142] hover:bg-[#353E54] active:scale-95 text-zinc-300 hover:text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer shadow-md"
              >
                <Bookmark01Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bookmark</span>
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 whitespace-nowrap hidden sm:block">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 select-none">
                  Add Bookmark (Alt + B)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // IDLE STATE: Unmistakable, Prominent Primary Record Button
  return (
    <div id="idle-recording-controls" className="flex flex-col items-center justify-center pt-2 gap-2">
      <button
        id="btn-start-recording-hero"
        type="button"
        onClick={onStartRecording}
        disabled={recordingState === 'countdown'}
        className="group relative flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#D90000] hover:bg-[#b80000] active:scale-95 text-white font-black text-sm sm:text-base shadow-2xl shadow-[#D90000]/30 transition-all duration-150 cursor-pointer overflow-hidden"
      >
        {/* Glowing record dot */}
        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>

        <span className="tracking-tight text-white font-black">Record</span>

        {/* Keyboard shortcut hint */}
        <span className="ml-1 text-[11px] font-mono font-bold text-white/90 bg-black/25 px-2 py-0.5 rounded-md border border-white/15">
          Alt + R
        </span>
      </button>

      {/* Screen Selection Tip */}
      <p className="text-[11px] text-zinc-400 font-medium tracking-tight text-center">
        💡 To record across multiple tabs and applications, choose <span className="text-zinc-200 font-semibold">Entire Screen</span> when prompted by your browser.
      </p>
    </div>
  );
};
