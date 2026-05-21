import { useEffect, useRef } from "react";
import type { SupportedLanguage } from "../store/voiceStore";

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

interface UseBrowserSpeechOptions {
  enabled: boolean;
  language: SupportedLanguage;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onUnavailable?: () => void;
}

const languageCodes: Record<SupportedLanguage, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Tamil: "ta-IN"
};

export const useBrowserSpeech = ({
  enabled,
  language,
  onInterim,
  onFinal,
  onUnavailable
}: UseBrowserSpeechOptions) => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const enabledRef = useRef(enabled);
  const restartTimerRef = useRef<number | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const speechWindow = window as WindowWithSpeech;
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!enabled) {
      if (restartTimerRef.current) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      onInterim("");
      return;
    }

    if (!SpeechRecognition) {
      onUnavailable?.();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageCodes[language];
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interimText = "";
      let finalText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (!transcript) continue;

        if (result.isFinal) {
          finalText = `${finalText} ${transcript}`.trim();
        } else {
          interimText = `${interimText} ${transcript}`.trim();
        }
      }

      onInterim(interimText);

      if (finalText) {
        onFinal(finalText);
        onInterim("");
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        enabledRef.current = false;
      }
    };

    recognition.onend = () => {
      if (!enabledRef.current) return;
      restartTimerRef.current = window.setTimeout(() => {
        try {
          recognition.start();
        } catch {
          // The browser can throw if start is called while recognition is still settling.
        }
      }, 350);
    };

    try {
      recognition.start();
    } catch {
      onUnavailable?.();
    }

    return () => {
      if (restartTimerRef.current) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      enabledRef.current = false;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [enabled, language, onFinal, onInterim, onUnavailable]);
};
