import React from 'react';
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  Home01Icon,
  Search01Icon,
  Film01Icon,
  Book02Icon,
  CpuIcon,
  HelpCircleIcon,
} from 'hugeicons-react';
import { ActiveView } from '../../types';

interface NotFoundPageProps {
  onOpenStudio: () => void;
  onNavigate?: (view: ActiveView) => void;
  attemptedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onOpenStudio,
  onNavigate,
  attemptedPath,
}) => {
  return (
    <main
      id="not-found-page"
      role="main"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-slate-800 dark:text-zinc-200 animate-in fade-in duration-200"
    >
      {/* Top Back Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-5 mb-10">
        <button
          type="button"
          id="not-found-back-btn"
          onClick={onOpenStudio}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft01Icon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Recording Studio</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          HTTP 404 &bull; Page Not Found
        </span>
      </div>

      {/* Main 404 Hero Section */}
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-inner">
            <Search01Icon className="w-12 h-12 sm:w-14 sm:h-14 text-amber-600 dark:text-amber-400 stroke-[1.5]" />
          </div>
          <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#D90000] text-white shadow-sm">
            404
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Looking for a Recording or Page?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
            The view or resource you requested{' '}
            {attemptedPath && (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-200 font-mono text-xs">
                {attemptedPath}
              </code>
            )}{' '}
            does not exist or may have been moved. All video files are stored locally in your browser’s IndexedDB sandbox.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            id="not-found-studio-btn"
            onClick={onOpenStudio}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Home01Icon className="w-4 h-4" />
            <span>Launch Studio Recorder</span>
          </button>

          <button
            type="button"
            id="not-found-library-btn"
            onClick={() => onNavigate?.('library')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-semibold text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Film01Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>View Saved Recordings</span>
          </button>
        </div>
      </div>

      {/* Suggested Helpful Destinations */}
      <div className="mt-14 pt-10 border-t border-slate-200/80 dark:border-zinc-800/80">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-5 text-center sm:text-left">
          Explore Available Studio Areas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            id="nav-to-studio-card"
            onClick={onOpenStudio}
            className="p-4 rounded-xl text-left bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Home01Icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Screen Recorder
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Capture screen, webcam, and system audio without time limits.
            </p>
          </button>

          <button
            type="button"
            id="nav-to-library-card"
            onClick={() => onNavigate?.('library')}
            className="p-4 rounded-xl text-left bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Film01Icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Recordings Library
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Access your locally cached recordings, trim clips, and export MP4s.
            </p>
          </button>

          <button
            type="button"
            id="nav-to-docs-card"
            onClick={() => onNavigate?.('docs')}
            className="p-4 rounded-xl text-left bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Book02Icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Technical Docs
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Learn about WebCodecs, canvas compositing, and audio mixing.
            </p>
          </button>

          <button
            type="button"
            id="nav-to-services-card"
            onClick={() => onNavigate?.('services')}
            className="p-4 rounded-xl text-left bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all hover:shadow-xs group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <CpuIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Diagnostics &amp; Health
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Verify WebCodecs, IndexedDB storage, and hardware capability.
            </p>
          </button>
        </div>
      </div>

      {/* Troubleshooting Tips Footer */}
      <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-zinc-800/60 flex items-start gap-3 text-xs text-slate-600 dark:text-zinc-400">
        <HelpCircleIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800 dark:text-zinc-200">
            Need help finding a recording?
          </span>
          <p>
            OSR Studio operates with 100% client-side privacy. If you switched browser profiles, opened an incognito session, or cleared site storage, previous recordings may not appear. Visit the{' '}
            <a
              href="?view=contact"
              className="text-indigo-600 dark:text-indigo-400 underline hover:no-underline font-medium"
            >
              Contact page
            </a>{' '}
            if you need technical guidance.
          </p>
        </div>
      </div>
    </main>
  );
};
