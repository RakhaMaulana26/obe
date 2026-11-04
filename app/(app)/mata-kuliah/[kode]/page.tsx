"use client";

import { use } from "react";
import Link from "next/link";
import { useApp, daftarTahunOffering, daftarKelasOffering, kelasAktifUntuk, tahunAktifUntuk } from "@/app/lib/store";
import { DAFTAR_KELAS } from "@/app/lib/data";
import { EmptyState, JudulBagian, PageHeading, inputCls } from "@/app/components/ui";

export default function DetailMKHubPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params);
  const mkKode = decodeURIComponent(kode).toUpperCase();
  const { mataKuliah, tahunDipilih, setTahunDipilih, kelasDipilih, setKelasDipilih, mahasiswaUntuk } = useApp();
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
        <Link href="/mata-kuliah" className="text-sm font-semibold text-primary hover:underline">Kembali ke daftar mata kuliah</Link>
      </div>
    );
  }

  const kelompok = [
    {
      judul: "Nilai dan capaian",
      item: [
        { href: `/mata-kuliah/${mk.kode}/nilai`, title: "Input nilai", desc: `${mahasiswaUntuk(kelasAktif).length} mahasiswa kelas ${kelasAktif}, satu kolom per indikator rubrik.` },
        { href: `/mata-kuliah/${mk.kode}/capaian`, title: "Capaian CPMK", desc: "Skor tiap CPMK per mahasiswa terhadap batas kelulusan." },
        { href: `/mata-kuliah/${mk.kode}/capaian/sub-cpmk`, title: "Capaian Sub-CPMK", desc: "Skor tiap Sub-CPMK per mahasiswa dan titik terlemah kelas." },
      ],
    },
    {
      judul: "Dokumen",
      item: [
        { href: `/mata-kuliah/${mk.kode}/dokumen/rps`, title: "RPS", desc: "Identitas mata kuliah dan rencana pembelajaran mingguan." },
        { href: `/mata-kuliah/${mk.kode}/dokumen/rubrik`, title: "Rubrik penilaian", desc: "Bobot dan rincian indikator tiap asesmen." },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeading
        title={mk.nama}
        desc={`${mk.kode}, ${mk.sks} SKS. Pilih pekerjaan untuk mata kuliah ini.`}
        action={<Link href="/mata-kuliah" className="inline-flex h-10 items-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper">Daftar mata kuliah</Link>}
      />

      <section aria-label="Penawaran" className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-end">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pilih-tahun-hub" className="mb-1.5 block text-sm font-medium text-ink">Tahun ajaran</label>
            <select id="pilih-tahun-hub" value={tahunAktif} onChange={(e) => setTahunDipilih(mkKode, e.target.value)} className={inputCls}>
              {daftarTahun.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pilih-kelas-hub" className="mb-1.5 block text-sm font-medium text-ink">Kelas</label>
            <select id="pilih-kelas-hub" value={kelasAktif} onChange={(e) => setKelasDipilih(mkKode, tahunAktif, e.target.value)} className={inputCls}>
              {DAFTAR_KELAS.filter((kelas) => daftarKelas.includes(kelas)).map((kelas) => <option key={kelas} value={kelas}>Kelas {kelas}</option>)}
            </select>
          </div>
        </div>
        {mkAktif ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div className="border-l-[3px] border-line pl-3">
              <dt className="text-xs text-ink-muted">Dosen pengampu</dt>
              <dd className="font-medium text-ink">{mkAktif.dosen || "Belum diisi"}</dd>
            </div>
            <div className="border-l-[3px] border-line pl-3">
              <dt className="text-xs text-ink-muted">Semester</dt>
              <dd className="font-medium text-ink">{mkAktif.semester ?? "Belum ditetapkan"}</dd>
            </div>
            <div className="border-l-[3px] border-line pl-3">
              <dt className="text-xs text-ink-muted">Beban</dt>
              <dd className="font-medium tabular-nums text-ink">{mkAktif.sks} SKS</dd>
            </div>
          </dl>
        ) : null}
      </section>

      {kelompok.map((k) => (
        <section key={k.judul} aria-labelledby={`kelompok-${k.judul}`}>
          <JudulBagian id={`kelompok-${k.judul}`} judul={k.judul} />
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
            {k.item.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  data-tour={m.desc}
                  data-tour-title={m.title}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary">{m.title}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{m.desc}</p>
                  </div>
                  <svg aria-hidden className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-primary" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
