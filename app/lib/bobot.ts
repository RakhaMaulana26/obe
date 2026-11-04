// Turunan bobot u (CPMK → IK) dari bobot Sub-CPMK di RPS.
// Modul ini hanya memakai tipe dari data.ts agar data.ts dapat memakainya tanpa import melingkar.
import type { StrukturMataKuliah, SubCPMK } from "./data";

export type BobotU = Record<string, Partial<Record<string, number>>>;

/**
 * u[cpmk][ik] = bobot CPMK ÷ jumlah bobot semua CPMK yang dicentang ke IK itu.
 * Bobot CPMK = jumlah bobot Sub-CPMK penyusunnya (persen terhadap MK).
 * Bila salah satu CPMK yang dicentang ke sebuah IK belum punya bobot (MK baru/kustom), IK itu memakai
 * porsi rata — agar centang tidak pernah runtuh menjadi 0 dan hilang.
 */
export function turunkanBobotU(sub: SubCPMK[], centang: Record<string, string[]>): Record<string, Record<string, number>> {
  const bobotCPMK: Record<string, number> = {};
  for (const s of sub) bobotCPMK[s.cpmk] = (bobotCPMK[s.cpmk] ?? 0) + (s.bobot ?? 0);

  const totalPerIK: Record<string, number> = {};
  const jumlahPerIK: Record<string, number> = {};
  const adaTanpaBobot: Record<string, boolean> = {};
  for (const [cpmk, daftarIK] of Object.entries(centang)) {
    for (const ik of daftarIK) {
      totalPerIK[ik] = (totalPerIK[ik] ?? 0) + (bobotCPMK[cpmk] ?? 0);
      jumlahPerIK[ik] = (jumlahPerIK[ik] ?? 0) + 1;
      if (!((bobotCPMK[cpmk] ?? 0) > 0)) adaTanpaBobot[ik] = true;
    }
  }

  const out: Record<string, Record<string, number>> = {};
  for (const [cpmk, daftarIK] of Object.entries(centang)) {
    out[cpmk] = {};
    for (const ik of daftarIK) {
      out[cpmk][ik] = adaTanpaBobot[ik] ? 1 / jumlahPerIK[ik] : (bobotCPMK[cpmk] ?? 0) / totalPerIK[ik];
    }
  }
  return out;
}

/** Centang matriks CPMK–IK yang tersirat dari bobotU berbentuk [cpmk][ik]. */
export function centangDariBobotU(bobotU: BobotU): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(bobotU).map(([cpmk, peta]) => [cpmk, Object.keys(peta).filter((ik) => (peta[ik] ?? 0) > 0)]),
  );
}

/**
 * bobotU selalu ditentukan oleh centang matriks CPMK–IK + bobot Sub-CPMK. Data lama bisa
 * terbalik ([ik][cpmk]) atau berisi nilai 1 hasil toggle; keduanya diturunkan ulang.
 * Bila hasilnya sama, struktur dikembalikan apa adanya (identitas objek dipertahankan).
 */
export function perbaikiBobotU(struktur: StrukturMataKuliah): StrukturMataKuliah {
  const kodeCPMK = new Set(struktur.cpmk.map((c) => c.kode));
  const centang: Record<string, string[]> = {};
  for (const [luar, peta] of Object.entries(struktur.bobotU)) {
    for (const [dalam, nilai] of Object.entries(peta)) {
      if ((nilai ?? 0) <= 0) continue;
      const [cpmk, ik] = kodeCPMK.has(luar) ? [luar, dalam] : [dalam, luar];
      (centang[cpmk] ??= []).push(ik);
    }
  }
  const turunan = turunkanBobotU(struktur.sub, centang);
  return samaBobotU(struktur.bobotU, turunan) ? struktur : { ...struktur, bobotU: turunan };
}

function samaBobotU(a: BobotU, b: BobotU): boolean {
  const kunciA = Object.keys(a).sort();
  const kunciB = Object.keys(b).sort();
  if (kunciA.join() !== kunciB.join()) return false;
  return kunciA.every((k) => {
    const ika = Object.keys(a[k]).filter((ik) => (a[k][ik] ?? 0) > 0).sort();
    const ikb = Object.keys(b[k]).filter((ik) => (b[k][ik] ?? 0) > 0).sort();
    return ika.join() === ikb.join() && ika.every((ik) => Math.abs((a[k][ik] ?? 0) - (b[k][ik] ?? 0)) < 1e-9);
  });
}

/** Bentuk minimal struktur MK; entri localStorage yang rusak ditolak agar tidak menjatuhkan aplikasi. */
export function strukturValid(x: unknown): x is StrukturMataKuliah {
  if (!x || typeof x !== "object") return false;
  const s = x as Partial<StrukturMataKuliah>;
  const objek = (v: unknown) => Boolean(v) && typeof v === "object" && !Array.isArray(v);
  return Array.isArray(s.cpmk) && Array.isArray(s.sub) && objek(s.bobotU) && objek(s.bobotW)
    && Object.values(s.bobotU as object).every(objek);
}

/** Sub-CPMK yang tersimpan sebelum field `bobot` ada dilengkapi dari acuan (seed) berdasarkan kode; selain itu 0. */
export function lengkapiBobotSub(struktur: StrukturMataKuliah, acuan?: StrukturMataKuliah): StrukturMataKuliah {
  if (struktur.sub.every((s) => typeof s.bobot === "number")) return struktur;
  const dariAcuan = new Map((acuan?.sub ?? []).map((s) => [s.kode, s.bobot]));
  return {
    ...struktur,
    sub: struktur.sub.map((s) => (typeof s.bobot === "number" ? s : { ...s, bobot: dariAcuan.get(s.kode) ?? 0 })),
  };
}
