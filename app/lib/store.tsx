"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DAFTAR_ASESMEN,
  DAFTAR_KELAS,
  DAFTAR_CPL,
  DAFTAR_IK,
  DAFTAR_PL,
  MK_SEED,
  PEMETAAN_KURIKULUM_SEED,
  STRUKTUR_MK_SEED,
  buatStrukturDummy,
  nilaiAwalUntuk,
  type Asesmen,
  type AsesmenKode,
  type CPMK,
  type KategoriMataKuliah,
  type NilaiMap,
  type StrukturMataKuliah,
  type SubCPMK,
} from "./data";
import { KONFIGURASI_DOKUMEN_SEED, kunciConfigDokumen } from "./dokumen-seed";

export interface Pengguna {
  nama: string;
  email: string;
  peran: "Dosen" | "Prodi";
}

export interface MataKuliahItem {
  kode: string;
  nama: string;
  semester: number | null;
  sks: number;
  kategori: KategoriMataKuliah;
  kelas: string;
  /** Tahun ajaran penawaran, mis. "2026/2027" — satu kode MK dapat dibuka di beberapa tahun. */
  tahun: string;
  /** Dosen pengampu pada tahun tersebut — boleh berbeda tiap tahun. */
  dosen: string;
  /** CPL yang dibebankan pada mata kuliah ini. */
  cpl: string[];
  /** Bahan kajian yang dihubungkan ke mata kuliah ini. */
  bahanKajian: string[];
  /** Menandai pemetaan yang berasal dari data contoh. */
  isDummyMapping: boolean;
  /** Menandai tahun ajaran dan kelas contoh yang dibuat untuk menampilkan data kurikulum. */
  isDemoOffering?: boolean;
}

export const TAHUN_DEFAULT = "";

const KUNCI_RESET_DATA = "obe-data-kosong-v1";
const KUNCI_IMPORT_SUMBER = "obe-import-sumber-kurikulum-2026-v1";
const KUNCI_HAPUS_DATA_MINING_IT = "obe-hapus-data-mining-it-v1";

function isDataMiningIT(nilai: unknown): nilai is { kode: string; nama: string } {
  if (!nilai || typeof nilai !== "object") return false;
  const item = nilai as { kode?: unknown; nama?: unknown };
  const kode = typeof item.kode === "string" ? item.kode.trim().toUpperCase() : "";
  const nama = typeof item.nama === "string" ? item.nama.trim().toLocaleLowerCase("id-ID") : "";
  return (kode === "IT" || kode === "TI") && nama === "data mining";
}

/** Hapus data lama pada browser sekali agar data contoh tidak muncul lagi. */
function kosongkanDataLokalLama() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(KUNCI_RESET_DATA) === "1") return;
    const kunciObe = Object.keys(window.localStorage).filter((kunci) => kunci.startsWith("obe-"));
    for (const kunci of kunciObe) window.localStorage.removeItem(kunci);
    window.localStorage.setItem(KUNCI_RESET_DATA, "1");
  } catch {
    /* abaikan jika penyimpanan browser tidak tersedia */
  }
}

