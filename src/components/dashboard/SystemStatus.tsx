import { Cpu, Wifi, WifiOff } from "lucide-react";
import { useVoiceStore } from "../../store/voiceStore";

const SystemStatus = () => {
  const connectionStatus = useVoiceStore((state) => state.connectionStatus);
  const voicePhase = useVoiceStore((state) => state.voicePhase);
  const reconnectAttempts = useVoiceStore((state) => state.reconnectAttempts);
  const errorMessage = useVoiceStore((state) => state.errorMessage);

  const isConnected = connectionStatus === "connected";

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Cpu className="h-4 w-4 text-blue-200" />
        <p className="title-font text-sm font-semibold text-blue-100">System Status</p>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between rounded-xl border border-blue-300/20 bg-blue-400/10 p-2">
          <span className="text-blue-100/70">Connection</span>
          <span className={`inline-flex items-center gap-1 ${isConnected ? "text-emerald-300" : "text-rose-300"}`}>
            {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {connectionStatus}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-blue-300/20 bg-blue-400/10 p-2">
          <span className="text-blue-100/70">Agent Phase</span>
          <span className="text-blue-100">{voicePhase}</span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-blue-300/20 bg-blue-400/10 p-2">
          <span className="text-blue-100/70">Reconnect Attempts</span>
          <span className="text-blue-100">{reconnectAttempts}</span>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-300/30 bg-rose-400/15 p-2 text-rose-100">
            {errorMessage}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-2 text-emerald-100/90">
            No active errors.
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemStatus;
