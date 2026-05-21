import { useCallback, useEffect, useRef } from "react";
import { useAudioPlayer } from "./useAudioPlayer";
import { useBrowserSpeech } from "./useBrowserSpeech";
import { useMicrophone } from "./useMicrophone";
import { useWebSocket } from "./useWebSocket";
import { runReceptionistTurn, shouldRunReceptionistFallback } from "../services/appointmentAgent";
import { useSessionStore } from "../store/sessionStore";
import { useVoiceStore } from "../store/voiceStore";

// ============================================================
// SESSION ID PERSISTENCE (CRITICAL FIX)
// ============================================================

const SESSION_ID_KEY = 'voice_agent_session_id';

/**
 * Get or create a persistent session ID.
 * Checks localStorage for existing session_id.
 * If expired/missing, generates new one.
 */
function getPersistentSessionId(): string {
  // Try to get from localStorage
  const stored = localStorage.getItem(SESSION_ID_KEY);
  
  if (stored && stored.trim()) {
    console.log('[SessionID] Using existing session from localStorage:', stored);
    return stored;
  }
  
  // Generate new if missing
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(SESSION_ID_KEY, newSessionId);
  console.log('[SessionID] Generated new session:', newSessionId);
  
  return newSessionId;
}

/**
 * Clear session (user explicitly starts new booking)
 */
function clearSessionId(): void {
  localStorage.removeItem(SESSION_ID_KEY);
  console.log('[SessionID] Session cleared from localStorage');
}

/**
 * Get current session ID without generating new one
 */
function getCurrentSessionId(): string | null {
  return localStorage.getItem(SESSION_ID_KEY);
}

// ============================================================
// HOOK: useVoiceStreaming (with session persistence)
// ============================================================

