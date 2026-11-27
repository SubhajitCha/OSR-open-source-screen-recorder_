import { CompositionLayout, PipConfig, RecorderAspectRatio, RecorderBackgroundConfig, ResolutionPreset } from '../types';
import { calculatePipMetrics } from './pipCoordinates';
import { renderBackgroundToCanvas, DEFAULT_RECORDER_BACKGROUND } from './backgroundPresets';

export interface CompositorController {
  canvas: HTMLCanvasElement;
  stream: MediaStream;
  waitForFirstFrame: (timeoutMs?: number) => Promise<void>;
  updatePipConfig: (config: PipConfig) => void;
  updateLayoutAndBackground: (layout: CompositionLayout, background?: RecorderBackgroundConfig) => void;
  cleanup: () => void;
}

/**
 * Computes an aspect-ratio-preserved rectangle centered within (slotX, slotY, slotW, slotH).
 */
function fitRectToAspect(
  srcW: number,
  srcH: number,
  slotX: number,
  slotY: number,
  slotW: number,
  slotH: number
): { x: number; y: number; w: number; h: number } {
  const safeSrcW = srcW > 0 ? srcW : slotW;
  const safeSrcH = srcH > 0 ? srcH : slotH;
  const srcAspect = safeSrcW / (safeSrcH || 1);
  const slotAspect = slotW / (slotH || 1);

  let w = slotW;
  let h = slotH;
  if (srcAspect > slotAspect) {
    w = slotW;
    h = slotW / srcAspect;
  } else {
    h = slotH;
    w = slotH * srcAspect;
  }

  return {
    x: slotX + (slotW - w) / 2,
    y: slotY + (slotH - h) / 2,
    w,
    h,
  };
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

function getStageAspectValue(aspectRatio: RecorderAspectRatio): number | null {
  switch (aspectRatio) {
    case '9:16':
      return 9 / 16;
    case '1:1':
      return 1;
    case '4:5':
      return 4 / 5;
    case '4:3':
      return 4 / 3;
    case '16:9':
    default:
      return null;
  }
}

function computeTargetDimensions(
  srcW: number,
  srcH: number,
  resolution: ResolutionPreset,
  aspectRatio: RecorderAspectRatio = '16:9'
): { width: number; height: number } {
  const safeW = Math.max(2, srcW || 1920);
  const safeH = Math.max(2, srcH || 1080);
  let maxLongEdge = 1920;
  let maxShortEdge = 1080;

  if (resolution === '4k') {
    maxLongEdge = 3840;
    maxShortEdge = 2160;
  } else if (resolution === '1440p') {
    maxLongEdge = 2560;
    maxShortEdge = 1440;
  } else if (resolution === '720p') {
    maxLongEdge = 1280;
    maxShortEdge = 720;
  }

  const forcedAspect = getStageAspectValue(aspectRatio);
  if (forcedAspect !== null) {
    const targetH = forcedAspect < 1 ? maxLongEdge : maxShortEdge;
    const rawOutW = targetH * forcedAspect;
    const rawOutH = targetH;
    const clampScale = Math.min(1, maxLongEdge / Math.max(rawOutW, rawOutH));
    const width = Math.max(2, Math.floor((rawOutW * clampScale) / 2) * 2);
    const height = Math.max(2, Math.floor((rawOutH * clampScale) / 2) * 2);
    return { width, height };
  }

  const scale = Math.min(1, maxLongEdge / safeW, maxShortEdge / safeH);
  // Video codecs require even pixel dimensions
  const width = Math.max(2, Math.floor((safeW * scale) / 2) * 2);
  const height = Math.max(2, Math.floor((safeH * scale) / 2) * 2);
  return { width, height };
}

/**
 * Waits briefly for a live screen-capture MediaStream to decode its first frame so
 * true videoWidth/videoHeight dimensions are settled (critical on macOS Retina /
 * ScreenCaptureKit where track.getSettings() can initially lag behind or omit dimensions).
 * Resolves immediately when a frame is ready or falls back cleanly on timeout.
 */
export async function waitForScreenStreamDimensions(
  screenStream: MediaStream,
  timeoutMs: number = 450
): Promise<{ width: number; height: number } | null> {
  const videoTrack = screenStream.getVideoTracks()[0];
  if (!videoTrack || videoTrack.readyState !== 'live') {
    return null;
  }

  const readTrackDims = (): { width: number; height: number } | null => {
    try {
      const s = videoTrack.getSettings();
      if (s.width && s.height && s.width > 0 && s.height > 0) {
        return { width: s.width, height: s.height };
      }
    } catch (_) {}
    return null;
  };

  if (typeof document === 'undefined') {
    return readTrackDims();
  }

  return new Promise((resolve) => {
    let settled = false;
    let timerId: number | null = null;

    const probeContainer = document.createElement('div');
    probeContainer.style.position = 'fixed';
    probeContainer.style.top = '0';
    probeContainer.style.left = '0';
    probeContainer.style.width = '1px';
    probeContainer.style.height = '1px';
    probeContainer.style.opacity = '0.001';
    probeContainer.style.pointerEvents = 'none';
    probeContainer.style.zIndex = '-99999';
    probeContainer.style.overflow = 'hidden';
    probeContainer.setAttribute('aria-hidden', 'true');

    const probeVideo = document.createElement('video');
    probeVideo.muted = true;
    probeVideo.playsInline = true;
    probeVideo.autoplay = true;
    probeVideo.setAttribute('muted', '');
    probeVideo.setAttribute('playsinline', '');
    probeVideo.setAttribute('autoplay', '');
    probeContainer.appendChild(probeVideo);

    const finish = (dims: { width: number; height: number } | null) => {
      if (settled) return;
      settled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
      probeVideo.removeEventListener('loadeddata', checkReady);
      probeVideo.removeEventListener('canplay', checkReady);
      probeVideo.removeEventListener('playing', checkReady);
      probeVideo.removeEventListener('resize', checkReady);
      probeVideo.removeEventListener('loadedmetadata', checkReady);
      try {
        probeVideo.pause();
        probeVideo.srcObject = null;
        probeVideo.remove();
      } catch (_) {}
      try {
        probeContainer.remove();
      } catch (_) {}
      resolve(dims);
    };

    const checkReady = () => {
      if (probeVideo.readyState >= 2 && probeVideo.videoWidth > 0 && probeVideo.videoHeight > 0) {
        finish({ width: probeVideo.videoWidth, height: probeVideo.videoHeight });
      }
    };

    probeVideo.addEventListener('loadeddata', checkReady);
    probeVideo.addEventListener('canplay', checkReady);
    probeVideo.addEventListener('playing', checkReady);
    probeVideo.addEventListener('resize', checkReady);
    probeVideo.addEventListener('loadedmetadata', checkReady);

    if (document.body) {
      document.body.appendChild(probeContainer);
    }

    probeVideo.srcObject = screenStream;
    probeVideo.play().catch(() => {});
    checkReady();

    timerId = window.setTimeout(() => {
      if (probeVideo.videoWidth > 0 && probeVideo.videoHeight > 0) {
        finish({ width: probeVideo.videoWidth, height: probeVideo.videoHeight });
      } else {
        finish(readTrackDims());
      }
    }, timeoutMs);
  });
}

/**
 * High-Performance Resilient Stream Compositor
 * - Composites Screen + Camera + Background into a unified recording stream.
 * - Pre-renders backgrounds & static drop shadows onto an offscreen cache canvas
 *   so per-frame draws execute zero shadowBlur or gradient recomputations.
 * - Uses rAF in foreground and switches to Web Worker only when tab is hidden.
 */
export function createStreamCompositor(
  screenStream: MediaStream,
  cameraStream: MediaStream | null,
  initialPipConfig: PipConfig,
  targetFps: number = 30,
  initialLayout: CompositionLayout = 'framed',
  initialBackground?: RecorderBackgroundConfig,
  resolution: ResolutionPreset = 'native',
  aspectRatio: RecorderAspectRatio = '16:9',
  initialScreenDimensions?: { width: number; height: number } | null
): CompositorController {
  let isRunning = true;
  let pipConfig = { ...initialPipConfig };
  let currentLayout: CompositionLayout = initialLayout;
  let currentBackground: RecorderBackgroundConfig = initialBackground || DEFAULT_RECORDER_BACKGROUND;

  let animFrameId: number | null = null;
  let lastFrameTime = 0;
  const frameIntervalMs = 1000 / (targetFps || 30);
  let hasDrawnScreenFrame = false;

  // Determine fixed canvas dimensions once from settled screen dimensions before captureStream/MediaRecorder starts
  const cachedVideoTrack = screenStream.getVideoTracks()[0] || null;
  const initialTrackSettings = cachedVideoTrack?.getSettings();
  const initialRawWidth = initialScreenDimensions?.width || initialTrackSettings?.width || 1920;
  const initialRawHeight = initialScreenDimensions?.height || initialTrackSettings?.height || 1080;
  const initialScaled = computeTargetDimensions(initialRawWidth, initialRawHeight, resolution, aspectRatio);

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
  canvas.width = initialScaled.width;
  canvas.height = initialScaled.height;

  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
  });

  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
  }

  // Static offscreen cache for background + card drop shadows (eliminates per-frame shadowBlur & gradients)
  const bgCacheCanvas = document.createElement('canvas');
  bgCacheCanvas.width = canvas.width;
  bgCacheCanvas.height = canvas.height;
  const bgCacheCtx = bgCacheCanvas.getContext('2d', { alpha: false });
  let needsBgCacheRebuild = true;
  let hasScheduledPhotoRetry = false;
  let lastBgCacheKey = '';

  const getSplitGeometry = (width: number, height: number, srcW: number, srcH: number, hasCamera: boolean) => {
    if (hasCamera) {
      const slotX = width * 0.30;
      const slotW = width * 0.66;
      const slotH = height * 0.82;
      const slotY = (height - slotH) / 2;
      const scr = fitRectToAspect(srcW, srcH, slotX, slotY, slotW, slotH);

      const camW = width * 0.24;
      const camH = Math.min(height * 0.82, Math.max(camW * 1.15, scr.h));
      const camX = width * 0.04;
      const camY = (height - camH) / 2;
      return { scr, cam: { x: camX, y: camY, w: camW, h: camH } };
    }
    const scr = fitRectToAspect(
      srcW,
      srcH,
      width * 0.07,
      height * 0.07,
      width * 0.86,
      height * 0.86
    );
    return { scr, cam: null };
  };

  const getFramedGeometry = (width: number, height: number, srcW: number, srcH: number, layout: CompositionLayout) => {
    const marginRatio = layout === 'spaced-far' ? 0.15 : 0.07;
    const slotX = width * marginRatio;
    const slotY = height * marginRatio;
    const slotW = width * (1 - marginRatio * 2);
    const slotH = height * (1 - marginRatio * 2);
    return fitRectToAspect(srcW, srcH, slotX, slotY, slotW, slotH);
  };

  const rebuildStaticBgCache = (width: number, height: number, hasCamera: boolean, srcW: number, srcH: number) => {
    if (!bgCacheCtx) return;
    if (bgCacheCanvas.width !== width || bgCacheCanvas.height !== height) {
      bgCacheCanvas.width = width;
      bgCacheCanvas.height = height;
    }

    renderBackgroundToCanvas(bgCacheCtx, width, height, currentBackground.value);

    // If an image background is still asynchronously decoding, retry once shortly
    if (
      !hasScheduledPhotoRetry &&
      (currentBackground.type === 'image' || currentBackground.value?.startsWith('url('))
    ) {
      hasScheduledPhotoRetry = true;
      window.setTimeout(() => {
        if (isRunning) needsBgCacheRebuild = true;
      }, 450);
    }

    const scaleFactor = Math.min(width, height) / 1080;

    // Bake static card drop shadows into bgCacheCanvas so the 30/60fps loop never computes Gaussian shadowBlur
    if (currentLayout === 'split') {
      const { scr, cam } = getSplitGeometry(width, height, srcW, srcH, hasCamera);
      if (cam) {
        const camRadius = 20 * scaleFactor;
        bgCacheCtx.save();
        bgCacheCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        bgCacheCtx.shadowBlur = 24 * scaleFactor;
        bgCacheCtx.shadowOffsetY = 6 * scaleFactor;
        bgCacheCtx.fillStyle = '#090a0f';
        bgCacheCtx.beginPath();
        drawRoundedRectPath(bgCacheCtx, cam.x, cam.y, cam.w, cam.h, camRadius);
        bgCacheCtx.fill();
        bgCacheCtx.restore();
      }
      const scrRadius = 20 * scaleFactor;
      bgCacheCtx.save();
      bgCacheCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      bgCacheCtx.shadowBlur = 28 * scaleFactor;
      bgCacheCtx.shadowOffsetY = 8 * scaleFactor;
      bgCacheCtx.fillStyle = '#090a0f';
      bgCacheCtx.beginPath();
      drawRoundedRectPath(bgCacheCtx, scr.x, scr.y, scr.w, scr.h, scrRadius);
      bgCacheCtx.fill();
      bgCacheCtx.restore();
    } else if (currentLayout === 'framed' || currentLayout === 'spaced-far') {
      const scr = getFramedGeometry(width, height, srcW, srcH, currentLayout);
      const scrRadius = (currentLayout === 'spaced-far' ? 22 : 18) * scaleFactor;

      bgCacheCtx.save();
      bgCacheCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      bgCacheCtx.shadowBlur = (currentLayout === 'spaced-far' ? 36 : 32) * scaleFactor;
      bgCacheCtx.shadowOffsetY = 8 * scaleFactor;
      bgCacheCtx.fillStyle = '#090a0f';
      bgCacheCtx.beginPath();
      drawRoundedRectPath(bgCacheCtx, scr.x, scr.y, scr.w, scr.h, scrRadius);
      bgCacheCtx.fill();
      bgCacheCtx.restore();
    }

    lastBgCacheKey = `${currentLayout}:${width}x${height}:${srcW}x${srcH}:${hasCamera}`;
    needsBgCacheRebuild = false;
  };

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

    // Keep canvas.width and canvas.height locked after MediaRecorder starts so encoders
    // (such as macOS VideoToolbox H.264) never stretch resized frames into initial track geometry.
    // Live source aspect changes are fitted cleanly inside the locked canvas via fitRectToAspect.
    const width = canvas.width;
    const height = canvas.height;
    const srcW = screenVideo.videoWidth || initialRawWidth || 1920;
    const srcH = screenVideo.videoHeight || initialRawHeight || 1080;

    if (needsPipRecalc) {
      updatePipMetrics(width, height);
    }

    const isScreenReady =
      screenVideo.readyState >= 2 || (screenVideo.videoWidth > 0 && screenVideo.readyState >= 1);
    const isCameraReady =
      cameraVideo &&
      (cameraVideo.readyState >= 2 || (cameraVideo.videoWidth > 0 && cameraVideo.readyState >= 1));

    const hasCam = !!(isCameraReady && cameraVideo);
    const bgCacheKey = `${currentLayout}:${width}x${height}:${srcW}x${srcH}:${hasCam}`;
    if (needsBgCacheRebuild || bgCacheKey !== lastBgCacheKey) {
      rebuildStaticBgCache(width, height, hasCam, srcW, srcH);
    }

    const scaleFactor = Math.min(width, height) / 1080;

    if (currentLayout === 'split') {
      // -------------------------------------------------------------
      // LAYOUT 3: BESIDE (Aspect-fitted screen card + aligned camera)
      // -------------------------------------------------------------
      ctx.drawImage(bgCacheCanvas, 0, 0);

      const { scr, cam } = getSplitGeometry(width, height, srcW, srcH, hasCam);
      const radius = 20 * scaleFactor;

      if (cam && cameraVideo) {
        drawCameraOnCanvas(
          ctx,
          cameraVideo,
          cam.x,
          cam.y,
          cam.w,
          cam.h,
          radius,
          'rounded',
          pipConfig.mirror,
          2 * scaleFactor,
          'rgba(255, 255, 255, 0.25)'
        );
      }

      ctx.save();
      ctx.beginPath();
      drawRoundedRectPath(ctx, scr.x, scr.y, scr.w, scr.h, radius);
      ctx.clip();
      if (isScreenReady) {
        ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
        hasDrawnScreenFrame = true;
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2 * scaleFactor;
      ctx.beginPath();
      drawRoundedRectPath(ctx, scr.x, scr.y, scr.w, scr.h, radius);
      ctx.stroke();
      ctx.restore();
    } else if (currentLayout === 'corner-cam') {
      // -------------------------------------------------------------
      // LAYOUT: FLOATING CORNER / CORNER-CAM
      // -------------------------------------------------------------
      const scr = fitRectToAspect(srcW, srcH, 0, 0, width, height);
      const isLetterboxed = scr.x > 1 || scr.y > 1;
      if (isLetterboxed) {
        ctx.drawImage(bgCacheCanvas, 0, 0);
      }

      if (isScreenReady) {
        ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
        hasDrawnScreenFrame = true;
      } else if (!hasDrawnScreenFrame && !isLetterboxed) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

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
      // LAYOUT 2: FRAMED / SPACED-FAR (Aspect-fitted screen card)
      // -------------------------------------------------------------
      ctx.drawImage(bgCacheCanvas, 0, 0);

      const scr = getFramedGeometry(width, height, srcW, srcH, currentLayout);
      const scrRadius = (currentLayout === 'spaced-far' ? 22 : 18) * scaleFactor;

      ctx.save();
      ctx.beginPath();
      drawRoundedRectPath(ctx, scr.x, scr.y, scr.w, scr.h, scrRadius);
      ctx.clip();
      if (isScreenReady) {
        ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
        hasDrawnScreenFrame = true;
      } else if (isCameraReady && cameraVideo && !screenStream) {
        ctx.drawImage(cameraVideo, scr.x, scr.y, scr.w, scr.h);
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2 * scaleFactor;
      ctx.beginPath();
      drawRoundedRectPath(ctx, scr.x, scr.y, scr.w, scr.h, scrRadius);
      ctx.stroke();
      ctx.restore();

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
      // LAYOUT 1: OVERLAY / END-TO-END (Full capture, aspect-safe)
      // -------------------------------------------------------------
      const scr = fitRectToAspect(srcW, srcH, 0, 0, width, height);
      const isLetterboxed = scr.x > 1 || scr.y > 1;
      if (isLetterboxed) {
        ctx.drawImage(bgCacheCanvas, 0, 0);
      }

      if (isScreenReady) {
        ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
        hasDrawnScreenFrame = true;
      } else if (isCameraReady && cameraVideo && !screenStream) {
        ctx.drawImage(cameraVideo, 0, 0, width, height);
      } else if (!hasDrawnScreenFrame && !isLetterboxed) {
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

  const triggerImmediateRedraw = () => {
    if (!isRunning) return;
    drawFrame(performance.now());
  };

  screenVideo.addEventListener('loadeddata', triggerImmediateRedraw);
  screenVideo.addEventListener('canplay', triggerImmediateRedraw);
  screenVideo.addEventListener('playing', triggerImmediateRedraw);
  screenVideo.play().catch(() => {});

  if (cameraVideo) {
    cameraVideo.addEventListener('loadeddata', triggerImmediateRedraw);
    cameraVideo.addEventListener('playing', triggerImmediateRedraw);
    cameraVideo.play().catch(() => {});
  }

  // Draw initial frame immediately to initialize canvas stream buffer
  drawFrame(performance.now());

  // Start foreground requestAnimationFrame loop
  animFrameId = requestAnimationFrame(renderLoop);

  const waitForFirstFrame = (timeoutMs: number = 350): Promise<void> => {
    const isMainReady = () =>
      (screenVideo.readyState >= 2 && screenVideo.videoWidth > 0) ||
      hasDrawnScreenFrame ||
      (!!cameraVideo && cameraVideo.readyState >= 2 && cameraVideo.videoWidth > 0 && !screenStream);

    if (!isRunning || isMainReady()) {
      drawFrame(performance.now());
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;
      let timerId: number | null = null;

      const done = () => {
        if (settled) return;
        settled = true;
        if (timerId !== null) {
          window.clearTimeout(timerId);
          timerId = null;
        }
        screenVideo.removeEventListener('loadeddata', check);
        screenVideo.removeEventListener('canplay', check);
        screenVideo.removeEventListener('playing', check);
        if (cameraVideo) {
          cameraVideo.removeEventListener('loadeddata', check);
          cameraVideo.removeEventListener('playing', check);
        }
        if (isRunning) {
          drawFrame(performance.now());
        }
        resolve();
      };

      const check = () => {
        if (!isRunning || isMainReady()) {
          done();
        }
      };

      screenVideo.addEventListener('loadeddata', check);
      screenVideo.addEventListener('canplay', check);
      screenVideo.addEventListener('playing', check);
      if (cameraVideo) {
        cameraVideo.addEventListener('loadeddata', check);
        cameraVideo.addEventListener('playing', check);
      }

      timerId = window.setTimeout(done, timeoutMs);
    });
  };

  // Background Web Worker Heartbeat Timer (engaged ONLY when tab is hidden)
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
            }, ${Math.max(33, Math.floor(frameIntervalMs))});
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
      if (!isRunning || !document.hidden) return;
      drawFrame(performance.now());
    };

    if (document.hidden) {
      workerTimer.postMessage('start');
    }
  } catch (err) {
    console.warn('Compositor Web Worker timer fallback engaged:', err);
  }

  // Switch between zero-IPC rAF (foreground) and Worker ticks (background tab)
  const handleVisibilityChange = () => {
    if (!isRunning) return;
    screenVideo.play().catch(() => {});
    if (cameraVideo) {
      cameraVideo.play().catch(() => {});
    }
    if (workerTimer) {
      try {
        workerTimer.postMessage(document.hidden ? 'start' : 'stop');
      } catch (_) {}
    }
    drawFrame(performance.now());
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Capture canvas media stream
  const compositeStream = canvas.captureStream(targetFps);

  return {
    canvas,
    stream: compositeStream,
    waitForFirstFrame,
    updatePipConfig: (newConfig: PipConfig) => {
      pipConfig = { ...newConfig };
      needsPipRecalc = true;
    },
    updateLayoutAndBackground: (layout: CompositionLayout, background?: RecorderBackgroundConfig) => {
      currentLayout = layout;
      if (background) {
        currentBackground = { ...background };
        hasScheduledPhotoRetry = false;
      }
      needsPipRecalc = true;
      needsBgCacheRebuild = true;
    },
    cleanup: () => {
      isRunning = false;

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      screenVideo.removeEventListener('loadeddata', triggerImmediateRedraw);
      screenVideo.removeEventListener('canplay', triggerImmediateRedraw);
      screenVideo.removeEventListener('playing', triggerImmediateRedraw);
      if (cameraVideo) {
        cameraVideo.removeEventListener('loadeddata', triggerImmediateRedraw);
        cameraVideo.removeEventListener('playing', triggerImmediateRedraw);
      }

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
