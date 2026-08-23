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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      if (videoRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsOsPipActive(false);
        } else {
          await videoRef.current.requestPictureInPicture();
          setIsOsPipActive(true);
        }
      }
    } catch (err) {
      console.warn('OS Picture-in-Picture request failed:', err);
    }
  };

  // Exit PiP listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLeavePip = () => setIsOsPipActive(false);
    video.addEventListener('leavepictureinpicture', onLeavePip);
    return () => video.removeEventListener('leavepictureinpicture', onLeavePip);
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
        className={`w-full h-full relative overflow-hidden bg-slate-950 border-[3.5px] border-white shadow-2xl ${
          pipConfig.shape === 'circle'
            ? 'rounded-full'
            : pipConfig.shape === 'rounded'
            ? 'rounded-3xl'
            : 'rounded-xl'
        }`}
      >
        {isOsPipActive ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950 text-white select-none">
            <LinkSquare01Icon className="w-6 h-6 text-blue-500 mb-1" />
            <span className="text-[10px] font-bold">Floating in OS Window</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRequestOsPip();
              }}
              className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-full text-[9px] font-bold text-white cursor-pointer"
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
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-between p-2 transition-opacity">
            {/* Top Toolbar */}
            <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-md">
              <span className="text-[10px] text-white font-semibold flex items-center gap-1">
                <MoveIcon className="w-3 h-3 text-blue-400" />
                Move
              </span>

              {/* OS Float PiP everywhere button */}
              {document.pictureInPictureEnabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestOsPip();
                  }}
                  title="Float across ALL desktop apps & screens (OS PiP)"
                  className="p-1 text-white hover:text-blue-400 transition-colors ml-1 cursor-pointer"
                >
                  <LinkSquare01Icon className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Bottom Controls: Shape, Mirror, Size */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-md">
              {/* Shape Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextShape: PipShape =
                    pipConfig.shape === 'circle' ? 'rounded' : pipConfig.shape === 'rounded' ? 'square' : 'circle';
                  onUpdatePipConfig({ shape: nextShape });
                }}
                title="Change Shape (Circle / Rounded / Square)"
                className="p-1 text-white hover:text-blue-400 transition-colors cursor-pointer"
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
                className={`p-1 transition-colors cursor-pointer ${pipConfig.mirror ? 'text-blue-400' : 'text-white hover:text-slate-300'}`}
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
                className="p-1 text-white hover:text-blue-400 transition-colors cursor-pointer"
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
        {isRecording && !isHovered && (
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </div>
    </div>
  );
};