/** Baca data aplikasi dari penyimpanan browser, lalu gunakan nilai cadangan jika belum tersedia. */
export function bacaDataTersimpan<T>(kunci: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const mentah = window.localStorage.getItem(kunci);
    return mentah ? (JSON.parse(mentah) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Masukkan data sumber satu kali, tanpa mengganti perubahan yang sudah ada di browser. */
function muatDataSumberBerkas() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(KUNCI_IMPORT_SUMBER) === "1") return;

    const bacaArray = <T,>(key: string): T[] => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const nilai = JSON.parse(raw) as unknown;
      return Array.isArray(nilai) ? nilai as T[] : [];
    };
    const gabungDaftar = <T extends { kode: string }>(key: string, seed: T[]) => {
      const daftar = bacaArray<T>(key);
      const kodeAda = new Set(daftar.map((item) => item.kode.toUpperCase()));
      for (const item of seed) {
        if (!kodeAda.has(item.kode.toUpperCase())) {
          daftar.push(item);
          kodeAda.add(item.kode.toUpperCase());
        }
      }
      window.localStorage.setItem(key, JSON.stringify(daftar));
    };

    const mataKuliahTersimpan = bacaArray<MataKuliahItem>("obe-mk");
    const offeringAda = new Set(mataKuliahTersimpan.map((mk) => `${mk.kode.toUpperCase()}::${mk.tahun ?? ""}::${mk.kelas ?? ""}`));
    for (const mk of MK_SEED) {
      const kunci = `${mk.kode.toUpperCase()}::${mk.tahun}::${mk.kelas}`;
      if (!offeringAda.has(kunci)) {
        mataKuliahTersimpan.push(mk);
        offeringAda.add(kunci);
      }
    }
    window.localStorage.setItem("obe-mk", JSON.stringify(mataKuliahTersimpan));

    gabungDaftar("obe-cpl", DAFTAR_CPL);
    gabungDaftar("obe-ik", DAFTAR_IK);
    gabungDaftar("obe-pl", DAFTAR_PL);
    gabungDaftar("obe-asesmen", DAFTAR_ASESMEN);

    const petaSimpan = bacaDataTersimpan<Record<string, Record<string, number>>>("obe-pemetaan-kurikulum", {});
    window.localStorage.setItem("obe-pemetaan-kurikulum", JSON.stringify({ ...PEMETAAN_KURIKULUM_SEED, ...petaSimpan }));

    const strukturSimpan = bacaDataTersimpan<Record<string, StrukturMataKuliah>>("obe-struktur-mk", {});
    for (const [kode, seed] of Object.entries(STRUKTUR_MK_SEED)) {
      const lama = strukturSimpan[kode];
      if (!lama || !Array.isArray(lama.cpmk) || lama.cpmk.length === 0) strukturSimpan[kode] = seed;
    }
    window.localStorage.setItem("obe-struktur-mk", JSON.stringify(strukturSimpan));

    for (const [kode, config] of Object.entries(KONFIGURASI_DOKUMEN_SEED)) {
      const key = kunciConfigDokumen(kode);
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, JSON.stringify(config));
    }

    window.localStorage.setItem(KUNCI_IMPORT_SUMBER, "1");
  } catch {
    /* Data sumber akan dicoba lagi saat aplikasi dimuat berikutnya. */
  }
}

/** Hapus entri lokal Data Mining berkode IT/TI yang tidak berasal dari workbook. */
function hapusDataMiningIT() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(KUNCI_HAPUS_DATA_MINING_IT) === "1") return;

    const bacaRecord = (key: string): Record<string, unknown> => {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null") as unknown;
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed as Record<string, unknown>
          : {};
      } catch {
        return {};
      }
    };
    const daftarMK = bacaDataTersimpan<unknown[]>("obe-mk", []);
    const kodeTerhapus = new Set(
      daftarMK.filter(isDataMiningIT).map((mk) => mk.kode.toUpperCase()),
    );

    if (kodeTerhapus.size > 0) {
      window.localStorage.setItem(
        "obe-mk",
        JSON.stringify(daftarMK.filter((mk) => !isDataMiningIT(mk))),
      );

      for (const key of ["obe-nilai-offering", "obe-pemetaan-kurikulum", "obe-struktur-mk", "obe-tahun-dipilih", "obe-kelas-dipilih"]) {
        const record = bacaRecord(key);
        for (const kode of kodeTerhapus) {
          delete record[kode];
          for (const recordKey of Object.keys(record)) {
            if (recordKey.startsWith(`${kode}::`)) delete record[recordKey];
          }
        }
        window.localStorage.setItem(key, JSON.stringify(record));
      }

      for (const kode of kodeTerhapus) {
        window.localStorage.removeItem(kunciConfigDokumen(kode));
        window.localStorage.removeItem(`obe-dokumen-${kode}`);
      }
    }

    window.localStorage.setItem(KUNCI_HAPUS_DATA_MINING_IT, "1");
  } catch {
    /* Coba lagi jika penyimpanan browser belum tersedia. */
  }
}

