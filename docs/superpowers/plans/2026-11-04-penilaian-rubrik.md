# Penilaian Sesuai Lembar Rubrik — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox syntax. Pengguna meminta **tanpa commit**: langkah "commit" diganti pencatatan di ledger.

**Goal:** Nilai akhir, nilai per asesmen, dan skor Sub-CPMK di aplikasi sama dengan hitungan manual dari lembar penilaian rubrik.docx.

**Architecture:** Modul murni baru `app/lib/penilaian.ts` menurunkan daftar indikator dari struktur MK + rubrik dan menghitung nilai asesmen (rata-rata biasa), nilai akhir, dan skor Sub-CPMK (berbobot). `hitung.ts` memakai modul ini; halaman membaca kolom dari `daftarIndikator`.

**Tech Stack:** Next.js 16, React 19, TypeScript, node:test via tsx.

**Spec:** `docs/superpowers/specs/2026-11-04-penilaian-rubrik-design.md`

## Global Constraints

- Tanpa commit dan tanpa push (permintaan pengguna).
- Bobot komponen TI045105: Kuis 10, Laporan 30, Mini Project 10, Mid 25, Post 25. Bobot indikator Mini Project 3:3:2:2.
- Kunci nilai pasangan satu-indikator = kode Sub-CPMK (kompatibel dengan `obe-nilai-offering-v2`).
- Tidak ada `NaN` di hasil; sel kosong = 0 dalam hitungan.

## Review Focus

1. Data v2 yang sudah diisi (Mini Project satu nilai) → keempat indikator memakai nilai itu.
2. Struktur tersimpan tanpa `rubrik` → dilengkapi dari seed; MK kustom tanpa rubrik → satu indikator per pasangan.
3. Dosen mengubah bobot di halaman Bobot → bobot indikator ikut berubah (porsi Mini Project tetap 3:3:2:2).
4. Mahasiswa dihapus tetapi entri nilai kosong dibuat ulang oleh data awal → tidak ikut statistik.
5. Asesmen tanpa indikator berbobot → tidak menghasilkan pembagian dengan nol.

---

### Task 1: Modul `penilaian.ts`

**Files:** Create `app/lib/penilaian.ts`, `app/lib/penilaian.test.ts`; Modify `app/lib/data.ts` (tipe `RubrikIndikator`, `Indikator`, `StrukturMataKuliah.rubrik?`, seed `RUBRIK_DATAMINING`).

**Interfaces (Produces):**
- `type RubrikIndikator = { asesmen: AsesmenKode; sub: string; label: string; porsi: number; tingkat: string[] }`
- `type Indikator = { asesmen: AsesmenKode; sub: string; kunci: string; label: string; bobot: number; tingkat: string[] }`
- `daftarIndikator(sub: SubCPMK[], bobotW: BobotW, asesmen: Asesmen[], rubrik?: RubrikIndikator[]): Indikator[]`
- `ambilNilai(nilai: NilaiMahasiswa, ind: Indikator): number` — fallback ke `nilai[a][sub]` untuk kunci `#k`; non-finite → 0.
- `nilaiPerAsesmen(nilai, indikator): Partial<Record<AsesmenKode, number>>` — rata-rata biasa, round2.
- `bobotAsesmen(indikator): Partial<Record<AsesmenKode, number>>`
- `hitungNilaiAkhirRubrik(nilai, indikator): number`
- `hitungSubDariIndikator(nilai, indikator, subList): Record<string, number>`
- `lengkapiRubrik(struktur, acuan?): StrukturMataKuliah`

Tests (RED dulu): 22 indikator; kunci dan bobot Mini Project `Sub-CPMK.8#1..#4` = 3,3,2,2; total bobot 100; bobot asesmen 10/30/10/25/25; Laporan 100 + 6×50 → 57,14; nilai akhir contoh = 73,14; Sub-CPMK.8 [100,100,0,0]+Post 100 → 73,33; nilai lama `proyek["Sub-CPMK.8"]=70` → rerata Mini Project 70; bobot Mini Project ikut skala bila `bobotW` diubah; MK tanpa rubrik → satu indikator per pasangan; struktur tanpa `rubrik` dilengkapi dari acuan.

### Task 2: Integrasi ke mesin hitung dan store

**Files:** Modify `app/lib/hitung.ts` (`hitungSub`, `hitungCapaianSatuMahasiswa`, `hitungSemua` menerima `rubrik`; `nilaiAkhir` dari `hitungNilaiAkhirRubrik`; `CapaianMahasiswa.nilaiAsesmen`), `app/lib/store.tsx` (lengkapi `rubrik` saat memuat), `app/lib/hitung.test.ts` (ekspektasi nilai akhir mengikuti keputusan A: Kuis Sub-CPMK.1 = 0 → nilai akhir 96,67).

### Task 3: Halaman

**Files:** `nilai/page.tsx` (kolom = indikator, header label + bobot, tooltip deskripsi tingkat, kolom nilai akhir), `capaian/[nrp]/page.tsx` (rincian per indikator + nilai per asesmen), `laporan/page.tsx` (CSV per indikator + rerata asesmen), semua pemanggil `hitungSemua` meneruskan `rubrik: struktur.rubrik`. `kolomNilai` dihapus.

### Task 4: Statistik hanya untuk daftar mahasiswa

**Files:** `penilaian.ts` (`saringRoster(nilai: NilaiMap, roster: Mahasiswa[]): NilaiMap`, test), pemakaian di dashboard, laporan, evaluasi-dosen, hirarki, capaian MK, capaian Sub-CPMK.

### Task 5: Verifikasi

`npm test`; tsc di perangkat; eslint dibanding baseline; cek halaman input nilai di browser (22 kolom, Mini Project 4 kolom, nilai akhir terhitung).
