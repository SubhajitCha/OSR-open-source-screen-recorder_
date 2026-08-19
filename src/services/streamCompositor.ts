import { PipConfig } from '../types';

export interface CompositorController {
  outputStream: MediaStream;
  updatePipConfig: (config: PipConfig) => void;
  cleanup: () => void;
}

export function createStreamCompositor(
  screenStream: MediaStream | null,
  webcamStream: MediaStream | null,
  initialPipConfig: PipConfig,
  targetFps = 60
): CompositorController {
  const canvas = document.createElement('canvas');
  // High performance context settings
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
    willReadFrequently: false,
  });

  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
  }

  let pipConfig = { ...initialPipConfig };
  let animationFrameId: number | null = null;
  let intervalTickerId: number | null = null;
  let isRunning = true;
  let lastFrameTime = performance.now();

  let canvasWidth = 1920;
  let canvasHeight = 1080;

  // Screen video element
  const screenVideo = document.createElement('video');
  screenVideo.muted = true;
  screenVideo.playsInline = true;
  screenVideo.autoplay = true;

  if (screenStream) {
    screenVideo.srcObject = screenStream;
    screenVideo.play().catch((e) => console.warn('Screen video play error:', e));
  }

  // Webcam video element
  const webcamVideo = document.createElement('video');
  webcamVideo.muted = true;
  webcamVideo.playsInline = true;
  webcamVideo.autoplay = true;

  if (webcamStream) {
    webcamVideo.srcObject = webcamStream;
    webcamVideo.play().catch((e) => console.warn('Webcam video play error:', e));
  }

  // Default canvas dimensions
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const updateCanvasDimensions = (newWidth: number, newHeight: number) => {
    if (newWidth > 0 && newHeight > 0 && (canvasWidth !== newWidth || canvasHeight !== newHeight)) {
      canvasWidth = newWidth;
      canvasHeight = newHeight;
      canvas.width = newWidth;
      canvas.height = newHeight;
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
      }
    }
  };

  const render = () => {
    if (!isRunning || !ctx) return;
    lastFrameTime = performance.now();

    // 1. Detect actual dimensions from screenVideo if available
    if (screenVideo.videoWidth && screenVideo.videoHeight) {
      updateCanvasDimensions(screenVideo.videoWidth, screenVideo.videoHeight);
      ctx.drawImage(screenVideo, 0, 0, canvasWidth, canvasHeight);
    } else if (webcamVideo.videoWidth && webcamVideo.videoHeight && !screenStream) {
      // Webcam only mode
      updateCanvasDimensions(webcamVideo.videoWidth, webcamVideo.videoHeight);
      ctx.save();
      if (pipConfig.mirror) {
        ctx.translate(canvasWidth, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(webcamVideo, 0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    } else {
      // Blank dark placeholder while loading
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 2. Draw Picture-in-Picture webcam overlay if enabled and screen is also present
    if (pipConfig.enabled && screenStream && webcamStream && webcamVideo.videoWidth && webcamVideo.videoHeight) {
      const cw = canvasWidth;
      const ch = canvasHeight;

      // Calculate size
      let pipWidth = 320;
      if (pipConfig.size === 'small') pipWidth = cw * 0.15;
      else if (pipConfig.size === 'medium') pipWidth = cw * 0.22;
      else if (pipConfig.size === 'large') pipWidth = cw * 0.30;

      // Constrain pip size
      pipWidth = Math.max(160, Math.min(pipWidth, cw * 0.45));
      const pipHeight = (pipWidth * webcamVideo.videoHeight) / webcamVideo.videoWidth;

      const padding = 28;
      let x = cw - pipWidth - padding;
      let y = ch - pipHeight - padding;

      if (pipConfig.position === 'top-left') {
        x = padding;
        y = padding;
      } else if (pipConfig.position === 'top-right') {
        x = cw - pipWidth - padding;
        y = padding;
      } else if (pipConfig.position === 'bottom-left') {
        x = padding;
        y = ch - pipHeight - padding;
      } else if (pipConfig.position === 'bottom-right') {
        x = cw - pipWidth - padding;
        y = ch - pipHeight - padding;
      } else if (pipConfig.position === 'custom' && pipConfig.customX !== undefined && pipConfig.customY !== undefined) {
        x = (pipConfig.customX / 100) * (cw - pipWidth);
        y = (pipConfig.customY / 100) * (ch - pipHeight);
      }

      ctx.save();

      if (pipConfig.shape === 'circle') {
        const radius = Math.min(pipWidth, pipHeight) / 2;
        const centerX = x + pipWidth / 2;
        const centerY = y + pipHeight / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw webcam within circle
        ctx.save();
        if (pipConfig.mirror) {
          ctx.translate(centerX, centerY);
          ctx.scale(-1, 1);
          ctx.translate(-centerX, -centerY);
        }
        ctx.drawImage(webcamVideo, x, y, pipWidth, pipHeight);
        ctx.restore();

        // Crisp Border
        if (pipConfig.borderWidth > 0) {
          ctx.lineWidth = pipConfig.borderWidth * 2;
          ctx.strokeStyle = pipConfig.borderColor || '#ffffff';
          ctx.stroke();
        }
      } else if (pipConfig.shape === 'rounded') {
        const cornerRadius = 24;
        ctx.beginPath();
        ctx.roundRect(x, y, pipWidth, pipHeight, cornerRadius);
        ctx.closePath();
        ctx.clip();

        ctx.save();
        if (pipConfig.mirror) {
          ctx.translate(x + pipWidth / 2, y + pipHeight / 2);
          ctx.scale(-1, 1);
          ctx.translate(-(x + pipWidth / 2), -(y + pipHeight / 2));
        }
        ctx.drawImage(webcamVideo, x, y, pipWidth, pipHeight);
        ctx.restore();

        if (pipConfig.borderWidth > 0) {
          ctx.lineWidth = pipConfig.borderWidth * 2;
          ctx.strokeStyle = pipConfig.borderColor || '#ffffff';
          ctx.stroke();
        }
      } else {
        // Square
        ctx.beginPath();
        ctx.rect(x, y, pipWidth, pipHeight);
        ctx.closePath();
        ctx.clip();

        ctx.save();
        if (pipConfig.mirror) {
          ctx.translate(x + pipWidth / 2, y + pipHeight / 2);
          ctx.scale(-1, 1);
          ctx.translate(-(x + pipWidth / 2), -(y + pipHeight / 2));
        }
        ctx.drawImage(webcamVideo, x, y, pipWidth, pipHeight);
        ctx.restore();

        if (pipConfig.borderWidth > 0) {
          ctx.lineWidth = pipConfig.borderWidth * 2;
          ctx.strokeStyle = pipConfig.borderColor || '#ffffff';
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  };

  // Main RAF rendering loop
  const rafLoop = () => {
    if (!isRunning) return;
    render();
    animationFrameId = requestAnimationFrame(rafLoop);
  };

  rafLoop();

  // Background watchdog ticker: if requestAnimationFrame stalls (e.g. user focused another window/app),
  // this timer ensures the canvas is continuously rendered and captureStream never freezes or pauses
  const frameIntervalMs = Math.round(1000 / targetFps);
  intervalTickerId = window.setInterval(() => {
    if (!isRunning) return;
    const now = performance.now();
    // If > 25ms has elapsed without a RAF frame, render immediately
    if (now - lastFrameTime > Math.max(25, frameIntervalMs * 1.5)) {
      render();
    }
  }, Math.max(16, frameIntervalMs));

  const outputStream = canvas.captureStream(targetFps);

  const updatePipConfig = (newConfig: PipConfig) => {
    pipConfig = { ...newConfig };
  };

  const cleanup = () => {
    isRunning = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    if (intervalTickerId !== null) {
      clearInterval(intervalTickerId);
    }
    screenVideo.srcObject = null;
    webcamVideo.srcObject = null;
  };

  return {
    outputStream,
    updatePipConfig,
    cleanup,
  };
}
