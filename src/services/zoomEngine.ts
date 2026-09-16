import { AppearanceSettings, ClickEvent, CursorPoint, RecordingMetadata, ZoomEasingType, ZoomSegment } from '../types';

export interface ZoomTransform {
  scale: number;
  originX: number; // raw target X (0 to 1)
  originY: number; // raw target Y (0 to 1)
  safeNormX: number; // boundary-clamped camera center X (0 to 1)
  safeNormY: number; // boundary-clamped camera center Y (0 to 1)
  activeSegmentId: string | null;
  progress: number; // 0 to 1
  isTransitioning: boolean;
  transitionDirection: 'in' | 'out' | 'none';
  transitionSpeed: number; // 0 to 1 normalized motion speed for motion blur
  motionBlurEnabled: boolean;
  motionBlurIntensity: number; // 0 to 100
  motionBlurPx: number; // dynamic computed blur pixels
}

// Ultra-smooth quintic smootherstep easing (zero acceleration shock at boundaries)
export function easeInOutSmooth(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

// EaseInOutCubic smooth animation curve
export function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

// EaseOutCubic snappy deceleration curve
export function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

// Spring damped oscillator with subtle natural overshoot
export function easeSpring(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.exp(-c * 5.5) * Math.cos(c * Math.PI * 2.5);
}

// Comprehensive easing evaluator supporting all tweakable curves
export function evaluateEasing(easing: ZoomEasingType | string = 'easeInOut', t: number): number {
  const c = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'easeOut':
      return easeOutCubic(c);
    case 'spring':
      return easeSpring(c);
    case 'cubic':
      return easeInOutCubic(c);
    case 'linear':
      return c;
    case 'easeInOut':
    default:
      return easeInOutSmooth(c);
  }
}

// EaseInOutQuint for ultra-smooth buttery camera motion
export function easeInOutQuint(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 16 * c * c * c * c * c : 1 - Math.pow(-2 * c + 2, 5) / 2;
}

/**
 * Adaptive Zoom Depth (OpenScreen algorithm)
 * Calculates dynamic zoom depth based on distance from center, dwell duration, and click intensity.
 */
export function calculateAdaptiveZoomDepth(
  cursorX: number,
  cursorY: number,
  dwellDuration = 1.2,
  isClick = false,
  baseScale = 1.5
): number {
  const centerDistance = Math.hypot(cursorX - 0.5, cursorY - 0.5);
  // Edge bonus: elements near edges need slightly more zoom to bring them into clear focus
  const edgeBonus = Math.min(centerDistance / 0.7, 1.0) * 0.35;
  // Dwell bonus: longer dwells indicate focused attention or reading
  const dwellBonus = Math.min(dwellDuration / 2.0, 1.0) * 0.35;
  // Click bonus: explicit clicks represent strong focal intents
  const clickBonus = isClick ? 0.15 : 0;

  const depth = baseScale + edgeBonus + dwellBonus + clickBonus;
  return parseFloat(Math.min(2.5, Math.max(1.25, depth)).toFixed(2));
}

interface CandidateEvent {
  time: number;
  x: number;
  y: number;
  isClick: boolean;
  dwellDuration: number;
  weight: number;
}

/**
 * OpenScreen Auto-Zoom Detection Algorithm:
 * - Click telemetry (high priority with 300ms reaction delay)
 * - Cursor dwell detection & velocity filtering (ignores rapid sweeps)
 * - Temporal & spatial grouping (merges nearby interactions into cohesive zooms)
 * - Adaptive zoom depth & safe boundary framing
 */
