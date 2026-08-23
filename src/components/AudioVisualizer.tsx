import React, { useEffect, useRef } from 'react';
import { AudioMixerController } from '../services/audioMixer';

interface AudioVisualizerProps {
  stream?: MediaStream | null;
  mixer?: AudioMixerController | null;
  isActive?: boolean;
  className?: string;
  barCount?: number;
  height?: number;
  color?: string;
}

/**
 * Lightweight, Low-CPU Audio Waveform Visualizer
 * - Supports both direct MediaStream and AudioMixerController frequency data without extra AudioContext allocations.
 * - Throttles RAF updates to 30 FPS.
 * - Auto-cleans AudioContext and AnalyserNode on unmount.
 */
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  stream,
  mixer,
  isActive = true,
  className = 'h-12 w-full',
  barCount = 28,
  height: customHeight,
  color = '#2563eb',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If mixer is provided, read frequency data directly from the existing mixer analyzer without creating a second AudioContext!
    if (mixer) {
      if (!isActive) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      let lastDrawTime = 0;
      const targetInterval = 1000 / 30; // 30 FPS
      let isRunning = true;

      const drawFromMixer = (timestamp: number) => {
        if (!isRunning) return;

        if (timestamp - lastDrawTime >= targetInterval) {
          lastDrawTime = timestamp;
          const dataArray = mixer.getFrequencyData();

          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          if (dataArray && dataArray.length > 0) {
            const usableBars = Math.min(barCount, dataArray.length);
            const barWidth = (width / usableBars) * 0.7;
            const gap = (width / usableBars) * 0.3;

            for (let i = 0; i < usableBars; i++) {
              const val = dataArray[i] / 255;
              const barHeight = Math.max(2, val * height * 0.9);
              const x = i * (barWidth + gap);
              const y = height - barHeight;

              ctx.fillStyle = color;
              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(x, y, barWidth, barHeight, 2);
              } else {
                ctx.rect(x, y, barWidth, barHeight);
              }
              ctx.fill();
            }
          }
        }

        if (isRunning) {
          animationFrameRef.current = requestAnimationFrame(drawFromMixer);
        }
      };

      animationFrameRef.current = requestAnimationFrame(drawFromMixer);

      return () => {
        isRunning = false;
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }

    // Direct Stream mode
    if (!stream || stream.getAudioTracks().length === 0 || !isActive) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Low FFT size for minimal CPU overhead
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      let lastDrawTime = 0;
      const targetInterval = 1000 / 30; // 30 FPS cap
      let isRunning = true;

      const draw = (timestamp: number) => {
        if (!isRunning) return;

        if (timestamp - lastDrawTime >= targetInterval) {
          lastDrawTime = timestamp;
          analyser.getByteFrequencyData(dataArray);

          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          const usableBars = Math.min(barCount, bufferLength);
          const barWidth = (width / usableBars) * 0.7;
          const gap = (width / usableBars) * 0.3;

          for (let i = 0; i < usableBars; i++) {
            const val = dataArray[i] / 255;
            const barHeight = Math.max(2, val * height * 0.9);
            const x = i * (barWidth + gap);
            const y = height - barHeight;

            ctx.fillStyle = color;
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(x, y, barWidth, barHeight, 2);
            } else {
              ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
          }
        }

        if (isRunning) {
          animationFrameRef.current = requestAnimationFrame(draw);
        }
      };

      animationFrameRef.current = requestAnimationFrame(draw);

      return () => {
        isRunning = false;
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        try {
          source.disconnect();
          analyser.disconnect();
          if (audioCtx.state !== 'closed') {
            audioCtx.close();
          }
        } catch (_) {}
      };
    } catch (err) {
      console.warn('AudioVisualizer setup error:', err);
    }
  }, [stream, mixer, isActive, barCount, color]);

  return <canvas ref={canvasRef} width={customHeight ? 120 : 280} height={customHeight || 48} className={className} />;
};
