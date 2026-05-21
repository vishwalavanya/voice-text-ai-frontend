import { useCallback, useEffect } from "react";
import { audioPlaybackService } from "../services/audioPlayback";
import { useVoiceStore } from "../store/voiceStore";

export const useAudioPlayer = () => {
  const setAISpeaking = useVoiceStore((state) => state.setAISpeaking);
  const setVoicePhase = useVoiceStore((state) => state.setVoicePhase);
  const setErrorMessage = useVoiceStore((state) => state.setErrorMessage);

  useEffect(() => {
    audioPlaybackService.setPlaybackListener((playing) => {
      setAISpeaking(playing);

      const { isRecording } = useVoiceStore.getState();
      if (playing) {
        setVoicePhase("speaking");
      } else {
        setVoicePhase(isRecording ? "listening" : "idle");
      }
    });

    audioPlaybackService.setErrorListener((error) => {
      setErrorMessage(error);
    });

    return () => {
      audioPlaybackService.clearQueue();
    };
  }, [setAISpeaking, setErrorMessage, setVoicePhase]);

  const enqueueAudio = useCallback((audioBuffer: ArrayBuffer, mimeType?: string) => {
    audioPlaybackService.enqueue(audioBuffer, mimeType);
  }, []);

  const speakText = useCallback((text: string, language?: string) => {
    audioPlaybackService.speakText(text, language);
  }, []);

  const clearAudioQueue = useCallback(() => {
    audioPlaybackService.clearQueue();
  }, []);

  return {
    enqueueAudio,
    speakText,
    clearAudioQueue
  };
};
