import { motion } from "framer-motion";
import { Mic, MicOff, PlugZap } from "lucide-react";
import type { ConnectionStatus } from "../../store/voiceStore";

interface MicrophoneButtonProps {
  isRecording: boolean;
  disabled?: boolean;
  connectionStatus: ConnectionStatus;
  onToggle: () => void | Promise<void>;
}

const statusCopy: Record<ConnectionStatus, string> = {
  connected: "Live",
  connecting: "Connecting",
  disconnected: "Offline",
  reconnecting: "Reconnecting",
  error: "Error"
};

const MicrophoneButton = ({
  isRecording,
  disabled,
  connectionStatus,
  onToggle
}: MicrophoneButtonProps) => (
  <div className="flex flex-col items-center gap-3">
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`relative grid h-24 w-24 place-items-center rounded-full border transition duration-300 ${
        isRecording
          ? "border-pulse-cyan bg-cyan-400/20 shadow-glow"
          : "border-blue-300/25 bg-white/5 hover:border-pulse-blue/70 hover:bg-blue-400/10"
      } ${disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
      whileTap={{ scale: 0.92 }}
      animate={
        isRecording
          ? {
              boxShadow: [
                "0 0 0 0 rgba(18,214,223,0.25)",
                "0 0 0 18px rgba(18,214,223,0.00)"
              ]
            }
          : { boxShadow: "0 0 0 0 rgba(18,214,223,0)" }
      }
      transition={
        isRecording
          ? { repeat: Number.POSITIVE_INFINITY, duration: 1.8, ease: "easeInOut" }
          : { duration: 0.25 }
      }
    >
      {isRecording ? (
        <Mic className="h-9 w-9 text-cyan-100" />
      ) : (
        <MicOff className="h-9 w-9 text-blue-100/90" />
      )}
      <span className="sr-only">{isRecording ? "Stop microphone" : "Start microphone"}</span>
    </motion.button>

    <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs">
      <PlugZap className="h-3.5 w-3.5 text-blue-200" />
      <span className="text-blue-100/90">{statusCopy[connectionStatus]}</span>
    </div>
  </div>
);

export default MicrophoneButton;
