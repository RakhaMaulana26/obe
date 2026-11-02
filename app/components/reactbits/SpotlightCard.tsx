"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";

// ReactBits — SpotlightCard
// Kartu dengan sorotan radial mengikuti kursor. Tetap terbaca: konten tidak berubah,
// hanya aksen cahaya navy/kuning sesuai brand.
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(16,57,104,0.12)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -400, y: -400 });
  const [active, setActive] = useState(false);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 65%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
