import React, { useState } from 'react';

export const SeoContentSection: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };

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
            <span>Complete Guide &amp; Technical Overview</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            The Ultimate Free Online Screen Recorder for Video Creators, Educators &amp; Developers
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
            In today’s fast-paced digital creation ecosystem, having an agile, browser-based <strong>online screen recorder</strong> is essential for software developers, product managers, educators, designers, and content creators. Traditional desktop recording utilities often burden users with heavy system overhead, mandatory software installations, invasive background telemetry, and restrictive subscription paywalls. Our modern <strong>free online screen recorder</strong> solves this problem entirely by operating natively within standard web browsers using cutting-edge MediaStream, WebCodecs, and HTML5 Canvas technologies. Without installing a single executable file, you can record crystal-clear 1080p and 4K displays, capture system audio alongside microphone narration, overlay a picture-in-picture webcam feed, annotate on screen in real time, and export directly in universal MP4 or lightweight WebM formats.
          </p>
        </header>

        {/* Section 1: In-Browser vs Desktop */}
        <article className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-[#D90000] rounded-full" />
            Why Choose an In-Browser Online Screen Recorder Over Desktop Bloatware
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            Traditional desktop screen capture applications demand substantial local disk storage, continuous background updater daemons, and administrative installation privileges. When you need to quickly record a bug reproduction, demonstrate a new feature to stakeholders, or produce an educational lecture, launching our <strong>free screen video recorder</strong> in your browser takes mere seconds.
          </p>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            Because our application executes client-side through standard Web APIs—including <code>navigator.mediaDevices.getDisplayMedia</code> and <code>MediaRecorder</code>—it delivers native hardware-accelerated capture speeds with zero software installations. It runs seamlessly on Windows, macOS, Linux, and Chromebook devices, eliminating the frustration of cross-platform version discrepancies.
          </p>
        </article>

        {/* Section 2: Step-by-Step Workflow */}
        <article className="space-y-4 bg-white dark:bg-zinc-900/60 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Step-by-Step Guide: How to Use Free Screen Video Recorder
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            Recording your screen online with studio-grade fidelity takes just four straightforward steps:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
              <span className="text-xs font-bold text-[#D90000] dark:text-red-400 uppercase tracking-wider">Step 1</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Choose Your Capture Mode</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Select from four dedicated capture presets: <strong>Screen &amp; Camera</strong> (simultaneous desktop and PIP webcam), <strong>Screen Only</strong>, <strong>Camera Only</strong>, or <strong>Audio Only</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
              <span className="text-xs font-bold text-[#D90000] dark:text-red-400 uppercase tracking-wider">Step 2</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Grant Screen &amp; Audio Permissions</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Pick your desired monitor, individual application window, or browser tab. Enable the &quot;Share system audio&quot; toggle to record internal computer sound alongside your microphone narration.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
              <span className="text-xs font-bold text-[#D90000] dark:text-red-400 uppercase tracking-wider">Step 3</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Record with Real-Time Tools</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Hit the red Record button. Enjoy unlimited recording duration without annoying watermarks, adjust your webcam bubble shape and position, and pause or resume on the fly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5">
              <span className="text-xs font-bold text-[#D90000] dark:text-red-400 uppercase tracking-wider">Step 4</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Trim &amp; Export Instantly</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Preview your finished video in the integrated studio timeline, trim unnecessary beginnings or pauses, and download directly as a universal MP4 (H.264/AAC) or fast WebM file.
              </p>
            </div>
          </div>
        </article>

        {/* Section 3: Advanced Capabilities */}
        <article className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
            Advanced Features: Picture-in-Picture, Dual Audio Mixing &amp; MP4 Muxing
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            OSR Studio is built for professional presentation fidelity. Presenters can position their live webcam feed in any corner of the screen, toggle between circle, square, and rounded rectangle frames, and customize canvas margins and backgrounds for polished tutorial presentations.
          </p>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            Our multi-channel audio mixing pipeline leverages the browser’s Web Audio API to combine system audio (music, video playback, game sound, or meeting attendees) with your external USB or headset microphone, ensuring balanced levels with built-in visual volume meters and noise suppression.
          </p>
        </article>

        {/* Section 4: Privacy & Client-Side Advantages */}
        <article className="space-y-4 bg-slate-100/70 dark:bg-zinc-900/40 p-6 sm:p-8 rounded-2xl border border-slate-200/60 dark:border-zinc-800">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Uncompromising Privacy: 100% Client-Side In-Browser Processing
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed">
            Most commercial online recorders secretly stream your screen captures to cloud servers where your confidential data, business source code, and private conversations are stored. OSR Studio is architected with strict client-side isolation:
          </p>

          <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 dark:text-zinc-300 list-disc list-inside">
            <li>
              <strong>Zero Cloud Uploads:</strong> Every byte of video and audio is processed and stored strictly within your browser’s local sandbox and IndexedDB storage.
            </li>
            <li>
              <strong>No Account Required:</strong> No login walls, email harvesting, or credit card requirements. Start recording immediately with a single click.
            </li>
            <li>
              <strong>No Watermarks &amp; Unlimited Duration:</strong> We never imprint promotional logos over your footage or artificially cut off your recording after five minutes.
            </li>
            <li>
              <strong>Progressive Web App (PWA):</strong> Install OSR Studio as a standalone desktop app from your browser address bar for instant offline access even without an active internet connection.
            </li>
          </ul>
        </article>

        {/* Section 5: SEO FAQs with Accordion */}
        <article className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            Frequently Asked Questions About Our Free Online Screen Recorder
          </h2>

          <div className="space-y-3 pt-2">
            {[
              {
                q: 'What is the best free online screen recorder?',
                a: 'OSR Studio is one of the best free online screen recorders available. It runs 100% inside your web browser without requiring any software downloads, account registration, or subscriptions. It delivers watermark-free HD and 4K recording, webcam picture-in-picture overlay, system audio and microphone mixing, and instant offline exports in both WebM and MP4 formats.',
              },
              {
                q: 'How to use free screen video recorder',
                a: 'Using our free screen video recorder takes just three simple steps: 1) Select your recording mode (Screen & Camera, Screen Only, Audio Only, or Camera Only) from the home screen. 2) Grant browser permission to choose the screen, window, or Chrome tab you wish to capture, along with audio sources. 3) Click Record. When finished, pause or stop the recording to trim and download your video instantly.',
              },
              {
                q: 'How to download free screen recorder',
                a: "You do not need to download or install any desktop application to use our free screen recorder—it works directly inside modern web browsers like Chrome, Edge, and Firefox. However, you can install it as a Progressive Web App (PWA) directly from your browser's address bar for instant offline desktop access with zero installation bloat.",
              },
              {
                q: 'What is a screen recorder?',
                a: 'A screen recorder is software or a web application that captures digital visual output from a computer, laptop, or mobile screen and encodes it into a shareable video file (such as MP4 or WebM). Screen recorders are widely used for software tutorials, product demonstrations, bug reports, video meetings, online courses, and gaming walkthroughs.',
              },
              {
                q: 'Can I screen record on Chrome?',
                a: 'Yes, you can easily screen record on Google Chrome. Modern versions of Chrome natively support the Screen Capture API (navigator.mediaDevices.getDisplayMedia). With our web-based tool, you can record an entire desktop monitor, a specific application window, or an individual Chrome tab with tab audio directly inside Chrome on Windows, Mac, Linux, and Chromebooks.',
              },
              {
                q: 'Can I screen record for 1 hour?',
                a: "Yes! Unlike commercial screen recording software that imposes artificial 5-minute or 10-minute paywalls, our free online screen recorder has no hardcoded duration limits. You can record for 1 hour or longer, limited only by your computer's available RAM and local storage.",
              },
              {
                q: 'Can I record my screen online?',
                a: 'Yes, you can record your screen online directly through modern web browsers. Our tool leverages native browser APIs (MediaRecorder, WebCodecs, and HTML5 Canvas) so you can capture full-resolution video and audio without installing third-party browser extensions or desktop clients.',
              },
              {
                q: 'How long can I record my screen?',
                a: 'There is no arbitrary time restriction on our screen recorder. You can record for a few seconds or multiple hours. Because processing is done client-side on your device, the maximum recording duration depends primarily on your system memory (RAM) and free disk space.',
              },
              {
                q: 'How do I activate my screen record?',
                a: 'To activate screen recording: 1) Open our online screen recorder in your web browser. 2) Click on your preferred recording setup (e.g., "Screen & Camera" or "Screen only"). 3) In the browser prompt, select the screen or window you want to share and ensure "Share system audio" is checked if you need internal sound. 4) Hit the red "Start Recording" button or use the keyboard shortcut to activate capture.',
              },
              {
                q: "Why can't I screen record?",
                a: 'If you cannot screen record, the most common causes include: 1) Missing browser permissions (ensure your browser has permission in OS Settings > Privacy & Security > Screen Recording on macOS or Display Settings on Windows). 2) Denied browser dialog prompt when asked to share your screen. 3) Using an outdated or unsupported browser (ensure you are using the latest version of Chrome, Edge, Brave, or Firefox). 4) Restrictive enterprise or school administrator security policies.',
              },
              {
                q: 'How to screen record on a browser?',
                a: 'To record your screen in a browser, navigate to our free online recorder, choose your recording mode, and click Start. When the browser displays the screen-sharing prompt, pick the screen, window, or browser tab you wish to capture, enable audio sharing if needed, and click Share. The recorder captures frames in real time and lets you edit or download when completed.',
              },
              {
                q: 'Is screen recording safe?',
                a: 'Yes, screen recording with our tool is completely safe and private. Because our application operates 100% client-side in your local browser sandbox, your recorded video and audio streams are never sent or uploaded to any remote server or cloud database. Your footage stays strictly on your machine.',
              },
              {
                q: 'Can websites track screen recording?',
                a: 'Standard websites cannot directly detect if you are recording your screen using a system-level or independent browser tab recorder, as browsers do not expose a general API to notify regular web pages when your screen is being captured. However, certain specialized proctoring platforms or DRM-protected video streaming services use protected media paths that will display a black screen if capture is attempted.',
              },
            ].map((faq, idx) => (
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

        {/* Section 6: Proper Professional Footer */}
        <footer className="pt-12 border-t border-slate-200/90 dark:border-zinc-800/90 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            {/* Brand Column */}
            <div className="md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center p-1 border border-white/10">
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#8DB355] to-[#FFEA93] p-[1px] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D90000]" />
                  </div>
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  OSR Studio
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Free, privacy-first online screen recorder operating 100% inside your browser. Capture screen, webcam, and system audio with zero watermarks and no duration limits.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>100% Client-Side &amp; Private</span>
              </div>
            </div>

            {/* Column 1: Recording Presets */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recording Modes
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                <li>Screen &amp; Webcam PIP</li>
                <li>Full Desktop &amp; Window Capture</li>
                <li>Individual Chrome Tab Sharing</li>
                <li>Dedicated Camera Only Mode</li>
                <li>High-Fidelity Audio Narration</li>
              </ul>
            </div>

            {/* Column 2: Studio Tools */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Studio Capabilities
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                <li>Multi-Channel System Audio Mixing</li>
                <li>WebCodecs MP4 &amp; WebM Export</li>
                <li>Non-Destructive Video Trimmer</li>
                <li>Custom Canvas Backgrounds &amp; Radii</li>
                <li>Offline Progressive Web App (PWA)</li>
              </ul>
            </div>

            {/* Column 3: Popular Use Cases */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Popular Use Cases
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                <li>Product Demos &amp; Walkthroughs</li>
                <li>Software Engineering Code Reviews</li>
                <li>Online Lectures &amp; Video Courses</li>
                <li>Asynchronous Meeting Recordings</li>
                <li>Bug Reporting &amp; QA Testing</li>
              </ul>
            </div>
          </div>

          {/* Authentic Application Keywords Index for SEO */}
          <div className="pt-6 border-t border-slate-200/60 dark:border-zinc-800/60 space-y-3 text-center sm:text-left">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Related Search Terms &amp; Topics
            </h4>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 text-[11px] text-slate-600 dark:text-zinc-300">
              {[
                'online screen recorder',
                'free online screen recorder',
                'screen recorder chrome',
                'best free online screen recorder',
                'free screen video recorder',
                'record screen online',
                'screen recorder no watermark',
                'how to use free screen video recorder',
                'record screen with audio',
                'browser screen recorder',
                'screen and camera recorder',
                'free screen recorder download',
                'unlimited screen recorder',
                'mp4 screen recorder',
                'webcam picture in picture recorder',
                'safe screen recorder',
              ].map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/60 font-medium text-slate-700 dark:text-zinc-300 shadow-2xs hover:border-[#D90000]/40 transition-colors"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Copyright & Security Disclaimer */}
          <div className="pt-4 border-t border-slate-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400 text-center sm:text-left">
            <p>
              &copy; {new Date().getFullYear()} OSR Studio. All video and audio streams are processed and rendered entirely client-side on your local device.
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Zero Cloud Uploads
              </span>
              <span>&bull;</span>
              <span>No Watermark</span>
              <span>&bull;</span>
              <span>Free Forever</span>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};
