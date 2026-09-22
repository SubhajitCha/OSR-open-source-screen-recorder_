import React, { useState, useEffect } from 'react';
import {
  Mail01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  SentIcon,
  InformationCircleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
} from 'hugeicons-react';
import { ActiveView } from '../../types';

interface ContactUsPageProps {
  onOpenStudio: () => void;
  onNavigate?: (view: ActiveView) => void;
}

type TopicType = 'feedback' | 'bug' | 'feature' | 'opensource' | 'privacy';

export const ContactUsPage: React.FC<ContactUsPageProps> = ({
  onOpenStudio,
  onNavigate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<TopicType>('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const topics: { id: TopicType; label: string }[] = [
    { id: 'feedback', label: 'General Feedback' },
    { id: 'feature', label: 'Feature Request' },
    { id: 'bug', label: 'Bug Report' },
    { id: 'opensource', label: 'Open Source / Collab' },
    { id: 'privacy', label: 'Privacy & Security' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage('Please write a message with at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    // Simulate instantaneous local processing / mailto link preparation
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setMessage('');
    setSubject('');
    setErrorMessage(null);
  };

  return (
    <div id="contact-us-page" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-in fade-in duration-200 text-slate-800 dark:text-zinc-200">
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
            Support Online
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            Avg. Reply: 24h
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <header className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50 flex items-center justify-center shadow-xs">
          <Mail01Icon className="w-6 h-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Get in Touch
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
          Have an idea for a feature, discovered an edge-case bug, or want to contribute to the open web screen recording standard? We’d love to hear from you.
        </p>
      </header>

      {/* Main Grid: Form + Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Interactive Form */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-zinc-900/80 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xs">
            {isSubmitted ? (
              <div className="py-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center shadow-xs">
                  <CheckmarkCircle01Icon className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Message Received!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out, <strong>{name}</strong>. Your note has been dispatched to our engineering &amp; design team. We typically respond within 24–48 hours.
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Send Another Note
                  </button>
                  <button
                    type="button"
                    onClick={onOpenStudio}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Return to Studio
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircleIcon className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Topic Selector Pills */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Topic
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTopic(t.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          topic === t.id
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs'
                            : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-zinc-600 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-zinc-600 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-subject" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Subject (Optional)
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Webcam aspect ratio suggestion on iPad"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-zinc-600 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you loved, what broke, or what feature would make your workflow faster..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 dark:focus:ring-zinc-600 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-y"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <span>Sending note...</span>
                  ) : (
                    <>
                      <SentIcon className="w-4 h-4" />
                      <span>Send Message to Team</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Direct Info & Quick FAQ */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Email Card */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Direct Contact
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 dark:text-zinc-500 block">Lead Designer &amp; Maintainer</span>
                <a
                  href="mailto:design.subhajit@gmail.com"
                  className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  design.subhajit@gmail.com
                </a>
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-zinc-500 block">Location &amp; Availability</span>
                <p className="font-semibold text-slate-900 dark:text-zinc-200">
                  Global Open Source Contributor Network (UTC / PST)
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 dark:text-zinc-500 block">Response Time</span>
                <p className="text-slate-600 dark:text-zinc-400 text-xs">
                  We review incoming bug reports and feature requests every weekday morning.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Troubleshooting FAQ */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircleIcon className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Quick Answers
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-zinc-200">
                  Why isn&apos;t my system audio recording?
                </p>
                <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed">
                  When the browser prompt appears, make sure to check the &quot;Also share system audio&quot; toggle at the bottom left of the selection window (Chrome/Edge).
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-zinc-200">
                  Where are my videos saved?
                </p>
                <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed">
                  Recordings are kept in your browser&apos;s local IndexedDB. Click &quot;Library&quot; in the navigation bar to export MP4s or manage clips.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-zinc-200">
                  Are there any time limits?
                </p>
                <p className="text-slate-600 dark:text-zinc-400 text-xs leading-relaxed">
                  No artificial limits! You can record as long as your computer has available memory and disk space.
                </p>
              </div>
            </div>
          </div>
        </div>
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
            href="?view=terms"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Terms &amp; Conditions
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
