"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useApp } from "@/app/lib/store";

function Ikon({ d }: { d: string }) {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
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
  dosen: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

interface Item {
  label: string;
  href: string;
  ikon: string;
  desc: string;
  /** Teks tooltip tur panduan pertama kali. */
  tour: string;
}

const UTAMA: Item[] = [
  { label: "Dashboard Capaian", href: "/dashboard", ikon: IKON.dashboard, desc: "Sub-CPMK → CPL", tour: "Pantau angka kunci kelas sampai CPL: ringkasan capaian, diagnosis titik lemah, dan detail sebaran nilai." },
  { label: "Hirarki", href: "/hirarki", ikon: IKON.hirarki, desc: "CPL → Sub-CPMK", tour: "Lihat peta perhitungan CPL → Sub-CPMK, atau telusuri jalur sederhana langkah demi langkah." },
  // { label: "Laporan", href: "/laporan", ikon: IKON.laporan, desc: "Rekap & ekspor", tour: "Unduh rekap capaian (CSV) dan cetak laporan PDF untuk bukti akreditasi." },
  // { label: "Evaluasi Dosen", href: "/evaluasi-dosen", ikon: IKON.dosen, desc: "Kinerja pengampu", tour: "Nilai kinerja dosen pengampu dari capaian kelas per mata kuliah dan tahun." },
];

const DOSEN: Item[] = [{ label: "Mata Kuliah", href: "/mata-kuliah", ikon: IKON.mk, desc: "Nilai, capaian, dokumen", tour: "Kelola nilai, capaian pembelajaran, dan dokumen tiap mata kuliah." }];

const PRODI: Item[] = [
  { label: "PPM", href: "/ppm", ikon: IKON.ppm, desc: "Profil program studi", tour: "Lihat daftar PPM program studi dari data kurikulum." },
  { label: "Profil Lulusan", href: "/pl", ikon: IKON.pl, desc: "Data referensi prodi", tour: "Kelola profil lulusan sebagai informasi referensi; profil lulusan tidak diberi skor capaian." },
  { label: "CPL", href: "/cpl", ikon: IKON.cpl, desc: "Capaian lulusan", tour: "Kelola Capaian Pembelajaran Lulusan tingkat program studi." },
  { label: "Indikator Kinerja", href: "/ik", ikon: IKON.ik, desc: "Penanda ukur CPL", tour: "Kelola kemampuan spesifik (IK) sebagai penanda ukur ketercapaian CPL." },
  { label: "Peta Kurikulum", href: "/peta-kurikulum", ikon: IKON.peta, desc: "Pemetaan MK ke CPL & IK", tour: "Atur bobot pemetaan tiap mata kuliah ke indikator kinerja dan tinjau rekap per CPL." },
];

function Grup({ judul, items, pathname }: { judul: string; items: Item[]; pathname: string }) {
  return (
    <div>
      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">{judul}</div>
      <div className="space-y-1">
        {items.map((item) => {
          const aktif = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={aktif ? "page" : undefined}
              data-tour={item.tour}
              data-tour-title={item.label}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                aktif ? "bg-primary text-primary-foreground shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {aktif ? (
                <motion.span
                  layoutId={`nav-aktif-${judul}`}
                  className="absolute inset-0 rounded-xl bg-primary"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : null}
              <span className="relative flex min-w-0 flex-1 items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  aktif ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                }`}
              >
                <Ikon d={item.ikon} />
              </span>
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                <span className={`block truncate text-[11px] font-normal ${aktif ? "text-white/70" : "text-gray-400"}`}>
                  {item.desc}
                </span>
              </span>
              {aktif && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { pengguna } = useApp();

  return (
    <aside
      className="fixed left-0 top-0 z-50 h-screen w-[var(--sidebar-width)] border-r border-gray-200/80 bg-white print:hidden"
      suppressHydrationWarning
    >
      <div className="flex h-full flex-col">
        <div className="flex h-[var(--header-height)] items-center border-b border-gray-200/80 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-sm">
              <Image src="/penswhite.png" alt="Logo PENS" width={28} height={28} className="h-7 w-7 object-contain" priority />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold leading-tight text-gray-900">OBE - PENS</span>
              <span className="text-[11px] text-gray-400">PENS</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <Grup judul="Utama" items={UTAMA} pathname={pathname} />
          <Grup judul="Dosen — Mata Kuliah" items={DOSEN} pathname={pathname} />
          <Grup judul="Prodi — Kurikulum" items={PRODI} pathname={pathname} />
        </nav>

        <div className="border-t border-gray-200/80 p-4">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
            <div>
              <p className="text-[11px] font-medium text-gray-400">{pengguna ? `${pengguna.peran} • v1.0.0` : "Version 1.0.0"}</p>
              <p className="max-w-[170px] truncate text-xs font-semibold text-gray-600">
                {pengguna ? pengguna.nama : "Belum masuk"}
              </p>
            </div>
            <div className={`h-2 w-2 rounded-full ${pengguna ? "bg-green-500" : "bg-gray-300"}`} />
          </div>
        </div>
      </div>
    </aside>
  );
}
