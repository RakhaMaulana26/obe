# Fondasi Desain dan Kerangka Aplikasi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Pengguna meminta **tanpa commit**. Perubahan visual diverifikasi dengan pemeriksaan otomatis (grep, tsc, eslint, test) dan pemeriksaan browser di 375/768/1100/1440px, bukan unit test.

**Goal:** Fondasi visual konsisten (warna PENS, Plus Jakarta Sans, skala teks) dan kerangka yang bisa dipakai di HP sampai desktop, tanpa mengubah isi halaman.

**Architecture:** Token di `@theme` Tailwind 4 (`app/globals.css`), font lewat `next/font/google` di `app/layout.tsx`, kerangka di `app/(app)/layout.tsx` + `Sidebar.tsx` + `Header.tsx`, primitif di `app/components/ui.tsx`, lalu penggantian kelas di seluruh `app/(app)`.

**Tech Stack:** Next.js 16.3.4 (`next/font/google` → `Plus_Jakarta_Sans`), Tailwind 4, React 19, motion.

**Spec:** `docs/superpowers/specs/2026-11-04-desain-fondasi-design.md`

## Global Constraints

- Tanpa commit dan tanpa push.
- Warna: primary #103968, primary-dark #0A2547, accent #F2C808, ink #1B2433, ink-muted #4B5565, paper #F5F7FA, line #DDE2EA, success #1E7B4F, warning #8A5A0B, danger #B42318.
- Skala teks 12/14/16/20/28px; tidak ada teks < 12px di `app/(app)` dan `app/components` (kecuali `reactbits/`).
- Breakpoint kerangka: drawer < 1024px, rail 72px 1024–1279px, penuh 248px ≥ 1280px.
- Nama varian `Btn` yang sudah dipakai tetap (`primary`, `accent`, `outline`, `danger`, `ghost`).
- Menu Laporan dan Evaluasi dosen tetap tersembunyi seperti di kode sekarang.
- Landing (`app/page.tsx`) dan login tidak disentuh (sub-proyek 3).

## Review Focus

1. Lebar 375px: `main` selebar viewport, tidak ada scroll horizontal halaman; tabel lebar tetap bisa digeser di dalam wadahnya.
2. Drawer: Esc, klik latar, dan memilih menu menutupnya; fokus kembali ke tombol ☰; body tidak bergeser.
3. Hydration: teks yang bergantung pada localStorage (nama/peran pengguna) dirender setelah mount, tidak memicu hydration mismatch.
4. Tur panduan: atribut `data-tour` pada menu sidebar tetap ada agar tur 12 langkah masih menemukan sasarannya.
5. Cetak (`print:`): sidebar/header tetap tersembunyi saat mencetak laporan.

---

### Task 1: Token warna dan font

**Files:** `app/globals.css`, `app/layout.tsx`.
- Token di `@theme inline`: warna di atas sebagai `--color-*`, `--font-sans: var(--font-jakarta)`; hapus blok `prefers-color-scheme: dark` dan `font-family: Arial` di `body`; `body` memakai `bg-paper text-ink font-sans antialiased`; utilitas `.tabular-nums` bawaan Tailwind dipakai untuk angka.
- `layout.tsx`: ganti Geist/Geist_Mono dengan `Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-jakarta" })`.
- Verifikasi: computed `font-family` body diawali Plus Jakarta Sans di browser; tsc bersih.

### Task 2: Primitif UI

**Files:** `app/components/ui.tsx`.
- `PageHeading`: `h1` 28px/700 `text-primary` tanpa BlurText.
- `Card`: radius 12px, `border-line`, tanpa bayangan.
- `StatCard`, `Bar`: tanpa animasi masuk (`whileInView`) dan tanpa CountUp; angka `tabular-nums`.
- `Btn`: tinggi 40px, `focus-visible:ring-2 ring-primary/40 ring-offset-2`, tanpa animasi tap; varian `outline` = garis `line`.
- `inputCls`: tinggi 40px, `border-line`, fokus `primary`.
- `BadgeStatus`/`BadgeHuruf`: 12px, warna token `success`/`danger`.
- `Th`: 12px, sentence case (tanpa `uppercase tracking-wide`), `text-ink-muted`.
- `EmptyState`: prop opsional `action?: ReactNode`.
- `Modal`: tutup dengan Esc, fokus awal ke dialog.
- `Drawer` (baru): panel kiri + latar, tutup Esc/klik latar, `role="dialog" aria-modal`.
- Verifikasi: tsc, eslint (+0), grep tidak ada `BlurText` di `ui.tsx`.

### Task 3: Kerangka (sidebar, header, layout)

**Files:** `app/(app)/layout.tsx`, `app/components/Sidebar.tsx`, `app/components/Header.tsx`.
- Layout: `main` memakai `lg:ml-[72px] xl:ml-[248px]` dan padding responsif; inline style dihapus.
- Sidebar: grup "Ringkasan" (Dashboard, Hirarki), "Mata kuliah" (Daftar mata kuliah), "Kurikulum prodi" (PPM, Profil lulusan, CPL, Indikator kinerja, Peta kurikulum); satu baris per menu; aktif = garis kuning 3px kiri + teks primary tebal + latar `primary/6%`; rail (ikon + tooltip `title`) pada lg; nama/peran pengguna dan tombol Keluar (dengan konfirmasi) di bawah, dirender setelah mount.
- Header: tombol ☰ (< lg) membuka `Drawer` berisi sidebar; judul halaman pada HP; tombol tur "?" tetap; menu profil pindah ke sidebar.
- Verifikasi browser: 375 (drawer, `main` = viewport), 1100 (rail), 1440 (penuh); keyboard + Esc; tidak ada hydration error di console.

### Task 4: Penggantian kelas di halaman

**Files:** semua `app/(app)/**/*.tsx`, `app/components/{charts,OfferingSelect,DokumenMKEditor,DocxEditorWorkspace,Tour,RouteProgress,PageTransition}.tsx`.
- `text-[9px]|text-[10px]|text-[11px]` → `text-xs`; `text-[13px]` → `text-sm`; `text-[15px]` → `text-base`; `text-[26px]` → `text-2xl`.
- `slate-` → `gray-`; `#103968` → token (`text-primary`/`bg-primary`), `#0a2547` → `primary-dark`.
- Label `uppercase tracking-*` → sentence case.
- Halaman dalam aplikasi: hapus pemakaian `TiltCard`, `SpotlightCard`, `ShinyText` (ganti `div`).
- Verifikasi: grep nol untuk pola di atas (di luar `reactbits/`, `app/page.tsx`, `app/login`); tsc; eslint +0; screenshot sebelum/sesudah.

### Task 5: Verifikasi dan review

`npm test`; tsc; eslint vs baseline; browser 375/768/1100/1440 untuk dashboard, input nilai, peta kurikulum, CPL; audit kontras dengan skill design:accessibility-review; reviewer terpisah.
