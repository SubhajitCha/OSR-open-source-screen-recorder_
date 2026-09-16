import React from 'react';
import { Layers01Icon, Cancel01Icon, CheckmarkCircle01Icon } from 'hugeicons-react';
import { CompositionLayout, RecorderBackgroundConfig } from '../../../types';

interface LayoutPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  layout: CompositionLayout;
  onSelectLayout: (layout: CompositionLayout) => void;
  background?: RecorderBackgroundConfig;
  placement?: 'top' | 'left';
}

export const LayoutPopover: React.FC<LayoutPopoverProps> = ({
  isOpen,
  onClose,
  layout,
  onSelectLayout,
  background,
  placement = 'left',
}) => {
  if (!isOpen) return null;

  // Premade Layouts (matching user reference image + recording suite)
  const presets: {
    id: CompositionLayout;
    title: string;
    caption: string;
    type: 'end-to-end' | 'corner-cam' | 'spaced' | 'beside';
  }[] = [
    {
      id: 'overlay',
      title: 'End to End',
      caption: 'Full screen · Corner edge',
      type: 'end-to-end',
    },
    {
      id: 'corner-cam',
      title: 'Floating Corner',
      caption: 'Floating cam · Inset',
      type: 'corner-cam',
    },
    {
      id: 'framed',
      title: 'Spacing Around',
      caption: 'Visible background · Spaced',
      type: 'spaced',
    },
    {
      id: 'split',
      title: 'Beside',
      caption: 'Camera beside screen',
      type: 'beside',
    },
  ];

  const currentBgValue =
    background?.value || 'linear-gradient(145deg, #18181B 0%, #131316 50%, #0D0D0F 100%)';

  const positionClass =
    placement === 'left'
      ? 'absolute right-full mr-3.5 top-1/2 -translate-y-1/2'
      : 'absolute bottom-full mb-3 left-1/2 -translate-x-1/2';

  return (
    <div
      className={`${positionClass} w-[540px] max-w-[calc(100vw-120px)] max-h-[85vh] overflow-y-auto bg-white dark:bg-[#151718] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
            <Layers01Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-wider uppercase text-slate-800 dark:text-zinc-200 block">
              Stage Layout
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-400 block -mt-0.5">
              Select a premade layout configuration
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Cancel01Icon className="w-4 h-4" />
        </button>
      </div>

      {/* Premade Layout Cards with Visual Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {presets.map((item) => {
          const isSelected = layout === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectLayout(item.id);
                onClose();
              }}
              className={`group relative flex flex-col rounded-xl p-2 text-left transition-all cursor-pointer border-2 ${
                isSelected
                  ? 'border-[#f97316] bg-orange-50/70 dark:bg-[#f97316]/15 shadow-md shadow-[#f97316]/20 ring-2 ring-[#f97316]/30'
                  : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/70 dark:hover:bg-white/[0.05]'
              }`}
            >
              {/* Visual Active Check Indicator */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-[#f97316] text-white flex items-center justify-center shadow-xs">
                  <CheckmarkCircle01Icon className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Graphical Layout Diagram */}
              <div
                className="relative w-full aspect-16/10 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 mb-2 flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                style={{
                  background:
                    item.type === 'end-to-end'
                      ? '#1e293b'
                      : isSelected
                      ? '#bef264'
                      : currentBgValue,
                }}
              >
                {/* 1. End to End (Screen edge-to-edge, camera sitting flush at corner) */}
                {item.type === 'end-to-end' && (
                  <div className="relative w-full h-full bg-white dark:bg-zinc-800 flex flex-col items-center justify-center p-1.5">
                    {/* Screen content simulated lines */}
                    <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 mb-1" />
                    <div className="w-5 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />

                    {/* Corner Camera Box sitting flush on bottom-right edge */}
                    <div className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-tl-md bg-slate-900 text-white border-t border-l border-white/20 flex items-center justify-center shadow-xs">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-[#bef264]">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* 2. Floating Corner (Screen edge-to-edge, floating camera with margin) */}
                {item.type === 'corner-cam' && (
                  <div className="relative w-full h-full bg-white dark:bg-zinc-800 flex flex-col items-center justify-center p-1.5">
                    <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 mb-1" />
                    <div className="w-5 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />

                    {/* Floating camera with margin */}
                    <div className="absolute bottom-1 right-1.5 w-4 h-4 rounded-md bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-md">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 text-[#bef264]">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* 2. Spacing Around (Framed with visible background, corner camera) */}
                {item.type === 'spaced' && (
                  <div className="relative w-full h-full flex items-center justify-center p-1.5">
                    {/* Centered Inset Screen */}
                    <div className="w-[82%] h-[82%] rounded-md bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-sm flex flex-col items-center justify-center">
                      <div className="w-6 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 mb-0.5" />
                      <div className="w-4 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
                    </div>

                    {/* Corner Camera Box Overlapping Screen */}
                    <div className="absolute bottom-1 left-1.5 w-4.5 h-4.5 rounded-md bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xs">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* 3. Beside (Camera sits beside the screen) */}
                {item.type === 'beside' && (
                  <div className="relative w-full h-full flex items-center justify-between p-1.5 gap-1">
                    {/* Left: Camera Card */}
                    <div className="w-[28%] h-[82%] rounded-md bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xs">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#bef264]">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>

                    {/* Right: Screen Card */}
                    <div className="flex-1 h-[82%] rounded-md bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-sm flex flex-col items-center justify-center">
                      <div className="w-7 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 mb-0.5" />
                      <div className="w-4 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Caption */}
              <div className="min-w-0">
                <span
                  className={`text-xs font-bold block truncate leading-tight ${
                    isSelected
                      ? 'text-[#3f6212] dark:text-[#bef264]'
                      : 'text-slate-800 dark:text-zinc-200'
                  }`}
                >
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate leading-tight mt-0.5">
                  {item.caption}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
