import { useCallback, useEffect, useMemo, useRef } from "react";
import { AUDIO_CHUNK_INTERVAL_MS } from "../api/config";
import {
  blobToArrayBuffer,
  createAnalyser,
  measureAudioLevel,
  resolveRecorderMimeType
} from "../services/audioStreaming";
import { useVoiceStore } from "../store/voiceStore";

interface UseMicrophoneOptions {
  onAudioChunk: (audioChunk: ArrayBuffer, mimeType: string) => void;
  onError?: (message: string) => void;
}

export const useMicrophone = ({ onAudioChunk, onError }: UseMicrophoneOptions) => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const setRecording = useVoiceStore((state) => state.setRecording);
  const setVoicePhase = useVoiceStore((state) => state.setVoicePhase);
  const setAudioLevel = useVoiceStore((state) => state.setAudioLevel);
  const setWaveformBars = useVoiceStore((state) => state.setWaveformBars);

  const isSupported = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== "undefined",
    []
  );

  const stopMonitoring = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setAudioLevel(0);
    setWaveformBars(Array.from({ length: 20 }, () => 0.08));
  }, [setAudioLevel, setWaveformBars]);

  const startMonitoring = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const update = () => {
      const { level, bars } = measureAudioLevel(analyser);
      setAudioLevel(level);
      setWaveformBars(bars);
      rafRef.current = requestAnimationFrame(update);
    };

    update();
  }, [setAudioLevel, setWaveformBars]);

  const start = useCallback(async () => {
    if (!isSupported) {
      onError?.("Microphone APIs are not supported in this browser.");
      return;
    }

    if (recorderRef.current?.state === "recording") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      const mimeType = resolveRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (!event.data || event.data.size === 0) return;
        const audioChunk = await blobToArrayBuffer(event.data);
        onAudioChunk(audioChunk, recorder.mimeType || "audio/webm");
      };

      recorder.onerror = () => {
        onError?.("Audio recorder failed while capturing input.");
      };

      const analyserNodes = createAnalyser(stream);
      analyserContextRef.current = analyserNodes.audioContext;
      analyserRef.current = analyserNodes.analyser;
      startMonitoring();

      recorder.start(AUDIO_CHUNK_INTERVAL_MS);
      setRecording(true);
      setVoicePhase("listening");
    } catch {
      onError?.("Microphone permission denied or unavailable.");
    }
  }, [isSupported, onAudioChunk, onError, setRecording, setVoicePhase, startMonitoring]);

  const stop = useCallback(async () => {
    stopMonitoring();
    setRecording(false);
    setVoicePhase("idle");

    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (analyserContextRef.current && analyserContextRef.current.state !== "closed") {
      await analyserContextRef.current.close();
      analyserContextRef.current = null;
    }

    analyserRef.current = null;
  }, [setRecording, setVoicePhase, stopMonitoring]);

  useEffect(
    () => () => {
      void stop();
    },
    [stop]
  );

  return {
    isSupported,
    start,
    stop
  };
};
