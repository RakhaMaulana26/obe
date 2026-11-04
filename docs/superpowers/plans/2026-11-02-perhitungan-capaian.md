# Perhitungan Capaian Sesuai Rubrik — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Skor Sub-CPMK → CPMK → IK → CPL dan nilai huruf yang dihitung aplikasi sama dengan hitungan manual dari rubrik.docx, rps.docx, dan Kurikulum 2026 New.xlsx, serta dosen bisa memasukkan mahasiswa dan nilai.

**Architecture:** Mesin hitung tetap di `app/lib/hitung.ts` (fungsi murni, diuji dengan Vitest). Nilai berubah dari 1 angka per asesmen menjadi 1 angka per (asesmen, Sub-CPMK): 19 pasangan berbobot dari tabel distribusi rubrik. Empat indikator Mini Project (bobot 3:3:2:2) semuanya mengukur Sub-CPMK.8, jadi diinput sebagai satu skor gabungan; input per indikator ditunda ke rencana berikutnya. `bobotW` tetap berarti porsi asesmen di dalam satu Sub-CPMK (jumlah = 1), jadi halaman Bobot tidak berubah. Data mahasiswa pindah dari konstanta kosong ke store (localStorage).

**Tech Stack:** Next.js 16.3.4, React 19.2.8, TypeScript 5, Tailwind 4, Vitest (baru, devDependency).

**Spec:** Dokumen "Rencana Perbaikan Aplikasi OBE" — https://claude.ai/artifact/7myNiFUjAgbxYbS3cRBdKB (bagian Temuan no. 1–5, Rencana Fase 1–3). Sumber angka: `rubrik.docx` (tabel "Distribusi Bobot Sub-CPMK pada Komponen Penilaian"), `rps.docx` (Sub-CPMK, bobot, matriks CPMK–IK), `Kurikulum 2026 New.xlsx` (lembar CPL, Peta Kurikulum).

## Global Constraints

- Baca `AGENTS.md`: Next.js 16 berbeda dari versi lama — cek `node_modules/next/dist/docs/` sebelum mengubah API Next.
- Kode asesmen tetap `T1` (Kuis), `T2` (Laporan Praktikum), `T3` (Mini Project), `ETS` (Mid Test), `EAS` (Post Test). Hapus `T4` dan `Prak`.
- Bobot Sub-CPMK (persen absolut): Sub-CPMK.1 = 5, .2 = 15, .3 = 15, .4 = 15, .5 = 10, .6 = 15, .7 = 10, .8 = 15 (total 100).
- Distribusi bobot rubrik (persen): Kuis 10, Laporan 30, Mini Project 10, Mid 25, Post 25 — sudah ada di `sumber-dokumen-datamining.json` → `bobotRubrik`, jangan diubah.
- Skala huruf: A ≥ 86, AB ≥ 76, B ≥ 66, BC ≥ 61, C ≥ 56, D ≥ 41, E < 41 (batas 86 menunggu konfirmasi dosen; ubah hanya di `TABEL_GRADE`).
- Teks UI berbahasa Indonesia, mengikuti gaya yang sudah ada.
- Bagian di luar rencana ini (dikerjakan di rencana terpisah): desain tampilan, CPL tingkat prodi, CPL/IK yang bisa diedit ikut ke perhitungan, ambang per MK, skrip impor sumber, level kognitif berupa array.

## Sebelum mulai

- `git status` menunjukkan 79 file berubah dengan jumlah baris tambah = hapus (kemungkinan hanya beda line ending CRLF/LF). Commit dulu sebagai "chore: normalize line endings" atau jalankan `git config core.autocrlf true` lalu `git checkout .`, supaya diff tiap task bersih.
- Buat branch: `git checkout -b perbaikan-perhitungan`.

## Review Focus

