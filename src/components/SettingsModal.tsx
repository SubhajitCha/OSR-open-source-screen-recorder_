import React from 'react';
import {
  Cancel01Icon,
  Settings01Icon,
  Mic01Icon,
  Video01Icon,
  KeyboardIcon,
} from 'hugeicons-react';
import { AudioSettings, FrameRatePreset, ResolutionPreset, VideoSettings } from '../types';

interface SettingsModalProps {
  videoSettings: VideoSettings;
  audioSettings: AudioSettings;
  onUpdateVideoSettings: (updates: Partial<VideoSettings>) => void;
  onUpdateAudioSettings: (updates: Partial<AudioSettings>) => void;
  onClose: () => void;
}

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
              <p className="text-xs text-slate-500">Configure codecs, frame rates, audio DSP, and keybindings</p>
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
              {/* Resolution */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Resolution Target
                </label>
                <select
                  id="select-resolution"
                  value={videoSettings.resolution}
                  onChange={(e) => onUpdateVideoSettings({ resolution: e.target.value as ResolutionPreset })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="native">Native Display Resolution (Default)</option>
                  <option value="4k">4K Ultra HD (3840 × 2160)</option>
                  <option value="1440p">2K QHD (2560 × 1440)</option>
                  <option value="1080p">1080p Full HD (1920 × 1080)</option>
                  <option value="720p">720p HD (1280 × 720)</option>
                </select>
              </div>

              {/* Framerate */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Frame Rate (FPS)
                </label>
                <select
                  id="select-fps"
                  value={videoSettings.fps}
                  onChange={(e) => onUpdateVideoSettings({ fps: Number(e.target.value) as FrameRatePreset })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value={60}>60 FPS (Ultra Smooth)</option>
                  <option value={30}>30 FPS (Standard Balance)</option>
                  <option value={24}>24 FPS (Cinematic / Low Size)</option>
                  <option value={15}>15 FPS (Slide Deck & Presentations)</option>
                </select>
              </div>

              {/* Codec */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Video Codec Engine
                </label>
                <select
                  id="select-codec"
                  value={videoSettings.codec}
                  onChange={(e) => onUpdateVideoSettings({ codec: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="video/webm;codecs=vp9,opus">VP9 + Opus (Recommended Quality)</option>
                  <option value="video/webm;codecs=vp8,opus">VP8 + Opus (Universal Web)</option>
                  <option value="video/webm;codecs=h264,opus">H.264 + Opus (Hardware Accel)</option>
                  <option value="video/webm">Standard WebM Container</option>
                  <option value="video/mp4;codecs=avc1,mp4a.40.2">MP4 AVC / H.264 (Direct MP4)</option>
                </select>
              </div>

              {/* Countdown Timer */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Pre-recording Countdown
                </label>
                <select
                  id="select-countdown"
                  value={videoSettings.countdownSeconds}
                  onChange={(e) => onUpdateVideoSettings({ countdownSeconds: Number(e.target.value) as 0 | 3 | 5 | 10 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>Immediate (No Countdown)</option>
                  <option value={3}>3 Seconds</option>
                  <option value={5}>5 Seconds</option>
                  <option value={10}>10 Seconds</option>
                </select>
              </div>
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

          {/* Section: Keyboard Shortcuts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <KeyboardIcon className="w-4 h-4 text-blue-600" />
              Keyboard Shortcuts Cheatsheet
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Start / Finish Recording</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-white border border-slate-200 rounded text-slate-800 shadow-xs">
                  Alt + R
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Pause / Resume</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-white border border-slate-200 rounded text-slate-800 shadow-xs">
                  Alt + P
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Mute / Unmute Mic</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-white border border-slate-200 rounded text-slate-800 shadow-xs">
                  Alt + M
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Drop Bookmark Marker</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-white border border-slate-200 rounded text-slate-800 shadow-xs">
                  Alt + B
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Take Instant Snapshot</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-white border border-slate-200 rounded text-slate-800 shadow-xs">
                  Alt + S
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700">Open Tech Documentation</span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-white border border-slate-200 rounded text-slate-800 shadow-xs">
                  Alt + D
                </kbd>
              </div>
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