/** Kunci dataset nilai untuk satu penawaran MK+tahun. */
export function kunciOffering(kode: string, tahun: string, kelas = "A"): string {
  return `${kode.toUpperCase()}::${tahun.trim()}::${kelas.trim().toUpperCase()}`;
}

/** Daftar tahun yang tersedia untuk satu kode MK, terurut terbaru dulu. */
export function daftarTahunOffering(daftar: MataKuliahItem[], kode: string): string[] {
  const himpunan = new Set(
    daftar.filter((m) => m.kode === kode.toUpperCase()).map((m) => m.tahun.trim()).filter(Boolean),
  );
  return [...himpunan].sort().reverse();
}

/** Penawaran bawaan untuk halaman umum: TI045105 tahun terbaru, atau baris pertama. */
export function offeringTerbaru(daftar: MataKuliahItem[]): { kode: string; tahun: string; kelas: string } {
  const utama = daftar.find((m) => m.kode === "TI045105") ?? daftar[0];
  if (!utama) return { kode: "", tahun: "", kelas: "A" };
  const daftarTahun = daftarTahunOffering(daftar, utama.kode);
  const tahun = daftarTahun[0] ?? utama.tahun;
  const kelas = daftarKelasOffering(daftar, utama.kode, tahun)[0] ?? utama.kelas ?? "A";
  return { kode: utama.kode, tahun, kelas };
}

/** Kelas yang tersedia pada satu kode MK dan tahun ajaran. */
export function daftarKelasOffering(daftar: MataKuliahItem[], kode: string, tahun: string): string[] {
  const tersedia = new Set(
    daftar.filter((m) => m.kode === kode.toUpperCase() && m.tahun === tahun).map((m) => m.kelas),
  );
  return [...DAFTAR_KELAS.filter((kelas) => tersedia.has(kelas)), ...[...tersedia].filter((kelas) => !DAFTAR_KELAS.includes(kelas as (typeof DAFTAR_KELAS)[number])).sort()];
}

function kelasNormal(kelas: string | undefined, fallback = "A"): string {
  const mentah = (kelas ?? "").trim().toUpperCase();
  const cocok = mentah.match(/(?:^|[-\s])([A-D])$/);
  return cocok?.[1] ?? (DAFTAR_KELAS.includes(mentah as (typeof DAFTAR_KELAS)[number]) ? mentah : fallback);
}

/** Kelas aktif per mata kuliah dan tahun ajaran. */
export function kelasAktifUntuk(
  daftar: MataKuliahItem[],
  dipilih: Record<string, string>,
  kode: string,
  tahun: string,
): string {
  const daftarKelas = daftarKelasOffering(daftar, kode, tahun);
  const tersimpan = dipilih[`${kode.toUpperCase()}::${tahun.trim()}`];
  if (tersimpan && daftarKelas.includes(tersimpan)) return tersimpan;
  return daftarKelas[0] ?? "A";
}

/** Tahun aktif untuk satu kode MK: pilihan tersimpan, atau yang terbaru. */
export function tahunAktifUntuk(
  daftar: MataKuliahItem[],
  dipilih: Record<string, string>,
  kode: string,
): string {
  const tersimpan = dipilih[kode.toUpperCase()];
  const daftarTahun = daftarTahunOffering(daftar, kode);
  if (tersimpan && daftarTahun.includes(tersimpan)) return tersimpan;
  return daftarTahun[0] ?? TAHUN_DEFAULT;
}

/** Baris penawaran spesifik (kode+tahun), atau baris pertama kode tersebut. */
export function cariOffering(
  daftar: MataKuliahItem[],
  kode: string,
  tahun: string,
  kelas = "A",
): MataKuliahItem | undefined {
  const atas = kode.toUpperCase();
  return (
    daftar.find((m) => m.kode === atas && m.tahun === tahun && m.kelas === kelas) ??
    daftar.find((m) => m.kode === atas)
  );
}

