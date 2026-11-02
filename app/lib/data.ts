import kurikulum2026 from "./sumber-kurikulum-2026.json";
import rpsRubrikDataMining from "./sumber-dokumen-datamining.json";
import { turunkanBobotU } from "./bobot";

export type AsesmenKode = "T1" | "T2" | "T3" | "T4" | "Prak" | "ETS" | "EAS";
export type KategoriMataKuliah = "wajib" | "pilihan-institusi" | "pilihan-prodi" | "belum-ditetapkan";

export interface Asesmen {
  kode: AsesmenKode;
  nama: string;
  deskripsi: string;
}

export interface SubCPMK {
  kode: string;
  nomor: number;
  deskripsi: string;
  level: string;
  cpmk: string;
  v: number;
  /** Bobot Sub-CPMK terhadap mata kuliah, dalam persen (RPS: 5, 15, …). */
  bobot: number;
  isDummy?: boolean;
}

export interface CPMK {
  kode: string;
  deskripsi: string;
  isDummy?: boolean;
}

export interface IK {
  kode: string;
  deskripsi: string;
  cpl: string;
  z: number;
  isDummy?: boolean;
}

export interface CPL {
  kode: string;
  deskripsiSingkat: string;
  deskripsi: string;
}

export interface PL {
  kode: string;
  nama: string;
  deskripsi: string;
}

export interface PPM {
  kode: string;
  deskripsi: string;
}

export interface BOK {
  kode: string;
  nama: string;
  deskripsi: string;
  isDummy: true;
}

export interface Rubrik {
  kode: string;
  kriteria: string;
  bobot: number;
  level: Record<1 | 2 | 3 | 4, string>;
  isDummy: true;
}

export interface Mahasiswa {
  nrp: string;
  nama: string;
  kelas: string;
}

export const DAFTAR_KELAS = ["A", "B", "C", "D"] as const;

export type NilaiMap = Record<string, Record<AsesmenKode, number>>;

export interface KurikulumMataKuliah {
  kode: string;
  nama: string;
  semester: number | null;
  sks: number;
  kategori: KategoriMataKuliah;
}

interface DataKurikulum2026 {
  sumber: string;
  visi: string;
  misi: string[];
  gae: Array<{ kode: string; nama: string }>;
  ppm: PPM[];
  profilLulusan: PL[];
  cpl: Array<{ kode: string; deskripsi: string }>;
  ik: Array<{ kode: string; deskripsi: string; cpl: string }>;
  mataKuliah: Array<{ kode: string; nama: string; sks: number; bobotIK: Record<string, number> }>;
}

interface DataRPSRubrikDataMining {
  mataKuliah: {
    kode: string;
    nama: string;
    semester: number;
    sksTeori: string;
    sksPraktik: string;
    dosen: string;
    bahanKajian: string[];
  };
  cpmk: CPMK[];
  sub: Array<{ kode: string; deskripsi: string; level: string; cpmk: string; bobot: number }>;
  bobotRubrik: Record<string, Record<"kuis" | "laporan" | "proyek" | "mid" | "post", number>>;
  ikCpmk: Record<string, Record<string, number>>;
}

const DATA_KURIKULUM = kurikulum2026 as unknown as DataKurikulum2026;
const DATA_RPS_DATAMINING = rpsRubrikDataMining as DataRPSRubrikDataMining;
const KODE_MK_DATAMINING = DATA_RPS_DATAMINING.mataKuliah.kode;

// Sumber identitas dan capaian prodi berasal dari workbook Kurikulum 2026.
export const SUMBER_DATA = `${DATA_KURIKULUM.sumber}; rps.docx; rubrik.docx`;
export const LEMBAR_SUMBER_KOSONG: string[] = [];
export const VISI_PRODI = DATA_KURIKULUM.visi;
export const MISI_PRODI = DATA_KURIKULUM.misi;
export const DAFTAR_GAE_IABEE = DATA_KURIKULUM.gae;
export const DAFTAR_PPM = DATA_KURIKULUM.ppm;
export const DAFTAR_PL = DATA_KURIKULUM.profilLulusan;
export const DAFTAR_CPL: CPL[] = DATA_KURIKULUM.cpl.map((cpl) => ({
  kode: cpl.kode,
  deskripsiSingkat: cpl.kode.replace(/^CPL/, "CPL "),
  deskripsi: cpl.deskripsi,
}));

const jumlahIKPerCPL = DATA_KURIKULUM.ik.reduce<Record<string, number>>((jumlah, ik) => {
  jumlah[ik.cpl] = (jumlah[ik.cpl] ?? 0) + 1;
  return jumlah;
}, {});

