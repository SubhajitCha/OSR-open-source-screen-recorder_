import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import {
  Camera01Icon,
  CameraOff01Icon,
  Mic01Icon,
  MicOff01Icon,
  SmartPhone01Icon,
  Wifi01Icon,
  AlertCircleIcon,
  Cancel01Icon,
} from 'hugeicons-react';
import {
  acquireMobileMedia,
  BridgeControlMessage,
  createPhonePeer,
  detectMobileDeviceName,
  getHostPeerId,
} from '../../services/mobileBridge';

interface MobileCompanionViewProps {
  initialRoomCode?: string;
}

type CompanionStage =
  | 'enter_code'
  | 'ready_to_pair'
  | 'acquiring_media'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export const MobileCompanionView: React.FC<MobileCompanionViewProps> = ({
  initialRoomCode = '',
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [stage, setStage] = useState<CompanionStage>(
    initialRoomCode ? 'acquiring_media' : 'enter_code'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [camMuted, setCamMuted] = useState<boolean>(false);
  const [resolutionText, setResolutionText] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const micMutedRef = useRef<boolean>(false);
  const camMutedRef = useRef<boolean>(false);
  const stageRef = useRef<CompanionStage>(stage);
  stageRef.current = stage;
  const isMountedRef = useRef<boolean>(true);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && navigator.wakeLock) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch {
      // Wake Lock optional on unsupported mobile browsers
    }
  }, []);

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.enabled = false;
          track.stop();
        } catch (_) {}
      });
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const teardownConnection = useCallback(
    (notifyHost = true) => {
      if (notifyHost && dataConnRef.current && dataConnRef.current.open) {
        try {
          dataConnRef.current.send({ type: 'bye' } satisfies BridgeControlMessage);
        } catch (_) {}
      }
      if (callRef.current) {
        try {
          callRef.current.close();
        } catch (_) {}
        callRef.current = null;
      }
      if (dataConnRef.current) {
        try {
          dataConnRef.current.close();
        } catch (_) {}
        dataConnRef.current = null;
      }
      if (peerRef.current) {
        try {
          peerRef.current.destroy();
        } catch (_) {}
        peerRef.current = null;
      }
      releaseWakeLock();
      stopLocalMedia();
    },
    [releaseWakeLock, stopLocalMedia]
  );

  const sendStatusToHost = useCallback(() => {
    const conn = dataConnRef.current;
    if (!conn || !conn.open) return;
    const stream = localStreamRef.current;
    const vTrack = stream?.getVideoTracks()[0];
    const aTrack = stream?.getAudioTracks()[0];
    const settings = vTrack?.getSettings();

    try {
      conn.send({
        type: 'status',
        facing: 'user',
        hasVideo: !!vTrack,
        hasAudio: !!aTrack,
        videoResolution:
          settings?.width && settings?.height
            ? { width: settings.width, height: settings.height }
            : undefined,
        micMuted: micMutedRef.current,
        camMuted: camMutedRef.current,
      } satisfies BridgeControlMessage);
    } catch (_) {}
  }, []);

  const toggleMic = useCallback(
    (forceMuted?: boolean) => {
      const nextMuted = forceMuted !== undefined ? forceMuted : !micMutedRef.current;
      micMutedRef.current = nextMuted;
      setMicMuted(nextMuted);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = !nextMuted;
        });
      }
      sendStatusToHost();
    },
    [sendStatusToHost]
  );

  const toggleCam = useCallback(
    (forceMuted?: boolean) => {
      const nextMuted = forceMuted !== undefined ? forceMuted : !camMutedRef.current;
      camMutedRef.current = nextMuted;
      setCamMuted(nextMuted);
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = !nextMuted;
        });
      }
      sendStatusToHost();
    },
    [sendStatusToHost]
  );

  const startPairing = useCallback(
    async (targetCode: string) => {
      const cleanCode = targetCode.trim().toUpperCase();
      if (!cleanCode) return;

      teardownConnection(false);
      setErrorMessage('');
      setStage('acquiring_media');

      let stream: MediaStream;
      try {
        stream = await acquireMobileMedia('user');
      } catch (err: unknown) {
        const msg =
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Camera & microphone permission is required. Tap Allow when prompted.'
            : 'Could not access your phone camera or microphone.';
        setErrorMessage(msg);
        setStage('ready_to_pair');
        return;
      }

      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      const vTrack = stream.getVideoTracks()[0];
      const aTrack = stream.getAudioTracks()[0];
      const vSettings = vTrack?.getSettings();
      if (vSettings?.width && vSettings?.height) {
        setResolutionText(`${vSettings.width}×${vSettings.height}`);
      }

      setStage('connecting');
      requestWakeLock();

      const peer = createPhonePeer();
      peerRef.current = peer;
      const hostId = getHostPeerId(cleanCode);

      peer.on('open', () => {
        if (!isMountedRef.current) return;

        // 1. Open DataChannel for handshake & remote mute control
        const conn = peer.connect(hostId, { reliable: true });
        dataConnRef.current = conn;

        conn.on('open', () => {
          if (!isMountedRef.current) return;
          const helloMsg: BridgeControlMessage = {
            type: 'hello',
            deviceName: detectMobileDeviceName(),
            facing: 'user',
            hasVideo: !!vTrack,
            hasAudio: !!aTrack,
            videoResolution:
              vSettings?.width && vSettings?.height
                ? { width: vSettings.width, height: vSettings.height }
                : undefined,
            micMuted: micMutedRef.current,
            camMuted: camMutedRef.current,
          };
          conn.send(helloMsg);

          setTimeout(() => {
            if (isMountedRef.current && callRef.current) {
              setStage((prev) => (prev === 'connecting' ? 'connected' : prev));
            }
          }, 600);
        });

        conn.on('data', (raw) => {
          const msg = raw as BridgeControlMessage;
          if (!msg || typeof msg !== 'object') return;
          if (msg.type === 'toggle-mic') {
            toggleMic(msg.muted);
          } else if (msg.type === 'toggle-cam') {
            toggleCam(msg.muted);
          } else if (msg.type === 'bye') {
            teardownConnection(false);
            setStage('disconnected');
          }
        });

        conn.on('close', () => {
          if (isMountedRef.current && stageRef.current !== 'disconnected') {
            teardownConnection(false);
            setStage('disconnected');
          }
        });

        // 2. Call Desktop Studio with live camera + microphone MediaStream
        const call = peer.call(hostId, stream);
        callRef.current = call;

        // Wait for ICE connection establishment
        const pc = call.peerConnection;
        if (pc) {
          const checkConnected = () => {
            if (
              pc.iceConnectionState === 'connected' ||
              pc.iceConnectionState === 'completed' ||
              pc.connectionState === 'connected'
            ) {
              if (isMountedRef.current) {
                setStage('connected');
              }
            } else if (
              pc.iceConnectionState === 'failed' ||
              pc.iceConnectionState === 'closed' ||
              pc.connectionState === 'failed'
            ) {
              if (isMountedRef.current) {
                setErrorMessage('Could not reach Desktop studio. Ensure both devices are online.');
                setStage('error');
              }
            }
          };
          pc.addEventListener('iceconnectionstatechange', checkConnected);
          pc.addEventListener('connectionstatechange', checkConnected);
        }

        call.on('close', () => {
          if (isMountedRef.current) {
            teardownConnection(false);
            setStage('disconnected');
          }
        });

        call.on('error', (err) => {
          if (isMountedRef.current) {
            setErrorMessage(err?.message || 'Media call failed');
            setStage('error');
          }
        });
      });

      peer.on('error', (err: Error & { type?: string }) => {
        if (!isMountedRef.current) return;
        const msg =
          err?.type === 'peer-unavailable'
            ? `Studio code "${cleanCode}" was not found. Make sure the QR modal is open on your computer.`
            : err?.message || 'Connection to studio failed';
        setErrorMessage(msg);
        setStage('error');
      });
    },
    [requestWakeLock, teardownConnection, toggleCam, toggleMic]
  );

  // Auto-start when opened via QR code (?pair=XXXXXX)
  useEffect(() => {
    isMountedRef.current = true;
    if (initialRoomCode) {
      startPairing(initialRoomCode);
    }

    const handlePageHide = () => teardownConnection(true);
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        (stageRef.current === 'connected' || stageRef.current === 'connecting')
      ) {
        requestWakeLock();
      }
    };
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      teardownConnection(true);
    };
  }, []);

  // Re-attach local stream to <video> whenever videoRef mounts
  useEffect(() => {
    if (videoRef.current && localStreamRef.current && videoRef.current.srcObject !== localStreamRef.current) {
      videoRef.current.srcObject = localStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [stage]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#07090c] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background Live Viewfinder (Front Lens Camera) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
          camMuted ? 'opacity-10' : 'opacity-100'
        }`}
      />

      {/* Subtle top & bottom gradient scrims for crisp legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/55 to-transparent z-10" />

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black border border-white/15 flex items-center justify-center shadow-sm">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#8DB355] to-[#FFEA93] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D90000]" />
            </div>
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight block leading-none">
              FSR Studio Mobile
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {roomCode ? `Code ${roomCode}` : 'Wireless Camera'}
              {resolutionText ? ` · ${resolutionText}` : ''}
            </span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              stage === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : stage === 'connecting' || stage === 'acquiring_media'
                ? 'bg-amber-400 animate-pulse'
                : stage === 'error' || stage === 'disconnected'
                ? 'bg-rose-500'
                : 'bg-zinc-400'
            }`}
          />
          <span>
            {stage === 'connected'
              ? 'Live to Desktop'
              : stage === 'connecting'
              ? 'Connecting...'
              : stage === 'acquiring_media'
              ? 'Starting Cam...'
              : stage === 'disconnected'
              ? 'Disconnected'
              : stage === 'error'
              ? 'Error'
              : 'Standby'}
          </span>
        </div>
      </header>

      {/* Center Overlay States (Code Entry / Permission Prompt / Error / Dim Mode) */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-5">
        {stage === 'enter_code' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startPairing(roomCode);
            }}
            className="w-full max-w-sm p-6 rounded-3xl bg-zinc-900/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-4 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#8DB355]/15 border border-[#8DB355]/30 text-[#a2c86b] flex items-center justify-center mx-auto">
              <SmartPhone01Icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Connect to Desktop Studio</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Enter the 6-character pairing code shown on your computer screen.
              </p>
            </div>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="e.g. K7M3P9"
              className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-center font-mono text-xl font-bold tracking-[0.25em] uppercase text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#8DB355]"
            />
            <button
              type="submit"
              disabled={roomCode.trim().length < 4}
              className="w-full py-3.5 rounded-2xl bg-[#8DB355] hover:bg-[#7da248] disabled:opacity-40 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Start Camera & Connect
            </button>
          </form>
        )}

        {(stage === 'ready_to_pair' || stage === 'error' || stage === 'disconnected') && (
          <div className="w-full max-w-sm p-6 rounded-3xl bg-zinc-900/90 backdrop-blur-xl border border-white/15 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto">
              {stage === 'error' ? (
                <AlertCircleIcon className="w-6 h-6 text-rose-400" />
              ) : (
                <Wifi01Icon className="w-6 h-6 text-[#a2c86b]" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {stage === 'disconnected'
                  ? 'Session Ended'
                  : stage === 'error'
                  ? 'Connection Issue'
                  : 'Allow Camera & Mic'}
              </h1>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {errorMessage ||
                  (stage === 'disconnected'
                    ? 'The connection to your desktop studio was closed.'
                    : 'Tap below to stream your phone camera and microphone wirelessly to your computer.')}
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => startPairing(roomCode)}
                className="w-full py-3.5 rounded-2xl bg-[#8DB355] hover:bg-[#7da248] text-white font-bold text-sm transition-colors cursor-pointer"
              >
                {stage === 'disconnected' || stage === 'error'
                  ? 'Reconnect to Studio'
                  : 'Allow Camera & Connect'}
              </button>
              <button
                type="button"
                onClick={() => {
                  teardownConnection(false);
                  setStage('enter_code');
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Change Pairing Code
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Mobile Control Dock */}
      {(stage === 'connected' || stage === 'connecting') && (
        <footer className="relative z-20 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 flex flex-col items-center gap-2.5">
          <div className="flex items-center justify-center gap-3">
            {/* Toggle Camera Video */}
            <button
              type="button"
              onClick={() => toggleCam()}
              className={`w-12 h-12 rounded-2xl backdrop-blur-md border flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                camMuted
                  ? 'bg-rose-600/80 border-rose-400/50 text-white'
                  : 'bg-black/60 border-white/15 text-white'
              }`}
              aria-label={camMuted ? 'Resume Video' : 'Pause Video'}
            >
              {camMuted ? <CameraOff01Icon className="w-5 h-5" /> : <Camera01Icon className="w-5 h-5" />}
            </button>

            {/* Toggle Microphone */}
            <button
              type="button"
              onClick={() => toggleMic()}
              className={`w-12 h-12 rounded-2xl backdrop-blur-md border flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                micMuted
                  ? 'bg-rose-600/80 border-rose-400/50 text-white'
                  : 'bg-[#8DB355] border-[#a2c86b]/50 text-white'
              }`}
              aria-label={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {micMuted ? <MicOff01Icon className="w-5 h-5" /> : <Mic01Icon className="w-5 h-5" />}
            </button>

            {/* Disconnect */}
            <button
              type="button"
              onClick={() => {
                teardownConnection(true);
                setStage('disconnected');
              }}
              className="w-12 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 border border-rose-400/40 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
              aria-label="Disconnect from Desktop"
            >
              <Cancel01Icon className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};
