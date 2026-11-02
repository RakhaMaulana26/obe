"use client";

// ReactBits — Marquee
// Pita teks berjalan tanpa henti (jeda saat hover). Murni CSS animation.
export default function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const baris = [...items, ...items];
  return (
    <div className={`group relative overflow-hidden border-y border-white/10 bg-[#0a2547] py-3.5 ${className}`} aria-hidden>
      <div className="animate-marquee flex w-max items-center gap-8 pr-8 group-hover:[animation-play-state:paused]">
        {baris.map((t, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.2em] text-white/70">
            {t}
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}
