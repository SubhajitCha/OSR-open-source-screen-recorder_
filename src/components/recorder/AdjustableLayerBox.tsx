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
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw';
    startX: number;
    startY: number;
    startRect: LayerRect;
  } | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    handleType: 'move' | 'nw' | 'ne' | 'se' | 'sw'
  ) => {
    if (disabled) return;
    e.stopPropagation();
    onSelect();

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    dragStartRef.current = {
      type: handleType,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...rect },
    };
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragStartRef.current || !containerRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      if (container.width <= 0 || container.height <= 0) return;

      const { type, startRect, startX, startY } = dragStartRef.current;
      const startXPx = (startRect.x / 100) * container.width;
      const startYPx = (startRect.y / 100) * container.height;
      const startWidthPx = (startRect.width / 100) * container.width;
      const startHeightPx = (startRect.height / 100) * container.height;
      const layerAspect = startWidthPx / (startHeightPx || 1);
      const containerAspect = container.width / (container.height || 1);

      const deltaXPx = e.clientX - startX;
      const deltaYPx = e.clientY - startY;

      if (type === 'move') {
        const deltaX = (deltaXPx / container.width) * 100;
        const deltaY = (deltaYPx / container.height) * 100;
        
        // Unrestricted placement: anywhere on the stage canvas
        const rawX = startRect.x + deltaX;
        const rawY = startRect.y + deltaY;

        // Snapping / sticking to the middle when moving:
        // Center of the frame is (rawX + startRect.width / 2)
        // Center of the stage/canvas is 50%
        // Magnetic snap threshold for center alignment only (~10px):
        const snapThresholdXPct = (10 / container.width) * 100;
        const snapThresholdYPct = (10 / container.height) * 100;

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

        onChangeRect({
          ...startRect,
          x: Math.round(clampedX * 10) / 10,
          y: Math.round(clampedY * 10) / 10,
        });
      } else {
        onAlignChange?.({ x: false, y: false });
        if (type === 'se') {
        let newWidthPct = Math.max(minWidthPct, Math.min(100, startRect.width + (deltaXPx / container.width) * 100));
        let newHeightPct: number;

        if (lockAspectRatio) {
          newHeightPct = (newWidthPct / layerAspect) * containerAspect;
          if (newHeightPct > 100) {
            newHeightPct = 100;
            newWidthPct = (newHeightPct * layerAspect) / containerAspect;
          }
        } else {
          newHeightPct = Math.max(minHeightPct, Math.min(100, startRect.height + (deltaYPx / container.height) * 100));
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

        onChangeRect({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newWidthPct * 10) / 10,
          height: Math.round(newHeightPct * 10) / 10,
        });
      } else if (type === 'ne') {
        let newWidthPct = Math.max(minWidthPct, Math.min(100, startRect.width + (deltaXPx / container.width) * 100));
        let newHeightPct: number;

        if (lockAspectRatio) {
          newHeightPct = (newWidthPct / layerAspect) * containerAspect;
          if (newHeightPct > 100) {
            newHeightPct = 100;
            newWidthPct = (newHeightPct * layerAspect) / containerAspect;
          }
        } else {
          newHeightPct = Math.max(minHeightPct, Math.min(100, startRect.height - (deltaYPx / container.height) * 100));
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

        onChangeRect({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newWidthPct * 10) / 10,
          height: Math.round(newHeightPct * 10) / 10,
        });
      } else if (type === 'sw') {
        let newWidthPct = Math.max(minWidthPct, Math.min(100, startRect.width - (deltaXPx / container.width) * 100));
        let newHeightPct: number;

        if (lockAspectRatio) {
          newHeightPct = (newWidthPct / layerAspect) * containerAspect;
          if (newHeightPct > 100) {
            newHeightPct = 100;
            newWidthPct = (newHeightPct * layerAspect) / containerAspect;
          }
        } else {
          newHeightPct = Math.max(minHeightPct, Math.min(100, startRect.height + (deltaYPx / container.height) * 100));
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

        onChangeRect({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newWidthPct * 10) / 10,
          height: Math.round(newHeightPct * 10) / 10,
        });
      } else if (type === 'nw') {
        let newWidthPct = Math.max(minWidthPct, Math.min(100, startRect.width - (deltaXPx / container.width) * 100));
        let newHeightPct: number;

        if (lockAspectRatio) {
          newHeightPct = (newWidthPct / layerAspect) * containerAspect;
          if (newHeightPct > 100) {
            newHeightPct = 100;
            newWidthPct = (newHeightPct * layerAspect) / containerAspect;
          }
        } else {
          newHeightPct = Math.max(minHeightPct, Math.min(100, startRect.height - (deltaYPx / container.height) * 100));
        }

        const rightAnchor = startRect.x + startRect.width;
        const bottomAnchor = startRect.y + startRect.height;
        let newX = rightAnchor - newWidthPct;
        let newY = bottomAnchor - newHeightPct;
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;

        onChangeRect({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newWidthPct * 10) / 10,
          height: Math.round(newHeightPct * 10) / 10,
        });
      }
    }
  },
  [containerRef, minWidthPct, minHeightPct, lockAspectRatio, onChangeRect, onAlignChange]
);

const handlePointerUp = useCallback(() => {
  dragStartRef.current = null;
  onAlignChange?.({ x: false, y: false });
}, [onAlignChange]);

useEffect(() => {
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  return () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
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
        </>
      )}
    </div>
  );
};