// Workbook tidak memuat porsi z; digunakan pembagian rata per IK dalam CPL agar total z per CPL = 1.
export const DAFTAR_IK: IK[] = DATA_KURIKULUM.ik.map((ik) => ({
  ...ik,
  z: 1 / (jumlahIKPerCPL[ik.cpl] || 1),
}));

export const DAFTAR_CPMK: CPMK[] = DATA_RPS_DATAMINING.cpmk;

const bobotSubPerCPMK = DATA_RPS_DATAMINING.sub.reduce<Record<string, number>>((jumlah, sub) => {
  jumlah[sub.cpmk] = (jumlah[sub.cpmk] ?? 0) + sub.bobot;
  return jumlah;
}, {});

export const DAFTAR_SUB_CPMK: SubCPMK[] = DATA_RPS_DATAMINING.sub.map((sub, indeks) => ({
  kode: sub.kode,
  nomor: indeks + 1,
  deskripsi: sub.deskripsi,
  level: sub.level,
  cpmk: sub.cpmk,
  // Bobot v tidak ditulis langsung di RPS; proporsinya diturunkan dari bobot Sub-CPMK terhadap MK.
  v: bobotSubPerCPMK[sub.cpmk] ? sub.bobot / bobotSubPerCPMK[sub.cpmk] : 0,
  bobot: sub.bobot,
}));

const KODE_ASESMEN_RUBRIK: Record<"kuis" | "laporan" | "proyek" | "mid" | "post", AsesmenKode> = {
  kuis: "T1",
  laporan: "T2",
  proyek: "T3",
  mid: "ETS",
  post: "EAS",
};

export const DAFTAR_ASESMEN: Asesmen[] = [
  { kode: "T1", nama: "Kuis", deskripsi: "Kuis 1–3: konsep Data Mining, k-NN, dan Apriori." },
  { kode: "T2", nama: "Laporan Praktikum", deskripsi: "Laporan praktikum Eval-1 sampai Eval-7." },
  { kode: "T3", nama: "Mini Project", deskripsi: "Mini project kelompok aplikasi mesin pencarian." },
  { kode: "ETS", nama: "Mid Test", deskripsi: "Tes teori dan praktik untuk Sub-CPMK 1–4." },
  { kode: "EAS", nama: "Post Test", deskripsi: "Tes teori dan praktik untuk Sub-CPMK 5–8." },
];

// Bobot asesmen pada tiap Sub-CPMK dinormalisasi dari distribusi persentase pada rubrik.
export const BOBOT_W: Record<string, Partial<Record<AsesmenKode, number>>> = Object.fromEntries(
  Object.entries(DATA_RPS_DATAMINING.bobotRubrik).map(([kodeSub, bobot]) => {
    const total = Object.values(bobot).reduce((jumlah, nilai) => jumlah + nilai, 0);
    const porsi = Object.fromEntries(
      Object.entries(KODE_ASESMEN_RUBRIK)
        .map(([kategori, kodeAsesmen]) => [kodeAsesmen, total ? bobot[kategori as keyof typeof bobot] / total : 0])
        .filter(([, nilai]) => Number(nilai) > 0),
    ) as Partial<Record<AsesmenKode, number>>;
    return [kodeSub, porsi];
  }),
);
// JSON menyimpan matriks RPS sebagai [ik][cpmk]; mesin hitung membaca [cpmk][ik].
// Centang diambil dari JSON, nilainya diturunkan dari bobot Sub-CPMK (CPMK.1 = 20%, CPMK.2 = 30%, …).
const CENTANG_CPMK_IK: Record<string, string[]> = {};
for (const [kodeIK, petaCPMK] of Object.entries(DATA_RPS_DATAMINING.ikCpmk)) {
  for (const [kodeCPMK, nilai] of Object.entries(petaCPMK)) {
    if (nilai > 0) (CENTANG_CPMK_IK[kodeCPMK] ??= []).push(kodeIK);
  }
}
export const BOBOT_U: Record<string, Partial<Record<string, number>>> = turunkanBobotU(DAFTAR_SUB_CPMK, CENTANG_CPMK_IK);

export const PEMETAAN_KURIKULUM_SEED: Record<string, Record<string, number>> = Object.fromEntries(
  DATA_KURIKULUM.mataKuliah.map((mk) => [mk.kode, mk.bobotIK]),
);

export interface StrukturMataKuliah {
  cpmk: CPMK[];
  sub: SubCPMK[];
  bobotW: Record<string, Partial<Record<AsesmenKode, number>>>;
  bobotU: Record<string, Partial<Record<string, number>>>;
}

export const DAFTAR_RUBRIK: Rubrik[] = [];
export const KURIKULUM_MK: KurikulumMataKuliah[] = DATA_KURIKULUM.mataKuliah.map((mk) => ({
  kode: mk.kode,
  nama: mk.nama,
  semester: mk.kode === KODE_MK_DATAMINING ? DATA_RPS_DATAMINING.mataKuliah.semester : null,
  sks: mk.sks,
  kategori: "belum-ditetapkan",
}));

