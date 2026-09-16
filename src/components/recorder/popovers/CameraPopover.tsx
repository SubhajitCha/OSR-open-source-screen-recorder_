import React, { useState, useEffect } from 'react';
import {
  Camera01Icon,
  Tick01Icon,
  Cancel01Icon,
  RotateRight01Icon,
} from 'hugeicons-react';
import { PipConfig } from '../../../types';

interface CameraPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  pipConfig: PipConfig;
  onUpdatePipConfig: (updates: Partial<PipConfig>) => void;
  isCameraActive: boolean;
  onToggleCamera: (active: boolean) => void;
  placement?: 'top' | 'left';
}

export const CameraPopover: React.FC<CameraPopoverProps> = ({
  isOpen,
  onClose,
  pipConfig,
  onUpdatePipConfig,
  isCameraActive,
  onToggleCamera,
  placement = 'left',
}) => {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);
        if (cams.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(cams[0].deviceId);
        }
      } catch (err) {
        console.warn('Could not enumerate video devices:', err);
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
            <Camera01Icon className="w-4 h-4" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-zinc-200">
            Webcam Settings
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
        {/* Live Camera Toggle Button */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCameraActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-300 dark:bg-zinc-600'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
              {isCameraActive ? 'Camera Live' : 'Camera Off'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onToggleCamera(!isCameraActive)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isCameraActive
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xs'
            }`}
          >
            {isCameraActive ? 'Turn Off' : 'Turn On'}
          </button>
        </div>

        {/* Input Device Selection (When clicking camera chevron) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
            Available Camera Devices
          </label>
          {videoDevices.length > 0 ? (
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {videoDevices.map((d, idx) => (
                <option
                  key={d.deviceId || idx}
                  value={d.deviceId}
                  className="bg-white dark:bg-[#181B20]"
                >
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-[11px] text-slate-500 dark:text-zinc-400">
              Default System Web Camera
            </div>
          )}
        </div>

        {/* Placement Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              Camera Placement
            </span>
            {pipConfig.position === 'custom' && (
              <span className="text-[10px] text-blue-500 font-semibold">
                Custom Drag
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'top-left', label: 'Top Left' },
              { id: 'top-right', label: 'Top Right' },
              { id: 'bottom-left', label: 'Btm Left' },
              { id: 'bottom-right', label: 'Btm Right' },
            ].map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() =>
                  onUpdatePipConfig({
                    position: pos.id as PipConfig['position'],
                    customX: undefined,
                    customY: undefined,
                    customWidth: undefined,
                    customHeight: undefined,
                  })
                }
                className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border text-center ${
                  pipConfig.position === pos.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bubble Shape Picker */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">
            Camera Shape
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'rectangle', label: 'Rectangle', icon: '▬' },
              { id: 'circle', label: 'Circle', icon: '●' },
              { id: 'rounded', label: 'Rounded', icon: '▢' },
              { id: 'square', label: 'Square', icon: '■' },
            ].map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => onUpdatePipConfig({ shape: shape.id as PipConfig['shape'] })}
                className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                  pipConfig.shape === shape.id
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-xs'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <span className="text-[10px]">{shape.icon}</span>
                <span>{shape.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mirror Mode & Sizing */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => onUpdatePipConfig({ mirror: !pipConfig.mirror })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              pipConfig.mirror
                ? 'bg-zinc-900/10 dark:bg-white/10 text-zinc-900 dark:text-white border-zinc-300 dark:border-white/20'
                : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RotateRight01Icon className="w-3.5 h-3.5" />
            <span>Mirror Feed</span>
          </button>

          <div className="flex items-center gap-1">
            {(['small', 'medium', 'large'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => onUpdatePipConfig({ size: sz })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  pipConfig.size === sz
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {sz[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
