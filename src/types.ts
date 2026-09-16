export type ActiveView = 'studio' | 'library' | 'docs' | 'services' | 'logbook';

export type RecordingMode = 'screen' | 'screen_cam' | 'cam_only' | 'audio_only';

export type CompositionLayout = 'screen' | 'overlay' | 'framed' | 'corner-cam' | 'split' | 'split-vertical' | 'cam-only';

export type RecorderAspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '4:3';

export interface RecorderBackgroundConfig {
  type: 'none' | 'solid' | 'gradient' | 'image' | 'grain';
  value: string;
  padding: number; // 0 to 48 px
  borderRadius: number; // 0 to 32 px
}

export interface SmartRecordingConfig {
  smoothCursor: boolean;
  detectClicks: boolean;
  automaticZoom: boolean;
  smartFraming: boolean;
  autoSpeedTyping: boolean;
}

export interface PrompterConfig {
  enabled: boolean;
  text: string;
  speed: number; // 1 to 10
  fontSize: number; // 14 to 36 px
  isScrolling: boolean;
}

export type ResolutionPreset = 'native' | '4k' | '1440p' | '1080p' | '720p';

export type FrameRatePreset = 15 | 24 | 30 | 60;

export type PipPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
export type PipShape = 'rectangle' | 'circle' | 'rounded' | 'square';
export type PipSize = 'small' | 'medium' | 'large';

export interface PipConfig {
  enabled: boolean;
  position: PipPosition;
  customX?: number; // percentage 0-100
  customY?: number; // percentage 0-100
  customWidth?: number; // percentage of stage width
  customHeight?: number; // percentage of stage height
  shape: PipShape;
  size: PipSize;
  mirror: boolean;
  borderWidth: number;
  borderColor: string;
}

export interface AudioSettings {
  includeMic: boolean;
  includeSystemAudio: boolean;
  micDeviceId: string;
  micVolume: number; // 0 to 2 (1 = 100%)
  systemVolume: number; // 0 to 2
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface VideoSettings {
  resolution: ResolutionPreset;
  fps: FrameRatePreset;
  codec: string; // e.g. 'video/webm;codecs=vp9,opus'
  bitrateMbps: number; // e.g. 5, 8, 12
  countdownSeconds: 0 | 3 | 5 | 10;
  directSaveToFileSystem: boolean;
}

export interface VideoBookmark {
  id: string;
  timestamp: number; // seconds
  label: string;
  thumbnailUrl?: string;
}

// ----------------------------------------------------
// PHASE 1: Telemetry & Event Recording Metadata Types
// ----------------------------------------------------

export interface CursorPoint {
  time: number; // seconds relative to recording start
  x: number;    // normalized 0 to 1
  y: number;    // normalized 0 to 1
}

export interface ClickEvent {
  id: string;
  time: number; // seconds relative to recording start
  x: number;    // normalized 0 to 1
  y: number;    // normalized 0 to 1
  button: 'left' | 'right' | 'middle';
  type?: 'click' | 'dblclick';
}

export interface KeyboardEventRecord {
  time: number; // seconds relative to recording start
  key: string;
  code: string;
  isTypingBurst?: boolean;
}

export interface RecordingMetadata {
  cursor: CursorPoint[];
  clicks: ClickEvent[];
  keyboard: KeyboardEventRecord[];
  bookmarks: VideoBookmark[];
  screenDimensions?: { width: number; height: number };
}

// ----------------------------------------------------
// PHASE 2: Non-Destructive Project & Timeline Model
// ----------------------------------------------------

export type TimelineItemType = 'zoom' | 'cut' | 'speed' | 'camera' | 'caption' | 'annotation';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  start: number; // seconds
  end: number;   // seconds
  properties: Record<string, unknown>;
}

export type ZoomEasingType = 'easeInOut' | 'easeOut' | 'spring' | 'cubic' | 'linear';

export interface ZoomSegment {
  id: string;
  start: number;
  end: number;
  targetX: number; // 0 to 1
  targetY: number; // 0 to 1
  scale: number;   // e.g. 1.2 to 2.5
  easing?: ZoomEasingType;
  motionBlur?: boolean;
  motionBlurIntensity?: number; // 0 to 100
}

export interface CutSegment {
  id: string;
  start: number;
  end: number;
}

export interface SpeedSegment {
  id: string;
  start: number;
  end: number;
  speed: number; // e.g. 2, 4, 8
}

export type CursorStyleType = 'macos' | 'dot' | 'classic' | 'neon';
export type ClickEffectType = 'ripple' | 'ring' | 'glow' | 'pulse' | 'none';
export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:3' | 'auto';

export interface AppearanceSettings {
  background: string; // CSS gradient or color or preset name
  padding: number;    // px 0 to 64
  borderRadius: number; // px 0 to 32
  shadow: number;     // 0 to 50
  showCursor: boolean;
  cursorScale: number; // 0.6 to 2.5
  cursorStyle: CursorStyleType;
  clickEffect: ClickEffectType;
  cursorOffsetMs?: number; // Latency calibration in ms (-300 to 300)
  aspectRatio: AspectRatioType;
  autoZoomOnClicks: boolean;
  autoZoomScale: number;
  autoZoomDuration: number;
  zoomEasing?: ZoomEasingType;
  zoomMotionBlur?: boolean;
  zoomMotionBlurIntensity?: number; // 0 to 100
  layout?: CompositionLayout;
  trimStart?: number;
  trimEnd?: number;
}

export interface Project {
  id: string;
  title: string;
  createdAt: number;
  source: {
    videoBlob: Blob;
    duration: number;
    width: number;
    height: number;
    fps: number;
    mimeType: string;
    trimStart?: number;
    trimEnd?: number;
  };
  metadata: RecordingMetadata;
  timeline: TimelineItem[];
  appearance: AppearanceSettings;
  bookmarks: VideoBookmark[];
}

export interface SavedRecording {
  id: string;
  title: string;
  blob: Blob;
  mimeType: string;
  duration: number; // seconds
  size: number; // bytes
  createdAt: number; // timestamp
  thumbnailUrl: string;
  mode: RecordingMode;
  resolution: string;
  fps: number;
  bookmarks: VideoBookmark[];
  notes?: string;
  tags: string[];
  metadata?: RecordingMetadata;
  project?: Project;
}

export interface BrowserCapabilityReport {
  hasGetDisplayMedia: boolean;
  hasGetUserMedia: boolean;
  hasMediaRecorder: boolean;
  hasFileSystemAccess: boolean;
  hasAudioContext: boolean;
  hasIndexedDB: boolean;
  supportedMimeTypes: { mime: string; label: string; supported: boolean }[];
  maxTouchPoints: number;
  hardwareConcurrency: number;
  isSecureContext: boolean;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: string;
}