export const useVoiceStreaming = () => {
  // Session ID ref (for consistent use throughout component lifecycle)
  const sessionIdRef = useRef<string>(getPersistentSessionId());

  // Voice store selectors
  const setErrorMessage = useVoiceStore((state) => state.setErrorMessage);
  const isRecording = useVoiceStore((state) => state.isRecording);
  const connectionStatus = useVoiceStore((state) => state.connectionStatus);
  const setVoicePhase = useVoiceStore((state) => state.setVoicePhase);
  const activeLanguage = useVoiceStore((state) => state.activeLanguage);
  const setCurrentUserInterim = useVoiceStore((state) => state.setCurrentUserInterim);
  const setCurrentTranscript = useVoiceStore((state) => state.setCurrentTranscript);
  const addMessage = useVoiceStore((state) => state.addMessage);
  const addMemoryLine = useSessionStore((state) => state.addMemoryLine);

  // Audio and microphone
  const { enqueueAudio, clearAudioQueue } = useAudioPlayer();

  // ============================================================
  // WebSocket with Session ID
  // ============================================================
  
  const { connect, disconnect, sendAudioChunk, isConnected } = useWebSocket({
    sessionId: sessionIdRef.current, // Pass session ID to WebSocket
    onAssistantAudioChunk: (audioBuffer, mimeType) => {
      enqueueAudio(audioBuffer, mimeType);
    },
    onSessionStarted: (receivedSessionId: string) => {
      // If backend sends different session_id, update our storage
      console.log('[WebSocket] Session started | backend_session_id:', receivedSessionId);
      if (receivedSessionId && receivedSessionId !== sessionIdRef.current) {
        console.log('[SessionID] Updating session ID from backend:', receivedSessionId);
        localStorage.setItem(SESSION_ID_KEY, receivedSessionId);
        sessionIdRef.current = receivedSessionId;
      }
    },
  });

  const { start, stop, isSupported } = useMicrophone({
    onAudioChunk: (audioChunk, mimeType) => {
      sendAudioChunk(audioChunk, mimeType);
    },
    onError: (errorMessage) => {
      setErrorMessage(errorMessage);
    }
  });

  // ============================================================
  // Browser Speech Fallback
  // ============================================================

  const handleBrowserFinal = useCallback(
    (text: string) => {
      const transcript = text.trim();
      if (!transcript) return;

      const { lastBackendTranscriptAt } = useVoiceStore.getState();
      const backendAlreadyResponding = Date.now() - lastBackendTranscriptAt < 2500;
      if (backendAlreadyResponding) return;

      setCurrentTranscript(transcript);
      setCurrentUserInterim("");
      addMessage({
        role: "user",
        text: transcript,
        language: activeLanguage
      });
      addMemoryLine(`Browser transcript fallback: ${transcript}`);
      if (shouldRunReceptionistFallback()) {
        void runReceptionistTurn(transcript, activeLanguage);
      }
    },
    [activeLanguage, addMemoryLine, addMessage, setCurrentTranscript, setCurrentUserInterim]
  );

  useBrowserSpeech({
    enabled: isRecording,
    language: activeLanguage,
    onInterim: setCurrentUserInterim,
    onFinal: handleBrowserFinal
  });

  // ============================================================
  // Streaming Control
  // ============================================================

  const startStreaming = useCallback(async () => {
    console.log('[VoiceStreaming] Starting with session_id:', sessionIdRef.current);
    connect();
    await start();
  }, [connect, start]);

  const stopStreaming = useCallback(async () => {
    console.log('[VoiceStreaming] Stopping');
    await stop();
    clearAudioQueue();
    setVoicePhase("idle");
  }, [clearAudioQueue, setVoicePhase, stop]);

  const toggleStreaming = useCallback(async () => {
    if (isRecording) {
      await stopStreaming();
    } else {
      await startStreaming();
    }
  }, [isRecording, startStreaming, stopStreaming]);

  const disconnectSocket = useCallback(async () => {
    console.log('[VoiceStreaming] Disconnecting socket');
    await stop();
    disconnect();
  }, [disconnect, stop]);

  // ============================================================
  // Session Management
  // ============================================================

  /**
   * Reset session (for "new booking" trigger)
   * Clears localStorage and generates new session_id
   */
  const resetSession = useCallback((): void => {
    clearSessionId();
    const newSessionId = getPersistentSessionId();
    sessionIdRef.current = newSessionId;
    
    // Disconnect and reconnect with new session
    disconnectSocket().then(() => {
      console.log('[Session] Reset complete | new_session_id:', newSessionId);
    });
  }, [disconnectSocket]);

  /**
   * Get current session ID
   */
  const getSessionId = useCallback((): string => {
    return sessionIdRef.current;
  }, []);

  /**
   * Get session status for debugging
   */
  const getSessionStatus = useCallback((): {
    sessionId: string;
    stored: string | null;
    isConnected: boolean;
  } => {
    return {
      sessionId: sessionIdRef.current,
      stored: getCurrentSessionId(),
      isConnected: isConnected(),
    };
  }, [isConnected]);

  // ============================================================
  // Session Persistence Check (on mount and when tab becomes visible)
  // ============================================================

  useEffect(() => {
    // Check if session_id changed (e.g., in another tab)
    const storedSessionId = getCurrentSessionId();
    if (storedSessionId && storedSessionId !== sessionIdRef.current) {
      console.log('[SessionID] Session ID changed in another context | updating:', storedSessionId);
      sessionIdRef.current = storedSessionId;
    }

    // Handle visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[VoiceStreaming] Tab hidden');
      } else {
        console.log('[VoiceStreaming] Tab visible | current session:', sessionIdRef.current);
        // Session is automatically resumed via WebSocket reconnection
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ============================================================
  // Return Public Interface
  // ============================================================

  return {
    // Voice control
    isSupported,
    isRecording,
    connectionStatus,
    isConnected: isConnected(),
    
    // Streaming control
    startStreaming,
    stopStreaming,
    toggleStreaming,
    disconnectSocket,
    
    // Session management (NEW)
    sessionId: sessionIdRef.current,
    resetSession,
    getSessionId,
    getSessionStatus,
  };
};