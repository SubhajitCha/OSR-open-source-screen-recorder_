import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface Mp4ConversionProgress {
  progress: number; // 0 to 1
  stage: 'preparing' | 'decoding_audio' | 'encoding_video' | 'encoding_audio' | 'muxing' | 'done' | 'error';
  message?: string;
}

export interface Mp4ConversionOptions {
  duration?: number; // Video duration in seconds if known
  fps?: number;
  bitrateMbps?: number; // Target variable bitrate in Mbps
  bitrateMode?: 'variable' | 'constant';
  audioBitrateKbps?: number;
  onProgress?: (progress: Mp4ConversionProgress) => void;
}

/**
 * Checks if browser has native WebCodecs support for H.264 (AVC) and AAC encoding
 */
export async function isWebCodecsMp4Supported(): Promise<{ video: boolean; audio: boolean; full: boolean }> {
  if (typeof window === 'undefined' || typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') {
    return { video: false, audio: false, full: false };
  }

  let videoSupported = false;
  let audioSupported = false;

  try {
    const videoSupport = await VideoEncoder.isConfigSupported({
      codec: 'avc1.4d002a', // H.264 Main Profile Level 4.2
      width: 1920,
      height: 1080,
      bitrate: 8_000_000,
    });
    videoSupported = !!videoSupport.supported;
  } catch {
    videoSupported = false;
  }

  try {
    const audioSupport = await AudioEncoder.isConfigSupported({
      codec: 'mp4a.40.2', // AAC-LC
      sampleRate: 48000,
      numberOfChannels: 2,
      bitrate: 128_000,
    });
    audioSupported = !!audioSupport.supported;
  } catch {
    audioSupported = false;
  }

  return {
    video: videoSupported,
    audio: audioSupported,
    full: videoSupported && audioSupported,
  };
}

/**
 * Converts a WebM recording blob into a standard H.264 (VBR) + AAC .mp4 file directly in the browser
 */
