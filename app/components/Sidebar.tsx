"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/app/lib/store";
import { Btn, Modal } from "@/app/components/ui";

function Ikon({ d }: { d: string }) {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const IKON = {
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  laporan: "M9 12h6M9 16h6M13 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9zM13 3v6h6",
  mk: "M12 6.25v11.5M12 6.25C10.83 4.8 8.9 4 6.5 4c-1.2 0-2.3.2-3 .5v13c.7-.3 1.8-.5 3-.5 2.4 0 4.33.8 5.5 2.25m0-13C13.17 4.8 15.1 4 17.5 4c1.2 0 2.3.2 3 .5v13c-.7-.3-1.8-.5-3-.5-2.4 0-4.33.8-5.5 2.25",
  pl: "M12 3l9 5-9 5-9-5zm-9 9l9 5 9-5M3 17l9 5 9-5",
  cpl: "M12 12a2 2 0 100-4 2 2 0 000 4zm7 0a7 7 0 11-14 0 7 7 0 0114 0zm3 0a10 10 0 11-20 0 10 10 0 0120 0z",
  ik: "M3 13h4l3-8 4 16 3-8h4",
  ppm: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zm6-3v15m6-12v15",
  hirarki: "M6 6a2 2 0 104 0 2 2 0 00-4 0zM18 6a2 2 0 104 0 2 2 0 00-4 0zM12 18a2 2 0 104 0 2 2 0 00-4 0zM7.6 7.6l3 8M16.4 7.6l-3 8M8 6h8",
  peta: "M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zm0 0v15M8 7h8M8 11h8M8 15h5",
  keluar: "M15 12H3m0 0l4-4m-4 4l4 4M9 4h9a2 2 0 012 2v12a2 2 0 01-2 2H9",
};

interface Item {
  label: string;
  href: string;
  ikon: string;
  /** Teks tooltip tur panduan pertama kali. */
  tour: string;
}

interface Grup {
  judul: string;
  items: Item[];
}

// Laporan dan Evaluasi dosen sengaja belum ditampilkan (keputusan sebelumnya di kode).
const GRUP: Grup[] = [
  {
    judul: "Ringkasan",
    items: [
      { label: "Dashboard", href: "/dashboard", ikon: IKON.dashboard, tour: "Pantau angka kunci kelas sampai CPL: ringkasan capaian, diagnosis titik lemah, dan detail sebaran nilai." },
      { label: "Hirarki", href: "/hirarki", ikon: IKON.hirarki, tour: "Lihat peta perhitungan CPL → Sub-CPMK, atau telusuri jalur sederhana langkah demi langkah." },
    ],
  },
  {
    judul: "Mata kuliah",
    items: [{ label: "Daftar mata kuliah", href: "/mata-kuliah", ikon: IKON.mk, tour: "Kelola nilai, capaian pembelajaran, dan dokumen tiap mata kuliah." }],
  },
  {
    judul: "Kurikulum prodi",
    items: [
      { label: "PPM", href: "/ppm", ikon: IKON.ppm, tour: "Lihat daftar PPM program studi dari data kurikulum." },
      { label: "Profil lulusan", href: "/pl", ikon: IKON.pl, tour: "Kelola profil lulusan sebagai informasi referensi; profil lulusan tidak diberi skor capaian." },
      { label: "CPL", href: "/cpl", ikon: IKON.cpl, tour: "Kelola Capaian Pembelajaran Lulusan tingkat program studi." },
      { label: "Indikator kinerja", href: "/ik", ikon: IKON.ik, tour: "Kelola kemampuan spesifik (IK) sebagai penanda ukur ketercapaian CPL." },
      { label: "Peta kurikulum", href: "/peta-kurikulum", ikon: IKON.peta, tour: "Atur bobot pemetaan tiap mata kuliah ke indikator kinerja dan tinjau rekap per CPL." },
    ],
  },
];

/** Daftar menu dipakai sidebar desktop dan drawer HP. `rail` = hanya ikon (1024–1279px). */
export function MenuNavigasi({ rail = false, onPilih }: { rail?: boolean; onPilih?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu utama" className={`flex-1 space-y-6 overflow-y-auto py-5 ${rail ? "px-2" : "px-3"}`}>
      {GRUP.map((grup) => (
        <div key={grup.judul}>
          <p className={`mb-1.5 px-3 text-xs font-semibold text-ink-muted ${rail ? "sr-only" : ""}`}>{grup.judul}</p>
          <ul className="space-y-0.5">
            {grup.items.map((item) => {
              const aktif = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onPilih}
                    aria-current={aktif ? "page" : undefined}
                    title={rail ? item.label : undefined}
                    data-tour={item.tour}
                    data-tour-title={item.label}
                    className={`relative flex h-10 items-center gap-3 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      rail ? "justify-center px-0" : "px-3"
                    } ${aktif ? "bg-primary/[0.06] font-semibold text-primary" : "text-ink-muted hover:bg-paper hover:text-ink"}`}
                  >
                    {aktif ? <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-accent" /> : null}
                    <Ikon d={item.ikon} />
                    <span className={rail ? "sr-only" : "truncate"}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Merek({ rail = false }: { rail?: boolean }) {
  return (
    <div className={`flex h-[var(--header-height)] shrink-0 items-center border-b border-line ${rail ? "justify-center" : "px-5"}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary">
          <Image src="/penswhite.png" alt="Logo PENS" width={28} height={28} className="h-7 w-7 object-contain" priority />
        </div>
        <div className={rail ? "sr-only" : "flex flex-col"}>
          <span className="text-base font-bold leading-tight text-primary">SPK OBE</span>
          <span className="text-xs text-ink-muted">PENS</span>
        </div>
      </div>
    </div>
  );
}

const berlanggananKosong = () => () => {};

/** Nama pengguna dan tombol keluar. Dirender setelah mount: data pengguna berasal dari localStorage. */
export function PanelPengguna({ rail = false }: { rail?: boolean }) {
  const { pengguna, keluar } = useApp();
  const router = useRouter();
  // false saat render server dan hidrasi, true di client — mencegah hydration mismatch.
  const siap = useSyncExternalStore(berlanggananKosong, () => true, () => false);
  const [konfirmasi, setKonfirmasi] = useState(false);

  return (
    <div className={`shrink-0 border-t border-line ${rail ? "p-2" : "p-3"}`}>
      <div className={`flex items-center gap-2 ${rail ? "flex-col" : ""}`}>
        <div className={`min-w-0 flex-1 ${rail ? "sr-only" : "px-2"}`}>
          <p className="truncate text-sm font-semibold text-ink">{siap && pengguna ? pengguna.nama : " "}</p>
          <p className="truncate text-xs text-ink-muted">{siap && pengguna ? pengguna.peran : " "}</p>
        </div>
        <button
          type="button"
          onClick={() => setKonfirmasi(true)}
          title="Keluar"
          aria-label="Keluar dari aplikasi"
          data-tour="Keluar dari aplikasi dan kembali ke halaman login."
          data-tour-title="Keluar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Ikon d={IKON.keluar} />
        </button>
      </div>
      {konfirmasi ? (
        <Modal title="Keluar dari aplikasi?" desc="Sesi akan diakhiri dan Anda kembali ke halaman login." onClose={() => setKonfirmasi(false)}>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setKonfirmasi(false)}>Batal</Btn>
            <Btn variant="danger" onClick={() => { keluar(); setKonfirmasi(false); router.push("/login"); }}>Keluar</Btn>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

/** Isi menu untuk drawer HP (merek, menu, pengguna). */
export function IsiMenu({ onPilih }: { onPilih?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Merek />
      <MenuNavigasi onPilih={onPilih} />
      <PanelPengguna />
    </div>
  );
}

/** Sidebar tetap: rail 72px pada 1024–1279px, penuh 248px pada ≥ 1280px, tersembunyi di bawah 1024px. */
export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden border-r border-line bg-white print:hidden lg:block lg:w-[var(--sidebar-rail-width)] xl:w-[var(--sidebar-width)]">
      <div className="flex h-full flex-col xl:hidden">
        <Merek rail />
        <MenuNavigasi rail />
        <PanelPengguna rail />
      </div>
      <div className="hidden h-full flex-col xl:flex">
        <Merek />
        <MenuNavigasi />
        <PanelPengguna />
      </div>
    </aside>
  );
}
