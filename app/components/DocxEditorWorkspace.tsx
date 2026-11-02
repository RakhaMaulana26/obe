"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { StrukturMataKuliah } from "@/app/lib/data";
import { DAFTAR_CPL, DAFTAR_IK } from "@/app/lib/data";
import { Card, PageHeading } from "@/app/components/ui";
import {
  KATEGORI_RUBRIK,
  LABEL_KATEGORI_RUBRIK,
  type DokumenMKConfig,
  type KategoriRubrik,
  type MataKuliahDokumen,
  type RubrikKriteriaDokumen,
  type RencanaSubCPMK,
  type RencanaTugasRubrik,
} from "@/app/lib/dokumen";

type Props = {
  mode: "rps" | "rubrik";
  mk: MataKuliahDokumen;
  struktur: StrukturMataKuliah;
  pemetaanKurikulum: Record<string, Record<string, number>>;
  konfigurasi: DokumenMKConfig;
  totalBobot: number;
  totalValid: boolean;
  sksValid: boolean;
  strukturValid: boolean;
  sedangMenghasilkan: boolean;
  pesan: string;
  onUmumChange: (kolom: keyof DokumenMKConfig["umum"], nilai: string) => void;
  onRencanaChange: (kodeSub: string, kolom: keyof RencanaSubCPMK, nilai: string) => void;
  onBobotChange: (kodeSub: string, kategori: KategoriRubrik, nilai: string) => void;
  onTugasChange: (kategori: KategoriRubrik, kolom: keyof RencanaTugasRubrik, nilai: string) => void;
  onRubrikDetailChange: (kategori: KategoriRubrik, kodeSub: string, detail: RubrikKriteriaDokumen[]) => void;
  onCPMKDeskripsiChange?: (kodeCpmk: string, deskripsi: string) => void;
  onSubCPMKChange?: (kodeSub: string, field: "deskripsi" | "level" | "cpmk", nilai: string) => void;
  onToggleMatriksIKCPMK?: (kodeCpmk: string, kodeIk: string) => void;
  onToggleMatriksCPMKSub?: (kodeSub: string, kodeCpmk: string) => void;
  onRpsUjianChange?: (jenis: "mid" | "post", teks: string) => void;
  onJudulKustomChange?: (kunci: string, nilai: string) => void;
  onDownload: () => void;
};

function defaultKriteria(indikator: string, bobot: number): RubrikKriteriaDokumen {
  return {
    indikator,
    bobot,
    tingkat: [
      "Sangat baik: indikator tercapai secara tepat, lengkap, dan mandiri.",
      "Baik: indikator tercapai dengan sedikit kekurangan.",
      "Cukup: sebagian indikator tercapai dan masih perlu perbaikan.",
      "Kurang: bukti pencapaian indikator belum memadai.",
    ],
  };
}

const DEFAULT_HOLISTIK_DESK: Record<KategoriRubrik, string[]> = {
  laporan: [
    "Kode berjalan benar dan rapi, seluruh tahapan lengkap, hasil (tabel/grafik/metrik) tepat, analisis tajam dan dikaitkan dengan konteks data.",
    "Kode berjalan benar dengan kekurangan kecil, hasil sebagian besar tepat, interpretasi benar tetapi belum mendalam.",
    "Kode berjalan sebagian, terdapat beberapa kesalahan hasil, interpretasi masih umum.",
    "Kode banyak error atau hasil tidak tepat, analisis lemah.",
    "Kode tidak berjalan/tidak dikumpulkan atau tidak menunjukkan pemahaman materi.",
  ],
  proyek: [
    "Aplikasi berjalan lancar, hasil pemrosesan relevan dan dievaluasi dengan cermat, kode terstruktur baik, seluruh anggota menguasai materi.",
    "Aplikasi berjalan baik dengan kekurangan kecil pada evaluasi atau antarmuka.",
    "Aplikasi berjalan terbatas, evaluasi belum lengkap, integrasi parsial.",
    "Aplikasi banyak error, fungsionalitas utama tidak berjalan sesuai spesifikasi.",
    "Aplikasi tidak selesai atau tidak didemonstrasikan.",
  ],
  kuis: [
    "Menguasai konsep secara menyeluruh, seluruh jawaban dan perhitungan benar serta terstruktur.",
    "Menguasai konsep dengan baik, langkah perhitungan benar dengan sedikit kesalahan minor.",
    "Memahami konsep utama, namun terdapat beberapa kesalahan konsep atau perhitungan.",
    "Memahami konsep dasar, tetapi banyak kesalahan dalam penerapan langkah penyelesaian.",
    "Belum menunjukkan pemahaman konsep yang memadai.",
  ],
  mid: [
    "Penguasaan materi teori dan kemampuan live coding sangat baik, seluruh soal terselesaikan dengan tepat.",
    "Penguasaan materi teori dan praktik baik dengan kekurangan kecil pada salah satu bagian.",
    "Memahami sebagian konsep dan praktik, namun terdapat kesalahan pada implementasi algoritma.",
    "Penguasaan materi sangat terbatas, banyak kesalahan pada pemahaman konsep dan kode.",
    "Tidak menunjukkan ketercapaian kemampuan akhir yang diuji.",
  ],
  post: [
    "Menguasai seluruh topik lanjutan secara komprehensif, implementasi kode dan evaluasi model sangat tepat.",
    "Menguasai materi dengan baik, hasil implementasi dan evaluasi sebagian besar tepat.",
    "Pencapaian kompetensi sebagian, terdapat kekurangan penting pada evaluasi atau analisis model.",
    "Penguasaan kompetensi minim, sebagian besar implementasi tidak berjalan atau keliru.",
    "Tidak menunjukkan pencapaian kompetensi yang diuji.",
  ],
};

