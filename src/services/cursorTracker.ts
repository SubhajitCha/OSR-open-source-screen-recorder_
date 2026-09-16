import { CursorPoint } from '../types';

export class CursorTracker {
  private points: CursorPoint[] = [];
  private isTracking = false;
  private isPaused = false;
  private startTime = 0;
  private pausedTime = 0;
  private totalPausedDuration = 0;
  private lastSampleTime = 0;
  private lastX = 0.5;
  private lastY = 0.5;

  private mouseMoveHandler: ((e: MouseEvent | PointerEvent) => void) | null = null;
  private sampleIntervalMs = 8; // High frequency ~120Hz sampling for zero-latency motion fidelity

  public start(): void {
    this.points = [];
    this.isTracking = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.pausedTime = 0;
    this.totalPausedDuration = 0;
    this.lastSampleTime = 0;

    // Initial point in center or current position
    this.recordPoint(this.lastX, this.lastY, 0);

    this.mouseMoveHandler = (e: MouseEvent | PointerEvent) => {
      if (!this.isTracking || this.isPaused) return;

      const now = performance.now();
      if (now - this.lastSampleTime < this.sampleIntervalMs) return;
      this.lastSampleTime = now;

      // Normalize coordinates to 0..1 based on window viewport
      const width = window.innerWidth || document.documentElement.clientWidth || 1920;
      const height = window.innerHeight || document.documentElement.clientHeight || 1080;

      const normX = Math.max(0, Math.min(1, e.clientX / width));
      const normY = Math.max(0, Math.min(1, e.clientY / height));

      this.lastX = normX;
      this.lastY = normY;

      const relativeTimeSec = (now - this.startTime - this.totalPausedDuration) / 1000;
      this.recordPoint(normX, normY, Math.max(0, relativeTimeSec));
    };

    window.addEventListener('pointermove', this.mouseMoveHandler, { passive: true });
    window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
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

  public stop(): CursorPoint[] {
    this.isTracking = false;
    this.isPaused = false;

    if (this.mouseMoveHandler) {
      window.removeEventListener('pointermove', this.mouseMoveHandler);
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }

    return [...this.points];
  }

  public getPoints(): CursorPoint[] {
    return [...this.points];
  }

  public recordDirectPoint(x: number, y: number): void {
    if (!this.isTracking || this.isPaused) return;
    const now = performance.now();
    const relativeTimeSec = (now - this.startTime - this.totalPausedDuration) / 1000;
    this.recordPoint(x, y, Math.max(0, relativeTimeSec));
  }

  private recordPoint(x: number, y: number, time: number): void {
    this.points.push({
      time: parseFloat(time.toFixed(3)),
      x: parseFloat(x.toFixed(4)),
      y: parseFloat(y.toFixed(4)),
    });
  }
}
