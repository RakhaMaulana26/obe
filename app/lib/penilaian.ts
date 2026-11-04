// Penilaian sesuai lembar penilaian rubrik.docx.
// - Nilai asesmen  = rata-rata biasa indikatornya ("Nilai skor rerata skor").
// - Nilai akhir    = Σ nilai asesmen × bobot komponen / Σ bobot komponen.
// - Skor Sub-CPMK  = rata-rata berbobot indikator yang mengukurnya (tabel distribusi bobot rubrik/RPS).
import type {
  Asesmen,
  AsesmenKode,
  Indikator,
  Mahasiswa,
  NilaiMahasiswa,
  NilaiMap,
  RubrikIndikator,
  StrukturMataKuliah,
  SubCPMK,
} from "./data";

type BobotW = Record<string, Partial<Record<AsesmenKode, number>>>;

const bulat2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Indikator = satu sel input, dibuat untuk setiap pasangan (asesmen, Sub-CPMK) dengan porsi w > 0.
 * - `bobotSub` = porsi w (× porsi indikator rubrik) → bobot di dalam skor Sub-CPMK, berlaku walau bobot Sub-CPMK 0.
 * - `bobot`    = `bobotSub` × bobot Sub-CPMK → bobot terhadap nilai mata kuliah (persen).
 * Perubahan di halaman Bobot tetap berlaku; pasangan dengan beberapa indikator rubrik dibagi sesuai porsinya.
 */
export function daftarIndikator(sub: SubCPMK[], bobotW: BobotW, asesmen: Asesmen[], rubrik: RubrikIndikator[] = []): Indikator[] {
  const out: Indikator[] = [];
  for (const a of asesmen) {
    for (const s of sub) {
      const porsiW = bobotW[s.kode]?.[a.kode] ?? 0;
      if (!(porsiW > 0)) continue;
      const bobotSubCPMK = s.bobot > 0 ? s.bobot : 0;
      const dariRubrik = rubrik.filter((r) => r.asesmen === a.kode && r.sub === s.kode);
      if (dariRubrik.length <= 1) {
        out.push({
          asesmen: a.kode,
          sub: s.kode,
          kunci: s.kode,
          label: dariRubrik[0]?.label ?? s.kode,
          bobot: porsiW * bobotSubCPMK,
          bobotSub: porsiW,
          tingkat: dariRubrik[0]?.tingkat ?? [],
        });
        continue;
      }
      const totalPorsi = dariRubrik.reduce((t, r) => t + (r.porsi > 0 ? r.porsi : 0), 0);
      dariRubrik.forEach((r, i) => {
        const porsi = totalPorsi > 0 ? (r.porsi > 0 ? r.porsi : 0) / totalPorsi : 1 / dariRubrik.length;
        out.push({
          asesmen: a.kode,
          sub: s.kode,
          kunci: `${s.kode}#${i + 1}`,
          label: r.label,
          bobot: porsiW * porsi * bobotSubCPMK,
          bobotSub: porsiW * porsi,
          tingkat: r.tingkat,
        });
      });
    }
  }
  return out;
}

