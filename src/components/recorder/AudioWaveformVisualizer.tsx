import React, { useEffect, useRef, useState } from 'react';
import { Mic01Icon, MicOff01Icon, SparklesIcon } from 'hugeicons-react';

interface AudioWaveformVisualizerProps {
  stream: MediaStream | null;
  isRecording?: boolean;
  isMuted?: boolean;
  onEnableMic?: () => void;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  stream,
  isRecording = false,
  isMuted = false,
  onEnableMic,
}) => {
  const [bars, setBars] = useState<number[]>(new Array(36).fill(12));
  const [decibels, setDecibels] = useState<number>(-60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || isMuted) {
      setIsActive(false);
      // Fallback breathing animation
      let step = 0;
      const breathingInterval = setInterval(() => {
        step += 0.15;
        setBars(
          Array.from({ length: 36 }, (_, i) => {
            const centerDist = Math.abs(i - 17.5) / 17.5;
            const wave = Math.sin(step + i * 0.3) * 0.5 + 0.5;
            const baseH = Math.max(8, (1 - centerDist * 0.6) * 28 * wave);
            return Math.round(baseH);
          })
        );
      }, 50);

      return () => {
        clearInterval(breathingInterval);
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
        }
      };
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      setIsActive(true);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const renderLoop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute average volume for dB
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalizedDb = Math.round(-60 + (avg / 255) * 60);
        setDecibels(normalizedDb);

        // Generate 36 symmetrical bars matching Image 2
        const numBars = 36;
        const half = numBars / 2;
        const newHeights: number[] = new Array(numBars).fill(8);

        for (let i = 0; i < half; i++) {
          const binIdx = Math.min(dataArray.length - 1, Math.floor((i / half) * (dataArray.length * 0.75)));
          const rawVal = dataArray[binIdx] || 0;
          // Scale height from 8px to 96px
          const barHeight = Math.max(8, Math.min(96, Math.round((rawVal / 255) * 88 + 8)));
          newHeights[half - 1 - i] = barHeight;
          newHeights[half + i] = barHeight;
        }

        setBars(newHeights);
        animIdRef.current = requestAnimationFrame(renderLoop);
      };

      renderLoop();
    } catch (err) {
      console.warn('AudioWaveformVisualizer setup error:', err);
    }

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (_) {}
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (_) {}
        analyserRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [stream, isMuted]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#18181B] via-[#131316] to-[#0D0D0F] flex flex-col items-center justify-center p-6 text-white relative select-none overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-white/[0.03] blur-3xl rounded-full" />
      </div>

      {/* Top Status Pill */}
      <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md mb-6">
        <span
          className={`w-2 h-2 rounded-full ${
            isActive && !isMuted ? 'bg-orange-400 animate-pulse' : 'bg-amber-400'
          }`}
        />
        <span className="text-xs font-semibold text-zinc-300">
          {isMuted
            ? 'Microphone Muted'
            : isActive
            ? 'Live Microphone Audio Feed'
            : 'Audio Only Recording Mode'}
        </span>
        {isActive && !isMuted && (
          <span className="text-[10px] font-mono text-zinc-400 pl-1 border-l border-white/10">
            {decibels} dB
          </span>
        )}
      </div>

      {/* Hero Real-time Waveform Bars (Matching Image 2) */}
      <div className="relative z-10 w-full max-w-xl h-36 flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2">
        {bars.map((height, idx) => (
          <div
            key={idx}
            className="w-1.5 sm:w-2 bg-white rounded-full transition-all duration-75 ease-out shadow-sm"
            style={{
              height: `${height}px`,
              opacity: isMuted ? 0.3 : Math.max(0.4, Math.min(1, height / 70)),
            }}
          />
        ))}
      </div>

      {/* Bottom Subtitle / Controls */}
      <div className="relative z-10 mt-6 flex flex-col items-center text-center space-y-2">
        {!stream ? (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-xs text-zinc-400 max-w-sm">
              Click below to grant microphone access for crystal clear studio voice capture.
            </p>
            {onEnableMic && (
              <button
                type="button"
                onClick={onEnableMic}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-medium text-xs transition-all border border-white/15 shadow-md cursor-pointer"
              >
                <Mic01Icon className="w-4 h-4 text-zinc-300" />
                <span>Enable Microphone</span>
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            {isRecording
              ? 'Recording voice audio... Speak naturally into your microphone.'
              : 'Voice input detected and ready. Press Record to start.'}
          </p>
        )}
      </div>
    </div>
  );
};
