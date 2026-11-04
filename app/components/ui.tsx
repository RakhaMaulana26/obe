"use client";

import { useEffect, useRef, type ReactNode, type ThHTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { konversiHuruf } from "@/app/lib/hitung";

// Primitif UI (spec desain 2026-11-04): warna dari token PENS di globals.css, Plus Jakarta Sans,
// skala teks 12/14/16/20/28px, panel dibedakan dengan garis — tanpa bayangan dan tanpa animasi masuk.

const fokus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";

/** Lembar putih bergaris tipis — permukaan data (tabel, form). Tanpa bayangan. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-white p-5 sm:p-6 ${className}`}>{children}</div>;
}

/** Judul bagian yang berdiri di atas lembarnya (bukan di dalam kotak), dengan keterangan dan aksi opsional. */
export function JudulBagian({ judul, keterangan, aksi, id }: { judul: string; keterangan?: ReactNode; aksi?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 id={id} className="text-base font-bold text-ink">{judul}</h2>
        {keterangan ? <p className="mt-0.5 max-w-[68ch] text-sm text-ink-muted">{keterangan}</p> : null}
      </div>
      {aksi ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aksi}</div> : null}
    </div>
  );
}

const LABEL_SEGMEN: Record<string, string> = {
  dashboard: "Dashboard",
  hirarki: "Hirarki",
  laporan: "Laporan",
  "evaluasi-dosen": "Evaluasi dosen",
  "mata-kuliah": "Mata kuliah",
  capaian: "Capaian mahasiswa",
  pl: "Profil lulusan",
  cpl: "CPL",
  ik: "Indikator kinerja",
  "peta-kurikulum": "Peta kurikulum",
  ppm: "PPM",
  struktur: "Struktur",
  bobot: "Bobot",
  nilai: "Nilai",
  "rps-mingguan": "RPS mingguan",
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
    <nav aria-label="Breadcrumb" className="mb-1.5">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-xs text-ink-muted">
        {segmen.map((bagian, index) => {
          const terakhir = index === segmen.length - 1;
          const label = bagian === "capaian" && segmen.includes("mata-kuliah")
            ? "Capaian CPMK"
            : LABEL_SEGMEN[bagian] ?? decodeURIComponent(bagian);
          const href = "/" + segmen.slice(0, index + 1).join("/");
          // /capaian tidak punya halaman sendiri; tampilkan sebagai teks biasa.
          const tanpaHalaman = href === "/capaian";

          return (
            <li key={`${bagian}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <span aria-hidden className="shrink-0 text-line">/</span> : null}
              {terakhir || tanpaHalaman ? (
                <span aria-current={terakhir ? "page" : undefined} className={`truncate ${terakhir ? "font-medium text-ink" : ""}`}>{label}</span>
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

/** Kepala halaman: jejak lokasi di atas, judul, satu kalimat tentang tugas halaman, dan aksi utama di kanan. */
export function PageHeading({ title, desc, action }: { title: string; desc?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <Breadcrumbs />
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        {desc ? <p className="mt-1 max-w-[70ch] text-sm text-ink-muted">{desc}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

/**
 * Angka ringkasan seperti di buku nilai: label kecil, angka besar berlebar seragam, garis pemisah di kiri.
 * Beberapa StatCard berjejer membentuk satu baris angka, bukan deretan kartu.
 */
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
  /** Tandai angka yang perlu diperhatikan (garis kuning PENS). */
  highlight?: boolean;
  /** Bila diisi, angka ditampilkan dengan format desimal yang konsisten. */
  numeric?: number;
  decimals?: number;
}) {
  return (
    <div className={`border-l-[3px] py-1 pl-4 ${highlight ? "border-accent" : "border-line"}`}>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums leading-tight text-primary">
        {numeric !== undefined ? numeric.toFixed(decimals) : value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-ink-muted">{sub}</p> : null}
    </div>
  );
}

export function BadgeStatus({ tercapai }: { tercapai: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-px text-xs font-semibold ${
        tercapai ? "border-success/40 bg-success-bg text-success" : "border-danger/40 bg-danger-bg text-danger"
      }`}
    >
      <span aria-hidden>{tercapai ? "✓" : "✕"}</span>
      {tercapai ? "Tercapai" : "Belum"}
    </span>
  );
}

export function BadgeHuruf({ skor }: { skor: number }) {
  const { huruf } = konversiHuruf(skor);
  return (
    <span className="inline-flex min-w-8 items-center justify-center rounded border border-primary/30 px-1.5 py-px text-xs font-bold tabular-nums text-primary">
      {huruf}
    </span>
  );
}

export function Bar({ value, max = 100, tone = "primary" }: { value: number; max?: number; tone?: "primary" | "accent" | "red" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg = tone === "accent" ? "bg-accent" : tone === "red" ? "bg-danger" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "min-h-10 w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

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
    `inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${fokus}`;
  const map: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-dark",
    accent: "bg-accent text-accent-foreground hover:brightness-95",
    outline: "border border-line bg-white text-ink hover:border-ink-muted/40 hover:bg-paper",
    danger: "bg-danger text-white hover:brightness-95",
    ghost: "text-ink-muted hover:bg-paper hover:text-ink",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-tour={tour}
      data-tour-title={tourTitle}
      className={`${base} ${map[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// Tumpukan dialog yang sedang terbuka: hanya dialog teratas yang bereaksi pada Esc,
// sehingga Esc di konfirmasi keluar tidak ikut menutup drawer di bawahnya.
const tumpukanDialog: symbol[] = [];

/** Tutup dengan Esc dan pindahkan fokus ke panel saat dibuka; fokus dikembalikan saat ditutup. */
function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  // onClose sering dikirim sebagai fungsi inline; disimpan di ref agar efek hanya berjalan saat dialog dibuka,
  // sehingga fokus tidak berpindah setiap kali isi dialog dirender ulang (mis. saat mengetik).
  const tutupRef = useRef(onClose);
  useEffect(() => {
    tutupRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const id = Symbol("dialog");
    tumpukanDialog.push(id);
    const sebelumnya = document.activeElement as HTMLElement | null;
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus();
    function tekan(e: KeyboardEvent) {
      if (e.key === "Escape" && tumpukanDialog[tumpukanDialog.length - 1] === id) tutupRef.current();
    }
    document.addEventListener("keydown", tekan);
    return () => {
      document.removeEventListener("keydown", tekan);
      tumpukanDialog.splice(tumpukanDialog.indexOf(id), 1);
      sebelumnya?.focus?.();
    };
  }, []);
  return ref;
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
  const ref = useDialog(onClose);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-xl border border-line bg-white p-6 focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-primary">{title}</h3>
            {desc ? <p className="mt-0.5 text-sm text-ink-muted">{desc}</p> : null}
          </div>
          <button onClick={onClose} aria-label="Tutup dialog" className={`rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-paper hover:text-ink ${fokus}`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/** Panel geser dari kiri (dipakai menu di layar < 1024px). */
export function Drawer({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  if (!open) return null;
  return <DrawerPanel onClose={onClose} label={label}>{children}</DrawerPanel>;
}

function DrawerPanel({ onClose, label, children }: { onClose: () => void; label: string; children: ReactNode }) {
  const ref = useDialog(onClose);
  return (
    <div className="fixed inset-0 z-[60] lg:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40" aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="absolute inset-y-0 left-0 w-[min(85vw,var(--sidebar-width))] overflow-y-auto bg-white focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-muted/30 px-6 py-8">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">{desc}</p>
      {action ? <div className="mt-4 flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function Th({ children, className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...props} className={`whitespace-nowrap pb-2.5 text-left text-xs font-semibold text-ink-muted ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`py-3 text-sm text-ink ${className}`}>{children}</td>;
}
