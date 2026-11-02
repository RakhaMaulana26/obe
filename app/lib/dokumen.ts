import type { CPL, IK, StrukturMataKuliah } from "./data";

export const KATEGORI_RUBRIK = ["kuis", "laporan", "proyek", "mid", "post"] as const;
export type KategoriRubrik = (typeof KATEGORI_RUBRIK)[number];

export const LABEL_KATEGORI_RUBRIK: Record<KategoriRubrik, string> = {
  kuis: "Kuis",
  laporan: "Laporan Praktikum",
  proyek: "Mini Project",
  mid: "Mid Test",
  post: "Post Test",
};

export interface DataRPSUmum {
  rumpun: string;
  sksTeori: string;
  sksPraktik: string;
  tanggal: string;
  pengembang: string;
  koordinator: string;
  kaprodi: string;
  deskripsi: string;
  referensiUtama: string;
  referensiPendukung: string;
  prasyarat: string;
}

export interface RencanaSubCPMK {
  pertemuan: string;
  indikator: string;
  kriteria: string;
  tatapMuka: string;
  daring: string;
  materi: string;
}

export interface RencanaTugasRubrik {
  judul: string;
  bentuk: string;
  waktu: string;
  deskripsi: string;
  metode: string;
  luaran: string;
  indikator: string;
  jadwal: string;
  lain: string;
}

export interface RubrikKriteriaDokumen {
  indikator: string;
  bobot: number;
  tingkat: string[];
}

export interface DokumenMKConfig {
  umum: DataRPSUmum;
  rencanaSub: Record<string, RencanaSubCPMK>;
  bobotRubrik: Record<string, Record<KategoriRubrik, number>>;
  tugasRubrik: Record<KategoriRubrik, RencanaTugasRubrik>;
  rubrikUmum?: Partial<Record<KategoriRubrik, string[]>>;
  rubrikDetail?: Partial<Record<KategoriRubrik, Record<string, RubrikKriteriaDokumen[]>>>;
  rpsUjian?: Partial<Record<"mid" | "post", string>>;
  judulKustom?: Partial<Record<string, string>>;
}

export interface MataKuliahDokumen {
  kode: string;
  nama: string;
  semester: number | null;
  sks: number;
  tahun: string;
  kelas: string;
  dosen: string;
  cpl: string[];
}

export interface PayloadGeneratorDokumen {
  jenis: "rps" | "rubrik";
  mataKuliah: MataKuliahDokumen;
  struktur: StrukturMataKuliah;
  cpl: CPL[];
  ik: IK[];
  pemetaanKurikulum: Record<string, Record<string, number>>;
  konfigurasi: DokumenMKConfig;
}
