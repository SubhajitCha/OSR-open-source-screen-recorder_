import React, { useState } from 'react';
import { ColorsIcon, Cancel01Icon, SparklesIcon } from 'hugeicons-react';
import { RecorderBackgroundConfig } from '../../../types';
import { BACKGROUND_PRESETS, BackgroundPreset } from '../../../services/backgroundPresets';

interface BackgroundPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  background: RecorderBackgroundConfig;
  onUpdateBackground: (updates: Partial<RecorderBackgroundConfig>) => void;
  placement?: 'top' | 'left';
}

export const BackgroundPopover: React.FC<BackgroundPopoverProps> = ({
  isOpen,
  onClose,
  background,
  onUpdateBackground,
  placement = 'left',
}) => {
  const [activeCategory, setActiveCategory] = useState<'apple' | 'grain' | 'gradient' | 'minimal'>('apple');

  if (!isOpen) return null;

  const categories = [
    { id: 'apple', label: 'Apple', icon: '' },
    { id: 'grain', label: 'Film Grain', icon: '✦' },
    { id: 'gradient', label: 'Gradients', icon: '◈' },
    { id: 'minimal', label: 'Minimal', icon: '◻' },
  ] as const;

  const filteredPresets = BACKGROUND_PRESETS.filter((p) => p.category === activeCategory);

  const positionClass =
    placement === 'left'
      ? 'absolute right-full mr-3.5 bottom-0 max-h-[85vh] overflow-y-auto'
      : 'absolute bottom-full mb-3 left-1/2 -translate-x-1/2';

  return (
    <div
      className={`${positionClass} w-88 max-w-[calc(100vw-120px)] bg-white dark:bg-[#151718] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-[#8DB355]/15 text-[#8DB355]">
            <ColorsIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-zinc-200">
            Studio Backdrops & Wallpapers
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

      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-1 mb-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer truncate text-center ${
              activeCategory === cat.id
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <span className="mr-1 opacity-70">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Preset Palettes Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {filteredPresets.map((p) => {
            const isSelected = background.value === p.value;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onUpdateBackground({
                    type: p.type as RecorderBackgroundConfig['type'],
                    value: p.value,
                  });
                }}
                className={`group relative flex flex-col p-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-[#8DB355] ring-2 ring-[#8DB355]/30 bg-[#8DB355]/5'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/80 dark:bg-white/[0.03]'
                }`}
              >
                {/* Visual Palette Preview */}
                <div
                  className="w-full h-12 rounded-lg shadow-inner relative overflow-hidden border border-black/10 dark:border-white/10"
                  style={{
                    background: p.imageUrl ? `url(${p.imageUrl}) center/cover no-repeat` : p.value,
                  }}
                >
                  {p.badge && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-xs text-[9px] font-medium text-white/95 uppercase tracking-tighter">
                      {p.badge}
                    </div>
                  )}
                  {p.hasGrain && (
                    <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono text-white/90 uppercase tracking-tighter">
                      GRAIN
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-[#8DB355] text-white flex items-center justify-center shadow-md">
                        <span className="text-[10px] font-bold">✓</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {p.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Frame Padding Slider */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
            <span>Stage Border Padding</span>
            <span className="font-mono text-[11px] text-[#8DB355] font-bold">
              {background.padding}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="64"
            step="4"
            value={background.padding}
            onChange={(e) => onUpdateBackground({ padding: Number(e.target.value) })}
            className="w-full accent-[#8DB355] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
