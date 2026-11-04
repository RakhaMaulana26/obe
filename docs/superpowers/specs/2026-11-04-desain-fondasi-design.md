# Sub-proyek 1 — Fondasi desain dan kerangka aplikasi

Tanggal: 2026-11-04 · Status: menunggu review pengguna · Tidak di-commit (permintaan pengguna)

## Tujuan

Aplikasi SPK OBE PENS dipakai dosen untuk mengisi nilai dan oleh admin prodi untuk membaca ketercapaian CPL. Sub-proyek ini membuat fondasi visual yang konsisten dan kerangka yang bisa dipakai dari HP sampai desktop, tanpa mengubah isi halaman. Halaman inti (input nilai, dashboard, peta kurikulum) didesain ulang di sub-proyek 2; landing, login, dan tur di sub-proyek 3.

Kondisi sekarang yang menjadi alasan (dicek di browser pada 2026-11-04):

- Di layar 375px area konten hanya selebar 115px karena sidebar 260px selalu tampil.
- Font tampil Arial; Geist dimuat tetapi tertimpa `font-family` di `globals.css`.
- Teks 9–11px dipakai lebih dari 100 kali; abu-abu `gray` dan `slate` bercampur; #103968 ditulis langsung 16 kali.
- Label grup sidebar huruf kapital ("DOSEN — MATA KULIAH") dan tiap menu punya teks kedua.
- Judul halaman beranimasi blur; ada TiltCard, SpotlightCard, ShinyText di beberapa halaman.
- Mode gelap mengganti latar menjadi gelap, tetapi kartu tetap putih.

## Keputusan yang sudah disetujui

### Warna

| Token | Hex | Peran |
| --- | --- | --- |
| `primary` (Biru PENS) | #103968 | Navigasi, judul, tombol utama |
| `primary-dark` | #0A2547 | Hover tombol utama |
| `accent` (Kuning PENS) | #F2C808 | Satu-satunya aksen: penanda menu aktif, hal yang perlu perhatian |
| `ink` (Tinta) | #1B2433 | Teks utama |
| `ink-muted` | #4B5565 | Teks sekunder (kontras ≥ 4,5:1 di atas putih dan `paper`) |
| `paper` (Kertas) | #F5F7FA | Latar aplikasi |
| `line` (Garis) | #DDE2EA | Pembatas tabel dan panel |
| `success` | #1E7B4F | Tercapai |
| `warning` | #8A5A0B | Mendekati ambang |
| `danger` | #B42318 | Belum tercapai / nilai tidak valid |

Netral memakai satu skala saja (`gray` bawaan Tailwind dipetakan ke token di atas); `slate` tidak dipakai. Status selalu disertai teks, tidak hanya warna. Mode gelap dimatikan: blok `@media (prefers-color-scheme: dark)` di `globals.css` dihapus.

### Tipografi

- Satu keluarga: **Plus Jakarta Sans** (Tokotype), dimuat dengan `next/font/google`, bobot 400/500/600/700. Geist dan Geist Mono dihapus; `font-family: Arial` di `body` dihapus.
- Skala: 12 / 14 / 16 / 20 / 28px (token `text-xs` … `text-2xl` disesuaikan di `@theme`). Tidak ada teks di bawah 12px.
- Angka di tabel dan skor memakai `font-variant-numeric: tabular-nums` (kelas utilitas `tabular-nums`), bukan font monospace.
- Huruf biasa (sentence case) untuk semua label; tidak ada label huruf kapital berjarak lebar.

### Layout

| Lebar | Sidebar | Konten |
| --- | --- | --- |
| ≥ 1280px | Penuh, 248px | `margin-left: 248px` |
| 1024–1279px | Rail ikon 72px, label sebagai tooltip | `margin-left: 72px` |
| < 1024px | Drawer di atas konten, dibuka tombol ☰ di header | Lebar penuh |

- `margin-left` diatur dengan kelas responsif, tidak lagi lewat inline style di `app/(app)/layout.tsx`.
- Header: tombol ☰ (hanya < 1024px), judul halaman pada HP, dan slot konteks (lihat "Ditunda").
- Pola halaman: judul `h1` dan tombol aksi utama sebaris (aksi turun ke bawah judul di HP), lalu breadcrumb, lalu isi. Pembeda bagian memakai spasi dan garis `line`, bukan kartu berbayang.

### Sidebar

Grup dan menu (rute yang sudah ada, satu baris per menu, tanpa teks kedua):

- **Ringkasan**: Dashboard (`/dashboard`), Hirarki (`/hirarki`), Laporan (`/laporan`), Evaluasi dosen (`/evaluasi-dosen`)
- **Mata kuliah**: Daftar mata kuliah (`/mata-kuliah`)
- **Kurikulum prodi**: PPM (`/ppm`), Profil lulusan (`/pl`), CPL (`/cpl`), Indikator kinerja (`/ik`), Peta kurikulum (`/peta-kurikulum`)

