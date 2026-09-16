import { Project } from '../types';
import { extractCutSegments, extractZoomSegments } from './editorEngine';
import { computeZoomTransformAtTime, applyVirtualCameraTransform } from './zoomEngine';
import { drawClickEffects, drawSyntheticCursor, interpolateCursorPosition } from './cursorEngine';
import { fixWebmDuration } from './webmDurationFixer';
import { renderBackgroundToCanvas } from './backgroundPresets';

export interface ExportProgress {
  progress: number; // 0 to 100
  renderedSeconds: number;
  totalSeconds: number;
  stage: 'preparing' | 'rendering' | 'finalizing' | 'done' | 'error';
  errorMessage?: string;
}

export interface ExportOptions {
  resolutionPreset: 'native' | '4k' | '1080p' | '720p';
  fps: number;
  bitrateMbps: number;
  format: 'webm' | 'mp4';
}

export async function renderProjectToVideo(
  project: Project,
  options: ExportOptions,
  onProgress: (prog: ExportProgress) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress({
        progress: 0,
        renderedSeconds: 0,
        totalSeconds: project.source.duration,
        stage: 'preparing',
      });

      // 1. Create source video element
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(project.source.videoBlob);
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('Failed to load video source for export'));
      });

      const srcWidth = video.videoWidth || project.source.width || 1920;
      const srcHeight = video.videoHeight || project.source.height || 1080;

      // 2. Determine target canvas dimensions
      let outWidth = srcWidth;
      let outHeight = srcHeight;

      if (options.resolutionPreset === '1080p') {
        outWidth = 1920;
        outHeight = 1080;
      } else if (options.resolutionPreset === '4k') {
        outWidth = 3840;
        outHeight = 2160;
      } else if (options.resolutionPreset === '720p') {
        outWidth = 1280;
        outHeight = 720;
      }

      // Aspect ratio adjustments
      const ar = project.appearance.aspectRatio;
      if (ar === '9:16') {
        outWidth = Math.round((outHeight * 9) / 16);
      } else if (ar === '1:1') {
        outWidth = outHeight;
      } else if (ar === '4:3') {
        outWidth = Math.round((outHeight * 4) / 3);
      }

      // 3. Setup canvas & 2D context
      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Canvas 2D context creation failed');
      }

      // 4. Setup MediaStream and MediaRecorder from Canvas
      const fps = options.fps || 60;
      const canvasStream = canvas.captureStream(fps);

      // Extract original audio track if present
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioSource = audioCtx.createMediaElementSource(video);
      const audioDest = audioCtx.createMediaStreamDestination();
      audioSource.connect(audioDest);

      const audioTracks = audioDest.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]);
      }

      const mimeType =
        options.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')
          ? 'video/mp4;codecs=avc1,mp4a.40.2'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: (options.bitrateMbps || 12) * 1000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const zoomSegments = extractZoomSegments(project.timeline);
      const cutSegments = extractCutSegments(project.timeline);
      const metadata = project.metadata || { cursor: [], clicks: [], keyboard: [], bookmarks: [] };

      const trimStart = project.source.trimStart ?? 0;
      const trimEnd = project.source.trimEnd ?? project.source.duration;

      // Calculate effective exported duration (excluding cuts & trimmed areas)
      let effectiveDuration = Math.max(0.5, trimEnd - trimStart);
      cutSegments.forEach((cut) => {
        if (cut.end > trimStart && cut.start < trimEnd) {
          const overlapStart = Math.max(trimStart, cut.start);
          const overlapEnd = Math.min(trimEnd, cut.end);
          effectiveDuration -= Math.max(0, overlapEnd - overlapStart);
        }
      });
      effectiveDuration = Math.max(1, effectiveDuration);

      recorder.start(500);

      onProgress({
        progress: 5,
        renderedSeconds: 0,
        totalSeconds: effectiveDuration,
        stage: 'rendering',
      });

      // Play video through rendering loop from trimStart
      video.currentTime = trimStart;
      video.playbackRate = 1.0;
      await video.play();

      let isCancelled = false;
      let renderedDuration = 0;
      let lastCheckTime = performance.now();

      const renderFrame = () => {
        if (isCancelled) return;

        let currentTime = video.currentTime;

        // Check if current time falls in a cut
        for (const cut of cutSegments) {
          if (currentTime >= cut.start && currentTime < cut.end) {
            video.currentTime = cut.end + 0.05;
            currentTime = video.currentTime;
            break;
          }
        }

        if (video.ended || currentTime >= trimEnd - 0.05) {
          finishExport();
          return;
        }

        // Draw Frame
        drawExportFrame(ctx, video, currentTime, outWidth, outHeight, project, zoomSegments, metadata);

        // Progress notification
        const now = performance.now();
        if (now - lastCheckTime > 250) {
          lastCheckTime = now;
          const prog = Math.min(95, Math.round((currentTime / project.source.duration) * 90) + 5);
          onProgress({
            progress: prog,
            renderedSeconds: Math.round(currentTime),
            totalSeconds: Math.round(project.source.duration),
            stage: 'rendering',
          });
        }

        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);

      const finishExport = async () => {
        isCancelled = true;
        video.pause();

        onProgress({
          progress: 96,
          renderedSeconds: Math.round(effectiveDuration),
          totalSeconds: Math.round(effectiveDuration),
          stage: 'finalizing',
        });

        recorder.onstop = async () => {
          URL.revokeObjectURL(videoUrl);
          audioCtx.close().catch(() => {});

          let finalBlob = new Blob(chunks, { type: mimeType });
          try {
            finalBlob = await fixWebmDuration(finalBlob, effectiveDuration * 1000);
          } catch {
            // ignore
          }

          onProgress({
            progress: 100,
            renderedSeconds: Math.round(effectiveDuration),
            totalSeconds: Math.round(effectiveDuration),
            stage: 'done',
          });

          resolve(finalBlob);
        };

        try {
          recorder.stop();
        } catch {
          const finalBlob = new Blob(chunks, { type: mimeType });
          resolve(finalBlob);
        }
      };
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Export rendering failed';
      onProgress({
        progress: 0,
        renderedSeconds: 0,
        totalSeconds: 0,
        stage: 'error',
        errorMessage: msg,
      });
      reject(err);
    }
  });
}

function drawExportFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number,
  project: Project,
  zoomSegments: import('../types').ZoomSegment[],
  metadata: import('../types').RecordingMetadata
): void {
  const { background, padding, borderRadius, shadow, showCursor, cursorScale, cursorStyle, clickEffect } =
    project.appearance;

  // 1. Draw Background (Supports all Apple presets, grain textures, and gradients)
  renderBackgroundToCanvas(ctx, canvasWidth, canvasHeight, background);

  // 2. Calculate Video Inner Box with Padding
  const scaleFactor = canvasWidth / 1920;
  const padX = padding * scaleFactor;
  const padY = padding * scaleFactor * (canvasHeight / canvasWidth > 0.6 ? 1 : 0.8);
  const videoBoxW = canvasWidth - padX * 2;
  const videoBoxH = canvasHeight - padY * 2;
  const videoBoxX = padX;
  const videoBoxY = padY;

  // Preserve Source Video Intrinsic Aspect Ratio
  const vidW = video.videoWidth || project.source.width || 1920;
  const vidH = video.videoHeight || project.source.height || 1080;
  const vidRatio = vidW / vidH;
  const boxRatio = videoBoxW / videoBoxH;

  let drawW = videoBoxW;
  let drawH = videoBoxH;
  let drawX = videoBoxX;
  let drawY = videoBoxY;

  if (Math.abs(vidRatio - boxRatio) > 0.01) {
    if (vidRatio > boxRatio) {
      drawW = videoBoxW;
      drawH = videoBoxW / vidRatio;
      drawY = videoBoxY + (videoBoxH - drawH) / 2;
    } else {
      drawH = videoBoxH;
      drawW = videoBoxH * vidRatio;
      drawX = videoBoxX + (videoBoxW - drawW) / 2;
    }
  }

  // 3. Compute Zoom Transform with tweakable Easing & Motion Blur
  const zoom = computeZoomTransformAtTime(currentTime, zoomSegments, 0.45, project.appearance);

  ctx.save();

  // Create rounded clipping path with drop shadow for the video window
  const rad = borderRadius * scaleFactor;
  ctx.beginPath();
  ctx.roundRect(videoBoxX, videoBoxY, videoBoxW, videoBoxH, rad);

  if (shadow > 0 && padding > 0) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = shadow * scaleFactor * 1.2;
    ctx.shadowOffsetY = shadow * 0.4 * scaleFactor;
  }

  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.clip();

  // Draw Video with Virtual Camera Transform & Optical Motion Blur
  ctx.save();
  applyVirtualCameraTransform(ctx, drawX, drawY, drawW, drawH, zoom);

  try {
    if (zoom.isTransitioning && zoom.motionBlurEnabled && zoom.motionBlurPx > 0.2) {
      const blurAmount = Math.min(18, Math.max(0.6, zoom.motionBlurPx * scaleFactor)).toFixed(1);
      ctx.save();
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.globalAlpha = 0.58;
      ctx.drawImage(video, drawX, drawY, drawW, drawH);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.90;
      ctx.drawImage(video, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(video, drawX, drawY, drawW, drawH);
    }
  } catch {}

  // 4. Draw Click Ripple & Glow Animations in virtual camera space
  if (metadata.clicks && metadata.clicks.length > 0) {
    drawClickEffects(
      ctx,
      metadata.clicks,
      currentTime,
      drawW,
      drawH,
      clickEffect,
      0.6,
      drawX,
      drawY
    );
  }

  // 5. Draw Synthetic High-DPI Cursor in virtual camera space
  if (showCursor && metadata.cursor && metadata.cursor.length > 0) {
    const cur = interpolateCursorPosition(
      metadata.cursor,
      currentTime,
      project.appearance.cursorOffsetMs || 0
    );
    if (cur.visible) {
      const curScreenX = drawX + cur.x * drawW;
      const curScreenY = drawY + cur.y * drawH;
      const cursorZoomScale = Math.max(0.75, cursorScale * scaleFactor / Math.pow(zoom.scale, 0.3));
      drawSyntheticCursor(ctx, curScreenX, curScreenY, cursorZoomScale, cursorStyle);
    }
  }

  ctx.restore(); // restore virtual camera
  ctx.restore(); // restore clip & background
}