1. **Sel nilai yang belum diisi** → perhitungan tidak boleh menghasilkan `NaN`; sel kosong dihitung 0 dan halaman nilai menolak simpan. Test di Task 3 (`hitungSub` dengan asesmen hilang).
2. **Nilai desimal di batas grade** (85,5; 60,5) → harus mendapat huruf, tidak jatuh ke celah antar-rentang. Test di Task 5.
3. **localStorage dari versi lama** (nilai format lama, `bobotU` terbalik) → aplikasi tidak crash; `bobotU` diperbaiki otomatis, nilai lama diabaikan. Test di Task 2 (`perbaikiBobotU`); kunci baru di Task 3.
4. **CSV dari Excel berbahasa Indonesia** (pemisah `;`, BOM UTF-8, baris kosong di akhir) → tetap terbaca. Test di Task 6.
5. **Dosen mengubah bobot sehingga satu Sub-CPMK tanpa asesmen** → skor Sub-CPMK 0 tanpa `NaN`, dan kolom input untuk pasangan berbobot 0 tidak muncul. Test di Task 3.

## File Structure

| File | Tanggung jawab | Task |
| --- | --- | --- |
| `package.json`, `vitest.config.ts` (baru) | Runner test | 1 |
| `app/lib/hitung.ts` | Semua rumus (Sub, CPMK, IK, CPL, nilai akhir, huruf, turunan bobot u) | 1–5 |
| `app/lib/hitung.test.ts` (baru) | Test rumus | 1–5 |
| `app/lib/data.ts` | Tipe, konstanta seed, `TABEL_GRADE` | 2, 3, 5, 6 |
| `app/lib/mahasiswa.ts` (baru) | Parser CSV mahasiswa (murni) | 6 |
| `app/lib/mahasiswa.test.ts` (baru) | Test parser | 6 |
| `app/lib/store.tsx` | State nilai v2, perbaikan struktur lama, state mahasiswa | 2, 3, 6 |
| `app/(app)/mata-kuliah/[kode]/nilai/page.tsx` | Input nilai per (asesmen, Sub-CPMK), tambah/impor mahasiswa | 3, 6 |
| `app/(app)/capaian/[nrp]/page.tsx` | Rincian per mahasiswa | 3, 4, 6 |
| `app/components/DokumenMKEditor.tsx` | Toggle matriks CPMK–IK memakai turunan bobot u | 2 |
| Halaman yang memakai `mahasiswaUntukKelas`/`DAFTAR_MAHASISWA` | Baca dari store | 6 |

---

### Task 1: Runner test Vitest

**Files:**
- Modify: `package.json` (tambah devDependency `vitest`, script `"test": "vitest run"`)
- Create: `vitest.config.ts` (alias `@` → root proyek, `environment: "node"`)
- Test: `app/lib/hitung.test.ts`

**Interfaces:**
- Produces: perintah `npm test`.

- [ ] **Step 1:** `npm install -D vitest`
- [ ] **Step 2: Write the test** — `app/lib/hitung.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { round2 } from "./hitung";
describe("round2", () => {
  it("membulatkan ke 2 desimal", () => expect(round2(1.005 + 1.111)).toBe(2.12));
});
```

- [ ] **Step 3:** Run `npm test` → Expected: 1 passed.
- [ ] **Step 4:** Commit `chore: add vitest`.

---

### Task 2: Perbaiki arah dan nilai bobot u (CPMK → IK)

Bug: `ikCpmk` di JSON berbentuk `{ "IK-11.a": { "CPMK.1": 0.25, … } }`, sedangkan `hitungIK`, `DokumenMKEditor`, `hirarki`, dan `docx-generator` membaca `bobotU[kodeCpmk][kodeIK]`. Akibatnya skor IK-11.a dan CPL11 selalu 0. Selain itu nilainya dibagi rata (0,25), padahal RPS memberi CPMK.1 = 20%, CPMK.2 = 30%, CPMK.3 = 35%, CPMK.4 = 15% (jumlah bobot Sub-CPMK penyusunnya).

**Files:**
- Modify: `app/lib/data.ts` (`SubCPMK` dapat field `bobot: number`; `BOBOT_U` dibangun dengan `turunkanBobotU`)
- Modify: `app/lib/hitung.ts`
- Modify: `app/lib/store.tsx` (saat memuat `obe-struktur-mk`, setiap struktur melewati `perbaikiBobotU`)
- Modify: `app/components/DokumenMKEditor.tsx:239-251` (`toggleMatriksIKCPMK` menghitung ulang dengan `turunkanBobotU`, bukan menulis 1/0)
- Test: `app/lib/hitung.test.ts`