function normalisasiMK(daftar: Array<Partial<MataKuliahItem> & { kode: string; sksT?: number; sksP?: number }>): MataKuliahItem[] {
  return daftar.map((m) => {
    const kode = (m.kode ?? "").toUpperCase();
    return {
      ...m,
      kode,
      nama: m.nama ?? "",
      semester: typeof m.semester === "number" ? m.semester : null,
      sks: typeof m.sks === "number" ? m.sks : (m.sksT ?? 0) + (m.sksP ?? 0),
      kategori: m.kategori ?? "wajib",
      tahun: (m.tahun ?? "").trim() || TAHUN_DEFAULT,
      dosen: (m.dosen ?? "").trim(),
      kelas: kelasNormal(m.kelas),
      cpl: Array.isArray(m.cpl) ? m.cpl : [],
      bahanKajian: Array.isArray(m.bahanKajian) ? m.bahanKajian : [],
      isDummyMapping: m.isDummyMapping ?? false,
    };
  });
}

/** Benih dataset nilai per penawaran: data lama (bila ada) atau dataset awal per MK+tahun. */
function benihNilaiOffering(daftar: MataKuliahItem[], tersimpan: Record<string, NilaiMap> | null): Record<string, NilaiMap> {
  const nilaiLama = baca<NilaiMap | null>("obe-nilai", null);
  const out: Record<string, NilaiMap> = { ...(tersimpan ?? {}) };
  for (const m of daftar) {
    const kunciBaru = kunciOffering(m.kode, m.tahun, m.kelas);
    if (out[kunciBaru]) continue;
    const kunciLama = `${m.kode.toUpperCase()}::${m.tahun.trim()}`;
    const nilaiMigrasi = m.kelas === "A" ? out[kunciLama] ?? nilaiLama : undefined;
    out[kunciBaru] = nilaiMigrasi
      ? (JSON.parse(JSON.stringify(nilaiMigrasi)) as NilaiMap)
      : nilaiAwalUntuk(m.kode, m.tahun, m.kelas);
  }
  for (const m of daftar) delete out[`${m.kode.toUpperCase()}::${m.tahun.trim()}`];
  return out;
}

/** Daftar MK berasal dari data yang dimasukkan pengguna. */
function daftarMKFinal(): MataKuliahItem[] {
  return normalisasiMK(bacaDataTersimpan<Array<Partial<MataKuliahItem> & { kode: string; sksT?: number; sksP?: number }>>("obe-mk", MK_SEED))
    .filter((mk) => !isDataMiningIT(mk));
}

function strukturMKAwal(daftar: MataKuliahItem[]): Record<string, StrukturMataKuliah> {
  const dasar: Record<string, StrukturMataKuliah> = { ...STRUKTUR_MK_SEED };
  for (const mk of daftar) {
    if (!dasar[mk.kode]) dasar[mk.kode] = buatStrukturDummy(mk);
  }
  const tersimpan = baca<Record<string, StrukturMataKuliah> | null>("obe-struktur-mk", null);
  if (tersimpan) return { ...dasar, ...tersimpan };

  return dasar;
}

function baca<T>(kunci: string, fallback: T): T {
  return bacaDataTersimpan(kunci, fallback);
}

function simpan(kunci: string, nilai: unknown) {
  try {
    window.localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    /* abaikan */
  }
}

