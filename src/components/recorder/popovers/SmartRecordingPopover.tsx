import React from 'react';
import { SparklesIcon, Cancel01Icon, Tick01Icon } from 'hugeicons-react';
import { SmartRecordingConfig } from '../../../types';

interface SmartRecordingPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  smartConfig: SmartRecordingConfig;
  onUpdateSmartConfig: (updates: Partial<SmartRecordingConfig>) => void;
  placement?: 'top' | 'left';
}

export const SmartRecordingPopover: React.FC<SmartRecordingPopoverProps> = ({
  isOpen,
  onClose,
  smartConfig,
  onUpdateSmartConfig,
  placement = 'left',
}) => {
  if (!isOpen) return null;

  const positionClass =
    placement === 'left'
      ? 'absolute right-full mr-3.5 bottom-0'
      : 'absolute bottom-full mb-3 left-1/2 -translate-x-1/2';

  return (
    <div
      className={`${positionClass} w-80 max-h-[85vh] overflow-y-auto bg-white dark:bg-[#151718] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-zinc-200">
            Smart Studio FX
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Cancel01Icon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {/* Detect Clicks */}
        <div
          onClick={() =>
            onUpdateSmartConfig({
              detectClicks: !smartConfig.detectClicks,
            })
          }
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
        >
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">
              Mouse Click Ripple FX
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
              Log and highlight cursor clicks with visual animated waves
            </span>
          </div>
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center ${
              smartConfig.detectClicks
                ? 'bg-amber-500 text-white'
                : 'border border-slate-300 dark:border-white/20'
            }`}
          >
            {smartConfig.detectClicks && <Tick01Icon className="w-3 h-3 stroke-[3]" />}
          </span>
        </div>

        {/* Smooth Cursor */}
        <div
          onClick={() =>
            onUpdateSmartConfig({
              smoothCursor: !smartConfig.smoothCursor,
            })
          }
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
        >
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">
              Smooth Cursor Motion
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
              Spring-physics interpolation for silky smooth mouse tracking
            </span>
          </div>
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center ${
              smartConfig.smoothCursor
                ? 'bg-amber-500 text-white'
                : 'border border-slate-300 dark:border-white/20'
            }`}
          >
            {smartConfig.smoothCursor && <Tick01Icon className="w-3 h-3 stroke-[3]" />}
          </span>
        </div>

        {/* Automatic Zoom */}
        <div
          onClick={() =>
            onUpdateSmartConfig({
              automaticZoom: !smartConfig.automaticZoom,
            })
          }
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
        >
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">
              Auto-Zoom on Focus
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
              Automatically punch in camera on click hot-spots in editor
            </span>
          </div>
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center ${
              smartConfig.automaticZoom
                ? 'bg-amber-500 text-white'
                : 'border border-slate-300 dark:border-white/20'
            }`}
          >
            {smartConfig.automaticZoom && <Tick01Icon className="w-3 h-3 stroke-[3]" />}
          </span>
        </div>
      </div>
    </div>
  );
};
