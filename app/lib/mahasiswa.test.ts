import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCSVMahasiswa } from "./mahasiswa";

describe("parseCSVMahasiswa", () => {
  it("membaca CSV koma", () => {
    assert.deepEqual(parseCSVMahasiswa("NRP,Nama,Kelas\n3124600001,Andi,A\n").data, [{ nrp: "3124600001", nama: "Andi", kelas: "A" }]);
  });
  it("membaca CSV Excel Indonesia: BOM, titik koma, urutan kolom beda, baris kosong", () => {
    const r = parseCSVMahasiswa('﻿nama;kelas;nrp\r\n"Budi, S.";B;3124600002\r\n\r\n');
    assert.deepEqual(r.data, [{ nrp: "3124600002", nama: "Budi, S.", kelas: "B" }]);
    assert.deepEqual(r.galat, []);
  });
  it("menolak kelas tak dikenal dan NRP ganda", () => {
    const r = parseCSVMahasiswa("NRP,Nama,Kelas\n1,A,A\n1,B,A\n2,C,E");
    assert.equal(r.data.length, 1);
    assert.deepEqual(r.galat, ["Baris 3: NRP 1 sudah ada", 'Baris 4: kelas "E" tidak dikenal']);
  });
  it("header tanpa kolom NRP → galat, data kosong", () => {
    const r = parseCSVMahasiswa("Nama,Kelas\nA,A");
    assert.match(r.galat[0], /NRP/);
    assert.equal(r.data.length, 0);
  });
  it("menolak baris dengan NRP atau nama kosong", () => {
    const r = parseCSVMahasiswa("NRP,Nama,Kelas\n,Andi,A\n5,,A");
    assert.equal(r.data.length, 0);
    assert.deepEqual(r.galat, ["Baris 2: NRP kosong", "Baris 3: nama kosong"]);
  });
});
