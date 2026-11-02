"use client";

import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";

// ReactBits — CountUp
// Angka beranimasi 0 -> target saat masuk viewport. Menghormati prefers-reduced-motion.
export default function CountUp({
  value,
  decimals = 0,
  duration = 1.1,
  className = "",
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (inView) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        mv.set(value);
      } else {
        mv.set(value);
      }
    }
  }, [inView, value, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = v.toLocaleString("id-ID", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
    });
    return unsub;
  }, [spring, decimals]);

  return (
    <span ref={ref} className={className}>
      {(0).toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

// Variasi ringan tanpa spring untuk nilai kecil — memakai motion span.
export function CountUpSimple({ value, decimals = 0, className = "" }: { value: number; decimals?: number; className?: string }) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0.4 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <CountUp value={value} decimals={decimals} />
    </motion.span>
  );
}
