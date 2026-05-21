import { Activity, Gauge } from "lucide-react";
import { useVoiceStore } from "../../store/voiceStore";

const metricRows = [
  { key: "stt", label: "STT", color: "bg-cyan-300/85" },
  { key: "llm", label: "LLM", color: "bg-blue-300/85" },
  { key: "tts", label: "TTS", color: "bg-emerald-300/85" },
  { key: "total", label: "TOTAL", color: "bg-amber-300/90" }
] as const;

const getBarWidth = (value: number) => {
  if (!value || value < 0) return 6;
  return Math.min(100, Math.max(6, (value / 2000) * 100));
};

const LatencyPanel = () => {
  const latency = useVoiceStore((state) => state.latency);
  const websocketRoundTripMs = useVoiceStore((state) => state.websocketRoundTripMs);

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-amber-200" />
          <p className="title-font text-sm font-semibold text-blue-100">Latency Metrics</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-blue-300/20 bg-blue-400/10 px-2 py-1 text-[11px] text-blue-100/80">
          <Activity className="h-3 w-3" />
          WS RTT: {Math.round(websocketRoundTripMs)}ms
        </div>
      </div>

      <div className="space-y-2">
        {metricRows.map((metric) => {
          const value = latency[metric.key];
          return (
            <div key={metric.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-blue-100/80">
                <span>{metric.label}</span>
                <span>{Math.round(value)} ms</span>
              </div>
              <div className="h-2 rounded-full bg-blue-200/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${metric.color}`}
                  style={{ width: `${getBarWidth(value)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LatencyPanel;
