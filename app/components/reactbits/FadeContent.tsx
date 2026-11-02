"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// ReactBits — FadeContent
// Pembungkus section: fade + slide-up halus saat masuk viewport.
export default function FadeContent({
  children,
  className = "",
  delay = 0,
  y = 14,
  blur = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  blur?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: blur ? "blur(6px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
