import React, { useRef, useCallback, useEffect } from 'react';
import { Maximize01Icon, RotateRight01Icon } from 'hugeicons-react';

export interface LayerRect {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width: number; // percentage (10 - 100)
  height: number; // percentage (10 - 100)
}

interface AdjustableLayerBoxProps {
  id: string;
  isSelected: boolean;
  onSelect: () => void;
  rect: LayerRect;
  onChangeRect: (newRect: LayerRect) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  shape?: 'rectangle' | 'rounded' | 'circle' | 'square';
  disabled?: boolean;
  label?: string;
  minWidthPct?: number;
  minHeightPct?: number;
  lockAspectRatio?: boolean;
  onQuickPreset?: (preset: 'fit' | 'full' | 'center') => void;
  onAlignChange?: (guides: { x: boolean; y: boolean }) => void;
  onReset?: () => void;
}

export const AdjustableLayerBox: React.FC<AdjustableLayerBoxProps> = ({
  id,
  isSelected,
  onSelect,
  rect,
  onChangeRect,
  containerRef,
  children,
  shape = 'rounded',
  disabled = false,
  label,
  minWidthPct = 5,
  minHeightPct = 5,
  lockAspectRatio = false,
  onQuickPreset,
  onAlignChange,
  onReset,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw';
    startX: number;
    startY: number;
    startRect: LayerRect;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingRectRef = useRef<LayerRect | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    handleType: 'move' | 'nw' | 'ne' | 'se' | 'sw'
  ) => {
    if (disabled) return;
    e.stopPropagation();
    onSelect();

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const container = containerRef.current?.getBoundingClientRect();
    const containerWidth = container && container.width > 0 ? container.width : 1920;
    const containerHeight = container && container.height > 0 ? container.height : 1080;

    dragStartRef.current = {
      type: handleType,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...rect },
      containerWidth,
      containerHeight,
    };
  };

  const scheduleRectUpdate = useCallback((newRect: LayerRect) => {
    pendingRectRef.current = newRect;
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingRectRef.current) {
          onChangeRect(pendingRectRef.current);
          pendingRectRef.current = null;
        }
        rafIdRef.current = null;
      });
    }
  }, [onChangeRect]);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragStartRef.current) return;

      const { type, startRect, startX, startY, containerWidth, containerHeight } = dragStartRef.current;
      if (containerWidth <= 0 || containerHeight <= 0) return;

      const startXPx = (startRect.x / 100) * containerWidth;
      const startYPx = (startRect.y / 100) * containerHeight;
      const startWidthPx = (startRect.width / 100) * containerWidth;
      const startHeightPx = (startRect.height / 100) * containerHeight;
      const layerAspect = startWidthPx / (startHeightPx || 1);
      const containerAspect = containerWidth / (containerHeight || 1);

      const deltaXPx = e.clientX - startX;
      const deltaYPx = e.clientY - startY;

      if (type === 'move') {
        const deltaX = (deltaXPx / containerWidth) * 100;
        const deltaY = (deltaYPx / containerHeight) * 100;

        // Unrestricted placement: anywhere on the stage canvas
        const rawX = startRect.x + deltaX;
        const rawY = startRect.y + deltaY;

        // Snapping / sticking to the middle when moving:
        // Center of the frame is (rawX + startRect.width / 2)
        // Center of the stage/canvas is 50%
        // Magnetic snap threshold for center alignment only (~10px):
        const snapThresholdXPct = (10 / containerWidth) * 100;
        const snapThresholdYPct = (10 / containerHeight) * 100;

        const centerDiffX = (rawX + startRect.width / 2) - 50;
        const centerDiffY = (rawY + startRect.height / 2) - 50;

        let finalX = rawX;
        let isSnappedX = false;
        if (Math.abs(centerDiffX) <= snapThresholdXPct) {
          finalX = 50 - startRect.width / 2;
          isSnappedX = true;
        }

        let finalY = rawY;
        let isSnappedY = false;
        if (Math.abs(centerDiffY) <= snapThresholdYPct) {
          finalY = 50 - startRect.height / 2;
          isSnappedY = true;
        }

        // Allow layer to be positioned anywhere across the canvas smoothly, right up to the edges without getting snatched
        const clampedX = Math.max(0, Math.min(100 - startRect.width, finalX));
        const clampedY = Math.max(0, Math.min(100 - startRect.height, finalY));

        onAlignChange?.({ x: isSnappedX, y: isSnappedY });

        scheduleRectUpdate({
          ...startRect,
          x: Math.round(clampedX * 10) / 10,
          y: Math.round(clampedY * 10) / 10,
        });
      } else {
        onAlignChange?.({ x: false, y: false });
        if (type === 'se') {
        let newWidthPct = Math.max(minWidthPct, Math.min(100, startRect.width + (deltaXPx / containerWidth) * 100));
        let newHeightPct: number;

        if (lockAspectRatio) {
          newHeightPct = (newWidthPct / layerAspect) * containerAspect;
          if (newHeightPct > 100) {
            newHeightPct = 100;
            newWidthPct = (newHeightPct * layerAspect) / containerAspect;
          }
        } else {
          newHeightPct = Math.max(minHeightPct, Math.min(100, startRect.height + (deltaYPx / containerHeight) * 100));
        }

        // Auto-adjust x, y if stretched beyond canvas boundary while preserving scale
        let newX = startRect.x;
        let newY = startRect.y;
        if (newX + newWidthPct > 100) {
          newX = Math.max(0, 100 - newWidthPct);
        }
        if (newY + newHeightPct > 100) {
          newY = Math.max(0, 100 - newHeightPct);
        }

        scheduleRectUpdate({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newWidthPct * 10) / 10,
          height: Math.round(newHeightPct * 10) / 10,
        });
      } else if (type === 'ne') {
        let newWidthPct = Math.max(minWidthPct, Math.min(100, startRect.width + (deltaXPx / containerWidth) * 100));
        let newHeightPct: number;

        if (lockAspectRatio) {
          newHeightPct = (newWidthPct / layerAspect) * containerAspect;
          if (newHeightPct > 100) {
            newHeightPct = 100;
            newWidthPct = (newHeightPct * layerAspect) / containerAspect;
          }
        } else {
          newHeightPct = Math.max(minHeightPct, Math.min(100, startRect.height - (deltaYPx / containerHeight) * 100));
        }

        const bottomAnchor = startRect.y + startRect.height;
        let newY = bottomAnchor - newHeightPct;
        let newX = startRect.x;
        if (newX + newWidthPct > 100) {
          newX = Math.max(0, 100 - newWidthPct);
        }
        if (newY < 0) {
          newY = 0;
        }

        scheduleRectUpdate({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newWidthPct * 10) / 10,
          height: Math.round(newHeightPct * 10) / 10,
        });
      } else if (type === 'sw') {
        let newWidthPct = Math.max(minWidthPct, Math.min(100, startRect.width - (deltaXPx / containerWidth) * 100));
        let newHeightPct: number;

        if (lockAspectRatio) {
          newHeightPct = (newWidthPct / layerAspect) * containerAspect;
          if (newHeightPct > 100) {
            newHeightPct = 100;
            newWidthPct = (newHeightPct * layerAspect) / containerAspect;
          }
        } else {
          newHeightPct = Math.max(minHeightPct, Math.min(100, startRect.height + (deltaYPx / containerHeight) * 100));
        }

        const rightAnchor = startRect.x + startRect.width;
        let newX = rightAnchor - newWidthPct;
        let newY = startRect.y;
        if (newX < 0) {
          newX = 0;
        }
        if (newY + newHeightPct > 100) {
          newY = Math.max(0, 100 - newHeightPct);
        }

        scheduleRectUpdate({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newWidthPct * 10) / 10,
          height: Math.round(newHeightPct * 10) / 10,
        });
      } else if (type === 'nw') {
        let newWidthPct = Math.max(minWidthPct, Math.min(100, startRect.width - (deltaXPx / containerWidth) * 100));
        let newHeightPct: number;

        if (lockAspectRatio) {
          newHeightPct = (newWidthPct / layerAspect) * containerAspect;
          if (newHeightPct > 100) {
            newHeightPct = 100;
            newWidthPct = (newHeightPct * layerAspect) / containerAspect;
          }
        } else {
          newHeightPct = Math.max(minHeightPct, Math.min(100, startRect.height - (deltaYPx / containerHeight) * 100));
        }

        const rightAnchor = startRect.x + startRect.width;
        const bottomAnchor = startRect.y + startRect.height;
        let newX = rightAnchor - newWidthPct;
        let newY = bottomAnchor - newHeightPct;
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;

        scheduleRectUpdate({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newWidthPct * 10) / 10,
          height: Math.round(newHeightPct * 10) / 10,
        });
      }
    }
  },
  [minWidthPct, minHeightPct, lockAspectRatio, scheduleRectUpdate, onAlignChange]
);

