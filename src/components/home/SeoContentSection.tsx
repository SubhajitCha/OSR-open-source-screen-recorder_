import React, { useState } from 'react';
import { ActiveView } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SeoContentSectionProps {
  onNavigate?: (view: ActiveView) => void;
}

export const SeoContentSection: React.FC<SeoContentSectionProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };

  const seo = t.seoSection;

  return (
    <section
      id="seo-knowledge-base"
      aria-label="Comprehensive Free Online Screen Recorder Guide"
      className="w-full border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#0c0e12] text-slate-800 dark:text-zinc-200 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors select-text"
    >
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header & Main Keyword Introduction */}
        <header className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-100/70 text-[#D90000] dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 dark:border-red-900/40">
            <span className="w-2 h-2 rounded-full bg-[#D90000] animate-pulse" />
            <span>{seo.badge}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {seo.mainHeading}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
            {seo.introParagraph}
          </p>
        </header>

        {/* Section 1: In-Browser vs Desktop */}
        <article className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-[#D90000] rounded-full" />
            {seo.section1Title}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            {seo.section1P1}
          </p>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            {seo.section1P2}
          </p>
        </article>

        {/* Section 2: Step-by-Step Workflow */}
        <article className="space-y-4 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {seo.section2Title}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            {seo.section2Intro}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {seo.steps.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5"
              >
                <span className="text-xs font-bold text-[#D90000] dark:text-red-400 uppercase tracking-wider">
                  {item.step}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </article>

        {/* Section 3: Advanced Capabilities */}
        <article className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
            {seo.section3Title}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            {seo.section3P1}
          </p>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            {seo.section3P2}
          </p>
        </article>

        {/* Section 4: Privacy & Client-Side Advantages */}
        <article className="space-y-4 bg-slate-100/70 dark:bg-zinc-900/40 p-6 sm:p-8 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {seo.section4Title}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            {seo.section4Intro}
          </p>

          <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 dark:text-zinc-300 list-disc list-inside">
            <li>
              <strong>{seo.privacyBullet1Title}:</strong> {seo.privacyBullet1Desc}
            </li>
            <li>
              <strong>{seo.privacyBullet2Title}:</strong> {seo.privacyBullet2Desc}
            </li>
            <li>
              <strong>{seo.privacyBullet3Title}:</strong> {seo.privacyBullet3Desc}
            </li>
            <li>
              <strong>{seo.privacyBullet4Title}:</strong> {seo.privacyBullet4Desc}
            </li>
          </ul>
        </article>

        {/* Section 5: SEO FAQs with Accordion */}
        <article className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            {seo.faqTitle}
          </h2>

          <div className="space-y-3 pt-2">
            {seo.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm sm:text-base text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 dark:text-zinc-500 font-mono text-base ml-2">
                    {activeFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed border-t border-slate-100 dark:border-zinc-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
};
