import { AudioSettings, CompositionLayout, PipConfig, RecorderBackgroundConfig, RecordingMode, VideoBookmark, VideoSettings, RecordingMetadata } from '../types';
import { createAudioMixer, AudioMixerController } from './audioMixer';
import { createStreamCompositor, CompositorController } from './streamCompositor';
import { fixWebmDuration } from './webmDurationFixer';
import { CursorTracker } from './cursorTracker';
import { EventTracker, buildRecordingMetadata } from './eventTracker';
import { logbook } from './logbook';

export interface RecorderCallbacks {
  onTimeUpdate: (durationSeconds: number) => void;
  onDataChunk: (bytesTotal: number, currentBitrateMbps: number) => void;
  onStateChange: (state: 'idle' | 'recording' | 'paused' | 'stopped') => void;
  onError: (error: Error) => void;
  onBookmarkAdded: (bookmark: VideoBookmark) => void;
}

export class RecorderEngine {
  private screenStream: MediaStream | null = null;
  private webcamStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private audioMixer: AudioMixerController | null = null;
  private compositor: CompositorController | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private screenRecorder: MediaRecorder | null = null;
  private camRecorder: MediaRecorder | null = null;

  // Phase 1 Telemetry Trackers
  private cursorTracker: CursorTracker = new CursorTracker();
  private eventTracker: EventTracker = new EventTracker();

  private recordedChunks: Blob[] = [];
  private screenChunks: Blob[] = [];
  private camChunks: Blob[] = [];
  private startTime = 0;
  private pausedTime = 0;
  private totalPausedDuration = 0;
  private timerInterval: number | null = null;
  private timerWorker: Worker | null = null;
  private workerBlobUrl: string | null = null;
  private bytesRecorded = 0;
  private bookmarks: VideoBookmark[] = [];

  private isPaused = false;
  private isRecording = false;
  private isStarting = false;

  constructor(private callbacks: RecorderCallbacks) {}

