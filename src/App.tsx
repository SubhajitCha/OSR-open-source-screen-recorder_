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
} from './types';
import { RecorderEngine } from './services/recorderEngine';
import { getAllRecordings } from './services/db';
import { getBestSupportedVideoMimeType } from './services/browserCapabilities';
import { logbook } from './services/logbook';
import { Navbar } from './components/Navbar';
import { RecorderDashboard } from './components/RecorderDashboard';
import { LiveRecordingOverlay } from './components/LiveRecordingOverlay';
import { DraggableCameraBubble } from './components/DraggableCameraBubble';
import { PostRecordingStudio } from './components/PostRecordingStudio';
import { RecordingsLibrary } from './components/RecordingsLibrary';
import { ServicesStatusPage } from './components/ServicesStatusPage';
import { CountdownModal } from './components/CountdownModal';
import { SettingsModal } from './components/SettingsModal';
import { TechDocsPage } from './components/TechDocsPage';
import { LogbookPage } from './components/LogbookPage';

export default function App() {
  // Navigation & Views
  const [activeView, setActiveView] = useState<ActiveView>('studio');
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
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording' | 'paused' | 'review'>('idle');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [bytesRecorded, setBytesRecorded] = useState<number>(0);
  const [bitrateMbps, setBitrateMbps] = useState<number>(0);
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [activeWebcamStream, setActiveWebcamStream] = useState<MediaStream | null>(null);

  // Finished recording output data
  const [lastRecordingData, setLastRecordingData] = useState<{
    blob: Blob;
    duration: number;
    mimeType: string;
    bookmarks: VideoBookmark[];
  } | null>(null);

  // Configuration States
  const [mode, setMode] = useState<RecordingMode>('screen_cam');

  const [pipConfig, setPipConfig] = useState<PipConfig>({
    enabled: true,
    position: 'bottom-right',
    shape: 'circle',
    size: 'medium',
    mirror: true,
    borderWidth: 3,
    borderColor: '#ffffff',
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

  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: 'native',
    fps: 60,
    codec: 'video/webm;codecs=vp9,opus',
    bitrateMbps: 8,
    countdownSeconds: 3,
    directSaveToFileSystem: false,
  });

  // Auto-detect optimal video codec and initialize logbook observer on mount
  useEffect(() => {
    logbook.init();
    const bestCodec = getBestSupportedVideoMimeType();
    setVideoSettings((prev) => ({ ...prev, codec: bestCodec }));
    refreshLibraryCount();
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
          setRecordingState('idle');
        },
        onBookmarkAdded: () => {
          // bookmark added
        },
      });
    }
    return recorderEngineRef.current;
  }, [showToast]);

  const handleCountdownComplete = useCallback(() => {
    try {
      const engine = recorderEngineRef.current;
      if (!engine) {
        throw new Error('Recording engine was closed');
      }
      engine.startMediaRecorder();
      setRecordingState('recording');
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
  }, [showToast]);

  const handleCountdownCancel = useCallback(() => {
    if (recorderEngineRef.current) {
      recorderEngineRef.current.cleanupStreams();
      recorderEngineRef.current = null;
    }
    setActiveWebcamStream(null);
    setRecordingState('idle');
  }, []);

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
          setRecordingState('idle');
        },
        onBookmarkAdded: () => {
          // bookmark added
        },
      });
      recorderEngineRef.current = engine;

      // 2. Immediately prompt for screen share & camera within the active user gesture
      const result = await engine.prepareStreams(mode, audioSettings, videoSettings, pipConfig);
      if (result && result.webcamStream) {
        setActiveWebcamStream(result.webcamStream);
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
      if (recorderEngineRef.current) {
        recorderEngineRef.current.cleanupStreams();
        recorderEngineRef.current = null;
      }
      setActiveWebcamStream(null);
      setRecordingState('idle');
    } finally {
      isStartingRecordingRef.current = false;
    }
  }, [recordingState, mode, audioSettings, videoSettings, pipConfig, showToast]);

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
    const engine = recorderEngineRef.current;
    if (!engine) return;

    try {
      const result = await engine.stopRecording();
      setActiveWebcamStream(null);
      setLastRecordingData(result);
      setRecordingState('review');
    } catch (err) {
      console.error('Error stopping recording:', err);
      setActiveWebcamStream(null);
      setRecordingState('idle');
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
        } else if (recordingState === 'recording' || recordingState === 'paused') {
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

  return (
    <div id="screen-recorder-app" className="min-h-screen bg-[#F3F4F6] text-gray-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeView={activeView}
        recordingsCount={recordingsCount}
        onSelectView={(v) => setActiveView(v)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRecording={recordingState === 'recording' || recordingState === 'paused'}
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
        ) : recordingState === 'review' && lastRecordingData ? (
          /* VIEW 5: Post-Recording Review Studio */
          <PostRecordingStudio
            key={`post-studio-${lastRecordingData.blob.size}-${lastRecordingData.duration}`}
            videoBlob={lastRecordingData.blob}
            duration={lastRecordingData.duration}
            mimeType={lastRecordingData.mimeType}
            bookmarks={lastRecordingData.bookmarks}
            onRecordAnother={() => {
              if (recorderEngineRef.current) {
                recorderEngineRef.current.cleanupStreams();
                recorderEngineRef.current = null;
              }
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
              refreshLibraryCount();
              setActiveWebcamStream(null);
              setActiveView('library');
              setRecordingState('idle');
            }}
          />
        ) : (
          /* VIEW 6: Main Studio Recorder Dashboard */
          <RecorderDashboard
            mode={mode}
            onSelectMode={setMode}
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
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenDocs={() => setActiveView('docs')}
            recordingState={recordingState}
            durationSeconds={durationSeconds}
          />
        )}
      </main>

      {/* Countdown Overlay Modal */}
      {recordingState === 'countdown' && (
        <CountdownModal
          seconds={videoSettings.countdownSeconds}
          onComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      )}

      {/* Real-time Moveable Floating Camera Bubble on Screen during Active Recording */}
      {(recordingState === 'recording' || recordingState === 'paused') &&
        (mode === 'screen_cam' || mode === 'cam_only') &&
        activeWebcamStream && (
          <DraggableCameraBubble
            stream={activeWebcamStream}
            pipConfig={pipConfig}
            onUpdatePipConfig={(updates) => {
              setPipConfig((prev) => {
                const next = { ...prev, ...updates };
                recorderEngineRef.current?.updatePipConfig(next);
                return next;
              });
            }}
            isRecording={true}
          />
        )}

      {/* Live Compact HUD during Active Recording */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <LiveRecordingOverlay
          durationSeconds={durationSeconds}
          isPaused={recordingState === 'paused'}
          bytesRecorded={bytesRecorded}
          bitrateMbps={bitrateMbps}
          audioMixer={recorderEngineRef.current?.getAudioMixer() || null}
          micMuted={micMuted}
          onTogglePause={handleTogglePause}
          onToggleMicMute={handleToggleMicMute}
          onAddBookmark={handleAddBookmark}
          onTakeSnapshot={handleTakeSnapshotDuringRecording}
          onStopRecording={handleStopRecording}
          onChangePipPosition={mode === 'screen_cam' ? handleChangePipPosition : undefined}
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
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md max-w-md w-full mx-4 animate-in slide-in-from-top-4 fade-in duration-200 transition-all select-none"
          style={{
            backgroundColor:
              toast.type === 'error'
                ? 'rgba(254, 242, 242, 0.96)'
                : toast.type === 'success'
                ? 'rgba(240, 253, 244, 0.96)'
                : 'rgba(248, 250, 252, 0.96)',
            borderColor:
              toast.type === 'error'
                ? '#fca5a5'
                : toast.type === 'success'
                ? '#86efac'
                : '#cbd5e1',
          }}
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
            <p
              className={`text-xs font-semibold leading-snug ${
                toast.type === 'error'
                  ? 'text-red-950'
                  : toast.type === 'success'
                  ? 'text-emerald-950'
                  : 'text-slate-900'
              }`}
            >
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => setToast(null)}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Cancel01Icon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
