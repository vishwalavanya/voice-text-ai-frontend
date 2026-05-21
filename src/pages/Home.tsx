import { AnimatePresence, motion } from "framer-motion";
import { Power, RotateCw, Stethoscope } from "lucide-react";
import { useEffect, useMemo } from "react";
import { fetchAppointments } from "../api/appointments";
import AppointmentCard from "../components/appointment/AppointmentCard";
import BookingStatus from "../components/appointment/BookingStatus";
import DoctorCard from "../components/appointment/DoctorCard";
import ChatWindow from "../components/chat/ChatWindow";
import LanguageIndicator from "../components/dashboard/LanguageIndicator";
import LatencyPanel from "../components/dashboard/LatencyPanel";
import SessionMemory from "../components/dashboard/SessionMemory";
import SystemStatus from "../components/dashboard/SystemStatus";
import AIWaveAnimation from "../components/voice/AIWaveAnimation";
import AudioVisualizer from "../components/voice/AudioVisualizer";
import MicrophoneButton from "../components/voice/MicrophoneButton";
import VoiceStatus from "../components/voice/VoiceStatus";
import { useVoiceStreaming } from "../hooks/useVoiceStreaming";
import { useAppointmentStore } from "../store/appointmentStore";
import { useSessionStore } from "../store/sessionStore";
import { useVoiceStore } from "../store/voiceStore";

const Home = () => {
  const {
    isSupported,
    isRecording,
    connectionStatus,
    toggleStreaming,
    disconnectSocket,
    stopStreaming
  } = useVoiceStreaming();

  const isAISpeaking = useVoiceStore((state) => state.isAISpeaking);
  const voicePhase = useVoiceStore((state) => state.voicePhase);
  const waveformBars = useVoiceStore((state) => state.waveformBars);
  const resetConversation = useVoiceStore((state) => state.resetConversation);

  const appointments = useAppointmentStore((state) => state.appointments);
  const activeAppointmentId = useAppointmentStore((state) => state.activeAppointmentId);
  const setActiveAppointmentId = useAppointmentStore((state) => state.setActiveAppointmentId);
  const setAppointments = useAppointmentStore((state) => state.setAppointments);

  const setSelectedDoctor = useSessionStore((state) => state.setSelectedDoctor);
  const setCurrentBookingState = useSessionStore((state) => state.setCurrentBookingState);
  const addMemoryLine = useSessionStore((state) => state.addMemoryLine);
  const resetMemory = useSessionStore((state) => state.resetMemory);

  useEffect(() => {
    const loadAppointments = async () => {
      const remoteAppointments = await fetchAppointments();
      if (remoteAppointments.length > 0) {
        setAppointments(remoteAppointments);
      }
    };
    void loadAppointments();
  }, [setAppointments]);

  const activeAppointment = useMemo(
    () => appointments.find((item) => item.id === activeAppointmentId),
    [activeAppointmentId, appointments]
  );

  useEffect(() => {
    if (!activeAppointment) return;
    setSelectedDoctor(activeAppointment.doctorName);
    setCurrentBookingState(activeAppointment.status);
  }, [activeAppointment, setCurrentBookingState, setSelectedDoctor]);

  const visualizerMode = isAISpeaking ? "ai" : isRecording ? "user" : "idle";

  const handleSessionReset = async () => {
    await stopStreaming();
    await disconnectSocket();
    resetConversation();
    resetMemory();
    addMemoryLine("Session manually reset.");
  };

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="noise-overlay" />

      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="title-font inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-cyan-100/75">
            <Stethoscope className="h-4 w-4" />
            Clinical Appointment Voice Desk
          </p>
          <h1 className="title-font mt-1 text-2xl font-semibold text-blue-50 sm:text-3xl">
            Real-Time Multilingual Voice Agent
          </h1>
          <p className="mt-1 text-sm text-blue-100/70">
            Streaming to `wss://voice-text-ai.onrender.com/ws/audio`
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSessionReset}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-300/30 bg-blue-400/10 px-3 py-2 text-sm text-blue-100 hover:bg-blue-400/20"
          >
            <RotateCw className="h-4 w-4" />
            Reset Session
          </button>
          <button
            type="button"
            onClick={() => void disconnectSocket()}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100 hover:bg-rose-400/20"
          >
            <Power className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      </motion.header>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-panel flex min-h-40 items-center justify-center rounded-2xl p-4">
              <MicrophoneButton
                isRecording={isRecording}
                disabled={!isSupported || connectionStatus === "error"}
                connectionStatus={connectionStatus}
                onToggle={() => void toggleStreaming()}
              />
            </div>
            <VoiceStatus
              phase={voicePhase}
              connectionStatus={connectionStatus}
              isRecording={isRecording}
              isAISpeaking={isAISpeaking}
            />
            <AIWaveAnimation active={isAISpeaking} />
          </div>

          <AudioVisualizer bars={waveformBars} mode={visualizerMode} />
          <ChatWindow />
        </section>

        <aside className="space-y-4 lg:col-span-4">
          <LanguageIndicator />
          <SystemStatus />
          <LatencyPanel />
          <SessionMemory />
          <DoctorCard activeAppointment={activeAppointment} />
          <BookingStatus appointments={appointments} />

          <div className="glass-panel rounded-2xl p-4">
            <p className="title-font mb-3 text-sm font-semibold text-blue-100">
              Appointment Timeline
            </p>
            <div className="scroll-skin max-h-80 space-y-2 overflow-y-auto pr-1">
              <AnimatePresence>
                {appointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                  >
                    <AppointmentCard
                      appointment={appointment}
                      active={appointment.id === activeAppointmentId}
                      onClick={() => {
                        setActiveAppointmentId(appointment.id);
                        addMemoryLine(`Appointment ${appointment.id} opened.`);
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Home;
