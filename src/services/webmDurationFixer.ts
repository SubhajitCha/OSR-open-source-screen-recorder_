/**
 * Lightweight in-browser WebM EBML Duration Patcher
 * Fixes missing duration metadata in WebM blobs produced by browser MediaRecorder,
 * enabling proper timeline seeking, accurate video length, and preventing frozen playback.
 */

export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);

    // Look for EBML Segment Info element (0x15 0x49 0xA9 0x66)
    let segmentInfoOffset = -1;
    for (let i = 0; i < Math.min(bytes.length - 4, 1024); i++) {
      if (bytes[i] === 0x15 && bytes[i + 1] === 0x49 && bytes[i + 2] === 0xa9 && bytes[i + 3] === 0x66) {
        segmentInfoOffset = i;
        break;
      }
    }

    if (segmentInfoOffset === -1) {
      return blob; // Fallback to raw blob if not found
    }

    // Look for TimecodeScale (0x2A 0xD7 0xB1) or Duration (0x44 0x89) inside Segment Info
    let timecodeScale = 1000000; // Default: 1ms = 1,000,000 ns
    let durationOffset = -1;

    for (let i = segmentInfoOffset; i < Math.min(segmentInfoOffset + 256, bytes.length - 4); i++) {
      // TimecodeScale
      if (bytes[i] === 0x2a && bytes[i + 1] === 0xd7 && bytes[i + 2] === 0xb1) {
        const len = bytes[i + 3] & 0x7f;
        if (len === 4) {
          timecodeScale = view.getUint32(i + 4, false);
        }
      }
      // Duration
      if (bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
        durationOffset = i;
        break;
      }
    }

    if (durationOffset !== -1) {
      // Existing Duration element found: overwrite with float64
      const durationLen = bytes[durationOffset + 2] & 0x7f;
      const targetDurationValue = durationMs;
      if (durationLen === 8) {
        view.setFloat64(durationOffset + 3, targetDurationValue, false);
        return new Blob([arrayBuffer], { type: blob.type });
      } else if (durationLen === 4) {
        view.setFloat32(durationOffset + 3, targetDurationValue, false);
        return new Blob([arrayBuffer], { type: blob.type });
      }
    }

    return blob;
  } catch (err) {
    console.warn('WebM duration patch skipped:', err);
    return blob;
  }
}
