import kurikulum2026 from "./sumber-kurikulum-2026.json";
import rpsRubrikDataMining from "./sumber-dokumen-datamining.json";
import { turunkanBobotU } from "./bobot";

export type AsesmenKode = "T1" | "T2" | "T3" | "ETS" | "EAS";
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

/** Nilai satu mahasiswa: nilai[asesmen][kodeSubCPMK] (0–100), sesuai lembar penilaian rubrik. */
export type NilaiMahasiswa = Partial<Record<AsesmenKode, Record<string, number>>>;
/** Kunci = NRP. */
export type NilaiMap = Record<string, NilaiMahasiswa>;

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

export const MK_SEED: SeedMK[] = KATALOG_MK.flatMap((mk) => {
  const seed = {
    ...mk,
    tahun: "2026/2027",
    dosen: mk.kode === KODE_MK_DATAMINING ? DATA_RPS_DATAMINING.mataKuliah.dosen : "",
  };
  return mk.kode === KODE_MK_DATAMINING
    ? [{ ...seed, kelas: "A" }, { ...seed, kelas: "B" }]
    : [seed];
});

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

export const DAFTAR_MAHASISWA: Mahasiswa[] = [
  { nrp: "3123600001", nama: "Muhammad Rafi Rizaldi", kelas: "A" },
  { nrp: "3123600002", nama: "Lintang Arum Sari", kelas: "A" },
  { nrp: "3123600003", nama: "Zalfail Mumtaza Attamami", kelas: "A" },
  { nrp: "3123600004", nama: "Muhammad Fajar Siddiq", kelas: "A" },
  { nrp: "3123600005", nama: "Ivan Rahmat Prakasa", kelas: "A" },
  { nrp: "3123600006", nama: "Fransiska Elsa Dina Mareta", kelas: "A" },
  { nrp: "3123600007", nama: "Rifki Alaudin", kelas: "A" },
  { nrp: "3123600008", nama: "Salwa Fadhila Rahmania", kelas: "A" },
  { nrp: "3123600009", nama: "Kansa Adeneva Riti Syarani", kelas: "A" },
  { nrp: "3123600010", nama: "Yofi Yudistian", kelas: "A" },
  { nrp: "3123600011", nama: "Mohammad Rizaldy Ramadhan", kelas: "A" },
  { nrp: "3123600012", nama: "Adrian Mendienta Tumanggor", kelas: "A" },
  { nrp: "3123600013", nama: "Nanda Ahmad Zidan", kelas: "A" },
  { nrp: "3123600014", nama: "Shalsabilla Wahyu Arifhana", kelas: "A" },
  { nrp: "3123600015", nama: "Nayla Herfiana Putri", kelas: "A" },
  { nrp: "3123600016", nama: "Muhammad Alif Aditya", kelas: "A" },
  { nrp: "3123600017", nama: "Salma Afifa Azis", kelas: "A" },
  { nrp: "3123600018", nama: "Eugenia Valiant Van True", kelas: "A" },
  { nrp: "3123600019", nama: "Raihan Malano Arrasyid", kelas: "A" },
  { nrp: "3123600020", nama: "Vemas Satria Edy Pratama", kelas: "A" },
  { nrp: "3123600021", nama: "Muhammad Zaidan Zhafiz Satrianto", kelas: "A" },
  { nrp: "3123600022", nama: "George Winston Kalim", kelas: "A" },
  { nrp: "3123600023", nama: "Muhammad Felda Hibatullah", kelas: "A" },
  { nrp: "3123600024", nama: "Shafrial Azis", kelas: "A" },
  { nrp: "3123600025", nama: "Moch. Alif Akbar", kelas: "A" },
  { nrp: "3123600026", nama: "Renaldy Izza Briliandin Tino Saputra", kelas: "A" },
  { nrp: "3123600027", nama: "Muhammad Raihan Ghani", kelas: "A" },
  { nrp: "3123600028", nama: "Muhammad Zaky Mubarok", kelas: "A" },
  { nrp: "3123600029", nama: "Mohammad Zidan Wianto Putra", kelas: "A" },
  { nrp: "3123600030", nama: "Aldino Matasik", kelas: "A" },
  { nrp: "3123600031", nama: "Dwi Indah Cahyani", kelas: "B" },
  { nrp: "3123600032", nama: "Aulia Syfa Ramadhani", kelas: "B" },
  { nrp: "3123600033", nama: "Sarah Rizqi Firyal", kelas: "B" },
  { nrp: "3123600034", nama: "Yeremia Christian Candra Octaviano", kelas: "B" },
  { nrp: "3123600035", nama: "Naufal Zhafransyah Setiawan", kelas: "B" },
  { nrp: "3123600036", nama: "Eka Danis Saputri", kelas: "B" },
  { nrp: "3123600037", nama: "Tiara Vania Wijaya Putri", kelas: "B" },
  { nrp: "3123600038", nama: "Alfansyah Ahmad Al Ghozaly", kelas: "B" },
  { nrp: "3123600039", nama: "Halimatuz Zahra Sakin Sabilla", kelas: "B" },
  { nrp: "3123600040", nama: "Nurul Fatimah Azmi", kelas: "B" },
  { nrp: "3123600041", nama: "Marcel Dwi Astika", kelas: "B" },
  { nrp: "3123600042", nama: "Saifullah Ahmad Musyanto", kelas: "B" },
  { nrp: "3123600043", nama: "Ridho Fahrizal", kelas: "B" },
  { nrp: "3123600044", nama: "Muhammad Farhan Hibatullah Akbar", kelas: "B" },
  { nrp: "3123600045", nama: "Mohammad Farrel Ponco Hutomo", kelas: "B" },
  { nrp: "3123600046", nama: "Moh. Nizar Nugraha Adi", kelas: "B" },
  { nrp: "3123600047", nama: "Muhammad Ayman Fahad", kelas: "B" },
  { nrp: "3123600048", nama: "Rakha Maulana Kaysah Putra", kelas: "B" },
  { nrp: "3123600049", nama: "Sonny Kurniadi", kelas: "B" },
  { nrp: "3123600050", nama: "Ali Akbar Nafis", kelas: "B" },
  { nrp: "3123600051", nama: "M. Filsaf Aelang Abilt", kelas: "B" },
  { nrp: "3123600052", nama: "Rangga Rizqy Awanda Putra", kelas: "B" },
  { nrp: "3123600053", nama: "Nickolas Yudistira Krisando", kelas: "B" },
  { nrp: "3123600054", nama: "Julio Betara Affandi", kelas: "B" },
  { nrp: "3123600055", nama: "Andhika Fadli Bhaskara", kelas: "B" },
  { nrp: "3123600056", nama: "Muhammad Satrio Asadel", kelas: "B" },
  { nrp: "3123600058", nama: "Aisha Sabina", kelas: "B" },
  { nrp: "3123600060", nama: "Ibrahim Ahmad Al-'Ashim", kelas: "B" },
];

