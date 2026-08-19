export type ActiveView = 'studio' | 'library' | 'docs' | 'services';

export type RecordingMode = 'screen' | 'screen_cam' | 'cam_only' | 'audio_only';

export type ResolutionPreset = 'native' | '4k' | '1440p' | '1080p' | '720p';

export type FrameRatePreset = 15 | 24 | 30 | 60;

export type PipPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
export type PipShape = 'circle' | 'rounded' | 'square';
export type PipSize = 'small' | 'medium' | 'large';

export interface PipConfig {
  enabled: boolean;
  position: PipPosition;
  customX?: number; // percentage 0-100
  customY?: number; // percentage 0-100
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
