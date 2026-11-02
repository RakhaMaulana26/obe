"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// ReactBits — Stepper
// Penanda langkah horizontal yang mudah dipahami: lingkaran bernomor + label.
// Terkendali (controlled): parent mengatur `active` dan `onStep`.
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
    <ol className={`flex flex-col gap-0 sm:flex-row sm:items-start ${className}`} aria-label="Langkah">
      {steps.map((s, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={s.title} className="flex flex-1 items-start gap-3 sm:gap-0">
            <div className="flex flex-1 items-start gap-3">
              <button
                type="button"
                disabled={!onStep}
                onClick={() => onStep?.(i)}
                aria-current={current ? "step" : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  current
                    ? "bg-primary text-white ring-4 ring-primary/15"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-500"
                } ${onStep ? "cursor-pointer hover:brightness-95" : "cursor-default"}`}
              >
                {done ? "✓" : i + 1}
              </button>
              <div className="min-w-0 pb-5 sm:pb-0">
                <p className={`text-[13px] font-semibold ${current ? "text-primary" : "text-gray-700"}`}>{s.title}</p>
                {s.desc ? <p className="mt-0.5 text-xs text-gray-500">{s.desc}</p> : null}
                {current ? (
                  <motion.span
                    layoutId="stepper-bar"
                    className="mt-1.5 block h-1 w-10 rounded-full bg-accent"
                  />
                ) : null}
              </div>
            </div>
            {i < steps.length - 1 ? (
              <span aria-hidden className={`mx-1 mt-4 hidden h-px flex-1 sm:block ${done ? "bg-emerald-300" : "bg-gray-200"}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

// Panel isi langkah dengan animasi masuk ringan.
export function StepPanel({ children, stepKey }: { children: ReactNode; stepKey: string | number }) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
