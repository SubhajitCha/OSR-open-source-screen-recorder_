import React from 'react';
import { ActiveView } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface AppFooterProps {
  onNavigate?: (view: ActiveView) => void;
  activeView?: ActiveView;
  isRecording?: boolean;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate, activeView, isRecording = false }) => {
  const { t } = useLanguage();

  const handleNav = (targetView: ActiveView) => {
    if (onNavigate) {
      onNavigate(targetView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Dedicated hard page-refresh navigation for About Us, Privacy Policy, Terms & Conditions, Contact Us
  const handleHardPageNav = (e: React.MouseEvent<HTMLAnchorElement>, _targetView: 'about' | 'privacy' | 'terms' | 'contact') => {
    if (isRecording) {
      const confirmLeave = window.confirm(
        'A recording is currently in progress. Navigating to another page will stop and reset the current recording. Do you want to continue?'
      );
      if (!confirmLeave) {
        e.preventDefault();
        return;
      }
    }
  };

  const f = t.footer;

  return (
    <footer
      id="app-global-footer"
      className="w-full bg-white dark:bg-[#161A22] border-t border-slate-200/90 dark:border-white/10 transition-colors duration-200 select-none z-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-[1.45fr_1fr_1fr_1fr] gap-6 lg:gap-8 text-left">
          {/* Brand Column */}
          <div className="sm:col-span-3 md:col-span-1 space-y-2.5">
            <button
              type="button"
              onClick={() => handleNav('studio')}
              className="flex items-center gap-2 cursor-pointer group text-left border-0 bg-transparent p-0"
              aria-label="FSR Studio - Home"
            >
              <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center p-1 border border-white/10 group-hover:scale-105 transition-transform">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#8DB355] to-[#FFEA93] p-[1px] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D90000]" />
                </div>
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                FSR Studio
              </span>
            </button>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-sm">
              {f.brandTagline}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{f.clientSideNotice}</span>
            </div>
            {/* Better Launch Badge */}
            <div className="pt-2">
              <a
                href="https://www.betterlaunch.co/product/fsr-studio-free-screen-record"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
              >
                <img
                  src="https://www.betterlaunch.co/badge-live-light.svg"
                  alt="Better Launch"
                  width="200"
                  height="56"
                  className="h-10 w-auto object-contain rounded-lg"
                />
              </a>
            </div>
          </div>

          {/* Column 1: Recording Presets */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {f.recordingModesHeading}
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('studio')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {f.modes.screenCam}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('studio')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {f.modes.desktopWindow}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('studio')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {f.modes.tabShare}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('studio')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {f.modes.camOnly}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('studio')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                >
                  {f.modes.audioOnly}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Studio Tools */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {f.studioToolsHeading}
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
              <li>{f.tools.audioMixing}</li>
              <li>{f.tools.mp4Export}</li>
              <li>{f.tools.trimmer}</li>
              <li>{f.tools.canvasRadii}</li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('docs')}
                  className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left ${
                    activeView === 'docs' ? 'font-bold text-slate-900 dark:text-white' : ''
                  }`}
                >
                  {f.tools.architecture}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('services')}
                  className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left ${
                    activeView === 'services' ? 'font-bold text-slate-900 dark:text-white' : ''
                  }`}
                >
                  {f.tools.diagnostics}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company & Legal */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {f.companyLegalHeading}
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
              <li>
                <a
                  href="?view=about"
                  id="footer-about-link"
                  onClick={(e) => handleHardPageNav(e, 'about')}
                  className={`inline-block hover:text-slate-900 dark:hover:text-white transition-colors text-left ${
                    activeView === 'about' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
                  }`}
                >
                  {f.links.about}
                </a>
              </li>
              <li>
                <a
                  href="?view=privacy"
                  id="footer-privacy-link"
                  onClick={(e) => handleHardPageNav(e, 'privacy')}
                  className={`inline-block hover:text-slate-900 dark:hover:text-white transition-colors text-left ${
                    activeView === 'privacy' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
                  }`}
                >
                  {f.links.privacy}
                </a>
              </li>
              <li>
                <a
                  href="?view=terms"
                  id="footer-terms-link"
                  onClick={(e) => handleHardPageNav(e, 'terms')}
                  className={`inline-block hover:text-slate-900 dark:hover:text-white transition-colors text-left ${
                    activeView === 'terms' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
                  }`}
                >
                  {f.links.terms}
                </a>
              </li>
              <li>
                <a
                  href="?view=contact"
                  id="footer-contact-link"
                  onClick={(e) => handleHardPageNav(e, 'contact')}
                  className={`inline-block hover:text-slate-900 dark:hover:text-white transition-colors text-left ${
                    activeView === 'contact' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
                  }`}
                >
                  {f.links.contact}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  id="footer-library-link"
                  onClick={() => handleNav('library')}
                  className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left ${
                    activeView === 'library' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
                  }`}
                >
                  {f.links.library}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Global Multi-Language Selector Section for Crawlers & Global Users */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{f.chooseLanguage}</span>
            </h4>
          </div>
          <LanguageSelector variant="inline-links" />
        </div>

        {/* Authentic Application Keywords Index for SEO */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 space-y-3 text-center sm:text-left">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {f.searchTermsHeading}
          </h4>
          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 text-[11px] text-slate-600 dark:text-zinc-300">
            {f.searchTerms.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-[#232936] border border-slate-200/80 dark:border-white/10 font-medium text-slate-700 dark:text-zinc-300 shadow-2xs hover:border-[#D90000]/40 transition-colors"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Copyright & Security Disclaimer */}
        <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400 text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} {f.copyright}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1.5 text-xs">
            <a
              href="?view=about"
              onClick={(e) => handleHardPageNav(e, 'about')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors ${
                activeView === 'about' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
              }`}
            >
              {f.links.about}
            </a>
            <span>&bull;</span>
            <a
              href="?view=privacy"
              onClick={(e) => handleHardPageNav(e, 'privacy')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors ${
                activeView === 'privacy' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
              }`}
            >
              {f.links.privacy}
            </a>
            <span>&bull;</span>
            <a
              href="?view=terms"
              onClick={(e) => handleHardPageNav(e, 'terms')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors ${
                activeView === 'terms' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
              }`}
            >
              {f.links.terms}
            </a>
            <span>&bull;</span>
            <a
              href="?view=contact"
              onClick={(e) => handleHardPageNav(e, 'contact')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors ${
                activeView === 'contact' ? 'font-bold text-[#D90000] dark:text-[#FFEA93]' : ''
              }`}
            >
              {f.links.contact}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
