import { useCallback, useEffect, useRef } from "react";
import type { SocketOutgoingControl } from "../api/websocket";
import { runReceptionistTurn, shouldRunReceptionistFallback } from "../services/appointmentAgent";
import { VoiceWebSocketService } from "../services/websocketService";
import { useAppointmentStore } from "../store/appointmentStore";
import { useSessionStore } from "../store/sessionStore";
import { useVoiceStore } from "../store/voiceStore";

interface UseWebSocketOptions {
  onAssistantAudioChunk?: (
    audioBuffer: ArrayBuffer,
    mimeType: string
  ) => void;
}

export const useWebSocket = (
  { onAssistantAudioChunk }: UseWebSocketOptions = {}
) => {

  const serviceRef = useRef<VoiceWebSocketService | null>(null);

  const sentMimeRef = useRef<string | null>(null);

  const pendingAudioRef = useRef<
    Array<{
      chunk: ArrayBuffer;
      mimeType: string;
    }>
  >([]);

  const setConnectionStatus = useVoiceStore(
    (state) => state.setConnectionStatus
  );

  const setErrorMessage = useVoiceStore(
    (state) => state.setErrorMessage
  );

  const setReconnectAttempts = useVoiceStore(
    (state) => state.setReconnectAttempts
  );

  const setWebsocketRoundTrip = useVoiceStore(
    (state) => state.setWebsocketRoundTrip
  );

  const setVoicePhase = useVoiceStore(
    (state) => state.setVoicePhase
  );

  const setCurrentUserInterim = useVoiceStore(
    (state) => state.setCurrentUserInterim
  );

  const setCurrentAIInterim = useVoiceStore(
    (state) => state.setCurrentAIInterim
  );

  const setCurrentTranscript = useVoiceStore(
    (state) => state.setCurrentTranscript
  );

  const setCurrentAIResponse = useVoiceStore(
    (state) => state.setCurrentAIResponse
  );

  const markBackendTranscript = useVoiceStore(
    (state) => state.markBackendTranscript
  );

  const markBackendAssistant = useVoiceStore(
    (state) => state.markBackendAssistant
  );

  const setLatency = useVoiceStore(
    (state) => state.setLatency
  );

  const addMessage = useVoiceStore(
    (state) => state.addMessage
  );

  const setLanguage = useVoiceStore(
    (state) => state.setLanguage
  );

  const upsertAppointment = useAppointmentStore(
    (state) => state.upsertAppointment
  );

  const addMemoryLine = useSessionStore(
    (state) => state.addMemoryLine
  );

  const applySessionSnapshot = useSessionStore(
    (state) => state.applySessionSnapshot
  );

  const setPreferredLanguage = useSessionStore(
    (state) => state.setPreferredLanguage
  );

  const connect = useCallback(() => {

    setConnectionStatus("connecting");
    setErrorMessage(null);

    if (!serviceRef.current) {

      serviceRef.current = new VoiceWebSocketService({

        onOpen: () => {

          setConnectionStatus("connected");
          setReconnectAttempts(0);

          sentMimeRef.current = null;

          if (pendingAudioRef.current.length > 0) {

            for (const pending of pendingAudioRef.current) {

              if (sentMimeRef.current !== pending.mimeType) {

                sentMimeRef.current = pending.mimeType;

                serviceRef.current?.sendControl({
                  type: "audio_format",
                  mime_type: pending.mimeType
                });
              }

              serviceRef.current?.sendAudioChunk(
                pending.chunk
              );
            }

            pendingAudioRef.current = [];
          }

          addMemoryLine("Voice socket connected.");
        },

        onClose: () => {

          setConnectionStatus("disconnected");
          setVoicePhase("idle");

          addMemoryLine("Voice socket disconnected.");
        },

        onError: (message) => {

          setErrorMessage(message);
          setConnectionStatus("error");
        },

        onRoundTripLatency: (ms) => {

          setWebsocketRoundTrip(ms);
        },

        onReconnectAttempt: (attempt) => {

          setConnectionStatus("reconnecting");
          setReconnectAttempts(attempt);
        },

        onEvents: async (events) => {

          for (const event of events) {

            switch (event.kind) {

              case "user_transcript": {

                markBackendTranscript();

                setCurrentTranscript(event.text);

                if (event.language) {

                  setLanguage(event.language);

                  setPreferredLanguage(
                    event.language
                  );
                }

                if (event.interim) {

                  setCurrentUserInterim(event.text);

                } else {

                  setCurrentUserInterim("");

                  addMessage({
                    role: "user",
                    text: event.text,
                    language: event.language
                  });

                  // Receptionist fallback
                  if (
                    shouldRunReceptionistFallback(
                      event.text
                    )
                  ) {

                    const fallbackResponse =
                      await runReceptionistTurn(
                        event.text
                      );

                    addMessage({
                      role: "assistant",
                      text: fallbackResponse,
                      language: event.language
                    });

                    setCurrentAIResponse(
                      fallbackResponse
                    );
                  }
                }

                break;
              }

              case "assistant_text": {

                markBackendAssistant();

                setCurrentAIResponse(event.text);

                if (event.language) {

                  setLanguage(event.language);

                  setPreferredLanguage(
                    event.language
                  );
                }

                if (event.interim) {

                  setCurrentAIInterim(event.text);

                } else {

                  setCurrentAIInterim("");

                  addMessage({
                    role: "assistant",
                    text: event.text,
                    language: event.language
                  });
                }

                break;
              }

              case "assistant_audio":

                onAssistantAudioChunk?.(
                  event.audioBuffer,
                  event.mimeType
                );

                break;

              case "latency":

                setLatency(event.metrics);

                break;

              case "appointment":

                upsertAppointment({
                  id:
                    event.appointment.id ??
                    `APT-${Math.floor(
                      Math.random() * 10000
                    )}`,

                  patientName:
                    event.appointment.patientName ??
                    "Voice Session Patient",

                  doctorName:
                    event.appointment.doctorName ??
                    "Doctor pending",

                  dateTime:
                    event.appointment.dateTime ??
                    new Date().toISOString(),

                  reason:
                    event.appointment.reason ??
                    "General check-up",

                  language:
                    event.appointment.language ??
                    "English",

                  status:
                    event.appointment.status ??
                    "pending",

                  notes:
                    event.appointment.notes
                });

                break;

              case "session":

                applySessionSnapshot(
                  event.snapshot
                );

                if (
                  event.snapshot.currentIntent
                ) {

                  addMemoryLine(
                    `Intent: ${event.snapshot.currentIntent}`
                  );
                }

                break;

              case "phase":

                setVoicePhase(event.phase);

                break;

              case "language":

                setLanguage(event.language);

                setPreferredLanguage(
                  event.language
                );

                break;

              case "error":

                setErrorMessage(event.message);

                break;

              default:
                break;
            }
          }
        }
      });
    }

    serviceRef.current.connect();

  }, [
    addMemoryLine,
    addMessage,
    applySessionSnapshot,
    onAssistantAudioChunk,
    setConnectionStatus,
    setCurrentAIInterim,
    setCurrentAIResponse,
    setCurrentTranscript,
    setCurrentUserInterim,
    setErrorMessage,
    setLanguage,
    setLatency,
    markBackendTranscript,
    markBackendAssistant,
    setPreferredLanguage,
    setReconnectAttempts,
    setVoicePhase,
    setWebsocketRoundTrip,
    upsertAppointment
  ]);

  const disconnect = useCallback(() => {

    serviceRef.current?.disconnect();

    pendingAudioRef.current = [];

    sentMimeRef.current = null;

    setConnectionStatus("disconnected");

    setReconnectAttempts(0);

    setVoicePhase("idle");

  }, [
    setConnectionStatus,
    setReconnectAttempts,
    setVoicePhase
  ]);

  const sendAudioChunk = useCallback(
    (
      audioChunk: ArrayBuffer,
      mimeType: string
    ) => {

      if (!serviceRef.current?.isConnected()) {

        pendingAudioRef.current = [
          ...pendingAudioRef.current,
          {
            chunk: audioChunk,
            mimeType
          }
        ].slice(-16);

        return;
      }

      if (sentMimeRef.current !== mimeType) {

        sentMimeRef.current = mimeType;

        serviceRef.current?.sendControl({
          type: "audio_format",
          mime_type: mimeType
        });
      }

      serviceRef.current?.sendAudioChunk(
        audioChunk
      );

    },
    []
  );

  const sendControl = useCallback(
    (payload: SocketOutgoingControl) => {

      serviceRef.current?.sendControl(
        payload
      );

    },
    []
  );

  useEffect(() => {

    return () => {
      serviceRef.current?.disconnect();
    };

  }, []);

  return {
    connect,
    disconnect,
    sendAudioChunk,
    sendControl,
    isConnected: () =>
      serviceRef.current?.isConnected() ?? false
  };
};