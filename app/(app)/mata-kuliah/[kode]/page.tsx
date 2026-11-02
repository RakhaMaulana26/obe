"use client";

import { use } from "react";
import Link from "next/link";
import { useApp, daftarTahunOffering, daftarKelasOffering, kelasAktifUntuk, tahunAktifUntuk } from "@/app/lib/store";
import { DAFTAR_KELAS, mahasiswaUntukKelas } from "@/app/lib/data";
import { Card, EmptyState, PageHeading, inputCls } from "@/app/components/ui";
import FadeContent from "@/app/components/reactbits/FadeContent";
import AnimatedList, { AnimatedItem } from "@/app/components/reactbits/AnimatedList";

export default function DetailMKHubPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params);
  const mkKode = decodeURIComponent(kode).toUpperCase();
  const { mataKuliah, tahunDipilih, setTahunDipilih, kelasDipilih, setKelasDipilih } = useApp();
  const penawaran = mataKuliah.filter((m) => m.kode === mkKode);
  const mk = penawaran[0];
  const daftarTahun = daftarTahunOffering(mataKuliah, mkKode);
  const tahunAktif = tahunAktifUntuk(mataKuliah, tahunDipilih, mkKode);
  const daftarKelas = daftarKelasOffering(mataKuliah, mkKode, tahunAktif);
  const kelasAktif = kelasAktifUntuk(mataKuliah, kelasDipilih, mkKode, tahunAktif);
  const mkAktif = penawaran.find((m) => m.tahun === tahunAktif && m.kelas === kelasAktif) ?? mk;

  if (!mk) {
    return (
      <div className="space-y-6">
        <PageHeading title={mkKode} />
        <EmptyState title="MK tidak ada" desc="Kembali ke daftar mata kuliah." />
        <Link href="/mata-kuliah" className="text-sm font-semibold text-primary hover:underline">← Daftar MK</Link>
      </div>
    );
  }

  const menu = [
    { href: `/mata-kuliah/${mk.kode}/dokumen/rps`, title: "RPS", desc: "Lengkapi identitas dan rencana pembelajaran", cta: "Buat RPS", label: "DOKUMEN" },
    { href: `/mata-kuliah/${mk.kode}/dokumen/rubrik`, title: "Rubrik", desc: "Lengkapi bobot dan rincian penilaian", cta: "Buat rubrik", label: "DOKUMEN" },
    { href: `/mata-kuliah/${mk.kode}/nilai`, title: "Input Nilai", desc: `${mahasiswaUntukKelas(kelasAktif).length} mahasiswa Kelas ${kelasAktif}`, cta: "Input nilai", label: "NILAI" },
    { href: `/mata-kuliah/${mk.kode}/capaian`, title: "Capaian CPMK", desc: "Ketercapaian tiap CPMK dan rekapitulasi per mahasiswa", cta: "Lihat capaian CPMK", label: "CAPAIAN" },
    { href: `/mata-kuliah/${mk.kode}/capaian/sub-cpmk`, title: "Capaian Sub-CPMK", desc: "Ketercapaian tiap Sub-CPMK dan rekapitulasi per mahasiswa", cta: "Lihat capaian Sub-CPMK", label: "CAPAIAN" },
  ];

  return (
    <div className="space-y-6">
      <PageHeading
        title={`${mk.kode} — ${mk.nama}`}
        action={<Link href="/mata-kuliah" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">← Daftar MK</Link>}
      />
      <FadeContent>
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pilih-tahun-hub" className="mb-1.5 block text-sm font-medium text-gray-700">
                Tahun ajaran
              </label>
              <select
                id="pilih-tahun-hub"
                value={tahunAktif}
                onChange={(e) => setTahunDipilih(mkKode, e.target.value)}
                className={inputCls}
              >
                {daftarTahun.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pilih-kelas-hub" className="mb-1.5 block text-sm font-medium text-gray-700">Kelas</label>
              <select id="pilih-kelas-hub" value={kelasAktif} onChange={(e) => setKelasDipilih(mkKode, tahunAktif, e.target.value)} className={inputCls}>
                {DAFTAR_KELAS.filter((kelas) => daftarKelas.includes(kelas)).map((kelas) => <option key={kelas} value={kelas}>Kelas {kelas}</option>)}
              </select>
            </div>
            </div>
            {mkAktif ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.06] px-3 py-2 text-xs font-medium text-primary">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {mkAktif.dosen || "Dosen belum diisi"}
                {mkAktif.semester ? ` • Semester ${mkAktif.semester}` : " • Semester belum ditetapkan"}
                {` • ${mkAktif.sks} SKS`}
                {mkAktif.kelas ? ` • Kelas ${mkAktif.kelas}` : ""}
              </span>
            ) : null}
          </div>
        </Card>
      </FadeContent>
      <AnimatedList className="grid grid-cols-1 gap-4 md:grid-cols-2" step={0.06}>
        {menu.map((m) => (
          <AnimatedItem key={m.href}>
          <Card className="h-full">
            <p className="font-mono text-[11px] font-bold text-gray-400">{m.label}</p>
            <h3 className="mt-1 text-base font-bold text-primary">{m.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{m.desc}</p>
            <Link href={m.href} data-tour={`${m.cta}: ${m.desc}`} data-tour-title={m.title} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              {m.cta} →
            </Link>
          </Card>
          </AnimatedItem>
        ))}
      </AnimatedList>
    </div>
  );
}
