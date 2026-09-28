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
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../i18n/types';

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
      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100/80 dark:hover:bg-zinc-800 border rounded-xl text-slate-900 dark:text-white flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-zinc-900'
            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
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
        <div className="absolute top-full left-0 right-0 mt-1.5 p-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-100">
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
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 font-normal'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Tick01Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
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
  const { currentLang, setLanguage, languages, t } = useLanguage();

  const languageOptions: Option<LanguageCode>[] = languages.map((l) => ({
    value: l.code,
    label: `${l.flag ? l.flag + ' ' : ''}${l.nativeName} (${l.name})`,
  }));

  const sm = t.settingsModal;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm"
    >
      <div
        id="settings-modal-container"
        className="flex flex-col w-full max-w-2xl max-h-[85vh] bg-white dark:bg-[#12141a] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-zinc-200 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12141a]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shadow-xs">
              <Settings01Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{sm.title}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{sm.subtitle}</p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Cancel01Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Language Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {sm.languageTab}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <SettingsSelect
                id="select-language"
                label={sm.selectLanguage}
                value={currentLang}
                options={languageOptions}
                onChange={(val) => setLanguage(val as LanguageCode)}
              />
            </div>
          </div>

          {/* Section: Video Settings */}
          <div className="space-y-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
              <Video01Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {sm.videoTab}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Resolution Target */}
              <SettingsSelect
                id="select-resolution"
                label={sm.resolution}
                value={videoSettings.resolution}
                options={RESOLUTION_OPTIONS}
                onChange={(val) => onUpdateVideoSettings({ resolution: val })}
              />

              {/* Frame Rate */}
              <SettingsSelect
                id="select-fps"
                label={sm.frameRate}
                value={videoSettings.fps}
                options={FPS_OPTIONS}
                onChange={(val) => onUpdateVideoSettings({ fps: val })}
              />

              {/* Codec */}
              <SettingsSelect
                id="select-codec"
                label={sm.videoCodec}
                value={videoSettings.codec}
                options={CODEC_OPTIONS}
                onChange={(val) => onUpdateVideoSettings({ codec: val })}
              />

              {/* Countdown Timer */}
              <SettingsSelect
                id="select-countdown"
                label="Countdown Timer"
                value={videoSettings.countdownSeconds}
                options={COUNTDOWN_OPTIONS}
                onChange={(val) => onUpdateVideoSettings({ countdownSeconds: val })}
              />
            </div>

            {/* Target Bitrate Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Target Video Bitrate</label>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{videoSettings.bitrateMbps} Mbps</span>
              </div>
              <input
                id="input-bitrate-slider"
                type="range"
                min={2}
                max={20}
                step={1}
                value={videoSettings.bitrateMbps}
                onChange={(e) => onUpdateVideoSettings({ bitrateMbps: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                <span>2 Mbps (Low footprint)</span>
                <span>8 Mbps (Crisp 1080p)</span>
                <span>20 Mbps (Ultra-HD Studio)</span>
              </div>
            </div>
          </div>

          {/* Section: Audio DSP Settings */}
          <div className="space-y-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
              <Mic01Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {sm.audioTab}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={audioSettings.echoCancellation}
                  onChange={(e) => onUpdateAudioSettings({ echoCancellation: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">{sm.echoCancellation}</span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">Prevents feedback</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={audioSettings.noiseSuppression}
                  onChange={(e) => onUpdateAudioSettings({ noiseSuppression: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">{sm.noiseSuppression}</span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">Removes hum/static</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={audioSettings.autoGainControl}
                  onChange={(e) => onUpdateAudioSettings({ autoGainControl: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">{sm.autoGainControl}</span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400">Normalizes volume</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#12141a]">
          <button
            id="btn-save-settings-close"
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
          >
            {sm.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};
