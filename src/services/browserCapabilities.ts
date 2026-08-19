import { BrowserCapabilityReport } from '../types';

export function probeBrowserCapabilities(): BrowserCapabilityReport {
  const hasGetDisplayMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;
  const hasGetUserMedia = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const hasMediaRecorder = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';
  const hasFileSystemAccess = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  const hasAudioContext = typeof window !== 'undefined' && (!!window.AudioContext || !!(window as unknown as { webkitAudioContext: unknown }).webkitAudioContext);
  const hasIndexedDB = typeof window !== 'undefined' && !!window.indexedDB;

  const testedMimeTypes = [
    { mime: 'video/webm;codecs=vp9,opus', label: 'WebM VP9 + Opus (High Efficiency & Crisp Quality)' },
    { mime: 'video/webm;codecs=vp8,opus', label: 'WebM VP8 + Opus (Universal Web Compatibility)' },
    { mime: 'video/webm;codecs=h264,opus', label: 'WebM H.264 + Opus (Hardware Accelerated)' },
    { mime: 'video/webm;codecs=av01,opus', label: 'WebM AV1 + Opus (Next-Gen Open Codec)' },
    { mime: 'video/mp4;codecs=avc1,mp4a.40.2', label: 'MP4 H.264 + AAC (Safari & Direct MP4 Export)' },
    { mime: 'video/webm', label: 'Standard WebM (Default Browser Codec)' },
    { mime: 'audio/webm;codecs=opus', label: 'Audio Opus (Low Latency Studio Sound)' },
  ];

  const supportedMimeTypes = testedMimeTypes.map((item) => {
    let supported = false;
    if (hasMediaRecorder && MediaRecorder.isTypeSupported) {
      try {
        supported = MediaRecorder.isTypeSupported(item.mime);
      } catch {
        supported = false;
      }
    }
    return {
      ...item,
      supported,
    };
  });

  return {
    hasGetDisplayMedia,
    hasGetUserMedia,
    hasMediaRecorder,
    hasFileSystemAccess,
    hasAudioContext,
    hasIndexedDB,
    supportedMimeTypes,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 4,
    isSecureContext: window.isSecureContext ?? true,
  };
}

export function getBestSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return 'video/webm';
  }

  const preferred = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/webm',
    'video/mp4',
  ];

  for (const mime of preferred) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return 'video/webm';
}

export const getBrowserCapabilityReport = probeBrowserCapabilities;
