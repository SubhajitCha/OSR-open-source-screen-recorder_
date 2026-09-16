import React from 'react';
import {
  Cancel01Icon,
  Settings01Icon,
  Mic01Icon,
  Video01Icon,
  ArrowDown01Icon,
  Tick01Icon,
} from 'hugeicons-react';
import { AudioSettings, FrameRatePreset, ResolutionPreset, VideoSettings } from '../types';

interface SettingsModalProps {
  videoSettings: VideoSettings;
  audioSettings: AudioSettings;
  onUpdateVideoSettings: (updates: Partial<VideoSettings>) => void;
  onUpdateAudioSettings: (updates: Partial<AudioSettings>) => void;
  onClose: () => void;
}

interface Option<T> {
  value: T;
  label: string;
}

interface SettingsSelectProps<T> {
  id?: string;
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (val: T) => void;
}

function SettingsSelect<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: SettingsSelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative ${isOpen ? 'z-40' : 'z-10'}`}>
      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/80 border rounded-xl text-slate-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="truncate font-medium">{selectedOption?.label}</span>
        <ArrowDown01Icon
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-normal'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Tick01Icon className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const RESOLUTION_OPTIONS: Option<ResolutionPreset>[] = [
  { value: 'native', label: 'Native Display Resolution (Default)' },
  { value: '4k', label: '4K Ultra HD (3840 × 2160)' },
  { value: '1440p', label: '2K QHD (2560 × 1440)' },
  { value: '1080p', label: '1080p Full HD (1920 × 1080)' },
  { value: '720p', label: '720p HD (1280 × 720)' },
];

const FPS_OPTIONS: Option<FrameRatePreset>[] = [
  { value: 60, label: '60 FPS (Ultra Smooth)' },
  { value: 30, label: '30 FPS (Standard Balance)' },
  { value: 24, label: '24 FPS (Cinematic / Low Size)' },
  { value: 15, label: '15 FPS (Slide Deck & Presentations)' },
];

const CODEC_OPTIONS: Option<string>[] = [
  { value: 'video/webm;codecs=vp9,opus', label: 'VP9 + Opus (Recommended Quality)' },
  { value: 'video/webm;codecs=vp8,opus', label: 'VP8 + Opus (Universal Web)' },
  { value: 'video/webm;codecs=h264,opus', label: 'H.264 + Opus (Hardware Accel)' },
  { value: 'video/webm', label: 'Standard WebM Container' },
  { value: 'video/mp4;codecs=avc1,mp4a.40.2', label: 'MP4 AVC / H.264 (Direct MP4)' },
];

const COUNTDOWN_OPTIONS: Option<0 | 3 | 5 | 10>[] = [
  { value: 0, label: 'Immediate (No Countdown)' },
  { value: 3, label: '3 Seconds' },
  { value: 5, label: '5 Seconds' },
  { value: 10, label: '10 Seconds' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  videoSettings,
  audioSettings,
  onUpdateVideoSettings,
  onUpdateAudioSettings,
  onClose,
}) => {
  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm"
    >
      <div
        id="settings-modal-container"
        className="flex flex-col w-full max-w-2xl max-h-[85vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <Settings01Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Recording Preferences</h2>
              <p className="text-xs text-slate-500">Configure codecs, frame rates, audio DSP, and video bitrate</p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Cancel01Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Video Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Video01Icon className="w-4 h-4 text-blue-600" />
              Video Encoding & Performance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Resolution Target */}
              <SettingsSelect
                id="select-resolution"
                label="Resolution Target"
                value={videoSettings.resolution}
                options={RESOLUTION_OPTIONS}
                onChange={(val) => onUpdateVideoSettings({ resolution: val })}
              />

              {/* Frame Rate */}
              <SettingsSelect
                id="select-fps"
                label="Frame Rate (FPS)"
                value={videoSettings.fps}
                options={FPS_OPTIONS}
                onChange={(val) => onUpdateVideoSettings({ fps: val })}
              />

              {/* Codec */}
              <SettingsSelect
                id="select-codec"
                label="Video Codec Engine"
                value={videoSettings.codec}
                options={CODEC_OPTIONS}
                onChange={(val) => onUpdateVideoSettings({ codec: val })}
              />

              {/* Countdown Timer */}
              <SettingsSelect
                id="select-countdown"
                label="Pre-recording Countdown"
                value={videoSettings.countdownSeconds}
                options={COUNTDOWN_OPTIONS}
                onChange={(val) => onUpdateVideoSettings({ countdownSeconds: val })}
              />
            </div>

            {/* Target Bitrate Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Target Video Bitrate</label>
                <span className="text-xs font-mono font-bold text-blue-600">{videoSettings.bitrateMbps} Mbps</span>
              </div>
              <input
                id="input-bitrate-slider"
                type="range"
                min={2}
                max={20}
                step={1}
                value={videoSettings.bitrateMbps}
                onChange={(e) => onUpdateVideoSettings({ bitrateMbps: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>2 Mbps (Low footprint)</span>
                <span>8 Mbps (Crisp 1080p)</span>
                <span>20 Mbps (Ultra-HD Studio)</span>
              </div>
            </div>
          </div>

          {/* Section: Audio DSP Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Mic01Icon className="w-4 h-4 text-blue-600" />
              Microphone Digital Signal Processing (DSP)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={audioSettings.echoCancellation}
                  onChange={(e) => onUpdateAudioSettings({ echoCancellation: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Echo Cancellation</span>
                  <span className="text-[10px] text-slate-500">Prevents feedback</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={audioSettings.noiseSuppression}
                  onChange={(e) => onUpdateAudioSettings({ noiseSuppression: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Noise Suppression</span>
                  <span className="text-[10px] text-slate-500">Removes hum/static</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={audioSettings.autoGainControl}
                  onChange={(e) => onUpdateAudioSettings({ autoGainControl: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Auto Gain</span>
                  <span className="text-[10px] text-slate-500">Normalizes volume</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 bg-white">
          <button
            id="btn-save-settings-close"
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