**Interfaces:**
- Produces:
  - `SubCPMK.bobot: number` — persen absolut terhadap MK (5, 15, …).
  - `turunkanBobotU(sub: SubCPMK[], centang: Record<string, string[]>): Record<string, Record<string, number>>` — `centang` = kode CPMK → daftar kode IK yang dicentang di RPS. Hasil `[cpmk][ik]` = bobot CPMK ÷ jumlah bobot semua CPMK yang dicentang ke IK itu. CPMK tanpa Sub-CPMK berbobot → 0.
  - `perbaikiBobotU(struktur: StrukturMataKuliah): StrukturMataKuliah` — kalau ada kunci level-1 `bobotU` yang bukan kode CPMK di `struktur.cpmk`, anggap terbalik: transpos, lalu turunkan ulang. Kalau sudah benar, kembalikan objek yang sama.

- [ ] **Step 1: Write the failing tests**

```ts
const centangDM = { "CPMK.1": ["IK-11.a"], "CPMK.2": ["IK-11.a"], "CPMK.3": ["IK-11.a"], "CPMK.4": ["IK-11.a"] };
it("turunkanBobotU memakai bobot Sub-CPMK", () => {
  const u = turunkanBobotU(DAFTAR_SUB_CPMK, centangDM);
  expect(u["CPMK.1"]["IK-11.a"]).toBeCloseTo(0.20);
  expect(u["CPMK.2"]["IK-11.a"]).toBeCloseTo(0.30);
  expect(u["CPMK.3"]["IK-11.a"]).toBeCloseTo(0.35);
  expect(u["CPMK.4"]["IK-11.a"]).toBeCloseTo(0.15);
});
it("hitungIK dengan BOBOT_U seed tidak lagi 0", () => {
  const ik = hitungIK({ "CPMK.1": 80, "CPMK.2": 80, "CPMK.3": 80, "CPMK.4": 80 });
  expect(ik["IK-11.a"]).toBe(80);
});
it("perbaikiBobotU membalik data lama yang terbalik", () => {
  const lama = { ...STRUKTUR_MK_SEED["TI045105"], bobotU: { "IK-11.a": { "CPMK.1": 0.25, "CPMK.2": 0.25, "CPMK.3": 0.25, "CPMK.4": 0.25 } } };
  expect(perbaikiBobotU(lama).bobotU["CPMK.3"]["IK-11.a"]).toBeCloseTo(0.35);
});
```

- [ ] **Step 2:** Run `npm test` → Expected: FAIL (`turunkanBobotU` tidak ada; `IK-11.a` = 0).
- [ ] **Step 3:** Implementasikan field `bobot` di `DAFTAR_SUB_CPMK` (dari `sub[].bobot` di JSON), `turunkanBobotU`, `perbaikiBobotU`; `BOBOT_U = turunkanBobotU(DAFTAR_SUB_CPMK, centang)` dengan `centang` = transpos dari `ikCpmk` JSON (ambil kunci yang nilainya > 0).
- [ ] **Step 4:** Pasang `perbaikiBobotU` di pemuatan `obe-struktur-mk` (`store.tsx`) dan `turunkanBobotU` di `toggleMatriksIKCPMK`.
- [ ] **Step 5:** Run `npm test` → PASS; `npx tsc --noEmit` → tanpa error.
- [ ] **Step 6:** Commit `fix: orientasi dan nilai bobot u CPMK→IK sesuai RPS`.

---

### Task 3: Nilai per (asesmen, Sub-CPMK)

**Files:**
- Modify: `app/lib/data.ts:4` (`AsesmenKode` tanpa `T4`/`Prak`), tipe `NilaiMap`
- Modify: `app/lib/hitung.ts` (`hitungSub`, `CapaianMahasiswa`, `hitungCapaianSatuMahasiswa`, fungsi baru)
- Modify: `app/lib/store.tsx` (kunci `obe-nilai-offering` → `obe-nilai-offering-v2`; buang migrasi dari `obe-nilai` lama di `benihNilaiOffering`)
- Modify: `app/(app)/mata-kuliah/[kode]/nilai/page.tsx` (kolom dari `kolomNilai`, header dua baris: asesmen di atas, Sub-CPMK + bobot % di bawah)
- Modify: `app/(app)/capaian/[nrp]/page.tsx:51,86` (tipe nilai baru)
- Test: `app/lib/hitung.test.ts`

