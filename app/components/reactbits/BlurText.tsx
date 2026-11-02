"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

// ReactBits — BlurText
// Teks terurai per kata: blur -> fokus + fade begitu tampil di viewport.
// Dipakai untuk judul halaman agar fokus mata mudah mengikuti hierarki.
export default function BlurText({
  text,
  className = "",
  delay = 0,
  step = 0.04,
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}) {
  const words = useMemo(() => text.split(" "), [text]);
  const MotionTag = useMemo(
    () => (motion as unknown as Record<string, typeof motion.div>)[Tag] ?? motion.h2,
    [Tag],
  );

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: step, delayChildren: delay } } }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="inline-block will-change-transform"
          variants={{
            hidden: { opacity: 0, filter: "blur(10px)", y: 8 },
            visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          {w}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </MotionTag>
  );
}
