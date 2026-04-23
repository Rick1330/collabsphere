import { motion, useReducedMotion, useAnimationControls } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Easing =
  | "easeInOut"
  | "easeOut"
  | "easeIn"
  | "linear"
  | [number, number, number, number];

interface CursorData {
  name: string;
  color: string;
  /** Region the cursor wanders inside, in % of the container. */
  region: { xMin: number; xMax: number; yMin: number; yMax: number };
  /** Base seconds per move; jittered per hop. */
  pace: number;
  /** Easing curve, gives each cursor a different "feel". */
  easing: Easing;
  /** Pause between hops (ms range). */
  pause: [number, number];
  /** Probability of doing a "click pulse" after arriving. */
  clickRate: number;
  /** Probability of a small overshoot/correction at the end. */
  overshootRate: number;
}

const cursors: CursorData[] = [
  {
    name: "Elshaday",
    color: "#2DD4BF",
    region: { xMin: 6, xMax: 38, yMin: 12, yMax: 42 },
    pace: 2.6,
    easing: [0.16, 1, 0.3, 1], // expo-out, snappy arrival
    pause: [400, 1100],
    clickRate: 0.4,
    overshootRate: 0.3,
  },
  {
    name: "Dr. Selam",
    color: "#F59E0B",
    region: { xMin: 58, xMax: 92, yMin: 8, yMax: 38 },
    pace: 4.2,
    easing: [0.45, 0, 0.55, 1], // sine-in-out, slow & deliberate
    pause: [900, 2200],
    clickRate: 0.15,
    overshootRate: 0.05,
  },
  {
    name: "Yonas",
    color: "#0EA5E9",
    region: { xMin: 28, xMax: 72, yMin: 48, yMax: 82 },
    pace: 1.8,
    easing: [0.34, 1.56, 0.64, 1], // back-out, energetic with bounce
    pause: [200, 700],
    clickRate: 0.55,
    overshootRate: 0.5,
  },
];

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const CursorSVG = ({ color }: { color: string }) => (
  <svg width="14" height="18" viewBox="0 0 12 16" fill="none" aria-hidden="true">
    <path d="M1 1L11 8L5.5 8.5L3 15L1 1Z" fill={color} stroke="white" strokeWidth="0.4" />
  </svg>
);

const AnimatedCursor = ({ data, seed }: { data: CursorData; seed: number }) => {
  const reduced = useReducedMotion();
  const controls = useAnimationControls();
  const pulse = useAnimationControls();
  const alive = useRef(true);

  // Deterministic-ish initial position so SSR/CSR don't mismatch in feel
  const initial = useMemo(
    () => ({
      x: data.region.xMin + ((seed * 13) % 100) / 100 * (data.region.xMax - data.region.xMin),
      y: data.region.yMin + ((seed * 29) % 100) / 100 * (data.region.yMax - data.region.yMin),
    }),
    [data, seed],
  );
  const [label, setLabel] = useState({ x: initial.x, y: initial.y });

  useEffect(() => {
    if (reduced) return;
    alive.current = true;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const loop = async () => {
      // Set start without animating
      controls.set({ left: `${initial.x}%`, top: `${initial.y}%` });

      while (alive.current) {
        const target = {
          x: rand(data.region.xMin, data.region.xMax),
          y: rand(data.region.yMin, data.region.yMax),
        };
        // Per-hop jitter so timing varies even when distance is similar
        const dx = target.x - initial.x;
        const dy = target.y - initial.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = data.pace * (0.55 + dist / 90) * rand(0.85, 1.2);

        const doOvershoot = Math.random() < data.overshootRate;
        if (doOvershoot) {
          const overshoot = {
            x: target.x + rand(-3, 3),
            y: target.y + rand(-3, 3),
          };
          await controls.start({
            left: `${overshoot.x}%`,
            top: `${overshoot.y}%`,
            transition: { duration: duration * 0.85, ease: data.easing },
          });
          if (!alive.current) return;
          await controls.start({
            left: `${target.x}%`,
            top: `${target.y}%`,
            transition: { duration: 0.25, ease: "easeOut" },
          });
        } else {
          await controls.start({
            left: `${target.x}%`,
            top: `${target.y}%`,
            transition: { duration, ease: data.easing },
          });
        }
        if (!alive.current) return;
        setLabel({ x: target.x, y: target.y });

        // Optional click pulse at destination
        if (Math.random() < data.clickRate) {
          pulse.start({
            scale: [0, 1.4, 0],
            opacity: [0.5, 0.15, 0],
            transition: { duration: 0.6, ease: "easeOut" },
          });
        }

        await sleep(rand(data.pause[0], data.pause[1]));
      }
    };

    loop();
    return () => {
      alive.current = false;
    };
  }, [controls, pulse, data, reduced, initial.x, initial.y]);

  if (reduced) {
    return (
      <div className="absolute" style={{ left: `${initial.x}%`, top: `${initial.y}%` }}>
        <CursorSVG color={data.color} />
        <div
          className="font-mono-cs text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap"
          style={{ backgroundColor: `${data.color}20`, color: data.color }}
        >
          {data.name}
        </div>
      </div>
    );
  }

  return (
    <motion.div className="absolute will-change-transform" animate={controls}>
      {/* Click pulse ring */}
      <motion.span
        className="absolute -left-2 -top-2 h-8 w-8 rounded-full pointer-events-none"
        style={{ border: `1.5px solid ${data.color}`, originX: 0.5, originY: 0.5, opacity: 0 }}
        animate={pulse}
      />
      <CursorSVG color={data.color} />
      <div
        className="font-mono-cs text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap"
        style={{ backgroundColor: `${data.color}20`, color: data.color }}
      >
        {data.name}
      </div>
    </motion.div>
  );
};

export const CursorField = () => (
  <div
    className="absolute inset-0 overflow-hidden z-0"
    aria-hidden="true"
    style={{
      maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
    }}
  >
    <svg className="absolute inset-0 w-full h-full">
      <pattern id="dotgrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="16" cy="16" r="0.75" fill="rgba(20,184,166,0.04)" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
    {cursors.map((c, i) => (
      <AnimatedCursor key={c.name} data={c} seed={i + 1} />
    ))}
  </div>
);
