import type { Appointment } from "../store/appointmentStore";
import type { SupportedLanguage, VoicePhase } from "../store/voiceStore";

export interface SessionSnapshotPayload {
  currentIntent?: string;
  selectedDoctor?: string;
  preferredLanguage?: SupportedLanguage;
  currentBookingState?: string;
  memoryLog?: string[];
}

export interface LatencyPayload {
  stt?: number;
  llm?: number;
  tts?: number;
  total?: number;
}

export type SocketIncomingEvent =
  | {
      kind: "user_transcript";
      text: string;
      interim: boolean;
      language?: SupportedLanguage;
    }
  | {
      kind: "assistant_text";
      text: string;
      interim: boolean;
      language?: SupportedLanguage;
    }
  | {
      kind: "assistant_audio";
      audioBuffer: ArrayBuffer;
      mimeType: string;
    }
  | {
      kind: "latency";
      metrics: LatencyPayload;
    }
  | {
      kind: "session";
      snapshot: SessionSnapshotPayload;
    }
  | {
      kind: "appointment";
      appointment: Partial<Appointment>;
    }
  | {
      kind: "phase";
      phase: VoicePhase;
    }
  | {
      kind: "language";
      language: SupportedLanguage;
    }
  | {
      kind: "error";
      message: string;
    };

export interface SocketOutgoingControl {
  type: string;
  [key: string]: unknown;
}

const languageMap: Record<string, SupportedLanguage> = {
  en: "English",
  english: "English",
  hi: "Hindi",
  hindi: "Hindi",
  ta: "Tamil",
  tamil: "Tamil"
};

const toLanguage = (value: unknown): SupportedLanguage | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  return languageMap[value.toLowerCase().trim()];
};

const toVoicePhase = (value: unknown): VoicePhase | null => {
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value.toLowerCase().trim();
  if (cleaned === "listening") return "listening";
  if (cleaned === "processing") return "processing";
  if (cleaned === "speaking") return "speaking";
  if (cleaned === "idle") return "idle";
  return null;
};

const toLatency = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const normalized = base64.includes(",") ? base64.split(",").pop() ?? base64 : base64;
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const parseTextPayload = (payload: Record<string, unknown>): SocketIncomingEvent[] => {
  const events: SocketIncomingEvent[] = [];
  const type = typeof payload.type === "string" ? payload.type.toLowerCase() : "";
  const speaker =
    typeof payload.speaker === "string"
      ? payload.speaker.toLowerCase()
      : typeof payload.role === "string"
        ? payload.role.toLowerCase()
        : "";
  const language = toLanguage(payload.language ?? payload.detected_language ?? payload.lang);
  const phase = toVoicePhase(payload.phase ?? payload.status ?? payload.state);

  if (phase) {
    events.push({ kind: "phase", phase });
  }

  if (language) {
    events.push({ kind: "language", language });
  }

  if (type.includes("error") && typeof payload.message === "string") {
    events.push({ kind: "error", message: payload.message });
  }

  const userTranscript =
    payload.user_transcript ??
    (speaker === "assistant" || speaker === "ai" ? undefined : payload.transcript) ??
    payload.userText ??
    (type.includes("transcript") && speaker !== "assistant" && speaker !== "ai"
      ? payload.text
      : undefined);

  if (typeof userTranscript === "string" && userTranscript.trim()) {
    events.push({
      kind: "user_transcript",
      text: userTranscript,
      interim: !Boolean(payload.final ?? payload.is_final),
      language
    });
  }

  const assistantText =
    payload.ai_response ??
    payload.assistant_response ??
    ((speaker === "assistant" || speaker === "ai") && typeof payload.transcript === "string"
      ? payload.transcript
      : undefined) ??
    payload.response ??
    payload.reply ??
    (type.includes("assistant") || type.includes("response") ? payload.text : undefined);

  if (typeof assistantText === "string" && assistantText.trim()) {
    events.push({
      kind: "assistant_text",
      text: assistantText,
      interim: !Boolean(payload.final ?? payload.is_final),
      language
    });
  }

  const audioPayload =
    payload.audio ??
    payload.audio_base64 ??
    payload.audioChunk ??
    payload.tts_audio ??
    payload.voice;

  if (typeof audioPayload === "string" && audioPayload.trim()) {
    events.push({
      kind: "assistant_audio",
      audioBuffer: base64ToArrayBuffer(audioPayload),
      mimeType: typeof payload.mime_type === "string" ? payload.mime_type : "audio/wav"
    });
  }

  const latencyObject = (payload.latency ??
    payload.latencies ??
    payload.metrics ??
    null) as Record<string, unknown> | null;

  const stt = toLatency(payload.stt_latency ?? latencyObject?.stt);
  const llm = toLatency(payload.llm_latency ?? latencyObject?.llm);
  const tts = toLatency(payload.tts_latency ?? latencyObject?.tts);
  const total = toLatency(payload.total_latency ?? latencyObject?.total);

  if (stt !== undefined || llm !== undefined || tts !== undefined || total !== undefined) {
    events.push({
      kind: "latency",
      metrics: { stt, llm, tts, total }
    });
  }

  const snapshot = payload.session_memory ?? payload.memory ?? payload.session;
  if (snapshot && typeof snapshot === "object") {
    const sessionLike = snapshot as Record<string, unknown>;
    events.push({
      kind: "session",
      snapshot: {
        currentIntent:
          typeof sessionLike.currentIntent === "string"
            ? sessionLike.currentIntent
            : typeof sessionLike.intent === "string"
              ? sessionLike.intent
              : undefined,
        selectedDoctor:
          typeof sessionLike.selectedDoctor === "string"
            ? sessionLike.selectedDoctor
            : typeof sessionLike.doctor === "string"
              ? sessionLike.doctor
              : undefined,
        preferredLanguage: toLanguage(
          sessionLike.preferredLanguage ?? sessionLike.language ?? sessionLike.lang
        ),
        currentBookingState:
          typeof sessionLike.currentBookingState === "string"
            ? sessionLike.currentBookingState
            : typeof sessionLike.bookingState === "string"
              ? sessionLike.bookingState
              : undefined,
        memoryLog: Array.isArray(sessionLike.memoryLog)
          ? sessionLike.memoryLog.filter((item): item is string => typeof item === "string")
          : undefined
      }
    });
  }

  const appointment = payload.appointment ?? payload.booking;
  if (appointment && typeof appointment === "object") {
    events.push({
      kind: "appointment",
      appointment: appointment as Partial<Appointment>
    });
  }

  return events;
};

export const parseSocketMessage = async (data: unknown): Promise<SocketIncomingEvent[]> => {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .flatMap((item) => parseTextPayload(item));
      }

      if (parsed && typeof parsed === "object") {
        return parseTextPayload(parsed as Record<string, unknown>);
      }
    } catch {
      if (data.trim()) {
        return [
          {
            kind: "assistant_text",
            text: data,
            interim: false
          }
        ];
      }
    }
    return [];
  }

  if (data instanceof Blob) {
    const arrayBuffer = await data.arrayBuffer();
    return [
      {
        kind: "assistant_audio",
        audioBuffer: arrayBuffer,
        mimeType: data.type || "audio/wav"
      }
    ];
  }

  if (data instanceof ArrayBuffer) {
    return [
      {
        kind: "assistant_audio",
        audioBuffer: data,
        mimeType: "audio/wav"
      }
    ];
  }

  return [];
};
