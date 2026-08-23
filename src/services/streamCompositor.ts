import { PipConfig } from '../types';

export interface CompositorController {
  canvas: HTMLCanvasElement;
  stream: MediaStream;
  updatePipConfig: (config: PipConfig) => void;
  cleanup: () => void;
}

/**
 * High-Performance Lightweight Stream Compositor
 * - Only used when Screen + Camera composite is strictly required.
 * - Single precision requestAnimationFrame loop locked to the target FPS.
 * - Eliminated CPU-heavy shadowBlur rasterization on high-frequency render loops.
 * - Cached dimensions, path calculations, and optimized 2D context.
 */
export function createStreamCompositor(
  screenStream: MediaStream,
  cameraStream: MediaStream | null,
  initialPipConfig: PipConfig,
  targetFps: number = 30
): CompositorController {
  let isRunning = true;
  let pipConfig = { ...initialPipConfig };
  let animFrameId: number | null = null;
  let lastFrameTime = 0;
  const frameIntervalMs = 1000 / (targetFps || 30);

  // Hidden off-screen video elements for decoding frames
  const screenVideo = document.createElement('video');
  screenVideo.muted = true;
  screenVideo.playsInline = true;
  screenVideo.autoplay = true;
  screenVideo.srcObject = screenStream;

  let cameraVideo: HTMLVideoElement | null = null;
  if (cameraStream) {
    cameraVideo = document.createElement('video');
    cameraVideo.muted = true;
    cameraVideo.playsInline = true;
    cameraVideo.autoplay = true;
    cameraVideo.srcObject = cameraStream;
  }

  // Optimized Canvas setup with desynchronized 2D context for ultra-low latency & CPU usage
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  
  // desynchronized and willReadFrequently: false for GPU acceleration
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
  });

  // Ensure video playback begins smoothly
  const playPromise = screenVideo.play().catch(() => {});
  if (cameraVideo) {
    cameraVideo.play().catch(() => {});
  }

  // Pre-cached dimension and position calculations
  let cachedPipSize = 0;
  let cachedPipX = 0;
  let cachedPipY = 0;
  let needsPipRecalc = true;

  const updatePipMetrics = (canvasWidth: number, canvasHeight: number) => {
    let sizePx: number;
    switch (pipConfig.size) {
      case 'small':
        sizePx = Math.round(canvasWidth * 0.14);
        break;
      case 'large':
        sizePx = Math.round(canvasWidth * 0.24);
        break;
      case 'medium':
      default:
        sizePx = Math.round(canvasWidth * 0.18);
        break;
    }
    sizePx = Math.max(120, Math.min(sizePx, 480));

    const margin = Math.round(canvasWidth * 0.02);
    let x = canvasWidth - sizePx - margin;
    let y = canvasHeight - sizePx - margin;

    if (pipConfig.position === 'custom' && pipConfig.customX !== undefined && pipConfig.customY !== undefined) {
      x = (pipConfig.customX / 100) * canvasWidth - sizePx / 2;
      y = (pipConfig.customY / 100) * canvasHeight - sizePx / 2;
    } else {
      switch (pipConfig.position) {
        case 'top-left':
          x = margin;
          y = margin;
          break;
        case 'top-right':
          x = canvasWidth - sizePx - margin;
          y = margin;
          break;
        case 'bottom-left':
          x = margin;
          y = canvasHeight - sizePx - margin;
          break;
        case 'bottom-right':
        default:
          x = canvasWidth - sizePx - margin;
          y = canvasHeight - sizePx - margin;
          break;
      }
    }

    cachedPipSize = sizePx;
    cachedPipX = Math.max(0, Math.min(canvasWidth - sizePx, x));
    cachedPipY = Math.max(0, Math.min(canvasHeight - sizePx, y));
    needsPipRecalc = false;
  };

  // Main Render Loop throttled strictly to target FPS to save CPU
  const renderLoop = (timestamp: number) => {
    if (!isRunning) return;

    // Throttle rendering to target FPS
    if (timestamp - lastFrameTime >= frameIntervalMs - 2) {
      lastFrameTime = timestamp;

      if (ctx) {
        // Adjust canvas dimensions to match the screen track resolution dynamically
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.readyState === 'live') {
          const settings = videoTrack.getSettings();
          const targetW = settings.width || 1920;
          const targetH = settings.height || 1080;
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
            needsPipRecalc = true;
          }
        }

        const width = canvas.width;
        const height = canvas.height;

        if (needsPipRecalc) {
          updatePipMetrics(width, height);
        }

        // 1. Draw Primary Screen Video Frame
        if (screenVideo.readyState >= 2) {
          ctx.drawImage(screenVideo, 0, 0, width, height);
        } else {
          // Fallback dark canvas
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, width, height);
        }

        // 2. Draw Camera Overlay (Only if active and ready)
        if (cameraVideo && cameraVideo.readyState >= 2) {
          const size = cachedPipSize;
          const x = cachedPipX;
          const y = cachedPipY;
          const shape = pipConfig.shape;
          const mirror = pipConfig.mirror;

          ctx.save();

          // Create Lightweight Clip Path (No heavy shadowBlur on 60FPS loop)
          ctx.beginPath();
          if (shape === 'circle') {
            const radius = size / 2;
            ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
          } else if (shape === 'rounded') {
            const radius = Math.round(size * 0.16);
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(x, y, size, size, radius);
            } else {
              ctx.rect(x, y, size, size);
            }
          } else {
            ctx.rect(x, y, size, size);
          }
          ctx.closePath();
          ctx.clip();

          // Draw Cropped Camera Frame
          const camW = cameraVideo.videoWidth || size;
          const camH = cameraVideo.videoHeight || size;
          const minDim = Math.min(camW, camH);
          const srcX = (camW - minDim) / 2;
          const srcY = (camH - minDim) / 2;

          if (mirror) {
            ctx.translate(x + size, y);
            ctx.scale(-1, 1);
            ctx.drawImage(cameraVideo, srcX, srcY, minDim, minDim, 0, 0, size, size);
          } else {
            ctx.drawImage(cameraVideo, srcX, srcY, minDim, minDim, x, y, size, size);
          }

          ctx.restore();

          // Draw crisp accent border without expensive filter rasterization
          ctx.save();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          if (shape === 'circle') {
            const radius = size / 2;
            ctx.arc(x + radius, y + radius, radius - 1.5, 0, Math.PI * 2);
          } else if (shape === 'rounded') {
            const radius = Math.round(size * 0.16);
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(x + 1.5, y + 1.5, size - 3, size - 3, radius);
            } else {
              ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
            }
          } else {
            ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    if (isRunning) {
      animFrameId = requestAnimationFrame(renderLoop);
    }
  };

  // Start the RAF rendering loop
  animFrameId = requestAnimationFrame(renderLoop);

  // Capture canvas media stream
  const compositeStream = canvas.captureStream(targetFps);

  return {
    canvas,
    stream: compositeStream,
    updatePipConfig: (newConfig: PipConfig) => {
      pipConfig = { ...newConfig };
      needsPipRecalc = true;
    },
    cleanup: () => {
      isRunning = false;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }

      // Stop offscreen video playback and release memory
      try {
        screenVideo.pause();
        screenVideo.srcObject = null;
        screenVideo.remove();
      } catch (_) {}

      if (cameraVideo) {
        try {
          cameraVideo.pause();
          cameraVideo.srcObject = null;
          cameraVideo.remove();
        } catch (_) {}
      }

      // Stop canvas stream tracks
      compositeStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
    },
  };
}
