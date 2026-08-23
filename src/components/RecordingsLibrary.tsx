import React, { useState, useEffect } from 'react';
import {
  Film01Icon,
  Search01Icon,
  Download01Icon,
  Delete02Icon,
  PlayIcon,
  HardDriveIcon,
  Calendar03Icon,
  Cancel01Icon,
  PencilEdit02Icon,
  Tick01Icon,
  Layers01Icon,
  Camera01Icon,
  RadioIcon,
  Video01Icon,
  AlertCircleIcon,
  Clock01Icon,
} from 'hugeicons-react';
import { SavedRecording } from '../types';
import {
  getAllRecordings,
  deleteRecordingFromDB,
  updateRecordingInDB,
  clearAllRecordingsFromDB,
  getStorageInfo,
  formatBytes,
} from '../services/db';
import { downloadBlob } from '../services/videoTrimmer';

interface RecordingsLibraryProps {
  onSelectRecordingForEdit?: (recording: SavedRecording) => void;
  onOpenStudio: () => void;
  onRecordingDeleted?: () => void;
}

export const RecordingsLibrary: React.FC<RecordingsLibraryProps> = ({ onOpenStudio, onRecordingDeleted }) => {
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activePlayback, setActivePlayback] = useState<SavedRecording | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

  // Delete confirmation modals (in-app, no window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [storageInfo, setStorageInfo] = useState<{
    formattedUsage: string;
    formattedQuota: string;
    percentage: number;
  }>({
    formattedUsage: '0 B',
    formattedQuota: 'Unknown',
    percentage: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await getAllRecordings();
      setRecordings(items);
      const storage = await getStorageInfo();
      setStorageInfo(storage);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const confirmDeleteSingle = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRecordingFromDB(deleteTarget.id);
      if (activePlayback?.id === deleteTarget.id) {
        setActivePlayback(null);
      }
      setDeleteTarget(null);
      await loadData();
      onRecordingDeleted?.();
    } catch (err) {
      console.error('Failed to delete recording:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearAll = async () => {
    setIsDeleting(true);
    try {
      await clearAllRecordingsFromDB();
      setActivePlayback(null);
      setShowClearAllModal(false);
      await loadData();
      onRecordingDeleted?.();
    } catch (err) {
      console.error('Failed to clear recordings:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartEdit = (rec: SavedRecording) => {
    setEditingId(rec.id);
    setEditTitle(rec.title);
  };

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await updateRecordingInDB(id, { title: editTitle.trim() });
      setEditingId(null);
      await loadData();
    }
  };

  // Collect all unique tags
  const allTags = Array.from(
    new Set(recordings.flatMap((r) => r.tags || []).filter(Boolean))
  );

  const filteredRecordings = recordings.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.tags && rec.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag = selectedTag === 'all' || (rec.tags && rec.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div id="recordings-library-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Title & Storage Gauge styled like Screenity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-50 dark:bg-zinc-900 text-blue-600 dark:text-emerald-400 border border-blue-100 dark:border-zinc-800 shadow-xs">
              <Film01Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Recent Recordings</h1>
                <span className="text-[11px] font-bold text-blue-600 dark:text-emerald-400 bg-blue-50 dark:bg-zinc-900 border border-blue-200/60 dark:border-zinc-800 px-2.5 py-0.5 rounded-full">
                  OSR Library
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Persistent offline recordings stored safely in browser IndexedDB
              </p>
            </div>
          </div>
        </div>

        {/* Storage quota card */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
            <HardDriveIcon className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <div>
              <span className="font-bold block text-slate-900 dark:text-zinc-100">{storageInfo.formattedUsage} Used</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Local Browser Storage</span>
            </div>
          </div>

          <div className="w-24 bg-slate-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(storageInfo.percentage, 4))}%` }}
            />
          </div>

          {recordings.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              title="Delete All Recordings"
            >
              <Delete02Icon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search01Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search recordings or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-full text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 dark:focus:border-emerald-500 shadow-xs"
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-4 py-1.5 text-xs rounded-full font-medium transition-colors cursor-pointer ${
                selectedTag === 'all'
                  ? 'bg-blue-600 dark:bg-white text-white dark:text-black font-bold shadow-xs'
                  : 'bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800 shadow-xs'
              }`}
            >
              All ({recordings.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1.5 text-xs rounded-full font-medium capitalize transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-blue-600 dark:bg-white text-white dark:text-black font-bold shadow-xs'
                    : 'bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800 shadow-xs'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-zinc-500">
          <div className="w-8 h-8 border-2 border-blue-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading offline recordings...</p>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-dashed border-slate-200 dark:border-zinc-800 text-center space-y-4 shadow-xs transition-colors">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500">
            <Video01Icon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1">No recordings saved yet</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              Start your first screen recording with OSR. Everything is recorded offline with zero server lag.
            </p>
          </div>
          <button
            onClick={onOpenStudio}
            className="px-6 py-3 text-xs font-bold text-white dark:text-black bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-zinc-200 rounded-full shadow-md shadow-blue-500/25 dark:shadow-white/10 transition-all cursor-pointer active:scale-95"
          >
            Start First Recording
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecordings.map((rec) => (
            <div
              key={rec.id}
              id={`recording-card-${rec.id}`}
              className="group flex flex-col rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md"
            >
              {/* Thumbnail Container with Play Overlay */}
              <div
                onClick={() => setActivePlayback(rec)}
                className="relative aspect-video w-full bg-slate-950 cursor-pointer overflow-hidden"
              >
                {rec.thumbnailUrl && rec.thumbnailUrl.trim() !== '' ? (
                  <img
                    src={rec.thumbnailUrl}
                    alt={rec.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 dark:text-zinc-600">
                    <Film01Icon className="w-8 h-8" />
                  </div>
                )}

                {/* Duration Badge */}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-sm text-[11px] font-mono font-bold text-white border border-white/10">
                  {formatDuration(rec.duration)}
                </div>

                {/* Mode icon badge */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-sm text-[10px] font-semibold text-white border border-white/10 capitalize flex items-center gap-1">
                  {rec.mode === 'screen_cam' ? (
                    <Layers01Icon className="w-3 h-3 text-blue-400" />
                  ) : rec.mode === 'cam_only' ? (
                    <Camera01Icon className="w-3 h-3 text-purple-400" />
                  ) : rec.mode === 'audio_only' ? (
                    <RadioIcon className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Film01Icon className="w-3 h-3 text-blue-400" />
                  )}
                  <span>{rec.mode.replace('_', ' ')}</span>
                </div>

                {/* Play hover button */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 dark:bg-white text-white dark:text-black shadow-lg shadow-blue-600/40 dark:shadow-white/20">
                    <PlayIcon className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  {editingId === rec.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-zinc-900 border border-blue-500 dark:border-emerald-500 rounded-lg text-slate-900 dark:text-zinc-100"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(rec.id)}
                        className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                      >
                        <Tick01Icon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => setActivePlayback(rec)}
                        className="text-sm font-bold text-slate-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-emerald-400 cursor-pointer line-clamp-1 transition-colors"
                      >
                        {rec.title}
                      </h3>
                      <button
                        onClick={() => handleStartEdit(rec)}
                        className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Rename"
                      >
                        <PencilEdit02Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {rec.notes && <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">{rec.notes}</p>}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar03Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      {formatDate(rec.createdAt)}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-300 font-medium">{formatBytes(rec.size)}</span>
                  </div>

                  {/* Tags */}
                  {rec.tags && rec.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rec.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                  <button
                    onClick={() => setActivePlayback(rec)}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-emerald-300 cursor-pointer transition-colors"
                  >
                    <PlayIcon className="w-3.5 h-3.5 fill-current" />
                    <span>Watch</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const ext = rec.mimeType.includes('mp4') ? 'mp4' : 'webm';
                        downloadBlob(rec.blob, `${rec.title.replace(/\s+/g, '_')}.${ext}`);
                      }}
                      className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Download Video File"
                    >
                      <Download01Icon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteTarget({ id: rec.id, title: rec.title })}
                      className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Delete from Local DB"
                    >
                      <Delete02Icon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-App Delete Single Recording Confirmation Modal */}
      {deleteTarget && (
        <div
          id="confirm-delete-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 text-slate-900 dark:text-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Delete02Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Delete Recording?</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-zinc-100">"{deleteTarget.title}"</span> from your offline storage? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteSingle}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-full shadow-md shadow-red-200 dark:shadow-red-950/50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Recording'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Clear All Recordings Confirmation Modal */}
      {showClearAllModal && (
        <div
          id="confirm-clear-all-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 text-slate-900 dark:text-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertCircleIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Delete All Recordings?</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  This will permanently wipe all {recordings.length} recordings from your browser's local IndexedDB database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmClearAll}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-full shadow-md shadow-red-200 dark:shadow-red-950/50 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'Clearing...' : 'Clear All Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Playback Modal */}
      {activePlayback && (
        <div
          id="library-playback-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-zinc-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">{activePlayback.title}</h3>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  {formatDate(activePlayback.createdAt)} · {formatBytes(activePlayback.size)}
                </span>
              </div>
              <button
                onClick={() => setActivePlayback(null)}
                className="p-2 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <Cancel01Icon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-950">
              {activePlayback.blob && (
                <video
                  src={URL.createObjectURL(activePlayback.blob)}
                  controls
                  autoPlay
                  className="w-full max-h-[60vh] object-contain rounded-2xl border-2 border-slate-800 dark:border-zinc-800"
                />
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs">
              <span className="text-slate-500 dark:text-zinc-400">Recorded offline with OSR Open Source Recorder</span>
              <button
                onClick={() => {
                  const ext = activePlayback.mimeType.includes('mp4') ? 'mp4' : 'webm';
                  downloadBlob(activePlayback.blob, `${activePlayback.title.replace(/\s+/g, '_')}.${ext}`);
                }}
                className="flex items-center gap-2 px-5 py-2 font-black text-white dark:text-black bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-zinc-200 rounded-full shadow-sm shadow-blue-500/25 dark:shadow-white/10 cursor-pointer"
              >
                <Download01Icon className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
