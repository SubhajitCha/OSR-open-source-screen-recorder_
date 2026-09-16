import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Film01Icon,
  Search01Icon,
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from 'hugeicons-react';
import { Project, ZoomSegment } from '../../types';
import { extractCutSegments, extractZoomSegments } from '../../services/editorEngine';

interface TimelineProps {
  project: Project;
  currentTime: number;
  duration: number;
  isPlaying?: boolean;
  onSeek: (time: number) => void;
  onTogglePlay?: () => void;
  onAddZoom?: () => void;
  onAddZoomAtTime?: (time: number, targetX?: number, targetY?: number) => void;
  onSplitClip?: () => void;
  selectedZoomId?: string | null;
  onSelectZoom?: (zoomId: string | null) => void;
  onRemoveTimelineItem?: (id: string) => void;
  onUpdateZoomSegment?: (id: string, updates: Partial<ZoomSegment>) => void;
  onUpdateTrim?: (start: number, end: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  height?: number;
  onStartResizeDrag?: (e: React.MouseEvent) => void;
}

interface DragState {
  type: 'trim-start' | 'trim-end' | 'zoom-start' | 'zoom-end' | 'zoom-move' | 'scrub';
  id?: string;
  initialStartX: number;
  initialStart: number;
  initialEnd: number;
}

interface ZoomHoverState {
  time: number;
  clientX: number;
  percent: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentTime,
  duration,
  onSeek,
  onRemoveTimelineItem,
  onUpdateTrim,
  selectedZoomId,
  onSelectZoom,
  onUpdateZoomSegment,
  onAddZoomAtTime,
  isCollapsed = false,
  onToggleCollapse,
  height = 200,
  onStartResizeDrag,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomTrackRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [zoomHover, setZoomHover] = useState<ZoomHoverState | null>(null);
  const [timelineHoverTime, setTimelineHoverTime] = useState<number | null>(null);
  const [timelineHoverPercent, setTimelineHoverPercent] = useState<number | null>(null);

  // Scaled track heights when resized
  const videoTrackHeightPx = height ? Math.max(44, Math.min(84, Math.round(height * 0.28))) : 56;
  const zoomTrackHeightPx = height ? Math.max(34, Math.min(68, Math.round(height * 0.22))) : 42;

  const safeDuration = Math.max(1, duration || project.source.duration || 1);
  const cutSegments = extractCutSegments(project.timeline);
  const zoomSegments = extractZoomSegments(project.timeline);

  const trimStart = project.source.trimStart ?? 0;
  const trimEnd = project.source.trimEnd ?? safeDuration;

  const defaultZoomDuration = project.appearance?.autoZoomDuration || 2.5;

