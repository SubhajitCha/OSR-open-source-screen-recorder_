import React, { useEffect } from 'react';
import {
  File01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  Mail01Icon,
  SecurityCheckIcon,
} from 'hugeicons-react';
import { ActiveView } from '../../types';

interface TermsConditionsPageProps {
  onOpenStudio: () => void;
  onNavigate?: (view: ActiveView) => void;
}

export const TermsConditionsPage: React.FC<TermsConditionsPageProps> = ({
  onOpenStudio,
  onNavigate,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div id="terms-conditions-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-in fade-in duration-200 text-slate-800 dark:text-zinc-200">
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
            Terms of Service
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            Effective: September 2026
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <header className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center shadow-xs">
          <File01Icon className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
          Please review these Terms &amp; Conditions before using OSR Studio. Because OSR Studio runs 100% locally in your browser, our terms are designed to be straightforward, fair, and respectful of your ownership rights.
        </p>
      </header>

      {/* Summary Highlight Box */}
      <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
          <InformationCircleIcon className="w-4 h-4" />
          <span>Plain-Language Summary</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-400/90 leading-relaxed">
          You own everything you create. There are no surprise subscriptions, watermarks, or hidden royalties. You are responsible for ensuring that you have legal permission to record the content, audio, and individuals captured during your sessions.
        </p>
      </div>

      {/* Structured Terms Articles */}
      <div className="space-y-8 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-zinc-300">
        {/* Article 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">01.</span>
            Acceptance of Terms
          </h2>
          <p>
            By accessing or using the OSR Studio web application at any URL where it is hosted, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should not access or use the application.
          </p>
        </section>

        {/* Article 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">02.</span>
            License of Use
          </h2>
          <p>
            OSR Studio grants you a free, non-exclusive, worldwide license to access and use the recording platform for:
          </p>
          <ul className="space-y-1.5 list-disc list-inside pl-2">
            <li>Personal and educational video recording.</li>
            <li>Commercial product demonstrations, client presentations, and professional tutorial production.</li>
            <li>Internal organizational communications and software bug reproductions.</li>
          </ul>
          <p>
            You are free to use your exported recordings for commercial monetization, distribution, or broadcasting without owing any attribution or royalty fees to OSR Studio.
          </p>
        </section>

        {/* Article 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">03.</span>
            100% User Content Ownership
          </h2>
          <p>
            OSR Studio asserts <strong>no intellectual property rights or ownership claims</strong> over any screen captures, webcam videos, audio recordings, or metadata generated during your use of the application.
          </p>
          <p>
            Because all encoding and saving takes place inside your client browser, our team has no access to your media files. You retain sole ownership, copyright, and full liability for all material you record and export.
          </p>
        </section>

        {/* Article 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">04.</span>
            Responsible &amp; Lawful Use
          </h2>
          <p>
            When utilizing OSR Studio, you agree to adhere to all applicable local, national, and international laws, including:
          </p>
          <ul className="space-y-1.5 list-disc list-inside pl-2">
            <li>
              <strong>Consent Laws:</strong> Complying with wiretapping and recording consent requirements (such as two-party or all-party consent laws) before capturing private conversations, online meetings, or voice communications.
            </li>
            <li>
              <strong>Intellectual Property:</strong> Refraining from capturing, reproducing, or redistributing copyrighted broadcasts, streaming services, or proprietary media without proper authorization from the copyright holder.
            </li>
            <li>
              <strong>Confidential Information:</strong> Ensuring that sensitive personal data, financial information, or protected health information is not recorded or shared inadvertently.
            </li>
          </ul>
        </section>

        {/* Article 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">05.</span>
            Local Storage &amp; Data Responsibility
          </h2>
          <p>
            OSR Studio records directly to your browser&apos;s internal IndexedDB storage. You understand and acknowledge that:
          </p>
          <ul className="space-y-1.5 list-disc list-inside pl-2">
            <li>
              Clearing browser history, deleting website storage, running privacy cleaner extensions, or resetting browser profiles may permanently delete locally stored recordings.
            </li>
            <li>
              You are strongly advised to export or download important recordings to your computer&apos;s physical hard drive immediately following capture.
            </li>
            <li>
              OSR Studio maintains no central cloud backup and cannot recover files lost through local browser storage purging.
            </li>
          </ul>
        </section>

        {/* Article 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">06.</span>
            Disclaimer of Warranties &amp; Limitation of Liability
          </h2>
          <p>
            OSR Studio is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, either express or implied.
          </p>
          <p>
            To the maximum extent permitted by applicable law, OSR Studio developers, contributors, and operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages—including loss of recordings, hardware resource contention, or business interruptions—arising out of your use of or inability to use the software.
          </p>
        </section>

        {/* Article 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-[#D90000] font-mono">07.</span>
            Contact &amp; Inquiries
          </h2>
          <p>
            For legal inquiries, licensing questions, or terms feedback, please reach out to our team at:
          </p>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center gap-3">
            <Mail01Icon className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Legal &amp; Developer Relations</p>
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
            href="?view=privacy"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Privacy Policy
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
