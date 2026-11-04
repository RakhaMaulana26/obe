"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useApp, bacaDataTersimpan } from "@/app/lib/store";
import { Card, EmptyState, PageHeading, StatCard } from "@/app/components/ui";
import { KATEGORI_RUBRIK, type DokumenMKConfig } from "@/app/lib/dokumen";
import { KONFIGURASI_DOKUMEN_SEED, kunciConfigDokumen } from "@/app/lib/dokumen-seed";

function formatPersen(nilai: number): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(nilai)}%`;
}

export default function RPSMingguanPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params);
  const mkKode = decodeURIComponent(kode).toUpperCase();
  const { mataKuliah, strukturUntuk } = useApp();
  const mk = mataKuliah.find((item) => item.kode === mkKode);
  const struktur = strukturUntuk(mkKode);
  const [konfigurasi, setKonfigurasi] = useState<DokumenMKConfig | null>(null);

  useEffect(() => {
    setKonfigurasi(
      bacaDataTersimpan<DokumenMKConfig | null>(
        kunciConfigDokumen(mkKode),
        KONFIGURASI_DOKUMEN_SEED[mkKode] ?? null,
      ),
    );
  }, [mkKode]);

  if (!mk) {
    return (
      <div className="space-y-6">
        <PageHeading title="RPS mingguan" />
        <EmptyState title="Mata kuliah tidak ditemukan" desc="Periksa kode mata kuliah atau kembali ke daftar mata kuliah." />
        <Link href="/mata-kuliah" className="text-sm font-semibold text-primary hover:underline">Daftar mata kuliah</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="RPS mingguan"
        desc={`${mk.kode} ${mk.nama}. Rencana tiap pertemuan: Sub-CPMK, indikator, metode, dan bobot penilaian.`}
        action={<Link href={`/mata-kuliah/${mk.kode}`} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper">Halaman mata kuliah</Link>}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Sub-CPMK" value={String(struktur.sub.length)} sub="Dari struktur mata kuliah" />
        <StatCard label="Kegiatan terisi" value={String(struktur.sub.filter((sub) => konfigurasi?.rencanaSub[sub.kode]?.materi?.trim()).length)} sub="Memiliki materi pembelajaran" />
        <StatCard label="Total bobot" value={formatPersen(struktur.sub.reduce((total, sub) => total + KATEGORI_RUBRIK.reduce((bobot, kategori) => bobot + (konfigurasi?.bobotRubrik[sub.kode]?.[kategori] ?? 0), 0), 0))} sub="Distribusi komponen penilaian" />
      </div>
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-primary">Kegiatan pembelajaran per minggu</h2>
            <p className="mt-1 text-sm text-ink">Rencana mingguan {mk.nama} mengikuti data yang sama dengan generator RPS.</p>
          </div>
          <Link href={`/mata-kuliah/${mk.kode}/dokumen`} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Atur kegiatan RPS</Link>
        </div>
        {!konfigurasi || struktur.sub.length === 0 ? (
          <EmptyState title="Belum ada kegiatan mingguan" desc="Lengkapi rencana kegiatan pada bagian RPS. Rencana dan bobot yang disimpan akan tampil di halaman ini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-line bg-paper text-xs font-semibold text-ink-muted">
                  <th className="px-3 py-3">Pertemuan</th>
                  <th className="px-3 py-3">Sub-CPMK</th>
                  <th className="px-3 py-3">Indikator & kriteria penilaian</th>
                  <th className="px-3 py-3">Pembelajaran tatap muka</th>
                  <th className="px-3 py-3">Pembelajaran daring</th>
                  <th className="px-3 py-3">Materi</th>
                  <th className="px-3 py-3 text-right">Bobot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {struktur.sub.map((sub) => {
                  const rencana = konfigurasi.rencanaSub[sub.kode];
                  const bobot = KATEGORI_RUBRIK.reduce((total, kategori) => total + (konfigurasi.bobotRubrik[sub.kode]?.[kategori] ?? 0), 0);
                  return (
                    <tr key={sub.kode}>
                      <td className="whitespace-nowrap px-3 py-4 tabular-nums text-xs font-semibold text-ink">{rencana?.pertemuan || "—"}</td>
                      <td className="max-w-64 px-3 py-4">
                        <span className="tabular-nums text-xs font-bold text-primary">{sub.kode}</span>
                        <p className="mt-1 text-xs leading-relaxed text-ink">{sub.deskripsi}</p>
                      </td>
                      <td className="max-w-72 px-3 py-4 text-xs leading-relaxed text-ink">
                        <p>{rencana?.indikator || "—"}</p>
                        <p className="mt-2 text-ink-muted">{rencana?.kriteria || "—"}</p>
                      </td>
                      <td className="max-w-64 px-3 py-4 text-xs leading-relaxed text-ink">{rencana?.tatapMuka || "—"}</td>
                      <td className="max-w-64 px-3 py-4 text-xs leading-relaxed text-ink">{rencana?.daring || "—"}</td>
                      <td className="max-w-64 px-3 py-4 text-xs leading-relaxed text-ink">{rencana?.materi || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-right tabular-nums text-xs font-bold tabular-nums text-ink">{formatPersen(bobot)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
