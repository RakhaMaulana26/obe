"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/app/lib/store";
import BlurText from "@/app/components/reactbits/BlurText";

const JUDUL: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard Capaian" },
  { prefix: "/hirarki", title: "Hirarki Capaian" },
  { prefix: "/laporan", title: "Laporan" },
  { prefix: "/evaluasi-dosen", title: "Evaluasi Dosen" },
  { prefix: "/mata-kuliah", title: "Mata Kuliah" },
  { prefix: "/capaian", title: "Detail Capaian" },
  { prefix: "/pl", title: "Profil Lulusan" },
  { prefix: "/cpl", title: "Capaian Pembelajaran Lulusan" },
  { prefix: "/ik", title: "Indikator Kinerja" },
  { prefix: "/ppm", title: "PPM" },
];

export default function Header() {
  const [buka, setBuka] = useState(false);
  const [konfirmasiKeluar, setKonfirmasiKeluar] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { pengguna, keluar } = useApp();

  useEffect(() => {
    function diLuar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setBuka(false);
    }
    document.addEventListener("mousedown", diLuar);
    return () => document.removeEventListener("mousedown", diLuar);
  }, []);

  const aktif = JUDUL.find((j) => pathname === j.prefix || pathname.startsWith(`${j.prefix}/`)) ?? {
    title: "Dashboard",
  };
  const inisial = pengguna
    ? pengguna.nama
        .split(" ")
        .map((k) => k.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "–";

  function prosesKeluar() {
    keluar();
    setKonfirmasiKeluar(false);
    setBuka(false);
    router.push("/login");
  }

  return (
    <>
      <header
        className="fixed right-0 top-0 z-40 flex h-[var(--header-height)] items-center justify-between border-b border-gray-200 bg-white px-6 print:hidden"
        style={{ left: "var(--sidebar-width)", width: "calc(100% - var(--sidebar-width))" }}
        suppressHydrationWarning
      >
        <div className="relative ml-auto flex items-center gap-1" ref={ref}>
          <button
            onClick={() => window.dispatchEvent(new Event("obe-tour-mulai"))}
            title="Ulangi panduan tombol"
            aria-label="Ulangi panduan tombol"
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
          >
            ?
          </button>
          <button
            onClick={() => (pengguna ? setBuka(!buka) : router.push("/login"))}
            className="flex items-center gap-3 rounded-full p-1.5 pr-3 transition-colors hover:bg-gray-100"
            aria-label="Profil pengguna"
            aria-expanded={buka}
            data-tour="Buka menu akun untuk melihat info pengguna dan keluar dari aplikasi."
            data-tour-title="Akun"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground">
              {inisial}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-primary">{pengguna ? pengguna.nama : "Belum masuk"}</p>
              <p className="text-xs text-gray-500">{pengguna ? `${pengguna.peran} • ${pengguna.email}` : "Klik untuk masuk"}</p>
            </div>
            {pengguna ? (
              <svg
                className={`h-4 w-4 text-gray-500 transition-transform ${buka ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : null}
          </button>

          {buka && pengguna && (
            <div className="animate-fade-in absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate font-medium text-primary">{pengguna.nama}</p>
                <p className="truncate text-sm text-gray-500">{pengguna.email}</p>
                <span className="mt-1.5 inline-flex rounded-full bg-accent/25 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {pengguna.peran}
                </span>
              </div>
              <button
                onClick={() => {
                  setBuka(false);
                  setKonfirmasiKeluar(true);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </header>

      {konfirmasiKeluar && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setKonfirmasiKeluar(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-primary">Keluar dari aplikasi?</h3>
            <p className="mt-1 text-sm text-gray-600">Sesi Anda akan diakhiri dan kembali ke halaman Login.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setKonfirmasiKeluar(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={prosesKeluar}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
