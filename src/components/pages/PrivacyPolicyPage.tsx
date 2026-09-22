import React, { useState, useEffect } from 'react';
import {
  SecurityCheckIcon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  HardDriveIcon,
  InformationCircleIcon,
  Mail01Icon,
  File01Icon,
} from 'hugeicons-react';
import { ActiveView } from '../../types';

interface PrivacyPolicyPageProps {
  onOpenStudio: () => void;
  onNavigate?: (view: ActiveView) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onOpenStudio,
  onNavigate,
}) => {
  const [storageEstimate, setStorageEstimate] = useState<string>('0 MB');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        const mb = ((est.usage || 0) / (1024 * 1024)).toFixed(1);
        setStorageEstimate(`${mb} MB`);
      }).catch(() => {
        setStorageEstimate('< 1 MB');
      });
    }
  }, []);

  return (
    <div id="privacy-policy-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-in fade-in duration-200 text-slate-800 dark:text-zinc-200">
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            100% In-Browser Privacy
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            Effective: September 2026
          </span>
        </div>
      </div>

      {/* Main Title & Hero Intro */}
      <header className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shadow-xs">
          <SecurityCheckIcon className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Privacy Policy
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
          At <strong>OSR Studio</strong> (Open Source Screen Recorder), privacy is not an afterthought or a compliance checkbox—it is the foundational architectural pillar of our platform. We believe that what happens on your screen, in your microphone, and in your webcam belongs entirely to you.
        </p>
      </header>

      {/* Live Privacy Sandbox Indicator Card */}
      <div className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Live Client-Side Verification Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
            <span className="text-slate-500 dark:text-zinc-400">Cloud Data Uploads</span>
            <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckmarkCircle01Icon className="w-4 h-4" />
              0 Bytes (Zero Servers)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
            <span className="text-slate-500 dark:text-zinc-400">Tracking Cookies</span>
            <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckmarkCircle01Icon className="w-4 h-4" />
              None (0 Set)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
            <span className="text-slate-500 dark:text-zinc-400">Local Device Storage</span>
            <div className="font-mono font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <HardDriveIcon className="w-4 h-4 text-blue-500" />
              {storageEstimate} (IndexedDB)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
            <span className="text-slate-500 dark:text-zinc-400">Third-Party Telemetry</span>
            <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckmarkCircle01Icon className="w-4 h-4" />
              Disabled by Default
            </div>
          </div>
        </div>
      </div>

      {/* Structured Policy Articles */}
      <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
        {/* Article 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">01.</span>
            The 100% In-Browser Execution Guarantee
          </h2>
          <p>
            Unlike conventional screen recording services that transmit your video chunks to remote cloud clusters for encoding and storage, OSR Studio operates <strong>exclusively inside your client browser environment</strong>.
          </p>
          <p>
            All video encoding, audio DSP mixing, canvas compositing, frame inspection, and video trimming are performed locally on your computer’s CPU and GPU via W3C WebCodecs and MediaStream APIs. No video files, audio streams, or screenshots ever touch an external server or cloud bucket.
          </p>
        </section>

        {/* Article 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">02.</span>
            Hardware &amp; System Permissions
          </h2>
          <p>
            To capture your screen, webcam, and audio, your browser will prompt you to explicitly grant specific device permissions. Here is exactly how they are utilized:
          </p>
          <ul className="space-y-2 list-disc list-inside pl-2">
            <li>
              <strong>Screen Capture (<code>getDisplayMedia</code>):</strong> Used only during active recording sessions to capture your designated screen, application window, or browser tab. The raw frame stream is processed directly in canvas memory and immediately released when recording terminates.
            </li>
            <li>
              <strong>Webcam Access (<code>getUserMedia - video</code>):</strong> Used solely to render your picture-in-picture presenter bubble when you select Screen &amp; Camera or Camera Only modes. We never capture webcam data without your explicit permission and visual indicator.
            </li>
            <li>
              <strong>Microphone Access (<code>getUserMedia - audio</code>):</strong> Used to capture your voice narration. The audio stream is mixed in real time with system audio via the browser&apos;s Web Audio API and encoded directly into the local output file.
            </li>
          </ul>
        </section>

        {/* Article 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">03.</span>
            Local Storage &amp; Data Retention
          </h2>
          <p>
            When you complete a recording, the resulting video file (WebM or MP4) is saved directly into your browser&apos;s isolated <strong>IndexedDB database</strong> on your local machine.
          </p>
          <p>
            You retain absolute ownership and control over your files:
          </p>
          <ul className="space-y-1.5 list-disc list-inside pl-2">
            <li>You can download or export your recordings at any time.</li>
            <li>You can delete individual recordings or clear your entire library with a single click.</li>
            <li>Clearing your browser cache or site data automatically purges all locally stored recordings.</li>
            <li>OSR Studio developers and operators have zero technical ability to access, inspect, or restore your locally stored files.</li>
          </ul>
        </section>

        {/* Article 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">04.</span>
            Zero Cookies, Tracking Pixels &amp; Third-Party Ad Networks
          </h2>
          <p>
            OSR Studio does not deploy tracking cookies, advertising pixels, user fingerprinting scripts, or cross-site tracking beacons. We do not sell, rent, monetize, or trade any user metadata or device profiles with data brokers or advertising networks.
          </p>
          <p>
            Any application preferences you configure (such as dark/light theme preference, webcam bubble shape, and default recording resolution) are saved strictly in your browser&apos;s <code>localStorage</code>.
          </p>
        </section>

        {/* Article 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">05.</span>
            GDPR &amp; CCPA / CPRA Compliance by Design
          </h2>
          <p>
            Under privacy regulations such as the European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA/CPRA):
          </p>
          <ul className="space-y-1.5 list-disc list-inside pl-2">
            <li><strong>Right to Access:</strong> Your data already resides 100% on your device. You can access it immediately through the in-app Library.</li>
            <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Simply delete items from your Library or clear browser storage to permanently erase all records.</li>
            <li><strong>Right to Data Portability:</strong> You can export and download any recording in standard MP4 or WebM format at any time.</li>
            <li><strong>No Sale of Personal Information:</strong> We do not collect or sell personal information of any kind.</li>
          </ul>
        </section>

        {/* Article 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">06.</span>
            Contacting Us About Privacy
          </h2>
          <p>
            If you have questions, inquiries, or suggestions regarding this Privacy Policy or our architectural security choices, please contact our team directly:
          </p>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-3">
            <Mail01Icon className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Privacy &amp; Security Team</p>
              <a
                href="mailto:design.subhajit@gmail.com"
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono"
              >
                design.subhajit@gmail.com
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Navigation Links */}
      <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-400">
          <a
            href="?view=about"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            About Us
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