**Interfaces:**
- Consumes: `SubCPMK.bobot` (Task 2).
- Produces:
  - `type NilaiMahasiswa = Partial<Record<AsesmenKode, Record<string, number>>>` — `nilai[asesmen][kodeSub]`.
  - `type NilaiMap = Record<string, NilaiMahasiswa>` (kunci NRP).
  - `hitungSub(nilai: NilaiMahasiswa, bobotW?, subList?)` — `S_Sub_j = Σ_a nilai[a][j] · w[j][a]`; sel hilang = 0.
  - `hitungNilaiAkhir(sub: Record<string, number>, subList: SubCPMK[]): number` — `Σ_j sub[j] · bobot_j / 100`, dibulatkan `round2`.
  - `CapaianMahasiswa.nilaiAkhir: number`.
  - `kolomNilai(subList: SubCPMK[], bobotW: BobotW, asesmenList: Asesmen[]): Array<{ asesmen: AsesmenKode; sub: string }>` — hanya pasangan dengan `bobotW[sub][asesmen] > 0`, urut menurut `asesmenList` lalu `subList`.

- [ ] **Step 1: Write the failing tests**

```ts
const penuh = (n: number): NilaiMahasiswa => Object.fromEntries(
  DAFTAR_ASESMEN.map((a) => [a.kode, Object.fromEntries(DAFTAR_SUB_CPMK.map((s) => [s.kode, n]))]));
it("semua sel 80 → Sub, CPMK, nilai akhir 80", () => {
  const c = hitungCapaianSatuMahasiswa(penuh(80));
  expect(Object.values(c.sub).every((v) => v === 80)).toBe(true);
  expect(c.nilaiAkhir).toBe(80);
});
it("hanya Kuis Sub-CPMK.1 = 0 → Sub-CPMK.1 = 60, nilai akhir 98", () => {
  const n = penuh(100); n.T1!["Sub-CPMK.1"] = 0;
  const c = hitungCapaianSatuMahasiswa(n);
  expect(c.sub["Sub-CPMK.1"]).toBe(60);
  expect(c.nilaiAkhir).toBe(98);
});
it("asesmen yang belum diisi dihitung 0, bukan NaN", () => {
  const c = hitungCapaianSatuMahasiswa({ T2: { "Sub-CPMK.2": 90 } });
  expect(Number.isNaN(c.sub["Sub-CPMK.2"])).toBe(false);
  expect(c.sub["Sub-CPMK.2"]).toBe(36); // 90 × 6/15
});
it("Sub-CPMK tanpa asesmen berbobot → 0", () => {
  expect(hitungSub(penuh(90), { ...BOBOT_W, "Sub-CPMK.1": {} })["Sub-CPMK.1"]).toBe(0);
});
it("kolomNilai Data Mining = 19 kolom, Kuis berisi Sub-CPMK 1, 3, 5", () => {
  const k = kolomNilai(DAFTAR_SUB_CPMK, BOBOT_W, DAFTAR_ASESMEN);
  expect(k).toHaveLength(19);
  expect(k.filter((x) => x.asesmen === "T1").map((x) => x.sub)).toEqual(["Sub-CPMK.1", "Sub-CPMK.3", "Sub-CPMK.5"]);
});
```

- [ ] **Step 2:** Run `npm test` → FAIL.
- [ ] **Step 3:** Ubah tipe di `data.ts`, implementasikan perubahan di `hitung.ts`.
- [ ] **Step 4:** Run `npm test` → PASS.
- [ ] **Step 5:** Run `npx tsc --noEmit`; perbaiki setiap error tipe di `store.tsx`, halaman `nilai`, dan `capaian/[nrp]` sampai bersih. Validasi simpan di halaman nilai mengecek setiap pasangan dari `kolomNilai` (0–100, wajib diisi).
- [ ] **Step 6:** Commit `feat: nilai per indikator rubrik (asesmen × Sub-CPMK)`.

---

### Task 4: CPL tingkat MK hanya dari IK yang diukur

