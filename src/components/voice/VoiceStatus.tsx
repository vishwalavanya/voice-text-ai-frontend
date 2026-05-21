import { motion } from "framer-motion";
import { Bot, Ear, LoaderCircle, Mic, Volume2 } from "lucide-react";
import type { ConnectionStatus, VoicePhase } from "../../store/voiceStore";

interface VoiceStatusProps {
  phase: VoicePhase;
  connectionStatus: ConnectionStatus;
  isRecording: boolean;
  isAISpeaking: boolean;
}

const phaseMeta: Record<
  VoicePhase,
  { label: string; icon: typeof Mic; color: string; ring: string; description: string }
> = {
  idle: {
    label: "Idle",
    icon: Bot,
    color: "text-blue-100/80",
    ring: "ring-blue-400/20",
    description: "Waiting for the next patient request."
  },
  listening: {
    label: "Listening",
    icon: Ear,
    color: "text-cyan-200",
    ring: "ring-cyan-300/35",
    description: "Realtime speech capture is active."
  },
  processing: {
    label: "Processing",
    icon: LoaderCircle,
    color: "text-amber-200",
    ring: "ring-amber-300/30",
    description: "STT + LLM pipeline is working."
  },
  speaking: {
    label: "Speaking",
    icon: Volume2,
    color: "text-emerald-200",
    ring: "ring-emerald-300/35",
    description: "AI voice response playback in progress."
  }
};

const connectionCopy: Record<ConnectionStatus, { label: string; tone: string }> = {
  connected: { label: "Connected", tone: "text-emerald-300" },
  connecting: { label: "Connecting", tone: "text-blue-300" },
  reconnecting: { label: "Reconnecting", tone: "text-amber-300" },
  disconnected: { label: "Disconnected", tone: "text-rose-300" },
  error: { label: "Connection Error", tone: "text-rose-300" }
};

const VoiceStatus = ({ phase, connectionStatus, isRecording, isAISpeaking }: VoiceStatusProps) => {
  const current = phaseMeta[phase];
  const Icon = current.icon;

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${current.ring} bg-white/5`}
            animate={phase === "processing" ? { rotate: 360 } : { rotate: 0 }}
            transition={
              phase === "processing"
                ? { repeat: Number.POSITIVE_INFINITY, duration: 1.4, ease: "linear" }
                : { duration: 0.4 }
            }
          >
            <Icon className={`h-5 w-5 ${current.color}`} />
          </motion.div>
          <div>
            <p className="title-font text-sm font-semibold text-blue-50">{current.label}</p>
            <p className="text-xs text-blue-100/65">{current.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xs font-medium ${connectionCopy[connectionStatus].tone}`}>
            {connectionCopy[connectionStatus].label}
          </p>
          <p className="text-[11px] text-blue-100/55">
            {isRecording ? "Mic open" : "Mic muted"} · {isAISpeaking ? "AI talking" : "AI silent"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-2 text-cyan-100/90">
          Listening: {isRecording ? "On" : "Off"}
        </div>
        <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-2 text-blue-100/90">
          Speaking: {isAISpeaking ? "On" : "Off"}
        </div>
      </div>
    </div>
  );
};

export default VoiceStatus;
