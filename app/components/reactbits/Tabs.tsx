"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// ReactBits — Tabs
// Tab sederhana + indikator animasi (layoutId). Terkendali via `active`/`onChange`.
export interface TabDef {
  id: string;
  label: string;
  hint?: string;
}

export default function Tabs({
  tabs,
  active,
  onChange,
  className = "",
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 ${className}`} role="tablist" aria-label="Navigasi bagian">
      {tabs.map((t) => {
        const current = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={current}
            onClick={() => onChange(t.id)}
            title={t.hint}
            className={`relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              current ? "text-white" : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            {current ? (
              <motion.span
                layoutId="tabs-pill"
                className="absolute inset-0 rounded-lg bg-primary shadow-sm"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children, tabKey }: { children: ReactNode; tabKey: string }) {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
