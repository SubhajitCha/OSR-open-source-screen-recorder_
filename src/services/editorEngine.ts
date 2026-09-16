import {
  AppearanceSettings,
  CutSegment,
  KeyboardEventRecord,
  Project,
  RecordingMetadata,
  SpeedSegment,
  TimelineItem,
  VideoBookmark,
  ZoomSegment,
} from '../types';
import { generateAutoZoomSegments } from './zoomEngine';
import { BACKGROUND_PRESETS } from './backgroundPresets';

export { BACKGROUND_PRESETS };

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  background: BACKGROUND_PRESETS[0].value,
  padding: 32,
  borderRadius: 16,
  shadow: 25,
  showCursor: false, // Disabled by default
  cursorScale: 1.0,
  cursorStyle: 'macos',
  clickEffect: 'ripple',
  aspectRatio: '16:9',
  autoZoomOnClicks: true,
  autoZoomScale: 1.6,
  autoZoomDuration: 2.5,
  zoomEasing: 'easeInOut',
  zoomMotionBlur: true,
  zoomMotionBlurIntensity: 70,
};

export function createInitialProject(
  videoBlob: Blob,
  duration: number,
  mimeType: string,
  metadata: RecordingMetadata,
  bookmarks: VideoBookmark[]
): Project {
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const title = `ScreenStudio_${new Date().toISOString().slice(0, 10)}_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '-')}`;

  // Start with clean timeline items without automatic zoom generation
  const timelineItems: TimelineItem[] = [];

  return {
    id: projectId,
    title,
    createdAt: Date.now(),
    source: {
      videoBlob,
      duration,
      width: metadata.screenDimensions?.width || 1920,
      height: metadata.screenDimensions?.height || 1080,
      fps: 60,
      mimeType,
    },
    metadata,
    timeline: timelineItems,
    appearance: { ...DEFAULT_APPEARANCE },
    bookmarks,
  };
}

export function extractZoomSegments(timeline: TimelineItem[]): ZoomSegment[] {
  return timeline
    .filter((item) => item.type === 'zoom')
    .map((item) => ({
      id: item.id,
      start: item.start,
      end: item.end,
      targetX: (item.properties.targetX as number) ?? 0.5,
      targetY: (item.properties.targetY as number) ?? 0.5,
      scale: (item.properties.scale as number) ?? 1.5,
      easing: (item.properties.easing as import('../types').ZoomEasingType) ?? 'easeInOut',
      motionBlur: item.properties.motionBlur !== undefined ? (item.properties.motionBlur as boolean) : undefined,
      motionBlurIntensity: item.properties.motionBlurIntensity !== undefined ? (item.properties.motionBlurIntensity as number) : undefined,
    }));
}

export function extractCutSegments(timeline: TimelineItem[]): CutSegment[] {
  return timeline
    .filter((item) => item.type === 'cut')
    .map((item) => ({
      id: item.id,
      start: item.start,
      end: item.end,
    }));
}

export function extractSpeedSegments(timeline: TimelineItem[]): SpeedSegment[] {
  return timeline
    .filter((item) => item.type === 'speed')
    .map((item) => ({
      id: item.id,
      start: item.start,
      end: item.end,
      speed: (item.properties.speed as number) ?? 2,
    }));
}

// Detect continuous typing bursts from recorded keyboard events and turn into 3x fast-forward speed segments
export function detectTypingSpeedSegments(
  keyboardEvents: KeyboardEventRecord[],
  videoDuration: number
): SpeedSegment[] {
  if (!keyboardEvents || keyboardEvents.length < 5) return [];

  const segments: SpeedSegment[] = [];
  let burstStart: number | null = null;
  let lastKeyTime = 0;

  keyboardEvents.forEach((ev) => {
    if (ev.isTypingBurst) {
      if (burstStart === null) {
        burstStart = Math.max(0, ev.time - 0.2);
      }
      lastKeyTime = ev.time;
    } else {
      if (burstStart !== null) {
        const burstEnd = Math.min(videoDuration, lastKeyTime + 0.5);
        if (burstEnd - burstStart >= 1.5) {
          segments.push({
            id: `speed_type_${Math.round(burstStart * 100)}`,
            start: parseFloat(burstStart.toFixed(2)),
            end: parseFloat(burstEnd.toFixed(2)),
            speed: 3.5, // 3.5x auto speedup for typing
          });
        }
        burstStart = null;
      }
    }
  });

  if (burstStart !== null) {
    const burstEnd = Math.min(videoDuration, lastKeyTime + 0.5);
    if (burstEnd - burstStart >= 1.5) {
      segments.push({
        id: `speed_type_${Math.round(burstStart * 100)}`,
        start: parseFloat(burstStart.toFixed(2)),
        end: parseFloat(burstEnd.toFixed(2)),
        speed: 3.5,
      });
    }
  }

  return segments;
}

// Check if a given playback time is inside a non-destructive cut segment
export function getNextActivePlaybackTime(currentTime: number, cuts: CutSegment[]): number {
  for (const cut of cuts) {
    if (currentTime >= cut.start && currentTime < cut.end) {
      return cut.end;
    }
  }
  return currentTime;
}