export function generateAutoZoomSegments(
  metadataOrClicks: RecordingMetadata | ClickEvent[],
  videoDuration: number,
  defaultScale = 1.6,
  zoomDuration = 2.4
): ZoomSegment[] {
  let clicks: ClickEvent[] = [];
  let cursorPoints: CursorPoint[] = [];

  if (Array.isArray(metadataOrClicks)) {
    clicks = metadataOrClicks;
  } else if (metadataOrClicks) {
    clicks = metadataOrClicks.clicks || [];
    cursorPoints = metadataOrClicks.cursor || [];
  }

  const candidates: CandidateEvent[] = [];

  // 1. Process Click Events (High priority)
  clicks.forEach((c) => {
    candidates.push({
      time: c.time,
      x: Math.max(0.05, Math.min(0.95, c.x)),
      y: Math.max(0.05, Math.min(0.95, c.y)),
      isClick: true,
      dwellDuration: 1.5,
      weight: 2.0,
    });
  });

  // 2. Process Cursor Dwell Detection (Medium priority for click-free periods)
  if (cursorPoints.length > 5) {
    let dwellStartIdx = 0;
    let anchorX = cursorPoints[0].x;
    let anchorY = cursorPoints[0].y;

    for (let i = 1; i < cursorPoints.length; i++) {
      const p = cursorPoints[i];
      const distFromAnchor = Math.hypot(p.x - anchorX, p.y - anchorY);
      const dt = p.time - cursorPoints[dwellStartIdx].time;

      if (distFromAnchor > 0.045) {
        // Cursor moved out of dwell radius
        if (dt >= 0.55 && dt <= 8.0) {
          // Valid dwell stretch
          const dwellMidTime = (cursorPoints[dwellStartIdx].time + p.time) / 2;
          // Avoid duplicating near existing clicks
          const hasNearbyClick = clicks.some(
            (c) => Math.abs(c.time - dwellMidTime) < 1.2 && Math.hypot(c.x - anchorX, c.y - anchorY) < 0.15
          );

          if (!hasNearbyClick) {
            candidates.push({
              time: dwellMidTime,
              x: Math.max(0.05, Math.min(0.95, anchorX)),
              y: Math.max(0.05, Math.min(0.95, anchorY)),
              isClick: false,
              dwellDuration: dt,
              weight: 1.0,
            });
          }
        }

        // Reset anchor
        dwellStartIdx = i;
        anchorX = p.x;
        anchorY = p.y;
      }
    }
  }

  if (candidates.length === 0) return [];

  // Sort candidates by time
  candidates.sort((a, b) => a.time - b.time);

  // 3. Temporal & Spatial Grouping (Cluster nearby interactions to prevent twitchy jumping)
  const groupedClusters: CandidateEvent[][] = [];
  let currentCluster: CandidateEvent[] = [];

  candidates.forEach((cand) => {
    if (currentCluster.length === 0) {
      currentCluster.push(cand);
    } else {
      const last = currentCluster[currentCluster.length - 1];
      const timeDelta = cand.time - last.time;
      const spaceDelta = Math.hypot(cand.x - last.x, cand.y - last.y);

      // Group if close in time (< 1.8s) and space (< 0.14 screen distance)
      if (timeDelta < 1.8 && spaceDelta < 0.14) {
        currentCluster.push(cand);
      } else {
        groupedClusters.push(currentCluster);
        currentCluster = [cand];
      }
    }
  });

  if (currentCluster.length > 0) {
    groupedClusters.push(currentCluster);
  }

  // 4. Generate Zoom Segments with 300ms reaction delay & Adaptive Depth
  const segments: ZoomSegment[] = [];

  groupedClusters.forEach((cluster) => {
    const totalWeight = cluster.reduce((sum, c) => sum + c.weight, 0);
    const avgX = cluster.reduce((sum, c) => sum + c.x * c.weight, 0) / totalWeight;
    const avgY = cluster.reduce((sum, c) => sum + c.y * c.weight, 0) / totalWeight;

    const firstTime = cluster[0].time;
    const lastTime = cluster[cluster.length - 1].time;
    const hasClick = cluster.some((c) => c.isClick);
    const maxDwell = Math.max(...cluster.map((c) => c.dwellDuration));

    // 300ms reaction delay before the action
    const startTime = Math.max(0, firstTime - 0.3);
    const clusterSpan = lastTime - firstTime;
    const durationNeeded = Math.max(zoomDuration, clusterSpan + 1.4);
    const endTime = Math.min(videoDuration, startTime + durationNeeded);

    if (endTime - startTime >= 0.7) {
      const adaptiveScale = calculateAdaptiveZoomDepth(avgX, avgY, maxDwell, hasClick, defaultScale);

      segments.push({
        id: `zoom_${Math.round(startTime * 100)}_${Math.random().toString(36).substr(2, 4)}`,
        start: parseFloat(startTime.toFixed(2)),
        end: parseFloat(endTime.toFixed(2)),
        targetX: parseFloat(Math.max(0.08, Math.min(0.92, avgX)).toFixed(3)),
        targetY: parseFloat(Math.max(0.08, Math.min(0.92, avgY)).toFixed(3)),
        scale: adaptiveScale,
        easing: 'easeInOut',
      });
    }
  });

  // 5. Clean overlap & ensure minimum separation between zooms
  const cleanSegments: ZoomSegment[] = [];
  for (const seg of segments) {
    if (cleanSegments.length === 0) {
      cleanSegments.push(seg);
    } else {
      const prev = cleanSegments[cleanSegments.length - 1];
      if (seg.start < prev.end + 0.5) {
        // If they overlap or are too close, merge or extend previous segment
        prev.end = Math.max(prev.end, seg.end);
        // Slightly blend target towards newer action
        prev.targetX = parseFloat(((prev.targetX + seg.targetX) / 2).toFixed(3));
        prev.targetY = parseFloat(((prev.targetY + seg.targetY) / 2).toFixed(3));
        prev.scale = Math.max(prev.scale, seg.scale);
      } else {
        cleanSegments.push(seg);
      }
    }
  }

  return cleanSegments;
}