const handlePointerUp = useCallback(() => {
  dragStartRef.current = null;
  onAlignChange?.({ x: false, y: false });

  if (rafIdRef.current !== null) {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
  }
  if (pendingRectRef.current) {
    onChangeRect(pendingRectRef.current);
    pendingRectRef.current = null;
  }
}, [onAlignChange, onChangeRect]);

useEffect(() => {
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerup', handlePointerUp);
  return () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    onAlignChange?.({ x: false, y: false });
  };
}, [handlePointerMove, handlePointerUp, onAlignChange]);

  const shapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'rounded'
      ? 'rounded-2xl'
      : shape === 'rectangle'
      ? 'rounded-xl'
      : 'rounded-none';

  return (
    <div
      ref={boxRef}
      id={id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        willChange: 'left, top, width, height',
        transform: 'translateZ(0)',
      }}
      className={`absolute z-30 select-none group touch-none ${
        disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      } ${
        isSelected
          ? 'shadow-[0_0_25px_rgba(0,229,255,0.4)]'
          : 'hover:ring-1 hover:ring-white/40'
      } ${shapeClass}`}
    >
      {/* Content wrapper */}
      <div className={`w-full h-full overflow-hidden ${shapeClass}`}>
        {children}
      </div>

      {/* Active Selection Bounding Box & Anchor Handles */}
      {isSelected && !disabled && (
        <>
          {/* Cyan outline border precisely matching the shape's outer boundary */}
          <div
            className={`absolute inset-0 pointer-events-none border-2 border-[#00e5ff] z-40 ${shapeClass}`}
          />

          {/* Top-Left Corner Handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'nw')}
            title="Resize Top-Left"
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#00e5ff] shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform"
          />

          {/* Top-Right Corner Handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'ne')}
            title="Resize Top-Right"
            className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#00e5ff] shadow-md cursor-nesw-resize z-50 hover:scale-125 transition-transform"
          />

          {/* Bottom-Left Corner Handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'sw')}
            title="Resize Bottom-Left"
            className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#00e5ff] shadow-md cursor-nesw-resize z-50 hover:scale-125 transition-transform"
          />

          {/* Bottom-Right Corner Handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'se')}
            title="Resize Bottom-Right"
            className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#00e5ff] shadow-md cursor-nwse-resize z-50 hover:scale-125 transition-transform"
          />

          {/* Simple Minimalist Reset Button */}
          {onReset && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className={`absolute z-50 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/90 dark:bg-zinc-900/95 hover:bg-black text-white text-[11px] font-medium shadow-md border border-white/20 backdrop-blur-md cursor-pointer transition-colors select-none ${
                rect.y < 8 ? 'top-2 right-2' : '-top-7 right-0'
              }`}
              title="Reset screen size"
            >
              <RotateRight01Icon className="w-3 h-3 text-[#00e5ff]" />
              <span>Reset</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
