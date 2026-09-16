import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Project, ZoomSegment } from '../../types';
import { computeZoomTransformAtTime, applyVirtualCameraTransform } from '../../services/zoomEngine';
import { drawClickEffects, drawSyntheticCursor, interpolateCursorPosition } from '../../services/cursorEngine';
import { extractCutSegments, extractZoomSegments } from '../../services/editorEngine';
import { renderBackgroundToCanvas } from '../../services/backgroundPresets';

interface PreviewCanvasProps {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationLoaded?: (duration: number) => void;
  selectedZoomId?: string | null;
  onUpdateZoomTarget?: (zoomId: string, targetX: number, targetY: number) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  project,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onDurationLoaded,
  selectedZoomId,
  onUpdateZoomTarget,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 960, height: 540 });

  const zoomSegments = extractZoomSegments(project.timeline);
  const cutSegments = extractCutSegments(project.timeline);
  const metadata = project.metadata || { cursor: [], clicks: [], keyboard: [], bookmarks: [] };

  // Setup video object URL
  useEffect(() => {
    if (!project.source.videoBlob) {
      setVideoSrc('');
      return;
    }
    const url = URL.createObjectURL(project.source.videoBlob);
    setVideoSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [project.source.videoBlob]);

  // Responsive Container Dimension Observer
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerSize({ width: clientWidth, height: clientHeight });
        }
      }
    };

    updateSize();

    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Sync video element time with currentTime prop
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.15) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Play / Pause sync
  useEffect(() => {
    if (!videoRef.current || !videoLoaded) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, videoLoaded]);

  // Handle video time updates & cuts skipping & trim bounds
  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    let time = videoRef.current.currentTime;

    const trimStart = project.source.trimStart ?? 0;
    const trimEnd = project.source.trimEnd ?? (videoRef.current.duration || project.source.duration);

    if (time < trimStart) {
      videoRef.current.currentTime = trimStart;
      time = trimStart;
    } else if (time >= trimEnd) {
      videoRef.current.currentTime = trimEnd;
      time = trimEnd;
      if (isPlaying) {
        videoRef.current.pause();
      }
    }

    // Check non-destructive cuts
    for (const cut of cutSegments) {
      if (time >= cut.start && time < cut.end) {
        videoRef.current.currentTime = cut.end + 0.02;
        time = videoRef.current.currentTime;
        break;
      }
    }

    onTimeUpdate(time);
  }, [cutSegments, onTimeUpdate, project.source.trimStart, project.source.trimEnd, project.source.duration, isPlaying]);

  // Determine native canvas resolution & target aspect ratio
  const ar = project.appearance.aspectRatio;
  let canvasNativeW = 1920;
  let canvasNativeH = 1080;
  let targetRatio = 16 / 9;

  if (ar === '9:16') {
    canvasNativeW = 1080;
    canvasNativeH = 1920;
    targetRatio = 9 / 16;
  } else if (ar === '1:1') {
    canvasNativeW = 1440;
    canvasNativeH = 1440;
    targetRatio = 1;
  } else if (ar === '4:3') {
    canvasNativeW = 1920;
    canvasNativeH = 1440;
    targetRatio = 4 / 3;
  }

  // Calculate pixel-perfect display dimensions that fit the viewport with margin
  const availW = Math.max(100, containerSize.width - 32);
  const availH = Math.max(100, containerSize.height - 32);

  let displayW = availW;
  let displayH = availW / targetRatio;
  if (displayH > availH) {
    displayH = availH;
    displayW = availH * targetRatio;
  }

  // Render loop
  const renderCanvasFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    if (!videoLoaded && video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const { background, padding, borderRadius, shadow, showCursor, cursorScale, cursorStyle, clickEffect } =
      project.appearance;

    // 1. Clear & Draw Canvas Background (Supports Apple presets, grain textures, and gradients)
    ctx.clearRect(0, 0, width, height);
    renderBackgroundToCanvas(ctx, width, height, background);

    // 2. Video Window Box with Responsive Padding
    const scaleFactor = width / 1920;
    const padX = padding * scaleFactor;
    const padY = padding * scaleFactor * (height / width > 0.6 ? 1 : 0.8);
    const videoBoxW = width - padX * 2;
    const videoBoxH = height - padY * 2;
    const videoBoxX = padX;
    const videoBoxY = padY;

    // Preserve Source Video Intrinsic Aspect Ratio (Never stretch/distort)
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

    // Clip Rounded Box with Drop Shadow
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

    // Draw Source Video Frame with Virtual Camera Transform & Optical Motion Blur
    ctx.save();
    applyVirtualCameraTransform(ctx, drawX, drawY, drawW, drawH, zoom);

    try {
      if (zoom.isTransitioning && zoom.motionBlurEnabled && zoom.motionBlurPx > 0.2) {
        // High quality optical motion blur proportional to zoom velocity & user tweakable intensity
        const blurAmount = Math.min(18, Math.max(0.6, zoom.motionBlurPx * scaleFactor)).toFixed(1);
        ctx.save();
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.globalAlpha = 0.58;
        ctx.drawImage(video, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Layer crisp subject pass for authentic camera motion blur
        ctx.save();
        ctx.globalAlpha = 0.90;
        ctx.drawImage(video, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(video, drawX, drawY, drawW, drawH);
      }
    } catch {
      // ignore empty frames
    }

    // Draw Click Ripples / Pulses (Pinpoint mapped in virtual camera space)
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

    // Draw Synthetic High-DPI Cursor (Pinpoint mapped in virtual camera space)
    if (showCursor && metadata.cursor && metadata.cursor.length > 0) {
      const cur = interpolateCursorPosition(
        metadata.cursor,
        currentTime,
        project.appearance.cursorOffsetMs || 0
      );
      if (cur.visible) {
        const curScreenX = drawX + cur.x * drawW;
        const curScreenY = drawY + cur.y * drawH;
        // Keep cursor sharp and naturally scaled
        const cursorZoomScale = Math.max(0.75, cursorScale * scaleFactor / Math.pow(zoom.scale, 0.3));
        drawSyntheticCursor(ctx, curScreenX, curScreenY, cursorZoomScale, cursorStyle);
      }
    }

    // Draw Interactive Zoom Crosshair when a Zoom is selected
    if (selectedZoomId) {
      const selectedSeg = zoomSegments.find((s) => s.id === selectedZoomId);
      if (selectedSeg) {
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
    }

    ctx.restore(); // Restore virtual camera
    ctx.restore(); // Restore clip
  }, [project, currentTime, zoomSegments, metadata, selectedZoomId, videoLoaded]);

  // Request Animation Frame when playing or currentTime changes
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderCanvasFrame();
      if (isPlaying) {
        animId = requestAnimationFrame(loop);
      }
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, renderCanvasFrame]);

  // Helper to map canvas pointer events to normalized video coordinates
  const getNormalizedVideoCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return { normX: 0.5, normY: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const scaleFactor = canvas.width / 1920;
    const padX = project.appearance.padding * scaleFactor;
    const padY = project.appearance.padding * scaleFactor * (canvas.height / canvas.width > 0.6 ? 1 : 0.8);
    const videoBoxW = canvas.width - padX * 2;
    const videoBoxH = canvas.height - padY * 2;
    const videoBoxX = padX;
    const videoBoxY = padY;

    const vidW = video?.videoWidth || project.source.width || 1920;
    const vidH = video?.videoHeight || project.source.height || 1080;
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

    const normX = Math.max(0.05, Math.min(0.95, (clickX - drawX) / drawW));
    const normY = Math.max(0.05, Math.min(0.95, (clickY - drawY) / drawH));

    return { normX, normY };
  };

  // Handle Dragging Zoom Target Point on the Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedZoomId || !onUpdateZoomTarget || !canvasRef.current) return;
    const { normX, normY } = getNormalizedVideoCoords(e);
    onUpdateZoomTarget(selectedZoomId, parseFloat(normX.toFixed(3)), parseFloat(normY.toFixed(3)));
    setIsDraggingTarget(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingTarget || !selectedZoomId || !onUpdateZoomTarget || !canvasRef.current) return;
    const { normX, normY } = getNormalizedVideoCoords(e);
    onUpdateZoomTarget(selectedZoomId, parseFloat(normX.toFixed(3)), parseFloat(normY.toFixed(3)));
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingTarget(false);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-2 select-none relative overflow-hidden min-h-0 min-w-0"
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
    >
      {/* Hidden Video Source Element */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="hidden"
          playsInline
          muted
          preload="auto"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setVideoLoaded(true);
              if (videoRef.current.duration && isFinite(videoRef.current.duration)) {
                onDurationLoaded?.(videoRef.current.duration);
              }
            }
          }}
          onLoadedData={() => setVideoLoaded(true)}
          onCanPlay={() => setVideoLoaded(true)}
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={() => onTimeUpdate(project.source.duration)}
        />
      ) : null}

      {/* Main Responsive Fitted Render Canvas Container */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#26262E] bg-zinc-950 flex items-center justify-center transition-all duration-150"
        style={{
          width: `${Math.round(displayW)}px`,
          height: `${Math.round(displayH)}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasNativeW}
          height={canvasNativeH}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          className={`block w-full h-full ${selectedZoomId ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
        />
      </div>
    </div>
  );
};
