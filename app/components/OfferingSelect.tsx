"use client";

import { kunciOffering, type MataKuliahItem } from "@/app/lib/store";
import { inputCls } from "@/app/components/ui";

// Pemilih konteks data: satu penawaran MK + tahun ajaran + kelas.
// Dipakai halaman umum (Dashboard, Hirarki, Laporan, Capaian per mahasiswa)
// agar angka tidak lagi terbatas pada satu angkatan.
export default function OfferingSelect({
  daftar,
  kode,
  tahun,
  kelas = "A",
  onChange,
  id = "pilih-offering",
  label = "Mata kuliah, tahun, dan kelas",
  className = "",
  tour,
  tourTitle,
}: {
  daftar: MataKuliahItem[];
  kode: string;
  tahun: string;
  kelas?: string;
  onChange: (kode: string, tahun: string, kelas: string) => void;
  id?: string;
  label?: string;
  className?: string;
  /** Teks tooltip tur panduan (hanya tampil saat tur pertama kali berjalan). */
  tour?: string;
  tourTitle?: string;
}) {
  const nilai = kode && tahun ? kunciOffering(kode, tahun, kelas) : "";
  return (
    <div className={className} data-tour={tour} data-tour-title={tourTitle}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        value={nilai}
        onChange={(e) => {
          const [k, t, c] = e.target.value.split("::");
          if (k && t && c) onChange(k, t, c);
        }}
        className={inputCls}
      >
        {daftar.length === 0 ? <option value="">Belum ada mata kuliah</option> : null}
        {daftar.map((m) => (
          <option key={kunciOffering(m.kode, m.tahun, m.kelas)} value={kunciOffering(m.kode, m.tahun, m.kelas)}>
            {`${m.kode} ${m.nama}, ${m.tahun}, kelas ${m.kelas}`}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Chip info dosen pengampu penawaran aktif. */
export function DosenChip({ daftar, kode, tahun, kelas = "A" }: { daftar: MataKuliahItem[]; kode: string; tahun: string; kelas?: string }) {
  const mk = daftar.find((m) => m.kode === kode && m.tahun === tahun && m.kelas === kelas) ?? daftar.find((m) => m.kode === kode);
  if (!mk) return null;
  return (
    <p className="text-sm text-ink-muted">
      Dosen pengampu: <span className="font-medium text-ink">{mk.dosen || "belum diisi"}</span>
    </p>
  );
}