  public async prepareStreams(
    mode: RecordingMode,
    audioSettings: AudioSettings,
    videoSettings: VideoSettings,
    pipConfig: PipConfig,
    existingStreams?: {
      screenStream?: MediaStream | null;
      webcamStream?: MediaStream | null;
      micStream?: MediaStream | null;
    },
    layout: CompositionLayout = 'framed',
    background?: RecorderBackgroundConfig
  ): Promise<{ webcamStream: MediaStream | null; screenStream: MediaStream | null; micStream: MediaStream | null }> {
    if (this.isStarting || this.isRecording) {
      console.warn('RecorderEngine: prepareStreams called while already starting or recording.');
      return { webcamStream: this.webcamStream, screenStream: this.screenStream, micStream: this.micStream };
    }
    this.isStarting = true;
    try {
      this.recordedChunks = [];
      this.bookmarks = [];
      this.bytesRecorded = 0;
      this.totalPausedDuration = 0;
      this.startTime = 0;
      this.pausedTime = 0;

      // 1. Acquire Screen Stream if needed (or reuse existing active preview stream)
      if (mode === 'screen' || mode === 'screen_cam') {
        const hasLiveScreen =
          existingStreams?.screenStream &&
          existingStreams.screenStream.getVideoTracks().some((t) => t.readyState === 'live');

        if (hasLiveScreen && existingStreams?.screenStream) {
          this.screenStream = existingStreams.screenStream;
        } else {
          try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                frameRate: { ideal: videoSettings.fps || 60, max: videoSettings.fps || 60 },
              },
              audio: audioSettings.includeSystemAudio ? true : false,
              preferCurrentTab: false,
              selfBrowserSurface: 'exclude',
              surfaceSwitching: 'include',
              systemAudio: audioSettings.includeSystemAudio ? 'include' : 'exclude',
            } as DisplayMediaStreamOptions);
          } catch (initialErr) {
            // Fallback if browser rejected specific constraint
            try {
              this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: audioSettings.includeSystemAudio ? true : false,
                preferCurrentTab: false,
                selfBrowserSurface: 'exclude',
              } as DisplayMediaStreamOptions);
            } catch (fallbackErr: unknown) {
              const domErr = (fallbackErr || initialErr) as { name?: string; message?: string };
              if (
                domErr?.name === 'NotAllowedError' ||
                domErr?.name === 'AbortError' ||
                domErr?.message?.includes('Permission') ||
                domErr?.message?.includes('denied') ||
                domErr?.message?.includes('cancel')
              ) {
                throw new Error('Screen share was not provided or was cancelled.');
              }
              throw new Error(domErr?.message || 'Screen capture permission was cancelled or not granted.');
            }
          }
        }

        // Handle user clicking native browser "Stop sharing" button
        const videoTrack = this.screenStream?.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            if (this.isRecording) {
              this.stopRecording();
            }
          };
          videoTrack.onmute = () => {
            logbook.addLog('info', 'media', 'Screen capture track muted momentarily (active surface switch or tab shift)');
          };
          videoTrack.onunmute = () => {
            logbook.addLog('info', 'media', 'Screen capture track unmuted (active surface restored)');
          };
        }
      }

      // 2. Acquire Webcam & Mic Streams gracefully
      const needCamera = mode === 'screen_cam' || mode === 'cam_only';
      const needMic = audioSettings.includeMic;

      if (needCamera) {
        const hasLiveWebcam =
          existingStreams?.webcamStream &&
          existingStreams.webcamStream.getVideoTracks().some((t) => t.readyState === 'live');

        if (hasLiveWebcam && existingStreams?.webcamStream) {
          this.webcamStream = existingStreams.webcamStream;
        } else {
          try {
            this.webcamStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: videoSettings.fps || 30, max: 60 },
                facingMode: 'user',
              },
            });
          } catch {
            try {
              this.webcamStream = await navigator.mediaDevices.getUserMedia({
                video: {
                  frameRate: { ideal: videoSettings.fps || 30, max: 60 },
                },
              });
            } catch (err) {
              console.warn('Camera permission denied or device not found:', err);
              if (mode === 'cam_only') {
                throw new Error('Camera permission is required for Camera Only recording.');
              }
            }
          }
        }
      }

      if (needMic) {
        const hasLiveMic =
          existingStreams?.micStream &&
          existingStreams.micStream.getAudioTracks().some((t) => t.readyState === 'live');

        if (hasLiveMic && existingStreams?.micStream) {
          this.micStream = existingStreams.micStream;
        } else {
          try {
            const micConstraints: MediaTrackConstraints = {
              echoCancellation: audioSettings.echoCancellation,
              noiseSuppression: audioSettings.noiseSuppression,
              autoGainControl: audioSettings.autoGainControl,
            };
            if (audioSettings.micDeviceId) {
              micConstraints.deviceId = { exact: audioSettings.micDeviceId };
            }
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: micConstraints });
          } catch {
            try {
              this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err) {
              console.warn('Microphone permission denied or device not found:', err);
            }
          }
        }
      }

      // 3. Setup Web Audio Mixer
      this.audioMixer = createAudioMixer(
        this.micStream,
        this.screenStream,
        audioSettings.micVolume,
        audioSettings.systemVolume
      );

      // 4. Setup Video Stream & Compositor
      let finalVideoStream: MediaStream;

      if (mode === 'audio_only') {
        finalVideoStream = new MediaStream();
      } else if (mode === 'cam_only') {
        finalVideoStream = this.webcamStream || new MediaStream();
      } else if ((mode === 'screen_cam' || mode === 'screen') && this.screenStream) {
        // Compose Screen (+ Camera if available) into resilient worker-driven compositor
        // This guarantees continuous 60/30fps rendering even when switching tabs, windows, or monitors
        this.compositor = createStreamCompositor(
          this.screenStream,
          this.webcamStream,
          pipConfig,
          videoSettings.fps || 60,
          layout,
          background
        );
        finalVideoStream = this.compositor.stream;
      } else {
        finalVideoStream = this.screenStream || this.webcamStream || new MediaStream();
      }

      // Combine video + mixed audio into one final recording MediaStream
      const finalStream = new MediaStream();
      finalVideoStream.getVideoTracks().forEach((track) => finalStream.addTrack(track));

      const hasMicTrack = !!(this.micStream && this.micStream.getAudioTracks().some((t) => t.readyState === 'live'));
      const hasSystemAudioTrack = !!(this.screenStream && this.screenStream.getAudioTracks().some((t) => t.readyState === 'live'));
      const shouldAttachAudio =
        mode === 'audio_only' ||
        (audioSettings.includeMic && hasMicTrack) ||
        (audioSettings.includeSystemAudio && hasSystemAudioTrack);

      if (shouldAttachAudio && this.audioMixer) {
        this.audioMixer.destinationStream.getAudioTracks().forEach((track) => finalStream.addTrack(track));
      }

      const hasAudioInFinalStream = finalStream.getAudioTracks().length > 0;

      // 5. Setup MediaRecorder with robust mimeType fallback
      let mimeType = 'video/webm';
      if (mode === 'audio_only') {
        mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      } else {
        const supportedTypes = hasAudioInFinalStream
          ? [
              videoSettings.codec,
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm;codecs=h264,opus',
              'video/webm',
              'video/mp4;codecs=avc1,mp4a.40.2',
              'video/mp4',
            ]
          : [
              'video/webm;codecs=vp9',
              'video/webm;codecs=vp8',
              'video/webm',
              'video/mp4;codecs=avc1',
              'video/mp4',
              videoSettings.codec,
            ];
        for (const t of supportedTypes) {
          if (t && MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        mimeType,
      };

      if (videoSettings.bitrateMbps > 0 && mode !== 'audio_only') {
        recorderOptions.videoBitsPerSecond = videoSettings.bitrateMbps * 1000000;
      }

      this.mediaRecorder = new MediaRecorder(finalStream, recorderOptions);
      this.recordedChunks = [];

      // Setup secondary isolated recorders if both screen and webcam are active
      if (this.screenStream && this.webcamStream) {
        try {
          const isolatedScreenStream = new MediaStream();
          this.screenStream.getVideoTracks().forEach((track) => isolatedScreenStream.addTrack(track));
          if (shouldAttachAudio && this.audioMixer) {
            this.audioMixer.destinationStream.getAudioTracks().forEach((track) => isolatedScreenStream.addTrack(track));
          }
          this.screenRecorder = new MediaRecorder(isolatedScreenStream, recorderOptions);
          this.screenChunks = [];
          this.screenRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              this.screenChunks.push(ev.data);
            }
          };
        } catch (e) {
          console.warn('Isolated screen recorder not created:', e);
          this.screenRecorder = null;
        }

        try {
          const isolatedCamStream = new MediaStream();
          this.webcamStream.getVideoTracks().forEach((track) => isolatedCamStream.addTrack(track));
          this.camRecorder = new MediaRecorder(isolatedCamStream, { mimeType });
          this.camChunks = [];
          this.camRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              this.camChunks.push(ev.data);
            }
          };
        } catch (e) {
          console.warn('Isolated camera recorder not created:', e);
          this.camRecorder = null;
        }
      } else {
        this.screenRecorder = null;
        this.camRecorder = null;
        this.screenChunks = [];
        this.camChunks = [];
      }

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          this.bytesRecorded += event.data.size;

          const durationSeconds = (Date.now() - this.startTime - this.totalPausedDuration) / 1000;
          const bitrateMbps = durationSeconds > 0 ? (this.bytesRecorded * 8) / (durationSeconds * 1000000) : 0;
          this.callbacks.onDataChunk(this.bytesRecorded, parseFloat(bitrateMbps.toFixed(2)));
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.startTimer();

        // Start event and cursor tracking
        try {
          this.cursorTracker.start();
          this.eventTracker.start();
        } catch (e) {
          console.warn('Telemetry tracker error on start:', e);
        }

        this.callbacks.onStateChange('recording');
        logbook.addLog('info', 'media', `MediaRecorder pipeline engaged (${mimeType})`, {
          digest: `Hardware encoding stream active at ~${videoSettings.bitrateMbps} Mbps, ${videoSettings.fps} FPS.`,
        });
      };

      this.mediaRecorder.onpause = () => {
        this.isPaused = true;
        this.pausedTime = Date.now();
        try {
          this.cursorTracker.pause();
          this.eventTracker.pause();
        } catch {}
        this.callbacks.onStateChange('paused');
        logbook.addLog('info', 'media', 'Recording session paused by user');
      };

      this.mediaRecorder.onresume = () => {
        this.isPaused = false;
        if (this.pausedTime > 0) {
          this.totalPausedDuration += Date.now() - this.pausedTime;
          this.pausedTime = 0;
        }
        try {
          this.cursorTracker.resume();
          this.eventTracker.resume();
        } catch {}
        this.callbacks.onStateChange('recording');
        logbook.addLog('info', 'media', 'Recording session resumed');
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.isPaused = false;
        this.stopTimer();
        this.callbacks.onStateChange('stopped');
        logbook.addLog('info', 'media', `MediaRecorder pipeline finalized (${this.recordedChunks.length} chunks buffered)`);
      };

      this.mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        logbook.addLog('error', 'media', 'MediaRecorder emitted an internal pipeline error', {
          data: e,
          digest: 'MediaRecorder internal stream encoding failure or track discontinuity.',
        });
        this.callbacks.onError(new Error('Recording error occurred'));
      };

      return {
        webcamStream: this.webcamStream,
        screenStream: this.screenStream,
        micStream: this.micStream,
      };
    } catch (err) {
      this.cleanupStreams();
      this.callbacks.onError(err as Error);
      throw err;
    } finally {
      this.isStarting = false;
    }
  }

  public startMediaRecorder(): void {
    if (!this.mediaRecorder) {
      throw new Error('No media streams prepared for recording.');
    }
    if (this.mediaRecorder.state === 'inactive') {
      this.mediaRecorder.start(1000);
    }
    if (this.screenRecorder && this.screenRecorder.state === 'inactive') {
      try {
        this.screenRecorder.start(1000);
      } catch (e) {
        console.warn('screenRecorder start failed:', e);
      }
    }
    if (this.camRecorder && this.camRecorder.state === 'inactive') {
      try {
        this.camRecorder.start(1000);
      } catch (e) {
        console.warn('camRecorder start failed:', e);
      }
    }
  }

  public async startRecording(
    mode: RecordingMode,
    audioSettings: AudioSettings,
    videoSettings: VideoSettings,
    pipConfig: PipConfig
  ): Promise<{ webcamStream: MediaStream | null }> {
    const res = await this.prepareStreams(mode, audioSettings, videoSettings, pipConfig);
    this.startMediaRecorder();
    return { webcamStream: res.webcamStream };
  }

  public pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
    if (this.screenRecorder && this.screenRecorder.state === 'recording') {
      try {
        this.screenRecorder.pause();
      } catch (_) {}
    }
    if (this.camRecorder && this.camRecorder.state === 'recording') {
      try {
        this.camRecorder.pause();
      } catch (_) {}
    }
  }

  public resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
    if (this.screenRecorder && this.screenRecorder.state === 'paused') {
      try {
        this.screenRecorder.resume();
      } catch (_) {}
    }
    if (this.camRecorder && this.camRecorder.state === 'paused') {
      try {
        this.camRecorder.resume();
      } catch (_) {}
    }
  }

  public async stopRecording(flushMs: number = 450): Promise<{
    blob: Blob;
    screenBlob?: Blob;
    camBlob?: Blob;
    duration: number;
    mimeType: string;
    bookmarks: VideoBookmark[];
    metadata: RecordingMetadata;
  }> {
    if (!this.mediaRecorder) {
      throw new Error('No active recorder found');
    }

    if (flushMs > 0 && this.isRecording && !this.isPaused) {
      // Keep stream and compositor active briefly so in-flight OS capture frames
      // (such as moving the mouse and clicking Stop) are rendered and encoded before stopping
      await new Promise((resolve) => setTimeout(resolve, flushMs));
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recorder found'));
        return;
      }

      const mimeType = this.mediaRecorder.mimeType || 'video/webm';
      const durationSeconds = Math.max(1, Math.round((Date.now() - this.startTime - this.totalPausedDuration) / 1000));
      const durationMs = Math.max(1000, Date.now() - this.startTime - this.totalPausedDuration);
      const bookmarks = [...this.bookmarks];

      // Harvest metadata
      const cursorPoints = this.cursorTracker.stop();
      const events = this.eventTracker.stop();
      const metadata = buildRecordingMetadata(cursorPoints, events.clicks, events.keyboard, bookmarks);

      // Stop secondary recorders if active
      if (this.screenRecorder && this.screenRecorder.state !== 'inactive') {
        try {
          if (this.screenRecorder.state === 'recording') {
            this.screenRecorder.requestData();
          }
          this.screenRecorder.stop();
        } catch (_) {}
      }
      if (this.camRecorder && this.camRecorder.state !== 'inactive') {
        try {
          if (this.camRecorder.state === 'recording') {
            this.camRecorder.requestData();
          }
          this.camRecorder.stop();
        } catch (_) {}
      }

      let isFinalized = false;
      const finalize = async () => {
        if (isFinalized) return;
        isFinalized = true;

        const capturedChunks = [...this.recordedChunks];
        const capturedScreenChunks = [...this.screenChunks];
        const capturedCamChunks = [...this.camChunks];

        // Immediately revoke and stop all hardware capture streams so camera/mic/screen indicators vanish instantly
        this.cleanupStreams();

        let fullBlob = new Blob(capturedChunks, { type: mimeType });
        if (fullBlob.size > 0) {
          try {
            // Patch WebM header with accurate duration so video seeks instantly and never freezes
            fullBlob = await fixWebmDuration(fullBlob, durationMs);
          } catch (e) {
            console.warn('WebM duration fix skipped for composite blob:', e);
          }
        }

        let screenBlob: Blob | undefined;
        if (capturedScreenChunks.length > 0) {
          let sBlob = new Blob(capturedScreenChunks, { type: mimeType });
          if (sBlob.size > 0) {
            try {
              sBlob = await fixWebmDuration(sBlob, durationMs);
            } catch (e) {
              console.warn('WebM duration fix skipped for screen track:', e);
            }
            screenBlob = sBlob;
          }
        }

        let camBlob: Blob | undefined;
        if (capturedCamChunks.length > 0) {
          let cBlob = new Blob(capturedCamChunks, { type: mimeType });
          if (cBlob.size > 0) {
            try {
              cBlob = await fixWebmDuration(cBlob, durationMs);
            } catch (e) {
              console.warn('WebM duration fix skipped for camera track:', e);
            }
            camBlob = cBlob;
          }
        }

        this.callbacks.onStateChange('stopped');
        resolve({
          blob: fullBlob,
          screenBlob,
          camBlob,
          duration: durationSeconds,
          mimeType,
          bookmarks,
          metadata,
        });
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          finalize();
        };

        try {
          if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.requestData();
          }
          this.mediaRecorder.stop();
        } catch (e) {
          console.warn('Error stopping mediaRecorder:', e);
          finalize();
        }
      } else {
        finalize();
      }
    });
  }

  public addBookmark(label?: string): VideoBookmark {
    const currentDuration = Math.max(0, (Date.now() - this.startTime - this.totalPausedDuration) / 1000);
    const newBookmark: VideoBookmark = {
      id: 'bm_' + Date.now(),
      timestamp: currentDuration,
      label: label || `Bookmark @ ${Math.floor(currentDuration / 60)}:${Math.floor(currentDuration % 60).toString().padStart(2, '0')}`,
    };
    this.bookmarks.push(newBookmark);
    this.callbacks.onBookmarkAdded(newBookmark);
    return newBookmark;
  }

  public setMicVolume(vol: number): void {
    if (this.audioMixer) {
      this.audioMixer.setMicVolume(vol);
    }
  }

  public setSystemVolume(vol: number): void {
    if (this.audioMixer) {
      this.audioMixer.setSystemVolume(vol);
    }
  }

  public updatePipConfig(config: PipConfig): void {
    if (this.compositor) {
      this.compositor.updatePipConfig(config);
    }
  }

  public getAudioMixer(): AudioMixerController | null {
    return this.audioMixer;
  }

  public getWebcamStream(): MediaStream | null {
    return this.webcamStream;
  }

  private startTimer(): void {
    this.stopTimer();

    let lastChunkRequestTime = Date.now();

    const onTick = () => {
      if (this.isRecording && !this.isPaused) {
        const dur = (Date.now() - this.startTime - this.totalPausedDuration) / 1000;
        this.callbacks.onTimeUpdate(dur);

        // Background Watchdog: Periodically request data chunk if recording to avoid browser buffer stalling
        const now = Date.now();
        if (now - lastChunkRequestTime >= 2000) {
          lastChunkRequestTime = now;
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            try {
              this.mediaRecorder.requestData();
            } catch (_) {}
          }
        }
      }
    };

    // Dedicated unthrottled Web Worker heartbeat for background execution
    try {
      const script = `
        let id = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!id) {
              id = setInterval(function() {
                self.postMessage('tick');
              }, 250);
            }
          } else if (e.data === 'stop') {
            if (id) {
              clearInterval(id);
              id = null;
            }
          }
        };
      `;
      const blob = new Blob([script], { type: 'application/javascript' });
      this.workerBlobUrl = URL.createObjectURL(blob);
      this.timerWorker = new Worker(this.workerBlobUrl);
      this.timerWorker.onmessage = () => onTick();
      this.timerWorker.postMessage('start');
    } catch (_) {
      // Fallback to window.setInterval if Web Worker is unavailable
    }

    this.timerInterval = window.setInterval(onTick, 250);
  }

  private stopTimer(): void {
    if (this.timerWorker) {
      try {
        this.timerWorker.postMessage('stop');
        this.timerWorker.terminate();
      } catch (_) {}
      this.timerWorker = null;
    }
    if (this.workerBlobUrl) {
      URL.revokeObjectURL(this.workerBlobUrl);
      this.workerBlobUrl = null;
    }
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public updateLayoutAndBackground(layout: CompositionLayout, background?: RecorderBackgroundConfig): void {
    if (this.compositor) {
      this.compositor.updateLayoutAndBackground(layout, background);
    }
  }

  public cleanupStreams(): void {
    this.stopTimer();
    this.isRecording = false;
    this.isPaused = false;
    this.isStarting = false;

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        try {
          track.onended = null;
          track.enabled = false;
          track.stop();
        } catch (_) {}
      });
      this.screenStream = null;
    }

    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach((track) => {
        try {
          track.onended = null;
          track.enabled = false;
          track.stop();
        } catch (_) {}
      });
      this.webcamStream = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.onended = null;
          track.enabled = false;
          track.stop();
        } catch (_) {}
      });
      this.micStream = null;
    }

    if (this.compositor) {
      try {
        this.compositor.cleanup();
      } catch (_) {}
      this.compositor = null;
    }

    if (this.audioMixer) {
      try {
        this.audioMixer.cleanup();
      } catch (_) {}
      this.audioMixer = null;
    }

    if (this.mediaRecorder) {
      try {
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach((track) => {
            try {
              track.enabled = false;
              track.stop();
            } catch (_) {}
          });
        }
      } catch (_) {}
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onstart = null;
      this.mediaRecorder.onpause = null;
      this.mediaRecorder.onresume = null;
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.onerror = null;
      if (this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch {
          // ignore
        }
      }
      this.mediaRecorder = null;
    }

    if (this.screenRecorder) {
      this.screenRecorder.ondataavailable = null;
      if (this.screenRecorder.state !== 'inactive') {
        try {
          this.screenRecorder.stop();
        } catch (_) {}
      }
      this.screenRecorder = null;
    }

    if (this.camRecorder) {
      this.camRecorder.ondataavailable = null;
      if (this.camRecorder.state !== 'inactive') {
        try {
          this.camRecorder.stop();
        } catch (_) {}
      }
      this.camRecorder = null;
    }

    this.recordedChunks = [];
    this.screenChunks = [];
    this.camChunks = [];
  }
}
