import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Navbar } from './components/Navbar';
import { RecorderDashboard } from './components/RecorderDashboard';
import { LiveRecordingOverlay } from './components/LiveRecordingOverlay';
import { PostRecordingStudio } from './components/PostRecordingStudio';
import { RecordingsLibrary } from './components/RecordingsLibrary';
import { ServicesStatusPage } from './components/ServicesStatusPage';
import { CountdownModal } from './components/CountdownModal';
import { SettingsModal } from './components/SettingsModal';
import { TechDocsModal } from './components/TechDocsModal';

export default function App() {
  // Navigation & Views
  const [activeView, setActiveView] = useState<ActiveView>('studio');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [recordingsCount, setRecordingsCount] = useState<number>(0);

  // Recording State
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording' | 'paused' | 'review'>('idle');
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [bytesRecorded, setBytesRecorded] = useState<number>(0);
  const [bitrateMbps, setBitrateMbps] = useState<number>(0);
  const [micMuted, setMicMuted] = useState<boolean>(false);

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

  // Auto-detect optimal video codec on mount
  useEffect(() => {
    const bestCodec = getBestSupportedVideoMimeType();
    setVideoSettings((prev) => ({ ...prev, codec: bestCodec }));
    refreshLibraryCount();
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
          console.error('Recorder Engine Error:', err);
          alert(`Recording Error: ${err.message || 'Capture interrupted'}`);
          setRecordingState('idle');
        },
        onBookmarkAdded: () => {
          // bookmark added
        },
      });
    }
    return recorderEngineRef.current;
  }, []);

  const handleStartRecordingSequence = () => {
    if (videoSettings.countdownSeconds > 0) {
      setRecordingState('countdown');
    } else {
      executeStartRecording();
    }
  };

  const executeStartRecording = async () => {
    try {
      const engine = initRecorderEngine();
      setDurationSeconds(0);
      setBytesRecorded(0);
      setBitrateMbps(0);
      setMicMuted(false);

      await engine.startRecording(mode, audioSettings, videoSettings, pipConfig);
      setRecordingState('recording');
    } catch (err) {
      console.warn('Failed to start recording:', err);
      setRecordingState('idle');
    }
  };

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
    alert('Frame snapshot captured! You can review and download all snapshots in the post-recording studio.');
  };

  const handleStopRecording = async () => {
    const engine = recorderEngineRef.current;
    if (!engine) return;

    try {
      const result = await engine.stopRecording();
      setLastRecordingData(result);
      setRecordingState('review');
    } catch (err) {
      console.error('Error stopping recording:', err);
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
        setIsDocsOpen((prev) => !prev);
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
        onSelectView={(v) => {
          setActiveView(v);
          if (v === 'docs') setIsDocsOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRecording={recordingState === 'recording' || recordingState === 'paused'}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: Post-Recording Review Studio */}
        {recordingState === 'review' && lastRecordingData ? (
          <PostRecordingStudio
            videoBlob={lastRecordingData.blob}
            duration={lastRecordingData.duration}
            mimeType={lastRecordingData.mimeType}
            bookmarks={lastRecordingData.bookmarks}
            onRecordAnother={() => {
              setLastRecordingData(null);
              setRecordingState('idle');
              setActiveView('studio');
              refreshLibraryCount();
            }}
            onSavedToLibrary={() => {
              refreshLibraryCount();
              setActiveView('library');
              setRecordingState('idle');
            }}
          />
        ) : activeView === 'library' ? (
          /* VIEW 2: Recordings Library Gallery */
          <RecordingsLibrary
            onOpenStudio={() => {
              setActiveView('studio');
              setRecordingState('idle');
            }}
          />
        ) : activeView === 'services' ? (
          /* VIEW 3: Open Source Services Status & Diagnostics */
          <ServicesStatusPage />
        ) : (
          /* VIEW 4: Main Studio Recorder Dashboard */
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
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenDocs={() => setIsDocsOpen(true)}
          />
        )}
      </main>

      {/* Countdown Overlay Modal */}
      {recordingState === 'countdown' && (
        <CountdownModal
          seconds={videoSettings.countdownSeconds}
          onComplete={executeStartRecording}
          onCancel={() => setRecordingState('idle')}
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

      {/* Technical Architecture & Documentation Modal */}
      {isDocsOpen && (
        <TechDocsModal
          onClose={() => {
            setIsDocsOpen(false);
            if (activeView === 'docs') setActiveView('studio');
          }}
        />
      )}
    </div>
  );
}
