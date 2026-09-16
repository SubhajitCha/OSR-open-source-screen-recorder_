import { Project } from '../types';
import { extractCutSegments, extractZoomSegments } from './editorEngine';
import { fixWebmDuration } from './webmDurationFixer';
import { drawCompositionScene } from './layoutRenderer';

export interface ExportProgress {
  progress: number; // 0 to 100
  renderedSeconds: number;
  totalSeconds: number;
  stage: 'preparing' | 'rendering' | 'finalizing' | 'done' | 'error';
  errorMessage?: string;
}

export interface ExportOptions {
  resolutionPreset: 'native' | '4k' | '1080p' | '720p';
  fps: number;
  bitrateMbps: number;
  format: 'webm' | 'mp4';
}

export async function renderProjectToVideo(
  project: Project,
  options: ExportOptions,
  onProgress: (prog: ExportProgress) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress({
        progress: 0,
        renderedSeconds: 0,
        totalSeconds: project.source.duration,
        stage: 'preparing',
      });

      // 1. Create screen video element
      const mainBlob = project.source.screenBlob || project.source.videoBlob;
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(mainBlob);
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('Failed to load screen video source for export'));
      });

      // Camera video element if multi-track
      let camVideo: HTMLVideoElement | null = null;
      let camVideoUrl: string | null = null;
      if (project.source.camBlob) {
        camVideo = document.createElement('video');
        camVideoUrl = URL.createObjectURL(project.source.camBlob);
        camVideo.src = camVideoUrl;
        camVideo.muted = true;
        camVideo.playsInline = true;
        camVideo.preload = 'auto';

        await new Promise<void>((res) => {
          if (!camVideo) {
            res();
            return;
          }
          camVideo.onloadedmetadata = () => res();
          camVideo.onerror = () => {
            console.warn('Camera video failed to load for export, continuing with screen only');
            res();
          };
        });
      }

      const srcWidth = video.videoWidth || project.source.width || 1920;
      const srcHeight = video.videoHeight || project.source.height || 1080;

      // 2. Determine target canvas dimensions
      let outWidth = srcWidth;
      let outHeight = srcHeight;

      if (options.resolutionPreset === '1080p') {
        outWidth = 1920;
        outHeight = 1080;
      } else if (options.resolutionPreset === '4k') {
        outWidth = 3840;
        outHeight = 2160;
      } else if (options.resolutionPreset === '720p') {
        outWidth = 1280;
        outHeight = 720;
      }

      // Aspect ratio adjustments
      const ar = project.appearance.aspectRatio;
      if (ar === '9:16') {
        outWidth = Math.round((outHeight * 9) / 16);
      } else if (ar === '1:1') {
        outWidth = outHeight;
      } else if (ar === '4:3') {
        outWidth = Math.round((outHeight * 4) / 3);
      }

      // 3. Setup canvas & 2D context
      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Canvas 2D context creation failed');
      }

      // 4. Setup MediaStream and MediaRecorder from Canvas
      const fps = options.fps || 60;
      const canvasStream = canvas.captureStream(fps);

      // Extract original audio track if present
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioSource = audioCtx.createMediaElementSource(video);
      const audioDest = audioCtx.createMediaStreamDestination();
      audioSource.connect(audioDest);

      const audioTracks = audioDest.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]);
      }

      const mimeType =
        options.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')
          ? 'video/mp4;codecs=avc1,mp4a.40.2'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: (options.bitrateMbps || 12) * 1000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const zoomSegments = extractZoomSegments(project.timeline);
      const cutSegments = extractCutSegments(project.timeline);
      const metadata = project.metadata || { cursor: [], clicks: [], keyboard: [], bookmarks: [] };

      const trimStart = project.source.trimStart ?? 0;
      const trimEnd = project.source.trimEnd ?? project.source.duration;

      // Calculate effective exported duration (excluding cuts & trimmed areas)
      let effectiveDuration = Math.max(0.5, trimEnd - trimStart);
      cutSegments.forEach((cut) => {
        if (cut.end > trimStart && cut.start < trimEnd) {
          const overlapStart = Math.max(trimStart, cut.start);
          const overlapEnd = Math.min(trimEnd, cut.end);
          effectiveDuration -= Math.max(0, overlapEnd - overlapStart);
        }
      });
      effectiveDuration = Math.max(1, effectiveDuration);

      recorder.start(500);

      onProgress({
        progress: 5,
        renderedSeconds: 0,
        totalSeconds: effectiveDuration,
        stage: 'rendering',
      });

      // Play video through rendering loop from trimStart
      video.currentTime = trimStart;
      video.playbackRate = 1.0;
      await video.play();

      if (camVideo) {
        camVideo.currentTime = trimStart;
        camVideo.playbackRate = 1.0;
        camVideo.play().catch(() => {});
      }

      let isCancelled = false;
      let lastCheckTime = performance.now();

      const renderFrame = () => {
        if (isCancelled) return;

        let currentTime = video.currentTime;

        // Check if current time falls in a cut
        for (const cut of cutSegments) {
          if (currentTime >= cut.start && currentTime < cut.end) {
            video.currentTime = cut.end + 0.05;
            if (camVideo) {
              camVideo.currentTime = cut.end + 0.05;
            }
            currentTime = video.currentTime;
            break;
          }
        }

        if (camVideo && Math.abs(camVideo.currentTime - currentTime) > 0.25) {
          camVideo.currentTime = currentTime;
        }

        if (video.ended || currentTime >= trimEnd - 0.05) {
          finishExport();
          return;
        }

        // Draw Frame using Shared Multi-Track Layout Renderer
        drawCompositionScene({
          ctx,
          width: outWidth,
          height: outHeight,
          screenVideo: video,
          camVideo,
          currentTime,
          project,
          zoomSegments,
          metadata,
        });

        // Progress notification
        const now = performance.now();
        if (now - lastCheckTime > 250) {
          lastCheckTime = now;
          const prog = Math.min(95, Math.round((currentTime / project.source.duration) * 90) + 5);
          onProgress({
            progress: prog,
            renderedSeconds: Math.round(currentTime),
            totalSeconds: Math.round(project.source.duration),
            stage: 'rendering',
          });
        }

        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);

      const finishExport = async () => {
        isCancelled = true;
        video.pause();
        if (camVideo) {
          camVideo.pause();
        }

        onProgress({
          progress: 96,
          renderedSeconds: Math.round(effectiveDuration),
          totalSeconds: Math.round(effectiveDuration),
          stage: 'finalizing',
        });

        recorder.onstop = async () => {
          URL.revokeObjectURL(videoUrl);
          if (camVideoUrl) {
            URL.revokeObjectURL(camVideoUrl);
          }
          audioCtx.close().catch(() => {});

          let finalBlob = new Blob(chunks, { type: mimeType });
          try {
            finalBlob = await fixWebmDuration(finalBlob, effectiveDuration * 1000);
          } catch {
            // ignore
          }

          onProgress({
            progress: 100,
            renderedSeconds: Math.round(effectiveDuration),
            totalSeconds: Math.round(effectiveDuration),
            stage: 'done',
          });

          resolve(finalBlob);
        };

        try {
          recorder.stop();
        } catch {
          const finalBlob = new Blob(chunks, { type: mimeType });
          resolve(finalBlob);
        }
      };
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Export rendering failed';
      onProgress({
        progress: 0,
        renderedSeconds: 0,
        totalSeconds: 0,
        stage: 'error',
        errorMessage: msg,
      });
      reject(err);
    }
  });
}
