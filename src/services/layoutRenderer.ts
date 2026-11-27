import { AppearanceSettings, CompositionLayout, PipConfig, Project, RecordingMetadata, ZoomSegment } from '../types';
import { computeZoomTransformAtTime, applyVirtualCameraTransform } from './zoomEngine';
import { drawClickEffects, drawSyntheticCursor, interpolateCursorPosition } from './cursorEngine';
import { renderBackgroundToCanvas, DEFAULT_BACKGROUND_VALUE } from './backgroundPresets';
import { calculatePipMetrics } from './pipCoordinates';

export interface DrawSceneOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  screenVideo: HTMLVideoElement;
  camVideo?: HTMLVideoElement | null;
  currentTime: number;
  project: Project;
  zoomSegments: ZoomSegment[];
  metadata: RecordingMetadata;
  selectedZoomId?: string | null;
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
 * Universal rounded rectangle path helper ensuring identical rendering on all browsers
 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
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
 * Draw camera video onto canvas with aspect-fill, mirror, shape clipping, and border.
 */
function drawCameraOnCanvas(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  shape: string,
  mirror: boolean,
  borderWidth: number,
  borderColor: string
): void {
  ctx.save();
  ctx.beginPath();
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2;
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  } else if (shape === 'squircle') {
    const r = Math.min(w, h) * 0.28;
    drawRoundedRectPath(ctx, x, y, w, h, r);
  } else if (radius > 0) {
    drawRoundedRectPath(ctx, x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.closePath();
  ctx.clip();

  if (video && video.readyState >= 1 && video.videoWidth > 0) {
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
  } else {
    // Styled presenter placeholder
    ctx.fillStyle = '#18181b';
    ctx.fillRect(x, y, w, h);

    // Presenter Icon
    ctx.fillStyle = '#bef264';
    const iconSize = Math.max(16, Math.min(36, w * 0.22));
    ctx.font = `${iconSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👤', x + w / 2, y + h / 2 - 8);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = `600 ${Math.max(9, Math.round(11 * (w / 200)))}px sans-serif`;
    ctx.fillText('Presenter', x + w / 2, y + h / 2 + 14);
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
    } else if (shape === 'squircle') {
      const r = Math.min(w, h) * 0.28;
      drawRoundedRectPath(
        ctx,
        x + half,
        y + half,
        Math.max(1, w - borderWidth),
        Math.max(1, h - borderWidth),
        Math.max(0, r - half)
      );
    } else if (radius > 0) {
      drawRoundedRectPath(
        ctx,
        x + half,
        y + half,
        Math.max(1, w - borderWidth),
        Math.max(1, h - borderWidth),
        Math.max(0, radius - half)
      );
    } else {
      ctx.strokeRect(x + half, y + half, Math.max(1, w - borderWidth), Math.max(1, h - borderWidth));
    }
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Universal Stage Layout Renderer
 * Ensures exact 1:1 mathematical, sizing, and placement synchronization
 * with streamCompositor (Recording Screen).
 */
export function drawCompositionScene({
  ctx,
  width,
  height,
  screenVideo,
  camVideo,
  currentTime,
  project,
  zoomSegments,
  metadata,
  selectedZoomId,
}: DrawSceneOptions): void {
  const { appearance } = project;
  const {
    background,
    showCursor = false,
    cursorScale = 1.0,
    cursorStyle = 'macos',
    clickEffect = 'ripple',
    layout = 'framed',
    cameraPosition = 'bottom-right',
    cameraSize = 25,
    cameraShape = 'rounded',
    cameraHidden = false,
  } = appearance;

  const scaleFactor = Math.min(width, height) / 1080;
  const bgValue =
    typeof background === 'string' && background.length > 0
      ? background
      : DEFAULT_BACKGROUND_VALUE;
  const srcScreenW = screenVideo.videoWidth || project.source.width || 1920;
  const srcScreenH = screenVideo.videoHeight || project.source.height || 1080;

  // Compute Active Zoom Transform
  const zoom = computeZoomTransformAtTime(currentTime, zoomSegments, 0.45, appearance);

  // Setup Unified PiP Config matching streamCompositor
  const pipConfig: PipConfig = {
    enabled: !cameraHidden,
    position: cameraPosition || 'bottom-right',
    shape: cameraShape || (layout === 'corner-cam' ? 'rounded' : 'rectangle'),
    size: cameraSize ? (cameraSize <= 18 ? 'small' : cameraSize >= 32 ? 'large' : 'medium') : 'medium',
    mirror: true,
    borderWidth: Math.max(2, Math.round(3 * scaleFactor)),
    borderColor: layout === 'corner-cam' ? 'rgba(255, 255, 255, 0.35)' : '#38bdf8',
  };

  const isCameraPresent = !cameraHidden && (Boolean(camVideo) || layout === 'split' || layout === 'corner-cam');

  // -------------------------------------------------------------
  // LAYOUT 1: BESIDE ('split')
  // Camera sits beside the screen with visible background & true screen aspect ratio
  // -------------------------------------------------------------
  if (layout === 'split') {
    ctx.clearRect(0, 0, width, height);
    renderBackgroundToCanvas(ctx, width, height, bgValue);

    if (isCameraPresent) {
      // Right Column Screen Slot (66% width, max 82% height, 30% left offset), fitted cleanly to screen aspect
      const slotX = width * 0.30;
      const slotW = width * 0.66;
      const slotH = height * 0.82;
      const slotY = (height - slotH) / 2;
      const fittedScr = fitRectToAspect(srcScreenW, srcScreenH, slotX, slotY, slotW, slotH);
      const scrX = fittedScr.x;
      const scrY = fittedScr.y;
      const scrW = fittedScr.w;
      const scrH = fittedScr.h;
      const scrRadius = 20 * scaleFactor;

      // Left Column: Camera Presenter Card (24% width, top/bottom aligned with screen card)
      const camW = width * 0.24;
      const camH = Math.min(height * 0.82, Math.max(camW * 1.15, scrH));
      const camX = width * 0.04;
      const camY = (height - camH) / 2;
      const camRadius = 20 * scaleFactor;

      // Soft Drop Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 24 * scaleFactor;
      ctx.shadowOffsetY = 6 * scaleFactor;
      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      drawRoundedRectPath(ctx, camX, camY, camW, camH, camRadius);
      ctx.fill();
      ctx.restore();

      // Camera Drawing
      drawCameraOnCanvas(
        ctx,
        camVideo || null,
        camX,
        camY,
        camW,
        camH,
        camRadius,
        'rounded',
        true,
        2 * scaleFactor,
        'rgba(255, 255, 255, 0.25)'
      );

      // Screen Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 28 * scaleFactor;
      ctx.shadowOffsetY = 8 * scaleFactor;
      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
      ctx.fill();
      ctx.restore();

      // Clip & Draw Screen with Virtual Camera
      ctx.save();
      ctx.beginPath();
      drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
      ctx.clip();

      ctx.save();
      applyVirtualCameraTransform(ctx, scrX, scrY, scrW, scrH, zoom);

      try {
        if (zoom.isTransitioning && zoom.motionBlurEnabled && zoom.motionBlurPx > 0.2) {
          const blurAmount = Math.min(18, Math.max(0.6, zoom.motionBlurPx * scaleFactor)).toFixed(1);
          ctx.save();
          ctx.filter = `blur(${blurAmount}px)`;
          ctx.globalAlpha = 0.58;
          ctx.drawImage(screenVideo, scrX, scrY, scrW, scrH);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.drawImage(screenVideo, scrX, scrY, scrW, scrH);
          ctx.restore();
        } else {
          ctx.drawImage(screenVideo, scrX, scrY, scrW, scrH);
        }
      } catch (_) {}

      // Clicks & Cursor
      if (metadata.clicks && metadata.clicks.length > 0) {
        drawClickEffects(ctx, metadata.clicks, currentTime, scrW, scrH, clickEffect, 0.6, scrX, scrY);
      }
      if (showCursor && metadata.cursor && metadata.cursor.length > 0) {
        const cur = interpolateCursorPosition(metadata.cursor, currentTime, appearance.cursorOffsetMs || 0);
        if (cur.visible) {
          const curScreenX = scrX + cur.x * scrW;
          const curScreenY = scrY + cur.y * scrH;
          const cursorZoomScale = Math.max(0.75, (cursorScale * scaleFactor) / Math.pow(zoom.scale, 0.3));
          drawSyntheticCursor(ctx, curScreenX, curScreenY, cursorZoomScale, cursorStyle);
        }
      }

      if (selectedZoomId) {
        drawZoomCrosshair(ctx, selectedZoomId, zoomSegments, scrX, scrY, scrW, scrH);
      }

      ctx.restore(); // virtual camera
      ctx.restore(); // screen clip

      // Screen Border
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2 * scaleFactor;
      ctx.beginPath();
      drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
      ctx.stroke();
      ctx.restore();
    } else {
      // Clean fallback if camera is inactive: Center screen cleanly retaining aspect ratio
      const fittedScr = fitRectToAspect(
        srcScreenW,
        srcScreenH,
        width * 0.07,
        height * 0.07,
        width * 0.86,
        height * 0.86
      );
      const scrX = fittedScr.x;
      const scrY = fittedScr.y;
      const scrW = fittedScr.w;
      const scrH = fittedScr.h;
      const scrRadius = 20 * scaleFactor;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 28 * scaleFactor;
      ctx.shadowOffsetY = 8 * scaleFactor;
      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      drawRoundedRectPath(ctx, scrX, scrY, scrW, scrH, scrRadius);
      ctx.clip();

      ctx.save();
      applyVirtualCameraTransform(ctx, scrX, scrY, scrW, scrH, zoom);
      ctx.drawImage(screenVideo, scrX, scrY, scrW, scrH);

      if (metadata.clicks && metadata.clicks.length > 0) {
        drawClickEffects(ctx, metadata.clicks, currentTime, scrW, scrH, clickEffect, 0.6, scrX, scrY);
      }
      if (showCursor && metadata.cursor && metadata.cursor.length > 0) {
        const cur = interpolateCursorPosition(metadata.cursor, currentTime, appearance.cursorOffsetMs || 0);
        if (cur.visible) {
          const curScreenX = scrX + cur.x * scrW;
          const curScreenY = scrY + cur.y * scrH;
          const cursorZoomScale = Math.max(0.75, (cursorScale * scaleFactor) / Math.pow(zoom.scale, 0.3));
          drawSyntheticCursor(ctx, curScreenX, curScreenY, cursorZoomScale, cursorStyle);
        }
      }
      ctx.restore();
      ctx.restore();
    }
    return;
  }

  // -------------------------------------------------------------
  // LAYOUT 2: SPACING AROUND ('framed' / 'spaced-far')
  // Screen is framed with space around it, visible background, corner camera
  // -------------------------------------------------------------
  if (layout === 'framed' || layout === 'spaced-far') {
    ctx.clearRect(0, 0, width, height);
    renderBackgroundToCanvas(ctx, width, height, bgValue);

    const marginRatio = layout === 'spaced-far' ? 0.15 : 0.07;
    const fittedScr = fitRectToAspect(
      srcScreenW,
      srcScreenH,
      width * marginRatio,
      height * marginRatio,
      width * (1 - marginRatio * 2),
      height * (1 - marginRatio * 2)
    );
    const padX = fittedScr.x;
    const padY = fittedScr.y;
    const scrW = fittedScr.w;
    const scrH = fittedScr.h;
    const scrRadius = (layout === 'spaced-far' ? 22 : 18) * scaleFactor;

    // Soft drop shadow behind screen
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = (layout === 'spaced-far' ? 36 : 32) * scaleFactor;
    ctx.shadowOffsetY = 8 * scaleFactor;
    ctx.fillStyle = '#090a0f';
    ctx.beginPath();
    drawRoundedRectPath(ctx, padX, padY, scrW, scrH, scrRadius);
    ctx.fill();
    ctx.restore();

    // Clip & Draw Screen
    ctx.save();
    ctx.beginPath();
    drawRoundedRectPath(ctx, padX, padY, scrW, scrH, scrRadius);
    ctx.clip();

    ctx.save();
    applyVirtualCameraTransform(ctx, padX, padY, scrW, scrH, zoom);

    try {
      if (zoom.isTransitioning && zoom.motionBlurEnabled && zoom.motionBlurPx > 0.2) {
        const blurAmount = Math.min(18, Math.max(0.6, zoom.motionBlurPx * scaleFactor)).toFixed(1);
        ctx.save();
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.globalAlpha = 0.58;
        ctx.drawImage(screenVideo, padX, padY, scrW, scrH);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(screenVideo, padX, padY, scrW, scrH);
        ctx.restore();
      } else {
        ctx.drawImage(screenVideo, padX, padY, scrW, scrH);
      }
    } catch (_) {}

    if (metadata.clicks && metadata.clicks.length > 0) {
      drawClickEffects(ctx, metadata.clicks, currentTime, scrW, scrH, clickEffect, 0.6, padX, padY);
    }
    if (showCursor && metadata.cursor && metadata.cursor.length > 0) {
      const cur = interpolateCursorPosition(metadata.cursor, currentTime, appearance.cursorOffsetMs || 0);
      if (cur.visible) {
        const curScreenX = padX + cur.x * scrW;
        const curScreenY = padY + cur.y * scrH;
        const cursorZoomScale = Math.max(0.75, (cursorScale * scaleFactor) / Math.pow(zoom.scale, 0.3));
        drawSyntheticCursor(ctx, curScreenX, curScreenY, cursorZoomScale, cursorStyle);
      }
    }

    if (selectedZoomId) {
      drawZoomCrosshair(ctx, selectedZoomId, zoomSegments, padX, padY, scrW, scrH);
    }

    ctx.restore(); // virtual camera
    ctx.restore(); // screen clip

    // Thin crisp border
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2 * scaleFactor;
    ctx.beginPath();
    drawRoundedRectPath(ctx, padX, padY, scrW, scrH, scrRadius);
    ctx.stroke();
    ctx.restore();

    // Corner Camera Bubble (3.5% margin matching recorder)
    if (!cameraHidden && (camVideo || project.source.camBlob)) {
      const pipMetrics = calculatePipMetrics(pipConfig, width, height, 'framed');

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 24 * scaleFactor;
      ctx.shadowOffsetY = 6 * scaleFactor;
      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      drawRoundedRectPath(ctx, pipMetrics.x, pipMetrics.y, pipMetrics.width, pipMetrics.height, pipMetrics.radiusPx);
      ctx.fill();
      ctx.restore();

      drawCameraOnCanvas(
        ctx,
        camVideo || null,
        pipMetrics.x,
        pipMetrics.y,
        pipMetrics.width,
        pipMetrics.height,
        pipMetrics.radiusPx,
        pipMetrics.shape,
        pipConfig.mirror,
        pipMetrics.borderWidth,
        pipMetrics.borderColor
      );
    }
    return;
  }

  // -------------------------------------------------------------
  // LAYOUT 3: FLOATING CORNER ('corner-cam')
  // Full screen capture (aspect-safe) with floating camera (2.5% margin)
  // -------------------------------------------------------------
  if (layout === 'corner-cam') {
    const scr = fitRectToAspect(srcScreenW, srcScreenH, 0, 0, width, height);
    const isLetterboxed = scr.x > 1 || scr.y > 1;
    ctx.clearRect(0, 0, width, height);
    if (isLetterboxed) {
      renderBackgroundToCanvas(ctx, width, height, bgValue);
    }

    // Screen capture (clipped to fitted frame)
    ctx.save();
    if (isLetterboxed) {
      ctx.beginPath();
      ctx.rect(scr.x, scr.y, scr.w, scr.h);
      ctx.clip();
    }
    applyVirtualCameraTransform(ctx, scr.x, scr.y, scr.w, scr.h, zoom);

    try {
      if (zoom.isTransitioning && zoom.motionBlurEnabled && zoom.motionBlurPx > 0.2) {
        const blurAmount = Math.min(18, Math.max(0.6, zoom.motionBlurPx * scaleFactor)).toFixed(1);
        ctx.save();
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.globalAlpha = 0.58;
        ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
        ctx.restore();
      } else {
        ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
      }
    } catch (_) {}

    if (metadata.clicks && metadata.clicks.length > 0) {
      drawClickEffects(ctx, metadata.clicks, currentTime, scr.w, scr.h, clickEffect, 0.6, scr.x, scr.y);
    }
    if (showCursor && metadata.cursor && metadata.cursor.length > 0) {
      const cur = interpolateCursorPosition(metadata.cursor, currentTime, appearance.cursorOffsetMs || 0);
      if (cur.visible) {
        const curScreenX = scr.x + cur.x * scr.w;
        const curScreenY = scr.y + cur.y * scr.h;
        const cursorZoomScale = Math.max(0.75, (cursorScale * scaleFactor) / Math.pow(zoom.scale, 0.3));
        drawSyntheticCursor(ctx, curScreenX, curScreenY, cursorZoomScale, cursorStyle);
      }
    }

    if (selectedZoomId) {
      drawZoomCrosshair(ctx, selectedZoomId, zoomSegments, scr.x, scr.y, scr.w, scr.h);
    }

    ctx.restore(); // virtual camera

    // Floating Camera Card
    if (!cameraHidden && (camVideo || project.source.camBlob || layout === 'corner-cam')) {
      const pipMetrics = calculatePipMetrics(pipConfig, width, height, 'corner-cam');

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 24 * scaleFactor;
      ctx.shadowOffsetY = 6 * scaleFactor;
      ctx.fillStyle = '#090a0f';
      ctx.beginPath();
      drawRoundedRectPath(ctx, pipMetrics.x, pipMetrics.y, pipMetrics.width, pipMetrics.height, pipMetrics.radiusPx);
      ctx.fill();
      ctx.restore();

      drawCameraOnCanvas(
        ctx,
        camVideo || null,
        pipMetrics.x,
        pipMetrics.y,
        pipMetrics.width,
        pipMetrics.height,
        pipMetrics.radiusPx,
        pipConfig.shape || 'rounded',
        pipConfig.mirror,
        pipMetrics.borderWidth,
        pipMetrics.borderColor
      );
    }
    return;
  }

  // -------------------------------------------------------------
  // LAYOUT 4: END TO END ('overlay')
  // Full screen capture (aspect-safe) with corner camera flush on edge (0 margin)
  // -------------------------------------------------------------
  const scr = fitRectToAspect(srcScreenW, srcScreenH, 0, 0, width, height);
  const isLetterboxed = scr.x > 1 || scr.y > 1;
  ctx.clearRect(0, 0, width, height);
  if (isLetterboxed) {
    renderBackgroundToCanvas(ctx, width, height, bgValue);
  }

  ctx.save();
  if (isLetterboxed) {
    ctx.beginPath();
    ctx.rect(scr.x, scr.y, scr.w, scr.h);
    ctx.clip();
  }
  applyVirtualCameraTransform(ctx, scr.x, scr.y, scr.w, scr.h, zoom);

  try {
    if (zoom.isTransitioning && zoom.motionBlurEnabled && zoom.motionBlurPx > 0.2) {
      const blurAmount = Math.min(18, Math.max(0.6, zoom.motionBlurPx * scaleFactor)).toFixed(1);
      ctx.save();
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.globalAlpha = 0.58;
      ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
      ctx.restore();
    } else {
      ctx.drawImage(screenVideo, scr.x, scr.y, scr.w, scr.h);
    }
  } catch (_) {}

  if (metadata.clicks && metadata.clicks.length > 0) {
    drawClickEffects(ctx, metadata.clicks, currentTime, scr.w, scr.h, clickEffect, 0.6, scr.x, scr.y);
  }
  if (showCursor && metadata.cursor && metadata.cursor.length > 0) {
    const cur = interpolateCursorPosition(metadata.cursor, currentTime, appearance.cursorOffsetMs || 0);
    if (cur.visible) {
      const curScreenX = scr.x + cur.x * scr.w;
      const curScreenY = scr.y + cur.y * scr.h;
      const cursorZoomScale = Math.max(0.75, (cursorScale * scaleFactor) / Math.pow(zoom.scale, 0.3));
      drawSyntheticCursor(ctx, curScreenX, curScreenY, cursorZoomScale, cursorStyle);
    }
  }

  if (selectedZoomId) {
    drawZoomCrosshair(ctx, selectedZoomId, zoomSegments, scr.x, scr.y, scr.w, scr.h);
  }

  ctx.restore(); // virtual camera

  // Camera Box Flush on Corner Edge
  if (!cameraHidden && (camVideo || project.source.camBlob)) {
    const pipMetrics = calculatePipMetrics(pipConfig, width, height, 'overlay');

    drawCameraOnCanvas(
      ctx,
      camVideo || null,
      pipMetrics.x,
      pipMetrics.y,
      pipMetrics.width,
      pipMetrics.height,
      pipMetrics.radiusPx,
      pipConfig.shape || 'rectangle',
      pipConfig.mirror,
      pipMetrics.borderWidth,
      pipMetrics.borderColor
    );
  }
}

function drawZoomCrosshair(
  ctx: CanvasRenderingContext2D,
  selectedZoomId: string,
  zoomSegments: ZoomSegment[],
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number
): void {
  const selectedSeg = zoomSegments.find((s) => s.id === selectedZoomId);
  if (!selectedSeg) return;

  const targetScreenX = drawX + selectedSeg.targetX * drawW;
  const targetScreenY = drawY + selectedSeg.targetY * drawH;

  ctx.save();
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 4]);

  // Crosshair circle
  ctx.beginPath();
  ctx.arc(targetScreenX, targetScreenY, 18, 0, Math.PI * 2);
  ctx.stroke();

  // Cross lines
  ctx.beginPath();
  ctx.moveTo(targetScreenX - 26, targetScreenY);
  ctx.lineTo(targetScreenX + 26, targetScreenY);
  ctx.moveTo(targetScreenX, targetScreenY - 26);
  ctx.lineTo(targetScreenX, targetScreenY + 26);
  ctx.stroke();

  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(
    `Zoom Target (${Math.round(selectedSeg.targetX * 100)}%, ${Math.round(selectedSeg.targetY * 100)}%)`,
    targetScreenX + 22,
    targetScreenY + 4
  );
  ctx.restore();
}