interface KatalogMK extends KurikulumMataKuliah {
  kelas: string;
  cpl: string[];
  bahanKajian: string[];
  isDummyMapping: boolean;
  isDemoOffering: boolean;
}

const MATERI_DATAMINING = DATA_RPS_DATAMINING.mataKuliah.bahanKajian.filter((materi) => !materi.startsWith("(Pustaka"));

export const KATALOG_MK: KatalogMK[] = KURIKULUM_MK.map((mk) => {
  const sumber = DATA_KURIKULUM.mataKuliah.find((item) => item.kode === mk.kode);
  const cpl = [...new Set(Object.keys(sumber?.bobotIK ?? {})
    .map((kodeIK) => DAFTAR_IK.find((ik) => ik.kode === kodeIK)?.cpl)
    .filter((kode): kode is string => Boolean(kode)))];
  const isDataMining = mk.kode === KODE_MK_DATAMINING;
  return {
    ...mk,
    kelas: "A",
    cpl,
    bahanKajian: isDataMining ? MATERI_DATAMINING : [],
    isDummyMapping: false,
    isDemoOffering: true,
  };
});
export const MATA_KULIAH: KatalogMK | undefined = KATALOG_MK.find((mk) => mk.kode === KODE_MK_DATAMINING);
// Workbook hanya berjudul Kurikulum 2026, bukan tahun penawaran; tahun ajaran di bawah hanya konteks demo UI.
export const TAHUN_SEED: readonly string[] = ["2026/2027"];
export const DAFTAR_DOSEN: string[] = [...new Set(DATA_RPS_DATAMINING.mataKuliah.dosen.split(/\s+dan\s+/).map((nama) => nama.trim()).filter(Boolean))];

export interface SeedMK extends KatalogMK {
  tahun: string;
  dosen: string;
}

export const MK_SEED: SeedMK[] = KATALOG_MK.map((mk) => ({
  ...mk,
  tahun: "2026/2027",
  dosen: mk.kode === KODE_MK_DATAMINING ? DATA_RPS_DATAMINING.mataKuliah.dosen : "",
}));

export function buatStrukturDummy(mk: Pick<SeedMK, "kode" | "nama" | "cpl"> & { bahanKajian?: string[] }): StrukturMataKuliah {
  const struktur = STRUKTUR_MK_SEED[mk.kode.toUpperCase()];
  if (struktur) return struktur;
  return { cpmk: [], sub: [], bobotW: {}, bobotU: {} };
}

export const STRUKTUR_MK_SEED: Record<string, StrukturMataKuliah> = {
  [KODE_MK_DATAMINING]: {
    cpmk: DAFTAR_CPMK,
    sub: DAFTAR_SUB_CPMK,
    bobotW: BOBOT_W,
    bobotU: BOBOT_U,
  },
};

export interface RPSSeed {
  kodeMK: string;
  namaMK: string;
  cpmk: string[];
  bahanKajian: string[];
  metode: string;
  isDummy: boolean;
}

export const RPS_SEED: RPSSeed[] = [{
  kodeMK: KODE_MK_DATAMINING,
  namaMK: DATA_RPS_DATAMINING.mataKuliah.nama,
  cpmk: DAFTAR_CPMK.map((cpmk) => cpmk.deskripsi),
  bahanKajian: MATERI_DATAMINING,
  metode: "Kuliah tatap muka, praktikum laboratorium, kelas sinkron daring, dan mini project sesuai RPS Mingguan.",
  isDummy: false,
}];
export const DAFTAR_MAHASISWA: Mahasiswa[] = [];

export function mahasiswaUntukKelas(_kelas: string): Mahasiswa[] {
  return [];
}

export function nilaiAwalUntuk(_kode: string, _tahun: string, _kelas = "A"): NilaiMap {
  return {};
}

export const NILAI_AWAL: NilaiMap = {};

export interface GradeRow {
  min: number;
  max: number;
  huruf: string;
  kualitas: number;
}

export const TABEL_GRADE: GradeRow[] = [];
export const AMBANG_DEFAULT = 60;

// Akun demo dipertahankan hanya sebagai akses awal ke aplikasi lokal.
export const AKUN_DEMO = [
  { email: "dosen@pens.ac.id", password: "password123", nama: "Dosen Demo", peran: "Dosen" as const },
  { email: "prodi@pens.ac.id", password: "password123", nama: "Admin Prodi Demo", peran: "Prodi" as const },
  { email: "admin@example.com", password: "password123", nama: "Administrator Demo", peran: "Dosen" as const },
];
