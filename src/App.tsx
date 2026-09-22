import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircleIcon,
  Tick01Icon,
  InformationCircleIcon,
  Cancel01Icon,
} from 'hugeicons-react';
import {
  AudioSettings,
  PipConfig,
  RecordingMode,
  VideoBookmark,
  VideoSettings,
  ActiveView,
  PipPosition,
  SavedRecording,
  RecordingMetadata,
  Project,
  CompositionLayout,
  RecorderAspectRatio,
  RecorderBackgroundConfig,
  SmartRecordingConfig,
  PrompterConfig,
} from './types';
import { RecorderEngine } from './services/recorderEngine';
import { getAllRecordings, saveRecordingToDB, generateThumbnailFromBlob, saveActiveEditingSession, getActiveEditingSession, clearActiveEditingSession } from './services/db';
import { getBestSupportedVideoMimeType } from './services/browserCapabilities';
import { logbook } from './services/logbook';
import { Navbar } from './components/Navbar';
import { RecorderDashboard } from './components/RecorderDashboard';
import { VideoEditor } from './components/editor/VideoEditor';
import { RecordingsLibrary } from './components/RecordingsLibrary';
import { ServicesStatusPage } from './components/ServicesStatusPage';
import { CountdownModal } from './components/CountdownModal';
import { SettingsModal } from './components/SettingsModal';
import { TechDocsPage } from './components/TechDocsPage';
import { LogbookPage } from './components/LogbookPage';
import { RecordingReviewScreen } from './components/recorder/RecordingReviewScreen';
import { ModeSelectionScreen } from './components/recorder/ModeSelectionScreen';
import { PrivacyPolicyPage } from './components/pages/PrivacyPolicyPage';
import { AboutUsPage } from './components/pages/AboutUsPage';
import { TermsConditionsPage } from './components/pages/TermsConditionsPage';
import { ContactUsPage } from './components/pages/ContactUsPage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { ServerErrorPage } from './components/pages/ServerErrorPage';
import { AppFooter } from './components/AppFooter';