interface AppState {
  pengguna: Pengguna | null;
  masuk: (p: Pengguna) => void;
  keluar: () => void;
  /** Dataset nilai per penawaran MK+tahun. Penawaran baru mulai dari template proposal. */
  nilaiUntuk: (kode: string, tahun: string, kelas?: string) => NilaiMap;
  setNilaiOffering: (kode: string, tahun: string, kelas: string, n: NilaiMap) => void;
  resetNilaiOffering: (kode: string, tahun: string, kelas: string) => void;
  /** Tahun ajaran aktif per kode MK (dibagikan hub + nilai + capaian MK). */
  tahunDipilih: Record<string, string>;
  setTahunDipilih: (kode: string, tahun: string) => void;
  kelasDipilih: Record<string, string>;
  setKelasDipilih: (kode: string, tahun: string, kelas: string) => void;
  strukturUntuk: (kode: string) => StrukturMataKuliah;
  simpanStruktur: (kode: string, struktur: StrukturMataKuliah) => void;
  mataKuliah: MataKuliahItem[];
  tambahMK: (mk: MataKuliahItem) => void;
  ubahMK: (kode: string, tahun: string, kelas: string, mk: MataKuliahItem) => void;
  hapusMK: (kode: string, tahun: string, kelas: string) => void;
  daftarAsesmen: Asesmen[];
  setDaftarAsesmen: (d: Asesmen[]) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  kosongkanDataLokalLama();
  muatDataSumberBerkas();
  hapusDataMiningIT();
  // Inisialisasi malas dari localStorage (aman untuk prerender server: baca() mengembalikan fallback).
  const [pengguna, setPengguna] = useState<Pengguna | null>(() => baca<Pengguna | null>("obe-user", null));
  const [mataKuliah, setMataKuliah] = useState<MataKuliahItem[]>(() => daftarMKFinal());
  const [nilaiOffering, setNilaiOfferingState] = useState<Record<string, NilaiMap>>(() => {
    const tersimpan = baca<Record<string, NilaiMap> | null>("obe-nilai-offering", null);
    return benihNilaiOffering(daftarMKFinal(), tersimpan);
  });
  const [tahunDipilih, setTahunDipilihState] = useState<Record<string, string>>(() =>
    baca<Record<string, string>>("obe-tahun-dipilih", {}),
  );
  const [kelasDipilih, setKelasDipilihState] = useState<Record<string, string>>(() =>
    baca<Record<string, string>>("obe-kelas-dipilih", {}),
  );
  const [strukturMK, setStrukturMK] = useState<Record<string, StrukturMataKuliah>>(() => strukturMKAwal(mataKuliah));
  const [daftarAsesmen, setDaftarAsesmen] = useState<Asesmen[]>(() => baca("obe-asesmen", DAFTAR_ASESMEN));

  useEffect(() => {
    simpan("obe-nilai-offering", nilaiOffering);
  }, [nilaiOffering]);
  useEffect(() => {
    simpan("obe-tahun-dipilih", tahunDipilih);
  }, [tahunDipilih]);
  useEffect(() => {
    simpan("obe-kelas-dipilih", kelasDipilih);
  }, [kelasDipilih]);
  useEffect(() => {
    simpan("obe-struktur-mk", strukturMK);
  }, [strukturMK]);
  useEffect(() => {
    simpan("obe-mk", mataKuliah);
  }, [mataKuliah]);
  useEffect(() => {
    simpan("obe-asesmen", daftarAsesmen);
  }, [daftarAsesmen]);

  const masuk = useCallback((p: Pengguna) => {
    setPengguna(p);
    simpan("obe-user", p);
  }, []);

  const keluar = useCallback(() => {
    setPengguna(null);
    try {
      window.localStorage.removeItem("obe-user");
    } catch {
      /* abaikan */
    }
  }, []);

  const nilaiUntuk = useCallback(
    (kode: string, tahun: string, kelas = "A"): NilaiMap => {
      const ada = nilaiOffering[kunciOffering(kode, tahun, kelas)];
      if (ada) return ada;
      return nilaiAwalUntuk(kode, tahun, kelas);
    },
    [nilaiOffering],
  );

  const setNilaiOffering = useCallback((kode: string, tahun: string, kelas: string, n: NilaiMap) => {
    const kunci = kunciOffering(kode, tahun, kelas);
    setNilaiOfferingState((prev) => ({ ...prev, [kunci]: n }));
  }, []);

  const resetNilaiOffering = useCallback((kode: string, tahun: string, kelas: string) => {
    const kunci = kunciOffering(kode, tahun, kelas);
    setNilaiOfferingState((prev) => ({
      ...prev,
      [kunci]: nilaiAwalUntuk(kode, tahun, kelas),
    }));
  }, []);

