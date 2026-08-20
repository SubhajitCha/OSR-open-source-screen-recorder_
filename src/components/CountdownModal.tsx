import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cancel01Icon, SparklesIcon } from 'hugeicons-react';

interface CountdownModalProps {
  seconds: number;
  onComplete: () => void;
  onCancel: () => void;
}

export const CountdownModal: React.FC<CountdownModalProps> = ({
  seconds,
  onComplete,
  onCancel,
}) => {
  const [currentCount, setCurrentCount] = useState<number>(seconds);
  const totalSeconds = Math.max(1, seconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasTriggeredCompleteRef = useRef(false);

  useEffect(() => {
    if (currentCount <= 0) {
      if (!hasTriggeredCompleteRef.current) {
        hasTriggeredCompleteRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    // Play crisp audio tick
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(currentCount === 1 ? 880 : 580, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // audio context restriction fallback
    }

    const timer = setTimeout(() => {
      setCurrentCount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentCount]);

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

  // Progress circle calculation
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = currentCount / totalSeconds;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div
      id="countdown-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md transition-all duration-300 select-none animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Screenity Decorative ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top badge */}
        <div className="flex items-center gap-1.5 px-3.5 py-1 mb-6 rounded-full bg-blue-50 border border-blue-200/80 text-blue-600 text-xs font-bold tracking-wide">
          <SparklesIcon className="w-3.5 h-3.5 animate-spin" />
          <span>STARTING IN</span>
        </div>

        {/* Circular Progress & Number Container */}
        <div className="relative flex items-center justify-center w-40 h-40 mb-6">
          {/* Animated SVG Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              className="text-slate-100"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              className="text-blue-600 transition-all duration-700 ease-out"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Countdown Digit with Smooth Spring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentCount}
                initial={{ scale: 0.3, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.4, opacity: 0, y: -10 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="text-6xl font-black tracking-tighter text-slate-900 font-mono"
              >
                {currentCount}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Action button */}
        <p className="text-xs text-slate-500 mb-5 max-w-[200px]">
          Get ready! Your screen and camera will start recording automatically.
        </p>

        <button
          id="btn-cancel-countdown"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer border border-slate-200 active:scale-95"
        >
          <Cancel01Icon className="w-3.5 h-3.5" />
          <span>Cancel (Esc)</span>
        </button>
      </div>
    </div>
  );
};
