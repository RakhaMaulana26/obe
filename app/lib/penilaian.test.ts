import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BOBOT_W, DAFTAR_ASESMEN, DAFTAR_SUB_CPMK, RUBRIK_DATAMINING, STRUKTUR_MK_SEED, type NilaiMahasiswa, type StrukturMataKuliah } from "./data";
import {
  ambilNilai,
  bobotAsesmen,
  daftarIndikator,
  hitungNilaiAkhirRubrik,
  hitungSubDariIndikator,
  lengkapiRubrik,
  nilaiPerAsesmen,
  saringRoster,
} from "./penilaian";

const IND = daftarIndikator(DAFTAR_SUB_CPMK, BOBOT_W, DAFTAR_ASESMEN, RUBRIK_DATAMINING);
const dekat = (a: number | undefined, b: number) => assert.ok(Math.abs((a ?? NaN) - b) < 1e-9, `${a} ≠ ${b}`);

/** Nilai seragam n untuk setiap indikator rubrik. */
const seragam = (n: number): NilaiMahasiswa => {
  const out: NilaiMahasiswa = {};
  for (const ind of IND) (out[ind.asesmen] ??= {})[ind.kunci] = n;
  return out;
};

describe("daftar indikator rubrik TI045105", () => {
  it("22 indikator: Kuis 3, Laporan 7, Mini Project 4, Mid 4, Post 4", () => {
    assert.equal(IND.length, 22);
    const jumlah = (a: string) => IND.filter((i) => i.asesmen === a).length;
    assert.deepEqual([jumlah("T1"), jumlah("T2"), jumlah("T3"), jumlah("ETS"), jumlah("EAS")], [3, 7, 4, 4, 4]);
  });
  it("Mini Project: kunci Sub-CPMK.8#1..#4 dengan bobot 3, 3, 2, 2", () => {
    const mp = IND.filter((i) => i.asesmen === "T3");
    assert.deepEqual(mp.map((i) => i.kunci), ["Sub-CPMK.8#1", "Sub-CPMK.8#2", "Sub-CPMK.8#3", "Sub-CPMK.8#4"]);
    mp.forEach((i, k) => dekat(i.bobot, [3, 3, 2, 2][k]));
    assert.match(mp[0].label, /TF-IDF/);
    assert.equal(mp[0].tingkat.length, 4);
  });
  it("pasangan satu-indikator memakai kode Sub-CPMK sebagai kunci", () => {
    assert.deepEqual(IND.filter((i) => i.asesmen === "T1").map((i) => i.kunci), ["Sub-CPMK.1", "Sub-CPMK.3", "Sub-CPMK.5"]);
  });
  it("bobot komponen 10/30/10/25/25 dan total 100", () => {
    const b = bobotAsesmen(IND);
    [["T1", 10], ["T2", 30], ["T3", 10], ["ETS", 25], ["EAS", 25]].forEach(([a, n]) => dekat(b[a as "T1"], n as number));
    dekat(IND.reduce((s, i) => s + i.bobot, 0), 100);
  });
  it("MK tanpa rubrik → satu indikator per pasangan berbobot", () => {
    const tanpa = daftarIndikator(DAFTAR_SUB_CPMK, BOBOT_W, DAFTAR_ASESMEN);
    assert.equal(tanpa.length, 19);
    assert.equal(tanpa.find((i) => i.asesmen === "T3")?.kunci, "Sub-CPMK.8");
  });
  it("bobot Mini Project ikut skala bila bobot di halaman Bobot diubah, porsi tetap 3:3:2:2", () => {
    const w = { ...BOBOT_W, "Sub-CPMK.8": { T3: 0.4, EAS: 0.6 } };
    const mp = daftarIndikator(DAFTAR_SUB_CPMK, w, DAFTAR_ASESMEN, RUBRIK_DATAMINING).filter((i) => i.asesmen === "T3");
    mp.forEach((i, k) => dekat(i.bobot, [1.8, 1.8, 1.2, 1.2][k]));
  });
});

