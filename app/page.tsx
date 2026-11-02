"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import SplitText from "@/app/components/reactbits/SplitText";
import ShinyText from "@/app/components/reactbits/ShinyText";
import Marquee from "@/app/components/reactbits/Marquee";
import TiltCard from "@/app/components/reactbits/TiltCard";
import FadeContent from "@/app/components/reactbits/FadeContent";
import AnimatedList, { AnimatedItem } from "@/app/components/reactbits/AnimatedList";
import Accordion from "@/app/components/reactbits/Accordion";
import SpotlightCard from "@/app/components/reactbits/SpotlightCard";
import CountUp from "@/app/components/reactbits/CountUp";

// ------------------------------------------------------------------
// Landing page publik SPK OBE — menjelaskan keseluruhan aplikasi.
// Struktur mengikuti referensi: navbar, hero, tentang, alur,
// fitur, FAQ, kontak, CTA, footer.
// ------------------------------------------------------------------

const NAV = [
  { id: "beranda", label: "Beranda" },
  { id: "tentang", label: "Tentang" },
  { id: "alur", label: "Alur" },
  { id: "fitur", label: "Fitur" },
  { id: "faq", label: "FAQ" },
  { id: "kontak", label: "Hubungi Kami" },
];

const JENJANG = [
  { kode: "Nilai", judul: "Nilai Asesmen", desc: "Tugas, praktikum, ETS & EAS skala 0–100 — satu-satunya data yang diinput dosen." },
  { kode: "Sub", judul: "Sub-CPMK", desc: "Capaian kecil per topik, rata-rata berbobot dari nilai asesmen." },
  { kode: "CPMK", judul: "CPMK", desc: "Capaian tiap mata kuliah, gabungan Sub-CPMK sesuai porsinya." },
  { kode: "IK", judul: "Indikator Kinerja", desc: "Kemampuan spesifik terukur, jembatan ke capaian lulusan." },
  { kode: "CPL", judul: "CPL", desc: "Capaian Pembelajaran Lulusan program studi." },
];

const FITUR = [
  {
    href: "/dashboard",
    judul: "Dashboard Capaian",
    desc: "Angka kunci kelas dalam 3 tab: Ringkasan, Diagnosis titik lemah, dan Detail sebaran nilai.",
  },
  {
    href: "/hirarki",
    judul: "Hirarki Capaian",
    desc: "Peta perhitungan CPL → Sub-CPMK plus mode Jalur Sederhana langkah demi langkah per mata kuliah.",
  },
  {
    href: "/laporan",
    judul: "Laporan & Ekspor",
    desc: "Rekap per jenjang, rekomendasi per mahasiswa, unduh CSV dan cetak PDF akreditasi.",
  },
  {
    href: "/mata-kuliah",
    judul: "Mata Kuliah & RPS",
    desc: "Kelola MK dalam 4 langkah: Struktur → Bobot → Nilai → Capaian, dengan wizard terpandu.",
  },
  {
    href: "/capaian",
    judul: "Capaian per Mahasiswa",
    desc: "Ketertelusuran 5 langkah per mahasiswa sampai CPL, rumus disembunyikan di balik “Lihat cara hitung”.",
  },
  {
    href: "/ppm",
    judul: "PPM",
    desc: "Lihat daftar PPM program studi yang tercantum pada Kurikulum 2026.",
  },
  {
    href: "/pl",
    judul: "Kurikulum PL • CPL • IK",
    desc: "Kelola profil lulusan sebagai referensi, serta CPL dan indikator yang digunakan dalam perhitungan.",
  },
  {
    href: "/evaluasi-dosen",
    judul: "Evaluasi Dosen",
    desc: "Nilai kinerja pengampu per MK+tahun: rata-rata capaian, ketuntasan, dan titik lemah mengajar.",
  },
];

const FAQ_KIRI = [
  {
    q: "Apa itu SPK OBE?",
    a: "Sistem Pendukung Keputusan untuk mengukur capaian pembelajaran berbasis Outcome-Based Education. Nilai mahasiswa dihitung berjenjang dari asesmen sampai CPL, sehingga prodi tahu bagian mana yang perlu diperbaiki. Profil lulusan dikelola sebagai referensi tanpa skor.",
  },
  {
    q: "Bagaimana nilai dihitung?",
    a: "Dengan rata-rata berbobot berjenjang sampai CPL: tiap tingkat adalah jumlah (nilai anak × porsinya). Dosen cukup menginput nilai dan mengatur bobot; sisanya dihitung otomatis dan bisa diverifikasi per mahasiswa.",
  },
  {
    q: "Apa itu batas lulus (T)?",
    a: "Skor minimal agar capaian dinyatakan tercapai. Acuan awal T = 60 (setara nilai C). Geser T dan seluruh angka, chart, serta status di aplikasi ikut berubah.",
  },
];