export default function DocxEditorWorkspace(props: Props) {
  const {
    mode,
    mk,
    struktur,
    pemetaanKurikulum,
    konfigurasi,
    totalBobot,
    totalValid,
    sksValid,
    strukturValid,
    sedangMenghasilkan,
    pesan,
    onUmumChange,
    onRencanaChange,
    onBobotChange,
    onTugasChange,
    onRubrikDetailChange,
    onCPMKDeskripsiChange,
    onSubCPMKChange,
    onToggleMatriksIKCPMK,
    onToggleMatriksCPMKSub,
    onRpsUjianChange,
    onJudulKustomChange,
    onDownload,
  } = props;

  const isRPS = mode === "rps";
  const [tabAktif, setTabAktif] = useState<string>("all");

  const bobotIKMK = pemetaanKurikulum[mk.kode] ?? {};
  const ikDibebankan = DAFTAR_IK.filter((ik) => (bobotIKMK[ik.kode] ?? 0) > 0);
  const cplDibebankan = DAFTAR_CPL.filter((cpl) =>
    ikDibebankan.some((ik) => ik.cpl === cpl.kode),
  );

  const bobotPerSub = useMemo(() => {
    const res: Record<string, number> = {};
    struktur.sub.forEach((sub) => {
      res[sub.kode] = KATEGORI_RUBRIK.reduce(
        (sum, cat) => sum + (konfigurasi.bobotRubrik[sub.kode]?.[cat] ?? 0),
        0,
      );
    });
    return res;
  }, [struktur.sub, konfigurasi.bobotRubrik]);

  const bobotPerKategori = useMemo(() => {
    const res: Record<KategoriRubrik, number> = {
      kuis: 0,
      laporan: 0,
      proyek: 0,
      mid: 0,
      post: 0,
    };
    KATEGORI_RUBRIK.forEach((cat) => {
      res[cat] = struktur.sub.reduce(
        (sum, sub) => sum + (konfigurasi.bobotRubrik[sub.kode]?.[cat] ?? 0),
        0,
      );
    });
    return res;
  }, [struktur.sub, konfigurasi.bobotRubrik]);

  function criteriaUntuk(kategori: KategoriRubrik, kodeSub: string): RubrikKriteriaDokumen[] {
    const existing = konfigurasi.rubrikDetail?.[kategori]?.[kodeSub];
    if (existing?.length) return existing;
    const sub = struktur.sub.find((item) => item.kode === kodeSub);
    const indikator = konfigurasi.rencanaSub[kodeSub]?.indikator || sub?.deskripsi || kodeSub;
    return [defaultKriteria(`${kodeSub}: ${indikator}`, konfigurasi.bobotRubrik[kodeSub]?.[kategori] ?? 0)];
  }

  function ubahKriteria(
    kategori: KategoriRubrik,
    kodeSub: string,
    index: number,
    nilai: Partial<RubrikKriteriaDokumen>,
  ) {
    const detail = criteriaUntuk(kategori, kodeSub).map((item, i) =>
      i === index ? { ...item, ...nilai } : item,
    );
    onRubrikDetailChange(kategori, kodeSub, detail);
  }

  const tabsRPS = [
    { id: "all", label: "Semua Bagian" },
    { id: "identitas", label: "Identitas & Capaian (Tabel 0)" },
    { id: "mingguan", label: "Rencana Mingguan (Tabel 1)" },
  ];

  const tabsRubrik = [
    { id: "all", label: "Semua Bagian" },
    { id: "pemetaan", label: "Ringkasan Bobot" },
    { id: "laporan", label: "Laporan Praktikum" },
    { id: "proyek", label: "Mini Project" },
    { id: "kuis", label: "Kuis" },
    { id: "mid", label: "Mid Test" },
    { id: "post", label: "Post Test" },
  ];

  const daftarTabs = isRPS ? tabsRPS : tabsRubrik;

  return (
    <div className="space-y-6">
      {/* 1. APP HEADER: PageHeading standar yang seragam dengan halaman lain */}
      <PageHeading
        title={`${isRPS ? "Rencana Pembelajaran Semester (RPS)" : "Rubrik Penilaian"} — ${mk.kode}`}
        action={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <Link
              href={`/mata-kuliah/${mk.kode}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              ← Detail MK
            </Link>
            <Link
              href={`/mata-kuliah/${mk.kode}/dokumen/${isRPS ? "rubrik" : "rps"}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Buka {isRPS ? "Rubrik" : "RPS"}
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak
            </button>
            <button
              type="button"
              onClick={onDownload}
              disabled={sedangMenghasilkan}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {sedangMenghasilkan ? "Menyiapkan DOCX…" : `Unduh ${isRPS ? "RPS" : "Rubrik"} (.docx)`}
            </button>
          </div>
        }
      />

      {/* 2. CARD NAVIGASI & STATUS: Desain bersih, ringkas, tanpa sidebar berlebihan */}
      <Card className="no-print p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Segmented Tab Controls */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-100 p-1 border border-gray-200">
            {daftarTabs.map((tab) => {
              const aktif = tabAktif === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTabAktif(tab.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    aktif
                      ? "bg-white text-primary shadow-xs font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Status Badges Ringkas */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
              {mk.sks} SKS
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
              Semester {mk.semester ?? "—"}
            </span>

            {isRPS ? (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium ${
                  sksValid
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {sksValid
                  ? `SKS: ${konfigurasi.umum.sksTeori || 0}T + ${konfigurasi.umum.sksPraktik || 0}P ✓`
                  : "Periksa Pembagian SKS"}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium ${
                  totalValid
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {totalValid ? "Total Bobot 100% ✓" : `Total Bobot: ${totalBobot.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 pl-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tersimpan otomatis
            </span>
          </div>
        </div>

        {pesan ? (
          <div
            className={`mt-3 rounded-lg px-3.5 py-2 text-xs font-medium ${
              pesan.includes("berhasil")
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            {pesan}
          </div>
        ) : null}
      </Card>

      {/* 3. DOCUMENT PREVIEW CANVAS: Tampilan lembar kertas dokumen DOCX yang luas, rapi, dan bersih */}
      <div className="w-full flex flex-col items-center">
        {isRPS ? (
          <>
            {/* RPS LEMBAR 1: IDENTITAS & CAPAIAN (TABEL 0) */}
            {(tabAktif === "all" || tabAktif === "identitas") && (
              <div className="doc-paper-sheet w-full max-w-5xl rounded-2xl bg-white p-6 sm:p-10 border border-gray-200 shadow-sm mb-8">
                {/* KOP SPMI PENS */}
                <table className="doc-kop-table">
                  <tbody>
                    <tr>
                      <td rowSpan={4} className="w-24 text-center bg-white p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo-pens.png" alt="Logo PENS" className="h-16 w-auto mx-auto object-contain" />
                      </td>
                      <td className="font-bold text-center text-xs tracking-wider uppercase text-black bg-slate-50">
                        REFERENSI KELENGKAPAN KURIKULUM
                      </td>
                      <td className="w-28 font-semibold text-slate-700 text-[10px]">No. Identifikasi</td>
                      <td className="w-44 font-mono text-[10px] text-slate-800">RF.AAA.BBB.CCC.RPS.2026</td>
                    </tr>
                    <tr>
                      <td rowSpan={2} className="text-center p-2">
                        <strong className="block text-xs uppercase text-slate-900">
                          RENCANA PEMBELAJARAN SEMESTER (RPS)
                        </strong>
                        <span className="block text-[11px] text-slate-700">
                          PROGRAM STUDI SARJANA TERAPAN TEKNIK INFORMATIKA
                        </span>
                        <span className="block text-[10px] text-slate-600">
                          JURUSAN TEKNIK INFORMATIKA DAN KOMPUTER
                        </span>
                      </td>
                      <td className="font-semibold text-slate-700 text-[10px]">No. Revisi</td>
                      <td className="font-mono text-[10px] text-slate-800">01</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-700 text-[10px]">Tanggal Terbit</td>
                      <td className="font-mono text-[10px] text-slate-800">17 Juni 2025</td>
                    </tr>
                    <tr>
                      <td className="text-center font-bold text-[11px] tracking-wide uppercase text-slate-900 bg-slate-50">
                        POLITEKNIK ELEKTRONIKA NEGERI SURABAYA
                      </td>
                      <td className="font-semibold text-slate-700 text-[10px]">Halaman</td>
                      <td className="font-mono text-[10px] text-slate-800">1 dari 2</td>
                    </tr>
                  </tbody>
                </table>

                {/* TABEL 0 RPS */}
                <table className="doc-template-table">
                  <tbody>
                    {/* Header Identitas */}
                    <tr>
                      <th colSpan={2} className="doc-th w-1/4">MATA KULIAH (MK)</th>
                      <th className="doc-th w-28">KODE MK</th>
                      <th colSpan={2} className="doc-th">Rumpun MK</th>
                      <th colSpan={2} className="doc-th w-28">BOBOT (sks)</th>
                      <th className="doc-th w-20">SEMESTER</th>
                      <th className="doc-th w-28">Tgl Penyusunan</th>
                    </tr>
                    <tr>
                      <td colSpan={2} className="font-bold text-center text-slate-900">
                        {mk.nama}
                      </td>
                      <td className="text-center font-mono font-bold text-slate-800">{mk.kode}</td>
                      <td colSpan={2}>
                        <input
                          type="text"
                          className="doc-cell-input text-center"
                          value={konfigurasi.umum.rumpun}
                          placeholder="e.g. Keilmuan Inti"
                          onChange={(e) => onUmumChange("rumpun", e.target.value)}
                        />
                      </td>
                      <td className="text-center font-mono">
                        T=
                        <input
                          type="number"
                          className="doc-cell-input inline-block w-8 text-center"
                          value={konfigurasi.umum.sksTeori}
                          onChange={(e) => onUmumChange("sksTeori", e.target.value)}
                        />
                      </td>
                      <td className="text-center font-mono">
                        P=
                        <input
                          type="number"
                          className="doc-cell-input inline-block w-8 text-center"
                          value={konfigurasi.umum.sksPraktik}
                          onChange={(e) => onUmumChange("sksPraktik", e.target.value)}
                        />
                      </td>
                      <td className="text-center font-bold">{mk.semester ?? "—"}</td>
                      <td>
                        <input
                          type="text"
                          className="doc-cell-input text-center font-mono text-[10px]"
                          value={konfigurasi.umum.tanggal}
                          placeholder="30-10-2026"
                          onChange={(e) => onUmumChange("tanggal", e.target.value)}
                        />
                      </td>
                    </tr>

                    {/* Header Otorisasi */}
                    <tr>
                      <th colSpan={2} rowSpan={2} className="doc-th align-middle">
                        OTORISASI /<br />PENGESAHAN
                      </th>
                      <th colSpan={2} className="doc-th">Dosen Pengembang RPS</th>
                      <th colSpan={3} className="doc-th">Koordinator RMK</th>
                      <th colSpan={2} className="doc-th">Ka. PRODI</th>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <textarea
                          rows={2}
                          className="doc-cell-textarea text-center text-[10px]"
                          value={konfigurasi.umum.pengembang}
                          placeholder="Nama & NIP Pengembang RPS"
                          onChange={(e) => onUmumChange("pengembang", e.target.value)}
                        />
                      </td>
                      <td colSpan={3}>
                        <textarea
                          rows={2}
                          className="doc-cell-textarea text-center text-[10px]"
                          value={konfigurasi.umum.koordinator}
                          placeholder="Nama & NIP Koordinator RMK"
                          onChange={(e) => onUmumChange("koordinator", e.target.value)}
                        />
                      </td>
                      <td colSpan={2}>
                        <textarea
                          rows={2}
                          className="doc-cell-textarea text-center text-[10px]"
                          value={konfigurasi.umum.kaprodi}
                          placeholder="Nama & NIP Ka. Prodi"
                          onChange={(e) => onUmumChange("kaprodi", e.target.value)}
                        />
                      </td>
                    </tr>

                    {/* Capaian Pembelajaran */}
                    <tr>
                      <th className="doc-th w-28 align-top text-left font-bold text-slate-800">
                        <input
                          type="text"
                          className="doc-cell-input font-bold text-slate-800 text-left p-0"
                          value={konfigurasi.judulKustom?.["capaian"] ?? "Capaian Pembelajaran (CP)"}
                          onChange={(e) => onJudulKustomChange?.("capaian", e.target.value)}
                        />
                      </th>
                      <td colSpan={8} className="p-3 bg-white">
                        {/* Nested 1: CPL & IK (READ-ONLY TERIKAT PETA KURIKULUM) */}
                        <div className="flex items-center justify-between doc-section-title">
                          <span>CPL dan IK PRODI yang dibebankan pada MK</span>
                          <span
                            className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 select-none cursor-not-allowed inline-flex items-center gap-1"
                            title="CPL dan IK Prodi ditetapkan pada tingkat kurikulum program studi dan tidak dapat diubah dari RPS individual mata kuliah."
                          >
                            🔒 Terikat Peta Kurikulum (Read-Only)
                          </span>
                        </div>
                        <table className="doc-nested-table">
                          <thead>
                            <tr>
                              <th className="doc-nested-th w-20">Kode</th>
                              <th className="doc-nested-th">Rumusan CPL & Indikator Kinerja (IK)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cplDibebankan.map((cpl) => (
                              <tr key={cpl.kode}>
                                <td className="font-bold text-center text-slate-700 bg-slate-100/70 select-none cursor-not-allowed font-mono text-[11px]" title="CPL terikat dari Peta Kurikulum Prodi (Read-Only)">
                                  {cpl.kode}
                                </td>
                                <td className="bg-slate-50/40">
                                  <div className="font-semibold text-slate-900 mb-1">{cpl.deskripsi}</div>
                                  <div className="pl-3 border-l-2 border-slate-300 space-y-1">
                                    {ikDibebankan
                                      .filter((ik) => ik.cpl === cpl.kode)
                                      .map((ik) => (
                                        <div key={ik.kode} className="text-[11px] text-slate-700">
                                          <strong className="text-slate-900 font-mono select-none cursor-not-allowed">{ik.kode}:</strong> {ik.deskripsi}
                                        </div>
                                      ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {!cplDibebankan.length ? (
                              <tr>
                                <td colSpan={2} className="text-center italic text-slate-400">
                                  Belum ada CPL yang dibebankan pada mata kuliah ini di Peta Kurikulum.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>

                        {/* Nested 2: CPMK (KODE READ-ONLY, RUMUSAN EDITABLE) */}
                        <div className="flex items-center justify-between doc-section-title">
                          <span>Capaian Pembelajaran Mata Kuliah (CPMK)</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Rumusan kompetensi dapat diedit langsung di bawah
                          </span>
                        </div>
                        <table className="doc-nested-table">
                          <thead>
                            <tr>
                              <th className="doc-nested-th w-24">Kode</th>
                              <th className="doc-nested-th">Rumusan Capaian Pembelajaran Mata Kuliah</th>
                            </tr>
                          </thead>
                          <tbody>
                            {struktur.cpmk.map((cpmk) => (
                              <tr key={cpmk.kode}>
                                <td className="text-center bg-slate-100/70 select-none cursor-not-allowed align-middle" title="Kode CPMK dikunci oleh sistem agar relasi matriks tidak rusak">
                                  <span className="font-mono font-bold text-slate-600 text-[11px] inline-flex items-center gap-1">
                                    🔒 {cpmk.kode}
                                  </span>
                                </td>
                                <td>
                                  <textarea
                                    rows={2}
                                    className="doc-cell-textarea text-xs text-slate-900"
                                    value={cpmk.deskripsi}
                                    placeholder="Rumusan capaian pembelajaran mata kuliah..."
                                    onChange={(e) => onCPMKDeskripsiChange?.(cpmk.kode, e.target.value)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Nested 3: Matriks IK-CPL dan CPMK (INTERAKTIF KLIK UNTUK TOGGLE) */}
                        <div className="flex items-center justify-between doc-section-title">
                          <span>Matriks IK-CPL dan CPMK</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Klik sel untuk mengaktifkan/menonaktifkan pemetaan (✓)
                          </span>
                        </div>
                        <table className="doc-nested-table text-center">
                          <thead>
                            <tr>
                              <th className="doc-nested-th text-left w-24">IK-CPL</th>
                              {struktur.cpmk.map((cpmk) => (
                                <th key={cpmk.kode} className="doc-nested-th font-mono text-[10px]">{cpmk.kode}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ikDibebankan.map((ik) => (
                              <tr key={ik.kode}>
                                <td className="text-left font-mono font-bold bg-slate-50 select-none text-[11px]">{ik.kode}</td>
                                {struktur.cpmk.map((cpmk) => {
                                  const checked = (struktur.bobotU[cpmk.kode]?.[ik.kode] ?? 0) > 0;
                                  return (
                                    <td
                                      key={cpmk.kode}
                                      onClick={() => onToggleMatriksIKCPMK?.(cpmk.kode, ik.kode)}
                                      className={`cursor-pointer transition-colors hover:bg-blue-50 text-center select-none ${
                                        checked ? "doc-check font-bold" : "text-slate-300 hover:text-slate-500"
                                      }`}
                                      title={`Klik untuk mengubah pemetaan ${ik.kode} pada ${cpmk.kode}`}
                                    >
                                      {checked ? "✓" : "—"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Nested 4: Sub-CPMK (KODE READ-ONLY, LEVEL & RUMUSAN EDITABLE) */}
                        <div className="flex items-center justify-between doc-section-title">
                          <span>Sub-Capaian Pembelajaran Mata Kuliah (Sub-CPMK)</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Level taksonomi & rumusan dapat diedit langsung
                          </span>
                        </div>
                        <table className="doc-nested-table">
                          <thead>
                            <tr>
                              <th className="doc-nested-th w-28">Kode & Level</th>
                              <th className="doc-nested-th">Kemampuan Akhir yang Diharapkan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {struktur.sub.map((sub) => (
                              <tr key={sub.kode}>
                                <td className="bg-slate-100/70 p-1.5 align-middle">
                                  <div className="flex flex-col items-center gap-1">
                                    <span
                                      className="font-mono font-bold text-slate-600 text-[10px] select-none cursor-not-allowed inline-flex items-center gap-1"
                                      title="Kode Sub-CPMK dikunci oleh sistem"
                                    >
                                      🔒 {sub.kode}
                                    </span>
                                    <select
                                      className="doc-cell-input text-center font-mono text-[9px] bg-white border border-slate-300 rounded px-1 py-0.5 cursor-pointer max-w-[4.2rem]"
                                      value={sub.level || "C3"}
                                      onChange={(e) => onSubCPMKChange?.(sub.kode, "level", e.target.value)}
                                      title="Pilih level taksonomi Bloom"
                                    >
                                      {["C1", "C2", "C3", "C4", "C5", "C6", "A1", "A2", "A3", "A4", "A5", "P1", "P2", "P3", "P4", "P5"].map((lvl) => (
                                        <option key={lvl} value={lvl}>{lvl}</option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td>
                                  <textarea
                                    rows={2}
                                    className="doc-cell-textarea text-xs text-slate-900"
                                    value={sub.deskripsi}
                                    placeholder="Kemampuan akhir yang diharapkan..."
                                    onChange={(e) => onSubCPMKChange?.(sub.kode, "deskripsi", e.target.value)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Nested 5: Matriks Pembobotan CPMK dan Sub-CPMK (INTERAKTIF KLIK UNTUK TOGGLE) */}
                        <div className="flex items-center justify-between doc-section-title">
                          <span>Matriks Pembobotan CPMK dan Sub-CPMK</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Klik sel untuk menghubungkan Sub-CPMK ke CPMK induk
                          </span>
                        </div>
                        <table className="doc-nested-table text-center">
                          <thead>
                            <tr>
                              <th className="doc-nested-th text-left w-20">CPMK</th>
                              {struktur.sub.map((sub) => (
                                <th key={sub.kode} className="doc-nested-th font-mono text-[9px]">{sub.kode}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {struktur.cpmk.map((cpmk) => (
                              <tr key={cpmk.kode}>
                                <td className="text-left font-bold bg-slate-50 select-none text-[11px]">{cpmk.kode}</td>
                                {struktur.sub.map((sub) => {
                                  const match = sub.cpmk === cpmk.kode;
                                  return (
                                    <td
                                      key={sub.kode}
                                      onClick={() => onToggleMatriksCPMKSub?.(sub.kode, cpmk.kode)}
                                      className={`cursor-pointer transition-colors hover:bg-blue-50 text-center select-none ${
                                        match ? "doc-check font-bold" : "text-slate-300 hover:text-slate-500"
                                      }`}
                                      title={`Klik untuk mengubah induk CPMK ${sub.kode}`}
                                    >
                                      {match ? "✓" : "—"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Nested 6: Bobot Penilaian Mingguan Sub-CPMK */}
                        <div className="doc-section-title">
                          Bobot Penilaian Mingguan Sub-CPMK
                        </div>
                        <table className="doc-nested-table text-center w-full max-w-lg">
                          <thead>
                            <tr>
                              <th className="doc-nested-th w-36">Sub-CPMK</th>
                              <th className="doc-nested-th w-36">Bobot Penilaian (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {struktur.sub.map((sub) => (
                              <tr key={sub.kode}>
                                <td className="font-mono font-semibold bg-slate-50 select-none">{sub.kode}</td>
                                <td className="font-bold text-slate-800">{bobotPerSub[sub.kode] ?? 0}%</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-100 font-bold">
                              <td>Total Bobot (Σ)</td>
                              <td>{totalBobot}%</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Deskripsi Singkat */}
                    <tr>
                      <th className="doc-th align-top text-left font-bold text-slate-800">
                        <input
                          type="text"
                          className="doc-cell-input font-bold text-slate-800 text-left p-0"
                          value={konfigurasi.judulKustom?.["deskripsi"] ?? "Deskripsi Singkat MK"}
                          onChange={(e) => onJudulKustomChange?.("deskripsi", e.target.value)}
                        />
                      </th>
                      <td colSpan={8}>
                        <textarea
                          rows={4}
                          className="doc-cell-textarea"
                          value={konfigurasi.umum.deskripsi}
                          placeholder="Tuliskan deskripsi singkat mata kuliah..."
                          onChange={(e) => onUmumChange("deskripsi", e.target.value)}
                        />
                      </td>
                    </tr>

                    {/* Bahan Kajian */}
                    <tr>
                      <th className="doc-th align-top text-left font-bold text-slate-800">
                        <input
                          type="text"
                          className="doc-cell-input font-bold text-slate-800 text-left p-0"
                          value={konfigurasi.judulKustom?.["bahanKajian"] ?? "Bahan Kajian atau Materi Pembelajaran"}
                          onChange={(e) => onJudulKustomChange?.("bahanKajian", e.target.value)}
                        />
                      </th>
                      <td colSpan={8}>
                        <div className="text-xs text-slate-700 mb-1">
                          {struktur.sub.map((sub, idx) => (
                            <div key={sub.kode} className="mb-0.5">
                              <span className="font-bold text-slate-800">{idx + 1}.</span> {konfigurasi.rencanaSub[sub.kode]?.materi || sub.deskripsi}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* Referensi */}
                    <tr>
                      <th rowSpan={4} className="doc-th align-top text-left font-bold text-slate-800">
                        <input
                          type="text"
                          className="doc-cell-input font-bold text-slate-800 text-left p-0"
                          value={konfigurasi.judulKustom?.["referensi"] ?? "Daftar Referensi"}
                          onChange={(e) => onJudulKustomChange?.("referensi", e.target.value)}
                        />
                      </th>
                      <td colSpan={8} className="font-bold bg-slate-50 text-[11px] text-slate-800">
                        Utama (buku teks populer, jurnal populer, website, dll)
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={8}>
                        <textarea
                          rows={3}
                          className="doc-cell-textarea font-mono text-[10px]"
                          value={konfigurasi.umum.referensiUtama}
                          placeholder="[1] Penulis (Tahun). Judul Referensi Utama..."
                          onChange={(e) => onUmumChange("referensiUtama", e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={8} className="font-bold bg-slate-50 text-[11px] text-slate-800">
                        Pendukung (jurnal/penelitian dosen, publikasi terkini, dll)
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={8}>
                        <textarea
                          rows={3}
                          className="doc-cell-textarea font-mono text-[10px]"
                          value={konfigurasi.umum.referensiPendukung}
                          placeholder="[1] Penulis (Tahun). Judul Referensi Pendukung..."
                          onChange={(e) => onUmumChange("referensiPendukung", e.target.value)}
                        />
                      </td>
                    </tr>

                    {/* Dosen Pengampu */}
                    <tr>
                      <th className="doc-th align-top text-left font-bold text-slate-800">
                        <input
                          type="text"
                          className="doc-cell-input font-bold text-slate-800 text-left p-0"
                          value={konfigurasi.judulKustom?.["dosen"] ?? "Dosen Pengampu"}
                          onChange={(e) => onJudulKustomChange?.("dosen", e.target.value)}
                        />
                      </th>
                      <td colSpan={8} className="font-semibold text-slate-800">
                        {mk.dosen || konfigurasi.umum.pengembang || "—"}
                      </td>
                    </tr>

                    {/* Prasyarat */}
                    <tr>
                      <th className="doc-th align-top text-left font-bold text-slate-800">
                        <input
                          type="text"
                          className="doc-cell-input font-bold text-slate-800 text-left p-0"
                          value={konfigurasi.judulKustom?.["prasyarat"] ?? "Mata Kuliah Prasyarat"}
                          onChange={(e) => onJudulKustomChange?.("prasyarat", e.target.value)}
                        />
                      </th>
                      <td colSpan={8}>
                        <input
                          type="text"
                          className="doc-cell-input"
                          value={konfigurasi.umum.prasyarat}
                          placeholder="Isikan mata kuliah prasyarat atau tanda '-'"
                          onChange={(e) => onUmumChange("prasyarat", e.target.value)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* RPS LEMBAR 2: TABEL MINGGUAN (TABEL 1) */}
            {(tabAktif === "all" || tabAktif === "mingguan") && (
              <div className="doc-paper-sheet w-full max-w-5xl rounded-2xl bg-white p-6 sm:p-10 border border-gray-200 shadow-sm mb-8">
                <div className="mb-4 text-center">
                  <h3 className="font-bold text-sm tracking-wide text-slate-900 uppercase">
                    Rencana Kegiatan Pembelajaran Mingguan
                  </h3>
                  <p className="text-xs text-slate-600">
                    Format Matriks 8 Kolom Standar RPS
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="doc-template-table">
                    <thead>
                      <tr>
                        <th rowSpan={2} className="doc-th w-14">Perte-muan Ke-</th>
                        <th rowSpan={2} className="doc-th w-44">
                          Kemampuan Akhir Tiap Tahapan Belajar<br />(Sub-CPMK)
                        </th>
                        <th colSpan={2} className="doc-th">Penilaian</th>
                        <th colSpan={2} className="doc-th">
                          Bentuk Pembelajaran; Metode Pembelajaran;<br />Penugasan Mahasiswa [Estimasi Waktu]
                        </th>
                        <th rowSpan={2} className="doc-th">
                          Materi pembelajaran<br />[Pustaka]
                        </th>
                        <th rowSpan={2} className="doc-th w-16">
                          Bobot Penilaian (%)
                        </th>
                      </tr>
                      <tr>
                        <th className="doc-th-sub w-36">Indikator</th>
                        <th className="doc-th-sub w-36">Kriteria dan Teknik</th>
                        <th className="doc-th-sub w-36">Tatap Muka</th>
                        <th className="doc-th-sub w-36">Daring</th>
                      </tr>
                      <tr>
                        <th className="doc-th-num">(1)</th>
                        <th className="doc-th-num">(2)</th>
                        <th className="doc-th-num">(3)</th>
                        <th className="doc-th-num">(4)</th>
                        <th className="doc-th-num">(5)</th>
                        <th className="doc-th-num">(6)</th>
                        <th className="doc-th-num">(7)</th>
                        <th className="doc-th-num">(8)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {struktur.sub.map((sub, idx) => {
                        const rencana = konfigurasi.rencanaSub[sub.kode] || {
                          pertemuan: String(idx + 1),
                          indikator: "",
                          kriteria: "",
                          tatapMuka: "",
                          daring: "",
                          materi: "",
                        };

                        return (
                          <tr key={sub.kode}>
                            <td className="text-center font-bold bg-slate-50">
                              <input
                                type="text"
                                className="doc-cell-input text-center font-bold"
                                value={rencana.pertemuan}
                                placeholder={String(idx + 1)}
                                onChange={(e) => onRencanaChange(sub.kode, "pertemuan", e.target.value)}
                              />
                            </td>
                            <td className="text-[11px]">
                              <div className="flex items-center gap-1 mb-1">
                                <span
                                  className="font-mono font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded text-[10px] select-none cursor-not-allowed inline-flex items-center gap-0.5"
                                  title="Kode Sub-CPMK dikunci oleh sistem"
                                >
                                  🔒 {sub.kode}
                                </span>
                                {sub.level ? (
                                  <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded border border-blue-200">
                                    [{sub.level}]
                                  </span>
                                ) : null}
                              </div>
                              <textarea
                                rows={3}
                                className="doc-cell-textarea text-[10px] text-slate-800"
                                value={sub.deskripsi}
                                placeholder="Kemampuan akhir yang diharapkan..."
                                onChange={(e) => onSubCPMKChange?.(sub.kode, "deskripsi", e.target.value)}
                              />
                            </td>
                            <td>
                              <textarea
                                rows={3}
                                className="doc-cell-textarea text-[10px]"
                                value={rencana.indikator}
                                placeholder="Ketepatan..."
                                onChange={(e) => onRencanaChange(sub.kode, "indikator", e.target.value)}
                              />
                            </td>
                            <td>
                              <textarea
                                rows={3}
                                className="doc-cell-textarea text-[10px]"
                                value={rencana.kriteria}
                                placeholder="Kriteria..."
                                onChange={(e) => onRencanaChange(sub.kode, "kriteria", e.target.value)}
                              />
                            </td>
                            <td>
                              <textarea
                                rows={3}
                                className="doc-cell-textarea text-[10px]"
                                value={rencana.tatapMuka}
                                placeholder="Kuliah tatap muka..."
                                onChange={(e) => onRencanaChange(sub.kode, "tatapMuka", e.target.value)}
                              />
                            </td>
                            <td>
                              <textarea
                                rows={3}
                                className="doc-cell-textarea text-[10px]"
                                value={rencana.daring}
                                placeholder="Kelas daring..."
                                onChange={(e) => onRencanaChange(sub.kode, "daring", e.target.value)}
                              />
                            </td>
                            <td>
                              <textarea
                                rows={3}
                                className="doc-cell-textarea text-[10px]"
                                value={rencana.materi}
                                placeholder="Materi kajian..."
                                onChange={(e) => onRencanaChange(sub.kode, "materi", e.target.value)}
                              />
                            </td>
                            <td className="text-center font-bold text-slate-900 bg-slate-50">
                              {bobotPerSub[sub.kode] ?? 0}%
                            </td>
                          </tr>
                        );
                      })}

                      {/* Baris Mid Test */}
                      <tr className="doc-exam-banner">
                        <td className="text-center font-bold">8</td>
                        <td colSpan={7} className="text-center p-2.5">
                          <strong className="text-slate-900 block mb-1">
                            Mid Test: Evaluasi Tengah Semester (ETS)
                          </strong>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs text-center font-normal text-slate-700 bg-white/70"
                            value={
                              konfigurasi.rpsUjian?.mid ??
                              "Tes tulis (teori) dan tes praktik (live coding), mengukur ketercapaian Sub-CPMK tahap awal."
                            }
                            placeholder="Deskripsi bentuk asesmen Mid Test..."
                            onChange={(e) => onRpsUjianChange?.("mid", e.target.value)}
                          />
                        </td>
                      </tr>

                      {/* Baris Post Test */}
                      <tr className="doc-exam-banner">
                        <td className="text-center font-bold">16</td>
                        <td colSpan={7} className="text-center p-2.5">
                          <strong className="text-slate-900 block mb-1">
                            Post Test: Evaluasi Akhir Semester (EAS)
                          </strong>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs text-center font-normal text-slate-700 bg-white/70"
                            value={
                              konfigurasi.rpsUjian?.post ??
                              "Tes tulis (teori) dan tes praktik (live coding) / presentasi proyek, mengukur seluruh ketercapaian capaian pembelajaran."
                            }
                            placeholder="Deskripsi bentuk asesmen Post Test..."
                            onChange={(e) => onRpsUjianChange?.("post", e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* RUBRIK: LEMBAR 1 PEMETAAN & DISTRIBUSI */}
            {(tabAktif === "all" || tabAktif === "pemetaan") && (
              <div className="doc-paper-sheet w-full max-w-5xl rounded-2xl bg-white p-6 sm:p-10 border border-gray-200 shadow-sm mb-8">
                <div className="mb-4 text-center">
                  <h2 className="font-bold text-base tracking-wide text-slate-900 uppercase">
                    Rencana Penilaian & Evaluasi
                  </h2>
                  <p className="text-xs font-semibold text-slate-700">
                    {mk.nama} ({mk.kode}) · {mk.sks} SKS · Semester {mk.semester ?? "—"}
                  </p>
                </div>

                {/* TABEL 0: PEMETAAN */}
                <div className="doc-section-title">
                  Pemetaan Sub-CPMK, Materi, Bobot RPS
                </div>
                <table className="doc-template-table mb-8">
                  <thead>
                    <tr>
                      <th className="doc-th w-28">Sub-CPMK</th>
                      <th className="doc-th">Kemampuan Akhir</th>
                      <th className="doc-th">Materi Terkait</th>
                      <th className="doc-th w-24">Bobot RPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {struktur.sub.map((sub) => (
                      <tr key={sub.kode}>
                        <td className="font-bold text-center font-mono bg-slate-50">{sub.kode}</td>
                        <td>{sub.deskripsi}</td>
                        <td>{konfigurasi.rencanaSub[sub.kode]?.materi || sub.deskripsi}</td>
                        <td className="text-center font-bold text-slate-900">
                          {bobotPerSub[sub.kode] ?? 0}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={3} className="text-right pr-4">Total Bobot RPS</td>
                      <td className="text-center">{totalBobot}%</td>
                    </tr>
                  </tbody>
                </table>

                {/* TABEL 1: DISTRIBUSI BOBOT */}
                <div className="doc-section-title">
                  Distribusi Bobot Sub-CPMK pada Komponen Penilaian
                </div>
                <p className="text-xs text-slate-600 mb-2">
                  Atur persentase bobot setiap Sub-CPMK pada masing-masing komponen asesmen. Total keseluruhan harus tepat 100%.
                </p>
                <div className="overflow-x-auto">
                  <table className="doc-template-table">
                    <thead>
                      <tr>
                        <th className="doc-th w-28">Sub-CPMK</th>
                        {KATEGORI_RUBRIK.map((cat) => (
                          <th key={cat} className="doc-th">
                            {LABEL_KATEGORI_RUBRIK[cat]}
                          </th>
                        ))}
                        <th className="doc-th w-28">Total (Bobot RPS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {struktur.sub.map((sub) => {
                        const totalSub = bobotPerSub[sub.kode] ?? 0;
                        return (
                          <tr key={sub.kode}>
                            <td className="font-bold font-mono text-center bg-slate-50">{sub.kode}</td>
                            {KATEGORI_RUBRIK.map((cat) => (
                              <td key={cat} className="text-center p-1">
                                <div className="inline-flex items-center justify-center gap-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    className="doc-cell-input text-center font-semibold w-12"
                                    value={konfigurasi.bobotRubrik[sub.kode]?.[cat] ?? 0}
                                    onChange={(e) => onBobotChange(sub.kode, cat, e.target.value)}
                                  />
                                  <span className="text-[10px] text-slate-500">%</span>
                                </div>
                              </td>
                            ))}
                            <td className="text-center font-bold text-slate-900 bg-slate-50">
                              {totalSub}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 font-bold">
                        <td className="text-center">Total</td>
                        {KATEGORI_RUBRIK.map((cat) => (
                          <td key={cat} className="text-center">
                            {bobotPerKategori[cat]}%
                          </td>
                        ))}
                        <td className="text-center text-primary">{totalBobot}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RUBRIK: PER KOMPONEN PENILAIAN */}
            {KATEGORI_RUBRIK.map((kategori) => {
              if (tabAktif !== "all" && tabAktif !== kategori) return null;

              const tugas = konfigurasi.tugasRubrik[kategori];
              const subsInCat = struktur.sub.filter(
                (sub) => (konfigurasi.bobotRubrik[sub.kode]?.[kategori] ?? 0) > 0,
              );
              const bobotKategoriIni = bobotPerKategori[kategori];
              const holistikDesc =
                konfigurasi.rubrikUmum?.[kategori] ?? DEFAULT_HOLISTIK_DESK[kategori];

              return (
                <div key={kategori} className="doc-paper-sheet w-full max-w-5xl rounded-2xl bg-white p-6 sm:p-10 border border-gray-200 shadow-sm mb-8">
                  {/* 1. FORMAT TABEL RTM RESMI PENS */}
                  <div className="doc-section-title uppercase mb-2">
                    Rencana Asesmen: {LABEL_KATEGORI_RUBRIK[kategori]}
                  </div>

                  <table className="doc-template-table mb-8">
                    <tbody>
                      <tr>
                        <td rowSpan={2} className="w-24 text-center p-2 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/logo-pens.png" alt="Logo PENS" className="h-14 w-auto mx-auto object-contain" />
                        </td>
                        <td colSpan={7} className="doc-rtm-kop">
                          <strong>PROGRAM STUDI SARJANA TERAPAN TEKNIK INFORMATIKA</strong>
                          <span>DEPARTEMEN TEKNIK INFORMATIKA DAN KOMPUTER</span>
                          <span>POLITEKNIK ELEKTRONIKA NEGERI SURABAYA</span>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={7} className="text-center font-bold text-xs uppercase bg-slate-50 py-1.5">
                          RENCANA TUGAS MAHASISWA
                        </td>
                      </tr>
                      <tr>
                        <th className="doc-th w-32 text-left">MATA KULIAH</th>
                        <td colSpan={7} className="font-bold text-slate-900">{mk.nama}</td>
                      </tr>
                      <tr>
                        <th className="doc-th text-left">KODE</th>
                        <td className="font-mono font-bold">{mk.kode}</td>
                        <th className="doc-th w-20">SKS</th>
                        <td className="font-mono">
                          T = {konfigurasi.umum.sksTeori || 1}, P = {konfigurasi.umum.sksPraktik || 1}
                        </td>
                        <th className="doc-th w-24">SEMESTER</th>
                        <td colSpan={3} className="font-bold">{mk.semester ?? "—"}</td>
                      </tr>
                      <tr>
                        <th className="doc-th text-left">DOSEN PENGAMPU</th>
                        <td colSpan={7} className="font-medium text-slate-800">
                          {mk.dosen || konfigurasi.umum.pengembang || "—"}
                        </td>
                      </tr>
                      <tr>
                        <th className="doc-th text-left">Bentuk / Tugas ke</th>
                        <td colSpan={7}>
                          <input
                            type="text"
                            className="doc-cell-input font-bold"
                            value={tugas.judul}
                            onChange={(e) => onTugasChange(kategori, "judul", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">
                          SUB CAPAIAN PEMBELAJARAN MATA KULIAH
                        </th>
                      </tr>
                      <tr>
                        <td colSpan={8} className="p-2">
                          {subsInCat.length > 0 ? (
                            <div className="space-y-1">
                              {subsInCat.map((sub) => (
                                <div key={sub.kode} className="text-xs">
                                  <strong className="font-mono text-slate-900">{sub.kode}:</strong> {sub.deskripsi}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="italic text-slate-400">
                              Belum ada Sub-CPMK yang dibebankan pada komponen ini.
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={4} className="doc-th text-left">BENTUK TUGAS</th>
                        <th colSpan={4} className="doc-th text-left">WAKTU PENGERJAAN TUGAS</th>
                      </tr>
                      <tr>
                        <td colSpan={4}>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs"
                            value={tugas.bentuk}
                            onChange={(e) => onTugasChange(kategori, "bentuk", e.target.value)}
                          />
                        </td>
                        <td colSpan={4}>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs"
                            value={tugas.waktu}
                            onChange={(e) => onTugasChange(kategori, "waktu", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">JUDUL TUGAS</th>
                      </tr>
                      <tr>
                        <td colSpan={8}>
                          <input
                            type="text"
                            className="doc-cell-input font-semibold"
                            value={tugas.judul}
                            onChange={(e) => onTugasChange(kategori, "judul", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">DISKRIPSI TUGAS</th>
                      </tr>
                      <tr>
                        <td colSpan={8}>
                          <textarea
                            rows={3}
                            className="doc-cell-textarea text-xs"
                            value={tugas.deskripsi}
                            onChange={(e) => onTugasChange(kategori, "deskripsi", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">METODE PENGERJAAN TUGAS</th>
                      </tr>
                      <tr>
                        <td colSpan={8}>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs"
                            value={tugas.metode}
                            onChange={(e) => onTugasChange(kategori, "metode", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">BENTUK DAN FORMAT LUARAN</th>
                      </tr>
                      <tr>
                        <td colSpan={8}>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs"
                            value={tugas.luaran}
                            onChange={(e) => onTugasChange(kategori, "luaran", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">
                          INDIKATOR, KRITERIA DAN BOBOT PENILAIAN
                        </th>
                      </tr>
                      <tr>
                        <td colSpan={8}>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs"
                            value={tugas.indikator}
                            onChange={(e) => onTugasChange(kategori, "indikator", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th className="doc-th text-left font-bold">Bobot Penilaian</th>
                        <td colSpan={7} className="font-bold text-slate-900">
                          {bobotKategoriIni} (%)
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">JADWAL PELAKSANAAN</th>
                      </tr>
                      <tr>
                        <td colSpan={8}>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs"
                            value={tugas.jadwal}
                            onChange={(e) => onTugasChange(kategori, "jadwal", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">LAIN-LAIN</th>
                      </tr>
                      <tr>
                        <td colSpan={8}>
                          <textarea
                            rows={2}
                            className="doc-cell-textarea text-xs"
                            value={tugas.lain}
                            onChange={(e) => onTugasChange(kategori, "lain", e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th colSpan={8} className="doc-th text-left">DAFTAR RUJUKAN</th>
                      </tr>
                      <tr>
                        <td colSpan={8} className="font-mono text-[10px]">
                          {konfigurasi.umum.referensiUtama || "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 2. RUBRIK HOLISTIK */}
                  <div className="doc-section-title">
                    Rubrik Penilaian Holistik — {LABEL_KATEGORI_RUBRIK[kategori]}
                  </div>
                  <table className="doc-template-table mb-8">
                    <thead>
                      <tr>
                        <th className="doc-th w-28">Kriteria / Skor</th>
                        <th className="doc-th">Sangat Baik</th>
                        <th className="doc-th">Baik</th>
                        <th className="doc-th">Cukup</th>
                        <th className="doc-th">Kurang</th>
                        <th className="doc-th">Sangat Kurang</th>
                      </tr>
                      <tr className="bg-slate-50 font-mono text-[10px] text-center">
                        <th className="p-1 border border-slate-900">Skala Skor</th>
                        <td className="border border-slate-900 p-1 font-bold">Skor &gt; 81</td>
                        <td className="border border-slate-900 p-1 font-bold">61 &lt; Skor ≤ 80</td>
                        <td className="border border-slate-900 p-1 font-bold">41 &lt; Skor ≤ 60</td>
                        <td className="border border-slate-900 p-1 font-bold">21 &lt; Skor ≤ 40</td>
                        <td className="border border-slate-900 p-1 font-bold">Skor ≤ 20</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th className="doc-th align-middle font-bold text-left">Deskripsi Umum</th>
                        {holistikDesc.map((desc, dIdx) => (
                          <td key={dIdx} className="text-[10px] leading-relaxed p-2 align-top">
                            {desc}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>

                  {/* 3. RUBRIK ANALITIK */}
                  <div className="doc-section-title">
                    Rubrik Penilaian Analitik — {LABEL_KATEGORI_RUBRIK[kategori]}
                  </div>
                  <table className="doc-template-table mb-8">
                    <thead>
                      <tr>
                        <th className="doc-th w-8">No</th>
                        <th className="doc-th w-44">Indikator yang Dinilai</th>
                        <th className="doc-th w-14">Bobot</th>
                        <th className="doc-th">A/AB - Sangat Baik</th>
                        <th className="doc-th">B - Baik</th>
                        <th className="doc-th">BC/C - Cukup</th>
                        <th className="doc-th">D/E - Kurang</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subsInCat.map((sub, sIdx) => {
                        const kriteriaList = criteriaUntuk(kategori, sub.kode);
                        const subBobot = konfigurasi.bobotRubrik[sub.kode]?.[kategori] ?? 0;

                        return kriteriaList.map((crit, cIdx) => (
                          <tr key={`${sub.kode}-${cIdx}`}>
                            <td className="text-center font-bold">{sIdx + 1}</td>
                            <td>
                              <strong className="font-mono text-slate-900 block">{sub.kode}:</strong>
                              <textarea
                                rows={2}
                                className="doc-cell-textarea text-[10px]"
                                value={crit.indikator}
                                onChange={(e) =>
                                  ubahKriteria(kategori, sub.kode, cIdx, { indikator: e.target.value })
                                }
                              />
                            </td>
                            <td className="text-center font-bold text-slate-900">
                              {crit.bobot || subBobot}%
                            </td>
                            {crit.tingkat.slice(0, 4).map((lvl, lIdx) => (
                              <td key={lIdx} className="text-[10px] p-1.5 align-top">
                                <textarea
                                  rows={3}
                                  className="doc-cell-textarea text-[10px]"
                                  value={lvl}
                                  onChange={(e) => {
                                    const newTingkat = [...crit.tingkat];
                                    newTingkat[lIdx] = e.target.value;
                                    ubahKriteria(kategori, sub.kode, cIdx, { tingkat: newTingkat });
                                  }}
                                />
                              </td>
                            ))}
                          </tr>
                        ));
                      })}
                      {!subsInCat.length ? (
                        <tr>
                          <td colSpan={7} className="text-center italic text-slate-400 py-3">
                            Belum ada Sub-CPMK yang dialokasikan pada komponen penilaian ini.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>

                  {/* 4. FORMAT LEMBAR PENILAIAN */}
                  <div className="doc-section-title">
                    Format Lembar Penilaian Mahasiswa
                  </div>
                  <div className="overflow-x-auto">
                    <table className="doc-template-table text-center text-[10px]">
                      <thead>
                        <tr>
                          <th rowSpan={3} className="doc-th w-8">No</th>
                          <th rowSpan={3} className="doc-th text-left w-48">Indikator yang Dinilai</th>
                          <th colSpan={7} className="doc-th">Skor Penilaian</th>
                        </tr>
                        <tr>
                          <th className="doc-th-sub font-bold text-red-600">(E)</th>
                          <th className="doc-th-sub font-bold text-orange-600">(D)</th>
                          <th className="doc-th-sub font-bold text-amber-600">(C)</th>
                          <th className="doc-th-sub font-bold text-yellow-600">(BC)</th>
                          <th className="doc-th-sub font-bold text-blue-600">(B)</th>
                          <th className="doc-th-sub font-bold text-emerald-600">(AB)</th>
                          <th className="doc-th-sub font-bold text-green-700">(A)</th>
                        </tr>
                        <tr className="font-mono text-[9px] text-slate-600">
                          <th className="doc-th-num">0–40</th>
                          <th className="doc-th-num">41–55</th>
                          <th className="doc-th-num">56–60</th>
                          <th className="doc-th-num">61–65</th>
                          <th className="doc-th-num">66–75</th>
                          <th className="doc-th-num">76–86</th>
                          <th className="doc-th-num">86–100</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subsInCat.map((sub, sIdx) => (
                          <tr key={sub.kode}>
                            <td className="font-bold">{sIdx + 1}</td>
                            <td className="text-left font-mono font-medium">{sub.kode} ({konfigurasi.bobotRubrik[sub.kode]?.[kategori]}%)</td>
                            <td className="border border-slate-900 bg-red-50/30"></td>
                            <td className="border border-slate-900 bg-orange-50/30"></td>
                            <td className="border border-slate-900 bg-amber-50/30"></td>
                            <td className="border border-slate-900 bg-yellow-50/30"></td>
                            <td className="border border-slate-900 bg-blue-50/30"></td>
                            <td className="border border-slate-900 bg-emerald-50/30"></td>
                            <td className="border border-slate-900 bg-green-50/30"></td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-slate-50">
                          <td colSpan={2} className="text-left font-semibold">Nilai Rerata Skor</td>
                          <td colSpan={7}></td>
                        </tr>
                        <tr className="font-bold bg-slate-100">
                          <td colSpan={2} className="text-left font-semibold">Nilai Total Mahasiswa</td>
                          <td colSpan={7}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
