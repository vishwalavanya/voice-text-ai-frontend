import { motion } from "framer-motion";

interface AIWaveAnimationProps {
  active: boolean;
}

const rings = [0, 1, 2, 3];

const AIWaveAnimation = ({ active }: AIWaveAnimationProps) => (
  <div className="glass-panel relative flex min-h-36 items-center justify-center overflow-hidden rounded-2xl">
    <div className="relative h-20 w-20">
      {rings.map((ring) => (
        <motion.span
          key={ring}
          className="absolute inset-0 rounded-full border border-cyan-300/40"
          animate={
            active
              ? {
                  scale: [0.6, 1.45],
                  opacity: [0.55, 0]
                }
              : {
                  scale: 0.95,
                  opacity: 0.2
                }
          }
          transition={
            active
              ? {
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2.1,
                  delay: ring * 0.3,
                  ease: "easeOut"
                }
              : { duration: 0.4 }
          }
        />
      ))}
      <motion.div
        className="absolute inset-0 grid place-items-center rounded-full border border-cyan-200/50 bg-cyan-300/15 shadow-glow"
        animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={
          active
            ? { repeat: Number.POSITIVE_INFINITY, duration: 1.6, ease: "easeInOut" }
            : { duration: 0.35 }
        }
      >
        <span className="title-font text-[11px] uppercase tracking-[0.2em] text-cyan-100">
          {active ? "AI Live" : "Standby"}
        </span>
      </motion.div>
    </div>
  </div>
);

export default AIWaveAnimation;
