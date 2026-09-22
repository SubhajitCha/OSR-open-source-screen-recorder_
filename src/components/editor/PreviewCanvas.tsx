import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Project } from '../../types';
import { extractCutSegments, extractZoomSegments } from '../../services/editorEngine';
import { drawCompositionScene } from '../../services/layoutRenderer';
import { generateThumbnailFromBlob } from '../../services/db';

interface PreviewCanvasProps {
  project: Project;
  currentTime: number;
  isPlaying: boolean;
  volume?: number;
  isMuted?: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationLoaded?: (duration: number) => void;
  selectedZoomId?: string | null;
  onUpdateZoomTarget?: (zoomId: string, targetX: number, targetY: number) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  project,
  currentTime,
  isPlaying,
  volume = 100,
  isMuted = false,
  onTimeUpdate,
  onDurationLoaded,
  selectedZoomId,
  onUpdateZoomTarget,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [camVideoLoaded, setCamVideoLoaded] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [camVideoSrc, setCamVideoSrc] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 960, height: 540 });

  const zoomSegments = extractZoomSegments(project.timeline);
  const cutSegments = extractCutSegments(project.timeline);
  const metadata = project.metadata || { cursor: [], clicks: [], keyboard: [], bookmarks: [] };

  // Generate instant poster thumbnail from videoBlob so canvas is never pitch dark
  useEffect(() => {
    let active = true;
    const blob = project.source.videoBlob;
    if (!blob) return;
    generateThumbnailFromBlob(blob, 0.08)
      .then((thumb) => {
        if (active && thumb) {
          setThumbnailUrl(thumb);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [project.source.videoBlob]);

  // Setup main video object URL (prefer isolated screenBlob if multi-track, else composite videoBlob)
  useEffect(() => {
    const mainBlob = project.source.screenBlob || project.source.videoBlob;
    if (!mainBlob) {
      setVideoSrc('');
      return;
    }
    const url = URL.createObjectURL(mainBlob);
    setVideoSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [project.source.screenBlob, project.source.videoBlob]);

  // Setup camera video object URL (if isolated camBlob exists)
  useEffect(() => {
    if (!project.source.camBlob) {
      setCamVideoSrc('');
      return;
    }
    const url = URL.createObjectURL(project.source.camBlob);
    setCamVideoSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [project.source.camBlob]);

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

  // Synchronize audio volume and mute state in real-time
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume / 100));
      videoRef.current.muted = isMuted || volume === 0;
    }
  }, [volume, isMuted]);

  // Sync video elements time with currentTime prop
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.05) {
      const targetTime = currentTime === 0 ? 0.05 : currentTime;
      videoRef.current.currentTime = targetTime;
    }
    if (camVideoRef.current && Math.abs(camVideoRef.current.currentTime - currentTime) > 0.05) {
      const targetTime = currentTime === 0 ? 0.05 : currentTime;
      camVideoRef.current.currentTime = targetTime;
    }
  }, [currentTime]);

  // Play / Pause sync across both tracks with audio policy handling
  useEffect(() => {
    if (videoRef.current && videoLoaded) {
      if (isPlaying) {
        videoRef.current.volume = Math.max(0, Math.min(1, volume / 100));
        videoRef.current.muted = isMuted || volume === 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Playback with audio prevented by browser, attempting muted play:', err);
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
    if (camVideoRef.current && camVideoLoaded) {
      if (isPlaying) {
        camVideoRef.current.play().catch(() => {});
      } else {
        camVideoRef.current.pause();
      }
    }
  }, [isPlaying, videoLoaded, camVideoLoaded, volume, isMuted]);

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

    // Keep camera track in lockstep
    if (camVideoRef.current && Math.abs(camVideoRef.current.currentTime - time) > 0.2) {
      camVideoRef.current.currentTime = time;
    }

    // Check non-destructive cuts
    for (const cut of cutSegments) {
      if (time >= cut.start && time < cut.end) {
        videoRef.current.currentTime = cut.end + 0.02;
        if (camVideoRef.current) {
          camVideoRef.current.currentTime = cut.end + 0.02;
        }
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

  // Render frame to canvas
  const renderCanvasFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    if (video.readyState < 1 && video.videoWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCompositionScene({
      ctx,
      width: canvas.width,
      height: canvas.height,
      screenVideo: video,
      camVideo: camVideoRef.current,
      currentTime: video.currentTime || currentTime,
      project,
      zoomSegments,
      metadata,
      selectedZoomId,
    });
  }, [project, currentTime, zoomSegments, metadata, selectedZoomId]);

  // Request Animation Frame when playing or currentTime/assets change
  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const loop = () => {
        renderCanvasFrame();
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    } else {
      renderCanvasFrame();
      animId = requestAnimationFrame(() => {
        renderCanvasFrame();
      });
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, renderCanvasFrame, currentTime, videoLoaded, camVideoLoaded, containerSize]);

  // Helper to map canvas pointer events to normalized video coordinates
  const getNormalizedVideoCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return { normX: 0.5, normY: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const scaleFactor = canvas.width / 1920;
    const padX = (project.appearance.padding ?? 32) * scaleFactor;
    const padY = (project.appearance.padding ?? 32) * scaleFactor * (canvas.height / canvas.width > 0.6 ? 1 : 0.8);
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
      {/* Hidden Main Video Source Element */}
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute opacity-0 pointer-events-none w-px h-px -z-50"
          playsInline
          preload="auto"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setVideoLoaded(true);
              if (videoRef.current.duration && isFinite(videoRef.current.duration)) {
                onDurationLoaded?.(videoRef.current.duration);
              }
              videoRef.current.volume = Math.max(0, Math.min(1, volume / 100));
              videoRef.current.muted = isMuted || volume === 0;

              // Immediately prime the WebM decoder to the initial frame so canvas is never black
              const initialSeek = currentTime > 0 ? currentTime : 0.05;
              try {
                videoRef.current.currentTime = initialSeek;
              } catch (_) {}
            }
          }}
          onLoadedData={() => {
            setVideoLoaded(true);
            renderCanvasFrame();
          }}
          onCanPlay={() => {
            setVideoLoaded(true);
            renderCanvasFrame();
          }}
          onSeeked={() => {
            setVideoLoaded(true);
            renderCanvasFrame();
          }}
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={() => onTimeUpdate(project.source.duration)}
        />
      ) : null}

      {/* Hidden Camera Video Source Element (for multi-track) */}
      {camVideoSrc ? (
        <video
          ref={camVideoRef}
          src={camVideoSrc}
          className="absolute opacity-0 pointer-events-none w-px h-px -z-50"
          playsInline
          muted
          preload="auto"
          onLoadedMetadata={() => {
            if (camVideoRef.current) {
              setCamVideoLoaded(true);
              const initialSeek = currentTime > 0 ? currentTime : 0.05;
              try {
                camVideoRef.current.currentTime = initialSeek;
              } catch (_) {}
            }
          }}
          onLoadedData={() => {
            setCamVideoLoaded(true);
            renderCanvasFrame();
          }}
          onCanPlay={() => {
            setCamVideoLoaded(true);
            renderCanvasFrame();
          }}
          onSeeked={() => {
            setCamVideoLoaded(true);
            renderCanvasFrame();
          }}
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

        {/* Instant Fallback Poster / Loading Overlay until video decoder presents first frame */}
        {!videoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-20 pointer-events-none transition-opacity duration-200">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Video preview thumbnail"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                <span className="text-xs text-zinc-400 font-medium tracking-wide">Loading video preview...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
