"use client";

import type { ReactNode, ThHTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { konversiHuruf } from "@/app/lib/hitung";
import BlurText from "@/app/components/reactbits/BlurText";
import CountUp from "@/app/components/reactbits/CountUp";

// Primitif UI yang mengikuti style proyek:
// kartu putih rounded, border gray-200, aksen primary #103968 + accent #f2c808.

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>
  );
}

const LABEL_SEGMEN: Record<string, string> = {
  dashboard: "Dashboard",
  hirarki: "Hirarki",
  laporan: "Laporan",
  "evaluasi-dosen": "Evaluasi Dosen",
  "mata-kuliah": "Mata Kuliah",
  capaian: "Detail Capaian",
  pl: "Profil Lulusan",
  cpl: "CPL",
  ik: "Indikator Kinerja",
  "peta-kurikulum": "Peta Kurikulum",
  ppm: "PPM",
  struktur: "Struktur",
  bobot: "Bobot",
  nilai: "Nilai",
  "rps-mingguan": "RPS Mingguan",
  dokumen: "Dokumen",
  rps: "RPS",
  rubrik: "Rubrik",
  "sub-cpmk": "Sub-CPMK",
};

function Breadcrumbs() {
  const pathname = usePathname();
  const segmen = pathname.split("/").filter(Boolean);
  if (segmen.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mt-1">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-xs text-gray-500">
        {segmen.map((bagian, index) => {
          const terakhir = index === segmen.length - 1;
          const label = bagian === "capaian" && segmen.includes("mata-kuliah")
            ? "Capaian CPMK"
            : LABEL_SEGMEN[bagian] ?? decodeURIComponent(bagian);
          const href = "/" + segmen.slice(0, index + 1).join("/");

          return (
            <li key={`${bagian}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <span aria-hidden className="shrink-0 text-gray-300">/</span> : null}
              {terakhir ? (
                <span aria-current="page" className="truncate font-medium text-gray-700">{label}</span>
              ) : (
                <Link href={href} className="truncate transition-colors hover:text-primary hover:underline">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PageHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <BlurText text={title} as="h2" className="text-2xl font-bold text-primary" step={0.03} />
        <Breadcrumbs />
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  highlight = false,
  numeric,
  decimals = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  /** Bila diisi, value dianimasikan dengan CountUp. */
  numeric?: number;
  decimals?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
        highlight ? "border-accent ring-1 ring-accent" : "border-gray-200"
      }`}
    >
      {highlight ? <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-accent" /> : null}
      <h3 className="text-[13px] font-medium text-gray-500">{label}</h3>
      <p className="mt-1.5 text-[26px] font-bold leading-none text-primary">
        {numeric !== undefined ? <CountUp value={numeric} decimals={decimals} /> : value}
      </p>
      {sub ? <p className="mt-1.5 text-xs text-gray-500">{sub}</p> : null}
    </motion.div>
  );
}

export function BadgeStatus({ tercapai }: { tercapai: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        tercapai ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tercapai ? "bg-green-600" : "bg-red-600"}`} />
      {tercapai ? "Tercapai" : "Belum"}
    </span>
  );
}

export function BadgeHuruf({ skor }: { skor: number }) {
  const { huruf } = konversiHuruf(skor);
  return (
    <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-primary px-2 py-1 text-[11px] font-bold text-white">
      {huruf}
    </span>
  );
}

export function Bar({ value, max = 100, tone = "primary" }: { value: number; max?: number; tone?: "primary" | "accent" | "red" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg = tone === "accent" ? "bg-accent" : tone === "red" ? "bg-red-400" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <motion.div
        className={`h-full rounded-full ${bg}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export function Btn({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
  tour,
  tourTitle,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "accent" | "outline" | "danger" | "ghost";
  disabled?: boolean;
  className?: string;
  /** Teks tooltip tur panduan (hanya tampil saat tur pertama kali berjalan). */
  tour?: string;
  tourTitle?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const map: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    accent: "bg-accent text-[#103968] hover:brightness-95 font-semibold",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  };
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
      data-tour={tour}
      data-tour-title={tourTitle}
      className={`${base} ${map[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function Modal({
  title,
  desc,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  desc?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl`}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-primary">{title}</h3>
            {desc ? <p className="mt-0.5 text-sm text-gray-500">{desc}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-8 text-center">
      <p className="font-semibold text-primary">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{desc}</p>
    </div>
  );
}

export function Th({ children, className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={`whitespace-nowrap pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`py-3 text-sm ${className}`}>{children}</td>;
}
