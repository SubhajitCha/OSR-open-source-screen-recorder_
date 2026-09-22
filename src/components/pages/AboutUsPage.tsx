import React, { useEffect } from 'react';
import {
  SparklesIcon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Video01Icon,
  SecurityCheckIcon,
  CpuIcon,
  Layers01Icon,
  Mail01Icon,
  BookOpen01Icon,
} from 'hugeicons-react';
import { ActiveView } from '../../types';

interface AboutUsPageProps {
  onOpenStudio: () => void;
  onNavigate?: (view: ActiveView) => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  onOpenStudio,
  onNavigate,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div id="about-us-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-in fade-in duration-200 text-slate-800 dark:text-zinc-200">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
        <a
          href="?view=studio"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors group w-fit"
        >
          <ArrowLeft01Icon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Studio</span>
        </a>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Open Source Initiative
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            Version 2.4.0
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <header className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center shadow-xs">
          <SparklesIcon className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          About OSR Studio
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
          OSR Studio was created with a clear objective: to build the fastest, most private, and most capable screen recording studio right inside the modern web browser—with zero installation, zero cloud uploads, and zero paywalls.
        </p>
      </header>

      {/* Why We Built OSR Studio Card */}
      <div className="bg-white dark:bg-zinc-900/80 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">
            Origin &amp; Mission
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Why Conventional Screen Recorders Are Broken
          </h2>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          For years, recording your desktop required downloading heavyweight desktop software that required admin privileges, registered system-level background daemon processes, and forced users into monthly paid subscriptions. Even worse, many popular browser extensions began silently uploading private screen recordings and sensitive meeting audio to remote third-party cloud servers.
        </p>

        <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
          We believed web standards had matured to a point where a desktop-class recorder could live entirely inside the browser. Powered by HTML5 Canvas, Web Audio DSP mixing, MediaStream capture, and WebCodecs, <strong>OSR Studio</strong> runs locally in any modern browser without sacrificing performance or privacy.
        </p>
      </div>

      {/* The 4 Architectural Pillars Grid */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Our Core Architectural Pillars
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Every feature we ship adheres to four fundamental engineering principles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center">
              <SecurityCheckIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              1. 100% In-Browser Privacy
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Your audio, video, and screen capture data never leave your computer. Processing, encoding, trimming, and storage occur entirely within local browser memory and IndexedDB.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center">
              <CpuIcon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              2. Zero Install &amp; Cross-Platform
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              No installers, no binary drivers, and no admin rights required. Open the URL on macOS, Windows, Linux, or ChromeOS and begin capturing instantly in Chrome, Edge, Firefox, Brave, or Safari.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center">
              <Layers01Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              3. Studio-Grade Creative Controls
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Customizable webcam picture-in-picture with multiple shapes and borders, real-time microphone and system audio mixing, frame-accurate trimming, and instant universal MP4 export.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center">
              <Video01Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Free &amp; Open Forever
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              No watermarks plastered across your videos, no 5-minute recording limits, and no artificial paywalls. Our mission is to keep essential creation tools universally accessible.
            </p>
          </div>
        </div>
      </div>

      {/* Who Uses OSR Studio */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Built for Creators, Engineers &amp; Educators
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Software Engineers</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Record pull request walkthroughs, reproduce frontend bugs, and capture terminal workflows without leaving your browser tab.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Designers &amp; PMs</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Present Figma interactive prototypes, explain user experience flows, and share asynchronous design critique with your camera bubble.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Teachers &amp; Students</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400">
              Create video tutorials, record virtual classroom lessons, and submit video assignments with zero software installation overhead.
            </p>
          </div>
        </div>
      </div>

      {/* Open Source Tech Stack Callout */}
      <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950 text-white border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 font-mono">
          <BookOpen01Icon className="w-4 h-4" />
          <span>OPEN WEB STANDARDS</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">
          Powered by Pure Native Web Technologies
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
          OSR Studio is crafted with TypeScript, React 18, Tailwind CSS, HTML5 Canvas, Web Audio API, and IndexedDB. We actively contribute our architecture findings back to the open web developer ecosystem.
        </p>
        <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">MediaStream API</span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">Web Audio API</span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">Canvas 2D Compositor</span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">IndexedDB Video Store</span>
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">WebCodecs MP4 Muxer</span>
        </div>
      </div>

      {/* Bottom Navigation Links */}
      <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-400">
          <a
            href="?view=privacy"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Privacy Policy
          </a>
          <span>&bull;</span>
          <a
            href="?view=terms"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Terms &amp; Conditions
          </a>
          <span>&bull;</span>
          <a
            href="?view=contact"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Contact Us
          </a>
        </div>

        <a
          href="?view=studio"
          className="px-4 py-2 rounded-xl bg-[#000000] dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition-opacity"
        >
          Launch Studio Recorder
        </a>
      </div>
    </div>
  );
};
