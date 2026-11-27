import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Cancel01Icon,
  SmartPhone01Icon,
  Copy01Icon,
  Tick01Icon,
  RefreshIcon,
  Camera01Icon,
  Mic01Icon,
  Wifi01Icon,
  AlertCircleIcon,
} from 'hugeicons-react';
import { MobileCameraFacing, MobileConnectionStatus, MobileDeviceInfo } from '../../types';
import { buildMobilePairUrl } from '../../services/mobileBridge';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  status: MobileConnectionStatus;
  errorMessage?: string | null;
  deviceInfo: MobileDeviceInfo | null;
  onRegenerateCode: () => void;
  onRetryConnection: () => void;
  onFlipCamera: (facing: MobileCameraFacing) => void;
  onDisconnectPhone: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  status,
  errorMessage,
  deviceInfo,
  onRegenerateCode,
  onRetryConnection,
  onFlipCamera,
  onDisconnectPhone,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pairUrl = buildMobilePairUrl(roomCode);
  const isLocalHttp =
    typeof window !== 'undefined' &&
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pairUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const renderStatusBanner = () => {
    switch (status) {
      case 'initializing':
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-600 dark:text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Initializing peer-to-peer signaling...</span>
          </div>
        );
      case 'waiting_for_phone':
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-[11px] font-medium text-blue-700 dark:text-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
            <span>Waiting for phone — scan QR with camera</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] font-medium text-amber-700 dark:text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Phone detected — establishing WebRTC stream...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              Connected to {deviceInfo?.deviceName || 'Mobile Device'} · P2P Active
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-[11px] font-medium text-red-700 dark:text-red-300">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircleIcon className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span className="truncate">{errorMessage || 'Signaling connection failed'}</span>
            </div>
            <button
              type="button"
              onClick={onRetryConnection}
              className="px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="mobile-connect-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/55 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="mobile-connect-modal"
        className="w-full max-w-sm max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-white dark:bg-[#232936] border border-slate-200 dark:border-white/15 rounded-2xl shadow-2xl text-slate-900 dark:text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#8DB355]/15 text-[#6b8e36] dark:text-[#a2c86b] border border-[#8DB355]/30 flex items-center justify-center shrink-0">
              <SmartPhone01Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight truncate">Mobile Camera & Audio</h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                Wirelessly stream via peer-to-peer WebRTC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <Cancel01Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {renderStatusBanner()}

          {status === 'connected' && deviceInfo ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1B202B] border border-slate-200 dark:border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    Paired Device
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {deviceInfo.deviceName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    Active Feeds
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-medium">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-200">
                      <Camera01Icon className="w-3.5 h-3.5 text-[#8DB355]" />
                      {deviceInfo.hasVideo
                        ? deviceInfo.videoResolution
                          ? `${deviceInfo.videoResolution.width}×${deviceInfo.videoResolution.height}`
                          : 'Video Live'
                        : 'No Video'}
                    </span>
                    <span className="text-slate-300 dark:text-zinc-700">·</span>
                    <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-200">
                      <Mic01Icon className="w-3.5 h-3.5 text-[#8DB355]" />
                      {deviceInfo.hasAudio ? (deviceInfo.micMuted ? 'Muted' : 'Audio Live') : 'No Mic'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={onDisconnectPhone}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Use Mobile Feed
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 dark:bg-[#1B202B] border border-slate-200 dark:border-white/10 space-y-2.5">
                <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200/80">
                  <QRCodeSVG
                    value={pairUrl}
                    size={136}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#090B0E"
                  />
                </div>

                <div className="text-center space-y-0.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Pairing Code</span>
                    <span className="font-mono text-xs font-bold tracking-widest text-slate-900 dark:text-white tabular-nums">
                      {roomCode}
                    </span>
                    <button
                      type="button"
                      onClick={onRegenerateCode}
                      aria-label="Generate a new pairing code"
                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-zinc-400 transition-colors cursor-pointer"
                    >
                      <RefreshIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Scan with iPhone or Android camera — no app needed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#2B3242] hover:bg-slate-100 dark:hover:bg-[#343C4F] border border-slate-200 dark:border-white/15 text-[11px] font-semibold text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Tick01Icon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Pairing Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy01Icon className="w-3.5 h-3.5" />
                      <span>Copy Pairing Link</span>
                    </>
                  )}
                </button>
              </div>

              {isLocalHttp && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  Mobile browsers require HTTPS for camera access. Use your deployed HTTPS URL (such
                  as <span className="font-semibold">freescreenrecord.com</span>) when scanning from
                  a phone.
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                <Wifi01Icon className="w-3 h-3 shrink-0" />
                <span>Direct peer-to-peer stream · Zero server upload</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
