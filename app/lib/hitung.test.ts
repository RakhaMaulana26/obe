import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { round2 } from "./hitung";

describe("round2", () => {
  it("membulatkan ke 2 desimal", () => assert.equal(round2(1.005 + 1.111), 2.12));
});

import { DAFTAR_SUB_CPMK, STRUKTUR_MK_SEED } from "./data";
import { hitungIK, perbaikiBobotU, turunkanBobotU } from "./hitung";

const centangDM = { "CPMK.1": ["IK-11.a"], "CPMK.2": ["IK-11.a"], "CPMK.3": ["IK-11.a"], "CPMK.4": ["IK-11.a"] };
const dekat = (aktual: number | undefined, harap: number) => assert.ok(Math.abs((aktual ?? NaN) - harap) < 1e-9, `${aktual} ≠ ${harap}`);

describe("bobot u CPMK → IK", () => {
  it("turunkanBobotU memakai bobot Sub-CPMK", () => {
    const u = turunkanBobotU(DAFTAR_SUB_CPMK, centangDM);
    dekat(u["CPMK.1"]["IK-11.a"], 0.2);
    dekat(u["CPMK.2"]["IK-11.a"], 0.3);
    dekat(u["CPMK.3"]["IK-11.a"], 0.35);
    dekat(u["CPMK.4"]["IK-11.a"], 0.15);
  });
  it("hitungIK dengan BOBOT_U seed tidak lagi 0", () => {
    const ik = hitungIK({ "CPMK.1": 80, "CPMK.2": 80, "CPMK.3": 80, "CPMK.4": 80 });
    assert.equal(ik["IK-11.a"], 80);
  });
  it("perbaikiBobotU membalik data lama yang terbalik", () => {
    const lama = { ...STRUKTUR_MK_SEED["TI045105"], bobotU: { "IK-11.a": { "CPMK.1": 0.25, "CPMK.2": 0.25, "CPMK.3": 0.25, "CPMK.4": 0.25 } } };
    dekat(perbaikiBobotU(lama).bobotU["CPMK.3"]?.["IK-11.a"], 0.35);
  });
  it("perbaikiBobotU tidak mengubah struktur yang sudah benar", () => {
    const benar = STRUKTUR_MK_SEED["TI045105"];
    assert.equal(perbaikiBobotU(benar), benar);
  });
});

import { lengkapiBobotSub } from "./hitung";

describe("perbaikan struktur tersimpan", () => {
  it("bobotU hasil toggle lama (nilai 1) dinormalisasi ulang", () => {
    const lama = { ...STRUKTUR_MK_SEED["TI045105"], bobotU: { "CPMK.1": { "IK-11.a": 1 }, "CPMK.2": { "IK-11.a": 1 }, "CPMK.3": { "IK-11.a": 1 }, "CPMK.4": { "IK-11.a": 1 } } };
    dekat(perbaikiBobotU(lama).bobotU["CPMK.4"]?.["IK-11.a"], 0.15);
  });
  it("Sub-CPMK tersimpan tanpa bobot dilengkapi dari acuan seed", () => {
    const seed = STRUKTUR_MK_SEED["TI045105"];
    const lama = { ...seed, sub: seed.sub.map(({ bobot: _b, ...s }) => s as typeof seed.sub[number]) };
    assert.deepEqual(lengkapiBobotSub(lama, seed).sub.map((s) => s.bobot), [5, 15, 15, 15, 10, 15, 10, 15]);
  });
});

import { BOBOT_W, DAFTAR_ASESMEN, type NilaiMahasiswa } from "./data";
import { hitungCapaianSatuMahasiswa, hitungSub, kolomNilai } from "./hitung";

const penuh = (n: number): NilaiMahasiswa =>
  Object.fromEntries(DAFTAR_ASESMEN.map((a) => [a.kode, Object.fromEntries(DAFTAR_SUB_CPMK.map((s) => [s.kode, n]))]));

describe("nilai per (asesmen, Sub-CPMK)", () => {
  it("semua sel 80 → Sub dan nilai akhir 80", () => {
    const c = hitungCapaianSatuMahasiswa(penuh(80));
    assert.ok(Object.values(c.sub).every((v) => v === 80), JSON.stringify(c.sub));
    assert.equal(c.nilaiAkhir, 80);
  });
  it("hanya Kuis Sub-CPMK.1 = 0 → Sub-CPMK.1 = 60, nilai akhir 98", () => {
    const n = penuh(100);
    n.T1!["Sub-CPMK.1"] = 0;
    const c = hitungCapaianSatuMahasiswa(n);
    assert.equal(c.sub["Sub-CPMK.1"], 60);
    assert.equal(c.nilaiAkhir, 98);
  });
  it("asesmen yang belum diisi dihitung 0, bukan NaN", () => {
    const c = hitungCapaianSatuMahasiswa({ T2: { "Sub-CPMK.2": 90 } });
    assert.equal(c.sub["Sub-CPMK.2"], 36);
    assert.ok(Object.values(c.sub).every((v) => !Number.isNaN(v)));
  });
  it("Sub-CPMK tanpa asesmen berbobot → 0", () => {
    assert.equal(hitungSub(penuh(90), { ...BOBOT_W, "Sub-CPMK.1": {} })["Sub-CPMK.1"], 0);
  });
  it("kolomNilai Data Mining = 19 kolom, Kuis berisi Sub-CPMK 1, 3, 5", () => {
    const k = kolomNilai(DAFTAR_SUB_CPMK, BOBOT_W, DAFTAR_ASESMEN);
    assert.equal(k.length, 19);
    assert.deepEqual(k.filter((x) => x.asesmen === "T1").map((x) => x.sub), ["Sub-CPMK.1", "Sub-CPMK.3", "Sub-CPMK.5"]);
  });
});

describe("CPL tingkat MK", () => {
  it("nilai 80 semua → IK dan CPL yang muncul hanya IK-11.a dan CPL11 = 80", () => {
    const c = hitungCapaianSatuMahasiswa(penuh(80));
    assert.deepEqual(c.ik, { "IK-11.a": 80 });
    assert.deepEqual(c.cpl, { CPL11: 80 });
  });
});

import { konversiHuruf } from "./hitung";

describe("konversi huruf", () => {
  const kasus: Array<[number, string]> = [[100, "A"], [86, "A"], [85.99, "AB"], [76, "AB"], [75.5, "B"], [66, "B"], [61, "BC"], [60.5, "C"], [56, "C"], [55.9, "D"], [41, "D"], [40.9, "E"], [0, "E"]];
  for (const [skor, huruf] of kasus) {
    it(`skor ${skor} → ${huruf}`, () => assert.equal(konversiHuruf(skor).huruf, huruf));
  }
});