Menu aktif: garis kuning 3px di sisi kiri, teks `primary` tebal, latar `primary/6%`. Profil pengguna dan tombol keluar di bagian bawah sidebar. Drawer: menutup dengan Esc, klik di luar, atau memilih menu; fokus kembali ke tombol ☰.

### Komponen dasar (`app/components/ui.tsx`)

| Komponen | Perubahan |
| --- | --- |
| `PageHeading` | `h1` biasa (28px, 700), tanpa BlurText |
| `Btn` | Varian `primary`, `secondary` (garis), `ghost`; tinggi 40px; `focus-visible:ring` |
| `Field` / `inputCls` | Tinggi 40px, garis `line`, fokus `primary`; status tidak valid memakai `danger` |
| `Th` / `Td` | Teks 12/14px tanpa huruf kapital; dukungan header sticky lewat kelas |
| `BadgeStatus` | Tercapai / Mendekati / Belum dengan warna status + teks |
| `EmptyState` | Prop baru `action?: ReactNode` untuk tombol langkah berikutnya |
| `Card` | Tetap ada untuk panel, tanpa bayangan; garis `line`, radius 12px |
| `Modal` | Tetap; tambah fokus awal dan tutup dengan Esc |
| `Drawer` (baru) | Dipakai sidebar HP |

### Gerak

Dihapus dari halaman dalam aplikasi: BlurText di judul, TiltCard, SpotlightCard, ShinyText. Dipertahankan: progress bar rute dan transisi halaman ≤ 150ms. Semua animasi tunduk pada `prefers-reduced-motion`. Landing dan login tidak disentuh di sub-proyek ini.

## Cakupan

Dikerjakan:

1. Token, font, dan penghapusan mode gelap di `app/globals.css` dan `app/layout.tsx`.
2. Kerangka baru: `app/(app)/layout.tsx`, `app/components/Sidebar.tsx`, `app/components/Header.tsx`, `Drawer` baru.
3. Komponen dasar di `app/components/ui.tsx` sesuai tabel di atas.
4. Penggantian kelas di semua halaman dalam `app/(app)/`: `text-[9px]`/`text-[10px]`/`text-[11px]` → `text-xs`; `slate-*` → skala netral; hex #103968/#0A2547/#F2C808 → token; pemakaian TiltCard/SpotlightCard/ShinyText di halaman dalam aplikasi dihapus. Tata letak isi halaman tidak diubah.

Ditunda:

- **Pemilih konteks MK/tahun/kelas di header** → sub-proyek 2. Wireframe yang disetujui menaruhnya di header, tetapi memindahkannya menyentuh state pilihan di setiap halaman (`tahunDipilih`, `kelasDipilih`, `OfferingSelect` di 4 halaman). Sub-proyek 1 hanya menyiapkan slot di header.
- Desain ulang isi halaman input nilai, dashboard, peta kurikulum, dan elemen "rantai capaian" → sub-proyek 2.
- Landing, login, tur → sub-proyek 3.

## Keputusan penilaian yang dibawa ke sub-proyek 2

Dicatat di sini agar tidak hilang; tidak dikerjakan di sub-proyek 1.

- Nilai akhir mengikuti lembar rubrik: nilai tiap asesmen = rata-rata biasa indikatornya; nilai akhir = Kuis × 10% + Laporan × 30% + Mini Project × 10% + Mid × 25% + Post × 25%.
- Input menjadi 22 sel sesuai lembar penilaian (Mini Project 4 indikator).
- Skor Sub-CPMK mengikuti rubrik dan RPS: berbobot sesuai tabel "Distribusi Bobot Sub-CPMK pada Komponen Penilaian".

## Pengujian

- Screenshot sebelum/sesudah di 375, 768, 1100, 1440px untuk dashboard, input nilai, peta kurikulum, CPL.
- 375px: tidak ada scroll horizontal di level halaman; `main` selebar viewport.
- Keyboard: semua menu dan tombol tercapai dengan Tab, fokus terlihat; drawer dan modal menutup dengan Esc.
- Kontras teks memenuhi WCAG 2.1 AA (dicek dengan skill accessibility-review).
- `npm test`, `tsc --noEmit`, dan eslint tidak bertambah masalah dibanding sebelum perubahan.
- `grep` di `app/(app)`, `app/components` (kecuali `reactbits/`): tidak ada `text-[9px]`, `text-[10px]`, `text-[11px]`, `#103968`, `slate-`.
- Perubahan dibiarkan tanpa commit.
