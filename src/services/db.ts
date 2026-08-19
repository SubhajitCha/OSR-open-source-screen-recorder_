import { SavedRecording } from '../types';

const DB_NAME = 'ScreenStreamOpenDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('mode', 'mode', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAllRecordings(): Promise<SavedRecording[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // newest first
      const results: SavedRecording[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get recordings from IndexedDB:', error);
    return [];
  }
}

export async function getRecordingById(id: string): Promise<SavedRecording | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to get recording ${id}:`, error);
    return null;
  }
}

export async function saveRecordingToDB(recording: SavedRecording): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(recording);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateRecordingInDB(
  id: string,
  updates: Partial<Omit<SavedRecording, 'id'>>
): Promise<void> {
  const recording = await getRecordingById(id);
  if (!recording) throw new Error('Recording not found');

  const updated: SavedRecording = {
    ...recording,
    ...updates,
  };

  await saveRecordingToDB(updated);
}

export async function deleteRecordingFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllRecordingsFromDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getStorageInfo(): Promise<{
  usage: number; // bytes
  quota: number; // bytes
  percentage: number;
  formattedUsage: string;
  formattedQuota: string;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 1024 * 1024 * 1024; // fallback 1GB
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        usage,
        quota,
        percentage: Math.min(percentage, 100),
        formattedUsage: formatBytes(usage),
        formattedQuota: formatBytes(quota),
      };
    } catch {
      // Fallback
    }
  }

  return {
    usage: 0,
    quota: 1024 * 1024 * 1024,
    percentage: 0,
    formattedUsage: '0 B',
    formattedQuota: 'Unknown',
  };
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function generateThumbnailFromBlob(videoBlob: Blob, seekTime = 0.1): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoBlob);
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let resolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    const tryCapture = () => {
      if (resolved) return;
      try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          const width = 640;
          const height = Math.round((video.videoHeight / video.videoWidth) * width) || 360;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolved = true;
            cleanup();
            resolve(dataUrl);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not generate thumbnail from frame:', err);
      }
    };

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.max(0.05, seekTime);
      } catch {
        tryCapture();
      }
    };

    video.onseeked = () => {
      tryCapture();
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(createPlaceholderThumbnail());
      }
    };

    // Safety timeout - attempt capture then fallback
    setTimeout(() => {
      if (!resolved) {
        tryCapture();
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(createPlaceholderThumbnail());
        }
      }
    }, 1500);
  });
}

function createPlaceholderThumbnail(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 270;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 480, 270);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Recording Preview', 240, 135);
    return canvas.toDataURL('image/jpeg', 0.8);
  }
  return '';
}
