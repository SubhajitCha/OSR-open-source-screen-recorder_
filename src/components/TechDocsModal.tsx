import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Code2,
  HardDrive,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ARCHITECTURE_DOCS, OPEN_SOURCE_STACK } from '../data/techDocs';
import { probeBrowserCapabilities } from '../services/browserCapabilities';
import { BrowserCapabilityReport } from '../types';

interface TechDocsModalProps {
  onClose: () => void;
}

export const TechDocsModal: React.FC<TechDocsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'stack' | 'diagnostics' | 'privacy'>('architecture');
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
    <div
      id="tech-docs-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm"
    >
      <div
        id="tech-docs-modal-container"
        className="flex flex-col w-full max-w-5xl max-h-[90vh] bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-800 border border-gray-200">
              <BookOpen className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Technical Documentation & Architecture</h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full">
                  100% Open-Source
                </span>
              </div>
              <p className="text-xs text-gray-500">
                W3C standard browser APIs, Web Audio DSP mixer, 60fps canvas compositor, and IndexedDB.
              </p>
            </div>
          </div>
          <button
            id="btn-close-tech-docs"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-200 bg-gray-50/50">
          <button
            id="tab-btn-architecture"
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'architecture'
                ? 'border-red-500 text-red-600 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Architecture & Pipeline</span>
          </button>

          <button
            id="tab-btn-diagnostics"
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'diagnostics'
                ? 'border-red-500 text-red-600 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Live Browser Diagnostics</span>
          </button>

          <button
            id="tab-btn-stack"
            onClick={() => setActiveTab('stack')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'stack'
                ? 'border-red-500 text-red-600 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Open Tech Stack ($0 Cost)</span>
          </button>

          <button
            id="tab-btn-privacy"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-red-500 text-red-600 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy & Zero-Server</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ARCHITECTURE PIPELINE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Architecture Flow Diagram */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  Client-Side Capture & Encoding Flow
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                    <span className="font-bold text-red-600 block mb-1">1. Capture</span>
                    <p className="text-gray-500 text-[11px]">Display + Camera + Mic via W3C MediaStreams</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                    <span className="font-bold text-gray-900 block mb-1">2. Audio Mixer</span>
                    <p className="text-gray-500 text-[11px]">Web Audio API gain & FFT frequency analyzer</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                    <span className="font-bold text-gray-900 block mb-1">3. Compositor</span>
                    <p className="text-gray-500 text-[11px]">60 FPS Canvas geometric PIP mask & mirror</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                    <span className="font-bold text-gray-900 block mb-1">4. Encoding</span>
                    <p className="text-gray-500 text-[11px]">MediaRecorder VP9/H.264 chunk streaming</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
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
                    className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{doc.title}</h4>
                      <span className="px-2.5 py-1 text-xs font-mono font-medium text-red-600 bg-red-50 border border-red-200 rounded-md">
                        {doc.badge}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600">{doc.summary}</p>

                    <ul className="space-y-1 text-xs text-gray-500 list-disc list-inside">
                      {doc.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>

                    {doc.codeSample && (
                      <div className="relative mt-2 rounded-xl bg-gray-900 border border-gray-800 p-3 font-mono text-xs text-gray-200 overflow-x-auto">
                        <button
                          onClick={() => handleCopyCode(doc.id, doc.codeSample!)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          title="Copy Code"
                        >
                          {copiedId === doc.id ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <pre>{doc.codeSample}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE DIAGNOSTICS */}
          {activeTab === 'diagnostics' && probeReport && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Browser Hardware & API Diagnostic Test</h3>
                  <p className="text-xs text-gray-500">
                    Real-time hardware capability probe executing in your current browser session.
                  </p>
                </div>
                <button
                  onClick={() => setProbeReport(probeBrowserCapabilities())}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors shadow-sm"
                >
                  Re-run Probe
                </button>
              </div>

              {/* Core Web APIs Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                  {probeReport.hasGetDisplayMedia ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Screen Capture API</span>
                    <span className="text-[11px] text-gray-500">
                      {probeReport.hasGetDisplayMedia ? 'Supported (getDisplayMedia)' : 'Not Supported'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                  {probeReport.hasGetUserMedia ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Webcam / Mic API</span>
                    <span className="text-[11px] text-gray-500">
                      {probeReport.hasGetUserMedia ? 'Supported (getUserMedia)' : 'Not Supported'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                  {probeReport.hasMediaRecorder ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">MediaRecorder Engine</span>
                    <span className="text-[11px] text-gray-500">
                      {probeReport.hasMediaRecorder ? 'Hardware Video Encoder Available' : 'Not Supported'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                  {probeReport.hasAudioContext ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Web Audio API</span>
                    <span className="text-[11px] text-gray-500">
                      {probeReport.hasAudioContext ? 'Multi-track DSP Mixing Active' : 'Not Supported'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                  {probeReport.hasIndexedDB ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">IndexedDB Offline Storage</span>
                    <span className="text-[11px] text-gray-500">
                      {probeReport.hasIndexedDB ? 'Persistent Local Database Active' : 'Not Supported'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
                  {probeReport.hasFileSystemAccess ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      —
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">File System Access API</span>
                    <span className="text-[11px] text-gray-500">
                      {probeReport.hasFileSystemAccess ? 'Direct Disk Streaming Enabled' : 'Download Fallback Mode'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supported Video Codecs Table */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Codec Compatibility Matrix in Current Browser
                </h4>
                <div className="divide-y divide-gray-100">
                  {probeReport.supportedMimeTypes.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-medium text-gray-900">{item.mime}</span>
                        <p className="text-[11px] text-gray-500">{item.label}</p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
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
            </div>
          )}

          {/* TAB 3: OPEN TECH STACK */}
          {activeTab === 'stack' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-900">
                <span className="font-bold block mb-1">Zero-Cost Guarantee:</span>
                This application utilizes 100% open-source, standard W3C browser APIs. There are zero cloud hosting fees, zero external video processing servers, and zero recurring third-party API costs.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OPEN_SOURCE_STACK.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-red-600">{item.category}</span>
                      <span className="text-xs font-mono font-bold text-green-700">{item.cost}</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{item.tech}</h4>
                    <p className="text-xs text-gray-500">{item.description}</p>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded">
                      {item.license}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY & ZERO SERVER */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                  <h3 className="text-base font-bold text-gray-900">Zero-Server Privacy Guarantee</h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Unlike traditional cloud recording platforms that upload your sensitive screens, documents, and webcams to remote servers, this tool executes 100% inside your local browser memory.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                    <span className="font-bold text-green-700 block mb-1">0% Cloud Uploads</span>
                    <p className="text-gray-500 text-[11px]">No recording chunk or media packet ever leaves your device.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                    <span className="font-bold text-green-700 block mb-1">Local Sandboxing</span>
                    <p className="text-gray-500 text-[11px]">All data is kept in memory and saved to your local disk or IndexedDB.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                    <span className="font-bold text-green-700 block mb-1">Zero Telemetry</span>
                    <p className="text-gray-500 text-[11px]">No tracking cookies, marketing pixels, or analytics trackers.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white text-xs text-gray-500">
          <span>Vellum Open Source Recorder v1.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