const FAQ_KANAN = [
  {
    q: "Apa beda Sub-CPMK, CPMK, IK, CPL, dan PL?",
    a: "Sub-CPMK dan CPMK spesifik per mata kuliah; IK adalah kemampuan spesifik terukur; CPL adalah capaian level prodi yang menjadi batas akhir perhitungan; PL adalah informasi peran target lulusan tanpa skor.",
  },
  {
    q: "Siapa yang bisa masuk aplikasi?",
    a: "Ada dua peran: Dosen (mengelola MK, RPS, dan nilai) dan Prodi (mengelola kurikulum PL/CPL/IK serta melihat laporan). Coba keduanya lewat akun demo di halaman login.",
  },
  {
    q: "Bagaimana cara mengekspor laporan?",
    a: "Buka halaman Laporan, atur filter, lalu klik Unduh Excel (CSV) atau Cetak PDF. Berkas siap menjadi bukti akreditasi.",
  },
  {
    q: "Bagaimana evaluasi dosen dinilai?",
    a: "Dari capaian kelas yang diampunya per MK dan tahun ajaran: rata-rata CPMK, persentase mahasiswa tuntas, dan selisih vs rata-rata keseluruhan. Status Baik / Cukup / Perlu Pembinaan lengkap dengan saran titik lemah mengajar.",
  },
];