Sekarang z dibagi rata ke semua IK dalam CPL (CPL11 punya 3 IK → z = 1/3), sehingga nilai sempurna di Data Mining memberi CPL11 = 33,33.

**Files:**
- Modify: `app/lib/hitung.ts` (`hitungIK`, `hitungCPL`, `hitungCapaianSatuMahasiswa`)
- Modify: `app/(app)/capaian/[nrp]/page.tsx:53-54` (panggilan langsung `hitungIK`/`hitungCPL`)
- Test: `app/lib/hitung.test.ts`

**Interfaces:**
- Consumes: `bobotU` berbentuk `[cpmk][ik]` (Task 2).
- Produces:
  - `ikTerukur(bobotU): Set<string>` — IK dengan sedikitnya satu `bobotU[cpmk][ik] > 0`.
  - `hitungIK(cpmk, bobotU?)` — hanya mengeluarkan kunci untuk IK di `ikTerukur(bobotU)`.
  - `hitungCPL(ik: Record<string, number>, terukur: Set<string>, ikList = DAFTAR_IK, cplList = DAFTAR_CPL)` — `z'` = z ÷ jumlah z IK terukur dalam CPL itu; CPL tanpa IK terukur tidak muncul di hasil.

- [ ] **Step 1: Write the failing test**

```ts
it("nilai 80 semua → CPL yang muncul hanya CPL11 = 80", () => {
  const c = hitungCapaianSatuMahasiswa(penuh(80));
  expect(c.ik).toEqual({ "IK-11.a": 80 });
  expect(c.cpl).toEqual({ CPL11: 80 });
});
```

- [ ] **Step 2:** Run `npm test` → FAIL (CPL11 = 26.67 dan ada 10 CPL lain bernilai 0).
- [ ] **Step 3:** Implementasikan.
- [ ] **Step 4:** Run `npm test` → PASS; `npx tsc --noEmit` bersih.
- [ ] **Step 5:** Cek `dashboard`, `hirarki`, `laporan` tidak menampilkan `undefined` untuk CPL yang tidak muncul (mereka sudah memakai `?? 0`; cukup buka halamannya).
- [ ] **Step 6:** Commit `fix: CPL tingkat MK dinormalisasi atas IK terukur`.

---

### Task 5: Tabel grade dan konversi huruf

**Files:**
- Modify: `app/lib/data.ts` (`TABEL_GRADE`)
- Modify: `app/lib/hitung.ts` (`konversiHuruf`)
- Test: `app/lib/hitung.test.ts`

**Interfaces:**
- Produces: `TABEL_GRADE: GradeRow[]` = A min 86 kualitas 4 · AB 76 / 3,5 · B 66 / 3 · BC 61 / 2,5 · C 56 / 2 · D 41 / 1 · E 0 / 0 (`max` diisi 100 untuk A dan `min berikutnya` untuk lainnya, hanya untuk tampilan). `konversiHuruf` memilih baris pertama, diurutkan `min` menurun, dengan `skor >= min` — tidak memakai `max`.

- [ ] **Step 1: Write the failing test**

```ts
it.each([[100,"A"],[86,"A"],[85.99,"AB"],[76,"AB"],[75.5,"B"],[66,"B"],[61,"BC"],[60.5,"C"],[56,"C"],[55.9,"D"],[41,"D"],[40.9,"E"],[0,"E"]])(
  "skor %d → %s", (skor, huruf) => expect(konversiHuruf(skor).huruf).toBe(huruf));
```

- [ ] **Step 2:** Run `npm test` → FAIL (huruf kosong).
- [ ] **Step 3:** Implementasikan.
- [ ] **Step 4:** Run `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: tabel grade PENS dan konversi huruf tanpa celah`.

---

### Task 6: Data mahasiswa (tambah manual dan impor CSV)

**Files:**
- Create: `app/lib/mahasiswa.ts`, `app/lib/mahasiswa.test.ts`
- Modify: `app/lib/store.tsx` (state + aksi, kunci `obe-mahasiswa`)
- Modify: `app/lib/data.ts` (hapus `DAFTAR_MAHASISWA`, `mahasiswaUntukKelas`)
- Modify: halaman `mata-kuliah/[kode]/nilai` (tombol "Tambah mahasiswa" dengan `Modal`, tombol "Impor CSV" dengan `<input type="file" accept=".csv">`, ringkasan galat impor)
- Modify: semua pemakai lama — `capaian/[nrp]/page.tsx:11,34-35`, `laporan/page.tsx:47`, `mata-kuliah/[kode]/capaian/page.tsx:55`, `mata-kuliah/[kode]/capaian/sub-cpmk/page.tsx:55`, `mata-kuliah/[kode]/page.tsx:36`, `mata-kuliah/page.tsx:118`