export function nilaiAwalUntuk(kode: string, _tahun: string, kelas = "A"): NilaiMap {
  const kelasAktif = kelas.toUpperCase();
  if (kode.toUpperCase() !== KODE_MK_DATAMINING || !["A", "B"].includes(kelasAktif)) return {};
  return Object.fromEntries(
    DAFTAR_MAHASISWA.filter((mahasiswa) => mahasiswa.kelas === kelasAktif)
      .map((mahasiswa) => [mahasiswa.nrp, {}]),
  );
}

export const NILAI_AWAL: NilaiMap = {};

export interface GradeRow {
  min: number;
  max: number;
  huruf: string;
  kualitas: number;
}

// Skala nilai huruf dari lembar penilaian rubrik.docx. Batas 86 tertulis di dua rentang (AB 76–86, A 86–100);
// di sini 86 masuk A. `max` hanya untuk tampilan rentang — konversi memakai `min` saja agar nilai desimal tidak jatuh ke celah.
export const TABEL_GRADE: GradeRow[] = [
  { min: 86, max: 100, huruf: "A", kualitas: 4 },
  { min: 76, max: 85.99, huruf: "AB", kualitas: 3.5 },
  { min: 66, max: 75.99, huruf: "B", kualitas: 3 },
  { min: 61, max: 65.99, huruf: "BC", kualitas: 2.5 },
  { min: 56, max: 60.99, huruf: "C", kualitas: 2 },
  { min: 41, max: 55.99, huruf: "D", kualitas: 1 },
  { min: 0, max: 40.99, huruf: "E", kualitas: 0 },
];
export const AMBANG_DEFAULT = 60;

// Akun demo dipertahankan hanya sebagai akses awal ke aplikasi lokal.
export const AKUN_DEMO = [
  { email: "dosen@pens.ac.id", password: "password123", nama: "Dosen Demo", peran: "Dosen" as const },
  { email: "prodi@pens.ac.id", password: "password123", nama: "Admin Prodi Demo", peran: "Prodi" as const },
  { email: "admin@example.com", password: "password123", nama: "Administrator Demo", peran: "Dosen" as const },
];
