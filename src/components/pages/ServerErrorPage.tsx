import React, { useState } from 'react';
import {
  Alert02Icon,
  ArrowLeft01Icon,
  RefreshIcon,
  Home01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  CpuIcon,
  HelpCircleIcon,
} from 'hugeicons-react';
import { ActiveView } from '../../types';

interface ServerErrorPageProps {
  onOpenStudio: () => void;
  onNavigate?: (view: ActiveView) => void;
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onResetError?: () => void;
}

export const ServerErrorPage: React.FC<ServerErrorPageProps> = ({
  onOpenStudio,
  onNavigate,
  error,
  errorInfo,
  onResetError,
}) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const errorMessage = error?.message || 'An unexpected client-side runtime exception occurred during rendering or media pipeline processing.';
  const errorStack = error?.stack || (errorInfo?.componentStack ? `Component stack trace:\n${errorInfo.componentStack}` : 'No stack trace available.');

  const handleCopyDiagnostics = () => {
    const diagnosticReport = [
      `OSR Studio Diagnostics Report (500 Error)`,
      `Timestamp: ${new Date().toISOString()}`,
      `User Agent: ${navigator.userAgent}`,
      `Screen: ${window.screen.width}x${window.screen.height}`,
      `Error Message: ${errorMessage}`,
      `\nStack Trace:\n${errorStack}`,
    ].join('\n');

    navigator.clipboard.writeText(diagnosticReport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReload = () => {
    if (onResetError) {
      onResetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <main
      id="server-error-page"
      role="main"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-slate-800 dark:text-zinc-200 animate-in fade-in duration-200"
    >
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-5 mb-10">
        <button
          type="button"
          id="server-error-back-btn"
          onClick={() => {
            if (onResetError) onResetError();
            onOpenStudio();
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft01Icon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Studio</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          500 &bull; System / Application Exception
        </span>
      </div>

      {/* Main 500 Hero Section */}
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-rose-500/15 via-rose-500/5 to-transparent dark:from-rose-500/20 dark:via-rose-500/10 border border-rose-500/25 flex items-center justify-center shadow-inner">
            <Alert02Icon className="w-12 h-12 sm:w-14 sm:h-14 text-rose-600 dark:text-rose-400 stroke-[1.5]" />
          </div>
          <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-600 text-white shadow-sm">
            500
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Something Interrupted the Studio Engine
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
            The studio encountered an unexpected internal error while rendering or processing media. Your saved recordings in local storage remain completely safe and untouched.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            id="server-error-reload-btn"
            onClick={handleReload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <RefreshIcon className="w-4 h-4" />
            <span>Reload &amp; Reset Studio</span>
          </button>

          <button
            type="button"
            id="server-error-studio-btn"
            onClick={() => {
              if (onResetError) onResetError();
              onOpenStudio();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-semibold text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Home01Icon className="w-4 h-4" />
            <span>Go to Studio Home</span>
          </button>

          <button
            type="button"
            id="server-error-diagnostics-btn"
            onClick={() => onNavigate?.('services')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-semibold text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <CpuIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>System Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Collapsible Error Inspector */}
      <div className="mt-12 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Exception Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Technical trace for debugging browser permissions, WebCodecs, or memory issues.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="copy-error-details-btn"
              onClick={handleCopyDiagnostics}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckmarkCircle01Icon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy01Icon className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="toggle-error-details-btn"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {showTechnicalDetails ? 'Hide Full Trace' : 'Show Full Trace'}
            </button>
          </div>
        </div>

        {/* Message Banner */}
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 text-xs font-mono text-rose-900 dark:text-rose-200 break-words leading-relaxed">
          {errorMessage}
        </div>

        {/* Extended Stack Trace */}
        {showTechnicalDetails && (
          <div className="space-y-2 animate-in fade-in duration-150">
            <h3 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Component Stack Trace
            </h3>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed border border-slate-800 select-all">
              {errorStack}
            </pre>
          </div>
        )}
      </div>

      {/* Helpful Guidance Card */}
      <div className="mt-8 p-5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800/80 flex items-start gap-3.5 text-xs text-slate-600 dark:text-zinc-400">
        <HelpCircleIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-900 dark:text-white">
            Common troubleshooting steps for browser media recording:
          </span>
          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 pl-1">
            <li>Ensure you have granted microphone and screen capture permissions in your browser URL bar.</li>
            <li>If recording 4K 60FPS video, your GPU memory or system RAM may have reached hardware limits.</li>
            <li>Ensure no other application has locked exclusive access to your connected webcam or USB microphone.</li>
          </ul>
        </div>
      </div>
    </main>
  );
};
