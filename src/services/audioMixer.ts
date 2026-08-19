export interface AudioMixerController {
  destinationStream: MediaStream;
  analyserNode: AnalyserNode;
  setMicVolume: (volume: number) => void;
  setSystemVolume: (volume: number) => void;
  getAudioData: (dataArray: Uint8Array) => void;
  getFrequencyData: () => Uint8Array;
  getAverageVolume: () => number; // 0 to 100
  cleanup: () => void;
}

export function createAudioMixer(
  micStream: MediaStream | null,
  systemStream: MediaStream | null,
  initialMicVolume = 1.0,
  initialSystemVolume = 1.0
): AudioMixerController {
  const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtxClass();

  const destination = audioCtx.createMediaStreamDestination();
  const analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 64;
  analyserNode.smoothingTimeConstant = 0.8;

  let micSource: MediaStreamAudioSourceNode | null = null;
  let micGain: GainNode | null = null;

  let systemSource: MediaStreamAudioSourceNode | null = null;
  let systemGain: GainNode | null = null;

  // Process Microphone stream
  if (micStream && micStream.getAudioTracks().length > 0) {
    try {
      micSource = audioCtx.createMediaStreamSource(micStream);
      micGain = audioCtx.createGain();
      micGain.gain.setValueAtTime(initialMicVolume, audioCtx.currentTime);

      micSource.connect(micGain);
      micGain.connect(destination);
      micGain.connect(analyserNode);
    } catch (e) {
      console.warn('Failed to connect microphone to Web Audio mixer:', e);
    }
  }

  // Process System Audio stream
  if (systemStream && systemStream.getAudioTracks().length > 0) {
    try {
      systemSource = audioCtx.createMediaStreamSource(systemStream);
      systemGain = audioCtx.createGain();
      systemGain.gain.setValueAtTime(initialSystemVolume, audioCtx.currentTime);

      systemSource.connect(systemGain);
      systemGain.connect(destination);
      systemGain.connect(analyserNode);
    } catch (e) {
      console.warn('Failed to connect system audio to Web Audio mixer:', e);
    }
  }

  const setMicVolume = (volume: number) => {
    if (micGain) {
      micGain.gain.setValueAtTime(Math.max(0, Math.min(volume, 2)), audioCtx.currentTime);
    }
  };

  const setSystemVolume = (volume: number) => {
    if (systemGain) {
      systemGain.gain.setValueAtTime(Math.max(0, Math.min(volume, 2)), audioCtx.currentTime);
    }
  };

  const getAudioData = (dataArray: Uint8Array) => {
    analyserNode.getByteFrequencyData(dataArray);
  };

  const getFrequencyData = (): Uint8Array => {
    const data = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(data);
    return data;
  };

  const getAverageVolume = (): number => {
    const data = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = data.length > 0 ? sum / data.length : 0;
    return Math.round((avg / 255) * 100);
  };

  const cleanup = () => {
    try {
      if (micSource) micSource.disconnect();
      if (micGain) micGain.disconnect();
      if (systemSource) systemSource.disconnect();
      if (systemGain) systemGain.disconnect();
      analyserNode.disconnect();
      if (audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    } catch (err) {
      console.warn('Error during audio mixer cleanup:', err);
    }
  };

  return {
    destinationStream: destination.stream,
    analyserNode,
    setMicVolume,
    setSystemVolume,
    getAudioData,
    getFrequencyData,
    getAverageVolume,
    cleanup,
  };
}
