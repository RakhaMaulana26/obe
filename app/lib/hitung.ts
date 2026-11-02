// Mesin perhitungan Weighted Scoring berjenjang (Persamaan 3.1 – 3.5 proposal).
import {
  AMBANG_DEFAULT,
  BOBOT_U,
  BOBOT_W,
  DAFTAR_CPL,
  DAFTAR_CPMK,
  DAFTAR_IK,
  DAFTAR_SUB_CPMK,
  TABEL_GRADE,
  type AsesmenKode,
  type NilaiMap,
  type SubCPMK,
} from "./data";

export function konversiHuruf(skor: number): { huruf: string; kualitas: number } {
  const row = TABEL_GRADE.find((r) => skor >= r.min && skor <= r.max) ?? TABEL_GRADE[TABEL_GRADE.length - 1];
  if (!row) return { huruf: "", kualitas: 0 };
  return { huruf: row.huruf, kualitas: row.kualitas };
}

export function statusCapaian(skor: number, ambang = AMBANG_DEFAULT): "Tercapai" | "Belum" {
  return skor >= ambang ? "Tercapai" : "Belum";
}

export interface CapaianMahasiswa {
  nrp: string;
  sub: Record<string, number>; // S1..S10
  cpmk: Record<string, number>;
  ik: Record<string, number>; // IK-1..5
  cpl: Record<string, number>;
}

type BobotW = Record<string, Partial<Record<AsesmenKode, number>>>;

/** Persamaan (3.1): S_Sub_j = Σ n_i · w_ij */
export function hitungSub(
  nilai: Record<AsesmenKode, number>,
  bobotW?: BobotW,
  subList: SubCPMK[] = DAFTAR_SUB_CPMK,
): Record<string, number> {
  const out: Record<string, number> = {};
  const bobotAktif = bobotW ?? BOBOT_W;
  for (const s of subList) {
    const w = bobotAktif[s.kode] ?? {};
    let total = 0;
    for (const [kode, b] of Object.entries(w)) {
      total += (nilai[kode as AsesmenKode] ?? 0) * (b ?? 0);
    }
    out[s.kode] = round2(total);
  }
  return out;
}

/** Persamaan (3.2): S_CPMK_k = Σ S_Sub_j · v_jk */
export function hitungCPMK(
  sub: Record<string, number>,
  subList: SubCPMK[] = DAFTAR_SUB_CPMK,
  cpmkList: { kode: string }[] = DAFTAR_CPMK,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of cpmkList) {
    const penyusun = subList.filter((s) => s.cpmk === item.kode);
    let total = 0;
    for (const s of penyusun) total += (sub[s.kode] ?? 0) * s.v;
    out[item.kode] = round2(total);
  }
  return out;
}

/** Persamaan (3.3): S_IK_l = Σ S_CPMK_k · u_kl */
export function hitungIK(
  cpmk: Record<string, number>,
  bobotU: Record<string, Partial<Record<string, number>>> = BOBOT_U,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ik of DAFTAR_IK) {
    let total = 0;
    for (const [kodeCpmk, peta] of Object.entries(bobotU)) {
      const b = peta[ik.kode];
      if (b) total += (cpmk[kodeCpmk] ?? 0) * b;
    }
    out[ik.kode] = round2(total);
  }
  return out;
}

/** Persamaan (3.4): S_CPL_m = Σ S_IK_l · z_lm */
export function hitungCPL(ik: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cpl of DAFTAR_CPL) {
    const penyusun = DAFTAR_IK.filter((i) => i.cpl === cpl.kode);
    let total = 0;
    for (const i of penyusun) total += (ik[i.kode] ?? 0) * i.z;
    out[cpl.kode] = round2(total);
  }
  return out;
}

export function hitungCapaianSatuMahasiswa(
  nilai: Record<AsesmenKode, number>,
  bobot?: { w?: BobotW; u?: Record<string, Partial<Record<string, number>>> },
  subList: SubCPMK[] = DAFTAR_SUB_CPMK,
  cpmkList: { kode: string }[] = DAFTAR_CPMK,
): CapaianMahasiswa {
  const sub = hitungSub(nilai, bobot?.w, subList);
  const cpmk = hitungCPMK(sub, subList, cpmkList);
  const ik = hitungIK(cpmk, bobot?.u);
  const cpl = hitungCPL(ik);
  return { nrp: "", sub, cpmk, ik, cpl };
}

export function hitungSemua(
  nilaiMap: NilaiMap,
  bobot?: { w?: BobotW; u?: Record<string, Partial<Record<string, number>>> },
  subList: SubCPMK[] = DAFTAR_SUB_CPMK,
  cpmkList: { kode: string }[] = DAFTAR_CPMK,
): Record<string, CapaianMahasiswa> {
  const out: Record<string, CapaianMahasiswa> = {};
  for (const [nrp, nilai] of Object.entries(nilaiMap)) {
    const c = hitungCapaianSatuMahasiswa(nilai, bobot, subList, cpmkList);
    out[nrp] = { ...c, nrp };
  }
  return out;
}

/** Rata-rata kelas per kode capaian. */
export function rataRata(
  semua: Record<string, CapaianMahasiswa>,
  jenjang: keyof Omit<CapaianMahasiswa, "nrp">,
): Record<string, number> {
  const keys = new Set<string>();
  for (const c of Object.values(semua)) for (const k of Object.keys(c[jenjang])) keys.add(k);
  const out: Record<string, number> = {};
  for (const k of keys) {
    const arr = Object.values(semua).map((c) => c[jenjang][k] ?? 0);
    out[k] = arr.length ? round2(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  }
  return out;
}

/** argmin: simpul terlemah pada suatu jenjang (untuk diagnosis titik lemah). */
export function titikTerlemah(skor: Record<string, number>): { kode: string; nilai: number } {
  let kode = "";
  let nilai = Infinity;
  for (const [k, v] of Object.entries(skor)) {
    if (v < nilai) {
      nilai = v;
      kode = k;
    }
  }
  return { kode, nilai: Number.isFinite(nilai) ? round2(nilai) : 0 };
}

export function susunRekomendasi(
  c: CapaianMahasiswa,
  ambang = AMBANG_DEFAULT,
  subList: SubCPMK[] = DAFTAR_SUB_CPMK,
  bobotW: BobotW = BOBOT_W,
): string[] {
  const saran: string[] = [];
  const cpmkGagal = Object.entries(c.cpmk).filter(([, v]) => v < ambang);
  if (cpmkGagal.length === 0) {
    saran.push("Seluruh CPMK telah mencapai ambang. Pertahankan konsistensi dan fokus pada penguatan materi lanjutan.");
    return saran;
  }
  for (const [kodeCpmk] of cpmkGagal) {
    const penyusun = subList.filter((s) => s.cpmk === kodeCpmk);
    let terlemah = penyusun[0];
    for (const s of penyusun) {
      if ((c.sub[s.kode] ?? 0) < (c.sub[terlemah.kode] ?? 0)) terlemah = s;
    }
    if (!terlemah) continue;
    const asesmenPenyusun = Object.entries(bobotW[terlemah.kode] ?? {})
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .map(([k]) => k)
      .join(", ");
    saran.push(
      `${kodeCpmk} belum tercapai — fokus perbaikan pada ${terlemah.kode} (${terlemah.deskripsi}) yang menjadi titik terlemah, ditopang asesmen ${asesmenPenyusun}.`,
    );
  }
  return saran;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
