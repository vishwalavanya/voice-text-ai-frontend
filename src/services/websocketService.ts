import {
  WS_AUDIO_URL,
  WS_MAX_BACKOFF_MS,
  WS_PING_INTERVAL_MS,
  WS_RECONNECT_ATTEMPTS,
  WS_RECONNECT_DELAY_MS
} from "../api/config";
import type { SocketIncomingEvent, SocketOutgoingControl } from "../api/websocket";
import { parseSocketMessage } from "../api/websocket";

interface WebSocketServiceOptions {
  url?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (errorMessage: string) => void;
  onReconnectAttempt?: (attempt: number) => void;
  onEvents?: (events: SocketIncomingEvent[]) => void;
  onRoundTripLatency?: (ms: number) => void;
}

export class VoiceWebSocketService {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private manuallyClosed = false;
  private reconnectAttempt = 0;
  private reconnectTimer: number | undefined;
  private heartbeatTimer: number | undefined;
  private heartbeatSentAt = 0;
  private options: WebSocketServiceOptions;

  constructor(options: WebSocketServiceOptions) {
    this.options = options;
    this.url = options.url ?? WS_AUDIO_URL;
  }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.manuallyClosed = false;
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = "arraybuffer";
    this.bindHandlers();
  }

  disconnect() {
    this.manuallyClosed = true;
    this.stopTimers();
    if (this.ws) {
      this.ws.close(1000, "Client closed connection");
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  sendAudioChunk(audioChunk: ArrayBuffer) {
    if (!this.isConnected() || !this.ws) return;
    this.ws.send(audioChunk);
  }

  sendControl(payload: SocketOutgoingControl) {
    if (!this.isConnected() || !this.ws) return;
    this.ws.send(JSON.stringify(payload));
  }

  private bindHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.options.onOpen?.();
      this.startHeartbeat();
      this.sendControl({ type: "client_ready", mode: "voice" });
    };

    this.ws.onmessage = async (event) => {
      if (typeof event.data === "string") {
        if (event.data === "pong") {
          if (this.heartbeatSentAt > 0) {
            const latency = Date.now() - this.heartbeatSentAt;
            this.options.onRoundTripLatency?.(latency);
          }
          return;
        }

        try {
          const parsed = JSON.parse(event.data) as Record<string, unknown>;
          if (parsed.type === "pong") {
            if (this.heartbeatSentAt > 0) {
              const latency = Date.now() - this.heartbeatSentAt;
              this.options.onRoundTripLatency?.(latency);
            }
            return;
          }
        } catch {
          // Non-JSON messages are handled by generic parser below.
        }
      }

      const events = await parseSocketMessage(event.data);
      if (events.length > 0) {
        this.options.onEvents?.(events);
      }
    };

    this.ws.onerror = () => {
      this.options.onError?.("WebSocket encountered a network error.");
    };

    this.ws.onclose = () => {
      this.options.onClose?.();
      this.stopTimers();
      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (!this.isConnected() || !this.ws) return;
      this.heartbeatSentAt = Date.now();
      this.ws.send(JSON.stringify({ type: "ping", timestamp: this.heartbeatSentAt }));
    }, WS_PING_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private stopTimers() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempt >= WS_RECONNECT_ATTEMPTS) {
      this.options.onError?.("Max reconnect attempts reached. Try reconnecting manually.");
      return;
    }

    this.reconnectAttempt += 1;
    this.options.onReconnectAttempt?.(this.reconnectAttempt);

    const nextDelay = Math.min(
      WS_RECONNECT_DELAY_MS * 2 ** (this.reconnectAttempt - 1),
      WS_MAX_BACKOFF_MS
    );

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, nextDelay);
  }
}
