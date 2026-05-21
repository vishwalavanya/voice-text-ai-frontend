const preferredMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus"
];

export const resolveRecorderMimeType = (): string | undefined => {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  return preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
};

export const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => blob.arrayBuffer();

export const createAnalyser = (stream: MediaStream): {
  audioContext: AudioContext;
  analyser: AnalyserNode;
  source: MediaStreamAudioSourceNode;
} => {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.72;
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  return {
    audioContext,
    analyser,
    source
  };
};

export const measureAudioLevel = (
  analyser: AnalyserNode,
  buckets = 20
): { level: number; bars: number[] } => {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    sum += data[i];
  }
  const level = Math.min(1, sum / data.length / 160);

  const bars: number[] = [];
  const sectionSize = Math.floor(data.length / buckets);
  for (let i = 0; i < buckets; i += 1) {
    const start = i * sectionSize;
    const end = Math.min(start + sectionSize, data.length);
    let segment = 0;
    for (let j = start; j < end; j += 1) {
      segment += data[j];
    }
    const value = end - start > 0 ? segment / (end - start) / 255 : 0.06;
    bars.push(Math.max(0.06, Math.min(1, value)));
  }

  return { level, bars };
};