/** Nilai satu indikator; kunci `#k` yang belum ada memakai nilai format lama di kunci Sub-CPMK. Sel kosong/NaN = 0. */
export function ambilNilai(nilai: NilaiMahasiswa, ind: Indikator): number {
  const peta = nilai[ind.asesmen];
  let v = peta?.[ind.kunci];
  if (v === undefined && ind.kunci !== ind.sub) v = peta?.[ind.sub];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Bobot komponen = jumlah bobot indikatornya (TI045105: Kuis 10, Laporan 30, Mini Project 10, Mid 25, Post 25). */
export function bobotAsesmen(indikator: Indikator[]): Partial<Record<AsesmenKode, number>> {
  const out: Partial<Record<AsesmenKode, number>> = {};
  for (const ind of indikator) out[ind.asesmen] = (out[ind.asesmen] ?? 0) + ind.bobot;
  return out;
}

/** Nilai tiap asesmen = rata-rata biasa indikatornya. */
export function nilaiPerAsesmen(nilai: NilaiMahasiswa, indikator: Indikator[]): Partial<Record<AsesmenKode, number>> {
  const jumlah: Partial<Record<AsesmenKode, number>> = {};
  const banyak: Partial<Record<AsesmenKode, number>> = {};
  for (const ind of indikator) {
    jumlah[ind.asesmen] = (jumlah[ind.asesmen] ?? 0) + ambilNilai(nilai, ind);
    banyak[ind.asesmen] = (banyak[ind.asesmen] ?? 0) + 1;
  }
  const out: Partial<Record<AsesmenKode, number>> = {};
  for (const a of Object.keys(jumlah) as AsesmenKode[]) out[a] = bulat2((jumlah[a] ?? 0) / (banyak[a] ?? 1));
  return out;
}

/** Nilai akhir MK sesuai lembar rubrik: Σ nilai asesmen × bobot komponen / Σ bobot komponen. */
export function hitungNilaiAkhirRubrik(nilai: NilaiMahasiswa, indikator: Indikator[]): number {
  const bobot = bobotAsesmen(indikator);
  const totalBobot = Object.values(bobot).reduce((t, b) => t + (b ?? 0), 0);
  if (!(totalBobot > 0)) return 0;
  const jumlah: Partial<Record<AsesmenKode, number>> = {};
  const banyak: Partial<Record<AsesmenKode, number>> = {};
  for (const ind of indikator) {
    jumlah[ind.asesmen] = (jumlah[ind.asesmen] ?? 0) + ambilNilai(nilai, ind);
    banyak[ind.asesmen] = (banyak[ind.asesmen] ?? 0) + 1;
  }
  let total = 0;
  for (const a of Object.keys(bobot) as AsesmenKode[]) total += ((jumlah[a] ?? 0) / (banyak[a] ?? 1)) * (bobot[a] ?? 0);
  return bulat2(total / totalBobot);
}

/** Skor Sub-CPMK = rata-rata berbobot indikator yang mengukurnya. Sub-CPMK tanpa indikator = 0. */
export function hitungSubDariIndikator(nilai: NilaiMahasiswa, indikator: Indikator[], subList: SubCPMK[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of subList) {
    const milik = indikator.filter((i) => i.sub === s.kode);
    const totalBobot = milik.reduce((t, i) => t + i.bobotSub, 0);
    out[s.kode] = totalBobot > 0 ? bulat2(milik.reduce((t, i) => t + ambilNilai(nilai, i) * i.bobotSub, 0) / totalBobot) : 0;
  }
  return out;
}

/**
 * Daftar asesmen untuk perhitungan: daftar dasar ditambah kode asesmen lain yang dipakai di bobot
 * (mis. asesmen yang ditambahkan dosen di halaman Struktur), agar halaman nilai dan mesin hitung sama.
 */
export function asesmenDariBobot(bobotW: BobotW, dasar: Asesmen[]): Asesmen[] {
  const ada = new Set(dasar.map((a) => a.kode));
  const tambahan: Asesmen[] = [];
  for (const peta of Object.values(bobotW)) {
    for (const [kode, w] of Object.entries(peta)) {
      if ((w ?? 0) > 0 && !ada.has(kode as AsesmenKode)) {
        ada.add(kode as AsesmenKode);
        tambahan.push({ kode: kode as AsesmenKode, nama: kode, deskripsi: "" });
      }
    }
  }
  return [...dasar, ...tambahan];
}

/** Simpan nilai satu kelas tanpa menghapus NRP lain yang tersimpan; penghapusan hanya lewat hapus mahasiswa. */
export function gabungNilai(lama: NilaiMap | undefined, baru: NilaiMap): NilaiMap {
  return { ...(lama ?? {}), ...baru };
}

/** Struktur tersimpan sebelum rubrik ditambahkan dilengkapi dari acuan (seed). */
export function lengkapiRubrik(struktur: StrukturMataKuliah, acuan?: StrukturMataKuliah): StrukturMataKuliah {
  if (struktur.rubrik || !acuan?.rubrik) return struktur;
  return { ...struktur, rubrik: acuan.rubrik };
}

/** Hanya NRP yang ada di daftar mahasiswa yang dihitung di statistik. */
export function saringRoster(nilai: NilaiMap, roster: Mahasiswa[]): NilaiMap {
  const nrp = new Set(roster.map((m) => m.nrp));
  return Object.fromEntries(Object.entries(nilai).filter(([k]) => nrp.has(k)));
}
