export interface TechSection {
  id: string;
  title: string;
  badge: string;
  summary: string;
  details: string[];
  codeSample?: string;
}

export const ARCHITECTURE_DOCS: TechSection[] = [
  {
    id: 'capture-pipeline',
    title: '1. Display & Camera Capture Pipeline',
    badge: 'W3C Screen Capture API',
    summary: 'Captures ultra-high definition display streams, application windows, or browser tabs alongside hardware camera feeds with zero latency.',
    details: [
      'Utilizes `navigator.mediaDevices.getDisplayMedia()` with customized frame rate (up to 60 FPS) and display surface constraints.',
      'Handles automatic graceful cleanup when the user ends capture via the native browser UI overlay.',
      'Supports concurrent `navigator.mediaDevices.getUserMedia()` for webcam acquisition at ideal 1080p/720p hardware resolutions.',
      'Zero server upload or intermediary cloud relay: streams remain 100% local inside the client browser sandbox.',
    ],
    codeSample: `// Native Browser Screen Capture
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: { frameRate: { ideal: 60, max: 60 }, displaySurface: 'monitor' },
  audio: { echoCancellation: true, noiseSuppression: true }
});`,
  },
  {
    id: 'canvas-compositor',
    title: '2. 60 FPS Canvas Picture-in-Picture Compositor',
    badge: 'HTML5 2D Canvas + RAF',
    summary: 'Merges screen capture and webcam video streams into a unified high-framerate stream with customizable geometric masks, borders, and position coordinates.',
    details: [
      'Runs a high-performance `requestAnimationFrame` loop maintaining sync with display refresh rates.',
      'Supports customizable corner presets (Top-Left, Top-Right, Bottom-Left, Bottom-Right) and arbitrary coordinate placement.',
      'Provides geometric clip path transformations: Circular circle masks, Squircle/Rounded rects, and Standard Rectangles.',
      'Applies real-time horizontal canvas flipping for natural webcam selfie mirroring and soft drop-shadow rendering.',
      'Exports the composite stream using `canvas.captureStream(60)` directly into the recording encoder.',
    ],
    codeSample: `// Dynamic Circular Clip Path & Mirroring
ctx.save();
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
ctx.clip();
if (pipConfig.mirror) {
  ctx.translate(centerX, centerY);
  ctx.scale(-1, 1);
  ctx.translate(-centerX, -centerY);
}
ctx.drawImage(webcamVideo, x, y, width, height);
ctx.restore();`,
  },
  {
    id: 'audio-matrix',
    title: '3. Web Audio Matrix Mixer & Real-Time Analyser',
    badge: 'Web Audio API',
    summary: 'Mixes multiple heterogeneous audio sources (Microphone + System Tab Audio) into a single balanced studio track with independent gain controllers.',
    details: [
      'Creates an `AudioContext` graph feeding microphone and system audio streams into independent `GainNode` volume controllers.',
      'Connects streams to an `AnalyserNode` performing real-time Fast Fourier Transform (FFT) analysis for live decibel meters and frequency waveforms.',
      'Merges into a single `MediaStreamAudioDestinationNode` seamlessly combined with the composite video track.',
      'Includes hardware-level echo cancellation, noise suppression, and auto-gain control configurations.',
    ],
    codeSample: `// Web Audio Multi-Track Mixing Graph
const audioCtx = new AudioContext();
const destination = audioCtx.createMediaStreamDestination();
const micGain = audioCtx.createGain();
micGain.gain.setValueAtTime(micVolume, audioCtx.currentTime);

const micSource = audioCtx.createMediaStreamSource(micStream);
micSource.connect(micGain);
micGain.connect(destination);
micGain.connect(analyserNode);`,
  },
  {
    id: 'media-recorder',
    title: '4. MediaRecorder Chunked Encoding Engine',
    badge: 'W3C MediaStream Recording API',
    summary: 'Encodes the composited audio/video streams into standardized media containers (VP9, VP8, H.264 / AV1) with zero frame drops.',
    details: [
      'Auto-detects the optimal hardware-accelerated MIME type available in the host browser (VP9 with Opus audio as primary recommendation).',
      'Emits continuous 1000ms timeslice chunks to prevent browser memory bloat during extended recording sessions.',
      'Calculates real-time live bitrate (Mbps), accumulated file size, and dynamic timestamp duration.',
      'Enables non-destructive pause and resume with automatic paused time offset accounting.',
    ],
    codeSample: `// MediaRecorder with High-Efficiency VP9 Codec
const recorder = new MediaRecorder(combinedStream, {
  mimeType: 'video/webm;codecs=vp9,opus',
  videoBitsPerSecond: 8000000 // 8 Mbps High Quality
});
recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
recorder.start(1000); // 1-sec chunk interval`,
  },
  {
    id: 'storage-and-filesystem',
    title: '5. Offline Storage & Direct File System Access',
    badge: 'IndexedDB + File System Access API',
    summary: 'Allows direct-to-disk native file streaming and offline persistent history storage without any cloud database dependencies.',
    details: [
      'Direct Disk Streaming: Uses `window.showSaveFilePicker()` to write video files directly to the user\'s local disk without memory duplication.',
      'Persistent Local Library: Uses client-side IndexedDB to store recordings, thumbnails, metadata, and custom tag taxonomy.',
      'Instant Video Thumbnails: Extracts lightweight JPEG preview frames at 0.5s timestamp using an off-screen HTML5 video canvas.',
      'Quota Diagnostic: Continuously monitors browser storage usage via `navigator.storage.estimate()`.',
    ],
    codeSample: `// Native File System Access Direct Save
const handle = await window.showSaveFilePicker({
  suggestedName: \`Recording-\${Date.now()}.webm\`,
  types: [{ description: 'WebM Video', accept: { 'video/webm': ['.webm'] } }]
});
const writable = await handle.createWritable();
await writable.write(videoBlob);
await writable.close();`,
  },
  {
    id: 'trimmer-and-snapshots',
    title: '6. Client-Side Trimming & Frame Snapshot Studio',
    badge: 'Canvas + HTMLMediaElement',
    summary: 'Provides non-linear video trimming and high-resolution PNG snapshot capture entirely within the browser without FFmpeg server calls.',
    details: [
      'Interactive scrubber allowing millisecond-accurate start and end trimming bounds.',
      'Frame Snapshot Extractor: Renders the precise current frame onto an offscreen canvas for instant 4K/1080p PNG download or clipboard copy.',
      'Bookmark/Timestamp Navigator: Users can drop keyframe markers during recording and instantly jump to them during review.',
    ],
    codeSample: `// High-Res Frame Snapshot Extraction
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
canvas.getContext('2d').drawImage(video, 0, 0);
const snapshotUrl = canvas.toDataURL('image/png');`,
  },
];

