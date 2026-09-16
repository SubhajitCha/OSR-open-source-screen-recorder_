import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PipConfig,
  PipShape,
  PipSize,
} from '../types';
import {
  MoveIcon,
  Maximize01Icon,
  Minimize01Icon,
  RefreshIcon,
  LinkSquare01Icon,
  CircleIcon,
  SquareIcon,
  SparklesIcon,
} from 'hugeicons-react';

interface DraggableCameraBubbleProps {
  stream: MediaStream | null;
  pipConfig: PipConfig;
  onUpdatePipConfig: (updates: Partial<PipConfig>) => void;
  isRecording?: boolean;
}

export const DraggableCameraBubble: React.FC<DraggableCameraBubbleProps> = ({
  stream,
  pipConfig,
  onUpdatePipConfig,
  isRecording = false,
}) => {
  // Determine size pixel dimensions
  const getDimensions = () => {
    if (pipConfig.size === 'small') return { width: 140, height: 140 };
    if (pipConfig.size === 'large') return { width: 260, height: 260 };
    return { width: 190, height: 190 }; // medium
  };

  const { width, height } = getDimensions();

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const paddingX = Math.round(window.innerWidth * 0.03);
    const paddingY = Math.round(window.innerHeight * 0.04);
    const w = 190;
    const h = 190;
    return {
      x: window.innerWidth - w - paddingX,
      y: window.innerHeight - h - paddingY,
    };
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isOsPipActive, setIsOsPipActive] = useState<boolean>(false);
  const [pipType, setPipType] = useState<'document' | 'video' | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const docPipWindowRef = useRef<Window | null>(null);

  // Sync position from preset config if not actively dragging
  useEffect(() => {
    if (isDragging) return;
    const paddingX = Math.round(window.innerWidth * 0.03);
    const paddingY = Math.round(window.innerHeight * 0.04);
    const w = width;
    const h = height;

    if (pipConfig.position === 'top-left') {
      setPosition({ x: paddingX, y: paddingY });
    } else if (pipConfig.position === 'top-right') {
      setPosition({ x: window.innerWidth - w - paddingX, y: paddingY });
    } else if (pipConfig.position === 'bottom-left') {
      setPosition({ x: paddingX, y: Math.max(paddingY, window.innerHeight - h - paddingY) });
    } else if (pipConfig.position === 'bottom-right') {
      setPosition({ x: Math.max(paddingX, window.innerWidth - w - paddingX), y: Math.max(paddingY, window.innerHeight - h - paddingY) });
    } else if (pipConfig.position === 'custom' && pipConfig.customX !== undefined && pipConfig.customY !== undefined) {
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - w - 10, Math.round((pipConfig.customX / 100) * (window.innerWidth - w)))),
        y: Math.max(10, Math.min(window.innerHeight - h - 10, Math.round((pipConfig.customY / 100) * (window.innerHeight - h)))),
      });
    }
  }, [pipConfig.position, pipConfig.size, pipConfig.customX, pipConfig.customY, isDragging, width, height]);

  // Set video stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn('Bubble play error:', e));
    }
  }, [stream]);

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const maxX = window.innerWidth - width - 16;
      const maxY = window.innerHeight - height - 16;

      const newX = Math.max(16, Math.min(e.clientX - dragOffset.x, maxX));
      const newY = Math.max(16, Math.min(e.clientY - dragOffset.y, maxY));

      setPosition({ x: newX, y: newY });

      // Convert to percentages for Compositor (0 - 100%)
      const pctX = Math.round((newX / (window.innerWidth - width)) * 100);
      const pctY = Math.round((newY / (window.innerHeight - height)) * 100);

      onUpdatePipConfig({
        position: 'custom',
        customX: Math.max(0, Math.min(100, pctX)),
        customY: Math.max(0, Math.min(100, pctY)),
      });
    },
    [isDragging, dragOffset, width, height, onUpdatePipConfig]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Launch True OS-Level Floating Picture-in-Picture window (Floats across all desktop apps & screens)
  const handleRequestOsPip = async () => {
    try {
      // 1. Check if Document Picture-in-Picture is active and needs closing
      if (docPipWindowRef.current) {
        docPipWindowRef.current.close();
        docPipWindowRef.current = null;
        setIsOsPipActive(false);
        setPipType(null);
        return;
      }

      // 2. Check if Video PiP is active and needs closing
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsOsPipActive(false);
        setPipType(null);
        return;
      }

      // 3. Try Document Picture-in-Picture API first (Rich HTML circular floating window across all apps)
      const docPiP = (window as unknown as { documentPictureInPicture?: { requestWindow: (options: { width: number; height: number }) => Promise<Window> } }).documentPictureInPicture;
      if (docPiP && typeof docPiP.requestWindow === 'function') {
        const pipWin = await docPiP.requestWindow({
          width: Math.max(200, width),
          height: Math.max(200, height),
        });
        docPipWindowRef.current = pipWin;

        // Populate the floating window DOM
        pipWin.document.title = 'Camera Bubble (Always on Top)';
        const style = pipWin.document.createElement('style');
        style.textContent = `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background-color: #09090b;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .cam-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: #000;
          }
          video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: ${
              pipConfig.shape === 'circle'
                ? '50%'
                : pipConfig.shape === 'rounded'
                ? '24px'
                : pipConfig.shape === 'rectangle'
                ? '14px'
                : '0px'
            };
            border: 3px solid #38bdf8;
            transform: ${pipConfig.mirror ? 'scaleX(-1)' : 'none'};
          }
        `;
        pipWin.document.head.appendChild(style);

        const container = pipWin.document.createElement('div');
        container.className = 'cam-container';

        const pipVideo = pipWin.document.createElement('video');
        pipVideo.autoplay = true;
        pipVideo.muted = true;
        pipVideo.playsInline = true;
        pipVideo.srcObject = stream;
        container.appendChild(pipVideo);
        pipWin.document.body.appendChild(container);

        setIsOsPipActive(true);
        setPipType('document');

        pipWin.addEventListener('pagehide', () => {
          docPipWindowRef.current = null;
          setIsOsPipActive(false);
          setPipType(null);
        });
        return;
      }

      // 4. Fallback to standard Video Picture-in-Picture
      if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsOsPipActive(true);
        setPipType('video');
      }
    } catch (err) {
      console.warn('OS Picture-in-Picture request failed:', err);
    }
  };

  // Exit PiP listener for standard video PiP
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLeavePip = () => {
      setIsOsPipActive(false);
      setPipType(null);
    };
    video.addEventListener('leavepictureinpicture', onLeavePip);
    return () => video.removeEventListener('leavepictureinpicture', onLeavePip);
  }, []);

  // Listen to external toggle event (e.g. from HUD or keyboard shortcut)
  useEffect(() => {
    const handleToggle = () => {
      handleRequestOsPip();
    };
    window.addEventListener('toggle-camera-pip', handleToggle);
    return () => window.removeEventListener('toggle-camera-pip', handleToggle);
  }, [pipConfig, stream, width, height]);

  // Cleanup PiP on unmount (e.g. when recording stops)
  useEffect(() => {
    return () => {
      if (docPipWindowRef.current) {
        try {
          docPipWindowRef.current.close();
        } catch (_) {}
      }
      if (document.pictureInPictureElement) {
        try {
          document.exitPictureInPicture().catch(() => {});
        } catch (_) {}
      }
    };
  }, []);

  if (!stream) return null;

  return (
    <div
      ref={containerRef}
      id="floating-camera-bubble"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={`fixed z-50 cursor-grab active:cursor-grabbing select-none transition-shadow duration-150 ${
        isDragging ? 'shadow-2xl scale-[1.03]' : 'shadow-xl'
      }`}
    >
      {/* Container with specified shape */}
      <div
        className={`w-full h-full relative overflow-hidden bg-slate-950 dark:bg-black border-[3.5px] border-white dark:border-zinc-800 shadow-2xl transition-colors ${
          pipConfig.shape === 'circle'
            ? 'rounded-full'
            : pipConfig.shape === 'rounded'
            ? 'rounded-3xl'
            : pipConfig.shape === 'rectangle'
            ? 'rounded-2xl'
            : 'rounded-none'
        }`}
      >
        {isOsPipActive ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950 dark:bg-black text-white select-none">
            <div className="relative mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
              <LinkSquare01Icon className="w-6 h-6 text-blue-500 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-100">Floating on Screen</span>
            <span className="text-[8px] text-zinc-400 mb-1.5">Visible across all tabs</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRequestOsPip();
              }}
              className="px-3 py-1 bg-blue-600 dark:bg-emerald-500 hover:bg-blue-700 dark:hover:bg-emerald-600 rounded-full text-[9px] font-bold text-white dark:text-black cursor-pointer shadow-sm active:scale-95"
            >
              Dock Back
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover pointer-events-none ${
              pipConfig.mirror ? '-scale-x-100' : ''
            }`}
          />
        )}

        {/* Drag handle & action overlays on hover */}
        {isHovered && !isOsPipActive && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-between p-2 transition-opacity">
            {/* Top Toolbar */}
            <div className="flex items-center gap-1 bg-slate-950/80 dark:bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 dark:border-zinc-800 shadow-md">
              <span className="text-[10px] text-white dark:text-zinc-200 font-semibold flex items-center gap-1">
                <MoveIcon className="w-3 h-3 text-blue-400 dark:text-emerald-400" />
                Move
              </span>

              {/* OS Float PiP everywhere button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRequestOsPip();
                }}
                title="Float across other tabs & desktop apps (Always on top)"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-500 dark:bg-emerald-500 dark:text-black transition-colors ml-1 cursor-pointer"
              >
                <LinkSquare01Icon className="w-3 h-3" />
                <span>Float</span>
              </button>
            </div>

            {/* Bottom Controls: Shape, Mirror, Size */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 dark:bg-zinc-950/90 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 dark:border-zinc-800 shadow-md">
              {/* Shape Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextShape: PipShape =
                    pipConfig.shape === 'rectangle'
                      ? 'circle'
                      : pipConfig.shape === 'circle'
                      ? 'rounded'
                      : pipConfig.shape === 'rounded'
                      ? 'square'
                      : 'rectangle';
                  onUpdatePipConfig({ shape: nextShape });
                }}
                title="Change Shape (Rectangle / Circle / Rounded / Square)"
                className="p-1 text-white dark:text-zinc-300 hover:text-blue-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {pipConfig.shape === 'circle' ? (
                  <CircleIcon className="w-3.5 h-3.5" />
                ) : (
                  <SquareIcon className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Mirror Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePipConfig({ mirror: !pipConfig.mirror });
                }}
                title="Mirror Camera"
                className={`p-1 transition-colors cursor-pointer ${pipConfig.mirror ? 'text-blue-400 dark:text-emerald-400' : 'text-white dark:text-zinc-300 hover:text-slate-300 dark:hover:text-white'}`}
              >
                <RefreshIcon className="w-3.5 h-3.5" />
              </button>

              {/* Size Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextSize: PipSize =
                    pipConfig.size === 'small' ? 'medium' : pipConfig.size === 'medium' ? 'large' : 'small';
                  onUpdatePipConfig({ size: nextSize });
                }}
                title="Toggle Size (Small / Medium / Large)"
                className="p-1 text-white dark:text-zinc-300 hover:text-blue-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {pipConfig.size === 'large' ? (
                  <Minimize01Icon className="w-3.5 h-3.5" />
                ) : (
                  <Maximize01Icon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Live Recording Pulsing Dot if active */}
        {isRecording && !isHovered && !isOsPipActive && (
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </div>
    </div>
  );
};

