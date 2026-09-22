import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  Film01Icon,
  RotateLeft01Icon,
  SparklesIcon,
  ScissorIcon,
  ZoomIcon,
  VolumeHighIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  MagicWand01Icon,
  Share01Icon,
  Maximize01Icon,
  Minimize01Icon,
  FlashIcon,
} from 'hugeicons-react';
import {
  AppearanceSettings,
  CompositionLayout,
  Project,
  RecorderBackgroundConfig,
  RecordingMetadata,
  TimelineItem,
  VideoBookmark,
  ZoomSegment,
} from '../../types';
import {
  createInitialProject,
  extractCutSegments,
  extractZoomSegments,
} from '../../services/editorEngine';
import { generateAutoZoomSegments } from '../../services/zoomEngine';
import { PreviewCanvas } from './PreviewCanvas';
import { Timeline } from './Timeline';
import { Inspector } from './Inspector';
import { ExportModal } from './ExportModal';
import { saveRecordingToDB, generateThumbnailFromBlob, saveActiveEditingSession } from '../../services/db';
import { SavedRecording } from '../../types';

interface VideoEditorProps {
  videoBlob: Blob;
  screenBlob?: Blob;
  camBlob?: Blob;
  duration: number;
  mimeType: string;
  bookmarks: VideoBookmark[];
  metadata?: RecordingMetadata;
  initialProject?: Project;
  layout?: CompositionLayout;
  background?: RecorderBackgroundConfig;
  onRecordAnother: () => void;
  onSavedToLibrary: () => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({
  videoBlob,
  screenBlob,
  camBlob,
  duration,
  mimeType,
  bookmarks,
  metadata,
  initialProject,
  layout = 'overlay',
  background,
  onRecordAnother,
  onSavedToLibrary,
}) => {
  // Initialize Project Model
  const [project, setProject] = useState<Project>(() => {
    if (initialProject) return initialProject;
    const safeMetadata = metadata || {
      cursor: [],
      clicks: [],
      keyboard: [],
      bookmarks: bookmarks || [],
    };
    const isEndToEnd = layout === 'overlay';
    const initialAppearance: Partial<AppearanceSettings> = {
      layout,
      padding: isEndToEnd ? 0 : layout === 'framed' ? 44 : 32,
      borderRadius: isEndToEnd ? 0 : 16,
      shadow: isEndToEnd ? 0 : 25,
      ...(background?.value ? { background: background.value } : {}),
    };
    return createInitialProject(
      videoBlob,
      duration,
      mimeType,
      safeMetadata,
      bookmarks || [],
      initialAppearance,
      screenBlob,
      camBlob
    );
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedZoomId, setSelectedZoomId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isQuickSaving, setIsQuickSaving] = useState<boolean>(false);
  const [isQuickSaved, setIsQuickSaved] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Panel sizing & minimizing states
  const [toolsWidth, setToolsWidth] = useState<number>(320);
  const [isToolsCollapsed, setIsToolsCollapsed] = useState<boolean>(false);
  const [isDraggingToolsResize, setIsDraggingToolsResize] = useState<boolean>(false);

  const [timelineHeight, setTimelineHeight] = useState<number>(200);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState<boolean>(false);
  const [isDraggingTimelineResize, setIsDraggingTimelineResize] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Tools panel horizontal resize listener
  useEffect(() => {
    if (!isDraggingToolsResize) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(520, e.clientX));
      setToolsWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsDraggingToolsResize(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingToolsResize]);

  // Reference to preserve last expanded height when collapsed
  const lastExpandedTimelineHeightRef = useRef<number>(200);

  // Timeline vertical resize listener with snatch to minimize threshold
  useEffect(() => {
    if (!isDraggingTimelineResize) return;
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const rawHeight = windowHeight - e.clientY;

      // Snatch threshold: dragging downward below 110px collapses to minimized scrubber
      if (rawHeight < 110) {
        setIsTimelineCollapsed(true);
      } else {
        // Dragging upward past 110px restores full multi-track view
        setIsTimelineCollapsed(false);
        const newHeight = Math.max(140, Math.min(380, rawHeight));
        setTimelineHeight(newHeight);
        lastExpandedTimelineHeightRef.current = newHeight;
      }
    };
    const handleMouseUp = () => {
      setIsDraggingTimelineResize(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTimelineResize]);

  // Listen for export modal trigger from top header
  useEffect(() => {
    const handleOpenExport = () => setIsExportModalOpen(true);
    window.addEventListener('open-editor-export-modal', handleOpenExport);
    return () => window.removeEventListener('open-editor-export-modal', handleOpenExport);
  }, []);

  // Auto-sync current editing draft to IndexedDB session
  useEffect(() => {
    const timer = setTimeout(() => {
      saveActiveEditingSession({
        blob: videoBlob,
        duration: project.source.duration,
        mimeType: project.source.mimeType,
        bookmarks: project.bookmarks,
        metadata: project.metadata,
        project,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [project, videoBlob]);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const willPlay = !prev;
      if (willPlay) {
        const trimEnd = project.source.trimEnd ?? project.source.duration;
        const trimStart = project.source.trimStart ?? 0;
        if (currentTime >= trimEnd - 0.1) {
          setCurrentTime(trimStart);
        }
      }
      return willPlay;
    });
  }, [currentTime, project.source.duration, project.source.trimEnd, project.source.trimStart]);

  // Toggle Fullscreen Viewport Mode
  const toggleFullscreen = useCallback(() => {
    if (viewportRef.current) {
      if (!document.fullscreenElement) {
        viewportRef.current.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      }
    } else {
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Update Appearance Settings
  const handleUpdateAppearance = (updates: Partial<AppearanceSettings>) => {
    setProject((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...updates },
    }));
  };

  // Add Zoom Segment at current playhead
  const handleAddZoomAtPlayhead = () => {
    const start = Math.max(0, currentTime - 0.2);
    const end = Math.min(project.source.duration, start + (project.appearance.autoZoomDuration || 2.5));
    const newZoomId = `zoom_manual_${Date.now()}`;

    const newZoomItem: TimelineItem = {
      id: newZoomId,
      type: 'zoom',
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
      properties: {
        targetX: 0.5,
        targetY: 0.5,
        scale: project.appearance.autoZoomScale || 1.6,
        easing: project.appearance.zoomEasing || 'easeInOut',
        motionBlur: project.appearance.zoomMotionBlur ?? true,
        motionBlurIntensity: project.appearance.zoomMotionBlurIntensity ?? 70,
      },
    };

    setProject((prev) => ({
      ...prev,
      timeline: [...prev.timeline, newZoomItem],
    }));

    setSelectedZoomId(newZoomId);
  };

  // Add Zoom Segment at specific time & target coordinates (for clicks & track clicking)
  const handleAddZoomAtTime = (time: number, targetX = 0.5, targetY = 0.5) => {
    const start = Math.max(0, time - 0.2);
    const end = Math.min(project.source.duration, start + (project.appearance.autoZoomDuration || 2.5));
    const newZoomId = `zoom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newZoomItem: TimelineItem = {
      id: newZoomId,
      type: 'zoom',
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
      properties: {
        targetX: parseFloat(targetX.toFixed(3)),
        targetY: parseFloat(targetY.toFixed(3)),
        scale: project.appearance.autoZoomScale || 1.6,
        easing: project.appearance.zoomEasing || 'easeInOut',
        motionBlur: project.appearance.zoomMotionBlur ?? true,
        motionBlurIntensity: project.appearance.zoomMotionBlurIntensity ?? 70,
      },
    };

    setProject((prev) => ({
      ...prev,
      timeline: [...prev.timeline, newZoomItem],
    }));

    setSelectedZoomId(newZoomId);
    setCurrentTime(parseFloat(time.toFixed(2)));
  };

  // Update Trim bounds (Trim In / Trim Out)
  const handleUpdateTrim = (newTrimStart: number, newTrimEnd: number) => {
    const validStart = Math.max(0, Math.min(newTrimStart, project.source.duration - 0.2));
    const validEnd = Math.max(validStart + 0.2, Math.min(newTrimEnd, project.source.duration));
    setProject((prev) => ({
      ...prev,
      source: {
        ...prev.source,
        trimStart: parseFloat(validStart.toFixed(2)),
        trimEnd: parseFloat(validEnd.toFixed(2)),
      },
    }));
    if (currentTime < validStart) setCurrentTime(validStart);
    if (currentTime > validEnd) setCurrentTime(validEnd);
  };

  // Update a Zoom Segment's target, scale, easing, or motion blur
  const handleUpdateZoomSegment = (zoomId: string, updates: Partial<ZoomSegment>) => {
    setProject((prev) => ({
      ...prev,
      timeline: prev.timeline.map((item) => {
        if (item.id === zoomId && item.type === 'zoom') {
          return {
            ...item,
            start: updates.start !== undefined ? updates.start : item.start,
            end: updates.end !== undefined ? updates.end : item.end,
            properties: {
              ...item.properties,
              ...(updates.targetX !== undefined ? { targetX: updates.targetX } : {}),
              ...(updates.targetY !== undefined ? { targetY: updates.targetY } : {}),
              ...(updates.scale !== undefined ? { scale: updates.scale } : {}),
              ...(updates.easing !== undefined ? { easing: updates.easing } : {}),
              ...(updates.motionBlur !== undefined ? { motionBlur: updates.motionBlur } : {}),
              ...(updates.motionBlurIntensity !== undefined ? { motionBlurIntensity: updates.motionBlurIntensity } : {}),
            },
          };
        }
        return item;
      }),
    }));
  };

  // Update zoom target coordinates by dragging on canvas
  const handleUpdateZoomTarget = (zoomId: string, targetX: number, targetY: number) => {
    handleUpdateZoomSegment(zoomId, { targetX, targetY });
  };

  // AI Auto-Detection of Zooms from recording interactions, clicks, and dwell telemetry
  const handleAutoDetectZooms = () => {
    const detected = generateAutoZoomSegments(
      project.metadata || { cursor: [], clicks: [], keyboard: [], bookmarks: [] },
      project.source.duration,
      project.appearance.autoZoomScale,
      project.appearance.autoZoomDuration
    );

    if (detected.length === 0) {
      alert('No significant interaction hotspots detected to auto-zoom.');
      return;
    }

    const newTimelineItems: TimelineItem[] = detected.map((z) => ({
      id: z.id,
      type: 'zoom',
      start: z.start,
      end: z.end,
      properties: {
        targetX: z.targetX,
        targetY: z.targetY,
        scale: z.scale,
        easing: z.easing,
      },
    }));

    // Filter out previous zoom items and append newly detected
    setProject((prev) => ({
      ...prev,
      timeline: [...prev.timeline.filter((item) => item.type !== 'zoom'), ...newTimelineItems],
    }));

    if (detected.length > 0) {
      setSelectedZoomId(detected[0].id);
      setCurrentTime(detected[0].start);
    }
  };

  // Split Clip at current playhead position
  const handleSplitClip = () => {
    if (currentTime <= 0.2 || currentTime >= project.source.duration - 0.2) return;

    // Check if there's already a cut starting here
    const newCutId = `cut_${Date.now()}`;
    const cutEnd = Math.min(project.source.duration, currentTime + 1.5);

    const newCutItem: TimelineItem = {
      id: newCutId,
      type: 'cut',
      start: parseFloat(currentTime.toFixed(2)),
      end: parseFloat(cutEnd.toFixed(2)),
      properties: {},
    };

    setProject((prev) => ({
      ...prev,
      timeline: [...prev.timeline, newCutItem],
    }));
  };

  // Remove Timeline Item
  const handleRemoveTimelineItem = (id: string) => {
    setProject((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((item) => item.id !== id),
    }));
    if (selectedZoomId === id) {
      setSelectedZoomId(null);
    }
  };

  // Quick Draft Save
  const handleQuickSave = async () => {
    try {
      setIsQuickSaving(true);
      const thumb = await generateThumbnailFromBlob(project.source.videoBlob);
      const record: SavedRecording = {
        id: project.id,
        title: project.title,
        blob: project.source.videoBlob,
        mimeType: project.source.mimeType,
        duration: project.source.duration,
        size: project.source.videoBlob.size,
        createdAt: project.createdAt || Date.now(),
        thumbnailUrl: thumb,
        mode: 'screen_cam',
        resolution: `${project.source.width}x${project.source.height}`,
        fps: project.source.fps,
        bookmarks: project.bookmarks,
        tags: ['draft'],
        metadata: project.metadata,
        project,
      };
      await saveRecordingToDB(record);
      setIsQuickSaved(true);
      setTimeout(() => setIsQuickSaved(false), 3000);
    } catch (err) {
      console.error('Failed to quick-save:', err);
    } finally {
      setIsQuickSaving(false);
    }
  };

  // Keyboard Shortcuts (Space to play/pause, Z for zoom, S for split, F for fullscreen, Esc to exit fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime((t) => Math.max(0, t - (e.shiftKey ? 5 : 1)));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime((t) => Math.min(project.source.duration, t + (e.shiftKey ? 5 : 1)));
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, project.source.duration, currentTime]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-100 dark:bg-[#0D0D10] text-slate-900 dark:text-[#EDEDED] overflow-hidden select-none font-sans transition-colors">
      {/* Main Studio Middle Area (Left Inspector + Center Viewport) */}
      <div className="flex-1 flex overflow-hidden min-h-0 min-w-0">
        {/* Left Sidebar: Tools & Inspector */}
        <Inspector
          project={project}
          onUpdateAppearance={handleUpdateAppearance}
          selectedZoomId={selectedZoomId}
          onUpdateZoomSegment={handleUpdateZoomSegment}
          onRemoveZoomSegment={handleRemoveTimelineItem}
          currentTime={currentTime}
          onUpdateTrim={handleUpdateTrim}
          width={toolsWidth}
          isCollapsed={isToolsCollapsed}
          onToggleCollapse={() => setIsToolsCollapsed((prev) => !prev)}
        />

        {/* Tools Panel Resize Drag Handle */}
        {!isToolsCollapsed && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingToolsResize(true);
            }}
            className="w-1.5 hover:w-2 -ml-1 z-20 cursor-col-resize hover:bg-[#D90000]/60 active:bg-[#D90000] transition-colors flex items-center justify-center group shrink-0 select-none"
            title="Drag to resize studio tools"
          >
            <div className="w-[2px] h-6 bg-slate-300 dark:bg-zinc-700 group-hover:bg-[#D90000] rounded-full transition-colors" />
          </div>
        )}

        {/* Center: Video Viewport + Transport Scrubber Bar */}
        <div
          ref={viewportRef}
          className={`flex-1 flex flex-col overflow-hidden bg-slate-200/60 dark:bg-[#09090B] relative min-h-0 min-w-0 transition-colors ${
            isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''
          }`}
        >
          {/* Main Video Viewport Canvas */}
          <div className="flex-1 flex items-center justify-center p-3 overflow-hidden relative min-h-0 min-w-0 w-full h-full">
            {/* Quick Button to Re-expand Studio Tools if collapsed */}
            {isToolsCollapsed && (
              <button
                type="button"
                onClick={() => setIsToolsCollapsed(false)}
                className="absolute top-4 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold shadow-lg border border-slate-200 dark:border-zinc-700 backdrop-blur-md transition-all cursor-pointer hover:scale-105"
                title="Expand Studio Tools"
              >
                <ArrowRight01Icon className="w-3.5 h-3.5 text-[#D90000]" />
                <span>Studio Tools</span>
              </button>
            )}

            <PreviewCanvas
              project={project}
              currentTime={currentTime}
              isPlaying={isPlaying}
              volume={volume}
              isMuted={isMuted}
              onTimeUpdate={(t) => setCurrentTime(t)}
              selectedZoomId={selectedZoomId}
              onUpdateZoomTarget={handleUpdateZoomTarget}
            />

            {/* Floating Fullscreen Exit Button */}
            {isFullscreen && (
              <div className="absolute top-4 right-4 z-40">
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg cursor-pointer transition-all"
                  title="Exit Fullscreen (ESC / F)"
                >
                  <Minimize01Icon className="w-4 h-4 text-blue-400" />
                  <span>Exit Fullscreen (ESC)</span>
                </button>
              </div>
            )}
          </div>

          {/* Under-Preview Video Transport & Scrubber Bar */}
          <div className="h-12 bg-white dark:bg-[#121215] border-t border-slate-200 dark:border-zinc-800 px-5 flex items-center justify-between shrink-0 select-none transition-colors">
            {/* Left Transport Info */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono text-[10px] text-slate-700 dark:text-zinc-300">
                {project.source.width}×{project.source.height}
              </span>
              <span className="hidden sm:inline font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                {project.appearance.aspectRatio}
              </span>
            </div>

            {/* Center Playback Transport Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentTime((t) => Math.max(0, t - 5))}
                className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Rewind 5s"
              >
                <ArrowLeft01Icon className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-[#D90000] hover:bg-[#b80000] text-white flex items-center justify-center shadow-md shadow-[#D90000]/25 transition-transform active:scale-95 cursor-pointer font-bold"
                title="Play / Pause (Space)"
              >
                {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => setCurrentTime((t) => Math.min(project.source.duration, t + 5))}
                className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Forward 5s"
              >
                <ArrowRight01Icon className="w-4 h-4" />
              </button>
            </div>

            {/* Right Transport Controls (Volume + Maximize Fullscreen) */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  className="text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <VolumeHighIcon className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value, 10));
                    setIsMuted(false);
                  }}
                  className="w-16 h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D90000]"
                />
              </div>

              {/* Maximize Fullscreen Button beside Volume */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Maximize Video (F)'}
              >
                {isFullscreen ? (
                  <Minimize01Icon className="w-4 h-4 text-[#D90000]" />
                ) : (
                  <Maximize01Icon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Multi-Track Timeline with Resize and Minimize Support */}
      <Timeline
        project={project}
        currentTime={currentTime}
        duration={project.source.duration}
        isPlaying={isPlaying}
        onSeek={(t) => setCurrentTime(t)}
        onTogglePlay={togglePlay}
        onAddZoom={handleAddZoomAtPlayhead}
        onAddZoomAtTime={handleAddZoomAtTime}
        onSplitClip={handleSplitClip}
        selectedZoomId={selectedZoomId}
        onSelectZoom={(id) => setSelectedZoomId(id)}
        onRemoveTimelineItem={handleRemoveTimelineItem}
        onUpdateZoomSegment={handleUpdateZoomSegment}
        onUpdateTrim={handleUpdateTrim}
        isCollapsed={isTimelineCollapsed}
        onToggleCollapse={() => {
          setIsTimelineCollapsed((prev) => {
            if (!prev) {
              lastExpandedTimelineHeightRef.current = timelineHeight;
              return true;
            } else {
              setTimelineHeight(lastExpandedTimelineHeightRef.current || 200);
              return false;
            }
          });
        }}
        height={timelineHeight}
        onStartResizeDrag={(e) => {
          e.preventDefault();
          setIsDraggingTimelineResize(true);
        }}
      />

      {/* Export Studio Modal */}
      {isExportModalOpen && (
        <ExportModal
          project={project}
          onClose={() => setIsExportModalOpen(false)}
          onSavedToLibrary={() => {
            setIsExportModalOpen(false);
            onSavedToLibrary();
          }}
        />
      )}
    </div>
  );
};