export const OPEN_SOURCE_STACK = [
  {
    category: 'Capture & Media Core',
    tech: 'W3C Screen Capture & MediaStreams',
    license: 'W3C Open Standard',
    cost: '$0.00 / Free',
    description: 'Hardware-level display capture, window picker, and webcam device streaming.',
  },
  {
    category: 'Audio Processing',
    tech: 'Web Audio API (AudioContext, GainNode, Analyser)',
    license: 'W3C Open Standard',
    cost: '$0.00 / Free',
    description: 'DSP audio graph mixing, real-time waveform calculation, and studio gain controllers.',
  },
  {
    category: 'Video Encoding',
    tech: 'MediaRecorder API (VP9, VP8, H.264, Opus)',
    license: 'W3C Open Standard',
    cost: '$0.00 / Free',
    description: 'Hardware-accelerated live video and audio encoding into standard WebM/MP4 containers.',
  },
  {
    category: 'Local Storage',
    tech: 'IndexedDB & File System Access API',
    license: 'W3C Open Standard',
    cost: '$0.00 / Free',
    description: 'Persistent offline recording storage and direct-to-disk streaming without cloud dependencies.',
  },
  {
    category: 'UI & Animations',
    tech: 'React 19, Tailwind CSS, Motion, Lucide Icons',
    license: 'MIT License',
    cost: '$0.00 / Free',
    description: 'Modern, reactive single-page architecture with sleek typography and micro-interactions.',
  },
];
