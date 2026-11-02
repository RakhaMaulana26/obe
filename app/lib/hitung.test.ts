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
