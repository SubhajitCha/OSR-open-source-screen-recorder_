import { AudioSettings, PipConfig, RecordingMode, VideoBookmark, VideoSettings } from '../types';
import { createAudioMixer, AudioMixerController } from './audioMixer';
import { createStreamCompositor, CompositorController } from './streamCompositor';
import { fixWebmDuration } from './webmDurationFixer';

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

  private recordedChunks: Blob[] = [];
  private startTime = 0;
  private pausedTime = 0;
  private totalPausedDuration = 0;
  private timerInterval: number | null = null;
  private bytesRecorded = 0;
  private bookmarks: VideoBookmark[] = [];

  private isPaused = false;
  private isRecording = false;
  private isStarting = false;

  constructor(private callbacks: RecorderCallbacks) {}

  public async startRecording(
    mode: RecordingMode,
    audioSettings: AudioSettings,
    videoSettings: VideoSettings,
    pipConfig: PipConfig
  ): Promise<{ webcamStream: MediaStream | null }> {
    if (this.isStarting || this.isRecording) {
      console.warn('RecorderEngine: startRecording called while already starting or recording.');
      return { webcamStream: this.webcamStream };
    }
    this.isStarting = true;
    try {
      this.cleanupStreams();
      this.recordedChunks = [];
      this.bookmarks = [];
      this.bytesRecorded = 0;
      this.totalPausedDuration = 0;

      // 1. Acquire Screen Stream if needed
      if (mode === 'screen' || mode === 'screen_cam') {
        try {
          this.screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              frameRate: { ideal: videoSettings.fps, max: videoSettings.fps },
              displaySurface: 'monitor',
            },
            audio: audioSettings.includeSystemAudio ? {
              echoCancellation: audioSettings.echoCancellation,
              noiseSuppression: audioSettings.noiseSuppression,
              autoGainControl: audioSettings.autoGainControl,
            } : false,
          });

          // Handle user clicking native browser "Stop sharing" button
          const videoTrack = this.screenStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.onended = () => {
              if (this.isRecording) {
                this.stopRecording();
              }
            };
          }
        } catch (err: unknown) {
          const domErr = err as { name?: string; message?: string };
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

      // 2. Acquire Webcam & Mic Stream with a single combined getUserMedia call
      const needCamera = mode === 'screen_cam' || mode === 'cam_only';
      const needMic = audioSettings.includeMic;

      if (needCamera || needMic) {
        try {
          const constraints: MediaStreamConstraints = {};

          if (needCamera) {
            constraints.video = {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: videoSettings.fps || 60, max: videoSettings.fps || 60 },
              facingMode: 'user',
            };
          }

          if (needMic) {
            const micConstraints: MediaTrackConstraints = {
              echoCancellation: audioSettings.echoCancellation,
              noiseSuppression: audioSettings.noiseSuppression,
              autoGainControl: audioSettings.autoGainControl,
            };
            if (audioSettings.micDeviceId) {
              micConstraints.deviceId = { exact: audioSettings.micDeviceId };
            }
            constraints.audio = micConstraints;
          }

          const combinedStream = await navigator.mediaDevices.getUserMedia(constraints);

          if (needCamera && combinedStream.getVideoTracks().length > 0) {
            this.webcamStream = new MediaStream(combinedStream.getVideoTracks());
          }

          if (needMic && combinedStream.getAudioTracks().length > 0) {
            this.micStream = new MediaStream(combinedStream.getAudioTracks());
          }
        } catch (err) {
          console.warn('Camera/Microphone permission denied or device not found:', err);
          if (mode === 'cam_only') {
            throw new Error('Camera permission is required for Camera Only recording.');
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

      // 4. Setup Video Stream
      let finalVideoStream: MediaStream;

      if (mode === 'audio_only') {
        finalVideoStream = new MediaStream();
      } else if (mode === 'cam_only') {
        // Direct webcam stream
        finalVideoStream = this.webcamStream || new MediaStream();
      } else if (mode === 'screen' || mode === 'screen_cam') {
        // Direct screen stream - captures the user's screen which already includes the live,
        // interactive on-screen DraggableCameraBubble.
        // This delivers native 60fps hardware-accelerated video with zero canvas lag
        // and guarantees exactly ONE camera bubble without duplicate PIP overlays.
        finalVideoStream = this.screenStream || new MediaStream();
      } else {
        finalVideoStream = this.screenStream || this.webcamStream || new MediaStream();
      }

      // Combine video + mixed audio into one final recording MediaStream
      const finalStream = new MediaStream();
      finalVideoStream.getVideoTracks().forEach((track) => finalStream.addTrack(track));
      this.audioMixer.destinationStream.getAudioTracks().forEach((track) => finalStream.addTrack(track));

      // 5. Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported(videoSettings.codec)
        ? videoSettings.codec
        : (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm');

      const recorderOptions: MediaRecorderOptions = {
        mimeType: mode === 'audio_only' ? (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm') : mimeType,
      };

      if (videoSettings.bitrateMbps > 0 && mode !== 'audio_only') {
        recorderOptions.videoBitsPerSecond = videoSettings.bitrateMbps * 1000000;
      }

      this.mediaRecorder = new MediaRecorder(finalStream, recorderOptions);

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
        this.callbacks.onStateChange('recording');
      };

      this.mediaRecorder.onpause = () => {
        this.isPaused = true;
        this.pausedTime = Date.now();
        this.callbacks.onStateChange('paused');
      };

      this.mediaRecorder.onresume = () => {
        this.isPaused = false;
        if (this.pausedTime > 0) {
          this.totalPausedDuration += Date.now() - this.pausedTime;
          this.pausedTime = 0;
        }
        this.callbacks.onStateChange('recording');
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        this.isPaused = false;
        this.stopTimer();
        this.callbacks.onStateChange('stopped');
      };

      this.mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        this.callbacks.onError(new Error('Recording error occurred'));
      };

      // Start recording with 1-second timeslices
      this.mediaRecorder.start(1000);

      return {
        webcamStream: this.webcamStream,
      };
    } catch (err) {
      this.cleanupStreams();
      this.callbacks.onError(err as Error);
      throw err;
    } finally {
      this.isStarting = false;
    }
  }

  public pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  public resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  public async stopRecording(): Promise<{ blob: Blob; duration: number; mimeType: string; bookmarks: VideoBookmark[] }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recorder found'));
        return;
      }

      const mimeType = this.mediaRecorder.mimeType || 'video/webm';
      const durationSeconds = Math.max(1, Math.round((Date.now() - this.startTime - this.totalPausedDuration) / 1000));
      const durationMs = Math.max(1000, Date.now() - this.startTime - this.totalPausedDuration);

      this.mediaRecorder.onstop = async () => {
        let fullBlob = new Blob(this.recordedChunks, { type: mimeType });
        try {
          // Patch WebM header with accurate duration so video seeks instantly and never freezes in VLC/WMP/Chrome
          fullBlob = await fixWebmDuration(fullBlob, durationMs);
        } catch {
          // ignore
        }
        const bookmarks = [...this.bookmarks];
        this.cleanupStreams();
        this.callbacks.onStateChange('stopped');
        resolve({
          blob: fullBlob,
          duration: durationSeconds,
          mimeType,
          bookmarks,
        });
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        let fullBlob = new Blob(this.recordedChunks, { type: mimeType });
        fixWebmDuration(fullBlob, durationMs)
          .then((fixed) => {
            resolve({
              blob: fixed,
              duration: durationSeconds,
              mimeType,
              bookmarks: [...this.bookmarks],
            });
          })
          .catch(() => {
            resolve({
              blob: fullBlob,
              duration: durationSeconds,
              mimeType,
              bookmarks: [...this.bookmarks],
            });
          });
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
    this.timerInterval = window.setInterval(() => {
      if (this.isRecording && !this.isPaused) {
        const dur = (Date.now() - this.startTime - this.totalPausedDuration) / 1000;
        this.callbacks.onTimeUpdate(dur);
      }
    }, 250);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public cleanupStreams(): void {
    this.stopTimer();

    if (this.compositor) {
      this.compositor.cleanup();
      this.compositor = null;
    }

    if (this.audioMixer) {
      this.audioMixer.cleanup();
      this.audioMixer = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach((track) => track.stop());
      this.webcamStream = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }
}
