"use client";

import type { ReactNode } from "react";

// Tab bergaris bawah: tab aktif ditandai garis primary dan teks tebal. Terkendali via `active`/`onChange`.
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
    <div className={`flex max-w-full gap-5 overflow-x-auto overflow-y-hidden border-b border-line ${className}`} role="tablist" aria-label="Navigasi bagian">
      {tabs.map((t) => {
        const current = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={current}
            onClick={() => onChange(t.id)}
            title={t.hint}
            className={`-mb-px shrink-0 border-b-2 pb-2.5 pt-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              current ? "border-primary font-semibold text-primary" : "border-transparent text-ink-muted hover:border-line hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children, tabKey }: { children: ReactNode; tabKey: string }) {
  return <div key={tabKey}>{children}</div>;
}
