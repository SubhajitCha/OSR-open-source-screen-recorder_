import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cancel01Icon } from 'hugeicons-react';

interface CountdownModalProps {
  seconds: number;
  onComplete: () => void;
  onCancel: () => void;
}

// Reusable audio context to avoid re-instantiation overhead on every second
let sharedAudioCtx: AudioContext | null = null;

function playTick(isLast: boolean) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.type = 'sine';
    // 880Hz (A5) for final go tick, 520Hz for countdown ticks
    osc.frequency.setValueAtTime(isLast ? 880 : 520, sharedAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.start();
    osc.stop(sharedAudioCtx.currentTime + 0.12);
  } catch {
    // Graceful silent fallback if browser blocks autoplay
  }
}

export const CountdownModal: React.FC<CountdownModalProps> = ({
  seconds,
  onComplete,
  onCancel,
}) => {
  const [currentCount, setCurrentCount] = useState<number>(seconds);
  const [isDismissed, setIsDismissed] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Play sound for initial number
    playTick(seconds === 1);

    const interval = setInterval(() => {
      setCurrentCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Dismiss the modal overlay from the DOM immediately
          setIsDismissed(true);
          if (!hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            // Trigger completion so parent can flush the clean frame buffer
            setTimeout(() => {
              onCompleteRef.current();
            }, 10);
          }
          return 0;
        }
        const next = prev - 1;
        playTick(next === 1);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  if (isDismissed || currentCount <= 0) {
    return null;
  }

  return (
    <div
      id="countdown-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 select-none pointer-events-auto"
      style={{ willChange: 'opacity' }}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center select-none">
        {/* Simple, Ultra-crisp Countdown Circle */}
        <div className="relative flex items-center justify-center w-36 h-36 mb-5 rounded-full bg-zinc-900/95 border-2 border-white/15 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentCount}
              initial={{ scale: 1.25, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight"
            >
              {currentCount}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Minimal Subtitle */}
        <p className="text-xs sm:text-sm font-medium text-white/70 mb-4 tracking-wide">
          Recording starts automatically...
        </p>

        {/* Snappy Cancel Button */}
        <button
          type="button"
          id="btn-cancel-countdown"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white/80 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all cursor-pointer border border-white/10"
        >
          <Cancel01Icon className="w-3.5 h-3.5" />
          <span>Cancel (Esc)</span>
        </button>
      </div>
    </div>
  );
};

