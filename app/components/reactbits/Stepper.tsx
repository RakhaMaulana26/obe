"use client";

import type { ReactNode } from "react";

// Penanda langkah berurutan. Terkendali: parent mengatur `active` dan `onStep`.
// Tampilannya berupa deret segmen dengan garis atas; segmen aktif bergaris kuning.
export interface StepDef {
  title: string;
  desc?: string;
}

export default function Stepper({
  steps,
  active,
  onStep,
  className = "",
}: {
  steps: StepDef[];
  active: number;
  onStep?: (i: number) => void;
  className?: string;
}) {
  return (
    <ol className={`grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-flow-col sm:auto-cols-fr ${className}`} aria-label="Langkah">
      {steps.map((s, i) => {
        const done = i < active;
        const current = i === active;
        const garis = current ? "border-accent" : done ? "border-primary" : "border-line";
        return (
          <li key={s.title}>
            <button
              type="button"
              disabled={!onStep}
              onClick={() => onStep?.(i)}
              aria-current={current ? "step" : undefined}
              className={`flex h-full w-full gap-3 border-l-[3px] py-2 pl-3 text-left sm:flex-col sm:gap-0.5 sm:border-l-0 sm:border-t-[3px] sm:pl-0 sm:pt-2.5 ${garis} ${
                onStep ? "cursor-pointer hover:bg-paper/60" : "cursor-default"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
            >
              <span className={`text-sm font-semibold tabular-nums ${current ? "text-primary" : "text-ink-muted"}`}>
                {i + 1}
                <span className="sr-only">{done ? ", selesai" : current ? ", sedang dibuka" : ""}</span>
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${current ? "text-primary" : "text-ink"}`}>{s.title}</span>
                {s.desc ? <span className="block text-xs text-ink-muted">{s.desc}</span> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// Panel isi langkah, tanpa animasi masuk.
export function StepPanel({ children, stepKey }: { children: ReactNode; stepKey: string | number }) {
  return <div key={stepKey}>{children}</div>;
}
