import React, { useEffect, useRef, useState } from 'react';
import { Cancel01Icon } from 'hugeicons-react';

interface CountdownBannerProps {
  seconds: number;
  onComplete: () => void;
  onCancel: () => void;
}

export const CountdownBanner: React.FC<CountdownBannerProps> = ({
  seconds,
  onComplete,
  onCancel,
}) => {
  const [count, setCount] = useState<number>(seconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const completedRef = useRef(false);

  useEffect(() => {
    setCount(seconds);
    completedRef.current = false;

    const timer = window.setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          if (!completedRef.current) {
            completedRef.current = true;
            window.setTimeout(() => onCompleteRef.current(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [seconds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (count <= 0) return null;

  return (
    <div
      id="record-countdown-banner"
      role="status"
      aria-live="polite"
      className="absolute top-full right-0 mt-2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-[#232936] text-white border border-slate-700/80 dark:border-white/15 shadow-lg whitespace-nowrap select-none"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#D90000] shrink-0" />
      <span className="text-[11px] font-medium text-zinc-300">Starting in</span>
      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-[#D90000] text-white font-mono font-bold text-xs tabular-nums">
        {count}
      </span>
      <button
        type="button"
        id="btn-cancel-countdown"
        onClick={onCancel}
        aria-label="Cancel countdown (Esc)"
        className="p-0.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Cancel01Icon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
