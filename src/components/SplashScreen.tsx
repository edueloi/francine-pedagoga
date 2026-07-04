import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

// Seeds flying away from the dandelion head — each with its own trajectory/delay.
const SEEDS = [
  { path: "M 100 150 Q 80 120 65 100", cx: 65, cy: 100, r: 8, color: "#1070ca", delay: 0.5 },
  { path: "M 115 130 Q 95 95 80 70", cx: 80, cy: 70, r: 8, color: "#d43f72", delay: 0.65 },
  { path: "M 140 135 Q 135 90 130 60", cx: 130, cy: 60, r: 7, color: "#1070ca", delay: 0.55 },
  { path: "M 160 155 Q 180 120 195 90", cx: 195, cy: 90, r: 9, color: "#d43f72", delay: 0.7 },
  { path: "M 75 180 Q 45 160 25 145", cx: 25, cy: 145, r: 7, color: "#1070ca", delay: 0.6 },
  { path: "M 85 230 Q 55 235 30 240", cx: 30, cy: 240, r: 8, color: "#d43f72", delay: 0.75 },
];

export default function SplashScreen({ onFinish, durationMs = 2600 }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, durationMs);
    return () => clearTimeout(timer);
  }, [onFinish, durationMs]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[200] bg-[#fcfbfa] flex flex-col items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.svg
          viewBox="0 0 260 380"
          className="h-40 w-40 sm:h-52 sm:w-52"
          initial="hidden"
          animate="visible"
        >
          <circle cx="140" cy="190" r="130" fill="#ffffff" />

          {/* Stem grows in */}
          <motion.path
            d="M 130 210 Q 155 285 175 315"
            stroke="#1e293b"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          <motion.circle
            cx="130"
            cy="210"
            r="9.5"
            fill="#1e293b"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          />

          {/* Seed ray lines fan out from the center */}
          {[
            [90, 190], [85, 215], [95, 240], [115, 255], [140, 260],
            [170, 230], [175, 205], [165, 180], [145, 160], [115, 165],
          ].map(([x, y], i) => (
            <motion.line
              key={i}
              x1="130"
              y1="210"
              x2={x}
              y2={y}
              stroke="#1e293b"
              strokeWidth="2"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              transition={{ delay: 0.3 + i * 0.02, duration: 0.25 }}
            />
          ))}

          {/* Fluff rings pulse in */}
          <motion.circle
            cx="130"
            cy="210"
            r="40"
            stroke="#ebb448"
            strokeWidth="9"
            strokeDasharray="5 10"
            fill="none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          />
          <motion.circle
            cx="130"
            cy="210"
            r="55"
            stroke="#ebb448"
            strokeWidth="6"
            strokeDasharray="3 12"
            fill="none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          />

          {/* Seeds fly away and fade, looping softly */}
          {SEEDS.map((seed, i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                delay: seed.delay,
                duration: 1.4,
                times: [0, 0.25, 0.7, 1],
                repeat: Infinity,
                repeatDelay: 0.6,
              }}
            >
              <motion.path
                d={seed.path}
                stroke="#1e293b"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  delay: seed.delay,
                  duration: 0.9,
                  repeat: Infinity,
                  repeatDelay: 1.1,
                }}
              />
              <motion.circle
                cx={seed.cx}
                cy={seed.cy}
                r={seed.r}
                fill={seed.color}
                animate={{ y: [0, -6, 0] }}
                transition={{
                  delay: seed.delay + 0.3,
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 0.9,
                }}
              />
            </motion.g>
          ))}
        </motion.svg>

        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h1 className="font-display font-black text-xl sm:text-2xl tracking-tight text-slate-900">
            Espaço <span className="text-[#1070ca]">Aprender a Ser</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">
            Painel Multidisciplinar Integrado
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-14 flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#1070ca]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
