import Peer, { DataConnection, MediaConnection } from 'peerjs';
import {
  MobileCameraFacing,
  MobileConnectionStatus,
  MobileDeviceInfo,
} from '../types';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export function generateRoomCode(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return result;
}

export function getHostPeerId(roomCode: string): string {
  return `fsr-studio-${roomCode.trim().toUpperCase()}`;
}

export function buildMobilePairUrl(roomCode: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin + '/');
  url.searchParams.set('pair', roomCode.trim().toUpperCase());
  return url.toString();
}

export type BridgeControlMessage =
  | {
      type: 'hello';
      deviceName: string;
      facing: MobileCameraFacing;
      hasVideo: boolean;
      hasAudio: boolean;
      videoResolution?: { width: number; height: number };
      micMuted: boolean;
      camMuted: boolean;
    }
  | {
      type: 'status';
      facing?: MobileCameraFacing;
      hasVideo?: boolean;
      hasAudio?: boolean;
      videoResolution?: { width: number; height: number };
      micMuted?: boolean;
      camMuted?: boolean;
    }
  | { type: 'switch-camera'; facing: MobileCameraFacing }
  | { type: 'toggle-mic'; muted: boolean }
  | { type: 'toggle-cam'; muted: boolean }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'bye' };

export interface MobileHostCallbacks {
  onStatusChange: (status: MobileConnectionStatus, roomCode: string, errorMessage?: string) => void;
  onStreamReady: (info: MobileDeviceInfo) => void;
  onDeviceInfoUpdate: (info: MobileDeviceInfo) => void;
  onDisconnected: (reason?: string) => void;
}

/**
 * Desktop Host Session
 * - Opens a PeerJS signaling socket with a short 6-character room code.
 * - Accepts incoming WebRTC media stream (camera + microphone) from the paired phone.
 * - Attaches a muted hidden <audio> sink so Chromium always decodes WebRTC audio for Web Audio API.
 * - Clones tracks when handing streams to the Studio/Recorder so stopping local previews
 *   never kills the underlying WebRTC receiver tracks.
 */
export class MobileHostSession {
  private peer: Peer | null = null;
  private mediaCall: MediaConnection | null = null;
  private dataConn: DataConnection | null = null;
  private rawRemoteStream: MediaStream | null = null;
  private hiddenAudioSink: HTMLAudioElement | null = null;
  private roomCode: string = generateRoomCode();
  private status: MobileConnectionStatus = 'disconnected';
  private deviceInfo: MobileDeviceInfo = {
    deviceName: 'Mobile Phone',
    facing: 'user',
    hasVideo: false,
    hasAudio: false,
    micMuted: false,
    camMuted: false,
  };
  private isDestroyed = false;
  private heartbeatInterval: number | null = null;
  private idRetryCount = 0;

  constructor(private callbacks: MobileHostCallbacks) {}

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getStatus(): MobileConnectionStatus {
    return this.status;
  }

  public getDeviceInfo(): MobileDeviceInfo {
    return { ...this.deviceInfo };
  }

  public hasLiveVideo(): boolean {
    return !!(
      this.rawRemoteStream &&
      this.rawRemoteStream.getVideoTracks().some((t) => t.readyState === 'live')
    );
  }

  public hasLiveAudio(): boolean {
    return !!(
      this.rawRemoteStream &&
      this.rawRemoteStream.getAudioTracks().some((t) => t.readyState === 'live')
    );
  }

  /**
   * Returns a cloned video-only MediaStream safe for Studio previews and RecorderEngine cleanup.
   */
  public getClonedVideoStream(): MediaStream | null {
    if (!this.rawRemoteStream) return null;
    const liveTracks = this.rawRemoteStream.getVideoTracks().filter((t) => t.readyState === 'live');
    if (liveTracks.length === 0) return null;
    try {
      const cloned = liveTracks.map((t) => t.clone());
      return new MediaStream(cloned);
    } catch {
      return new MediaStream(liveTracks);
    }
  }

  /**
   * Returns a cloned audio-only MediaStream safe for AudioMixer and AudioWaveformVisualizer.
   */
  public getClonedAudioStream(): MediaStream | null {
    if (!this.rawRemoteStream) return null;
    const liveTracks = this.rawRemoteStream.getAudioTracks().filter((t) => t.readyState === 'live');
    if (liveTracks.length === 0) return null;
    try {
      const cloned = liveTracks.map((t) => t.clone());
      return new MediaStream(cloned);
    } catch {
      return new MediaStream(liveTracks);
    }
  }

  public start(): string {
    this.isDestroyed = false;
    this.idRetryCount = 0;
    this.initPeer();
    return this.roomCode;
  }

