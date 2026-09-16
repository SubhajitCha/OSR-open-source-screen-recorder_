import React from 'react';
import { ComputerIcon, Cancel01Icon } from 'hugeicons-react';
import { RecorderAspectRatio } from '../../../types';

interface SizePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: RecorderAspectRatio;
  onSelectAspectRatio: (ratio: RecorderAspectRatio) => void;
}

export const SizePopover: React.FC<SizePopoverProps> = ({
  isOpen,
  onClose,
  aspectRatio,
  onSelectAspectRatio,
}) => {
  if (!isOpen) return null;

  const ratios: { id: RecorderAspectRatio; title: string; subtitle: string; icon: string }[] = [
    {
      id: '16:9',
      title: '16:9 Landscape',
      subtitle: 'Standard YouTube, Web & Desktop',
      icon: '▭',
    },
    {
      id: '9:16',
      title: '9:16 Vertical',
      subtitle: 'Shorts, TikTok, Reels, Stories',
      icon: '▯',
    },
    {
      id: '1:1',
      title: '1:1 Square',
      subtitle: 'Instagram Feed & Social Posts',
      icon: '▢',
    },
    {
      id: '4:5',
      title: '4:5 Portrait',
      subtitle: 'Social Media & Mobile Feed',
      icon: '▮',
    },
    {
      id: '4:3',
      title: '4:3 Standard',
      subtitle: 'Legacy displays & presentation slides',
      icon: '▭',
    },
  ];

  return (
    <div
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 bg-white dark:bg-[#151718] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <ComputerIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-zinc-200">
            Aspect Ratio Size
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

      <div className="space-y-1.5">
        {ratios.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectAspectRatio(item.id);
              onClose();
            }}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              aspectRatio === item.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs'
                : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
            }`}
          >
            <span className="text-base font-mono">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block truncate">{item.title}</span>
              <span
                className={`text-[10px] block truncate ${
                  aspectRatio === item.id ? 'text-zinc-300 dark:text-zinc-600' : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                {item.subtitle}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
