export async function captureVideoSnapshot(
  videoBlob: Blob,
  timestamp: number
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      video.currentTime = Math.max(0, Math.min(timestamp, video.duration || 0));
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas 2D context'));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve({ dataUrl, blob });
          } else {
            reject(new Error('Failed to export canvas snapshot to Blob'));
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Video loading error during snapshot capture: ' + e));
    };
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveWithFileSystemApi(blob: Blob, suggestedName: string): Promise<boolean> {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const ext = suggestedName.endsWith('.webm') ? 'webm' : suggestedName.endsWith('.mp4') ? 'mp4' : 'webm';
      const fileHandle = await (window as unknown as {
        showSaveFilePicker: (options: {
          suggestedName: string;
          types: Array<{ description: string; accept: Record<string, string[]> }>;
        }) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: ext === 'webm' ? 'WebM Video' : 'MP4 Video',
            accept: {
              [blob.type || `video/${ext}`]: [`.${ext}`],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return false; // User cancelled
      }
      console.warn('File System Access API failed, falling back to download:', err);
    }
  }

  // Fallback to standard browser download
  downloadBlob(blob, suggestedName);
  return true;
}

export async function trimVideoClientSide(
  sourceBlob: Blob,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(sourceBlob);
    video.src = url;
    video.muted = false;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      try {
        const duration = endTime - startTime;
        if (duration <= 0) {
          URL.revokeObjectURL(url);
          resolve(sourceBlob);
          return;
        }

        const stream = (video as unknown as { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream
          ? (video as unknown as { captureStream: () => MediaStream }).captureStream()
          : null;

        if (!stream) {
          // Fallback if captureStream isn't supported on media element
          URL.revokeObjectURL(url);
          resolve(sourceBlob);
          return;
        }

        const mimeType = sourceBlob.type || 'video/webm';
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm' });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          URL.revokeObjectURL(url);
          const trimmedBlob = new Blob(chunks, { type: mimeType });
          resolve(trimmedBlob);
        };

        video.currentTime = startTime;

        video.onseeked = () => {
          recorder.start(100);
          video.play();

          const progressInterval = setInterval(() => {
            if (video.currentTime >= endTime || video.paused || video.ended) {
              clearInterval(progressInterval);
              video.pause();
              recorder.stop();
            } else {
              const currentProgress = (video.currentTime - startTime) / duration;
              if (onProgress) onProgress(Math.min(Math.max(currentProgress, 0), 1));
            }
          }, 50);
        };
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video for trimming'));
    };
  });
}
