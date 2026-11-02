"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp, offeringTerbaru } from "@/app/lib/store";
import { AMBANG_DEFAULT, DAFTAR_CPL, DAFTAR_IK, TABEL_GRADE } from "@/app/lib/data";
import { hitungSemua, konversiHuruf, rataRata, titikTerlemah } from "@/app/lib/hitung";
import { Donut, Histogram } from "@/app/components/charts";
import Tabs, { TabPanel } from "@/app/components/reactbits/Tabs";
import { EmptyState, PageHeading, StatCard, inputCls } from "@/app/components/ui";
import OfferingSelect, { DosenChip } from "@/app/components/OfferingSelect";

const TABS = [
  { id: "ringkasan", label: "Ringkasan", hint: "Angka utama dan profil capaian" },
  { id: "diagnosis", label: "Diagnosis", hint: "CPL yang perlu ditindaklanjuti" },
  { id: "detail", label: "Detail", hint: "Sebaran nilai dan capaian tiap jenjang" },
];

type Tone = "neutral" | "good" | "attention";

function ToneBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const styles: Record<Tone, string> = {
    neutral: "bg-gray-100 text-gray-700",
    good: "bg-green-100 text-green-800",
    attention: "bg-red-100 text-red-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function CplProfile({
  items,
  ambang,
}: {
  items: { kode: string; nama: string; nilai: number }[];
  ambang: number;
}) {
  if (items.length === 0) {
    return <EmptyState title="Profil CPL belum tersedia" desc="Belum ada skor yang dapat diringkas untuk penawaran ini." />;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600" aria-label="Keterangan grafik capaian CPL">
        <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-green-600" />Memenuhi T</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-red-600" />Di bawah T</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden className="h-3.5 w-0.5 bg-primary" />Batas T ({ambang})</span>
      </div>
      <ol className="space-y-4">
        {items.map((item) => {
          const memenuhi = item.nilai >= ambang;
          const width = Math.max(0, Math.min(100, item.nilai));
          return (
            <li key={item.kode} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
              <div className="min-w-0">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="shrink-0 font-mono text-xs font-bold text-primary">{item.kode}</span>
                  <span className="truncate text-sm text-gray-600" title={item.nama}>{item.nama}</span>
                </div>
                <div
                  className="relative mt-2 h-2.5 overflow-visible rounded-full bg-gray-100"
                  role="meter"
                  aria-label={`Rata-rata ${item.kode}, ${item.nama}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Number(item.nilai.toFixed(2))}
                  aria-valuetext={`${item.nilai.toFixed(2)} dari 100; ${memenuhi ? "memenuhi" : "di bawah"} batas ${ambang}`}
                >
                  <span className={`block h-full rounded-full ${memenuhi ? "bg-green-600" : "bg-red-600"}`} style={{ width: `${width}%` }} />
                  <span aria-hidden className="absolute -top-1 h-4 w-0.5 rounded-full bg-primary" style={{ left: `${ambang}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold tabular-nums text-gray-800">{item.nilai.toFixed(2)}</p>
                <p className={`mt-0.5 text-[11px] font-semibold ${memenuhi ? "text-green-700" : "text-red-700"}`}>
                  {memenuhi ? "Memenuhi T" : "Di bawah T"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function JenjangBar({
  data,
  ambang,
  labelFor,
}: {
  data: Record<string, number>;
  ambang: number;
  labelFor: (kode: string) => string;
}) {
  const rows = Object.entries(data).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  if (rows.length === 0) {
    return <p className="rounded-xl bg-gray-50 px-4 py-5 text-sm text-gray-500">Belum ada capaian pada jenjang ini.</p>;
  }

  return (
    <ol className="space-y-3" aria-label="Rata-rata capaian, diurutkan dari nilai terendah">
      {rows.map(([kode, nilai]) => {
        const memenuhi = nilai >= ambang;
        const width = Math.max(0, Math.min(100, nilai));
        const deskripsi = labelFor(kode) || "Rata-rata capaian";
        return (
          <li key={kode} className="rounded-xl border border-gray-100 bg-white px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-primary">{kode}</p>
                <p className="mt-0.5 max-w-full truncate text-xs text-gray-500" title={deskripsi}>{deskripsi}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-bold tabular-nums text-gray-800">{nilai.toFixed(2)}</p>
                <p className={`text-[10px] font-semibold ${memenuhi ? "text-green-700" : "text-red-700"}`}>
                  {memenuhi ? "Memenuhi T" : "Di bawah T"}
                </p>
              </div>
            </div>
            <div className="relative mt-2.5 h-2 overflow-visible rounded-full bg-gray-100" role="meter" aria-label={`${kode}: ${deskripsi}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(nilai.toFixed(2))} aria-valuetext={`${nilai.toFixed(2)} dari 100; batas ${ambang}`}>
              <span className={`block h-full rounded-full ${memenuhi ? "bg-green-600" : "bg-red-600"}`} style={{ width: `${width}%` }} />
              <span aria-hidden className="absolute -top-1 h-4 w-0.5 rounded-full bg-primary" style={{ left: `${ambang}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function DashboardPage() {
  const { nilaiUntuk, strukturUntuk, mataKuliah, setKelasDipilih, setTahunDipilih } = useApp();
  const [ambang, setAmbang] = useState<number>(AMBANG_DEFAULT);
  const [tab, setTab] = useState("ringkasan");
  const [offering, setOffering] = useState(() => offeringTerbaru(mataKuliah));
  const struktur = strukturUntuk(offering.kode);
  const offeringAktif = mataKuliah.find((mk) => mk.kode === offering.kode && mk.tahun === offering.tahun && mk.kelas === offering.kelas)
    ?? mataKuliah.find((mk) => mk.kode === offering.kode);

  const nilaiAktif = useMemo(
    () => (offering.kode ? nilaiUntuk(offering.kode, offering.tahun, offering.kelas) : {}),
    [nilaiUntuk, offering],
  );
  const semua = useMemo(
    () => hitungSemua(nilaiAktif, { w: struktur.bobotW, u: struktur.bobotU }, struktur.sub, struktur.cpmk),
    [nilaiAktif, struktur],
  );

  const stats = useMemo(() => {
    const arr = Object.values(semua);
    const total = arr.length;
    const tuntas = arr.filter((c) => Object.values(c.cpl).every((v) => v >= ambang)).length;
    const semuaCpl = arr.flatMap((c) => Object.values(c.cpl));
    const rataCplKelas = semuaCpl.length ? semuaCpl.reduce((a, b) => a + b, 0) / semuaCpl.length : 0;
    return { total, tuntas, belum: total - tuntas, rataCplKelas, pctTuntas: total ? (tuntas / total) * 100 : 0 };
  }, [semua, ambang]);

  const rataIk = useMemo(() => rataRata(semua, "ik"), [semua]);
  const rataCpl = useMemo(() => rataRata(semua, "cpl"), [semua]);
  const lemahIk = useMemo(() => titikTerlemah(rataIk), [rataIk]);
  const lemahCpl = useMemo(() => titikTerlemah(rataCpl), [rataCpl]);

  const fokusCpl = useMemo(
    () =>
      DAFTAR_CPL.filter((cpl) => cpl.kode in rataCpl).map((cpl) => {
        const gagal = Object.values(semua).filter((c) => (c.cpl[cpl.kode] ?? 0) < ambang).length;
        const indikator = DAFTAR_IK
          .filter((ik) => ik.cpl === cpl.kode)
          .sort((a, b) => (rataIk[a.kode] ?? Infinity) - (rataIk[b.kode] ?? Infinity))[0];
        return { cpl, gagal, indikator, nilai: rataCpl[cpl.kode] ?? 0 };
      }).filter((item) => item.gagal > 0),
    [semua, ambang, rataIk, rataCpl],
  );

  const sebaran = useMemo(() => {
    const rerata = Object.values(semua).map((c) => {
      const arr = Object.values(c.cpl);
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    });
    return TABEL_GRADE.slice()
      .reverse()
      .map((grade) => ({
        label: grade.huruf,
        sub: `${grade.min}–${String(grade.max).replace(".99", "")}`,
        count: rerata.filter((value) => konversiHuruf(value).huruf === grade.huruf).length,
        tone: (grade.max < ambang ? "red" : grade.min >= ambang ? "green" : "amber") as "red" | "amber" | "green",
      }));
  }, [semua, ambang]);

  const profilCpl = useMemo(
    () => DAFTAR_CPL.filter((cpl) => cpl.kode in rataCpl).map((cpl) => ({ kode: cpl.kode, nama: cpl.deskripsiSingkat, nilai: rataCpl[cpl.kode] ?? 0 })),
    [rataCpl],
  );
  const dataKosong = stats.total === 0;
  const labelKosong = offering.kode ? "Belum ada data capaian" : "Pilih mata kuliah untuk memulai";
  const deskripsiKosong = offering.kode
    ? "Belum ada data mahasiswa pada penawaran ini. Pilih penawaran lain atau tambahkan data nilai terlebih dahulu."
    : "Pilih mata kuliah dan tahun ajaran pada kontrol konteks di atas untuk melihat ringkasan capaian.";

  function ubahAmbang(nilai: number) {
    if (!Number.isFinite(nilai)) return;
    setAmbang(Math.max(0, Math.min(100, nilai)));
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Dashboard Capaian OBE"
      />
      <section aria-label="Konteks dan parameter analisis" className="grid grid-cols-1 gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Konteks analisis</h2>
            </div>
            {offeringAktif?.isDummyMapping ? (
              <span title="Pemetaan CPL dan sebagian data awal pada penawaran ini menggunakan data contoh." className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 ring-1 ring-inset ring-amber-200">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-600" />Data demo
              </span>
            ) : null}
          </div>
          <OfferingSelect
            daftar={mataKuliah}
            kode={offering.kode}
            tahun={offering.tahun}
            kelas={offering.kelas}
            onChange={(kode, tahun, kelas) => setOffering({ kode, tahun, kelas })}
            id="konteks-dashboard"
            label="Mata kuliah, tahun ajaran, dan kelas"
            className="w-full"
            tour="Pilih mata kuliah dan tahun ajaran; seluruh angka dashboard mengikuti penawaran ini."
            tourTitle="Konteks data"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DosenChip daftar={mataKuliah} kode={offering.kode} tahun={offering.tahun} kelas={offering.kelas} />
          </div>
        </div>

        <div className="border-t pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <label htmlFor="ambang" className="text-base font-bold text-gray-900">Batas kelulusan (T)</label>
            </div>
            <span className="rounded-xl bg-primary/[0.06] px-3 py-2 text-right text-xs font-semibold text-primary">
              {konversiHuruf(ambang).huruf ? `Setara nilai ${konversiHuruf(ambang).huruf}` : "Konversi nilai belum diatur"}
            </span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <input
              id="ambang-range"
              type="range"
              min={0}
              max={100}
              step={1}
              value={ambang}
              onChange={(event) => ubahAmbang(Number(event.target.value))}
              aria-label="Geser batas kelulusan"
              data-tour="Geser batas kelulusan; seluruh angka dan status capaian ikut berubah."
              data-tour-title="Batas kelulusan (T)"
              className="min-w-0 flex-1 accent-[#103968] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            <div className="w-[92px] shrink-0">
              <label className="sr-only" htmlFor="ambang">Nilai batas kelulusan T</label>
              <input
                id="ambang"
                type="number"
                min={0}
                max={100}
                step={1}
                value={ambang}
                onChange={(event) => ubahAmbang(Number(event.target.value))}
                className={`${inputCls} px-2.5 text-center font-mono font-bold tabular-nums`}
              />
            </div>
          </div>
          <div className="mt-1 flex justify-between font-mono text-[11px] text-gray-400"><span>0</span><span>100</span></div>
          
        </div>
      </section>

      <section aria-label="Bagian dashboard">
        <div className="mb-2 flex justify-end">
          <div
            data-tour="Pindah antara Ringkasan angka utama, Diagnosis titik perhatian, dan Detail sebaran nilai."
            data-tour-title="Tab dashboard"
          >
            <Tabs tabs={TABS} active={tab} onChange={setTab} />
          </div>
        </div>

        {tab === "ringkasan" ? (
          <TabPanel tabKey="ringkasan">
            <div className="space-y-4 pt-2">
              {dataKosong ? (
                <EmptyState title={labelKosong} desc={deskripsiKosong} />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                    <StatCard label="Mahasiswa" value={String(stats.total)} numeric={stats.total} />
                    <StatCard label="Rata-rata CPL kelas" value={stats.rataCplKelas.toFixed(2)} numeric={stats.rataCplKelas} decimals={2} />
                    <StatCard label="Tuntas semua CPL" value={String(stats.tuntas)} numeric={stats.tuntas} sub={stats.pctTuntas.toFixed(1) + "%"} highlight />
                    <StatCard label="Perlu perhatian" value={String(stats.belum)} numeric={stats.belum} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="profil-cpl-heading">
                      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 id="profil-cpl-heading" className="text-base font-bold text-gray-900">Profil rata-rata capaian CPL</h3>
                          
                        </div>
                        <span className="text-xs font-medium text-gray-500">T = {ambang}</span>
                      </div>
                      <CplProfile items={profilCpl} ambang={ambang} />
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="ketuntasan-heading">
                      <div>
                        <h3 id="ketuntasan-heading" className="text-base font-bold text-gray-900">Ketuntasan seluruh CPL</h3>
                        
                      </div>
                      <div className="mt-3 flex flex-col items-center">
                        <Donut pct={stats.pctTuntas} centerTop={`${stats.tuntas} dari ${stats.total} mahasiswa`} centerBottom={`T = ${ambang}`} />
                        
                      </div>
                    </section>
                  </div>
                </>
              )}
            </div>
          </TabPanel>
        ) : null}

        {tab === "diagnosis" ? (
          <TabPanel tabKey="diagnosis">
            <div className="space-y-4 pt-2">
              {dataKosong ? (
                <EmptyState title={labelKosong} desc={deskripsiKosong} />
              ) : (
                <>
                  <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="titik-terendah-heading">
                    <div className="mb-4">
                      <h3 id="titik-terendah-heading" className="text-base font-bold text-gray-900">Titik capaian dengan rata-rata terendah</h3>
                      
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { kode: lemahIk.kode, label: "Indikator Kinerja (IK)", nilai: lemahIk.nilai, arti: DAFTAR_IK.find((ik) => ik.kode === lemahIk.kode)?.deskripsi ?? "Rata-rata kelas pada IK terendah." },
                        { kode: lemahCpl.kode, label: "Capaian Pembelajaran Lulusan (CPL)", nilai: lemahCpl.nilai, arti: DAFTAR_CPL.find((cpl) => cpl.kode === lemahCpl.kode)?.deskripsiSingkat ?? "Rata-rata kelas pada CPL terendah." },
                      ].map((item) => {
                        const memenuhi = item.nilai >= ambang;
                        return (
                          <article key={item.kode} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-500">{item.label}</p>
                                <p className="mt-1 font-mono text-lg font-bold text-primary">{item.kode}</p>
                              </div>
                              <ToneBadge tone={memenuhi ? "good" : "attention"}>{memenuhi ? "Memenuhi T" : "Di bawah T"}</ToneBadge>
                            </div>
                            <div className="mt-3 flex items-end justify-between gap-3">
                              <p className="line-clamp-2 text-xs leading-relaxed text-gray-600" title={item.arti}>{item.arti}</p>
                              <p className="shrink-0 font-mono text-xl font-bold tabular-nums text-gray-900">{item.nilai.toFixed(2)}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="fokus-cpl-heading">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 id="fokus-cpl-heading" className="text-base font-bold text-gray-900">CPL yang perlu ditindaklanjuti</h3>
                        
                      </div>
                      <ToneBadge tone={fokusCpl.length > 0 ? "attention" : "good"}>
                        {fokusCpl.length > 0 ? `${fokusCpl.length} CPL perlu perhatian` : "Semua CPL memenuhi T"}
                      </ToneBadge>
                    </div>
                    {fokusCpl.length === 0 ? (
                      <div className="rounded-xl border border-green-200 bg-green-50/70 p-4">
                        <p className="font-semibold text-green-900">Semua CPL mencapai batas T = {ambang}.</p>
                        
                      </div>
                    ) : (
                      <ol className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-label="Daftar CPL di bawah batas">
                        {fokusCpl.slice().sort((a, b) => b.gagal - a.gagal || a.nilai - b.nilai).map((item) => (
                          <li key={item.cpl.kode} className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-mono text-sm font-bold text-primary">{item.cpl.kode}</p>
                                <p className="mt-0.5 text-xs font-medium text-gray-600">{item.cpl.deskripsiSingkat}</p>
                              </div>
                              <ToneBadge tone="attention">{item.gagal} dari {stats.total} mahasiswa</ToneBadge>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                              <span>Rata-rata CPL <strong className="font-mono text-gray-900">{item.nilai.toFixed(2)}</strong></span>
                              <span>Batas <strong className="font-mono text-gray-900">{ambang}</strong></span>
                            </div>
                            {item.indikator ? (
                              <p className="mt-3 border-t border-red-100 pt-3 text-xs leading-relaxed text-gray-600">
                                IK terendah: <strong className="font-mono text-primary">{item.indikator.kode}</strong> ({(rataIk[item.indikator.kode] ?? 0).toFixed(2)}).
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    )}
                    {offering.kode ? (
                      <div className="mt-4 flex justify-end">
                        <Link href={`/mata-kuliah/${offering.kode}`} onClick={() => { setTahunDipilih(offering.kode, offering.tahun); setKelasDipilih(offering.kode, offering.tahun, offering.kelas); }} className="inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                          Buka mata kuliah <span aria-hidden className="ml-1">→</span>
                        </Link>
                      </div>
                    ) : null}
                  </section>
                </>
              )}
            </div>
          </TabPanel>
        ) : null}

        {tab === "detail" ? (
          <TabPanel tabKey="detail">
            <div className="space-y-4 pt-2">
              {dataKosong ? (
                <EmptyState title={labelKosong} desc={deskripsiKosong} />
              ) : (
                <>
                  <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="sebaran-heading">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 id="sebaran-heading" className="text-base font-bold text-gray-900">Sebaran rata-rata CPL per mahasiswa</h3>
                        
                      </div>
                      <p className="shrink-0 text-xs font-medium text-gray-500">Total: {stats.total} mahasiswa</p>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600" aria-label="Keterangan warna sebaran">
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-red-600" />Rentang seluruhnya di bawah T</span>
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-amber-500" />Rentang melintasi T</span>
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-green-600" />Rentang seluruhnya memenuhi T</span>
                    </div>
                    <Histogram bands={sebaran} />
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="jenjang-heading">
                    <div className="mb-5">
                      <h3 id="jenjang-heading" className="text-base font-bold text-gray-900">Rata-rata capaian per jenjang</h3>
                      
                    </div>
                    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-green-600" />Memenuhi T</span>
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-red-600" />Di bawah T</span>
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-3.5 w-0.5 bg-primary" />Batas T</span>
                    </div>
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <div>
                        <h4 className="mb-3 text-sm font-bold text-gray-800">Indikator Kinerja (IK)</h4>
                        <JenjangBar data={rataIk} ambang={ambang} labelFor={(kode) => DAFTAR_IK.find((item) => item.kode === kode)?.deskripsi ?? "Indikator kinerja"} />
                      </div>
                      <div className="border-t border-gray-200 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                        <h4 className="mb-3 text-sm font-bold text-gray-800">Capaian Pembelajaran Lulusan (CPL)</h4>
                        <JenjangBar data={rataCpl} ambang={ambang} labelFor={(kode) => DAFTAR_CPL.find((item) => item.kode === kode)?.deskripsiSingkat ?? "Capaian pembelajaran lulusan"} />
                      </div>
                    </div>
                    
                  </section>

                </>
              )}
            </div>
          </TabPanel>
        ) : null}
      </section>
    </div>
  );
}