  public regenerateCode(): string {
    this.cleanupConnections();
    this.roomCode = generateRoomCode();
    this.idRetryCount = 0;
    this.initPeer();
    return this.roomCode;
  }

  private setStatus(next: MobileConnectionStatus, errorMessage?: string): void {
    this.status = next;
    this.callbacks.onStatusChange(next, this.roomCode, errorMessage);
  }

  private initPeer(): void {
    if (this.isDestroyed) return;
    this.destroyPeerOnly();

    this.setStatus('initializing');
    const peerId = getHostPeerId(this.roomCode);

    const peer = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 4,
      },
    });
    this.peer = peer;

    peer.on('open', () => {
      if (this.isDestroyed) return;
      this.setStatus('waiting_for_phone');
    });

    peer.on('connection', (conn) => {
      if (this.isDestroyed) {
        conn.close();
        return;
      }
      if (this.dataConn && this.dataConn !== conn) {
        try {
          this.dataConn.close();
        } catch (_) {}
      }
      this.dataConn = conn;
      this.setStatus('connecting');

      conn.on('data', (raw) => {
        const msg = raw as BridgeControlMessage;
        if (!msg || typeof msg !== 'object') return;

        if (msg.type === 'hello') {
          this.deviceInfo = {
            deviceName: msg.deviceName || 'Mobile Phone',
            facing: msg.facing || 'user',
            hasVideo: !!msg.hasVideo,
            hasAudio: !!msg.hasAudio,
            videoResolution: msg.videoResolution,
            micMuted: !!msg.micMuted,
            camMuted: !!msg.camMuted,
          };
          this.callbacks.onDeviceInfoUpdate(this.getDeviceInfo());
        } else if (msg.type === 'status') {
          this.deviceInfo = {
            ...this.deviceInfo,
            ...(msg.facing !== undefined ? { facing: msg.facing } : {}),
            ...(msg.hasVideo !== undefined ? { hasVideo: msg.hasVideo } : {}),
            ...(msg.hasAudio !== undefined ? { hasAudio: msg.hasAudio } : {}),
            ...(msg.videoResolution !== undefined ? { videoResolution: msg.videoResolution } : {}),
            ...(msg.micMuted !== undefined ? { micMuted: msg.micMuted } : {}),
            ...(msg.camMuted !== undefined ? { camMuted: msg.camMuted } : {}),
          };
          this.callbacks.onDeviceInfoUpdate(this.getDeviceInfo());
        } else if (msg.type === 'ping') {
          try {
            conn.send({ type: 'pong' } satisfies BridgeControlMessage);
          } catch (_) {}
        } else if (msg.type === 'bye') {
          this.handleRemoteDisconnect('Phone disconnected');
        }
      });

      conn.on('close', () => {
        if (this.dataConn === conn && this.status === 'connected') {
          this.handleRemoteDisconnect('Phone connection closed');
        }
      });

      conn.on('error', () => {
        if (this.status === 'connected') {
          this.handleRemoteDisconnect('Connection lost');
        }
      });
    });

    peer.on('call', (call) => {
      if (this.isDestroyed) {
        call.close();
        return;
      }
      if (this.mediaCall && this.mediaCall !== call) {
        try {
          this.mediaCall.close();
        } catch (_) {}
      }
      this.mediaCall = call;
      this.setStatus('connecting');

      // Answer with empty stream (receive-only on desktop so phone has zero echo)
      call.answer();

      call.on('stream', (remoteStream) => {
        if (this.isDestroyed) return;
        this.rawRemoteStream = remoteStream;
        this.attachHiddenAudioSink(remoteStream);

        const videoTrack = remoteStream.getVideoTracks()[0];
        const audioTrack = remoteStream.getAudioTracks()[0];
        const vSettings = videoTrack?.getSettings();

        this.deviceInfo = {
          ...this.deviceInfo,
          hasVideo: !!videoTrack,
          hasAudio: !!audioTrack,
          videoResolution:
            vSettings?.width && vSettings?.height
              ? { width: vSettings.width, height: vSettings.height }
              : this.deviceInfo.videoResolution,
        };

        this.setStatus('connected');
        this.startHeartbeat();
        this.callbacks.onStreamReady(this.getDeviceInfo());

        if (videoTrack) {
          videoTrack.onended = () => {
            if (!this.isDestroyed && this.status === 'connected') {
              this.handleRemoteDisconnect('Mobile camera stream ended');
            }
          };
        }
      });

      call.on('close', () => {
        if (!this.isDestroyed && this.status === 'connected') {
          this.handleRemoteDisconnect('Mobile stream closed');
        }
      });

      call.on('error', (err) => {
        console.warn('MobileHostSession MediaConnection error:', err);
        if (!this.isDestroyed && this.status !== 'waiting_for_phone') {
          this.handleRemoteDisconnect('Media stream interrupted');
        }
      });

      // Monitor ICE state for abrupt phone tab closes / Wi-Fi drops
      const pc = call.peerConnection;
      if (pc) {
        pc.oniceconnectionstatechange = () => {
          const iceState = pc.iceConnectionState;
          if (iceState === 'disconnected' || iceState === 'failed' || iceState === 'closed') {
            if (!this.isDestroyed && this.status === 'connected') {
              this.handleRemoteDisconnect('Phone network disconnected');
            }
          }
        };
      }
    });

    peer.on('error', (err: Error & { type?: string }) => {
      if (this.isDestroyed) return;
      if (err?.type === 'unavailable-id' && this.idRetryCount < 5) {
        this.idRetryCount++;
        this.roomCode = generateRoomCode();
        this.initPeer();
        return;
      }
      console.warn('MobileHostSession Peer error:', err);
      this.setStatus('error', err?.message || 'Signaling server connection failed');
    });

    peer.on('disconnected', () => {
      if (!this.isDestroyed && this.peer && !this.peer.destroyed) {
        try {
          this.peer.reconnect();
        } catch (_) {}
      }
    });
  }

  /**
   * Chromium requires a WebRTC MediaStream with audio to be attached to an <audio>
   * element before AudioContext.createMediaStreamSource() receives decoded samples.
   * Setting muted = true prevents local speaker playback/echo while keeping the pipeline active.
   */
  private attachHiddenAudioSink(stream: MediaStream): void {
    this.removeHiddenAudioSink();
    if (stream.getAudioTracks().length === 0) return;
    try {
      const audio = document.createElement('audio');
      audio.muted = true;
      audio.volume = 0;
      audio.autoplay = true;
      audio.setAttribute('playsinline', '');
      audio.style.display = 'none';
      audio.srcObject = stream;
      if (document.body) {
        document.body.appendChild(audio);
      }
      audio.play().catch(() => {});
      this.hiddenAudioSink = audio;
    } catch (_) {}
  }

  private removeHiddenAudioSink(): void {
    if (this.hiddenAudioSink) {
      try {
        this.hiddenAudioSink.pause();
        this.hiddenAudioSink.srcObject = null;
        this.hiddenAudioSink.remove();
      } catch (_) {}
      this.hiddenAudioSink = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.dataConn && this.dataConn.open) {
        try {
          this.dataConn.send({ type: 'ping' } satisfies BridgeControlMessage);
        } catch (_) {}
      }
    }, 5000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleRemoteDisconnect(reason: string): void {
    this.stopHeartbeat();
    this.removeHiddenAudioSink();
    if (this.mediaCall) {
      try {
        this.mediaCall.close();
      } catch (_) {}
      this.mediaCall = null;
    }
    if (this.dataConn) {
      try {
        this.dataConn.close();
      } catch (_) {}
      this.dataConn = null;
    }
    this.rawRemoteStream = null;
    this.setStatus('waiting_for_phone');
    this.callbacks.onDisconnected(reason);
  }

  public sendCommand(msg: BridgeControlMessage): boolean {
    if (this.dataConn && this.dataConn.open) {
      try {
        this.dataConn.send(msg);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  public switchPhoneCamera(facing: MobileCameraFacing): boolean {
    return this.sendCommand({ type: 'switch-camera', facing });
  }

  public disconnectPhone(): void {
    this.sendCommand({ type: 'bye' });
    this.handleRemoteDisconnect('Disconnected by studio');
  }

  private cleanupConnections(): void {
    this.stopHeartbeat();
    this.removeHiddenAudioSink();
    if (this.mediaCall) {
      try {
        this.mediaCall.close();
      } catch (_) {}
      this.mediaCall = null;
    }
    if (this.dataConn) {
      try {
        this.dataConn.close();
      } catch (_) {}
      this.dataConn = null;
    }
    this.rawRemoteStream = null;
    this.destroyPeerOnly();
  }

  private destroyPeerOnly(): void {
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (_) {}
      this.peer = null;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.sendCommand({ type: 'bye' });
    this.cleanupConnections();
    this.status = 'disconnected';
  }
}

export function detectMobileDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Mobile Phone';
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android Phone';
  return 'Mobile Device';
}

/**
 * Helper to acquire local camera + mic on the phone companion with graceful fallbacks.
 */
export async function acquireMobileMedia(
  facing: MobileCameraFacing = 'user'
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });
    } catch {
      return await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    }
  }
}

export function createPhonePeer(): Peer {
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return new Peer(`fsr-phone-${randomSuffix}`, {
    debug: 1,
    config: {
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 4,
    },
  });
}