**Interfaces:**
- Produces:
  - `parseCSVMahasiswa(teks: string): { data: Mahasiswa[]; galat: string[] }` — buang BOM, pemisah `,` atau `;` (deteksi dari baris header), header wajib `NRP`, `Nama`, `Kelas` (tidak peka huruf besar, urutan bebas), abaikan baris kosong, trim setiap sel, dukung sel berkutip `"…"`. Kelas harus salah satu `DAFTAR_KELAS`; NRP ganda → baris kedua ditolak. Galat berbentuk `"Baris 4: kelas \"E\" tidak dikenal"`.
  - Store: `mahasiswa: Mahasiswa[]`, `mahasiswaUntuk(kelas: string): Mahasiswa[]`, `tambahMahasiswa(m: Mahasiswa): string | null` (galat bila NRP sudah ada), `hapusMahasiswa(nrp: string): void`, `imporMahasiswa(daftar: Mahasiswa[]): void` (NRP yang sudah ada ditimpa).

- [ ] **Step 1: Write the failing tests**

```ts
it("membaca CSV koma", () => {
  expect(parseCSVMahasiswa("NRP,Nama,Kelas\n3124600001,Andi,A\n").data)
    .toEqual([{ nrp: "3124600001", nama: "Andi", kelas: "A" }]);
});
it("membaca CSV Excel Indonesia: BOM, titik koma, urutan kolom beda, baris kosong", () => {
  const r = parseCSVMahasiswa("﻿nama;kelas;nrp\r\n\"Budi, S.\";B;3124600002\r\n\r\n");
  expect(r.data).toEqual([{ nrp: "3124600002", nama: "Budi, S.", kelas: "B" }]);
  expect(r.galat).toEqual([]);
});
it("menolak kelas tak dikenal dan NRP ganda", () => {
  const r = parseCSVMahasiswa("NRP,Nama,Kelas\n1,A,A\n1,B,A\n2,C,E");
  expect(r.data).toHaveLength(1);
  expect(r.galat).toEqual(["Baris 3: NRP 1 sudah ada", "Baris 4: kelas \"E\" tidak dikenal"]);
});
it("header tanpa kolom NRP → galat, data kosong", () => {
  expect(parseCSVMahasiswa("Nama,Kelas\nA,A").galat[0]).toMatch(/NRP/);
});
```

- [ ] **Step 2:** Run `npm test` → FAIL.
- [ ] **Step 3:** Implementasikan `parseCSVMahasiswa`.
- [ ] **Step 4:** Run `npm test` → PASS.
- [ ] **Step 5:** Tambahkan state dan aksi di `store.tsx`, ganti semua pemakai lama, hapus konstanta dari `data.ts`. Run `npx tsc --noEmit` → bersih.
- [ ] **Step 6:** Commit `feat: kelola dan impor data mahasiswa`.

---

### Task 7: Verifikasi menyeluruh

- [ ] **Step 1:** `npm test` → semua PASS. `npx tsc --noEmit` → 0 error. `npm run lint` → 0 error.
- [ ] **Step 2:** `npm run build` → sukses.
- [ ] **Step 3:** `npm run dev`, hapus localStorage situs, login `dosen@pens.ac.id` / `password123`. Impor CSV 2 mahasiswa kelas A. Isi semua 19 sel mahasiswa pertama = 80 → halaman capaian menunjukkan semua Sub-CPMK, CPMK, IK-11.a, CPL11 = 80 dan huruf AB.
- [ ] **Step 4:** Mahasiswa kedua: semua 100 kecuali Kuis Sub-CPMK.1 = 0 → Sub-CPMK.1 = 60, nilai akhir 98, huruf A.
- [ ] **Step 5:** Muat ulang halaman → nilai dan mahasiswa tetap ada.
