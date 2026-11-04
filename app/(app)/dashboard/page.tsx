"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp, offeringTerbaru } from "@/app/lib/store";
import { AMBANG_DEFAULT, DAFTAR_ASESMEN, DAFTAR_CPL, DAFTAR_IK, TABEL_GRADE } from "@/app/lib/data";
import { hitungSemua, konversiHuruf, rataRata, titikTerlemah } from "@/app/lib/hitung";
import { Donut, Histogram } from "@/app/components/charts";
import Tabs, { TabPanel } from "@/app/components/reactbits/Tabs";
import { EmptyState, JudulBagian, PageHeading, StatCard, inputCls } from "@/app/components/ui";
import RantaiCapaian, { type SimpulCapaian } from "@/app/components/RantaiCapaian";
import OfferingSelect, { DosenChip } from "@/app/components/OfferingSelect";

const TABS = [
  { id: "ringkasan", label: "Ringkasan", hint: "Angka utama dan profil capaian" },
  { id: "diagnosis", label: "Diagnosis", hint: "CPL yang perlu ditindaklanjuti" },
  { id: "detail", label: "Detail", hint: "Sebaran nilai dan capaian tiap jenjang" },
];

type Tone = "neutral" | "good" | "attention";

function ToneBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const styles: Record<Tone, string> = {
    neutral: "bg-paper text-ink-muted",
    good: "bg-success-bg text-success",
    attention: "bg-danger-bg text-danger",
  };
  return <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
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
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink" aria-label="Keterangan grafik capaian CPL">
        <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-success" />Memenuhi batas lulus</span>
        <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-danger" />Di bawah batas lulus</span>
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
                  <span className="shrink-0 tabular-nums text-xs font-bold text-primary">{item.kode}</span>
                  <span className="truncate text-sm text-ink" title={item.nama}>{item.nama}</span>
                </div>
                <div
                  className="relative mt-2 h-2.5 overflow-visible rounded-full bg-paper"
                  role="meter"
                  aria-label={`Rata-rata ${item.kode}, ${item.nama}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Number(item.nilai.toFixed(2))}
                  aria-valuetext={`${item.nilai.toFixed(2)} dari 100; ${memenuhi ? "memenuhi" : "di bawah"} batas ${ambang}`}
                >
                  <span className={`block h-full rounded-full ${memenuhi ? "bg-success" : "bg-danger"}`} style={{ width: `${width}%` }} />
                  <span aria-hidden className="absolute -top-1 h-4 w-0.5 rounded-full bg-primary" style={{ left: `${ambang}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="tabular-nums text-sm font-bold tabular-nums text-ink">{item.nilai.toFixed(2)}</p>
                <p className={`mt-0.5 text-xs font-semibold ${memenuhi ? "text-success" : "text-danger"}`}>
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
    return <p className="rounded-lg bg-paper px-4 py-5 text-sm text-ink-muted">Belum ada capaian pada jenjang ini.</p>;
  }

  return (
    <ol className="space-y-3" aria-label="Rata-rata capaian, diurutkan dari nilai terendah">
      {rows.map(([kode, nilai]) => {
        const memenuhi = nilai >= ambang;
        const width = Math.max(0, Math.min(100, nilai));
        const deskripsi = labelFor(kode) || "Rata-rata capaian";
        return (
          <li key={kode} className="rounded-lg border border-line bg-white px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="tabular-nums text-xs font-bold text-primary">{kode}</p>
                <p className="mt-0.5 max-w-full truncate text-xs text-ink-muted" title={deskripsi}>{deskripsi}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular-nums text-sm font-bold tabular-nums text-ink">{nilai.toFixed(2)}</p>
                <p className={`text-xs font-semibold ${memenuhi ? "text-success" : "text-danger"}`}>
                  {memenuhi ? "Memenuhi T" : "Di bawah T"}
                </p>
              </div>
            </div>
            <div className="relative mt-2.5 h-2 overflow-visible rounded-full bg-paper" role="meter" aria-label={`${kode}: ${deskripsi}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(nilai.toFixed(2))} aria-valuetext={`${nilai.toFixed(2)} dari 100; batas ${ambang}`}>
              <span className={`block h-full rounded-full ${memenuhi ? "bg-success" : "bg-danger"}`} style={{ width: `${width}%` }} />
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
    () => hitungSemua(nilaiAktif, { w: struktur.bobotW, u: struktur.bobotU, rubrik: struktur.rubrik }, struktur.sub, struktur.cpmk),
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

  // Rantai capaian: rata-rata kelas di setiap jenjang beserta butir terlemahnya.
  const rantai = useMemo<SimpulCapaian[]>(() => {
    const arr = Object.values(semua);
    if (arr.length === 0) return [];
    const rerata = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
    const rataAsesmen: Record<string, number> = {};
    for (const a of DAFTAR_ASESMEN) {
      const nilai = arr.map((c) => c.nilaiAsesmen[a.kode]).filter((v): v is number => typeof v === "number");
      if (nilai.length) rataAsesmen[a.nama] = rerata(nilai);
    }
    const jenjang = (nama: string, peta: Record<string, number>, nilai: number, href?: string): SimpulCapaian => {
      const lemah = titikTerlemah(peta);
      return { jenjang: nama, nilai, terlemah: lemah.kode ? lemah : undefined, href };
    };
    const rataSub = rataRata(semua, "sub");
    const rataCpmk = rataRata(semua, "cpmk");
    const kodeMK = offering.kode;
    return [
      jenjang("Nilai akhir", rataAsesmen, rerata(arr.map((c) => c.nilaiAkhir)), kodeMK ? `/mata-kuliah/${kodeMK}/nilai` : undefined),
      jenjang("Sub-CPMK", rataSub, rerata(Object.values(rataSub)), kodeMK ? `/mata-kuliah/${kodeMK}/capaian/sub-cpmk` : undefined),
      jenjang("CPMK", rataCpmk, rerata(Object.values(rataCpmk)), kodeMK ? `/mata-kuliah/${kodeMK}/capaian` : undefined),
      jenjang("IK", rataIk, rerata(Object.values(rataIk)), "/ik"),
      jenjang("CPL", rataCpl, rerata(Object.values(rataCpl)), "/cpl"),
    ];
  }, [semua, rataIk, rataCpl, offering.kode]);

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
        title="Dashboard"
        desc="Ketercapaian kelas dari nilai asesmen sampai CPL untuk mata kuliah, tahun ajaran, dan kelas yang dipilih."
      />
      <section aria-label="Konteks dan parameter analisis" className="grid grid-cols-1 gap-5 rounded-lg border border-line bg-white p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">Konteks analisis</h2>
            </div>
            {offeringAktif?.isDummyMapping ? (
              <span title="Pemetaan CPL dan sebagian data awal pada penawaran ini menggunakan data contoh." className="inline-flex items-center gap-1.5 rounded-md bg-warning-bg px-3 py-1.5 text-xs font-bold text-warning ring-1 ring-inset ring-warning/30">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warning" />Data demo
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
              <label htmlFor="ambang" className="text-base font-semibold text-ink">Batas lulus</label>
            </div>
            <span className="text-sm text-ink-muted">
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
              data-tour-title="Batas lulus"
              className="min-w-0 flex-1 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                className={`${inputCls} px-2.5 text-center tabular-nums font-bold tabular-nums`}
              />
            </div>
          </div>
          <div className="mt-1 flex justify-between tabular-nums text-xs text-ink-muted"><span>0</span><span>100</span></div>
          
        </div>
      </section>

      <section aria-label="Bagian dashboard">
        <div className="mb-5">
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
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
                    <StatCard label="Mahasiswa" value={String(stats.total)} numeric={stats.total} />
                    <StatCard label="Rata-rata CPL kelas" value={stats.rataCplKelas.toFixed(2)} numeric={stats.rataCplKelas} decimals={2} />
                    <StatCard label="Tuntas semua CPL" value={String(stats.tuntas)} numeric={stats.tuntas} sub={`${stats.pctTuntas.toFixed(1)}% dari kelas`} />
                    <StatCard label="Perlu perhatian" value={String(stats.belum)} numeric={stats.belum} highlight={stats.belum > 0} />
                  </div>

                  <section aria-labelledby="rantai-heading" className="pt-2">
                    <JudulBagian
                      id="rantai-heading"
                      judul="Rantai capaian"
                      keterangan={`Rata-rata kelas di setiap jenjang. Angka bertanda kuning adalah jenjang terendah; angka merah di bawah ambang ${ambang}.`}
                    />
                    <RantaiCapaian simpul={rantai} ambang={ambang} />
                  </section>

                  <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
                    <section className="rounded-lg border border-line bg-white p-6" aria-labelledby="profil-cpl-heading">
                      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 id="profil-cpl-heading" className="text-base font-bold text-ink">Profil rata-rata capaian CPL</h3>
                          
                        </div>
                        <span className="text-xs font-medium text-ink-muted">Batas lulus {ambang}</span>
                      </div>
                      <CplProfile items={profilCpl} ambang={ambang} />
                    </section>

                    <section className="rounded-lg border border-line bg-white p-6" aria-labelledby="ketuntasan-heading">
                      <div>
                        <h3 id="ketuntasan-heading" className="text-base font-bold text-ink">Ketuntasan seluruh CPL</h3>
                        
                      </div>
                      <div className="mt-3 flex flex-col items-center">
                        <Donut pct={stats.pctTuntas} centerTop={`${stats.tuntas} dari ${stats.total} mahasiswa`} centerBottom={`batas lulus ${ambang}`} />
                        
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
                  <section className="rounded-lg border border-line bg-white p-6" aria-labelledby="titik-terendah-heading">
                    <div className="mb-4">
                      <h3 id="titik-terendah-heading" className="text-base font-bold text-ink">Titik capaian dengan rata-rata terendah</h3>
                      
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { kode: lemahIk.kode, label: "Indikator Kinerja (IK)", nilai: lemahIk.nilai, arti: DAFTAR_IK.find((ik) => ik.kode === lemahIk.kode)?.deskripsi ?? "Rata-rata kelas pada IK terendah." },
                        { kode: lemahCpl.kode, label: "Capaian Pembelajaran Lulusan (CPL)", nilai: lemahCpl.nilai, arti: DAFTAR_CPL.find((cpl) => cpl.kode === lemahCpl.kode)?.deskripsiSingkat ?? "Rata-rata kelas pada CPL terendah." },
                      ].map((item) => {
                        const memenuhi = item.nilai >= ambang;
                        return (
                          <article key={item.kode} className="rounded-lg border border-line bg-paper/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-ink-muted">{item.label}</p>
                                <p className="mt-1 tabular-nums text-lg font-bold text-primary">{item.kode}</p>
                              </div>
                              <ToneBadge tone={memenuhi ? "good" : "attention"}>{memenuhi ? "Memenuhi T" : "Di bawah T"}</ToneBadge>
                            </div>
                            <div className="mt-3 flex items-end justify-between gap-3">
                              <p className="line-clamp-2 text-xs leading-relaxed text-ink" title={item.arti}>{item.arti}</p>
                              <p className="shrink-0 tabular-nums text-xl font-bold tabular-nums text-ink">{item.nilai.toFixed(2)}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-lg border border-line bg-white p-6" aria-labelledby="fokus-cpl-heading">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 id="fokus-cpl-heading" className="text-base font-bold text-ink">CPL yang perlu ditindaklanjuti</h3>
                        
                      </div>
                      <ToneBadge tone={fokusCpl.length > 0 ? "attention" : "good"}>
                        {fokusCpl.length > 0 ? `${fokusCpl.length} CPL perlu perhatian` : "Semua CPL memenuhi T"}
                      </ToneBadge>
                    </div>
                    {fokusCpl.length === 0 ? (
                      <div className="rounded-lg border border-success/30 bg-success-bg/70 p-4">
                        <p className="font-semibold text-success">Semua CPL mencapai batas lulus {ambang}.</p>
                        
                      </div>
                    ) : (
                      <ol className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-label="Daftar CPL di bawah batas">
                        {fokusCpl.slice().sort((a, b) => b.gagal - a.gagal || a.nilai - b.nilai).map((item) => (
                          <li key={item.cpl.kode} className="rounded-lg border border-danger-bg bg-danger-bg/40 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="tabular-nums text-sm font-bold text-primary">{item.cpl.kode}</p>
                                <p className="mt-0.5 text-xs font-medium text-ink">{item.cpl.deskripsiSingkat}</p>
                              </div>
                              <ToneBadge tone="attention">{item.gagal} dari {stats.total} mahasiswa</ToneBadge>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink">
                              <span>Rata-rata CPL <strong className="tabular-nums text-ink">{item.nilai.toFixed(2)}</strong></span>
                              <span>Batas <strong className="tabular-nums text-ink">{ambang}</strong></span>
                            </div>
                            {item.indikator ? (
                              <p className="mt-3 border-t border-danger-bg pt-3 text-xs leading-relaxed text-ink">
                                IK terendah: <strong className="tabular-nums text-primary">{item.indikator.kode}</strong> ({(rataIk[item.indikator.kode] ?? 0).toFixed(2)}).
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    )}
                    {offering.kode ? (
                      <div className="mt-4 flex justify-end">
                        <Link href={`/mata-kuliah/${offering.kode}`} onClick={() => { setTahunDipilih(offering.kode, offering.tahun); setKelasDipilih(offering.kode, offering.tahun, offering.kelas); }} className="inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                          Buka mata kuliah <span aria-hidden className="ml-1"></span>
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
                  <section className="rounded-lg border border-line bg-white p-6" aria-labelledby="sebaran-heading">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 id="sebaran-heading" className="text-base font-bold text-ink">Sebaran rata-rata CPL per mahasiswa</h3>
                        
                      </div>
                      <p className="shrink-0 text-xs font-medium text-ink-muted">Total: {stats.total} mahasiswa</p>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink" aria-label="Keterangan warna sebaran">
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-danger" />Rentang seluruhnya di bawah T</span>
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-warning" />Rentang melintasi T</span>
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-success" />Rentang seluruhnya memenuhi T</span>
                    </div>
                    <Histogram bands={sebaran} />
                  </section>

                  <section className="rounded-lg border border-line bg-white p-6" aria-labelledby="jenjang-heading">
                    <div className="mb-5">
                      <h3 id="jenjang-heading" className="text-base font-bold text-ink">Rata-rata capaian per jenjang</h3>
                      
                    </div>
                    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink">
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-success" />Memenuhi batas lulus</span>
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-danger" />Di bawah batas lulus</span>
                      <span className="inline-flex items-center gap-2"><span aria-hidden className="h-3.5 w-0.5 bg-primary" />Batas T</span>
                    </div>
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <div>
                        <h4 className="mb-3 text-sm font-bold text-ink">Indikator Kinerja (IK)</h4>
                        <JenjangBar data={rataIk} ambang={ambang} labelFor={(kode) => DAFTAR_IK.find((item) => item.kode === kode)?.deskripsi ?? "Indikator kinerja"} />
                      </div>
                      <div className="border-t border-line pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                        <h4 className="mb-3 text-sm font-bold text-ink">Capaian Pembelajaran Lulusan (CPL)</h4>
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
