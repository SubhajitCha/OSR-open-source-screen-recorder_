import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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

  useEffect(() => {
    if (currentCount <= 0) {
      onComplete();
      return;
    }

    // Play a gentle subtle audio beep if possible
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(currentCount === 1 ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted
    }

    const timer = setTimeout(() => {
      setCurrentCount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentCount, onComplete]);

  return (
    <div
      id="countdown-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center justify-center p-10 text-center bg-white border border-gray-200 rounded-3xl shadow-2xl max-w-sm w-full mx-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            id="countdown-number-box"
            className="flex items-center justify-center w-32 h-32 rounded-full border-4 border-red-500 bg-red-50 mb-6 shadow-lg shadow-red-100"
          >
            <span className="text-6xl font-black text-red-600 tracking-tight">
              {currentCount > 0 ? currentCount : 'GO!'}
            </span>
          </motion.div>
        </AnimatePresence>

        <p className="text-base font-bold text-gray-900 mb-1">
          Get ready to record
        </p>
        <p className="text-xs text-gray-500 mb-6">
          Recording starts automatically in {currentCount}s
        </p>

        <button
          id="btn-cancel-countdown"
          onClick={onCancel}
          className="px-5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-all"
        >
          Cancel (Esc)
        </button>
      </div>
    </div>
  );
};