describe("nilai sesuai lembar penilaian", () => {
  it("nilai asesmen = rata-rata biasa indikatornya (Laporan 100 + 6×50 → 57,14)", () => {
    const n = seragam(50);
    n.T2!["Sub-CPMK.1"] = 100;
    dekat(nilaiPerAsesmen(n, IND).T2, 57.14);
  });
  it("nilai akhir = Σ nilai asesmen × bobot komponen (contoh → 73,14)", () => {
    const n = seragam(80);
    for (const ind of IND.filter((i) => i.asesmen === "T2")) n.T2![ind.kunci] = 50;
    n.T2!["Sub-CPMK.1"] = 100;
    dekat(hitungNilaiAkhirRubrik(n, IND), 73.14);
  });
  it("semua indikator 80 → nilai akhir 80", () => {
    dekat(hitungNilaiAkhirRubrik(seragam(80), IND), 80);
  });
  it("Sub-CPMK.8 berbobot dari indikator Mini Project 3:3:2:2 dan Post (→ 73,33)", () => {
    const n = seragam(100);
    n.T3!["Sub-CPMK.8#3"] = 0;
    n.T3!["Sub-CPMK.8#4"] = 0;
    dekat(hitungSubDariIndikator(n, IND, DAFTAR_SUB_CPMK)["Sub-CPMK.8"], 73.33);
  });
  it("Sub-CPMK.1 = (2·Kuis + 1·Laporan + 2·Mid) / 5", () => {
    const n = seragam(100);
    n.T1!["Sub-CPMK.1"] = 0;
    dekat(hitungSubDariIndikator(n, IND, DAFTAR_SUB_CPMK)["Sub-CPMK.1"], 60);
  });
  it("nilai Mini Project format lama (satu nilai Sub-CPMK.8) dipakai untuk keempat indikator", () => {
    const n: NilaiMahasiswa = { T3: { "Sub-CPMK.8": 70 } };
    dekat(nilaiPerAsesmen(n, IND).T3, 70);
    dekat(ambilNilai(n, IND.find((i) => i.kunci === "Sub-CPMK.8#4")!), 70);
  });
  it("sel kosong atau NaN dihitung 0, hasil tetap angka", () => {
    const n: NilaiMahasiswa = { T1: { "Sub-CPMK.1": Number.NaN } };
    assert.ok(Number.isFinite(hitungNilaiAkhirRubrik(n, IND)));
    assert.ok(Object.values(nilaiPerAsesmen(n, IND)).every((v) => Number.isFinite(v)));
  });
  it("tanpa indikator → nilai akhir 0, tidak membagi dengan nol", () => {
    assert.equal(hitungNilaiAkhirRubrik(seragam(90), []), 0);
  });
});

describe("struktur dan statistik", () => {
  it("struktur tersimpan tanpa rubrik dilengkapi dari acuan seed", () => {
    const { rubrik: _r, ...tanpa } = STRUKTUR_MK_SEED["TI045105"];
    void _r;
    assert.equal(lengkapiRubrik(tanpa as StrukturMataKuliah, STRUKTUR_MK_SEED["TI045105"]).rubrik?.length, 22);
  });
  it("saringRoster hanya menyisakan NRP yang ada di daftar mahasiswa", () => {
    const peta = { "1": { T1: { "Sub-CPMK.1": 80 } }, "2": {}, "9": {} };
    assert.deepEqual(Object.keys(saringRoster(peta, [{ nrp: "1", nama: "A", kelas: "A" }, { nrp: "2", nama: "B", kelas: "A" }])), ["1", "2"]);
  });
});

import { asesmenDariBobot, gabungNilai } from "./penilaian";
import { hitungCapaianSatuMahasiswa } from "./hitung";

describe("temuan review penilaian", () => {
  it("#1 Sub-CPMK berbobot 0 tetap punya indikator dan skor Sub-CPMK", () => {
    const sub = [{ ...DAFTAR_SUB_CPMK[0], bobot: 0 }];
    const ind = daftarIndikator(sub, BOBOT_W, DAFTAR_ASESMEN);
    assert.equal(ind.length, 3);
    const n: NilaiMahasiswa = { T1: { "Sub-CPMK.1": 90 }, T2: { "Sub-CPMK.1": 90 }, ETS: { "Sub-CPMK.1": 90 } };
    assert.equal(hitungSubDariIndikator(n, ind, sub)["Sub-CPMK.1"], 90);
  });
  it("#2 asesmen tambahan di bobot ikut dihitung mesin", () => {
    const w = { ...BOBOT_W, "Sub-CPMK.2": { T2: 0.2, ETS: 0.4, T4: 0.4 } } as typeof BOBOT_W;
    assert.ok(asesmenDariBobot(w, DAFTAR_ASESMEN).some((a) => a.kode === ("T4" as never)));
    const n = seragam(100) as Record<string, Record<string, number>>;
    n.T4 = { "Sub-CPMK.2": 0 };
    const c = hitungCapaianSatuMahasiswa(n as NilaiMahasiswa, { w, rubrik: RUBRIK_DATAMINING });
    assert.equal(c.sub["Sub-CPMK.2"], 60);
  });
  it("#3 menyimpan nilai kelas tidak menghapus NRP yang tidak ada di daftar", () => {
    const lama = { "1": { T1: { "Sub-CPMK.1": 70 } }, "9": { T1: { "Sub-CPMK.1": 55 } } };
    const baru = { "1": { T1: { "Sub-CPMK.1": 80 } } };
    assert.deepEqual(gabungNilai(lama, baru), { "1": { T1: { "Sub-CPMK.1": 80 } }, "9": { T1: { "Sub-CPMK.1": 55 } } });
  });
  it("nilai format v2 Mini Project mengalir sampai nilai akhir", () => {
    const n = seragam(80);
    n.T3 = { "Sub-CPMK.8": 70 };
    const c = hitungCapaianSatuMahasiswa(n, { rubrik: RUBRIK_DATAMINING });
    assert.equal(c.nilaiAsesmen.T3, 70);
    assert.equal(c.nilaiAkhir, 79);
  });
});
