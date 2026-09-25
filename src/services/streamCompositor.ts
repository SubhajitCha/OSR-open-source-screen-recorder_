import { CompositionLayout, PipConfig, RecorderBackgroundConfig } from '../types';
import { calculatePipMetrics } from './pipCoordinates';
import { renderBackgroundToCanvas } from './backgroundPresets';

export interface CompositorController {
  canvas: HTMLCanvasElement;
  stream: MediaStream;
  updatePipConfig: (config: PipConfig) => void;
  updateLayoutAndBackground: (layout: CompositionLayout, background?: RecorderBackgroundConfig) => void;
  cleanup: () => void;
}

/**
 * Universal rounded rectangle path helper that guarantees smooth rounded corners
 * even if native ctx.roundRect is unavailable or buggy.
 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  if (radius <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  const r = Math.min(radius, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

/**
 * Draw camera video onto canvas with precise aspect fitting, clipping, mirror, and stroke.
 */
function drawCameraOnCanvas(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  shape: string,
  mirror: boolean,
  borderWidth: number,
  borderColor: string
) {
  ctx.save();
  ctx.beginPath();
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2;
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  } else if (radius > 0) {
    drawRoundedRectPath(ctx, x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.closePath();
  ctx.clip();

  const rawW = video.videoWidth || w;
  const rawH = video.videoHeight || h;
  const targetAspect = w / (h || 1);
  const videoAspect = rawW / (rawH || 1);

  let srcW = rawW;
  let srcH = rawH;
  let srcX = 0;
  let srcY = 0;

  if (videoAspect > targetAspect) {
    srcW = rawH * targetAspect;
    srcX = (rawW - srcW) / 2;
  } else {
    srcH = rawW / targetAspect;
    srcY = (rawH - srcH) / 2;
  }

  if (mirror) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, w, h);
  } else {
    ctx.drawImage(video, srcX, srcY, srcW, srcH, x, y, w, h);
  }
  ctx.restore();

  if (borderWidth > 0) {
    ctx.save();
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.beginPath();
    const half = borderWidth / 2;
    if (shape === 'circle') {
      const r = Math.min(w, h) / 2;
      ctx.arc(x + r, y + r, Math.max(1, r - half), 0, Math.PI * 2);
    } else if (radius > 0) {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(
          x + half,
          y + half,
          Math.max(1, w - borderWidth),
          Math.max(1, h - borderWidth),
          Math.max(0, radius - half)
        );
      } else {
        ctx.strokeRect(
          x + half,
          y + half,
          Math.max(1, w - borderWidth),
          Math.max(1, h - borderWidth)
        );
      }
    } else {
      ctx.strokeRect(
        x + half,
        y + half,
        Math.max(1, w - borderWidth),
        Math.max(1, h - borderWidth)
      );
    }
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * High-Performance Resilient Stream Compositor
 * - Composites Screen + Camera + Background into a unified recording stream.
 * - Supports 3 premade layouts:
 *   1. 'overlay' (End to End: Full screen + corner camera)
 *   2. 'framed' (Spacing around screen with background visible behind it + corner camera)
 *   3. 'split' (Camera sits beside screen with background visible behind both)
 * - Powered by a dual-engine render loop (requestAnimationFrame + Web Worker heartbeat)
 */
