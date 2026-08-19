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
      osc.frequency.setValueAtTime(currentCount === 1 ? 880 : 520, ctx.currentTime);
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
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = currentCount / totalSeconds;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div
      id="countdown-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/75 backdrop-blur-md transition-all duration-300 select-none animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 text-center bg-white/95 backdrop-blur-xl border border-gray-200/80 rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold tracking-wide">
          <SparklesIcon className="w-3.5 h-3.5 animate-spin" />
          <span>PREPARING RECORDER</span>
        </div>

        {/* Circular Progress & Number Container */}
        <div className="relative flex items-center justify-center w-40 h-40 mb-6">
          {/* Animated SVG Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-100"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-red-500 transition-all duration-1000 ease-linear"
              fill="transparent"
            />
          </svg>

          {/* Pulsating Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentCount}
                initial={{ scale: 0.3, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.5, opacity: 0, y: -10 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                className="flex items-center justify-center w-24 h-24 rounded-full bg-red-50 border border-red-200 shadow-inner"
              >
                <span className="text-5xl font-black text-red-600 tracking-tight font-mono">
                  {currentCount > 0 ? currentCount : 'GO!'}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1">
          Recording starts automatically
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Stay on this tab or switch to the screen you wish to record.
        </p>

        <button
          id="btn-cancel-countdown"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-all cursor-pointer"
        >
          <Cancel01Icon className="w-3.5 h-3.5" />
          <span>Cancel (Esc)</span>
        </button>
      </div>
    </div>
  );
};
