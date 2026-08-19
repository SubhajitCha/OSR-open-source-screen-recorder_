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
  const ctx = canvas.getContext('2d', { alpha: false });

  let pipConfig = { ...initialPipConfig };
  let animationFrameId: number | null = null;
  let isRunning = true;

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
  canvas.width = 1920;
  canvas.height = 1080;

  const render = () => {
    if (!isRunning || !ctx) return;

    // Detect actual dimensions from screenVideo if available
    if (screenVideo.videoWidth && screenVideo.videoHeight) {
      if (canvas.width !== screenVideo.videoWidth || canvas.height !== screenVideo.videoHeight) {
        canvas.width = screenVideo.videoWidth;
        canvas.height = screenVideo.videoHeight;
      }
      // Draw screen background
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
    } else if (webcamVideo.videoWidth && webcamVideo.videoHeight && !screenStream) {
      // Webcam only mode
      if (canvas.width !== webcamVideo.videoWidth || canvas.height !== webcamVideo.videoHeight) {
        canvas.width = webcamVideo.videoWidth;
        canvas.height = webcamVideo.videoHeight;
      }
      ctx.save();
      if (pipConfig.mirror) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Blank dark placeholder while loading
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw Picture-in-Picture webcam overlay if enabled and screen is also present
    if (pipConfig.enabled && screenStream && webcamStream && webcamVideo.videoWidth && webcamVideo.videoHeight) {
      const cw = canvas.width;
      const ch = canvas.height;

      // Calculate size
      let pipWidth = 320;
      if (pipConfig.size === 'small') pipWidth = cw * 0.16;
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

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6;

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

        // Stroke border
        if (pipConfig.borderWidth > 0) {
          ctx.lineWidth = pipConfig.borderWidth * 2;
          ctx.strokeStyle = pipConfig.borderColor || '#3b82f6';
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
          ctx.strokeStyle = pipConfig.borderColor || '#3b82f6';
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
          ctx.strokeStyle = pipConfig.borderColor || '#3b82f6';
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  };

  render();

  const outputStream = canvas.captureStream(targetFps);

  const updatePipConfig = (newConfig: PipConfig) => {
    pipConfig = { ...newConfig };
  };

  const cleanup = () => {
    isRunning = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
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
