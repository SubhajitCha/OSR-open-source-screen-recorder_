import React, { useState, useEffect } from 'react';
import { Mic01Icon, VolumeHighIcon, Tick01Icon, Cancel01Icon } from 'hugeicons-react';
import { AudioSettings } from '../../../types';

interface MicPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (updates: Partial<AudioSettings>) => void;
  isMicActive?: boolean;
  onToggleMic?: (active: boolean) => void;
  placement?: 'top' | 'left';
}

export const MicPopover: React.FC<MicPopoverProps> = ({
  isOpen,
  onClose,
  audioSettings,
  onUpdateAudioSettings,
  isMicActive,
  onToggleMic,
  placement = 'left',
}) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(mics);
        if (mics.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(mics[0].deviceId);
        }
      } catch (err) {
        console.warn('Could not enumerate audio devices:', err);
      }
    };

    getDevices();
  }, [isOpen, selectedDeviceId]);

  if (!isOpen) return null;

  const positionClass =
    placement === 'left'
      ? 'absolute right-full mr-3.5 top-0'
      : 'absolute bottom-full mb-3 left-1/2 -translate-x-1/2';

  return (
    <div
      className={`${positionClass} w-80 max-h-[85vh] overflow-y-auto bg-white dark:bg-[#151718] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Mic01Icon className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-zinc-200">
            Microphone Setup
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Cancel01Icon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Toggle Mic On/Off */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                (isMicActive ?? audioSettings.includeMic)
                  ? 'bg-orange-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
              {(isMicActive ?? audioSettings.includeMic)
                ? 'Microphone Active'
                : 'Microphone Muted'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const currentActive = isMicActive ?? audioSettings.includeMic;
              if (onToggleMic) {
                onToggleMic(!currentActive);
              } else {
                onUpdateAudioSettings({ includeMic: !currentActive });
              }
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              (isMicActive ?? audioSettings.includeMic)
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xs'
            }`}
          >
            {(isMicActive ?? audioSettings.includeMic) ? 'Mute' : 'Unmute'}
          </button>
        </div>

        {/* Input Device Selection */}
        {audioDevices.length > 0 && (
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
              Select Microphone Input
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {audioDevices.map((d, idx) => (
                <option key={d.deviceId || idx} value={d.deviceId} className="bg-white dark:bg-[#181B20]">
                  {d.label || `Microphone ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Noise Suppression & Echo Cancellation */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div
            onClick={() =>
              onUpdateAudioSettings({
                noiseSuppression: !audioSettings.noiseSuppression,
              })
            }
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              Noise Filter
            </span>
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                audioSettings.noiseSuppression
                  ? 'bg-orange-500 text-white'
                  : 'border border-slate-300 dark:border-white/20'
              }`}
            >
              {audioSettings.noiseSuppression && (
                <Tick01Icon className="w-2.5 h-2.5 stroke-[3]" />
              )}
            </span>
          </div>

          <div
            onClick={() =>
              onUpdateAudioSettings({
                echoCancellation: !audioSettings.echoCancellation,
              })
            }
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 cursor-pointer"
          >
            <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              Echo Cancel
            </span>
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                audioSettings.echoCancellation
                  ? 'bg-orange-500 text-white'
                  : 'border border-slate-300 dark:border-white/20'
              }`}
            >
              {audioSettings.echoCancellation && (
                <Tick01Icon className="w-2.5 h-2.5 stroke-[3]" />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
