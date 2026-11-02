"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

// ReactBits — SplitText
// Judul terurai per huruf: muncul berurutan dari bawah begitu masuk viewport.
export default function SplitText({
  text,
  className = "",
  delay = 0,
  step = 0.02,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}) {
  const chars = useMemo(() => text.split(""), [text]);
  const MotionTag = useMemo(
    () => (motion as unknown as Record<string, typeof motion.div>)[Tag] ?? motion.h2,
    [Tag],
  );

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: step, delayChildren: delay } } }}
      aria-label={text}
    >
      {chars.map((c, i) => (
        <motion.span
          key={`${c}-${i}`}
          aria-hidden
          className="inline-block will-change-transform"
          variants={{
            hidden: { opacity: 0, y: "0.6em", rotate: 4 },
            visible: { opacity: 1, y: "0em", rotate: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      ))}
    </MotionTag>
  );
}
