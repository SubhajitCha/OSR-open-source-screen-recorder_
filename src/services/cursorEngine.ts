import { ClickEffectType, ClickEvent, CursorPoint, CursorStyleType } from '../types';

export interface InterpolatedCursor {
  x: number; // 0 to 1
  y: number; // 0 to 1
  visible: boolean;
}

/**
 * Fast binary search to find index of point with time <= targetTime
 */
function findNearestPointIndex(points: CursorPoint[], targetTime: number): number {
  let low = 0;
  let high = points.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (points[mid].time === targetTime) {
      return mid;
    } else if (points[mid].time < targetTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.max(0, Math.min(points.length - 2, high));
}

/**
 * Centripetal Catmull-Rom continuous tangent interpolation
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
}

export function interpolateCursorPosition(
  points: CursorPoint[],
  currentTime: number,
  offsetMs = 0
): InterpolatedCursor {
  if (!points || points.length === 0) {
    return { x: 0.5, y: 0.5, visible: false };
  }

  // Apply calibration offset (default 0 or user calibrated)
  const targetTime = Math.max(0, currentTime + offsetMs / 1000);

  // If time is before first point
  if (targetTime <= points[0].time) {
    return { x: points[0].x, y: points[0].y, visible: true };
  }

  // If time is after last point
  if (targetTime >= points[points.length - 1].time) {
    const last = points[points.length - 1];
    return { x: last.x, y: last.y, visible: true };
  }

  if (points.length === 1) {
    return { x: points[0].x, y: points[0].y, visible: true };
  }

  // Find surrounding segment via O(log N) binary search
  const i = findNearestPointIndex(points, targetTime);
  const p1 = points[i];
  const p2 = points[Math.min(points.length - 1, i + 1)];

  const span = p2.time - p1.time;
  if (span <= 0.0001) {
    return { x: p1.x, y: p1.y, visible: true };
  }

  const factor = Math.max(0, Math.min(1, (targetTime - p1.time) / span));

  // Multi-point continuous velocity Catmull-Rom spline
  const p0 = points[Math.max(0, i - 1)];
  const p3 = points[Math.min(points.length - 1, i + 2)];

  const x = catmullRom(p0.x, p1.x, p2.x, p3.x, factor);
  const y = catmullRom(p0.y, p1.y, p2.y, p3.y, factor);

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    visible: true,
  };
}

export function drawSyntheticCursor(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  scale = 1.0,
  style: CursorStyleType = 'macos'
): void {
  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.scale(scale, scale);

  if (style === 'macos') {
    // Elegant macOS-style crisp cursor with natural drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 24);
    ctx.lineTo(6, 19);
    ctx.lineTo(11, 28);
    ctx.lineTo(15, 26);
    ctx.lineTo(10, 17);
    ctx.lineTo(18, 17);
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  } else if (style === 'dot') {
    // Modern minimal glowing dot
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else if (style === 'neon') {
    // Neon electric cursor
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 20);
    ctx.lineTo(5, 16);
    ctx.lineTo(9, 23);
    ctx.lineTo(12, 21);
    ctx.lineTo(8, 14);
    ctx.lineTo(15, 14);
    ctx.closePath();

    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // Classic Windows/Neutral
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 20);
    ctx.lineTo(5, 15);
    ctx.lineTo(14, 15);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawClickEffects(
  ctx: CanvasRenderingContext2D,
  clicks: ClickEvent[],
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number,
  effectType: ClickEffectType = 'ripple',
  effectDuration = 0.6,
  offsetX = 0,
  offsetY = 0
): void {
  if (effectType === 'none' || !clicks) return;

  for (const click of clicks) {
    const age = currentTime - click.time;
    if (age >= 0 && age <= effectDuration) {
      const progress = age / effectDuration; // 0 to 1
      const cx = offsetX + click.x * canvasWidth;
      const cy = offsetY + click.y * canvasHeight;

      ctx.save();
      if (effectType === 'ripple') {
        const radius = 6 + progress * 38;
        const alpha = Math.max(0, 1 - progress);

        // Outer ripple
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 3 * (1 - progress);
        ctx.stroke();

        // Inner flash core
        if (progress < 0.3) {
          ctx.beginPath();
          ctx.arc(cx, cy, 5 * (1 - progress / 0.3), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - progress / 0.3)})`;
          ctx.fill();
        }
      } else if (effectType === 'pulse') {
        const radius = 10 + Math.sin(progress * Math.PI) * 20;
        const alpha = Math.max(0, 1 - progress);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.4})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (effectType === 'glow') {
        const radius = 8 + progress * 24;
        const alpha = Math.max(0, 1 - progress);
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 20 * (1 - progress);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.5})`;
        ctx.fill();
      } else if (effectType === 'ring') {
        const radius = 12 + progress * 30;
        const alpha = Math.max(0, 1 - progress);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
