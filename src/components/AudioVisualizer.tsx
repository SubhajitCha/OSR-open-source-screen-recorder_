import React, { useEffect, useRef } from 'react';
import { AudioMixerController } from '../services/audioMixer';

interface AudioVisualizerProps {
  mixer: AudioMixerController | null;
  isActive: boolean;
  barCount?: number;
  height?: number;
  showPeakMeter?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mixer,
  isActive,
  barCount = 18,
  height = 32,
  showPeakMeter = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dataArray = new Uint8Array(32);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (isActive && mixer) {
        mixer.getAudioData(dataArray);
      } else {
        dataArray.fill(0);
      }

      // Draw bars
      const barWidth = (w - (barCount - 1) * 3) / barCount;
      let total = 0;

      for (let i = 0; i < barCount; i++) {
        // Map frequency bins
        const binIndex = Math.floor((i / barCount) * (dataArray.length / 2));
        const val = isActive ? dataArray[binIndex] || 0 : 4;
        total += val;

        const barHeight = Math.max(3, (val / 255) * h);
        const x = i * (barWidth + 3);
        const y = h - barHeight;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        if (val > 200) {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(0.7, '#f59e0b');
          grad.addColorStop(1, '#ef4444');
        } else if (val > 100) {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(1, '#34d399');
        } else {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(1, '#6ee7b7');
        }

        ctx.fillStyle = isActive ? grad : '#E5E7EB';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      // Peak meter logic
      const avg = total / barCount;
      if (avg > peakRef.current) {
        peakRef.current = avg;
      } else {
        peakRef.current = Math.max(0, peakRef.current - 1.5);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mixer, isActive, barCount]);

  return (
    <div id="audio-visualizer-container" className="flex items-center gap-2">
      <canvas
        id="audio-visualizer-canvas"
        ref={canvasRef}
        width={140}
        height={height}
        className="rounded"
      />
      {showPeakMeter && (
        <div id="audio-peak-meter" className="flex flex-col gap-0.5 w-1.5 h-7 justify-end bg-gray-200 rounded overflow-hidden">
          <div
            id="audio-peak-fill"
            className={`w-full transition-all duration-75 rounded ${
              peakRef.current > 180 ? 'bg-red-500' : peakRef.current > 100 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ height: `${Math.min(100, (peakRef.current / 200) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};