export function createStreamCompositor(
  screenStream: MediaStream,
  cameraStream: MediaStream | null,
  initialPipConfig: PipConfig,
  targetFps: number = 30,
  initialLayout: CompositionLayout = 'framed',
  initialBackground?: RecorderBackgroundConfig
): CompositorController {
  let isRunning = true;
  let pipConfig = { ...initialPipConfig };
  let currentLayout: CompositionLayout = initialLayout;
  let currentBackground: RecorderBackgroundConfig = initialBackground || {
    type: 'gradient',
    value: 'linear-gradient(145deg, #18181B 0%, #131316 50%, #0D0D0F 100%)',
    padding: 24,
    borderRadius: 12,
  };

  let animFrameId: number | null = null;
  let lastFrameTime = 0;
  const frameIntervalMs = 1000 / (targetFps || 30);
  let hasDrawnScreenFrame = false;

  // Active off-screen container in DOM to keep Chromium media pipelines running in background
  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.position = 'fixed';
  hiddenContainer.style.top = '0';
  hiddenContainer.style.left = '0';
  hiddenContainer.style.width = '1px';
  hiddenContainer.style.height = '1px';
  hiddenContainer.style.opacity = '0.001';
  hiddenContainer.style.pointerEvents = 'none';
  hiddenContainer.style.zIndex = '-99999';
  hiddenContainer.style.overflow = 'hidden';
  hiddenContainer.setAttribute('aria-hidden', 'true');

  // Video element for decoding screen frames
  const screenVideo = document.createElement('video');
  screenVideo.muted = true;
  screenVideo.playsInline = true;
  screenVideo.autoplay = true;
  screenVideo.setAttribute('muted', '');
  screenVideo.setAttribute('playsinline', '');
  screenVideo.setAttribute('autoplay', '');
  screenVideo.srcObject = screenStream;
  screenVideo.onpause = () => {
    if (isRunning) screenVideo.play().catch(() => {});
  };
  hiddenContainer.appendChild(screenVideo);

  let cameraVideo: HTMLVideoElement | null = null;
  if (cameraStream) {
    cameraVideo = document.createElement('video');
    cameraVideo.muted = true;
    cameraVideo.playsInline = true;
    cameraVideo.autoplay = true;
    cameraVideo.setAttribute('muted', '');
    cameraVideo.setAttribute('playsinline', '');
    cameraVideo.setAttribute('autoplay', '');
    cameraVideo.srcObject = cameraStream;
    cameraVideo.onpause = () => {
      if (isRunning && cameraVideo) cameraVideo.play().catch(() => {});
    };
    hiddenContainer.appendChild(cameraVideo);
  }

  // Mount offscreen container into DOM
  if (document.body) {
    document.body.appendChild(hiddenContainer);
  }

  // Optimized Canvas setup with desynchronized 2D context for ultra-low latency & GPU acceleration
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;

  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
  });

  // Ensure video playback begins smoothly
  screenVideo.play().catch(() => {});
  if (cameraVideo) {
    cameraVideo.play().catch(() => {});
  }

  // Pre-cached dimension and position calculations
  let cachedPipX = 0;
  let cachedPipY = 0;
  let cachedPipWidth = 0;
  let cachedPipHeight = 0;
  let cachedPipRadius = 0;
  let needsPipRecalc = true;

  const updatePipMetrics = (canvasWidth: number, canvasHeight: number) => {
    const metrics = calculatePipMetrics(pipConfig, canvasWidth, canvasHeight, currentLayout);
    cachedPipWidth = metrics.width;
    cachedPipHeight = metrics.height;
    cachedPipX = metrics.x;
    cachedPipY = metrics.y;
    cachedPipRadius = metrics.radiusPx;
    needsPipRecalc = false;
  };

  // Core Frame Drawing Routine
  const drawFrame = (timestamp: number) => {
    if (!isRunning || !ctx) return;

    lastFrameTime = timestamp;

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

    const isScreenReady =
      screenVideo.readyState >= 2 || (screenVideo.videoWidth > 0 && screenVideo.readyState >= 1);
    const isCameraReady =
      cameraVideo &&
      (cameraVideo.readyState >= 2 || (cameraVideo.videoWidth > 0 && cameraVideo.readyState >= 1));

    if (currentLayout === 'split') {
      // -------------------------------------------------------------
      // LAYOUT 3: BESIDE (Camera sits beside the screen with visible background)
      // -------------------------------------------------------------
      renderBackgroundToCanvas(ctx, width, height, currentBackground.value);

      if (isCameraReady && cameraVideo) {
        // Left Column: Camera Presenter Card
        const camW = width * 0.24;
        const camH = height * 0.82;
        const camX = width * 0.04;
        const camY = (height - camH) / 2;
        const camRadius = 20 * (width / 1920);

        // Soft drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 24 * (width / 1920);
        ctx.shadowOffsetY = 6 * (width / 1920);
        ctx.fillStyle = '#090a0f';
        ctx.beginPath();
        drawRoundedRectPath(ctx, camX, camY, camW, camH, camRadius);
        ctx.fill();
        ctx.restore();

        // Draw camera video with aspect-fill and mirror
        drawCameraOnCanvas(
          ctx,
          cameraVideo,
          camX,
          camY,
          camW,
          camH,
          camRadius,
          'rounded',
          pipConfig.mirror,
          2 * (width / 1920),
          'rgba(255, 255, 255, 0.25)'
        );

        // Right Column: Captured Screen Card
        const scrW = width * 0.66;
        const scrH = height * 0.82;
        const scrX = width * 0.30;
        const scrY = (height - scrH) / 2;
        const scrRadius = 20 * (width / 1920);

        // Screen shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 28 * (width / 1920);
        ctx.shadowOffsetY = 8 * (width / 1920);
        ctx.fillStyle = '#090a0f';
        ctx.beginPath();
        drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
        ctx.fill();
        ctx.restore();

        // Clip & Draw Screen
        ctx.save();
        ctx.beginPath();
        drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
        ctx.clip();
        if (isScreenReady) {
          ctx.drawImage(screenVideo, scrX, scrY, scrW, scrH);
          hasDrawnScreenFrame = true;
        }
        ctx.restore();

        // Screen border
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2 * (width / 1920);
        ctx.beginPath();
        drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
        ctx.stroke();
        ctx.restore();
      } else {
        // Fallback if camera is inactive: Center screen cleanly
        const scrW = width * 0.86;
        const scrH = height * 0.86;
        const scrX = (width - scrW) / 2;
        const scrY = (height - scrH) / 2;
        const scrRadius = 20 * (width / 1920);

        ctx.save();
        ctx.beginPath();
        drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
        ctx.clip();
        if (isScreenReady) {
          ctx.drawImage(screenVideo, scrX, scrY, scrW, scrH);
          hasDrawnScreenFrame = true;
        }
        ctx.restore();
      }
    } else if (currentLayout === 'corner-cam') {
      // -------------------------------------------------------------
      // LAYOUT: FLOATING CORNER / CORNER-CAM (End-to-End screen + corner camera flush on edge)
      // -------------------------------------------------------------
      if (isScreenReady) {
        ctx.drawImage(screenVideo, 0, 0, width, height);
        hasDrawnScreenFrame = true;
      } else if (!hasDrawnScreenFrame) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      // Camera Card floating with subtle margin from edge
      if (isCameraReady && cameraVideo) {
        drawCameraOnCanvas(
          ctx,
          cameraVideo,
          cachedPipX,
          cachedPipY,
          cachedPipWidth,
          cachedPipHeight,
          cachedPipRadius,
          pipConfig.shape || 'rounded',
          pipConfig.mirror,
          pipConfig.borderWidth ?? 3,
          pipConfig.borderColor || 'rgba(255, 255, 255, 0.35)'
        );
      }
    } else if (currentLayout === 'framed' || currentLayout === 'spaced-far') {
      // -------------------------------------------------------------
      // LAYOUT 2: FRAMED / SPACED-FAR (Spacing around screen with background visible behind it)
      // -------------------------------------------------------------
      renderBackgroundToCanvas(ctx, width, height, currentBackground.value);

      // Inset Screen Card with Margins/Padding
      const marginRatio = currentLayout === 'spaced-far' ? 0.15 : 0.07;
      const padX = width * marginRatio;
      const padY = height * marginRatio;
      const scrW = width * (1 - marginRatio * 2);
      const scrH = height * (1 - marginRatio * 2);
      const scrRadius = (currentLayout === 'spaced-far' ? 22 : 18) * (width / 1920);

      // Soft drop shadow behind screen
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = (currentLayout === 'spaced-far' ? 36 : 32) * (width / 1920);
      ctx.shadowOffsetY = 8 * (width / 1920);
      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      drawRoundedRectPath(ctx, padX, padY, scrW, scrH, scrRadius);
      ctx.fill();
      ctx.restore();

      // Clip & Draw Main Video Source
      ctx.save();
      ctx.beginPath();
      drawRoundedRectPath(ctx, padX, padY, scrW, scrH, scrRadius);
      ctx.clip();
      if (isScreenReady) {
        ctx.drawImage(screenVideo, padX, padY, scrW, scrH);
        hasDrawnScreenFrame = true;
      } else if (isCameraReady && cameraVideo && !screenStream) {
        ctx.drawImage(cameraVideo, padX, padY, scrW, scrH);
      }
      ctx.restore();

      // Thin crisp border
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2 * (width / 1920);
      ctx.beginPath();
      drawRoundedRectPath(ctx, padX, padY, scrW, scrH, scrRadius);
      ctx.stroke();
      ctx.restore();

      // Corner Camera Bubble (only in dual-source mode where both screen and camera are active)
      if (isCameraReady && cameraVideo && isScreenReady) {
        drawCameraOnCanvas(
          ctx,
          cameraVideo,
          cachedPipX,
          cachedPipY,
          cachedPipWidth,
          cachedPipHeight,
          cachedPipRadius,
          pipConfig.shape || 'rectangle',
          pipConfig.mirror,
          pipConfig.borderWidth ?? 3,
          pipConfig.borderColor || '#38bdf8'
        );
      }
    } else {
      // -------------------------------------------------------------
      // LAYOUT 1: OVERLAY / END-TO-END (Full display capture)
      // -------------------------------------------------------------
      if (isScreenReady) {
        ctx.drawImage(screenVideo, 0, 0, width, height);
        hasDrawnScreenFrame = true;
      } else if (isCameraReady && cameraVideo && !screenStream) {
        ctx.drawImage(cameraVideo, 0, 0, width, height);
      } else if (!hasDrawnScreenFrame) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      if (isCameraReady && cameraVideo && isScreenReady && currentLayout !== 'screen') {
        drawCameraOnCanvas(
          ctx,
          cameraVideo,
          cachedPipX,
          cachedPipY,
          cachedPipWidth,
          cachedPipHeight,
          cachedPipRadius,
          pipConfig.shape || 'rectangle',
          pipConfig.mirror,
          pipConfig.borderWidth ?? 3,
          pipConfig.borderColor || '#38bdf8'
        );
      }
    }
  };

  // Primary animation loop for foreground active tab (vsync aligned)
  const renderLoop = (timestamp: number) => {
    if (!isRunning) return;

    if (timestamp - lastFrameTime >= frameIntervalMs - 2) {
      drawFrame(timestamp);
    }

    if (isRunning) {
      animFrameId = requestAnimationFrame(renderLoop);
    }
  };

  // Draw initial frame immediately to initialize canvas stream buffer
  drawFrame(performance.now());

  // Start foreground requestAnimationFrame loop
  animFrameId = requestAnimationFrame(renderLoop);

  // Background Web Worker Heartbeat Timer:
  // Browsers throttle requestAnimationFrame and window.setInterval when a tab is hidden.
  // Web Workers run in a separate thread and are completely exempt from background tab throttling!
  let workerTimer: Worker | null = null;
  let workerBlobUrl: string | null = null;

  try {
    const workerScript = `
      let timerId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (!timerId) {
            timerId = setInterval(function() {
              self.postMessage('tick');
            }, ${Math.max(16, Math.floor(frameIntervalMs))});
          }
        } else if (e.data === 'stop') {
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }
        }
      };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    workerBlobUrl = URL.createObjectURL(blob);
    workerTimer = new Worker(workerBlobUrl);

    workerTimer.onmessage = () => {
      if (!isRunning) return;
      const now = performance.now();
      // If tab is hidden or rAF has been throttled/delayed, fire frame draw immediately
      if (document.hidden || now - lastFrameTime >= frameIntervalMs - 2) {
        drawFrame(now);
      }
    };

    workerTimer.postMessage('start');
  } catch (err) {
    console.warn('Compositor Web Worker timer fallback engaged:', err);
  }

  // Backup interval timer (ensures execution even if worker is unavailable)
  const backupInterval = window.setInterval(() => {
    if (!isRunning) return;
    const now = performance.now();
    if (document.hidden && now - lastFrameTime >= frameIntervalMs - 2) {
      drawFrame(now);
    }
  }, Math.max(25, Math.floor(frameIntervalMs)));

  // Immediate recovery on tab visibility change
  const handleVisibilityChange = () => {
    if (!isRunning) return;
    // Wake up video decoding if paused by browser
    screenVideo.play().catch(() => {});
    if (cameraVideo) {
      cameraVideo.play().catch(() => {});
    }
    drawFrame(performance.now());
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Capture canvas media stream
  const compositeStream = canvas.captureStream(targetFps);

  return {
    canvas,
    stream: compositeStream,
    updatePipConfig: (newConfig: PipConfig) => {
      pipConfig = { ...newConfig };
      needsPipRecalc = true;
    },
    updateLayoutAndBackground: (layout: CompositionLayout, background?: RecorderBackgroundConfig) => {
      currentLayout = layout;
      if (background) {
        currentBackground = { ...background };
      }
      needsPipRecalc = true;
    },
    cleanup: () => {
      isRunning = false;

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(backupInterval);

      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }

      if (workerTimer) {
        try {
          workerTimer.postMessage('stop');
          workerTimer.terminate();
        } catch (_) {}
        workerTimer = null;
      }

      if (workerBlobUrl) {
        URL.revokeObjectURL(workerBlobUrl);
        workerBlobUrl = null;
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

      try {
        hiddenContainer.remove();
      } catch (_) {}

      // Stop canvas stream tracks
      compositeStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
    },
  };
}