  const setTahunDipilih = useCallback((kode: string, tahun: string) => {
    setTahunDipilihState((prev) => ({ ...prev, [kode.toUpperCase()]: tahun }));
  }, []);
  const setKelasDipilih = useCallback((kode: string, tahun: string, kelas: string) => {
    setKelasDipilihState((prev) => ({ ...prev, [`${kode.toUpperCase()}::${tahun.trim()}`]: kelas }));
  }, []);

  const strukturUntuk = useCallback(
    (kode: string): StrukturMataKuliah => {
      const atas = kode.toUpperCase();
      if (strukturMK[atas]) return strukturMK[atas];
      const mk = mataKuliah.find((item) => item.kode === atas);
      return buatStrukturDummy(mk ?? { kode: atas, nama: atas, cpl: [] });
    },
    [strukturMK, mataKuliah],
  );
  const simpanStruktur = useCallback((kode: string, struktur: StrukturMataKuliah) => {
    setStrukturMK((prev) => ({ ...prev, [kode.toUpperCase()]: struktur }));
  }, []);

  const tambahMK = useCallback((mk: MataKuliahItem) => {
    const bersih: MataKuliahItem = {
      ...mk,
      kode: mk.kode.toUpperCase(),
      tahun: mk.tahun.trim() || TAHUN_DEFAULT,
      dosen: mk.dosen.trim(),
      cpl: Array.isArray(mk.cpl) ? mk.cpl : [],
      bahanKajian: Array.isArray(mk.bahanKajian) ? mk.bahanKajian : [],
      isDummyMapping: false,
    };
    setMataKuliah((p) => [...p, bersih]);
    // Penawaran baru langsung punya dataset awal sendiri.
    setNilaiOfferingState((prev) => {
      const k = kunciOffering(bersih.kode, bersih.tahun, bersih.kelas);
      if (prev[k]) return prev;
      return { ...prev, [k]: nilaiAwalUntuk(bersih.kode, bersih.tahun, bersih.kelas) };
    });
    setStrukturMK((prev) => prev[bersih.kode] ? prev : ({ ...prev, [bersih.kode]: buatStrukturDummy(bersih) }));
  }, []);
  const ubahMK = useCallback(
    (kode: string, tahun: string, kelas: string, mk: MataKuliahItem) =>
      setMataKuliah((p) =>
        p.map((m) =>
          m.kode === kode.toUpperCase() && m.tahun === tahun && m.kelas === kelas
            ? {
                ...mk,
                kode: kode.toUpperCase(),
                tahun,
                cpl: Array.isArray(mk.cpl) ? mk.cpl : m.cpl,
                bahanKajian: Array.isArray(mk.bahanKajian) ? mk.bahanKajian : m.bahanKajian,
                isDummyMapping: false,
              }
            : m,
        ),
      ),
    [],
  );
  const hapusMK = useCallback((kode: string, tahun: string, kelas: string) => {
    const atas = kode.toUpperCase();
    setMataKuliah((p) => p.filter((m) => !(m.kode === atas && m.tahun === tahun && m.kelas === kelas)));
    // Bersihkan dataset nilai penawaran yang ikut terhapus.
    setNilaiOfferingState((prev) => {
      const salin = { ...prev };
      delete salin[kunciOffering(atas, tahun, kelas)];
      return salin;
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      pengguna,
      masuk,
      keluar,
      nilaiUntuk,
      setNilaiOffering,
      resetNilaiOffering,
      tahunDipilih,
      setTahunDipilih,
      kelasDipilih,
      setKelasDipilih,
      strukturUntuk,
      simpanStruktur,
      mataKuliah,
      tambahMK,
      ubahMK,
      hapusMK,
      daftarAsesmen,
      setDaftarAsesmen,
    }),
    [
      pengguna,
      masuk,
      keluar,
      nilaiUntuk,
      setNilaiOffering,
      resetNilaiOffering,
      tahunDipilih,
      setTahunDipilih,
      kelasDipilih,
      setKelasDipilih,
      strukturUntuk,
      simpanStruktur,
      mataKuliah,
      tambahMK,
      ubahMK,
      hapusMK,
      daftarAsesmen,
      setDaftarAsesmen,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp harus dipakai di dalam <AppProvider>");
  return ctx;
}
