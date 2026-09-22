import React, { useState } from 'react';
import {
  Download01Icon,
  FloppyDiskIcon,
  Cancel01Icon,
  Film01Icon,
  Tick01Icon,
} from 'hugeicons-react';
import confetti from 'canvas-confetti';
import { Project } from '../../types';
import { ExportOptions, ExportProgress, renderProjectToVideo } from '../../services/exportRenderer';
import { saveRecordingToDB, generateThumbnailFromBlob, formatBytes } from '../../services/db';

interface ExportModalProps {
  project: Project;
  onClose: () => void;
  onSavedToLibrary: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  onClose,
  onSavedToLibrary,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    resolutionPreset: '1080p',
    fps: 60,
    bitrateMbps: 12,
    format: 'mp4',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress({
      progress: 0,
      renderedSeconds: 0,
      totalSeconds: project.source.duration,
      stage: 'preparing',
    });

    try {
      const rendered = await renderProjectToVideo(project, options, (p) => {
        setProgress(p);
      });

      setExportedBlob(rendered);
      setIsExporting(false);

      // Celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D90000', '#8DB355', '#FFEA93', '#000000'],
        });
      } catch {}
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedBlob) return;
    const url = URL.createObjectURL(exportedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || 'ScreenStudio_Export'}.${options.format === 'mp4' ? 'mp4' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToLibrary = async () => {
    if (!exportedBlob || isSaving) return;
    setIsSaving(true);

    try {
      const thumb = await generateThumbnailFromBlob(exportedBlob);
      await saveRecordingToDB({
        id: project.id,
        title: project.title,
        blob: exportedBlob,
        mimeType: exportedBlob.type || 'video/webm',
        duration: project.source.duration,
        size: exportedBlob.size,
        createdAt: project.createdAt || Date.now(),
        thumbnailUrl: thumb,
        mode: 'screen',
        resolution: options.resolutionPreset,
        fps: options.fps,
        bookmarks: project.bookmarks || [],
        tags: ['Screen Studio', 'Edited'],
        project,
      });

      setIsSaved(true);
      setTimeout(() => {
        onSavedToLibrary();
      }, 800);
    } catch (err) {
      console.error('Save to library error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="bg-[#18181C] border border-[#282832] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col text-[#EDEDED]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26262E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D90000]/15 text-[#D90000] flex items-center justify-center">
              <Film01Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Export & Download Video</h3>
              <p className="text-[11px] text-[#8E8E98]">Render with canvas framing & background styling</p>
            </div>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1 text-[#8E8E98] hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <Cancel01Icon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {!exportedBlob && !isExporting ? (
            /* Quality & Resolution Settings */
            <div className="space-y-4 text-xs">
              {/* Resolution */}
              <div>
                <label className="block font-bold text-[#A1A1AA] uppercase tracking-wider text-[10px] mb-2">
                  Resolution Preset
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '1080p', label: '1080p Full HD' },
                    { id: '4k', label: '4K Ultra HD' },
                    { id: '720p', label: '720p HD' },
                    { id: 'native', label: 'Native' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setOptions({ ...options, resolutionPreset: res.id as any })}
                      className={`py-2.5 px-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        options.resolutionPreset === res.id
                          ? 'bg-[#D90000] border-[#D90000] text-white font-bold shadow-[0_0_12px_rgba(217,0,0,0.35)]'
                          : 'bg-[#141418] border-[#282830] text-[#A1A1AA] hover:bg-[#202026]'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Framerate, Bitrate & Format */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#A1A1AA] uppercase tracking-wider text-[10px] mb-1.5">
                    Format
                  </label>
                  <select
                    value={options.format}
                    onChange={(e) => setOptions({ ...options, format: e.target.value as 'mp4' | 'webm' })}
                    className="w-full bg-[#141418] border border-[#282830] rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#D90000]"
                  >
                    <option value="mp4">MP4 (H.264 / AAC)</option>
                    <option value="webm">WebM (VP9 / Opus)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#A1A1AA] uppercase tracking-wider text-[10px] mb-1.5">
                    Frame Rate
                  </label>
                  <select
                    value={options.fps}
                    onChange={(e) => setOptions({ ...options, fps: parseInt(e.target.value, 10) })}
                    className="w-full bg-[#141418] border border-[#282830] rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#D90000]"
                  >
                    <option value={60}>60 FPS (Ultra Smooth)</option>
                    <option value={30}>30 FPS (Standard)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#A1A1AA] uppercase tracking-wider text-[10px] mb-1.5">
                    Bitrate
                  </label>
                  <select
                    value={options.bitrateMbps}
                    onChange={(e) => setOptions({ ...options, bitrateMbps: parseInt(e.target.value, 10) })}
                    className="w-full bg-[#141418] border border-[#282830] rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#D90000]"
                  >
                    <option value={12}>12 Mbps (High)</option>
                    <option value={20}>20 Mbps (Max)</option>
                    <option value={8}>8 Mbps (Compact)</option>
                  </select>
                </div>
              </div>

              {/* Summary box */}
              <div className="p-3.5 bg-[#141418] rounded-2xl border border-[#26262E] space-y-1.5 text-[11px] text-[#8E8E98]">
                <div className="flex justify-between">
                  <span>Aspect Ratio:</span>
                  <span className="font-semibold text-white">{project.appearance.aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span>Background:</span>
                  <span className="font-semibold text-[#8DB355]">Applied canvas style</span>
                </div>
                <div className="flex justify-between">
                  <span>Framing:</span>
                  <span className="font-semibold text-[#FFEA93]">
                    {project.appearance.padding}px padding · {project.appearance.borderRadius}px radius
                  </span>
                </div>
              </div>
            </div>
          ) : isExporting ? (
            /* Rendering Progress State */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-[#282832] border-t-[#D90000] animate-spin" />
                <span className="absolute text-xs font-mono font-bold text-[#D90000]">
                  {progress?.progress || 0}%
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">
                  Rendering Studio Video...
                </h4>
                <p className="text-xs text-[#8E8E98]">
                  Compositing layout frames, background shaders, and audio tracks...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#141418] h-2 rounded-full overflow-hidden border border-[#282830]">
                <div
                  className="bg-[#D90000] h-full transition-all duration-200 rounded-full shadow-[0_0_10px_rgba(217,0,0,0.5)]"
                  style={{ width: `${progress?.progress || 0}%` }}
                />
              </div>
            </div>
          ) : (
            /* Done State */
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#8DB355]/20 text-[#8DB355] flex items-center justify-center shadow-lg border border-[#8DB355]/30">
                <Tick01Icon className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-base text-white">
                  Render Completed!
                </h4>
                <p className="text-xs text-[#8E8E98]">
                  Output size: {exportedBlob ? formatBytes(exportedBlob.size) : 'Ready'} • {options.resolutionPreset} @ {options.fps} FPS
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#26262E] bg-[#141418] flex items-center justify-end gap-3">
          {!exportedBlob && !isExporting ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E8E98] hover:text-white hover:bg-[#202026] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExport}
                className="px-5 py-2.5 rounded-full bg-[#D90000] hover:bg-[#b80000] text-white text-xs font-black shadow-[0_0_15px_rgba(217,0,0,0.3)] flex items-center gap-2 transition-all active:scale-95 cursor-pointer tracking-wider"
              >
                <Download01Icon className="w-4 h-4 stroke-[2.5]" />
                <span>START EXPORT</span>
              </button>
            </>
          ) : isExporting ? (
            <span className="text-xs text-[#8E8E98] italic">Please wait while frames render...</span>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleSaveToLibrary}
                disabled={isSaved || isSaving}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-[#18331E] border-[#8DB355] text-[#8DB355]'
                    : 'bg-[#202026] hover:bg-[#282832] border-[#2E2E38] text-[#D1D1D6]'
                }`}
              >
                {isSaved ? <Tick01Icon className="w-4 h-4" /> : <FloppyDiskIcon className="w-4 h-4" />}
                <span>{isSaved ? 'Saved to Library' : 'Save to Library'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-full bg-[#D90000] hover:bg-[#b80000] text-white text-xs font-black shadow-[0_0_15px_rgba(217,0,0,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Download01Icon className="w-4 h-4 stroke-[2.5]" />
                <span>DOWNLOAD VIDEO</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
