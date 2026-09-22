import React, { useEffect, useRef, useState } from 'react';
import { Mic01Icon, MicOff01Icon, ArrowDown01Icon } from 'hugeicons-react';

interface MicPulseButtonProps {
  isMicActive: boolean;
  isMicBlocked?: boolean;
  micStream?: MediaStream | null;
  disabled?: boolean;
  onClick: () => void;
  isPopoverOpen: boolean;
  onTogglePopover: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
}

/**
 * MicPulseButton
 * Live frequency-reactive microphone button.
 * Captures real-time audio from the live MediaStream using Web Audio API (AnalyserNode),
 * and dynamically modulates scale, radial glow, and multi-stage harmonic shockwave rings
 * proportional to speech frequency and intensity.
 */
export const MicPulseButton: React.FC<MicPulseButtonProps> = ({
  isMicActive,
  isMicBlocked = false,
  micStream,
  disabled = false,
  onClick,
  isPopoverOpen,
  onTogglePopover,
  size = 'md',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ring1Ref = useRef<HTMLDivElement | null>(null);
  const ring2Ref = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const buttonCoreRef = useRef<HTMLDivElement | null>(null);
  const iconWrapperRef = useRef<HTMLDivElement | null>(null);

  // Audio Context & Analyser refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Track if mic track is actually live and streaming
  const [hasLiveTrack, setHasLiveTrack] = useState<boolean>(false);

  useEffect(() => {
    if (!micStream) {
      setHasLiveTrack(false);
      return;
    }
    const audioTracks = micStream.getAudioTracks();
    const live = audioTracks.some((t) => t.readyState === 'live' && t.enabled);
    setHasLiveTrack(live);

    const handleTrackChange = () => {
      const stillLive = micStream.getAudioTracks().some((t) => t.readyState === 'live' && t.enabled);
      setHasLiveTrack(stillLive);
    };

    audioTracks.forEach((track) => {
      track.addEventListener('ended', handleTrackChange);
      track.addEventListener('mute', handleTrackChange);
      track.addEventListener('unmute', handleTrackChange);
    });

    return () => {
      audioTracks.forEach((track) => {
        track.removeEventListener('ended', handleTrackChange);
        track.removeEventListener('mute', handleTrackChange);
        track.removeEventListener('unmute', handleTrackChange);
      });
    };
  }, [micStream]);

  // Setup Web Audio Analyser when active and micStream is ready
  useEffect(() => {
    // If mic is muted or not active, clean up all audio nodes and reset visual transforms
    if (!isMicActive || !micStream || micStream.getAudioTracks().length === 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
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
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (_) {}
        audioCtxRef.current = null;
      }

      // Reset DOM transforms cleanly
      if (ring1Ref.current) {
        ring1Ref.current.style.transform = 'scale(1)';
        ring1Ref.current.style.opacity = '0';
      }
      if (ring2Ref.current) {
        ring2Ref.current.style.transform = 'scale(1)';
        ring2Ref.current.style.opacity = '0';
      }
      if (glowRef.current) {
        glowRef.current.style.transform = 'scale(1)';
        glowRef.current.style.opacity = '0';
      }
      if (buttonCoreRef.current) {
        buttonCoreRef.current.style.transform = 'scale(1)';
      }
      if (iconWrapperRef.current) {
        iconWrapperRef.current.style.transform = 'scale(1)';
      }
      return;
    }

    let isRunning = true;
    let smoothedEnergy = 0;
    let smoothedCentroid = 0.5;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) return;

      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      // Resume if suspended by browser policy
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const analyser = audioCtx.createAnalyser();
      // fftSize of 128 gives 64 frequency bins with lightning-fast analysis & low CPU
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.45; // Responsive attack with organic follow-through
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(micStream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const freqData = new Uint8Array(bufferLength);

      const renderFrequencyPulse = () => {
        if (!isRunning) return;

        analyser.getByteFrequencyData(freqData);

        // Vocal spectrum: focus on fundamental and formants (~80Hz - 4000Hz, bins 0-20)
        let sum = 0;
        let weightedFreq = 0;
        let totalWeight = 0;
        let peak = 0;

        const maxVocalBin = Math.min(bufferLength, 24);
        for (let i = 0; i < maxVocalBin; i++) {
          const val = freqData[i];
          if (val > peak) peak = val;
          sum += val;
          weightedFreq += val * (i + 1);
          totalWeight += val;
        }

        const avg = sum / maxVocalBin;

        // Dynamic noise gate: filter out quiet ambient room hum (~10/255)
        const gateThreshold = 10;
        const normalized = Math.max(0, avg - gateThreshold) / (160 - gateThreshold);
        const targetEnergy = Math.min(1, Math.max(0, normalized));

        // Frequency centroid (relative pitch distribution of the voice)
        const targetCentroid = totalWeight > 0 ? (weightedFreq / totalWeight) / maxVocalBin : 0.5;

        // Fast attack (immediate reaction when speaking), smooth natural decay
        if (targetEnergy > smoothedEnergy) {
          smoothedEnergy += (targetEnergy - smoothedEnergy) * 0.45;
        } else {
          smoothedEnergy *= 0.86;
        }

        smoothedCentroid += (targetCentroid - smoothedCentroid) * 0.2;

        // Apply hardware-accelerated transforms directly to DOM refs for 60 FPS performance without React re-renders
        if (buttonCoreRef.current) {
          // Button subtly pulses and breathes with voice energy (micro scale max +2.5%)
          const btnScale = 1 + smoothedEnergy * 0.025;
          buttonCoreRef.current.style.transform = `scale(${btnScale.toFixed(4)})`;

          // Vibrant, luminous sage glow shadow proportional to frequency intensity
          const innerSpread = Math.round(8 + smoothedEnergy * 14);
          const outerSpread = Math.round(18 + smoothedEnergy * 20);
          const innerAlpha = (0.45 + smoothedEnergy * 0.35).toFixed(3);
          const outerAlpha = (0.22 + smoothedEnergy * 0.3).toFixed(3);
          buttonCoreRef.current.style.boxShadow = `0 0 ${innerSpread}px rgba(141, 179, 85, ${innerAlpha}), 0 0 ${outerSpread}px rgba(141, 179, 85, ${outerAlpha})`;
        }

        if (iconWrapperRef.current) {
          // Subtle lively bounce on the mic icon itself (max +5%)
          const iconScale = 1 + smoothedEnergy * 0.05;
          iconWrapperRef.current.style.transform = `scale(${iconScale.toFixed(4)})`;
        }

        if (ring1Ref.current) {
          // Primary Harmonic Ring: stays closely fitted around the button (scales only up to ~1.08)
          const r1Scale = 1 + smoothedEnergy * 0.08 + smoothedCentroid * 0.02;
          const r1Opacity = isMicActive ? (0.25 + smoothedEnergy * 0.55) : 0;
          ring1Ref.current.style.transform = `scale(${r1Scale.toFixed(4)})`;
          ring1Ref.current.style.opacity = r1Opacity.toFixed(3);
        }

        if (ring2Ref.current) {
          // Secondary Acoustic Ring: gentle halo (scales only up to ~1.15 max, never overlaps adjacent buttons)
          const r2Scale = 1 + smoothedEnergy * 0.15;
          const r2Opacity = smoothedEnergy > 0.08 ? Math.min(0.35, (smoothedEnergy - 0.08) * 0.45) : 0;
          ring2Ref.current.style.transform = `scale(${r2Scale.toFixed(4)})`;
          ring2Ref.current.style.opacity = r2Opacity.toFixed(3);
        }

        if (glowRef.current) {
          // Luminous Radial Backlight Aura
          const glowScale = 1 + smoothedEnergy * 0.08;
          const glowOpacity = isMicActive ? (0.35 + smoothedEnergy * 0.45).toFixed(3) : '0';
          glowRef.current.style.transform = `scale(${glowScale.toFixed(4)})`;
          glowRef.current.style.opacity = glowOpacity;
        }

        rafRef.current = requestAnimationFrame(renderFrequencyPulse);
      };

      rafRef.current = requestAnimationFrame(renderFrequencyPulse);
    } catch (err) {
      console.warn('Could not initialize audio analyser for mic pulse:', err);
    }

    return () => {
      isRunning = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
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
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (_) {}
        audioCtxRef.current = null;
      }
    };
  }, [isMicActive, micStream, hasLiveTrack]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center isolate">
      {/* 1. SOFT SECONDARY AURA RING */}
      <div
        ref={ring2Ref}
        className="absolute inset-0 rounded-full border border-[#8DB355]/30 bg-[#8DB355]/5 pointer-events-none -z-20 transition-transform duration-75 will-change-transform"
        style={{ transform: 'scale(1)', opacity: 0 }}
      />

      {/* 2. SOFT PRIMARY HARMONIC RING */}
      <div
        ref={ring1Ref}
        className="absolute inset-0 rounded-full border border-[#8DB355]/70 bg-[#8DB355]/15 shadow-[0_0_12px_rgba(141,179,85,0.35)] pointer-events-none -z-10 transition-transform duration-75 will-change-transform"
        style={{ transform: 'scale(1)', opacity: 0 }}
      />

      {/* 3. LUMINOUS RADIAL BACKLIGHT GLOW */}
      <div
        ref={glowRef}
        className={`absolute -inset-1 rounded-full blur-sm pointer-events-none -z-10 transition-opacity duration-150 ${
          isMicActive ? 'bg-[#8DB355]' : 'bg-transparent'
        }`}
        style={{ transform: 'scale(1)', opacity: isMicActive ? 0.35 : 0 }}
      />

      {/* 4. MAIN MIC BUTTON (Switch Toggle) */}
      <button
        type="button"
        onClick={() => {
          // If AudioContext was suspended, wake it up on user gesture
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
          }
          onClick();
        }}
        title={
          isMicBlocked
            ? 'Microphone blocked by browser — click to allow'
            : isMicActive
            ? 'Mute microphone (revokes access)'
            : 'Unmute microphone (requests access)'
        }
        className="group flex flex-col items-center cursor-pointer relative z-10"
      >
        <div
          ref={buttonCoreRef}
          className={`relative ${
            size === 'sm' ? 'w-10 h-10' : 'w-12 h-12 sm:w-13 sm:h-13'
          } rounded-full flex items-center justify-center transition-colors duration-150 shadow-md will-change-transform ${
            isMicBlocked
              ? 'bg-red-500/15 dark:bg-red-950/40 text-red-500 dark:text-red-400 border border-red-500/40 hover:bg-red-500/25'
              : isMicActive
              ? 'bg-[#8DB355] hover:bg-[#7a9d47] text-white shadow-md shadow-[#8DB355]/25'
              : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-500 dark:text-zinc-400 border border-slate-300/80 dark:border-white/10'
          }`}
        >
          <div ref={iconWrapperRef} className="flex items-center justify-center will-change-transform">
            {isMicActive && !isMicBlocked ? (
              <Mic01Icon className={size === 'sm' ? 'w-5 h-5 stroke-[2]' : 'w-5 h-5 sm:w-6 sm:h-6 stroke-[2]'} />
            ) : (
              <MicOff01Icon className={size === 'sm' ? 'w-5 h-5 stroke-[2]' : 'w-5 h-5 sm:w-6 sm:h-6 stroke-[2]'} />
            )}
          </div>
        </div>
      </button>

      {/* 5. DEDICATED CHEVRON DROPDOWN BUTTON FOR MIC DEVICE SELECTION */}
      <button
        type="button"
        title="Choose Microphone Device & Settings"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePopover(e);
        }}
        className={`absolute ${
          size === 'sm' ? '-bottom-0.5 -right-0.5 w-4.5 h-4.5' : '-bottom-0.5 -right-1 w-5 h-5'
        } rounded-full flex items-center justify-center border shadow-xs cursor-pointer hover:scale-115 transition-all z-20 ${
          isPopoverOpen
            ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-950 border-zinc-700 dark:border-white'
            : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-zinc-700'
        }`}
      >
        <ArrowDown01Icon className={size === 'sm' ? 'w-2.5 h-2.5 stroke-[2.5]' : 'w-3 h-3 stroke-[2.5]'} />
      </button>
    </div>
  );
};
