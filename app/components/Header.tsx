"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/app/components/ui";
import { IsiMenu } from "@/app/components/Sidebar";

const JUDUL: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/hirarki", title: "Hirarki capaian" },
  { prefix: "/laporan", title: "Laporan" },
  { prefix: "/evaluasi-dosen", title: "Evaluasi dosen" },
  { prefix: "/mata-kuliah", title: "Mata kuliah" },
  { prefix: "/capaian", title: "Detail capaian" },
  { prefix: "/peta-kurikulum", title: "Peta kurikulum" },
  { prefix: "/pl", title: "Profil lulusan" },
  { prefix: "/cpl", title: "CPL" },
  { prefix: "/ik", title: "Indikator kinerja" },
  { prefix: "/ppm", title: "PPM" },
];

/**
 * Header: tombol menu (< 1024px) yang membuka drawer, judul halaman di HP, dan tombol tur panduan.
 * Slot konteks MK/tahun/kelas disiapkan untuk sub-proyek 2.
 */
export default function Header() {
  const pathname = usePathname();
  const [menuBuka, setMenuBuka] = useState(false);
  const judul = JUDUL.find((j) => pathname === j.prefix || pathname.startsWith(`${j.prefix}/`))?.title ?? "SPK OBE";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-[var(--header-height)] items-center gap-3 border-b border-line bg-white px-4 print:hidden sm:px-6 lg:left-[var(--sidebar-rail-width)] xl:left-[var(--sidebar-width)]">
        <button
          type="button"
          onClick={() => setMenuBuka(true)}
          aria-label="Buka menu"
          aria-expanded={menuBuka}
          data-tour="Buka menu untuk berpindah ke Dashboard, Mata kuliah, atau data kurikulum prodi. Keluar dari aplikasi ada di bagian bawah menu."
          data-tour-title="Menu"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <p className="truncate text-base font-semibold text-primary lg:hidden">{judul}</p>
        {/* Slot konteks MK/tahun/kelas — diisi di sub-proyek 2. */}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("obe-tour-mulai"))}
          title="Ulangi panduan"
          aria-label="Ulangi panduan"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold text-ink-muted transition-colors hover:bg-paper hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          ?
        </button>
      </header>
      <Drawer open={menuBuka} onClose={() => setMenuBuka(false)} label="Menu utama">
        <IsiMenu onPilih={() => setMenuBuka(false)} />
      </Drawer>
    </>
  );
}
