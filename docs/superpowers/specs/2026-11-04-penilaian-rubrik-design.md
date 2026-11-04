# Penilaian sesuai lembar rubrik

Tanggal: 2026-11-04 · Disetujui pengguna di percakapan · Tidak di-commit

## Keputusan

1. **Input = indikator rubrik.** Setiap baris lembar penilaian rubrik.docx menjadi satu sel: Kuis 3, Laporan 7, Mini Project 4, Mid 4, Post 4 (22 sel untuk TI045105).
2. **Nilai asesmen = rata-rata biasa indikatornya** (baris "Nilai skor rerata skor").
3. **Nilai akhir = Σ nilai asesmen × bobot komponen / 100**; bobot komponen = jumlah bobot indikatornya (Kuis 10, Laporan 30, Mini Project 10, Mid 25, Post 25). Tafsiran "Nilai total"; perlu konfirmasi dosen.
4. **Skor Sub-CPMK = rata-rata berbobot indikator yang mengukurnya** (tabel "Distribusi Bobot Sub-CPMK"; Mini Project memakai bobot indikator 3:3:2:2). CPMK → IK → CPL tetap seperti sebelumnya.
5. Akibat 2–4: skor IK-11.a tidak selalu sama dengan nilai akhir. Ini konsekuensi rubrik, bukan galat.

## Model data

- `RubrikIndikator { asesmen, sub, label, porsi, tingkat[] }` — dari `rubrikDetail` di `sumber-dokumen-datamining.json`, disimpan sebagai `StrukturMataKuliah.rubrik?` (seed TI045105). Struktur tersimpan tanpa `rubrik` dilengkapi dari seed.
- `Indikator { asesmen, sub, kunci, label, bobot, tingkat[] }` — diturunkan oleh `daftarIndikator(sub, bobotW, asesmen, rubrik?)`. Bobot pasangan (asesmen, Sub-CPMK) tetap dari `bobotW × bobot Sub-CPMK` (halaman Bobot tetap berlaku); pasangan dengan beberapa indikator dibagi sesuai `porsi`.
- Kunci nilai: kode Sub-CPMK bila pasangan punya satu indikator (kompatibel dengan data v2), `Sub-CPMK.8#1…#4` bila lebih. Nilai lama `proyek["Sub-CPMK.8"]` dipakai untuk keempat indikator bila kunci `#k` belum ada (tanpa kehilangan data).

## Statistik

Dashboard, laporan, evaluasi, dan halaman capaian hanya menghitung mahasiswa yang ada di daftar mahasiswa kelas tersebut, sehingga mahasiswa yang dihapus tidak ikut statistik walau data awal membuat entri nilai kosong.

## Pengujian

Unit test untuk: 22 indikator dan bobotnya; rata-rata asesmen; nilai akhir (contoh Laporan 100/50 → 57,14 dan nilai akhir 73,14); Sub-CPMK.8 dari indikator Mini Project; nilai lama Mini Project; penyaringan statistik per daftar mahasiswa. Lalu tsc, eslint (tanpa tambahan masalah), dan pengecekan halaman input nilai di browser.
