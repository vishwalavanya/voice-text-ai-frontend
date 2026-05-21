interface QueuedAudio {
  url: string;
  mimeType: string;
}

export class AudioPlaybackService {
  private audioElement: HTMLAudioElement;
  private queue: QueuedAudio[] = [];
  private isPlaying = false;
  private activeUrl: string | null = null;
  private onPlayingChange?: (playing: boolean) => void;
  private onError?: (message: string) => void;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = "auto";
    this.audioElement.onended = () => {
      if (this.activeUrl) {
        URL.revokeObjectURL(this.activeUrl);
        this.activeUrl = null;
      }
      this.isPlaying = false;
      this.onPlayingChange?.(false);
      void this.playNext();
    };
    this.audioElement.onerror = () => {
      if (!this.activeUrl) {
        return;
      }

      if (this.activeUrl) {
        URL.revokeObjectURL(this.activeUrl);
        this.activeUrl = null;
      }
      this.onError?.("Could not play assistant audio chunk.");
      this.isPlaying = false;
      this.onPlayingChange?.(false);
      void this.playNext();
    };
  }

  setPlaybackListener(listener: (playing: boolean) => void) {
    this.onPlayingChange = listener;
  }

  setErrorListener(listener: (message: string) => void) {
    this.onError = listener;
  }

  enqueue(audioBuffer: ArrayBuffer, mimeType = "audio/wav") {
    if (audioBuffer.byteLength < 128) {
      this.onError?.("Backend audio chunk was too small to play.");
      return;
    }

    const blob = new Blob([audioBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    this.queue.push({ url, mimeType });
    if (!this.isPlaying) {
      void this.playNext();
    }
  }

  speakText(text: string, language = "English") {
    if (!("speechSynthesis" in window)) {
      this.onError?.("Browser speech synthesis is not available.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.resolveSpeechLanguage(language);
    utterance.rate = 0.94;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase())
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      this.isPlaying = true;
      this.onPlayingChange?.(true);
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.onPlayingChange?.(false);
      void this.playNext();
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      this.onPlayingChange?.(false);
      this.onError?.("Could not play browser voice response.");
    };

    window.speechSynthesis.speak(utterance);
  }

  clearQueue() {
    for (const item of this.queue) {
      URL.revokeObjectURL(item.url);
    }
    this.queue = [];
    this.audioElement.pause();
    this.audioElement.src = "";
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (this.activeUrl) {
      URL.revokeObjectURL(this.activeUrl);
      this.activeUrl = null;
    }
    this.isPlaying = false;
    this.onPlayingChange?.(false);
  }

  private async playNext() {
    if (this.isPlaying) return;
    const next = this.queue.shift();
    if (!next) return;

    this.isPlaying = true;
    this.onPlayingChange?.(true);
    this.activeUrl = next.url;
    this.audioElement.src = next.url;

    try {
      await this.audioElement.play();
    } catch {
      this.onError?.(`Autoplay blocked for ${next.mimeType}. Click microphone again to resume.`);
      this.isPlaying = false;
      this.onPlayingChange?.(false);
      URL.revokeObjectURL(next.url);
      this.activeUrl = null;
      void this.playNext();
      return;
    }
  }

  private resolveSpeechLanguage(language: string) {
    const normalized = language.toLowerCase();
    if (normalized.includes("hindi")) return "hi-IN";
    if (normalized.includes("tamil")) return "ta-IN";
    return "en-IN";
  }
}

export const audioPlaybackService = new AudioPlaybackService();
