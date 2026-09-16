import { PipConfig, PipPosition, PipShape, PipSize, CompositionLayout } from '../types';

export interface PipMetrics {
  x: number; // pixel X on stage/canvas
  y: number; // pixel Y on stage/canvas
  width: number; // pixel width on stage/canvas
  height: number; // pixel height on stage/canvas
  size: number; // base size (width) for backward compatibility
  xPct: number; // percentage 0 - 100
  yPct: number; // percentage 0 - 100
  widthPct: number; // percentage of stage width
  heightPct: number; // percentage of stage height
  radiusPx: number; // corner radius in pixels
  shape: PipShape;
  borderWidth: number;
  borderColor: string;
}

/**
 * Calculates unified, mathematically synchronized Picture-in-Picture metrics.
 * Ensures the live preview in RecordingCanvas and the recording compositor in streamCompositor
 * have 100% identical placement, dimensions, aspect ratio, shape, and border.
 */
export function calculatePipMetrics(
  config: PipConfig,
  stageWidth: number,
  stageHeight: number,
  layout: CompositionLayout = 'overlay'
): PipMetrics {
  const safeW = Math.max(100, stageWidth || 1920);
  const safeH = Math.max(100, stageHeight || 1080);
  const shape: PipShape = config.shape || 'rectangle';

  // 1. Determine base width percentage from size preset or custom setting
  let wPct: number;
  if (shape === 'rectangle') {
    // 16:9 widescreen camera preset
    if (config.size === 'small') {
      wPct = 20;
    } else if (config.size === 'large') {
      wPct = 34;
    } else {
      wPct = 26; // medium default
    }
  } else if (shape === 'rounded') {
    // Portrait rounded squircle/card preset (as seen in screenshots: 18% width, 30% height on 16:9)
    if (config.size === 'small') {
      wPct = 14;
    } else if (config.size === 'large') {
      wPct = 24;
    } else {
      wPct = 18; // medium default (matches screenshots)
    }
  } else {
    // 1:1 square or circle preset
    if (config.size === 'small') {
      wPct = 16;
    } else if (config.size === 'large') {
      wPct = 30;
    } else {
      wPct = 22; // medium default
    }
  }

  // If custom width has been explicitly assigned via drag/resize
  if (
    config.position === 'custom' &&
    config.customWidth !== undefined &&
    config.customWidth >= 5 &&
    config.customWidth <= 90
  ) {
    wPct = config.customWidth;
  }

  // 2. Determine height in pixels and percentage based on shape
  let widthPx = Math.round((wPct / 100) * safeW);
  let heightPx: number;

  if (
    config.position === 'custom' &&
    config.customHeight !== undefined &&
    config.customHeight >= 5 &&
    config.customHeight <= 90
  ) {
    heightPx = Math.round((config.customHeight / 100) * safeH);
  } else if (shape === 'rectangle') {
    // Standard 16:9 webcam landscape aspect ratio
    heightPx = Math.round(widthPx * (9 / 16));
  } else if (shape === 'rounded') {
    // Portrait card aspect ratio matching user screenshots (30% height for medium)
    const targetHPct = config.size === 'small' ? 24 : config.size === 'large' ? 38 : 30;
    heightPx = Math.round((targetHPct / 100) * safeH);
  } else {
    // 1:1 circle, rounded squircle, or square
    heightPx = widthPx;
  }

  // Calculate exact height percentage of stage
  const hPct = (heightPx / safeH) * 100;

  // 3. Margin calculations
  let xPct = 0;
  let yPct = 100 - hPct;

  if (config.position === 'custom' && config.customX !== undefined && config.customY !== undefined) {
    // Clamp custom percentages so camera stays inside the canvas
    xPct = Math.max(0, Math.min(100 - wPct, config.customX));
    yPct = Math.max(0, Math.min(100 - hPct, config.customY));
  } else if (layout === 'framed') {
    // Spacing Around layout matching user reference screenshot:
    // Screen is framed with space around it (7% margin).
    // Camera is positioned at the canvas corner with 3.5% margin,
    // overlapping the framed screen edge and resting over the space around.
    const marginX = 3.5;
    const marginY = 3.5;

    switch (config.position) {
      case 'bottom-left':
        xPct = marginX;
        yPct = 100 - hPct - marginY;
        break;
      case 'top-left':
        xPct = marginX;
        yPct = marginY;
        break;
      case 'top-right':
        xPct = 100 - wPct - marginX;
        yPct = marginY;
        break;
      case 'bottom-right':
      default:
        xPct = 100 - wPct - marginX;
        yPct = 100 - hPct - marginY;
        break;
    }
  } else if (layout === 'corner-cam') {
    // Floating Corner layout: screen is full edge-to-edge, camera FLOATS with comfortable inset margin
    const marginX = 2.5;
    const marginY = 2.5;

    switch (config.position) {
      case 'bottom-left':
        xPct = marginX;
        yPct = 100 - hPct - marginY;
        break;
      case 'top-left':
        xPct = marginX;
        yPct = marginY;
        break;
      case 'top-right':
        xPct = 100 - wPct - marginX;
        yPct = marginY;
        break;
      case 'bottom-right':
      default:
        xPct = 100 - wPct - marginX;
        yPct = 100 - hPct - marginY;
        break;
    }
  } else {
    // End to End (overlay) & default: camera sits flush right at the corner edge (0 margin)
    switch (config.position) {
      case 'bottom-left':
        xPct = 0;
        yPct = 100 - hPct;
        break;
      case 'top-left':
        xPct = 0;
        yPct = 0;
        break;
      case 'top-right':
        xPct = 100 - wPct;
        yPct = 0;
        break;
      case 'bottom-right':
      default:
        xPct = 100 - wPct;
        yPct = 100 - hPct;
        break;
    }
  }

  const xPx = Math.round((xPct / 100) * safeW);
  const yPx = Math.round((yPct / 100) * safeH);

  // 4. Calculate corner radius based on shape
  let radiusPx = 0;
  if (shape === 'circle') {
    radiusPx = Math.round(Math.min(widthPx, heightPx) / 2);
  } else if (shape === 'rounded') {
    // 16px corner radius, matching the stage / screen container radius (16px / rounded-2xl)
    const scale = safeW / 1200;
    radiusPx = Math.max(16, Math.round(16 * scale));
  } else if (shape === 'rectangle') {
    radiusPx = 12;
  } else {
    radiusPx = 0; // sharp square
  }

  const borderWidth = config.borderWidth ?? 3;
  const borderColor = config.borderColor || '#38bdf8';

  return {
    x: xPx,
    y: yPx,
    width: widthPx,
    height: heightPx,
    size: widthPx,
    xPct: Math.round(xPct * 10) / 10,
    yPct: Math.round(yPct * 10) / 10,
    widthPct: Math.round(wPct * 10) / 10,
    heightPct: Math.round(hPct * 10) / 10,
    radiusPx,
    shape,
    borderWidth,
    borderColor,
  };
}