export default function App() {
  // Navigation & Views with deep-link hash/search support
  const getInitialView = (): ActiveView => {
    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        const viewParam = (searchParams.get('view') || hash || '').toLowerCase();

        const validViews: ActiveView[] = [
          'studio',
          'library',
          'docs',
          'services',
          'logbook',
          'privacy',
          'about',
          'terms',
          'contact',
          '404',
          '500',
        ];

        if (viewParam) {
          if (validViews.includes(viewParam as ActiveView)) {
            return viewParam as ActiveView;
          }
          // If a non-empty route/param was requested but does not exist, route to 404
          return '404';
        }
      }
    } catch {
      // ignore
    }
    return 'studio';
  };

  const [activeView, setActiveView] = useState<ActiveView>(getInitialView);
  const [hasSelectedInitialMode, setHasSelectedInitialMode] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [recordingsCount, setRecordingsCount] = useState<number>(0);

  // In-App Toast Notification State
  const [toast, setToast] = useState<{
    id: string;
    type: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 8);
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 5000);
  }, []);

  // Recording State
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording' | 'paused' | 'review' | 'editing'>('idle');
  const [isStoppingRecording, setIsStoppingRecording] = useState<boolean>(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [bytesRecorded, setBytesRecorded] = useState<number>(0);
  const [bitrateMbps, setBitrateMbps] = useState<number>(0);
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [activeWebcamStream, setActiveWebcamStream] = useState<MediaStream | null>(null);
  const [activeScreenStream, setActiveScreenStream] = useState<MediaStream | null>(null);
  const [activeMicStream, setActiveMicStream] = useState<MediaStream | null>(null);

  // Synchronous stream refs to ensure zero-leak hardware teardown regardless of React closure state
  const activeWebcamStreamRef = useRef<MediaStream | null>(null);
  const activeScreenStreamRef = useRef<MediaStream | null>(null);
  const activeMicStreamRef = useRef<MediaStream | null>(null);

  const updateActiveWebcamStream = useCallback((stream: MediaStream | null) => {
    activeWebcamStreamRef.current = stream;
    setActiveWebcamStream(stream);
  }, []);

  const updateActiveScreenStream = useCallback((stream: MediaStream | null) => {
    activeScreenStreamRef.current = stream;
    setActiveScreenStream(stream);
  }, []);

  const updateActiveMicStream = useCallback((stream: MediaStream | null) => {
    activeMicStreamRef.current = stream;
    setActiveMicStream(stream);
  }, []);

  // Master teardown function: guarantees total revocation of camera, screen, and mic hardware handles
  const stopAllActiveMediaAccess = useCallback(() => {
    const streamsToStop = [
      activeWebcamStreamRef.current,
      activeScreenStreamRef.current,
      activeMicStreamRef.current,
      activeWebcamStream,
      activeScreenStream,
      activeMicStream,
    ];

    streamsToStop.forEach((stream) => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          try {
            track.onended = null;
            track.enabled = false;
            track.stop();
          } catch (_) {}
        });
      }
    });

    activeWebcamStreamRef.current = null;
    activeScreenStreamRef.current = null;
    activeMicStreamRef.current = null;

    setActiveWebcamStream(null);
    setActiveScreenStream(null);
    setActiveMicStream(null);

    if (recorderEngineRef.current) {
      try {
        recorderEngineRef.current.cleanupStreams();
      } catch (_) {}
    }
  }, [activeWebcamStream, activeScreenStream, activeMicStream]);

  // Finished recording output data & Project model
  const [lastRecordingData, setLastRecordingData] = useState<{
    blob: Blob;
    screenBlob?: Blob;
    camBlob?: Blob;
    duration: number;
    mimeType: string;
    bookmarks: VideoBookmark[];
    metadata?: RecordingMetadata;
    project?: Project;
  } | null>(null);

  // Composition States for Clean 3-Zone Studio UX
  const [compositionLayout, setCompositionLayout] = useState<CompositionLayout>('overlay');
  const [aspectRatio, setAspectRatio] = useState<RecorderAspectRatio>('16:9');
  const [background, setBackground] = useState<RecorderBackgroundConfig>({
    type: 'gradient',
    value: 'linear-gradient(145deg, #18181B 0%, #131316 50%, #0D0D0F 100%)',
    padding: 24,
    borderRadius: 12,
  });
  const [smartConfig, setSmartConfig] = useState<SmartRecordingConfig>({
    smoothCursor: true,
    detectClicks: true,
    automaticZoom: true,
    smartFraming: true,
    autoSpeedTyping: true,
  });
  const [prompter, setPrompter] = useState<PrompterConfig>({
    enabled: false,
    text: '',
    speed: 3,
    fontSize: 18,
    isScrolling: false,
  });

  // Legacy Configuration States
  const [mode, setMode] = useState<RecordingMode>('screen_cam');

  const [pipConfig, setPipConfig] = useState<PipConfig>({
    enabled: true,
    position: 'bottom-right',
    shape: 'rounded',
    size: 'medium',
    mirror: true,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    includeMic: true,
    includeSystemAudio: true,
    micDeviceId: '',
    micVolume: 1.0,
    systemVolume: 1.0,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });

  const [isMicBlocked, setIsMicBlocked] = useState<boolean>(false);

  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: 'native',
    fps: 60,
    codec: 'video/webm;codecs=vp9,opus',
    bitrateMbps: 8,
    countdownSeconds: 3,
    directSaveToFileSystem: false,
  });

  // Auto-detect optimal video codec and initialize logbook observer & capture handle config on mount
  useEffect(() => {
    logbook.init();
    const bestCodec = getBestSupportedVideoMimeType();
    setVideoSettings((prev) => ({ ...prev, codec: bestCodec }));
    refreshLibraryCount();

    // Set Capture Handle Config for self-capture detection & coordination
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && 'setCaptureHandleConfig' in navigator.mediaDevices) {
      try {
        (navigator.mediaDevices as any).setCaptureHandleConfig({
          handle: 'osr-recorder',
          exposeOrigin: true,
          permittedOrigins: ['*'],
        });
      } catch (e) {
        console.warn('Capture Handle Config could not be set:', e);
      }
    }

    // Auto-acquire microphone stream on initial load if mic is enabled and not in editor mode
    if (audioSettings.includeMic && !activeMicStream && recordingState !== 'editing') {
      handleEnableMicPreview(true, true).catch(() => {});
    }

    // Monitor browser microphone permission changes
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions
          .query({ name: 'microphone' as PermissionName })
          .then((permissionStatus) => {
            setIsMicBlocked(permissionStatus.state === 'denied');
            permissionStatus.onchange = () => {
              const isDenied = permissionStatus.state === 'denied';
              setIsMicBlocked(isDenied);
              if (permissionStatus.state === 'granted') {
                handleEnableMicPreview(true, true).catch(() => {});
              }
            };
          })
          .catch(() => {});
      } catch (_) {}
    }
  }, []);

  // Hash and popstate listener for back/forward browser navigation and direct URLs
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        const viewParam = (searchParams.get('view') || hash || '').toLowerCase();

        const validViews: ActiveView[] = [
          'studio',
          'library',
          'docs',
          'services',
          'logbook',
          'privacy',
          'about',
          'terms',
          'contact',
          '404',
          '500',
        ];

        if (viewParam) {
          if (validViews.includes(viewParam as ActiveView)) {
            setActiveView(viewParam as ActiveView);
          } else {
            setActiveView('404');
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Sync runtime context with logbook observer
  useEffect(() => {
    logbook.updateContext({
      activeView,
      recordingState,
      resolution: videoSettings.resolution,
      codec: videoSettings.codec,
      mode,
    });
  }, [activeView, recordingState, videoSettings.resolution, videoSettings.codec, mode]);

  // Keep document.title synchronized so user can see live recording status even in background tabs
  useEffect(() => {
    if (recordingState === 'recording') {
      const mins = Math.floor(durationSeconds / 60);
      const secs = durationSeconds % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      document.title = `🔴 Recording (${formatted}) — OSR`;
    } else if (recordingState === 'paused') {
      document.title = `⏸️ Paused — OSR`;
    } else {
      document.title = `OSR — Open Source Screen Recorder`;
    }
  }, [recordingState, durationSeconds]);

  // Session Recovery: Restore active editing or review session on browser refresh or reload
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedState = sessionStorage.getItem('osr_active_state');
        if (savedState === 'editing' || savedState === 'review') {
          const session = await getActiveEditingSession();
          if (session && session.blob) {
            setLastRecordingData(session);
            setRecordingState(savedState);
            setHasSelectedInitialMode(true);
          }
        }
      } catch (err) {
        console.warn('Could not restore session:', err);
      }
    };
    restoreSession();
  }, []);

  const refreshLibraryCount = async () => {
    try {
      const items = await getAllRecordings();
      setRecordingsCount(items.length);
    } catch {
      // ignore
    }
  };

  // Recorder engine instance reference
  const recorderEngineRef = useRef<RecorderEngine | null>(null);
  const isStartingRecordingRef = useRef<boolean>(false);

  const initRecorderEngine = useCallback(() => {
    if (!recorderEngineRef.current) {
      recorderEngineRef.current = new RecorderEngine({
        onTimeUpdate: (dur) => setDurationSeconds(Math.round(dur)),
        onDataChunk: (bytes, bitrate) => {
          setBytesRecorded(bytes);
          setBitrateMbps(bitrate);
        },
        onStateChange: (state) => {
          if (state === 'recording') setRecordingState('recording');
          else if (state === 'paused') setRecordingState('paused');
          else if (state === 'stopped') {
            // Handled in stopRecording promise
          }
        },
        onError: (err) => {
          console.warn('Recorder Engine Error:', err);
          const msg = err.message || 'Screen share was not provided or was cancelled.';
          showToast(msg, 'error');
          setActiveWebcamStream(null);
          isStartingRecordingRef.current = false;
          // Guard: NEVER reset to idle if user is in review or editing
          setRecordingState((prev) => (prev === 'review' || prev === 'editing' ? prev : 'idle'));
        },
        onBookmarkAdded: () => {
          // bookmark added
        },
      });
    }
    return recorderEngineRef.current;
  }, [showToast]);

  const countdownStartTimerRef = useRef<number | null>(null);

  const handleCountdownComplete = useCallback(() => {
    // 1. Immediately dismiss countdown overlay and transition state
    setRecordingState('recording');

    if (countdownStartTimerRef.current) {
      window.clearTimeout(countdownStartTimerRef.current);
    }

    // 2. Allow browser, OS window capture pipeline, and compositor 500ms
    // to completely flush out any frames showing the countdown modal,
    // guaranteeing that the timer is completely gone before MediaRecorder starts.
    countdownStartTimerRef.current = window.setTimeout(() => {
      countdownStartTimerRef.current = null;
      try {
        const engine = recorderEngineRef.current;
        if (!engine) {
          throw new Error('Recording engine was closed');
        }
        engine.startMediaRecorder();
      } catch (err: unknown) {
        console.warn('Failed to start media recorder after countdown:', err);
        if (recorderEngineRef.current) {
          recorderEngineRef.current.cleanupStreams();
          recorderEngineRef.current = null;
        }
        setActiveWebcamStream(null);
        setRecordingState('idle');
        showToast('Could not start recording', 'error');
      }
    }, 500);
  }, [showToast]);

  const handleCountdownCancel = useCallback(() => {
    if (countdownStartTimerRef.current) {
      window.clearTimeout(countdownStartTimerRef.current);
      countdownStartTimerRef.current = null;
    }
    stopAllActiveMediaAccess();
    if (recorderEngineRef.current) {
      recorderEngineRef.current.cleanupStreams();
      recorderEngineRef.current = null;
    }
    setRecordingState('idle');
  }, [stopAllActiveMediaAccess]);

  const handleShareScreenPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: videoSettings.fps || 60, max: videoSettings.fps || 60 },
        },
        audio: audioSettings.includeSystemAudio ? true : false,
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'include',
        systemAudio: audioSettings.includeSystemAudio ? 'include' : 'exclude',
      } as DisplayMediaStreamOptions);
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          updateActiveScreenStream(null);
        };
      }
      updateActiveScreenStream(stream);
    } catch (err: unknown) {
      const domErr = err as { name?: string; message?: string };
      if (
        domErr?.name === 'NotAllowedError' ||
        domErr?.name === 'AbortError' ||
        domErr?.message?.includes('Permission') ||
        domErr?.message?.includes('denied')
      ) {
        return;
      }
      showToast('Could not share screen', 'error');
    }
  }, [videoSettings.fps, audioSettings.includeSystemAudio, showToast, updateActiveScreenStream]);

  const handleStopSharingScreen = useCallback(() => {
    if (activeScreenStream) {
      activeScreenStream.getTracks().forEach((t) => {
        try {
          t.enabled = false;
          t.stop();
        } catch (_) {}
      });
      updateActiveScreenStream(null);
    }
  }, [activeScreenStream, updateActiveScreenStream]);

  const handleToggleCameraPreview = useCallback(async (enable?: boolean) => {
    const shouldEnable = enable !== undefined ? enable : !activeWebcamStream;
    if (!shouldEnable) {
      if (activeWebcamStream) {
        activeWebcamStream.getTracks().forEach((t) => {
          try {
            t.enabled = false;
            t.stop();
          } catch (_) {}
        });
        updateActiveWebcamStream(null);
      }
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
        },
      });
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          updateActiveWebcamStream(null);
        };
      }
      updateActiveWebcamStream(stream);
      return stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            updateActiveWebcamStream(null);
          };
        }
        updateActiveWebcamStream(stream);
        return stream;
      } catch {
        showToast('Could not access camera', 'error');
      }
    }
  }, [activeWebcamStream, showToast, updateActiveWebcamStream]);

  const handleEnableMicPreview = useCallback(
    async (enable?: boolean, isSilentAutoCheck = false) => {
      const shouldEnable =
        enable !== undefined ? enable : !activeMicStream || !audioSettings.includeMic;
      if (!shouldEnable) {
        if (activeMicStream) {
          activeMicStream.getTracks().forEach((t) => {
            try {
              t.enabled = false;
              t.stop();
            } catch (_) {}
          });
          updateActiveMicStream(null);
        }
        setAudioSettings((prev) => ({ ...prev, includeMic: false }));
        return;
      }
      if (recordingState === 'editing') {
        return;
      }
      try {
        const micConstraints: MediaTrackConstraints = {
          echoCancellation: audioSettings.echoCancellation,
          noiseSuppression: audioSettings.noiseSuppression,
          autoGainControl: audioSettings.autoGainControl,
        };
        if (audioSettings.micDeviceId) {
          micConstraints.deviceId = { exact: audioSettings.micDeviceId };
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: micConstraints });
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.onended = () => {
            updateActiveMicStream(null);
            setAudioSettings((prev) => ({ ...prev, includeMic: false }));
          };
        }
        updateActiveMicStream(stream);
        setAudioSettings((prev) => ({ ...prev, includeMic: true }));
        setIsMicBlocked(false);
        return stream;
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.onended = () => {
              updateActiveMicStream(null);
              setAudioSettings((prev) => ({ ...prev, includeMic: false }));
            };
          }
          updateActiveMicStream(stream);
          setAudioSettings((prev) => ({ ...prev, includeMic: true }));
          setIsMicBlocked(false);
          return stream;
        } catch {
          // Microphone is disabled or denied by the browser
          setIsMicBlocked(true);
        }
      }
    },
    [activeMicStream, audioSettings, recordingState, updateActiveMicStream]
  );

  const handleSelectRecordingSetup = useCallback(
    (selectedMode: RecordingMode, suggestedLayout?: CompositionLayout) => {
      setMode(selectedMode);
      if (suggestedLayout) {
        setCompositionLayout(suggestedLayout);
      } else {
        setCompositionLayout((currentLayout) => {
          if (selectedMode === 'screen') return 'screen';
          if (selectedMode === 'cam_only') return 'cam-only';
          if (selectedMode === 'audio_only') return 'screen';
          if (['overlay', 'corner-cam', 'framed', 'split'].includes(currentLayout)) {
            return currentLayout;
          }
          return 'overlay';
        });
      }

      // Configure default audio settings for selected mode
      if (selectedMode === 'audio_only') {
        setAudioSettings((prev) => ({ ...prev, includeMic: true, includeSystemAudio: false }));
      } else if (selectedMode === 'cam_only') {
        setAudioSettings((prev) => ({ ...prev, includeMic: true }));
      }

      setHasSelectedInitialMode(true);
    },
    []
  );

  const handleSwitchMode = useCallback(
    async (targetMode: RecordingMode, suggestedLayout?: CompositionLayout) => {
      if (recordingState === 'recording' || recordingState === 'paused') return;
      handleSelectRecordingSetup(targetMode, suggestedLayout);

      if (targetMode === 'screen') {
        // Revoke camera hardware access
        if (activeWebcamStream) {
          activeWebcamStream.getTracks().forEach((t) => t.stop());
          setActiveWebcamStream(null);
        }

        // Trigger Screen access automatically if not active
        const isScreenLive =
          activeScreenStream &&
          activeScreenStream.getVideoTracks().some((t) => t.readyState === 'live');
        if (!isScreenLive) {
          await handleShareScreenPreview();
        }

        // Trigger Microphone access automatically if not active
        const isMicLive =
          activeMicStream &&
          activeMicStream.getAudioTracks().some((t) => t.readyState === 'live');
        if (!isMicLive) {
          await handleEnableMicPreview(true);
        }
      } else if (targetMode === 'screen_cam') {
        // Trigger Screen access automatically if not active
        const isScreenLive =
          activeScreenStream &&
          activeScreenStream.getVideoTracks().some((t) => t.readyState === 'live');
        if (!isScreenLive) {
          await handleShareScreenPreview();
        }

        // Trigger Camera access automatically if not active
        const isCamLive =
          activeWebcamStream &&
          activeWebcamStream.getVideoTracks().some((t) => t.readyState === 'live');
        if (!isCamLive) {
          await handleToggleCameraPreview(true);
        }

        // Trigger Microphone access automatically if not active
        const isMicLive =
          activeMicStream &&
          activeMicStream.getAudioTracks().some((t) => t.readyState === 'live');
        if (!isMicLive) {
          await handleEnableMicPreview(true);
        }
      } else if (targetMode === 'cam_only') {
        // Revoke Screen access
        if (activeScreenStream) {
          activeScreenStream.getTracks().forEach((t) => t.stop());
          setActiveScreenStream(null);
        }

        // Trigger Camera access automatically if not active
        const isCamLive =
          activeWebcamStream &&
          activeWebcamStream.getVideoTracks().some((t) => t.readyState === 'live');
        if (!isCamLive) {
          await handleToggleCameraPreview(true);
        }

        // Trigger Microphone access automatically if not active
        const isMicLive =
          activeMicStream &&
          activeMicStream.getAudioTracks().some((t) => t.readyState === 'live');
        if (!isMicLive) {
          await handleEnableMicPreview(true);
        }
      } else if (targetMode === 'audio_only') {
        // Revoke Camera and Screen access
        if (activeWebcamStream) {
          activeWebcamStream.getTracks().forEach((t) => t.stop());
          setActiveWebcamStream(null);
        }
        if (activeScreenStream) {
          activeScreenStream.getTracks().forEach((t) => t.stop());
          setActiveScreenStream(null);
        }

        // Trigger Microphone access automatically if not active
        const isMicLive =
          activeMicStream &&
          activeMicStream.getAudioTracks().some((t) => t.readyState === 'live');
        if (!isMicLive) {
          await handleEnableMicPreview(true);
        }
      }
    },
    [
      recordingState,
      handleSelectRecordingSetup,
      activeWebcamStream,
      activeScreenStream,
      activeMicStream,
      handleShareScreenPreview,
      handleToggleCameraPreview,
      handleEnableMicPreview,
    ]
  );

  const handleStartRecordingSequence = useCallback(async () => {
    if (isStartingRecordingRef.current) {
      console.warn('handleStartRecordingSequence ignored: already starting');
      return;
    }
    if (recordingState === 'recording' || recordingState === 'paused' || recordingState === 'countdown') {
      console.warn('Cannot start recording; current state is:', recordingState);
      return;
    }

    isStartingRecordingRef.current = true;
    try {
      // 1. Always cleanup previous engine and instantiate a fresh one
      if (recorderEngineRef.current) {
        recorderEngineRef.current.cleanupStreams();
        recorderEngineRef.current = null;
      }

      setDurationSeconds(0);
      setBytesRecorded(0);
      setBitrateMbps(0);
      setMicMuted(false);
      setLastRecordingData(null);

      const engine = new RecorderEngine({
        onTimeUpdate: (dur) => setDurationSeconds(Math.round(dur)),
        onDataChunk: (bytes, bitrate) => {
          setBytesRecorded(bytes);
          setBitrateMbps(bitrate);
        },
        onStateChange: (state) => {
          if (state === 'recording') setRecordingState('recording');
          else if (state === 'paused') setRecordingState('paused');
          else if (state === 'stopped') {
            // Handled in stopRecording promise
          }
        },
        onError: (err) => {
          console.warn('Recorder Engine Error:', err);
          const msg = err.message || 'Screen share was not provided or was cancelled.';
          showToast(msg, 'error');
          setActiveWebcamStream(null);
          isStartingRecordingRef.current = false;
          // Guard: NEVER reset to idle if user is in review or editing
          setRecordingState((prev) => (prev === 'review' || prev === 'editing' ? prev : 'idle'));
        },
        onBookmarkAdded: () => {
          // bookmark added
        },
      });
      recorderEngineRef.current = engine;

      // 2. Prepare streams using pre-acquired preview streams if available
      const result = await engine.prepareStreams(
        mode,
        audioSettings,
        videoSettings,
        pipConfig,
        {
          screenStream: activeScreenStream,
          webcamStream: activeWebcamStream,
          micStream: activeMicStream,
        },
        compositionLayout,
        background
      );
      if (result && result.webcamStream) {
        updateActiveWebcamStream(result.webcamStream);
      }
      if (result && result.screenStream) {
        updateActiveScreenStream(result.screenStream);
      }
      if (result && result.micStream) {
        updateActiveMicStream(result.micStream);
      }

      // 3. If countdown configured, enter countdown; else start immediately
      if (videoSettings.countdownSeconds > 0) {
        setRecordingState('countdown');
      } else {
        engine.startMediaRecorder();
        setRecordingState('recording');
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      const msg = errObj?.message || 'Screen share was not provided or was cancelled.';
      console.warn('Failed to start recording streams:', msg);
      showToast(msg, 'error');
      stopAllActiveMediaAccess();
      setRecordingState('idle');
    } finally {
      isStartingRecordingRef.current = false;
    }
  }, [
    recordingState,
    mode,
    audioSettings,
    videoSettings,
    pipConfig,
    activeScreenStream,
    activeWebcamStream,
    activeMicStream,
    showToast,
    compositionLayout,
    background,
    updateActiveWebcamStream,
    updateActiveScreenStream,
    updateActiveMicStream,
    stopAllActiveMediaAccess,
  ]);

  const handleSelectLayout = useCallback((newLayout: CompositionLayout) => {
    setCompositionLayout(newLayout);
    if (newLayout === 'corner-cam') {
      setPipConfig((prev) => ({
        ...prev,
        enabled: true,
        position: 'bottom-right',
        shape: 'rounded',
        size: 'medium',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
      }));
    }
    if (recorderEngineRef.current) {
      recorderEngineRef.current.updateLayoutAndBackground(newLayout, background);
    }
  }, [background]);

  const handleUpdateBackground = useCallback((updates: Partial<RecorderBackgroundConfig>) => {
    setBackground((prev) => {
      const next = { ...prev, ...updates };
      if (recorderEngineRef.current) {
        recorderEngineRef.current.updateLayoutAndBackground(compositionLayout, next);
      }
      return next;
    });
  }, [compositionLayout]);

  const handleTogglePause = () => {
    const engine = recorderEngineRef.current;
    if (!engine) return;
    if (recordingState === 'recording') {
      engine.pauseRecording();
      setRecordingState('paused');
    } else if (recordingState === 'paused') {
      engine.resumeRecording();
      setRecordingState('recording');
    }
  };

  const handleToggleMicMute = () => {
    const engine = recorderEngineRef.current;
    if (!engine) return;
    const newMuted = !micMuted;
    setMicMuted(newMuted);
    engine.setMicVolume(newMuted ? 0 : audioSettings.micVolume);
  };

  const handleAddBookmark = () => {
    const engine = recorderEngineRef.current;
    if (engine) {
      engine.addBookmark();
    }
  };

  const handleTakeSnapshotDuringRecording = async () => {
    showToast('Frame snapshot captured!', 'success');
  };

  const handleStopRecording = async () => {
    if (isStoppingRecording) return;
    setIsStoppingRecording(true);

    if (countdownStartTimerRef.current) {
      window.clearTimeout(countdownStartTimerRef.current);
      countdownStartTimerRef.current = null;
    }
    const engine = recorderEngineRef.current;
    if (!engine) {
      stopAllActiveMediaAccess();
      setIsStoppingRecording(false);
      return;
    }

    try {
      // Direct stop without flush delay, ensuring immediate response and instant teardown
      const result = await engine.stopRecording(0);

      // Disarm engine and set ref to null so no trailing errors fire
      if (recorderEngineRef.current) {
        recorderEngineRef.current.cleanupStreams();
        recorderEngineRef.current = null;
      }

      // Immediately revoke all camera, screen, and mic media tracks and device hardware locks
      stopAllActiveMediaAccess();
      setLastRecordingData(result);
      setRecordingState('review');
      saveActiveEditingSession(result);
      try {
        sessionStorage.setItem('osr_active_state', 'review');
      } catch (_) {}
    } catch (err) {
      console.error('Error stopping recording:', err);
      if (recorderEngineRef.current) {
        recorderEngineRef.current.cleanupStreams();
        recorderEngineRef.current = null;
      }
      stopAllActiveMediaAccess();
      setRecordingState('idle');
    } finally {
      setIsStoppingRecording(false);
    }
  };

  const handleDeleteRecording = () => {
    stopAllActiveMediaAccess();
    setLastRecordingData(null);
    setDurationSeconds(0);
    setBytesRecorded(0);
    setBitrateMbps(0);
    setRecordingState('idle');
    showToast('Recording discarded', 'info');
  };

  const handleRetake = async () => {
    if (recorderEngineRef.current) {
      try {
        await recorderEngineRef.current.stopRecording(0);
      } catch {}
    }
    stopAllActiveMediaAccess();
    setLastRecordingData(null);
    setRecordingState('idle');
    setDurationSeconds(0);
    setBytesRecorded(0);
    setBitrateMbps(0);
    setBitrateMbps(0);

    // Request permissions again for screen & camera preview without auto-starting recording
    try {
      if (mode === 'screen' || mode === 'screen_cam') {
        await handleShareScreenPreview();
      }
      if (mode === 'screen_cam' || mode === 'cam_only') {
        await handleToggleCameraPreview(true);
      }
    } catch (e) {
      console.warn('Retake preview stream request:', e);
    }
  };

  const handleSceneCompleteSaveToLibrary = async () => {
    if (!lastRecordingData) return;
    try {
      let thumbnail = '';
      try {
        const thumb = await generateThumbnailFromBlob(lastRecordingData.blob);
        if (thumb) thumbnail = thumb;
      } catch {}

      const rec: SavedRecording = {
        id: 'rec_' + Date.now(),
        title: `Recording ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        blob: lastRecordingData.blob,
        duration: Math.round(lastRecordingData.duration),
        mimeType: lastRecordingData.mimeType,
        size: lastRecordingData.blob.size,
        thumbnailUrl: thumbnail,
        notes: '',
        tags: [],
        createdAt: Date.now(),
        mode,
        resolution: videoSettings.resolution,
        fps: videoSettings.fps,
        bookmarks: lastRecordingData.bookmarks || [],
        metadata: lastRecordingData.metadata,
        project: lastRecordingData.project,
      };

      await saveRecordingToDB(rec);
      refreshLibraryCount();
      setRecordingState('idle');
      setActiveView('library');
      showToast('Saved to your recording library!', 'success');
    } catch (err) {
      console.error('Failed to save to library:', err);
      showToast('Failed to save recording to library', 'error');
    }
  };

  const handleChangePipPosition = (position: PipPosition) => {
    setPipConfig((prev) => {
      const next = { ...prev, position, customX: undefined, customY: undefined };
      recorderEngineRef.current?.updatePipConfig(next);
      return next;
    });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts inside text inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (recordingState === 'idle') {
          handleStartRecordingSequence();
        } else if ((recordingState === 'recording' || recordingState === 'paused') && !isStoppingRecording) {
          handleStopRecording();
        }
      } else if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (recordingState === 'recording' || recordingState === 'paused') {
          handleTogglePause();
        }
      } else if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (recordingState === 'recording' || recordingState === 'paused') {
          handleToggleMicMute();
        }
      } else if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (recordingState === 'recording' || recordingState === 'paused') {
          handleAddBookmark();
        }
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setActiveView((prev) => (prev === 'docs' ? 'studio' : 'docs'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingState, audioSettings.micVolume, micMuted]);

  const handleOpenRecordingInStudio = (rec: SavedRecording) => {
    const data = {
      blob: rec.blob,
      duration: rec.duration,
      mimeType: rec.mimeType,
      bookmarks: rec.bookmarks || [],
      metadata: rec.metadata,
      project: rec.project,
    };
    setLastRecordingData(data);
    setActiveView('studio');
    setRecordingState('review');
    saveActiveEditingSession(data);
    try {
      sessionStorage.setItem('osr_active_state', 'review');
    } catch (_) {}
  };

  const handleGoHome = useCallback(() => {
    if (recorderEngineRef.current) {
      recorderEngineRef.current.cleanupStreams();
      recorderEngineRef.current = null;
    }
    clearActiveEditingSession();
    try {
      sessionStorage.removeItem('osr_active_state');
    } catch (_) {}
    setLastRecordingData(null);
    setActiveWebcamStream(null);
    setHasSelectedInitialMode(false);
    setActiveView('studio');
    setRecordingState('idle');
    setDurationSeconds(0);
    setBytesRecorded(0);
    setBitrateMbps(0);
    refreshLibraryCount();
  }, [refreshLibraryCount]);

  return (
    <div id="screen-recorder-app" className="min-h-screen bg-[#F8FAFC] dark:bg-[#000000] text-gray-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-[#D90000] selection:text-white dark:selection:bg-[#D90000] dark:selection:text-white transition-colors duration-200">
      {/* Top Navigation Bar - Unified Master Header */}
      <Navbar
        activeView={activeView}
        recordingsCount={recordingsCount}
        onSelectView={(v) => {
          setActiveView(v);
        }}
        isRecording={recordingState === 'recording' || recordingState === 'paused'}
        recordingState={recordingState}
        durationSeconds={durationSeconds}
        mode={mode}
        onSelectMode={handleSwitchMode}
        onStartRecording={handleStartRecordingSequence}
        onStopRecording={handleStopRecording}
        isStoppingRecording={isStoppingRecording}
        onTogglePause={handleTogglePause}
        onGoHome={handleGoHome}
        onBackToModeSelect={handleGoHome}
        hasSelectedInitialMode={hasSelectedInitialMode}
        onOpenEditorExport={() => {
          window.dispatchEvent(new CustomEvent('open-editor-export-modal'));
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'library' ? (
          /* VIEW 1: Recordings Library Gallery */
          <RecordingsLibrary
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
            onSelectRecordingForEdit={handleOpenRecordingInStudio}
            onRecordingDeleted={refreshLibraryCount}
          />
        ) : activeView === 'services' ? (
          /* VIEW 2: Open Source Services Status & Diagnostics */
          <ServicesStatusPage />
        ) : activeView === 'logbook' ? (
          /* VIEW 3: Live Session Logbook & Inspect Observer */
          <LogbookPage
            onBackToStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
          />
        ) : activeView === 'docs' ? (
          /* VIEW 4: Technical Documentation & Architecture Page */
          <TechDocsPage
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
          />
        ) : activeView === 'privacy' ? (
          /* VIEW 5: Privacy Policy Page */
          <PrivacyPolicyPage
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activeView === 'about' ? (
          /* VIEW 6: About Us Page */
          <AboutUsPage
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activeView === 'terms' ? (
          /* VIEW 7: Terms & Conditions Page */
          <TermsConditionsPage
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activeView === 'contact' ? (
          /* VIEW 8: Contact Us Page */
          <ContactUsPage
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activeView === '404' ? (
          /* VIEW 9: 404 Not Found Page */
          <NotFoundPage
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activeView === '500' ? (
          /* VIEW 10: 500 Server / Application Error Page */
          <ServerErrorPage
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : recordingState === 'review' && lastRecordingData ? (
          /* VIEW 5: In-Screen Recording Review with Download, Edit, Retake, Delete options */
          <RecordingReviewScreen
            key={`review-screen-${lastRecordingData.blob.size}-${lastRecordingData.duration}`}
            videoBlob={lastRecordingData.blob}
            duration={lastRecordingData.duration}
            mimeType={lastRecordingData.mimeType}
            bookmarks={lastRecordingData.bookmarks}
            metadata={lastRecordingData.metadata}
            layout={compositionLayout}
            onSelectLayout={handleSelectLayout}
            background={background}
            onUpdateBackground={handleUpdateBackground}
            onDownload={() => showToast('Downloading video file...', 'success')}
            onEdit={() => {
              setRecordingState('editing');
              try {
                sessionStorage.setItem('osr_active_state', 'editing');
              } catch (_) {}
            }}
            onRetake={handleRetake}
            onSaveToLibrary={handleSceneCompleteSaveToLibrary}
          />
        ) : recordingState === 'editing' && lastRecordingData ? (
          /* VIEW 6: Screen Studio Non-Destructive Video Editor */
          <VideoEditor
            key={`video-editor-${lastRecordingData.blob.size}-${lastRecordingData.duration}`}
            videoBlob={lastRecordingData.blob}
            screenBlob={lastRecordingData.screenBlob}
            camBlob={lastRecordingData.camBlob}
            duration={lastRecordingData.duration}
            mimeType={lastRecordingData.mimeType}
            bookmarks={lastRecordingData.bookmarks}
            metadata={lastRecordingData.metadata}
            initialProject={lastRecordingData.project}
            layout={compositionLayout}
            background={background}
            onRecordAnother={() => {
              if (recorderEngineRef.current) {
                recorderEngineRef.current.cleanupStreams();
                recorderEngineRef.current = null;
              }
              clearActiveEditingSession();
              try {
                sessionStorage.removeItem('osr_active_state');
              } catch (_) {}
              setLastRecordingData(null);
              setActiveWebcamStream(null);
              setDurationSeconds(0);
              setBytesRecorded(0);
              setBitrateMbps(0);
              setRecordingState('idle');
              setActiveView('studio');
              refreshLibraryCount();
            }}
            onSavedToLibrary={() => {
              if (recorderEngineRef.current) {
                recorderEngineRef.current.cleanupStreams();
                recorderEngineRef.current = null;
              }
              clearActiveEditingSession();
              try {
                sessionStorage.removeItem('osr_active_state');
              } catch (_) {}
              refreshLibraryCount();
              setActiveWebcamStream(null);
              setActiveView('library');
              setRecordingState('idle');
            }}
          />
        ) : !hasSelectedInitialMode && recordingState === 'idle' ? (
          /* STEP 1: Interactive Mode / Setup Selector Flow */
          <ModeSelectionScreen
            onSelectSetup={(selectedMode, suggestedLayout) => {
              handleSwitchMode(selectedMode, suggestedLayout);
            }}
            currentMode={mode}
            onSelectView={(selectedView) => {
              setActiveView(selectedView);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          /* STEP 2: Main Studio Recorder Dashboard with live toggles */
          <RecorderDashboard
            mode={mode}
            onSelectMode={(targetMode) => handleSwitchMode(targetMode)}
            pipConfig={pipConfig}
            onUpdatePipConfig={(updates) => {
              setPipConfig((prev) => {
                const next = { ...prev, ...updates };
                recorderEngineRef.current?.updatePipConfig(next);
                return next;
              });
            }}
            audioSettings={audioSettings}
            onUpdateAudioSettings={(updates) => setAudioSettings((prev) => ({ ...prev, ...updates }))}
            videoSettings={videoSettings}
            onUpdateVideoSettings={(updates) => setVideoSettings((prev) => ({ ...prev, ...updates }))}
            onStartRecording={handleStartRecordingSequence}
            onStopRecording={handleStopRecording}
            onTogglePause={handleTogglePause}
            onRetake={handleRetake}
            onAddBookmark={handleAddBookmark}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenDocs={() => setActiveView('docs')}
            onBackToModeSelect={() => setHasSelectedInitialMode(false)}
            recordingState={recordingState}
            durationSeconds={durationSeconds}
            webcamStream={activeWebcamStream}
            screenStream={activeScreenStream}
            micStream={activeMicStream}
            onShareScreen={handleShareScreenPreview}
            onStopSharingScreen={handleStopSharingScreen}
            onToggleCamera={handleToggleCameraPreview}
            isMicBlocked={isMicBlocked}
            onEnableMic={handleEnableMicPreview}
            onToggleMic={handleEnableMicPreview}
            layout={compositionLayout}
            onSelectLayout={handleSelectLayout}
            aspectRatio={aspectRatio}
            onSelectAspectRatio={setAspectRatio}
            background={background}
            onUpdateBackground={handleUpdateBackground}
            smartConfig={smartConfig}
            onUpdateSmartConfig={(updates) => setSmartConfig((prev) => ({ ...prev, ...updates }))}
            prompter={prompter}
            onUpdatePrompter={(updates) => setPrompter((prev) => ({ ...prev, ...updates }))}
          />
        )}
      </main>

      {/* Global Persistent Footer across all views */}
      <AppFooter
        activeView={activeView}
        isRecording={recordingState === 'recording' || recordingState === 'paused'}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Countdown Overlay Modal */}
      {recordingState === 'countdown' && (
        <CountdownModal
          seconds={videoSettings.countdownSeconds}
          onComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          videoSettings={videoSettings}
          audioSettings={audioSettings}
          onUpdateVideoSettings={(updates) => setVideoSettings((prev) => ({ ...prev, ...updates }))}
          onUpdateAudioSettings={(updates) => setAudioSettings((prev) => ({ ...prev, ...updates }))}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Floating In-App Toast Notification */}
      {toast && (
        <div
          id="app-toast-notification"
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md max-w-md w-full mx-4 animate-in slide-in-from-top-4 fade-in duration-200 transition-all select-none ${
            toast.type === 'error'
              ? 'bg-red-50/95 dark:bg-zinc-950/95 border-red-200 dark:border-red-900/80 text-red-950 dark:text-red-300'
              : toast.type === 'success'
              ? 'bg-emerald-50/95 dark:bg-zinc-950/95 border-emerald-200 dark:border-emerald-900/80 text-emerald-950 dark:text-emerald-300'
              : 'bg-slate-50/95 dark:bg-zinc-950/95 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'error'
                ? 'bg-red-500 text-white'
                : toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircleIcon className="w-4 h-4" />
            ) : toast.type === 'success' ? (
              <Tick01Icon className="w-4 h-4" />
            ) : (
              <InformationCircleIcon className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-snug">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => setToast(null)}
            className="p-1 text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Cancel01Icon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
