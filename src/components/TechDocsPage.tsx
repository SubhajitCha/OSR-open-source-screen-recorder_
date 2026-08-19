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
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shadow-sm">
              <BookOpen01Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Technical Documentation
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full">
                  100% Client-Side
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                W3C standard browser APIs, Web Audio DSP mixing, 60fps canvas compositor, and zero-server local storage.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={onOpenStudio}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-red-600/20 transition-all cursor-pointer"
          >
            <Video01Icon className="w-4 h-4" />
            <span>Open Studio</span>
          </button>
        </div>
      </div>

      {/* Primary In-App Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1">
        <button
          id="tab-btn-architecture"
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'architecture'
              ? 'bg-white text-red-600 border-t-2 border-x border-t-red-600 border-gray-200 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
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
              ? 'bg-white text-red-600 border-t-2 border-x border-t-red-600 border-gray-200 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
        >
          <CpuIcon className="w-4 h-4" />
          <span>Live Browser Diagnostics</span>
        </button>

        <button
          id="tab-btn-stack"
          onClick={() => setActiveTab('stack')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'stack'
              ? 'bg-white text-red-600 border-t-2 border-x border-t-red-600 border-gray-200 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
        >
          <CodeIcon className="w-4 h-4" />
          <span>Open Tech Stack ($0 Cost)</span>
        </button>

        <button
          id="tab-btn-deployment"
          onClick={() => setActiveTab('deployment')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'deployment'
              ? 'bg-white text-red-600 border-t-2 border-x border-t-red-600 border-gray-200 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
        >
          <CloudIcon className="w-4 h-4" />
          <span>Deployment & Hosting (Render)</span>
        </button>

        <button
          id="tab-btn-privacy"
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-white text-red-600 border-t-2 border-x border-t-red-600 border-gray-200 shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
        >
          <SecurityCheckIcon className="w-4 h-4" />
          <span>Privacy & Zero-Server</span>
        </button>
      </div>

      {/* TAB 1: ARCHITECTURE PIPELINE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          {/* Architecture Flow Diagram */}
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-red-500" />
              Client-Side Capture & Encoding Flow
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-center">
                <span className="font-bold text-red-600 block mb-1">1. Capture</span>
                <p className="text-gray-500 text-[11px]">Display + Camera + Mic via W3C MediaStreams</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-center">
                <span className="font-bold text-gray-900 block mb-1">2. Audio Mixer</span>
                <p className="text-gray-500 text-[11px]">Web Audio API gain & FFT frequency analyzer</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-center">
                <span className="font-bold text-gray-900 block mb-1">3. Compositor</span>
                <p className="text-gray-500 text-[11px]">60 FPS Canvas geometric PIP mask & mirror</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-center">
                <span className="font-bold text-gray-900 block mb-1">4. Encoding</span>
                <p className="text-gray-500 text-[11px]">MediaRecorder VP9/H.264 chunk streaming</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-center">
                <span className="font-bold text-green-600 block mb-1">5. Storage</span>
                <p className="text-gray-500 text-[11px]">IndexedDB local store or File System disk write</p>
              </div>
            </div>
          </div>

          {/* Step by step cards */}
          <div className="space-y-4">
            {ARCHITECTURE_DOCS.map((doc) => (
              <div
                key={doc.id}
                id={`doc-card-${doc.id}`}
                className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-gray-900">{doc.title}</h4>
                  <span className="px-3 py-1 text-xs font-mono font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {doc.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-600">{doc.summary}</p>

                <ul className="space-y-1.5 text-xs sm:text-sm text-gray-500 list-disc list-inside">
                  {doc.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>

                {doc.codeSample && (
                  <div className="relative mt-3 rounded-2xl bg-gray-950 border border-gray-800 p-4 font-mono text-xs text-gray-200 overflow-x-auto shadow-inner">
                    <button
                      onClick={() => handleCopyCode(doc.id, doc.codeSample!)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                      title="Copy Code"
                    >
                      {copiedId === doc.id ? (
                        <Tick01Icon className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy01Icon className="w-4 h-4" />
                      )}
                    </button>
                    <pre className="pr-10">{doc.codeSample}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE DIAGNOSTICS */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Browser Hardware & API Diagnostic Test</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                Real-time hardware capability probe executing in your current browser session.
              </p>
            </div>
            <button
              onClick={() => setProbeReport(probeBrowserCapabilities())}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Re-run Diagnostics
            </button>
          </div>

          {/* Core Web APIs Status Grid */}
          {probeReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                {probeReport.hasGetDisplayMedia ? (
                  <CheckmarkCircle01Icon className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <CancelCircleIcon className="w-6 h-6 text-red-500 shrink-0" />
                )}
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Screen Capture API</span>
                  <span className="text-xs text-gray-500">
                    {probeReport.hasGetDisplayMedia ? 'Supported (getDisplayMedia)' : 'Not Supported'}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                {probeReport.hasGetUserMedia ? (
                  <CheckmarkCircle01Icon className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <CancelCircleIcon className="w-6 h-6 text-red-500 shrink-0" />
                )}
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Webcam & Microphone API</span>
                  <span className="text-xs text-gray-500">
                    {probeReport.hasGetUserMedia ? 'Supported (getUserMedia)' : 'Not Supported'}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                {probeReport.hasMediaRecorder ? (
                  <CheckmarkCircle01Icon className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <CancelCircleIcon className="w-6 h-6 text-red-500 shrink-0" />
                )}
                <div>
                  <span className="text-sm font-bold text-gray-900 block">MediaRecorder Engine</span>
                  <span className="text-xs text-gray-500">
                    {probeReport.hasMediaRecorder ? 'Hardware Video Encoder Available' : 'Not Supported'}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                {probeReport.hasAudioContext ? (
                  <CheckmarkCircle01Icon className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <CancelCircleIcon className="w-6 h-6 text-red-500 shrink-0" />
                )}
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Web Audio API</span>
                  <span className="text-xs text-gray-500">
                    {probeReport.hasAudioContext ? 'Multi-track DSP Mixing Active' : 'Not Supported'}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                {probeReport.hasIndexedDB ? (
                  <CheckmarkCircle01Icon className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <CancelCircleIcon className="w-6 h-6 text-red-500 shrink-0" />
                )}
                <div>
                  <span className="text-sm font-bold text-gray-900 block">IndexedDB Local Storage</span>
                  <span className="text-xs text-gray-500">
                    {probeReport.hasIndexedDB ? 'Persistent Local Database Active' : 'Not Supported'}
                  </span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                {probeReport.hasFileSystemAccess ? (
                  <CheckmarkCircle01Icon className="w-6 h-6 text-green-600 shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">
                    —
                  </div>
                )}
                <div>
                  <span className="text-sm font-bold text-gray-900 block">File System Access API</span>
                  <span className="text-xs text-gray-500">
                    {probeReport.hasFileSystemAccess ? 'Direct Disk Streaming Enabled' : 'Download Fallback Mode'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Supported Video Codecs Table */}
          {probeReport && (
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Codec Compatibility Matrix in Current Browser
              </h4>
              <div className="divide-y divide-gray-100">
                {probeReport.supportedMimeTypes.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-mono font-medium text-gray-900">{item.mime}</span>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        item.supported
                          ? 'text-green-700 bg-green-50 border border-green-200'
                          : 'text-gray-400 bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {item.supported ? 'Supported' : 'Unsupported'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OPEN TECH STACK */}
      {activeTab === 'stack' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-green-50 border border-green-200 text-xs sm:text-sm text-green-900">
            <span className="font-bold block mb-1">Zero-Cost Guarantee:</span>
            This application utilizes 100% open-source, standard W3C browser APIs. There are zero cloud hosting fees, zero external video processing servers, and zero recurring third-party API costs.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OPEN_SOURCE_STACK.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-600">{item.category}</span>
                  <span className="text-xs font-mono font-bold text-green-700">{item.cost}</span>
                </div>
                <h4 className="text-base font-bold text-gray-900">{item.tech}</h4>
                <p className="text-xs sm:text-sm text-gray-500">{item.description}</p>
                <span className="inline-block px-2.5 py-1 text-xs font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                  {item.license}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DEPLOYMENT & HOSTING GUIDE (Render, Vercel, Netlify, etc.) */}
      {activeTab === 'deployment' && (
        <div className="space-y-6">
          {/* Render Configuration Quick Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <HardDriveIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Render Deployment Configuration</h3>
                <p className="text-xs text-gray-500">
                  Settings required when deploying as a <strong>Static Site</strong> on Render.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Build Command
                </span>
                <div className="p-3 bg-gray-900 rounded-xl text-green-400 font-mono text-xs flex items-center justify-between">
                  <code>npm run build</code>
                  <button
                    onClick={() => handleCopyCode('render-build', 'npm run build')}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === 'render-build' ? <Tick01Icon className="w-3.5 h-3.5 text-green-400" /> : <Copy01Icon className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">Compiles TypeScript and bundles static assets with Vite.</p>
              </div>

              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Publish Directory
                </span>
                <div className="p-3 bg-gray-900 rounded-xl text-yellow-300 font-mono text-xs flex items-center justify-between">
                  <code>dist</code>
                  <button
                    onClick={() => handleCopyCode('render-publish', 'dist')}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === 'render-publish' ? <Tick01Icon className="w-3.5 h-3.5 text-green-400" /> : <Copy01Icon className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 font-medium text-red-600">
                  ⚠️ Note: Use <strong>dist</strong> (do NOT use <em>dist/public</em> or <em>public</em>).
                </p>
              </div>
            </div>

            {/* Why dist/public is wrong explanation */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold block">Why was `dist/public` causing an issue?</span>
              <p className="leading-relaxed">
                Vite compiles all static HTML, JS, and CSS files directly into the root of the <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">dist/</code> directory (e.g. <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">dist/index.html</code>). Setting the publish directory to <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">dist/public</code> makes Render look for a non-existent subfolder, resulting in build failures or 404s.
              </p>
            </div>
          </div>

          {/* Other Platform Presets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Vercel</h4>
              <p className="text-xs text-gray-500">Framework Preset: <strong>Vite</strong></p>
              <div className="text-xs font-mono text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                Output Directory: <strong>dist</strong>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-gray-900">Netlify</h4>
              <p className="text-xs text-gray-500">Build command: <strong>npm run build</strong></p>
              <div className="text-xs font-mono text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                Publish directory: <strong>dist</strong>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-gray-900">GitHub Pages</h4>
              <p className="text-xs text-gray-500">Deploy from branch: <strong>gh-pages</strong></p>
              <div className="text-xs font-mono text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                Action Source: <strong>./dist</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRIVACY & ZERO SERVER */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 border border-green-100 flex items-center justify-center">
                <SecurityCheckIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Zero-Server Privacy Guarantee</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
              Unlike traditional cloud recording platforms that stream your sensitive desktop screens, documents, and webcams to remote cloud servers, this tool executes 100% inside your local browser memory sandboxed by standard web security policies.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm space-y-1">
                <span className="font-bold text-green-700 block">0% Cloud Uploads</span>
                <p className="text-gray-500 text-xs">No recording chunk or media packet ever leaves your device.</p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm space-y-1">
                <span className="font-bold text-green-700 block">Local Memory Sandboxing</span>
                <p className="text-gray-500 text-xs">All data is kept in RAM and saved to your local disk or IndexedDB.</p>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm space-y-1">
                <span className="font-bold text-green-700 block">Zero Telemetry</span>
                <p className="text-gray-500 text-xs">No tracking cookies, marketing pixels, or analytics trackers.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