export async function convertWebmToMp4(
  webmBlob: Blob,
  options: Mp4ConversionOptions = {}
): Promise<Blob> {
  const {
    fps = 30,
    bitrateMbps = 8,
    bitrateMode = 'variable',
    audioBitrateKbps = 128,
    onProgress,
  } = options;

  onProgress?.({ progress: 0.05, stage: 'preparing', message: 'Loading video metadata...' });

  return new Promise(async (resolve, reject) => {
    let videoUrl = '';
    let audioCtx: AudioContext | null = null;
    let videoEncoder: VideoEncoder | null = null;
    let audioEncoder: AudioEncoder | null = null;
    let hasEncoderError = false;
    let encoderErrorMessage = '';

    try {
      videoUrl = URL.createObjectURL(webmBlob);
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';

      await new Promise<void>((res, rej) => {
        if (video.readyState >= 2) {
          res();
          return;
        }
        const onCanPlay = () => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          res();
        };
        const onError = () => {
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          rej(new Error('Failed to load video element for MP4 transcoding'));
        };
        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.load();
      });

      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;

      // Ensure dimensions are even numbers (requirement for H.264 / AVC)
      const targetWidth = width % 2 === 0 ? width : width - 1;
      const targetHeight = height % 2 === 0 ? height : height - 1;

      // 1. Check & Decode Audio Track from the WebM Blob
      onProgress?.({ progress: 0.15, stage: 'decoding_audio', message: 'Extracting and decoding audio stream...' });

      let decodedAudioBuffer: AudioBuffer | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const arrayBuffer = await webmBlob.arrayBuffer();
        decodedAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      } catch (audioErr) {
        console.warn('Audio decoding skipped or no audio track found in recording:', audioErr);
        decodedAudioBuffer = null;
      }

      // Determine finite duration reliably (never allow Infinity)
      let duration = (options.duration && isFinite(options.duration) && options.duration > 0)
        ? options.duration
        : (isFinite(video.duration) && video.duration > 0 ? video.duration : 0);

      // If duration is not yet known or is Infinity, check decoded audio duration
      if ((!isFinite(duration) || duration <= 0) && decodedAudioBuffer && isFinite(decodedAudioBuffer.duration) && decodedAudioBuffer.duration > 0) {
        duration = decodedAudioBuffer.duration;
      }

      // If still not known, probe duration by seeking towards end (Chromium unindexed WebM trick)
      if (!isFinite(duration) || duration <= 0) {
        try {
          video.currentTime = 1e6;
          await new Promise<void>((r) => {
            const onSeekProbe = () => {
              video.removeEventListener('seeked', onSeekProbe);
              r();
            };
            video.addEventListener('seeked', onSeekProbe, { once: true });
            setTimeout(onSeekProbe, 200);
          });
          if (isFinite(video.duration) && video.duration > 0) {
            duration = video.duration;
          } else if (isFinite(video.currentTime) && video.currentTime > 0) {
            duration = video.currentTime;
          }
          video.currentTime = 0;
          await new Promise<void>((r) => {
            const onSeekZero = () => {
              video.removeEventListener('seeked', onSeekZero);
              r();
            };
            video.addEventListener('seeked', onSeekZero, { once: true });
            setTimeout(onSeekZero, 150);
          });
        } catch (_) {}
      }

      // Safe fallback clamp - duration MUST be finite and positive
      if (!isFinite(duration) || duration <= 0) {
        duration = 5;
      }

      const hasAudio = !!decodedAudioBuffer && decodedAudioBuffer.numberOfChannels > 0 && decodedAudioBuffer.length > 0;

      // 2. Configure MP4 Muxer with FastStart
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: {
          codec: 'avc',
          width: targetWidth,
          height: targetHeight,
        },
        audio: hasAudio && decodedAudioBuffer
          ? {
              codec: 'aac',
              numberOfChannels: Math.min(2, decodedAudioBuffer.numberOfChannels),
              sampleRate: decodedAudioBuffer.sampleRate,
            }
          : undefined,
        fastStart: 'in-memory',
      });

      // 3. Setup WebCodecs Video Encoder (H.264 VBR)
      const targetBitrateBps = Math.round(bitrateMbps * 1_000_000);

      // Select candidate H.264 codecs with Baseline as priority for universal compatibility
      const candidateCodecs = [
        'avc1.42001f', // Baseline profile @ level 3.1 - highest universal software/hardware compatibility
        'avc1.4d002a', // Main profile @ level 4.2
        'avc1.640028', // High profile @ level 4.0
        'avc1.42E01E', // Constrained Baseline
      ];

      let selectedVideoCodec = 'avc1.42001f';
      for (const c of candidateCodecs) {
        try {
          const support = await VideoEncoder.isConfigSupported({
            codec: c,
            width: targetWidth,
            height: targetHeight,
            bitrate: targetBitrateBps,
          });
          if (support.supported) {
            selectedVideoCodec = c;
            break;
          }
        } catch {
          // continue
        }
      }

      videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
          muxer.addVideoChunk(chunk, meta);
        },
        error: (e) => {
          console.error('VideoEncoder error:', e);
          hasEncoderError = true;
          encoderErrorMessage = e instanceof Error ? e.message : String(e);
        },
      });

      videoEncoder.configure({
        codec: selectedVideoCodec,
        width: targetWidth,
        height: targetHeight,
        bitrate: targetBitrateBps,
        bitrateMode: bitrateMode,
        framerate: fps,
        latencyMode: 'quality',
      });

      // 4. Setup WebCodecs Audio Encoder (AAC)
      if (hasAudio && decodedAudioBuffer) {
        let audioConfigSupported = false;
        try {
          const check = await AudioEncoder.isConfigSupported({
            codec: 'mp4a.40.2',
            sampleRate: decodedAudioBuffer.sampleRate,
            numberOfChannels: Math.min(2, decodedAudioBuffer.numberOfChannels),
            bitrate: audioBitrateKbps * 1000,
          });
          audioConfigSupported = !!check.supported;
        } catch {
          audioConfigSupported = false;
        }

        if (audioConfigSupported) {
          audioEncoder = new AudioEncoder({
            output: (chunk, meta) => {
              muxer.addAudioChunk(chunk, meta);
            },
            error: (e) => {
              console.warn('AudioEncoder warning:', e);
            },
          });

          audioEncoder.configure({
            codec: 'mp4a.40.2', // AAC-LC
            sampleRate: decodedAudioBuffer.sampleRate,
            numberOfChannels: Math.min(2, decodedAudioBuffer.numberOfChannels),
            bitrate: audioBitrateKbps * 1000,
          });

          // Encode Audio PCM Samples in chunks (1024 samples per frame)
          onProgress?.({ progress: 0.25, stage: 'encoding_audio', message: 'Encoding AAC audio packets...' });

          const sampleRate = decodedAudioBuffer.sampleRate;
          const numChannels = Math.min(2, decodedAudioBuffer.numberOfChannels);
          const totalSamples = decodedAudioBuffer.length;
          const chunkSize = 1024;

          const channelData: Float32Array[] = [];
          for (let ch = 0; ch < numChannels; ch++) {
            channelData.push(decodedAudioBuffer.getChannelData(ch));
          }

          for (let offset = 0; offset < totalSamples; offset += chunkSize) {
            const currentChunkLength = Math.min(chunkSize, totalSamples - offset);
            const planarBuffer = new Float32Array(numChannels * currentChunkLength);

            for (let ch = 0; ch < numChannels; ch++) {
              planarBuffer.set(channelData[ch].subarray(offset, offset + currentChunkLength), ch * currentChunkLength);
            }

            const timestampMicros = Math.round((offset / sampleRate) * 1_000_000);

            const audioData = new AudioData({
              format: 'f32-planar',
              sampleRate: sampleRate,
              numberOfFrames: currentChunkLength,
              numberOfChannels: numChannels,
              timestamp: timestampMicros,
              data: planarBuffer,
            });

            audioEncoder.encode(audioData);
            audioData.close();

            if (audioEncoder.encodeQueueSize > 12) {
              await new Promise<void>((r) => setTimeout(r, 6));
            }
          }

          await audioEncoder.flush();
        }
      }

      // 5. Encode Video Frames (H.264 VBR)
      onProgress?.({ progress: 0.35, stage: 'encoding_video', message: 'Encoding H.264 variable bitrate video...' });

      const needsCanvasResize = width !== targetWidth || height !== targetHeight;
      const canvas = needsCanvasResize ? document.createElement('canvas') : null;
      if (canvas) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;

      const frameInterval = 1 / fps;
      const totalFrames = Math.max(1, Math.round(duration * fps));
      const keyFrameInterval = Math.max(fps * 2, 30); // Keyframe every 2 seconds

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        if (hasEncoderError) {
          throw new Error(`Video encoding aborted: ${encoderErrorMessage}`);
        }

        const frameTime = Math.min(frameIndex * frameInterval, Math.max(0, duration - 0.01));

        if (Math.abs(video.currentTime - frameTime) > 0.008) {
          video.currentTime = frameTime;
          await new Promise<void>((r) => {
            let settled = false;
            const timer = setTimeout(() => {
              if (!settled) {
                settled = true;
                video.removeEventListener('seeked', onSeek);
                r();
              }
            }, 80);

            const onSeek = () => {
              if (!settled) {
                settled = true;
                clearTimeout(timer);
                video.removeEventListener('seeked', onSeek);
                r();
              }
            };
            video.addEventListener('seeked', onSeek, { once: true });
          });
        }

        const timestampMicros = Math.round(frameTime * 1_000_000);
        let videoFrame: VideoFrame;

        if (canvas && ctx) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          videoFrame = new VideoFrame(canvas, { timestamp: timestampMicros });
        } else {
          videoFrame = new VideoFrame(video, { timestamp: timestampMicros });
        }

        const isKeyFrame = frameIndex % keyFrameInterval === 0;
        videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
        videoFrame.close();

        // WebCodecs backpressure: prevent encoder queue overflow
        if (videoEncoder.encodeQueueSize > 6) {
          await new Promise<void>((r) => {
            const poll = () => {
              if (!videoEncoder || videoEncoder.encodeQueueSize <= 2 || hasEncoderError) {
                r();
              } else {
                setTimeout(poll, 8);
              }
            };
            poll();
          });
        }

        // Report progress every 3 frames or on the last frame
        if (frameIndex % 3 === 0 || frameIndex === totalFrames - 1) {
          const framePct = Math.round(((frameIndex + 1) / totalFrames) * 100);
          const videoProgress = 0.35 + ((frameIndex + 1) / totalFrames) * 0.55;
          onProgress?.({
            progress: Math.min(0.92, videoProgress),
            stage: 'encoding_video',
            message: `Encoding H.264 frames (${framePct}%)...`,
          });
        }
      }

      // 6. Finalize Encoders & Muxer
      onProgress?.({ progress: 0.93, stage: 'muxing', message: 'Finalizing MP4 container & FastStart index...' });
      await videoEncoder.flush();

      muxer.finalize();
      const mp4Buffer = target.buffer;
      const mp4Blob = new Blob([mp4Buffer], { type: 'video/mp4' });

      onProgress?.({ progress: 1.0, stage: 'done', message: 'MP4 ready!' });

      // Clean up resources
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioCtx) audioCtx.close().catch(() => {});
      if (videoEncoder && videoEncoder.state !== 'closed') videoEncoder.close();
      if (audioEncoder && audioEncoder.state !== 'closed') audioEncoder.close();

      resolve(mp4Blob);
    } catch (err) {
      console.error('convertWebmToMp4 error:', err);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioCtx) (audioCtx as AudioContext).close().catch(() => {});
      if (videoEncoder) {
        try {
          (videoEncoder as VideoEncoder).close();
        } catch (_) {}
      }
      if (audioEncoder) {
        try {
          (audioEncoder as AudioEncoder).close();
        } catch (_) {}
      }
      reject(err);
    }
  });
}

/**
 * Universal helper that ensures the returned video Blob is an MP4 (H.264 + AAC).
 * If the input is already MP4, it returns immediately.
 * Otherwise, it converts the WebM recording into standard MP4.
 */
export async function ensureMp4Blob(
  videoBlob: Blob,
  options?: Mp4ConversionOptions
): Promise<Blob> {
  // If already MP4 container with valid size, return directly
  if (videoBlob.type.includes('mp4') && videoBlob.size > 0) {
    return videoBlob;
  }

  try {
    const mp4Blob = await convertWebmToMp4(videoBlob, options);
    return mp4Blob;
  } catch (err) {
    console.warn('MP4 conversion fallback, returning original blob:', err);
    return videoBlob;
  }
}
