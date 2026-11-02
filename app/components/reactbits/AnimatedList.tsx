"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// ReactBits — AnimatedList
// Daftar beranimasi stagger: tiap item fade+slide berurutan saat tampil.
// Bungkus <ul>/<div> apa pun; item dibungkus <AnimatedItem>.
export default function AnimatedList({
  children,
  className = "",
  step = 0.06,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: step, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
