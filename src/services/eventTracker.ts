import { ClickEvent, KeyboardEventRecord, RecordingMetadata, VideoBookmark } from '../types';

export class EventTracker {
  private clicks: ClickEvent[] = [];
  private keyboard: KeyboardEventRecord[] = [];
  private isTracking = false;
  private isPaused = false;
  private startTime = 0;
  private pausedTime = 0;
  private totalPausedDuration = 0;

  private lastKeystrokeTime = 0;
  private burstCounter = 0;

  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private dblClickHandler: ((e: MouseEvent) => void) | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  public start(): void {
    this.clicks = [];
    this.keyboard = [];
    this.isTracking = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.pausedTime = 0;
    this.totalPausedDuration = 0;
    this.lastKeystrokeTime = 0;
    this.burstCounter = 0;

    const getRelativeTime = () => {
      const now = performance.now();
      return Math.max(0, (now - this.startTime - this.totalPausedDuration) / 1000);
    };

    // Click handler
    this.clickHandler = (e: MouseEvent) => {
      if (!this.isTracking || this.isPaused) return;

      const width = window.innerWidth || document.documentElement.clientWidth || 1920;
      const height = window.innerHeight || document.documentElement.clientHeight || 1080;

      const normX = Math.max(0, Math.min(1, e.clientX / width));
      const normY = Math.max(0, Math.min(1, e.clientY / height));

      const button: 'left' | 'right' | 'middle' =
        e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';

      const time = parseFloat(getRelativeTime().toFixed(3));

      this.clicks.push({
        id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        time,
        x: parseFloat(normX.toFixed(4)),
        y: parseFloat(normY.toFixed(4)),
        button,
        type: 'click',
      });
    };

    // Double click handler
    this.dblClickHandler = (e: MouseEvent) => {
      if (!this.isTracking || this.isPaused) return;

      const width = window.innerWidth || document.documentElement.clientWidth || 1920;
      const height = window.innerHeight || document.documentElement.clientHeight || 1080;

      const normX = Math.max(0, Math.min(1, e.clientX / width));
      const normY = Math.max(0, Math.min(1, e.clientY / height));
      const time = parseFloat(getRelativeTime().toFixed(3));

      this.clicks.push({
        id: `dblclick_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        time,
        x: parseFloat(normX.toFixed(4)),
        y: parseFloat(normY.toFixed(4)),
        button: 'left',
        type: 'dblclick',
      });
    };

    // Keystroke handler (detects continuous typing bursts for auto-speedup)
    this.keydownHandler = (e: KeyboardEvent) => {
      if (!this.isTracking || this.isPaused) return;

      const now = performance.now();
      const time = parseFloat(getRelativeTime().toFixed(3));

      // Check if this keystroke is part of a fast typing burst (< 500ms since last key)
      const isBurst = now - this.lastKeystrokeTime < 500;
      if (isBurst) {
        this.burstCounter++;
      } else {
        this.burstCounter = 1;
      }
      this.lastKeystrokeTime = now;

      // Filter non-printable modifier spam or keep key name
      const keyName = e.key.length === 1 ? e.key : `[${e.key}]`;

      this.keyboard.push({
        time,
        key: keyName,
        code: e.code,
        isTypingBurst: this.burstCounter >= 3,
      });
    };

    window.addEventListener('click', this.clickHandler, { passive: true, capture: true });
    window.addEventListener('dblclick', this.dblClickHandler, { passive: true, capture: true });
    window.addEventListener('keydown', this.keydownHandler, { passive: true, capture: true });
  }

  public pause(): void {
    if (!this.isTracking || this.isPaused) return;
    this.isPaused = true;
    this.pausedTime = performance.now();
  }

  public resume(): void {
    if (!this.isTracking || !this.isPaused) return;
    this.isPaused = false;
    if (this.pausedTime > 0) {
      this.totalPausedDuration += performance.now() - this.pausedTime;
      this.pausedTime = 0;
    }
  }

  public stop(): { clicks: ClickEvent[]; keyboard: KeyboardEventRecord[] } {
    this.isTracking = false;
    this.isPaused = false;

    if (this.clickHandler) {
      window.removeEventListener('click', this.clickHandler, { capture: true });
      this.clickHandler = null;
    }
    if (this.dblClickHandler) {
      window.removeEventListener('dblclick', this.dblClickHandler, { capture: true });
      this.dblClickHandler = null;
    }
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler, { capture: true });
      this.keydownHandler = null;
    }

    return {
      clicks: [...this.clicks],
      keyboard: [...this.keyboard],
    };
  }

  public getClicks(): ClickEvent[] {
    return [...this.clicks];
  }

  public getKeyboard(): KeyboardEventRecord[] {
    return [...this.keyboard];
  }

  public recordDirectClick(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left'): void {
    if (!this.isTracking || this.isPaused) return;
    const now = performance.now();
    const time = parseFloat(Math.max(0, (now - this.startTime - this.totalPausedDuration) / 1000).toFixed(3));
    this.clicks.push({
      id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time,
      x: parseFloat(x.toFixed(4)),
      y: parseFloat(y.toFixed(4)),
      button,
      type: 'click',
    });
  }
}

export function buildRecordingMetadata(
  cursor: import('../types').CursorPoint[],
  clicks: ClickEvent[],
  keyboard: KeyboardEventRecord[],
  bookmarks: VideoBookmark[]
): RecordingMetadata {
  return {
    cursor,
    clicks,
    keyboard,
    bookmarks,
    screenDimensions: {
      width: window.screen?.width || window.innerWidth || 1920,
      height: window.screen?.height || window.innerHeight || 1080,
    },
  };
}