function Ikon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function Navbar() {
  const [solid, setSolid] = useState(false);
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    const cek = () => setSolid(window.scrollY > 24);
    cek();
    window.addEventListener("scroll", cek, { passive: true });
    return () => window.removeEventListener("scroll", cek);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid ? "bg-white/95 shadow-sm ring-1 ring-gray-200/70 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#beranda" className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm ${solid ? "bg-primary" : "bg-white/10 ring-1 ring-white/25 backdrop-blur"}`}>
            <Image src="/penswhite.png" alt="Logo PENS" width={28} height={28} className="h-7 w-7 object-contain" priority />
          </span>
          <span className={`text-[15px] font-bold ${solid ? "text-primary" : "text-white"}`}>
            SPK OBE
            <span className={`block text-[10px] font-medium ${solid ? "text-gray-400" : "text-white/60"}`}>PENS • D4 TI</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                solid ? "text-gray-600 hover:bg-gray-100 hover:text-primary" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {n.label}
            </a>
          ))}
          <Link
            href="/login"
            className="ml-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-primary transition hover:brightness-95"
          >
            Masuk
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/login" className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-bold text-primary">
            Masuk
          </Link>
          <button
            onClick={() => setBuka(!buka)}
            aria-label="Buka menu"
            aria-expanded={buka}
            className={`rounded-lg p-2 ${solid ? "text-primary hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={buka ? "M6 18L18 6M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      {buka ? (
        <nav className="border-t border-gray-100 bg-white px-4 py-3 shadow-lg lg:hidden" aria-label="Navigasi seluler">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              onClick={() => setBuka(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary"
            >
              {n.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const isiY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const isiOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* HERO — parallax: latar bergerak lebih lambat dari konten */}
      <section id="beranda" ref={heroRef} className="relative flex min-h-[96vh] items-center overflow-hidden bg-primary">
        <motion.div aria-hidden style={{ y: bgY }} className="absolute inset-0 scale-110">
          <Image src="/gedungpens2.jpg" alt="" fill priority className="object-cover" sizes="100vw" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0a2547]/95 via-[#103968]/75 to-[#103968]/30" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(600px circle at 12% 20%, rgba(242,200,8,0.16), transparent 60%)" }}
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-28 pt-32 sm:px-6">
          <motion.div style={{ y: isiY, opacity: isiOpacity }} className="max-w-2xl">
            <FadeContent>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-accent ring-1 ring-white/20 backdrop-blur">
                SPK OBE • PENS
              </span>
            </FadeContent>
            <SplitText text="Ukur capaian." as="h1" className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl" />
            <SplitText text="Pahami masalah." as="p" delay={0.35} className="text-4xl font-extrabold leading-tight text-white sm:text-5xl" />
            <FadeContent delay={0.7} y={10}>
              <ShinyText text="Tingkatkan pembelajaran." as="p" className="text-4xl font-extrabold leading-tight sm:text-5xl" />
            </FadeContent>
            <FadeContent delay={0.2}>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75">
                Platform pengukuran capaian pembelajaran PENS: nilai asesmen mengalir berjenjang
                Sub-CPMK → CPMK → IK → CPL, lengkap dengan diagnosis titik lemah dan laporan capaian.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-primary transition hover:brightness-95">
                  Masuk Aplikasi →
                </Link>
                <a href="#alur" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/40 transition hover:bg-white/10">
                  Jelajahi Alur
                </a>
              </div>
              <dl className="mt-10 flex max-w-lg gap-8">
                {[
                  { nilai: 6, label: "Jenjang penilaian" },
                  { nilai: 28, label: "Mahasiswa terdata" },
                  { nilai: 60, label: "Batas lulus (T)", prefix: "T = " },
                ].map((s) => (
                  <div key={s.label}>
                    <dt className="order-2 mt-1 text-xs text-white/60">{s.label}</dt>
                    <dd className="text-2xl font-extrabold text-white">
                      {s.prefix ?? ""}
                      <CountUp value={s.nilai} />
                    </dd>
                  </div>
                ))}
              </dl>
            </FadeContent>
            <motion.a
              href="#tentang"
              aria-label="Gulir ke bawah"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="mt-12 inline-flex h-11 w-11 items-center justify-center rounded-full text-xl text-white ring-1 ring-white/40 transition hover:bg-white/10"
            >
              ↓
            </motion.a>
          </motion.div>
        </div>

        <svg aria-hidden viewBox="0 0 1440 70" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[50px] w-full text-white">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,70 L0,70 Z" fill="currentColor" />
        </svg>
      </section>

      {/* PITA BERJALAN — kata kunci aplikasi */}
      <Marquee items={["Dashboard Capaian", "Hirarki Capaian", "Laporan & Ekspor", "Mata Kuliah & RPS", "Capaian Mahasiswa", "PPM • PL • CPL • IK"]} />

      {/* TENTANG */}
      <section id="tentang" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <FadeContent>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/60">Tentang SPK OBE</p>
            <SplitText text="Satu alur nilai, dari kelas sampai CPL" as="h2" className="mt-2 text-3xl font-extrabold text-gray-900" />
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              SPK OBE adalah aplikasi pengukuran capaian pembelajaran D4 Teknik Informatika PENS.
              Dosen menginput nilai dan mengatur porsi; sistem menghitung seluruh jenjang otomatis,
              menandai bagian yang belum lulus, dan menyusun rekomendasi perbaikan.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Rata-rata berbobot berjenjang — transparan dan bisa diverifikasi per mahasiswa",
                "Diagnosis titik lemah otomatis (capaian terendah per jenjang)",
                "Laporan siap akreditasi: rekap, CSV/Excel, dan cetak PDF",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-2">
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">Web Based App</span>
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">Data tersimpan lokal</span>
            </div>
          </FadeContent>

          <FadeContent delay={0.1}>
            <SpotlightCard className="p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Aliran nilai — bawah ke atas</p>
              <ol className="relative space-y-1 border-l-2 border-primary/15 pl-5">
                {[...JENJANG].reverse().map((j) => (
                  <li key={j.kode} className="relative py-2">
                    <span aria-hidden className="absolute -left-[27px] top-3 h-3 w-3 rounded-full bg-accent ring-4 ring-accent/25" />
                    <p className="text-sm font-bold text-primary">
                      <span className="mr-2 rounded-md bg-primary px-1.5 py-0.5 font-mono text-[11px] text-white">{j.kode}</span>
                      {j.judul}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{j.desc}</p>
                  </li>
                ))}
              </ol>
            </SpotlightCard>
          </FadeContent>
        </div>
      </section>

      {/* ALUR / LAYANAN */}
      <section id="alur" className="scroll-mt-20 bg-gray-50 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <FadeContent className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/60">Alur Penilaian</p>
            <SplitText text="5 tingkat, 1 alur yang mudah diikuti" as="h2" className="mt-2 text-3xl font-extrabold text-gray-900" />
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              Setiap tingkat dihitung dari tingkat di bawahnya sesuai porsinya.
              Klik kartu fitur di bawah untuk membuka halamannya langsung di aplikasi.
            </p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              Coba alurnya →
            </Link>
          </FadeContent>

          <AnimatedList className="space-y-3" step={0.06}>
            {JENJANG.map((j, i) => (
              <AnimatedItem key={j.kode}>
                <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.06] font-mono text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-gray-900">{j.judul} <span className="ml-1 font-mono text-xs font-medium text-gray-400">{j.kode}</span></p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{j.desc}</p>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </AnimatedList>
        </div>
      </section>

      {/* FITUR */}
      <section id="fitur" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeContent className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/60">Fitur</p>
            <SplitText text="Semua yang Anda butuhkan" as="h2" className="mt-2 text-3xl font-extrabold text-gray-900" />
            <p className="mt-3 text-sm text-gray-500">Ekosistem lengkap pengukuran capaian — dari input nilai sampai laporan prodi.</p>
          </FadeContent>

          <AnimatedList className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" step={0.06}>
            {FITUR.map((f) => (
              <AnimatedItem key={f.judul} className="h-full">
                <TiltCard className="h-full">
                <Link href={f.href} className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-primary hover:shadow-md">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Ikon d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm4 3h8M8 12h8M8 16h5" />
                  </span>
                  <p className="mt-4 text-[15px] font-bold text-gray-900 group-hover:text-primary">{f.judul}</p>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-600">{f.desc}</p>
                  <span className="mt-4 text-[13px] font-bold text-primary">Buka →</span>
                </Link>
                </TiltCard>
              </AnimatedItem>
            ))}
          </AnimatedList>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeContent className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/60">FAQ</p>
            <SplitText text="Frequently Asked Questions" as="h2" className="mt-2 text-3xl font-extrabold text-gray-900" />
          </FadeContent>
          <div className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="rounded-lg bg-primary/[0.06] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">Umum</p>
              {FAQ_KIRI.map((f) => (
                <Accordion key={f.q} title={f.q} className="shadow-sm">
                  <p className="text-sm leading-relaxed text-gray-600">{f.a}</p>
                </Accordion>
              ))}
            </div>
            <div className="space-y-3">
              <p className="rounded-lg bg-primary/[0.06] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">Dosen & Prodi</p>
              {FAQ_KANAN.map((f) => (
                <Accordion key={f.q} title={f.q} className="shadow-sm">
                  <p className="text-sm leading-relaxed text-gray-600">{f.a}</p>
                </Accordion>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section id="kontak" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeContent>
            <SplitText text="Hubungi Kami" as="h2" className="text-3xl font-extrabold text-gray-900" />
          </FadeContent>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <FadeContent>
              <div className="h-full min-h-[320px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <iframe
                  title="Peta Politeknik Elektronika Negeri Surabaya"
                  src="https://www.google.com/maps?q=Politeknik+Elektronika+Negeri+Surabaya&output=embed"
                  className="h-full min-h-[320px] w-full"
                  loading="lazy"
                />
              </div>
            </FadeContent>
            <FadeContent delay={0.08}>
              <div className="flex h-full flex-col justify-center rounded-2xl border border-gray-200 bg-gray-50/60 p-8">
                <p className="text-base font-bold text-gray-900">Politeknik Elektronika Negeri Surabaya</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  Kampus PENS, Jalan Raya ITS, Keputih, Kecamatan Sukolilo, Kota Surabaya, Jawa Timur 60111
                </p>
                <ul className="mt-5 space-y-3 text-sm">
                  <li className="flex items-center gap-3 text-gray-700">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.06] text-primary"><Ikon d="M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></span>
                    info@pens.ac.id
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.06] text-primary"><Ikon d="M3 5a2 2 0 012-2h3.3a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.06l-2.2 2.2a16 16 0 006 6l2.2-2.2a1 1 0 011.06-.27l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z" /></span>
                    +62 31 594 7280
                  </li>
                  <li className="flex items-center gap-3 text-gray-700">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.06] text-primary"><Ikon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></span>
                    Senin–Jumat, 08.00–16.00 WIB
                  </li>
                </ul>
              </div>
            </FadeContent>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-16 sm:px-6">
        <FadeContent className="mx-auto max-w-2xl text-center">
          <SplitText text="Siap mengukur capaian pembelajaran?" as="h2" className="text-2xl font-extrabold text-white sm:text-3xl" />
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
            Masuk dengan akun demo Dosen atau Prodi dan jelajahi seluruh alur — dari input nilai sampai laporan.
          </p>
          <Link href="/login" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3 text-sm font-bold text-primary transition hover:brightness-95">
            Masuk ke Aplikasi →
          </Link>
        </FadeContent>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a2547] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white/10">
              <Image src="/penswhite.png" alt="Logo PENS" width={24} height={24} className="h-6 w-6 object-contain" />
            </span>
            <span className="text-sm font-bold text-white">SPK OBE <span className="font-normal text-white/50">• PENS D4 TI</span></span>
          </div>
          <p className="text-xs text-white/40">© 2026 Politeknik Elektronika Negeri Surabaya. All rights reserved.</p>
          <a href="#beranda" aria-label="Kembali ke atas" className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-primary transition hover:brightness-95">
            ↑
          </a>
        </div>
      </footer>
    </div>
  );
}
