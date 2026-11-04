"use client";

import { useId, useState, type ReactNode } from "react";

// Bagian lipat untuk menyimpan detail (misalnya rumus) di bawah ringkasan.
export default function Accordion({
  title,
  desc,
  children,
  defaultOpen = false,
  className = "",
}: {
  title: string;
  desc?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const idIsi = useId();
  return (
    <div className={`rounded-lg border border-line bg-white ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={idIsi}
        className="flex w-full items-start justify-between gap-3 rounded-lg px-4 py-3 text-left hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
      >
        <span>
          <span className="block text-sm font-semibold text-ink">{title}</span>
          {desc ? <span className="mt-0.5 block text-sm text-ink-muted">{desc}</span> : null}
        </span>
        <svg aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 text-ink-muted transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div id={idIsi} className="border-t border-line px-4 py-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