  // Format time helpers
  const formatTimecode = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = Math.floor(secs % 60);
    const tenths = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}.${tenths}`;
  };

  const formatShortTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  // Scrubber dragging & seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetTime = (clickX / rect.width) * safeDuration;
    onSeek(parseFloat(targetTime.toFixed(2)));
  };

  // Timeline-wide hover tracker for ghost playhead
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || dragState) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = (x / rect.width) * 100;
    const time = (x / rect.width) * safeDuration;
    setTimelineHoverPercent(percent);
    setTimelineHoverTime(parseFloat(time.toFixed(2)));
  };

  const handleTimelineMouseLeave = () => {
    setTimelineHoverTime(null);
    setTimelineHoverPercent(null);
  };

  // Zoom track hover handler: tracks exact position and duration preview
  const handleZoomTrackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState || !zoomTrackRef.current) return;
    const rect = zoomTrackRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = (offsetX / rect.width) * 100;
    const time = (offsetX / rect.width) * safeDuration;
    setZoomHover({
      time: parseFloat(time.toFixed(2)),
      clientX: e.clientX,
      percent,
    });
  };

  const handleZoomTrackMouseLeave = () => {
    setZoomHover(null);
  };

  // Click on Zoom Track adds a zoom segment at that point
  const handleZoomTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState || !onAddZoomAtTime || !zoomTrackRef.current) return;
    const rect = zoomTrackRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetTime = (offsetX / rect.width) * safeDuration;
    onAddZoomAtTime(parseFloat(targetTime.toFixed(2)));
  };

  // Drag & Resize Listeners for Trim and Zooms
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.initialStartX;
      const deltaTime = (deltaX / rect.width) * safeDuration;

      if (dragState.type === 'trim-start') {
        let newStart = dragState.initialStart + deltaTime;
        newStart = Math.max(0, Math.min(dragState.initialEnd - 0.3, newStart));
        onUpdateTrim?.(parseFloat(newStart.toFixed(2)), dragState.initialEnd);
      } else if (dragState.type === 'trim-end') {
        let newEnd = dragState.initialEnd + deltaTime;
        newEnd = Math.max(dragState.initialStart + 0.3, Math.min(safeDuration, newEnd));
        onUpdateTrim?.(dragState.initialStart, parseFloat(newEnd.toFixed(2)));
      } else if (dragState.type === 'zoom-start' && dragState.id && onUpdateZoomSegment) {
        let newStart = dragState.initialStart + deltaTime;
        newStart = Math.max(0, Math.min(dragState.initialEnd - 0.3, newStart));
        onUpdateZoomSegment(dragState.id, { start: parseFloat(newStart.toFixed(2)) });
      } else if (dragState.type === 'zoom-end' && dragState.id && onUpdateZoomSegment) {
        let newEnd = dragState.initialEnd + deltaTime;
        newEnd = Math.max(dragState.initialStart + 0.3, Math.min(safeDuration, newEnd));
        onUpdateZoomSegment(dragState.id, { end: parseFloat(newEnd.toFixed(2)) });
      } else if (dragState.type === 'zoom-move' && dragState.id && onUpdateZoomSegment) {
        const segDuration = dragState.initialEnd - dragState.initialStart;
        let newStart = dragState.initialStart + deltaTime;
        newStart = Math.max(0, Math.min(safeDuration - segDuration, newStart));
        const newEnd = newStart + segDuration;
        onUpdateZoomSegment(dragState.id, {
          start: parseFloat(newStart.toFixed(2)),
          end: parseFloat(newEnd.toFixed(2)),
        });
      } else if (dragState.type === 'scrub') {
        const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const targetTime = (clickX / rect.width) * safeDuration;
        onSeek(parseFloat(targetTime.toFixed(2)));
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, safeDuration, onUpdateTrim, onUpdateZoomSegment, onSeek]);

  const playheadPercent = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));

  // Generate precision ruler ticks with major and minor subdivisions
  const rulerData = useMemo(() => {
    const majorCount = safeDuration <= 10 ? 5 : safeDuration <= 30 ? 6 : safeDuration <= 90 ? 8 : 10;
    const ticks: { time: number; percent: number; label: string; isMajor: boolean }[] = [];

    for (let i = 0; i <= majorCount; i++) {
      const majorTime = (safeDuration / majorCount) * i;
      ticks.push({
        time: majorTime,
        percent: (majorTime / safeDuration) * 100,
        label: formatShortTime(majorTime),
        isMajor: true,
      });

      // Minor ticks in between
      if (i < majorCount) {
        const subCount = 3;
        for (let s = 1; s <= subCount; s++) {
          const subTime = majorTime + (safeDuration / majorCount / (subCount + 1)) * s;
          ticks.push({
            time: subTime,
            percent: (subTime / safeDuration) * 100,
            label: '',
            isMajor: false,
          });
        }
      }
    }
    return ticks;
  }, [safeDuration]);

  // Subtle simulated waveform bars across video track to give authentic video/audio NLE texture
  const simulatedWaveform = useMemo(() => {
    const bars: number[] = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      // Deterministic pleasing wave pattern
      const h = Math.sin(i * 0.35) * 0.35 + Math.cos(i * 0.15) * 0.25 + 0.45;
      bars.push(Math.max(0.18, Math.min(0.92, h)));
    }
    return bars;
  }, []);

  return (
    <div className="w-full bg-[#f3f5f8] dark:bg-[#111215] border-t-2 border-slate-300 dark:border-zinc-700 px-4 py-2.5 select-none flex flex-col gap-2 text-slate-800 dark:text-[#EDEDED] font-sans transition-colors relative shadow-[0_-6px_20px_rgba(0,0,0,0.06)] dark:shadow-none">
      {/* Top Edge Resize Drag Handle with Snatch-to-minimize support */}
      {onStartResizeDrag && (
        <div
          onMouseDown={onStartResizeDrag}
          onDoubleClick={onToggleCollapse}
          className="absolute -top-2 left-0 right-0 h-4 cursor-row-resize flex items-center justify-center group z-30 select-none"
          title={
            isCollapsed
              ? 'Drag upward to expand timeline (or double-click)'
              : 'Drag downward past bottom to snatch-minimize (or double-click)'
          }
        >
          <div className="w-16 h-1 bg-slate-300 dark:bg-zinc-700 group-hover:bg-[#D90000] group-hover:h-1.5 active:bg-[#D90000] rounded-full transition-all flex items-center justify-center">
            <div className="w-4 h-0.5 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      {/* Top Timeline Bar: Metadata & Status */}
      <div className="flex items-center justify-between gap-3 text-xs">
        {/* Left: Track Indicator & Pro Workflow Tip */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Timeline' : 'Minimize Timeline'}
          >
            <span className="tracking-wide uppercase">TIMELINE</span>
            {isCollapsed ? (
              <ArrowUp01Icon className="w-3.5 h-3.5 text-[#D90000]" />
            ) : (
              <ArrowDown01Icon className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            )}
          </button>
          <span className="hidden lg:inline-block text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
            Drag handles to trim clip • Hover on Zoom lane below to add zooms
          </span>
        </div>

        {/* Right: Studio Digital Timecode Capsule */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3.5 py-1 rounded-full border border-slate-200 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="font-black text-[#D90000] dark:text-[#FF6666] tracking-tight">
                {formatTimecode(currentTime)}
              </span>
              <span className="text-slate-300 dark:text-zinc-700 font-light">/</span>
              <span className="font-semibold text-slate-500 dark:text-zinc-400">
                {formatTimecode(safeDuration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Scrubber container when collapsed with smooth easing */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed
            ? 'max-h-12 opacity-100 ease-out py-0.5'
            : 'max-h-0 opacity-0 overflow-hidden pointer-events-none ease-in'
        }`}
      >
        <div
          ref={isCollapsed ? containerRef : undefined}
          onClick={handleTimelineClick}
          className="relative h-3.5 bg-slate-200/90 dark:bg-zinc-800/90 rounded-full overflow-hidden cursor-pointer group shadow-inner"
          title="Click to seek on minimized timeline"
        >
          <div
            className="absolute top-0 bottom-0 left-0 bg-[#D90000] rounded-full transition-all"
            style={{ width: `${playheadPercent}%` }}
          />
          <div
            className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow -translate-x-1/2"
            style={{ left: `${playheadPercent}%` }}
          />
        </div>
      </div>

      {/* Modern Multi-Track Timeline Canvas with Subtle Distinct Surface & Easing Transition */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none ease-out scale-[0.99] origin-bottom'
            : 'max-h-[600px] opacity-100 ease-in scale-100'
        }`}
      >
        <div className="bg-[#e9ecf2] dark:bg-[#0a0a0d] rounded-2xl border border-slate-300/80 dark:border-zinc-800/90 overflow-visible shadow-inner p-3 pt-6 pb-3 flex flex-col gap-2 relative">
          {/* Main interactive container */}
          <div
            ref={!isCollapsed ? containerRef : undefined}
            onClick={handleTimelineClick}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={handleTimelineMouseLeave}
            className="relative cursor-pointer select-none overflow-visible flex flex-col gap-2"
          >
          {/* 1. TOP PRECISION RULER */}
          <div className="relative h-5 w-full -mt-4 mb-1 pointer-events-none select-none border-b border-slate-300/70 dark:border-zinc-800/80">
            {rulerData.map((t, i) => (
              <div
                key={i}
                className="absolute flex flex-col items-center -translate-x-1/2 bottom-0"
                style={{ left: `${t.percent}%` }}
              >
                {t.isMajor ? (
                  <>
                    <span className="text-[9px] font-mono font-semibold text-slate-500 dark:text-zinc-400 tracking-tighter">
                      {t.label}
                    </span>
                    <div className="w-[1px] h-2 bg-slate-400/90 dark:bg-zinc-600 mt-0.5" />
                  </>
                ) : (
                  <div className="w-[1px] h-1 bg-slate-300/90 dark:bg-zinc-800 mb-0" />
                )}
              </div>
            ))}
          </div>

          {/* 2. GHOST HOVER PLAYHEAD (Assists precision scrubbing) */}
          {timelineHoverPercent !== null && !dragState && (
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-slate-400/60 dark:bg-zinc-500/60 pointer-events-none z-30 transition-all duration-75"
              style={{ left: `${timelineHoverPercent}%` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] whitespace-nowrap shadow-sm">
                {timelineHoverTime !== null ? formatTimecode(timelineHoverTime) : ''}
              </div>
            </div>
          )}

          {/* 3. ACTIVE PLAYHEAD NEEDLE (Extends cleanly across all tracks) */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-[#D90000] z-40 pointer-events-none transition-all duration-75 shadow-[0_0_10px_rgba(217,0,0,0.7)] flex flex-col items-center"
            style={{ left: `calc(${playheadPercent}% + 8px * (1 - ${playheadPercent / 50}))` }}
          >
            {/* Playhead Top Pin / Chevron */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                setDragState({
                  type: 'scrub',
                  initialStartX: e.clientX,
                  initialStart: currentTime,
                  initialEnd: currentTime,
                });
              }}
              className="w-3.5 h-3.5 bg-[#D90000] rounded-b-md shadow-md -mt-5 cursor-ew-resize pointer-events-auto flex items-center justify-center transition-transform hover:scale-110"
              title={`Playhead: ${formatTimecode(currentTime)} (drag to scrub)`}
            >
              <div className="w-1 h-1 rounded-full bg-white shadow-xs" />
            </div>
          </div>

          {/* ============================================================ */}
          {/* TRACK 1: VIDEO TRACK (PRIMARY HERO TRACK ON TOP)             */}
          {/* ============================================================ */}
          <div className="relative group">
            {/* Lane Header Label (Screen Studio Style) */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-zinc-500 pointer-events-none select-none z-10">
              <Film01Icon className="w-3 h-3 text-[#8DB355]" />
              <span className="tracking-widest uppercase font-mono">VIDEO</span>
            </div>

            {/* Video Track Container */}
            <div
              style={{ height: `${videoTrackHeightPx}px` }}
              className="rounded-xl bg-slate-300/60 dark:bg-zinc-900/90 border border-slate-300/90 dark:border-zinc-800 relative overflow-hidden flex items-center shadow-inner"
            >
              {/* Active Video Clip Range */}
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-[#8DB355]/30 via-[#8DB355]/20 to-[#8DB355]/30 dark:from-[#8DB355]/35 dark:via-[#8DB355]/20 dark:to-[#8DB355]/35 border-y-2 border-[#8DB355] flex items-center px-4 overflow-hidden transition-all"
                style={{
                  left: `${(trimStart / safeDuration) * 100}%`,
                  width: `${((trimEnd - trimStart) / safeDuration) * 100}%`,
                }}
              >
                {/* Simulated Audio/Video Waveform Bars for Authentic Studio Aesthetics */}
                <div className="absolute inset-0 flex items-center justify-around opacity-25 dark:opacity-35 pointer-events-none px-2">
                  {simulatedWaveform.map((val, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-[#8DB355] rounded-full transition-all"
                      style={{ height: `${val * 75}%` }}
                    />
                  ))}
                </div>

                {/* Clip Title & Duration Pill */}
                <div className="relative z-10 flex items-center gap-2 pointer-events-none truncate bg-white/70 dark:bg-black/50 px-2.5 py-1 rounded-md border border-black/5 dark:border-white/10 shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-[#8DB355] shadow-xs" />
                  <span className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 truncate">
                    Active Video ({formatShortTime(trimEnd - trimStart)})
                  </span>
                </div>
              </div>

              {/* Trimmed Region: Left */}
              {trimStart > 0 && (
                <div
                  className="absolute top-0 bottom-0 left-0 bg-black/70 backdrop-blur-2xs z-20 flex items-center justify-center border-r-2 border-[#D90000]"
                  style={{
                    width: `${(trimStart / safeDuration) * 100}%`,
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 10px, rgba(217,0,0,0.08) 10px, rgba(217,0,0,0.08) 20px)',
                  }}
                >
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-[#D90000]/90 px-1.5 py-0.5 rounded shadow-sm">
                    Trimmed
                  </span>
                </div>
              )}

              {/* Left Trim Handle (Tactile Knurled Grip) */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDragState({
                    type: 'trim-start',
                    initialStartX: e.clientX,
                    initialStart: trimStart,
                    initialEnd: trimEnd,
                  });
                }}
                className="absolute top-0 bottom-0 w-4 hover:w-4.5 bg-[#8DB355] hover:bg-[#7a9d47] cursor-ew-resize flex items-center justify-center transition-all z-30 shadow-md rounded-l-lg group/handle"
                style={{ left: `calc(${(trimStart / safeDuration) * 100}% - 2px)` }}
                title={`Drag to trim video start (${trimStart.toFixed(1)}s)`}
              >
                {/* Double knurl vertical notches */}
                <div className="flex items-center gap-0.5 pointer-events-none">
                  <div className="w-[1.5px] h-4 bg-white/90 rounded-full" />
                  <div className="w-[1.5px] h-4 bg-white/90 rounded-full" />
                </div>
              </div>

              {/* Trimmed Region: Right */}
              {trimEnd < safeDuration && (
                <div
                  className="absolute top-0 bottom-0 right-0 bg-black/70 backdrop-blur-2xs z-20 flex items-center justify-center border-l-2 border-[#D90000]"
                  style={{
                    width: `${((safeDuration - trimEnd) / safeDuration) * 100}%`,
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 10px, rgba(217,0,0,0.08) 10px, rgba(217,0,0,0.08) 20px)',
                  }}
                >
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-[#D90000]/90 px-1.5 py-0.5 rounded shadow-sm">
                    Trimmed
                  </span>
                </div>
              )}

              {/* Right Trim Handle (Tactile Knurled Grip) */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDragState({
                    type: 'trim-end',
                    initialStartX: e.clientX,
                    initialStart: trimStart,
                    initialEnd: trimEnd,
                  });
                }}
                className="absolute top-0 bottom-0 w-4 hover:w-4.5 bg-[#8DB355] hover:bg-[#7a9d47] cursor-ew-resize flex items-center justify-center transition-all z-30 shadow-md rounded-r-lg group/handle"
                style={{ left: `calc(${(trimEnd / safeDuration) * 100}% - 14px)` }}
                title={`Drag to trim video end (${trimEnd.toFixed(1)}s)`}
              >
                {/* Double knurl vertical notches */}
                <div className="flex items-center gap-0.5 pointer-events-none">
                  <div className="w-[1.5px] h-4 bg-white/90 rounded-full" />
                  <div className="w-[1.5px] h-4 bg-white/90 rounded-full" />
                </div>
              </div>

              {/* Cut Segments (if any) */}
              {cutSegments.map((cut) => {
                const left = (cut.start / safeDuration) * 100;
                const width = ((cut.end - cut.start) / safeDuration) * 100;
                return (
                  <div
                    key={cut.id}
                    className="absolute top-0 bottom-0 bg-[#D90000]/40 border-x-2 border-[#D90000] flex items-center justify-center group/cut z-25 cursor-pointer"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTimelineItem?.(cut.id);
                    }}
                    title="Cut Segment (Click to remove)"
                  >
                    <span className="text-[9px] font-bold text-white bg-[#D90000] px-1.5 py-0.5 rounded shadow-sm opacity-90 group-hover/cut:opacity-100">
                      Cut ×
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* TRACK 2: ZOOM TRACK (KEPT BELOW VIDEO'S TIMELINE AS ASKED)   */}
          {/* ============================================================ */}
          <div className="relative group">
            {/* Lane Header Label */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 pointer-events-none select-none z-10">
              <Search01Icon className="w-3 h-3 text-[#D90000]" />
              <span className="tracking-widest uppercase font-mono">ZOOM</span>
            </div>

            {/* Interactive Zoom Track Container */}
            <div
              ref={zoomTrackRef}
              onClick={handleZoomTrackClick}
              onMouseMove={handleZoomTrackMouseMove}
              onMouseLeave={handleZoomTrackMouseLeave}
              style={{ height: `${zoomTrackHeightPx}px` }}
              className="rounded-xl bg-slate-300/40 dark:bg-zinc-900/70 border border-slate-300/80 dark:border-zinc-800/80 relative overflow-visible flex items-center shadow-xs cursor-crosshair hover:border-[#D90000]/40 transition-colors"
              title="Click anywhere to add a Zoom effect at that point"
            >
              {/* Subtle centerline guide for track automation feel */}
              <div className="absolute left-16 right-4 top-1/2 h-[1px] border-b border-dashed border-slate-300/80 dark:border-zinc-800 pointer-events-none" />

              {/* Dynamic Ghost Hover Box & "+ Add Zoom" badge on mouseover */}
              {zoomHover && !dragState && (
                <div
                  className="absolute top-1 bottom-1 rounded-lg border-2 border-dashed border-[#D90000]/70 bg-[#D90000]/10 pointer-events-none transition-all duration-75 z-25 flex items-center justify-center overflow-visible"
                  style={{
                    left: `${zoomHover.percent}%`,
                    width: `${Math.min(100 - zoomHover.percent, (defaultZoomDuration / safeDuration) * 100)}%`,
                  }}
                >
                  {/* Floating "+ Add Zoom" pill pinned to hover cursor */}
                  <div className="absolute -top-7 left-0 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#D90000] text-white text-[10px] font-bold shadow-lg flex items-center gap-1 whitespace-nowrap z-50 border border-white/20 animate-in fade-in zoom-in-95">
                    <Add01Icon className="w-2.5 h-2.5" />
                    <span>Add Zoom ({formatShortTime(zoomHover.time)})</span>
                  </div>
                </div>
              )}

              {/* Render Existing Zoom Segments */}
              {zoomSegments.map((zoom) => {
                const isSelected = selectedZoomId === zoom.id;
                const leftPercent = (zoom.start / safeDuration) * 100;
                const widthPercent = Math.max(3, ((zoom.end - zoom.start) / safeDuration) * 100);

                return (
                  <div
                    key={zoom.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectZoom?.(zoom.id);
                      onSeek(zoom.start);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectZoom?.(zoom.id);
                      setDragState({
                        type: 'zoom-move',
                        id: zoom.id,
                        initialStartX: e.clientX,
                        initialStart: zoom.start,
                        initialEnd: zoom.end,
                      });
                    }}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    className={`absolute top-1 bottom-1 rounded-lg px-2 flex items-center justify-between transition-all cursor-grab active:cursor-grabbing select-none group/segment shadow-xs ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#D90000] to-[#E11D48] text-white border border-[#D90000] ring-2 ring-[#D90000]/50 shadow-md z-30'
                        : 'bg-gradient-to-r from-[#D90000]/85 to-[#E11D48]/85 hover:from-[#D90000] hover:to-[#E11D48] text-white border border-[#D90000]/60 z-20'
                    }`}
                    title={`Zoom: ${zoom.scale.toFixed(1)}× (${zoom.start.toFixed(1)}s - ${zoom.end.toFixed(1)}s) • Drag to reposition`}
                  >
                    {/* Left Resize Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragState({
                          type: 'zoom-start',
                          id: zoom.id,
                          initialStartX: e.clientX,
                          initialStart: zoom.start,
                          initialEnd: zoom.end,
                        });
                      }}
                      className="absolute -left-1 top-0 bottom-0 w-2.5 hover:w-3.5 bg-black/30 dark:bg-white/40 rounded-l cursor-ew-resize opacity-0 group-hover/segment:opacity-100 transition-opacity flex items-center justify-center"
                      title="Drag to adjust zoom start"
                    >
                      <div className="w-[1px] h-3 bg-white/90" />
                    </div>

                    {/* Zoom Content Label */}
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden pointer-events-none">
                      <Search01Icon className="w-3 h-3 shrink-0 opacity-90" />
                      <span className="text-[10px] font-black tracking-tight truncate">
                        {zoom.scale.toFixed(1)}×
                      </span>
                      <span className="text-[9px] opacity-80 font-mono hidden md:inline truncate">
                        ({(zoom.end - zoom.start).toFixed(1)}s)
                      </span>
                    </div>

                    {/* Quick Delete '×' Button on hover/select */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTimelineItem?.(zoom.id);
                      }}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-black opacity-0 group-hover/segment:opacity-100 hover:bg-black/20 text-white transition-opacity ml-1 cursor-pointer shrink-0"
                      title="Remove zoom segment"
                    >
                      ×
                    </button>

                    {/* Right Resize Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragState({
                          type: 'zoom-end',
                          id: zoom.id,
                          initialStartX: e.clientX,
                          initialStart: zoom.start,
                          initialEnd: zoom.end,
                        });
                      }}
                      className="absolute -right-1 top-0 bottom-0 w-2.5 hover:w-3.5 bg-black/30 dark:bg-white/40 rounded-r cursor-ew-resize opacity-0 group-hover/segment:opacity-100 transition-opacity flex items-center justify-center"
                      title="Drag to adjust zoom end"
                    >
                      <div className="w-[1px] h-3 bg-white/90" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
