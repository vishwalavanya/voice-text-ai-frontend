export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://voice-text-ai.onrender.com";

export const WS_AUDIO_URL =
  import.meta.env.VITE_WS_AUDIO_URL ?? "wss://voice-text-ai.onrender.com/ws/audio";

export const AUDIO_CHUNK_INTERVAL_MS = 250;
export const WS_RECONNECT_ATTEMPTS = 10;
export const WS_RECONNECT_DELAY_MS = 1200;
export const WS_MAX_BACKOFF_MS = 10000;
export const WS_PING_INTERVAL_MS = 10000;
