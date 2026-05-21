import { create } from "zustand";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type VoicePhase = "idle" | "listening" | "processing" | "speaking";

export type SupportedLanguage = "English" | "Hindi" | "Tamil";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  language?: SupportedLanguage | string;
  interim?: boolean;
  createdAt: string;
}

export interface LatencyMetrics {
  stt: number;
  llm: number;
  tts: number;
  total: number;
  updatedAt: string | null;
}

type ThemeMode = "dark" | "light";

interface VoiceStore {
  themeMode: ThemeMode;
  connectionStatus: ConnectionStatus;
  voicePhase: VoicePhase;
  isRecording: boolean;
  isAISpeaking: boolean;
  activeLanguage: SupportedLanguage;
  reconnectAttempts: number;
  websocketRoundTripMs: number;
  audioLevel: number;
  waveformBars: number[];
  currentUserInterim: string;
  currentAIInterim: string;
  currentTranscript: string;
  currentAIResponse: string;
  lastBackendTranscriptAt: number;
  lastBackendAssistantAt: number;
  messages: ChatMessage[];
  latency: LatencyMetrics;
  errorMessage: string | null;
  setThemeMode: (mode: ThemeMode) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setVoicePhase: (phase: VoicePhase) => void;
  setRecording: (recording: boolean) => void;
  setAISpeaking: (speaking: boolean) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setReconnectAttempts: (attempts: number) => void;
  setWebsocketRoundTrip: (ms: number) => void;
  setAudioLevel: (level: number) => void;
  setWaveformBars: (bars: number[]) => void;
  setCurrentUserInterim: (text: string) => void;
  setCurrentAIInterim: (text: string) => void;
  setCurrentTranscript: (text: string) => void;
  setCurrentAIResponse: (text: string) => void;
  markBackendTranscript: () => void;
  markBackendAssistant: () => void;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;
  setLatency: (metrics: Partial<LatencyMetrics>) => void;
  setErrorMessage: (message: string | null) => void;
  resetConversation: () => void;
}

const baseBars = Array.from({ length: 20 }, () => 0.08);

export const useVoiceStore = create<VoiceStore>((set) => ({
  themeMode: "dark",
  connectionStatus: "disconnected",
  voicePhase: "idle",
  isRecording: false,
  isAISpeaking: false,
  activeLanguage: "English",
  reconnectAttempts: 0,
  websocketRoundTripMs: 0,
  audioLevel: 0,
  waveformBars: baseBars,
  currentUserInterim: "",
  currentAIInterim: "",
  currentTranscript: "",
  currentAIResponse: "",
  lastBackendTranscriptAt: 0,
  lastBackendAssistantAt: 0,
  messages: [],
  latency: {
    stt: 0,
    llm: 0,
    tts: 0,
    total: 0,
    updatedAt: null
  },
  errorMessage: null,
  setThemeMode: (themeMode) => set({ themeMode }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setVoicePhase: (voicePhase) => set({ voicePhase }),
  setRecording: (isRecording) => set({ isRecording }),
  setAISpeaking: (isAISpeaking) => set({ isAISpeaking }),
  setLanguage: (activeLanguage) => set({ activeLanguage }),
  setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),
  setWebsocketRoundTrip: (websocketRoundTripMs) => set({ websocketRoundTripMs }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setWaveformBars: (waveformBars) => set({ waveformBars }),
  setCurrentUserInterim: (currentUserInterim) => set({ currentUserInterim }),
  setCurrentAIInterim: (currentAIInterim) => set({ currentAIInterim }),
  setCurrentTranscript: (currentTranscript) => set({ currentTranscript }),
  setCurrentAIResponse: (currentAIResponse) => set({ currentAIResponse }),
  markBackendTranscript: () => set({ lastBackendTranscriptAt: Date.now() }),
  markBackendAssistant: () => set({ lastBackendAssistantAt: Date.now() }),
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        }
      ]
    })),
  setLatency: (metrics) =>
    set((state) => ({
      latency: {
        ...state.latency,
        ...metrics,
        updatedAt: new Date().toISOString()
      }
    })),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  resetConversation: () =>
    set({
      voicePhase: "idle",
      isRecording: false,
      isAISpeaking: false,
      audioLevel: 0,
      waveformBars: baseBars,
      currentUserInterim: "",
      currentAIInterim: "",
      currentTranscript: "",
      currentAIResponse: "",
      lastBackendTranscriptAt: 0,
      lastBackendAssistantAt: 0,
      messages: [],
      latency: {
        stt: 0,
        llm: 0,
        tts: 0,
        total: 0,
        updatedAt: null
      },
      errorMessage: null
    })
}));
