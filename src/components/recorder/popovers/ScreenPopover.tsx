import React from 'react';
import {
  ComputerIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
  Tick01Icon,
  Cancel01Icon,
} from 'hugeicons-react';
import { AudioSettings, VideoSettings } from '../../../types';

interface ScreenPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (updates: Partial<AudioSettings>) => void;
  videoSettings: VideoSettings;
  isScreenActive?: boolean;
  onToggleScreen?: (active: boolean) => void;
  placement?: 'top' | 'left';
}

export const ScreenPopover: React.FC<ScreenPopoverProps> = ({
  isOpen,
  onClose,
  audioSettings,
  onUpdateAudioSettings,
  videoSettings,
  isScreenActive = false,
  onToggleScreen,
  placement = 'left',
}) => {
  if (!isOpen) return null;

  const positionClass =
    placement === 'left'
      ? 'absolute right-full mr-3.5 top-1/2 -translate-y-1/2'
      : 'absolute bottom-full mb-3 left-1/2 -translate-x-1/2';

  return (
    <div
      className={`${positionClass} w-80 bg-white dark:bg-[#151718] text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ComputerIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-zinc-200">
            Display Capture
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/10">
          {videoSettings.fps} FPS
        </span>
      </div>

      <div className="space-y-3">
        {/* Live Preview Toggle Button */}
        {onToggleScreen && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isScreenActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-300 dark:bg-zinc-600'
                }`}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                {isScreenActive ? 'Screen Sharing Live' : 'Screen Inactive'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggleScreen(!isScreenActive)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isScreenActive
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                  : 'bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 shadow-xs'
              }`}
            >
              {isScreenActive ? 'Stop' : 'Share Screen'}
            </button>
          </div>
        )}

        {/* System Audio Toggle */}
        <div
          onClick={() =>
            onUpdateAudioSettings({
              includeSystemAudio: !audioSettings.includeSystemAudio,
            })
          }
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/5 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-lg ${
                audioSettings.includeSystemAudio
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                  : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-zinc-500'
              }`}
            >
              {audioSettings.includeSystemAudio ? (
                <VolumeHighIcon className="w-4 h-4" />
              ) : (
                <VolumeMute01Icon className="w-4 h-4" />
              )}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block">
                Record System Sound
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                Capture tab audio, video sound, and game playback
              </span>
            </div>
          </div>
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center ${
              audioSettings.includeSystemAudio
                ? 'bg-orange-500 text-white'
                : 'border border-slate-300 dark:border-white/20'
            }`}
          >
            {audioSettings.includeSystemAudio && <Tick01Icon className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>
      </div>
    </div>
  );
};
