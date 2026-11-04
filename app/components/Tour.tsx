"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Tur panduan untuk pengguna baru: menyorot elemen bertanda `data-tour`
// satu per satu dengan tooltip penjelasan.
// Hanya tampil pada kunjungan pertama (flag localStorage `obe-tour-selesai`).
// Ulangi manual dengan: window.dispatchEvent(new Event("obe-tour-mulai"))

const KUNCI_SELESAI = "obe-tour-selesai";

interface Langkah {
  judul: string;
  teks: string;
  el: HTMLElement;
}

function sudahSelesai(): boolean {
  try {
    return window.localStorage.getItem(KUNCI_SELESAI) === "1";
  } catch {
    return true;
  }
}

export default function Tour() {
  const pathname = usePathname();
  const [langkah, setLangkah] = useState<Langkah[]>([]);
  const [idx, setIdx] = useState(0);
  const [kotak, setKotak] = useState<DOMRect | null>(null);
  const timer = useRef<number | null>(null);

  const akhiri = useCallback((tandai = true) => {
    if (tandai) {
      try {
        window.localStorage.setItem(KUNCI_SELESAI, "1");
      } catch {
        /* abaikan */
      }
    }
    if (timer.current) window.clearTimeout(timer.current);
    setLangkah([]);
    setIdx(0);
    setKotak(null);
  }, []);

  const mulai = useCallback(
    (paksa = false) => {
      if (!paksa && sudahSelesai()) return;
      if (timer.current) window.clearTimeout(timer.current);
      // Tunggu transisi halaman selesai agar posisi elemen stabil.
      timer.current = window.setTimeout(() => {
        const daftar: Langkah[] = [];
        const teksTerlihat = new Set<string>();
        document.querySelectorAll<HTMLElement>("[data-tour]").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const cs = window.getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") return;
          const teks = (el.getAttribute("data-tour") ?? "").trim();
          // Teks sama (mis. tombol Ubah/Hapus tiap baris) hanya dijelaskan sekali.
          if (!teks || teksTerlihat.has(teks)) return;
          teksTerlihat.add(teks);
          daftar.push({
            judul: (el.getAttribute("data-tour-title") ?? "").trim() || "Panduan",
            teks,
            el,
          });
        });
        if (daftar.length === 0) return;
        setIdx(0);
        setLangkah(daftar);
      }, 650);
    },
    [],
  );

  // Jalan otomatis tiap pindah halaman (sampai ditandai selesai).
  useEffect(() => {
    mulai(false);
  }, [mulai, pathname]);

  // Dengarkan permintaan ulangi tur (tombol "?" di header).
  useEffect(() => {
    const dengar = () => mulai(true);
    window.addEventListener("obe-tour-mulai", dengar);
    return () => window.removeEventListener("obe-tour-mulai", dengar);
  }, [mulai]);

  // Sorot langkah aktif: gulir ke tengah lalu kunci posisinya.
  useEffect(() => {
    if (langkah.length === 0) return;
    const el = langkah[idx]?.el;
    if (!el || !document.contains(el)) {
      // Elemen hilang (mis. kondisi berubah) — lewati ke langkah berikut.
      const t = window.setTimeout(() => {
        if (idx + 1 < langkah.length) setIdx(idx + 1);
        else akhiri(false);
      }, 0);
      return () => window.clearTimeout(t);
    }
    try {
      el.scrollIntoView({ block: "center", inline: "nearest" });
    } catch {
      /* abaikan */
    }
    const t = window.setTimeout(() => setKotak(el.getBoundingClientRect()), 380);
    const atur = () => setKotak(el.getBoundingClientRect());
    window.addEventListener("scroll", atur, { passive: true, capture: true });
    window.addEventListener("resize", atur);
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") akhiri(true);
    };
    window.addEventListener("keydown", esc);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", atur, { capture: true });
      window.removeEventListener("resize", atur);
      window.removeEventListener("keydown", esc);
    };
  }, [langkah, idx, akhiri]);

  if (langkah.length === 0 || !kotak) return null;
  const aktif = langkah[idx];
  const terakhir = idx === langkah.length - 1;
  const pad = 6;
  const diBawah = kotak.bottom + 12 + 230 <= window.innerHeight;
  const kiri = Math.max(12, Math.min(kotak.left, window.innerWidth - 332));

  return (
    <div className="print:hidden">
      {/* Penghalang klik di belakang */}
      <div className="fixed inset-0 z-[90]" onClick={() => akhiri(true)} aria-hidden />
      {/* Sorotan: bingkai + gelap sekeliling via box-shadow */}
      <div
        aria-hidden
        className="pointer-events-none fixed z-[91] rounded-lg ring-2 ring-accent transition-all duration-300"
        style={{
          left: kotak.left - pad,
          top: kotak.top - pad,
          width: kotak.width + pad * 2,
          height: kotak.height + pad * 2,
          boxShadow: "0 0 0 9999px rgba(10, 37, 71, 0.55)",
        }}
      />
      {/* Kartu tooltip */}
      <div
        role="dialog"
        aria-label={`Panduan langkah ${idx + 1} dari ${langkah.length}`}
        className="fixed z-[92] w-[320px] max-w-[calc(100vw-1.5rem)] rounded-lg border border-line bg-white p-5"
        style={diBawah ? { left: kiri, top: kotak.bottom + 12 } : { left: kiri, bottom: window.innerHeight - kotak.top + 12 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-ink-muted">
              Langkah {idx + 1} dari {langkah.length}
            </p>
            <h3 className="mt-1 text-base font-bold text-primary">{aktif.judul}</h3>
          </div>
          <button
            onClick={() => akhiri(true)}
            aria-label="Lewati panduan"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-paper hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink">{aktif.teks}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => akhiri(true)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-paper"
          >
            Lewati semua
          </button>
          <div className="flex gap-2">
            {idx > 0 ? (
              <button
                onClick={() => setIdx(idx - 1)}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper"
              >
                ← Kembali
              </button>
            ) : null}
            {terakhir ? (
              <button
                onClick={() => akhiri(true)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-primary transition hover:brightness-95"
              >
                Selesai ✓
              </button>
            ) : (
              <button
                onClick={() => setIdx(idx + 1)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Lanjut
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
