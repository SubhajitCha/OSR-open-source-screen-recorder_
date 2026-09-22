import React, { useState } from 'react';
import { ActiveView, CompositionLayout, RecordingMode } from '../../types';
import { SeoContentSection } from '../home/SeoContentSection';

interface ModeSelectionScreenProps {
  onSelectSetup: (mode: RecordingMode, layout: CompositionLayout) => void;
  currentMode?: RecordingMode;
  onSelectView?: (view: ActiveView) => void;
}

interface VisualModeOption {
  id: RecordingMode;
  layout: CompositionLayout;
  title: string;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  onSelectSetup,
  currentMode = 'screen_cam',
  onSelectView,
}) => {
  const [imgError, setImgError] = useState(false);

  const modeOptions: VisualModeOption[] = [
    {
      id: 'screen_cam',
      layout: 'overlay',
      title: 'Screen & Camera',
    },
    {
      id: 'screen',
      layout: 'screen',
      title: 'Screen only',
    },
    {
      id: 'audio_only',
      layout: 'screen',
      title: 'Audio',
    },
    {
      id: 'cam_only',
      layout: 'cam-only',
      title: 'Camera only',
    },
  ];

  // Ultra-minimal desktop screen representation in neutral dark palette (no clock, no date, no busy charts)
  const renderScreenMockup = (withCam: boolean = false) => (
    <div className="relative w-full h-full bg-[#18181B] dark:bg-[#121214] text-white flex flex-col justify-between p-3 sm:p-3.5 overflow-hidden select-none">
      {/* Subtle top window dots */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
      </div>

      {/* Minimal Frosted App Dock at Bottom */}
      <div className="mx-auto z-10">
        <div className="h-5 sm:h-6 px-2 bg-white/[0.08] backdrop-blur-md rounded-lg sm:rounded-xl border border-white/[0.08] flex items-center gap-1 sm:gap-1.5 shadow-sm">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-[3px] bg-white/25"
            />
          ))}
        </div>
      </div>

      {/* Floating Bottom-Right Camera Box for Screen & Camera */}
      {withCam && (
        <div className="absolute bottom-2 right-2 w-[40%] h-[56%] rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 shadow-xl bg-[#18181B] z-20">
          {!imgError ? (
            <div className="relative w-full h-full">
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&crop=faces&w=600&h=400&q=80"
                alt="Camera preview"
                className="w-full h-full object-cover object-center brightness-95 contrast-[1.02]"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/40 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-full bg-[#18181B] flex items-center justify-center text-white/50">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      id="mode-selection-screen"
      className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center bg-slate-50 dark:bg-[#07090c] text-slate-900 dark:text-white transition-colors"
    >
      {/* Primary Above-the-Fold Hero: Mode Selection */}
      <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-8 py-10 relative overflow-hidden select-none">
        <div className="relative z-10 max-w-5xl w-full flex flex-col items-center text-center space-y-8">
          {/* Minimal Header */}
          <div className="space-y-1.5 max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Choose what to record
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
              Select an option below to get started.
            </p>
          </div>

          {/* 4 Visual Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 w-full max-w-5xl">
            {modeOptions.map((opt) => {
              const isCurrent = opt.id === currentMode;

              return (
                <div
                  key={opt.id}
                  id={`record-mode-${opt.id}`}
                  onClick={() => onSelectSetup(opt.id, opt.layout)}
                  className="group flex flex-col items-center cursor-pointer transition-transform"
                >
                  {/* Clean Title directly above card */}
                  <h2 className="text-sm sm:text-base font-medium text-slate-700 dark:text-zinc-300 mb-2.5 text-center group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {opt.title}
                  </h2>

                  {/* Visual Card */}
                  <div
                    className={`relative w-full aspect-[16/11] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-200 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 ${
                      isCurrent
                        ? 'ring-2 ring-slate-900 dark:ring-white shadow-md'
                        : 'ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-1 group-hover:ring-slate-400 dark:group-hover:ring-zinc-400'
                    }`}
                  >
                    {/* 1. SCREEN & CAMERA CARD */}
                    {opt.id === 'screen_cam' && renderScreenMockup(true)}

                    {/* 2. SCREEN ONLY CARD */}
                    {opt.id === 'screen' && renderScreenMockup(false)}

                    {/* 3. AUDIO CARD - Minimalist monochrome sound wave */}
                    {opt.id === 'audio_only' && (
                      <div className="relative w-full h-full bg-[#18181B] dark:bg-[#121214] flex items-center justify-center p-4 overflow-hidden select-none">
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full h-full">
                          {[
                            { h: 'h-6 sm:h-7' },
                            { h: 'h-10 sm:h-12' },
                            { h: 'h-8 sm:h-9' },
                            { h: 'h-14 sm:h-16' },
                            { h: 'h-18 sm:h-20' }, // Center tallest bar
                            { h: 'h-14 sm:h-16' },
                            { h: 'h-11 sm:h-13' },
                            { h: 'h-7 sm:h-8' },
                            { h: 'h-9 sm:h-10' },
                          ].map((bar, i) => (
                            <div
                              key={i}
                              className={`w-1.5 sm:w-2 ${bar.h} rounded-full bg-white/80 dark:bg-zinc-200 transition-transform duration-300 group-hover:scale-y-105`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. CAMERA ONLY CARD */}
                    {opt.id === 'cam_only' && (
                      <div className="relative w-full h-full bg-[#18181B] dark:bg-[#121214] p-2 flex items-center justify-center overflow-hidden">
                        <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-[#18181B] shadow-inner">
                          {!imgError ? (
                            <div className="relative w-full h-full">
                              <img
                                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&crop=faces&w=600&h=400&q=80"
                                alt="Camera viewfinder"
                                className="w-full h-full object-cover object-center brightness-95 contrast-[1.02]"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/40 via-transparent to-transparent pointer-events-none" />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-[#18181B] flex items-center justify-center text-white/50">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          )}

                          {/* Minimalist Viewfinder Brackets */}
                          <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-white/40 rounded-tl-xs" />
                          <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-white/40 rounded-tr-xs" />
                          <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-white/40 rounded-bl-xs" />
                          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-white/40 rounded-br-xs" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ON-PAGE SEO CONTENT & COMPREHENSIVE TOOL GUIDE
         ───────────────────────────────────────────────────────────── */}
      <SeoContentSection onNavigate={onSelectView} />
    </div>
  );
};