/**
 * Compute Virtual Camera Transform at a specific timestamp.
 * Includes smooth quintic/cubic easing and mathematical safe-boundary clamping.
 */
export function computeZoomTransformAtTime(
  currentTime: number,
  zoomSegments: ZoomSegment[],
  transitionDuration = 0.45,
  appearance?: Partial<AppearanceSettings>
): ZoomTransform {
  const globalMotionBlur = appearance?.zoomMotionBlur ?? true;
  const globalIntensity = appearance?.zoomMotionBlurIntensity ?? 70;
  const globalEasing = appearance?.zoomEasing || 'easeInOut';

  if (!zoomSegments || zoomSegments.length === 0) {
    return {
      scale: 1.0,
      originX: 0.5,
      originY: 0.5,
      safeNormX: 0.5,
      safeNormY: 0.5,
      activeSegmentId: null,
      progress: 0,
      isTransitioning: false,
      transitionDirection: 'none',
      transitionSpeed: 0,
      motionBlurEnabled: globalMotionBlur,
      motionBlurIntensity: globalIntensity,
      motionBlurPx: 0,
    };
  }

  // Find active or transitioning zoom segment
  for (const seg of zoomSegments) {
    const zoomInStart = Math.max(0, seg.start - transitionDuration);
    const zoomOutEnd = seg.end + transitionDuration;

    if (currentTime >= zoomInStart && currentTime <= zoomOutEnd) {
      let progress = 0;
      let isTransitioning = false;
      let transitionDirection: 'in' | 'out' | 'none' = 'none';
      let transitionSpeed = 0;

      const easingCurve: ZoomEasingType = seg.easing || globalEasing;
      const isMotionBlur = seg.motionBlur ?? globalMotionBlur;
      const blurIntensity = seg.motionBlurIntensity ?? globalIntensity;

      if (currentTime < seg.start) {
        // Phase 1: Smooth Zoom-In Transition
        isTransitioning = true;
        transitionDirection = 'in';
        const rawT = (currentTime - zoomInStart) / transitionDuration;
        const clampedT = Math.max(0, Math.min(1, rawT));
        progress = evaluateEasing(easingCurve, clampedT);

        // Motion speed is derived from instantaneous rate of change
        const dt = 0.02;
        const v = Math.abs(
          evaluateEasing(easingCurve, Math.min(1, clampedT + dt)) -
          evaluateEasing(easingCurve, Math.max(0, clampedT - dt))
        ) / (dt * 2);
        transitionSpeed = Math.min(2.5, v);
      } else if (currentTime >= seg.start && currentTime <= seg.end) {
        // Phase 2: Sustained Hold Phase
        progress = 1.0;
        isTransitioning = false;
        transitionDirection = 'none';
        transitionSpeed = 0;
      } else if (currentTime > seg.end) {
        // Phase 3: Smooth Zoom-Out Transition
        isTransitioning = true;
        transitionDirection = 'out';
        const rawT = (currentTime - seg.end) / transitionDuration;
        const clampedT = Math.max(0, Math.min(1, rawT));
        progress = 1.0 - evaluateEasing(easingCurve, clampedT);

        const dt = 0.02;
        const v = Math.abs(
          evaluateEasing(easingCurve, Math.min(1, clampedT + dt)) -
          evaluateEasing(easingCurve, Math.max(0, clampedT - dt))
        ) / (dt * 2);
        transitionSpeed = Math.min(2.5, v);
      }

      // Compute dynamic optical motion blur pixels
      const motionBlurPx = (isMotionBlur && isTransitioning)
        ? transitionSpeed * (blurIntensity / 100) * 4.5
        : 0;

      // Interpolate current scale
      const curScale = 1.0 + (seg.scale - 1.0) * progress;

      // Target position lerps from neutral center (0.5, 0.5) to (targetX, targetY)
      const curTargetX = 0.5 + (seg.targetX - 0.5) * progress;
      const curTargetY = 0.5 + (seg.targetY - 0.5) * progress;

      // Boundary Safety Clamping:
      const halfVisible = 1 / (2 * Math.max(1.0, curScale));
      const minX = halfVisible;
      const maxX = 1.0 - halfVisible;
      const minY = halfVisible;
      const maxY = 1.0 - halfVisible;

      const safeNormX = Math.max(minX, Math.min(maxX, curTargetX));
      const safeNormY = Math.max(minY, Math.min(maxY, curTargetY));

      return {
        scale: curScale,
        originX: seg.targetX,
        originY: seg.targetY,
        safeNormX,
        safeNormY,
        activeSegmentId: seg.id,
        progress,
        isTransitioning,
        transitionDirection,
        transitionSpeed,
        motionBlurEnabled: isMotionBlur,
        motionBlurIntensity: blurIntensity,
        motionBlurPx,
      };
    }
  }

  return {
    scale: 1.0,
    originX: 0.5,
    originY: 0.5,
    safeNormX: 0.5,
    safeNormY: 0.5,
    activeSegmentId: null,
    progress: 0,
    isTransitioning: false,
    transitionDirection: 'none',
    transitionSpeed: 0,
    motionBlurEnabled: globalMotionBlur,
    motionBlurIntensity: globalIntensity,
    motionBlurPx: 0,
  };
}

/**
 * Apply Virtual Camera matrix to Canvas 2D rendering context.
 * Translates the safe target point directly to the viewport center and scales seamlessly.
 */
export function applyVirtualCameraTransform(
  ctx: CanvasRenderingContext2D,
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number,
  transform: ZoomTransform
): void {
  if (transform.scale <= 1.001) return;

  const viewportCenterX = drawX + drawW / 2;
  const viewportCenterY = drawY + drawH / 2;

  const cameraTargetX = drawX + transform.safeNormX * drawW;
  const cameraTargetY = drawY + transform.safeNormY * drawH;

  // 1. Move canvas to viewport center
  ctx.translate(viewportCenterX, viewportCenterY);
  // 2. Scale virtual camera
  ctx.scale(transform.scale, transform.scale);
  // 3. Move camera to focus target point
  ctx.translate(-cameraTargetX, -cameraTargetY);
}
