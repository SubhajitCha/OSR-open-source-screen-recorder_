import React, { useState, useEffect } from 'react';
import {
  BookOpen01Icon,
  CpuIcon,
  Layers01Icon,
  SecurityCheckIcon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  CodeIcon,
  Copy01Icon,
  Tick01Icon,
  SparklesIcon,
  Video01Icon,
  HardDriveIcon,
  CloudIcon,
  LinkSquare01Icon,
} from 'hugeicons-react';
import { ARCHITECTURE_DOCS, OPEN_SOURCE_STACK } from '../data/techDocs';
import { probeBrowserCapabilities } from '../services/browserCapabilities';
import { BrowserCapabilityReport } from '../types';

interface TechDocsPageProps {
  onOpenStudio: () => void;
}

export const TechDocsPage: React.FC<TechDocsPageProps> = ({ onOpenStudio }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'stack' | 'diagnostics' | 'privacy' | 'deployment'>('architecture');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [probeReport, setProbeReport] = useState<BrowserCapabilityReport | null>(null);

  useEffect(() => {
    setProbeReport(probeBrowserCapabilities());
  }, []);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="tech-docs-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-zinc-900 text-blue-600 dark:text-emerald-400 border border-blue-100 dark:border-zinc-800 flex items-center justify-center shadow-xs">
              <BookOpen01Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                  Technical Documentation
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-emerald-400 bg-blue-50 dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800 rounded-full">
                  100% Client-Side
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                W3C standard browser APIs, Web Audio DSP mixing, 60fps canvas compositor, and zero-server local storage.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={onOpenStudio}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs rounded-full shadow-md shadow-blue-500/25 dark:shadow-white/10 transition-all cursor-pointer active:scale-95"
          >
            <Video01Icon className="w-4 h-4" />
            <span>Open Studio</span>
          </button>
        </div>
      </div>

      {/* Primary In-App Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto pb-1">
        <button
          id="tab-btn-architecture"
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'architecture'
              ? 'bg-white dark:bg-zinc-950 text-blue-600 dark:text-emerald-400 border-t-2 border-x border-t-blue-600 dark:border-t-emerald-400 border-slate-200 dark:border-zinc-800 shadow-xs font-bold'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-900/50'
          }`}
        >
          <Layers01Icon className="w-4 h-4" />
          <span>Architecture & Pipeline</span>
        </button>

        <button
          id="tab-btn-diagnostics"
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'diagnostics'
              ? 'bg-white dark:bg-zinc-950 text-blue-600 dark:text-emerald-400 border-t-2 border-x border-t-blue-600 dark:border-t-emerald-400 border-slate-200 dark:border-zinc-800 shadow-xs font-bold'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-900/50'
          }`}
        >
          <CpuIcon className="w-4 h-4" />
          <span>Client Engine Diagnostics</span>
        </button>

        <button
          id="tab-btn-stack"
          onClick={() => setActiveTab('stack')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'stack'
              ? 'bg-white dark:bg-zinc-950 text-blue-600 dark:text-emerald-400 border-t-2 border-x border-t-blue-600 dark:border-t-emerald-400 border-slate-200 dark:border-zinc-800 shadow-xs font-bold'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-900/50'
          }`}
        >
          <CodeIcon className="w-4 h-4" />
          <span>Open-Source Technologies</span>
        </button>

        <button
          id="tab-btn-privacy"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-zinc-950 text-blue-600 dark:text-emerald-400 border-t-2 border-x border-t-blue-600 dark:border-t-emerald-400 border-slate-200 dark:border-zinc-800 shadow-xs font-bold'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-900/50'
          }`}
        >
          <SecurityCheckIcon className="w-4 h-4" />
          <span>Privacy & Sandboxing Model</span>
        </button>

        <button
          id="tab-btn-deployment"
          onClick={() => setActiveTab('deployment')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'deployment'
              ? 'bg-white dark:bg-zinc-950 text-blue-600 dark:text-emerald-400 border-t-2 border-x border-t-blue-600 dark:border-t-emerald-400 border-slate-200 dark:border-zinc-800 shadow-xs font-bold'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-900/50'
          }`}
        >
          <CloudIcon className="w-4 h-4" />
          <span>Self-Hosting Guide</span>
        </button>
      </div>

      {/* Tab 1: Architecture Overview */}
      {activeTab === 'architecture' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ARCHITECTURE_DOCS.map((section, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-zinc-900 text-blue-600 dark:text-emerald-400 border border-blue-100 dark:border-zinc-800 flex items-center justify-center font-bold text-xs">
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{section.title}</h3>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-emerald-400 bg-blue-50 dark:bg-zinc-900 border border-blue-200/60 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                      {section.badge}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{section.summary}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Core Specifications
                  </span>
                  <ul className="space-y-1">
                    {section.details.map((detail, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-700 dark:text-zinc-300 flex items-start gap-2">
                        <span className="text-blue-600 dark:text-emerald-400 mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6 transition-colors">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-1">
                Real-Time Host Browser Capability Probes
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Diagnostic scan of standard multimedia APIs supported in your current browser session.
              </p>
            </div>

            {probeReport && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Display Capture API</span>
                    {probeReport.hasGetDisplayMedia ? (
                      <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <CancelCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Screen & Window recording</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Web Audio Context</span>
                    {probeReport.hasAudioContext ? (
                      <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <CancelCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Audio track DSP & Gain nodes</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">IndexedDB Storage</span>
                    {probeReport.hasIndexedDB ? (
                      <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <CancelCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Zero-upload offline storage</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Media Stream Acquisition</span>
                    {probeReport.hasGetUserMedia ? (
                      <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <CancelCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Microphone & Webcam access</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">File System Access API</span>
                    {probeReport.hasFileSystemAccess ? (
                      <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <CancelCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Direct disk stream saving</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">MediaRecorder API</span>
                    {probeReport.hasMediaRecorder ? (
                      <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <CancelCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Hardware-assisted encoding</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Open-Source Stack */}
      {activeTab === 'stack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          {OPEN_SOURCE_STACK.map((tech, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{tech.tech}</h3>
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                    {tech.license}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{tech.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-blue-600 dark:text-emerald-400 bg-blue-50 dark:bg-zinc-900 border border-blue-200/60 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                  {tech.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Privacy Model */}
      {activeTab === 'privacy' && (
        <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6 animate-in fade-in duration-150 transition-colors">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              Zero-Cloud Privacy & Sandbox Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              OSR is built ground-up to never transmit video data, audio data, or metadata to external servers. All operations happen in-memory inside your browser tab using IndexedDB.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">1. In-Memory Composition</h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Video frames and audio buffers are mixed locally in RAM and never written to disk until saved.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">2. Local IndexedDB</h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Recordings remain inside your browser sandbox and can be exported as raw WebM/MP4 files anytime.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">3. Full Telemetry Isolation</h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400">No trackers, cookies, or remote analytics engines are bundled with this application.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Deployment Guide */}
      {activeTab === 'deployment' && (
        <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-6 animate-in fade-in duration-150 transition-colors">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Self-Hosting & Docker Guide</h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400">OSR can be deployed statically to Cloudflare Pages, Vercel, Netlify, or Docker.</p>
          </div>

          <div className="relative p-4 rounded-2xl bg-slate-900 dark:bg-black text-slate-200 dark:text-zinc-200 border border-transparent dark:border-zinc-800 font-mono text-xs overflow-x-auto">
            <button
              onClick={() => handleCopyCode('build-cmd', 'npm install\nnpm run build\nnpx serve dist')}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-800 dark:bg-zinc-900 hover:bg-slate-700 dark:hover:bg-zinc-800 text-white text-[10px] flex items-center gap-1 cursor-pointer border border-transparent dark:border-zinc-800"
            >
              {copiedId === 'build-cmd' ? <Tick01Icon className="w-3 h-3 text-emerald-400" /> : <Copy01Icon className="w-3 h-3 text-slate-400" />}
              <span>{copiedId === 'build-cmd' ? 'Copied' : 'Copy'}</span>
            </button>
            <pre>
{`# Build static production bundle
npm install
npm run build

# Run local preview server
npx serve dist`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
