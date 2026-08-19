import React, { useState, useEffect } from 'react';
import {
  Film,
  Search,
  Download,
  Trash2,
  Play,
  HardDrive,
  Clock,
  Calendar,
  Tag,
  X,
  ExternalLink,
  Edit2,
  Check,
  Filter,
  Layers,
  Camera,
  Radio,
  FileVideo,
} from 'lucide-react';
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
}

export const RecordingsLibrary: React.FC<RecordingsLibraryProps> = ({ onOpenStudio }) => {
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [activePlayback, setActivePlayback] = useState<SavedRecording | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recording from local storage?')) {
      await deleteRecordingFromDB(id);
      await loadData();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Delete ALL recordings from browser IndexedDB storage? This cannot be undone.')) {
      await clearAllRecordingsFromDB();
      await loadData();
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
      {/* Header with Title & Storage Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-800 border border-gray-200">
              <Film className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Recent Recordings</h1>
              <p className="text-xs text-gray-500">
                Persistent offline recordings stored in browser IndexedDB
              </p>
            </div>
          </div>
        </div>

        {/* Storage quota card */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <div>
              <span className="font-semibold block text-gray-900">{storageInfo.formattedUsage} Used</span>
              <span className="text-[10px] text-gray-400">IndexedDB Storage</span>
            </div>
          </div>

          <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(storageInfo.percentage, 4))}%` }}
            />
          </div>

          {recordings.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded-lg transition-colors"
              title="Delete All Recordings"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search recordings, tags, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-red-500 shadow-sm"
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                selectedTag === 'all'
                  ? 'bg-gray-900 text-white font-bold shadow-sm'
                  : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm'
              }`}
            >
              All ({recordings.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                  selectedTag === tag
                    ? 'bg-gray-900 text-white font-bold shadow-sm'
                    : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm'
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
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading offline recordings...</p>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 p-8 rounded-3xl bg-white border border-dashed border-gray-200 text-center space-y-4 shadow-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 text-gray-400">
            <FileVideo className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No recordings saved yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Start your first screen recording. Everything is saved locally with zero cloud lag.
            </p>
          </div>
          <button
            onClick={onOpenStudio}
            className="px-6 py-3 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-md shadow-red-200 transition-all"
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
              className="group flex flex-col rounded-3xl bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden shadow-sm hover:shadow"
            >
              {/* Thumbnail Container with Play Overlay */}
              <div
                onClick={() => setActivePlayback(rec)}
                className="relative aspect-video w-full bg-gray-900 cursor-pointer overflow-hidden"
              >
                {rec.thumbnailUrl ? (
                  <img
                    src={rec.thumbnailUrl}
                    alt={rec.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-600">
                    <Film className="w-8 h-8" />
                  </div>
                )}

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[11px] font-mono font-bold text-white border border-white/10">
                  {formatDuration(rec.duration)}
                </div>

                {/* Mode icon badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-white border border-white/10 capitalize flex items-center gap-1">
                  {rec.mode === 'screen_cam' ? (
                    <Layers className="w-3 h-3 text-red-400" />
                  ) : rec.mode === 'cam_only' ? (
                    <Camera className="w-3 h-3 text-purple-400" />
                  ) : rec.mode === 'audio_only' ? (
                    <Radio className="w-3 h-3 text-green-400" />
                  ) : (
                    <Film className="w-3 h-3 text-blue-400" />
                  )}
                  <span>{rec.mode.replace('_', ' ')}</span>
                </div>

                {/* Play hover button */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
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
                        className="flex-1 px-2 py-1 text-xs bg-gray-50 border border-red-500 rounded text-gray-900"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(rec.id)}
                        className="p-1 text-green-600 hover:bg-gray-100 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => setActivePlayback(rec)}
                        className="text-sm font-bold text-gray-900 hover:text-red-600 cursor-pointer line-clamp-1"
                      >
                        {rec.title}
                      </h3>
                      <button
                        onClick={() => handleStartEdit(rec)}
                        className="p-1 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {rec.notes && <p className="text-xs text-gray-500 line-clamp-2">{rec.notes}</p>}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {formatDate(rec.createdAt)}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-gray-700 font-medium">{formatBytes(rec.size)}</span>
                  </div>

                  {/* Tags */}
                  {rec.tags && rec.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rec.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 border border-gray-200 text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setActivePlayback(rec)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const ext = rec.mimeType.includes('mp4') ? 'mp4' : 'webm';
                        downloadBlob(rec.blob, `${rec.title.replace(/\s+/g, '_')}.${ext}`);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Download Video File"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Delete from Local DB"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Playback Modal */}
      {activePlayback && (
        <div
          id="library-playback-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
        >
          <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden text-gray-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
              <div>
                <h3 className="text-base font-bold text-gray-900">{activePlayback.title}</h3>
                <span className="text-xs text-gray-500">
                  {formatDate(activePlayback.createdAt)} · {formatBytes(activePlayback.size)}
                </span>
              </div>
              <button
                onClick={() => setActivePlayback(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-900">
              <video
                src={URL.createObjectURL(activePlayback.blob)}
                controls
                autoPlay
                className="w-full max-h-[60vh] object-contain rounded-2xl border-[4px] border-white/20"
              />
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white text-xs">
              <span className="text-gray-500">Recorded with Vellum Recorder</span>
              <button
                onClick={() => {
                  const ext = activePlayback.mimeType.includes('mp4') ? 'mp4' : 'webm';
                  downloadBlob(activePlayback.blob, `${activePlayback.title.replace(/\s+/g, '_')}.${ext}`);
                }}
                className="flex items-center gap-2 px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-sm shadow-red-200"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

