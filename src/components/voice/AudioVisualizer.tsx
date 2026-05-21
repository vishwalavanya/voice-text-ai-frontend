import { motion } from "framer-motion";

interface AudioVisualizerProps {
  bars: number[];
  mode: "idle" | "user" | "ai";
}

const modeStyles: Record<AudioVisualizerProps["mode"], string> = {
  idle: "from-blue-300/20 via-blue-400/35 to-cyan-300/30",
  user: "from-cyan-300/65 via-teal-300/80 to-emerald-300/75",
  ai: "from-blue-300/65 via-indigo-300/75 to-cyan-300/75"
};

const AudioVisualizer = ({ bars, mode }: AudioVisualizerProps) => (
  <div className="glass-panel relative w-full overflow-hidden rounded-2xl p-4">
    <div className="mb-3 flex items-center justify-between">
      <p className="title-font text-sm font-semibold text-blue-100/90">Live Audio Signal</p>
      <p className="text-xs uppercase tracking-[0.18em] text-blue-100/60">{mode}</p>
    </div>

    <div className="flex h-20 items-end gap-1.5">
      {bars.map((bar, index) => (
        <motion.div
          key={`wave-${index}`}
          className={`h-full w-full origin-bottom rounded-full bg-gradient-to-b ${modeStyles[mode]}`}
          initial={{ scaleY: 0.12 }}
          animate={{
            scaleY: Math.max(0.12, bar),
            opacity: mode === "idle" ? 0.3 : 0.9
          }}
          transition={{
            duration: 0.15,
            ease: "easeOut",
            delay: index * 0.006
          }}
        />
      ))}
    </div>
  </div>
);

export default AudioVisualizer;
