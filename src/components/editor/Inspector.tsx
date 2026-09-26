import React, { useState, useEffect, useRef } from 'react';
import {
  Layers01Icon,
  ColorsIcon,
  ScissorIcon,
  Tick01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowLeft01Icon,
  RotateLeft01Icon,
  Search01Icon,
} from 'hugeicons-react';
import {
  AppearanceSettings,
  AspectRatioType,
  CompositionLayout,
  Project,
  ZoomEasingType,
  ZoomSegment,
} from '../../types';
import { BACKGROUND_PRESETS, DEFAULT_BACKGROUND_VALUE } from '../../services/backgroundPresets';
import { extractZoomSegments } from '../../services/editorEngine';

const EASING_OPTIONS: { id: ZoomEasingType; label: string; desc: string }[] = [
  { id: 'easeInOut', label: 'Smooth', desc: 'Quintic curve' },
  { id: 'easeOut', label: 'Snappy', desc: 'Fast decel' },
  { id: 'spring', label: 'Spring', desc: 'Elastic bounce' },
  { id: 'cubic', label: 'Cubic', desc: 'Standard ease' },
  { id: 'linear', label: 'Linear', desc: 'Constant' },
];

interface InspectorProps {
  project: Project;
  onUpdateAppearance: (updates: Partial<AppearanceSettings>) => void;
  selectedZoomId?: string | null;
  onUpdateZoomSegment?: (zoomId: string, updates: Partial<ZoomSegment>) => void;
  onRemoveZoomSegment?: (zoomId: string) => void;
  onAutoDetectZooms?: () => void;
  currentTime?: number;
  onUpdateTrim?: (start: number, end: number) => void;
  width?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  project,
  onUpdateAppearance,
  selectedZoomId,
  onUpdateZoomSegment,
  onRemoveZoomSegment,
  onAutoDetectZooms,
  currentTime = 0,
  onUpdateTrim,
  width = 320,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    layout: false,
    background: false,
    trim: false,
    zoom: false,
  });

  const [activeBgCategory, setActiveBgCategory] = useState<'apple' | 'grain' | 'gradient' | 'minimal'>('apple');

  const zoomSectionRef = useRef<HTMLDivElement | null>(null);

  // Automatically open zoom controls in tools section whenever a zoom is added or selected
  useEffect(() => {
    if (selectedZoomId) {
      setOpenSections((prev) => ({ ...prev, zoom: true }));
      const timer = setTimeout(() => {
        zoomSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [selectedZoomId]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const { appearance } = project;
  const currentLayout: CompositionLayout = appearance.layout || (appearance.padding === 0 ? 'overlay' : 'framed');

  const duration = project.source.duration || 1;
  const trimStart = project.source.trimStart ?? 0;
  const trimEnd = project.source.trimEnd ?? duration;

  const zoomSegments = extractZoomSegments(project.timeline);
  const selectedZoom = selectedZoomId ? zoomSegments.find((z) => z.id === selectedZoomId) : null;

  const layoutPresets: {
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

  const handleSelectLayout = (layoutId: CompositionLayout) => {
    if (layoutId === 'overlay') {
      onUpdateAppearance({
        layout: layoutId,
        padding: 0,
        borderRadius: 0,
        shadow: 0,
      });
    } else if (layoutId === 'corner-cam') {
      onUpdateAppearance({
        layout: layoutId,
        padding: 0,
        borderRadius: 0,
        shadow: 0,
      });
    } else if (layoutId === 'framed') {
      onUpdateAppearance({
        layout: layoutId,
        padding: 32,
        borderRadius: 16,
        shadow: 25,
      });
    } else if (layoutId === 'split') {
      onUpdateAppearance({
        layout: layoutId,
        padding: 24,
        borderRadius: 16,
        shadow: 25,
      });
    }
  };

  const bgCategories = [
    { id: 'apple', label: 'Apple', icon: '' },
    { id: 'grain', label: 'Film Grain', icon: '✦' },
    { id: 'gradient', label: 'Gradients', icon: '◈' },
    { id: 'minimal', label: 'Minimal', icon: '◻' },
  ] as const;

  const filteredBgPresets = BACKGROUND_PRESETS.filter((p) => p.category === activeBgCategory);

  return (
    <aside
      style={{ width: isCollapsed ? 0 : width }}
      className={`shrink-0 bg-white dark:bg-[#121215] border-r border-slate-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden select-none text-slate-800 dark:text-[#EDEDED] font-sans transition-[width] duration-300 ${
        isCollapsed ? 'w-0 border-r-0 pointer-events-none ease-out' : 'ease-in'
      } relative`}
    >
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between transition-colors bg-slate-50/50 dark:bg-zinc-900/30 shrink-0">
        <h3 className="font-bold text-xs text-slate-900 dark:text-white tracking-wider uppercase flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D90000]" />
          <span>STUDIO TOOLS</span>
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 font-semibold shadow-2xs">
            INSPECTOR
          </span>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Minimize studio tools"
            >
              <ArrowLeft01Icon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Accordion Scroll Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* SECTION 1: STAGE LAYOUT */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('layout')}
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#D90000]/12 text-[#D90000] dark:bg-[#D90000]/20 dark:text-[#FF6666]">
                <Layers01Icon className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-[11px] text-slate-900 dark:text-white tracking-wider uppercase">
                STAGE LAYOUT
              </span>
            </div>
            {openSections.layout ? (
              <ArrowUp01Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            ) : (
              <ArrowDown01Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            )}
          </div>

          {openSections.layout && (
            <div className="px-3 pb-3 pt-2 space-y-3 border-t border-slate-200 dark:border-zinc-800">
              {/* Layout Grid */}
              <div className="grid grid-cols-2 gap-2">
                {layoutPresets.map((item) => {
                  const isSelected = currentLayout === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectLayout(item.id)}
                      className={`group relative flex flex-col p-2 rounded-xl text-left transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#8DB355]/10 border-[#8DB355] ring-2 ring-[#8DB355]/25 shadow-xs'
                          : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      {/* Graphical Layout Diagram */}
                      <div
                        className="relative w-full h-12 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 mb-1.5 flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                        style={{
                          background:
                            item.type === 'end-to-end' || item.type === 'corner-cam'
                              ? '#1e293b'
                              : (typeof appearance.background === 'string' ? appearance.background : DEFAULT_BACKGROUND_VALUE),
                        }}
                      >
                        {/* 1. End to End (Screen edge-to-edge, camera sitting flush at corner) */}
                        {item.type === 'end-to-end' && (
                          <div className="relative w-full h-full bg-white dark:bg-zinc-800 flex flex-col items-center justify-center p-1.5">
                            <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 mb-1" />
                            <div className="w-5 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />

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

                            <div className="absolute bottom-1 right-1.5 w-4 h-4 rounded-md bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-md">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 text-[#bef264]">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* 3. Spacing Around (Framed with visible background, corner camera) */}
                        {item.type === 'spaced' && (
                          <div className="relative w-full h-full flex items-center justify-center p-1.5">
                            <div className="w-[82%] h-[82%] rounded-md bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-sm flex flex-col items-center justify-center">
                              <div className="w-6 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 mb-0.5" />
                              <div className="w-4 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
                            </div>

                            <div className="absolute bottom-1 left-1.5 w-4.5 h-4.5 rounded-md bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xs">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* 4. Beside (Camera sits beside the screen) */}
                        {item.type === 'beside' && (
                          <div className="relative w-full h-full flex items-center justify-between p-1.5 gap-1">
                            <div className="w-[28%] h-[82%] rounded-md bg-slate-900 text-white border border-white/20 flex items-center justify-center shadow-xs">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#bef264]">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>

                            <div className="flex-1 h-[82%] rounded-md bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-sm flex flex-col items-center justify-center">
                              <div className="w-7 h-1 rounded-full bg-slate-300 dark:bg-zinc-600 mb-0.5" />
                              <div className="w-4 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
                            </div>
                          </div>
                        )}

                        {/* Active Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 z-10 w-3.5 h-3.5 rounded-full bg-[#f97316] text-white flex items-center justify-center shadow-xs">
                            <Tick01Icon className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-zinc-400 truncate">
                        {item.caption}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Aspect Ratio Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['16:9', '9:16', '1:1', '4:3'] as AspectRatioType[]).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => onUpdateAppearance({ aspectRatio: ratio })}
                      className={`py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        appearance.aspectRatio === ratio
                          ? 'bg-[#D90000] border-[#D90000] text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fine Tune Padding Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-600 dark:text-zinc-400">Canvas Spacing</span>
                  <span className="font-mono text-[11px] text-[#8DB355] font-bold">
                    {appearance.padding}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="64"
                  step="4"
                  value={appearance.padding}
                  onChange={(e) => onUpdateAppearance({ padding: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D90000]"
                />
              </div>

              {/* Corner Rounding Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-600 dark:text-zinc-400">Corner Radius</span>
                  <span className="font-mono text-[11px] text-[#8DB355] font-bold">
                    {appearance.borderRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="2"
                  value={appearance.borderRadius}
                  onChange={(e) => onUpdateAppearance({ borderRadius: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D90000]"
                />
              </div>

              {/* Camera Frame Controls (Position, Shape, Size) */}
              {(currentLayout === 'corner-cam' || project.source.camBlob) && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      Presenter Camera
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateAppearance({ cameraHidden: !appearance.cameraHidden })}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer border transition-colors ${
                        appearance.cameraHidden
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : 'bg-[#8DB355]/10 text-[#8DB355] border-[#8DB355]/30'
                      }`}
                    >
                      {appearance.cameraHidden ? 'Hidden' : 'Visible'}
                    </button>
                  </div>

                  {!appearance.cameraHidden && (
                    <>
                      {/* Camera Position */}
                      <div>
                        <span className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1">Position</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { id: 'top-left', label: 'TL' },
                            { id: 'top-right', label: 'TR' },
                            { id: 'bottom-left', label: 'BL' },
                            { id: 'bottom-right', label: 'BR' },
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() =>
                                onUpdateAppearance({
                                  cameraPosition: pos.id as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
                                })
                              }
                              className={`py-1 text-[10px] font-semibold rounded border transition-all cursor-pointer ${
                                (appearance.cameraPosition || 'bottom-right') === pos.id
                                  ? 'bg-[#D90000] border-[#D90000] text-white font-bold'
                                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                              }`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Camera Shape */}
                      <div>
                        <span className="block text-[10px] text-slate-600 dark:text-zinc-400 mb-1">Shape</span>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'circle', label: 'Circle' },
                            { id: 'squircle', label: 'Squircle' },
                            { id: 'square', label: 'Square' },
                          ].map((sh) => (
                            <button
                              key={sh.id}
                              type="button"
                              onClick={() =>
                                onUpdateAppearance({
                                  cameraShape: sh.id as 'circle' | 'squircle' | 'square',
                                })
                              }
                              className={`py-1 text-[10px] font-semibold rounded border transition-all cursor-pointer ${
                                (appearance.cameraShape || 'circle') === sh.id
                                  ? 'bg-[#8DB355] border-[#8DB355] text-white font-bold'
                                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                              }`}
                            >
                              {sh.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Camera Size Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-600 dark:text-zinc-400">Size</span>
                          <span className="font-mono text-[10px] text-[#8DB355] font-bold">
                            {appearance.cameraSize || 25}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="40"
                          step="1"
                          value={appearance.cameraSize || 25}
                          onChange={(e) => onUpdateAppearance({ cameraSize: parseInt(e.target.value, 10) })}
                          className="w-full h-1 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D90000]"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: CANVAS BACKGROUND */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('background')}
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#D90000]/12 text-[#D90000] dark:bg-[#D90000]/20 dark:text-[#FF6666]">
                <ColorsIcon className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-[11px] text-slate-900 dark:text-white tracking-wider uppercase">
                CANVAS BACKGROUND
              </span>
            </div>
            {openSections.background ? (
              <ArrowUp01Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            ) : (
              <ArrowDown01Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            )}
          </div>

          {openSections.background && (
            <div className="px-3 pb-3 pt-2 space-y-3 border-t border-slate-200 dark:border-zinc-800">
              {/* Category Tabs */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-zinc-800/80 border border-slate-300/60 dark:border-zinc-700/60">
                {bgCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveBgCategory(cat.id)}
                    className={`flex-1 py-1 px-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer truncate text-center ${
                      activeBgCategory === cat.id
                        ? 'bg-[#000000] dark:bg-white text-white dark:text-[#000000] shadow-xs font-bold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span className="mr-1 opacity-75">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
                {filteredBgPresets.map((preset) => {
                  const isSelected = appearance.background === preset.value;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onUpdateAppearance({ background: preset.value })}
                      className={`group relative flex flex-col p-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-[#8DB355] ring-2 ring-[#8DB355]/30 bg-[#8DB355]/10 shadow-xs'
                          : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800/70'
                      }`}
                      title={preset.name}
                    >
                      {/* Swatch */}
                      <div
                        className="w-full h-11 rounded-lg mb-1.5 border border-black/10 dark:border-white/10 relative overflow-hidden bg-cover bg-center"
                        style={{
                          background: preset.value.startsWith('http') || preset.value.startsWith('data:')
                            ? `url(${preset.value}) center/cover no-repeat`
                            : preset.value,
                        }}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8DB355] text-white flex items-center justify-center shadow-xs">
                            <Tick01Icon className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-[10px] text-slate-800 dark:text-zinc-200 truncate w-full">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: TRIM VIDEO */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('trim')}
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#D90000]/15 text-[#D90000]">
                <ScissorIcon className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-[11px] text-slate-900 dark:text-white tracking-wider uppercase">
                VIDEO TRIM
              </span>
            </div>
            {openSections.trim ? (
              <ArrowUp01Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            ) : (
              <ArrowDown01Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            )}
          </div>

          {openSections.trim && (
            <div className="px-3 pb-3 pt-2 space-y-3 border-t border-slate-200 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-white dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700">
                  <span className="block text-[9px] font-bold uppercase text-slate-500 dark:text-zinc-400">Trim In</span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{trimStart.toFixed(1)}s</span>
                </div>
                <div className="p-2 bg-white dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700">
                  <span className="block text-[9px] font-bold uppercase text-slate-500 dark:text-zinc-400">Trim Out</span>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{trimEnd.toFixed(1)}s</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateTrim?.(currentTime, trimEnd)}
                  className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-[#8DB355] text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Set Trim In at Playhead</span>
                  <span className="font-mono text-[10px] text-[#8DB355] font-bold">{currentTime.toFixed(1)}s</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateTrim?.(trimStart, currentTime)}
                  className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-[#8DB355] text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Set Trim Out at Playhead</span>
                  <span className="font-mono text-[10px] text-[#8DB355] font-bold">{currentTime.toFixed(1)}s</span>
                </button>

                {(trimStart > 0 || trimEnd < duration) && (
                  <button
                    type="button"
                    onClick={() => onUpdateTrim?.(0, duration)}
                    className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold text-[#D90000] hover:bg-[#D90000]/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                  >
                    <RotateLeft01Icon className="w-3 h-3" />
                    <span>Reset to Full Video ({duration.toFixed(1)}s)</span>
                  </button>
                )}
              </div>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 italic text-center">
                You can also drag the Trim In and Trim Out handles on the timeline video track.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 4: ZOOM EFFECTS */}
        <div ref={zoomSectionRef} className="bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div
            onClick={() => toggleSection('zoom')}
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#D90000]/15 text-[#D90000]">
                <Search01Icon className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-[11px] text-slate-900 dark:text-white tracking-wider uppercase">
                ZOOM EFFECTS
              </span>
              {zoomSegments.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#D90000]/10 text-[#D90000] font-bold">
                  {zoomSegments.length}
                </span>
              )}
            </div>
            {openSections.zoom ? (
              <ArrowUp01Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            ) : (
              <ArrowDown01Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            )}
          </div>

          {openSections.zoom && (
            <div className="px-3 pb-3 pt-2 space-y-3 border-t border-slate-200 dark:border-zinc-800">
              {/* Selected Zoom Segment Controls if one is active */}
              {selectedZoom && onUpdateZoomSegment && (
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-[#D90000]/30 shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D90000] animate-pulse" />
                      <span className="text-[11px] font-bold text-[#D90000]">Selected Zoom</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {selectedZoom.start.toFixed(1)}s - {selectedZoom.end.toFixed(1)}s
                      </span>
                      {onRemoveZoomSegment && (
                        <button
                          type="button"
                          onClick={() => onRemoveZoomSegment(selectedZoom.id)}
                          className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                          title="Delete this zoom segment"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Zoom Scale */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">Zoom Depth</span>
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-200">
                        {selectedZoom.scale.toFixed(1)}×
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="3.0"
                      step="0.1"
                      value={selectedZoom.scale}
                      onChange={(e) =>
                        onUpdateZoomSegment(selectedZoom.id, { scale: parseFloat(e.target.value) })
                      }
                      className="w-full accent-[#D90000]"
                    />
                  </div>

                  {/* Zoom Easing Curve */}
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200/80 dark:border-zinc-800/80">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">Easing Curve</span>
                      <span className="font-mono text-[10px] text-[#D90000] font-bold uppercase">
                        {selectedZoom.easing || appearance.zoomEasing || 'easeInOut'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {EASING_OPTIONS.map((opt) => {
                        const currentEasing = selectedZoom.easing || appearance.zoomEasing || 'easeInOut';
                        const isActive = currentEasing === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => onUpdateZoomSegment(selectedZoom.id, { easing: opt.id })}
                            className={`py-1 px-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer text-center ${
                              isActive
                                ? 'bg-[#D90000] text-white shadow-2xs'
                                : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700'
                            }`}
                            title={opt.desc}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motion Blur */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Motion Blur</span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500">Camera velocity blur</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = selectedZoom.motionBlur ?? appearance.zoomMotionBlur ?? true;
                          onUpdateZoomSegment(selectedZoom.id, { motionBlur: !cur });
                        }}
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          (selectedZoom.motionBlur ?? appearance.zoomMotionBlur ?? true)
                            ? 'bg-[#D90000]'
                            : 'bg-slate-300 dark:bg-zinc-700'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 shadow-xs ${
                            (selectedZoom.motionBlur ?? appearance.zoomMotionBlur ?? true) ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {(selectedZoom.motionBlur ?? appearance.zoomMotionBlur ?? true) && (
                      <div className="flex flex-col gap-1 pl-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400">Blur Intensity</span>
                          <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-zinc-200">
                            {selectedZoom.motionBlurIntensity ?? appearance.zoomMotionBlurIntensity ?? 70}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={selectedZoom.motionBlurIntensity ?? appearance.zoomMotionBlurIntensity ?? 70}
                          onChange={(e) =>
                            onUpdateZoomSegment(selectedZoom.id, {
                              motionBlurIntensity: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-[#D90000]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-[11px] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 animate-pulse" />
                    <span>Click or drag anywhere on the video to position zoom target</span>
                  </div>
                </div>
              )}

              {/* Default Zoom Settings */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Global Zoom Defaults
                </span>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Default Zoom Scale</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-200">
                      {(appearance.autoZoomScale || 1.6).toFixed(1)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="3.0"
                    step="0.1"
                    value={appearance.autoZoomScale || 1.6}
                    onChange={(e) => onUpdateAppearance({ autoZoomScale: parseFloat(e.target.value) })}
                    className="w-full accent-[#D90000]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Default Zoom Duration</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-200">
                      {(appearance.autoZoomDuration || 2.5).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.5"
                    value={appearance.autoZoomDuration || 2.5}
                    onChange={(e) => onUpdateAppearance({ autoZoomDuration: parseFloat(e.target.value) })}
                    className="w-full accent-[#D90000]"
                  />
                </div>

                {/* Default Easing Curve */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Default Easing</span>
                    <span className="font-mono text-[10px] text-[#D90000] font-bold uppercase">
                      {appearance.zoomEasing || 'easeInOut'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {EASING_OPTIONS.map((opt) => {
                      const isActive = (appearance.zoomEasing || 'easeInOut') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onUpdateAppearance({ zoomEasing: opt.id })}
                          className={`py-1 px-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer text-center ${
                            isActive
                              ? 'bg-[#D90000] text-white shadow-2xs'
                              : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700'
                          }`}
                          title={opt.desc}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default Motion Blur */}
                <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Default Motion Blur</span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500">Enable on all new zooms</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateAppearance({ zoomMotionBlur: !(appearance.zoomMotionBlur ?? true) })
                      }
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        (appearance.zoomMotionBlur ?? true)
                          ? 'bg-[#D90000]'
                          : 'bg-slate-300 dark:bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 shadow-xs ${
                          (appearance.zoomMotionBlur ?? true) ? 'translate-x-4' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {(appearance.zoomMotionBlur ?? true) && (
                    <div className="flex flex-col gap-1 pl-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">Default Intensity</span>
                        <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-zinc-200">
                          {appearance.zoomMotionBlurIntensity ?? 70}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={appearance.zoomMotionBlurIntensity ?? 70}
                        onChange={(e) =>
                          onUpdateAppearance({ zoomMotionBlurIntensity: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-[#D90000]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
