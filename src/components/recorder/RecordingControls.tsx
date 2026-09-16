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
        <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#151718] border border-white/10 shadow-lg text-white">
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
          <button
            type="button"
            onClick={onTogglePause}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-semibold text-xs border border-white/10 transition-all cursor-pointer shadow-md"
            title="Pause/Resume (Alt + P)"
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

          {/* Huge Stop Button */}
          <button
            type="button"
            disabled={isStopping}
            onClick={onStopRecording}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl ${
              isStopping
                ? 'bg-[#D90000]/80 opacity-80 cursor-wait'
                : 'bg-[#D90000] hover:bg-[#b80000] active:scale-95 cursor-pointer'
            } text-white font-black text-sm shadow-xl shadow-[#D90000]/30 transition-all`}
            title={isStopping ? 'Saving recording...' : 'Stop Recording (Alt + R)'}
          >
            <StopIcon className="w-4 h-4 fill-current" />
            <span>{isStopping ? 'Saving...' : 'Stop Recording'}</span>
          </button>

          {/* Retake Button */}
          {onRetake && (
            <button
              type="button"
              onClick={onRetake}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer shadow-md"
              title="Discard & Retake"
            >
              <RotateLeft01Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Retake</span>
            </button>
          )}

          {/* Add Bookmark */}
          {onAddBookmark && (
            <button
              type="button"
              onClick={onAddBookmark}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white font-semibold text-xs border border-white/10 transition-all cursor-pointer shadow-md"
              title="Add Bookmark (Alt + B)"
            >
              <Bookmark01Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bookmark</span>
            </button>
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
