import React from 'react';
import { TextFontIcon, Cancel01Icon } from 'hugeicons-react';
import { PrompterConfig } from '../../../types';

interface PrompterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  prompter: PrompterConfig;
  onUpdatePrompter: (updates: Partial<PrompterConfig>) => void;
}

export const PrompterPopover: React.FC<PrompterPopoverProps> = ({
  isOpen,
  onClose,
  prompter,
  onUpdatePrompter,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 bg-white dark:bg-[#151718] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <TextFontIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-zinc-200">
            Teleprompter
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

      <div className="space-y-3">
        {/* Enable Prompter Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
            Show Floating Script
          </span>
          <button
            type="button"
            onClick={() => onUpdatePrompter({ enabled: !prompter.enabled })}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              prompter.enabled
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950'
                : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-white/20'
            }`}
          >
            {prompter.enabled ? 'Active' : 'Enable'}
          </button>
        </div>

        {/* Script Text Input */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
            Script / Key Talking Points
          </label>
          <textarea
            rows={4}
            value={prompter.text}
            onChange={(e) => onUpdatePrompter({ text: e.target.value })}
            placeholder="Type or paste your script here..."
            className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none font-sans"
          />
        </div>

        {/* Speed Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
            <span>Scroll Speed</span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
              {prompter.speed}x
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={prompter.speed}
            onChange={(e) => onUpdatePrompter({ speed: Number(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
