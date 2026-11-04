"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApp } from "@/app/lib/store";
import {
  AMBANG_DEFAULT,
  DAFTAR_ASESMEN,
  DAFTAR_CPL,
  DAFTAR_IK,
  type NilaiMahasiswa,
} from "@/app/lib/data";
import {
  hitungCapaianSatuMahasiswa,
  statusCapaian,
  susunRekomendasi,
} from "@/app/lib/hitung";
import { ambilNilai, asesmenDariBobot, daftarIndikator } from "@/app/lib/penilaian";
import { BadgeHuruf, BadgeStatus, Btn, Card, EmptyState, PageHeading, Td, Th, inputCls } from "@/app/components/ui";
import Stepper, { StepPanel } from "@/app/components/reactbits/Stepper";
import Accordion from "@/app/components/reactbits/Accordion";
import OfferingSelect, { DosenChip } from "@/app/components/OfferingSelect";
import { offeringTerbaru } from "@/app/lib/store";

export default function DetailCapaianPage({ params, searchParams }: { params: Promise<{ nrp: string }>; searchParams: Promise<{ kode?: string | string[]; tahun?: string | string[] }> }) {
  const { nrp } = use(params);
  const query = use(searchParams);
  const { nilaiUntuk, strukturUntuk, mataKuliah, mahasiswa, mahasiswaUntuk } = useApp();
  const mhs = mahasiswa.find((m) => m.nrp === nrp);
  const rosterKelas = mahasiswaUntuk(mhs?.kelas ?? "A");
  const penawaranKelas = mataKuliah.filter((mk) => mk.kelas === (mhs?.kelas ?? "A"));
  const kodeQuery = Array.isArray(query.kode) ? query.kode[0] : query.kode;
  const tahunQuery = Array.isArray(query.tahun) ? query.tahun[0] : query.tahun;
  const pilihanAwal = penawaranKelas.find((mk) => mk.kode === kodeQuery && mk.tahun === tahunQuery);
  const defaultOffering = offeringTerbaru(penawaranKelas);
  const [ambang, setAmbang] = useState(AMBANG_DEFAULT);
  const [langkah, setLangkah] = useState(0);
  const [offering, setOffering] = useState(() => pilihanAwal ? { kode: pilihanAwal.kode, tahun: pilihanAwal.tahun, kelas: pilihanAwal.kelas } : defaultOffering);
  const struktur = strukturUntuk(offering.kode);
  const { bobotW, bobotU, cpmk: daftarCPMK, sub: daftarSub } = struktur;

  const nilaiMhs = offering.kode ? nilaiUntuk(offering.kode, offering.tahun, offering.kelas)[nrp] : undefined;

  const hasil = (() => {
    if (!nilaiMhs) return null;
    return hitungCapaianSatuMahasiswa(nilaiMhs, { w: struktur.bobotW, u: struktur.bobotU, rubrik: struktur.rubrik }, struktur.sub, struktur.cpmk);
  })();

  if (!mhs || !nilaiMhs || !hasil) {
    return (
      <div className="space-y-6">
        <PageHeading title="Detail capaian mahasiswa" />
        <EmptyState title="Mahasiswa tidak ditemukan" desc={`Tidak ada data nilai untuk NRP ${nrp}.`} />
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
          Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const tuntas = Object.values(hasil.cpmk).every((v) => v >= ambang);
  const idx = rosterKelas.findIndex((m) => m.nrp === nrp);
  const mhsPrev = idx > 0 ? rosterKelas[idx - 1] : null;
  const mhsNext = idx >= 0 && idx < rosterKelas.length - 1 ? rosterKelas[idx + 1] : null;
  const hrefMahasiswa = (nomor: string) => `/capaian/${nomor}?kode=${encodeURIComponent(offering.kode)}&tahun=${encodeURIComponent(offering.tahun)}`;
  const saran = susunRekomendasi(
    { ...hasil, nrp },
    ambang,
    daftarSub,
    bobotW,
  );

  // Lolos guard di atas: nilaiMhs pasti terisi — alias bertipe pasti untuk closure di bawah.
  const nm: NilaiMahasiswa = nilaiMhs;

  // Indikator lembar penilaian rubrik; dipakai untuk rincian Langkah 1 dan cara hitung Sub-CPMK.
  const daftarAsesmenAktif = asesmenDariBobot(bobotW, DAFTAR_ASESMEN);
  const indikator = daftarIndikator(daftarSub, bobotW, daftarAsesmenAktif, struktur.rubrik);

  function rincianSub(kode: string): string {
    const milik = indikator.filter((i) => i.sub === kode);
    // Sama dengan hitungSubDariIndikator: bobot distribusi rubrik per indikator (bobotSub).
    const total = milik.reduce((t, i) => t + i.bobotSub, 0) || 1;
    return milik.map((i) => `${ambilNilai(nm, i)}×${(i.bobotSub / total).toFixed(2)}`).join(" + ");
  }

  function rincianCpmk(kode: string): string {
    return daftarSub
      .filter((s) => s.cpmk === kode)
      .map((s) => `${(hasil?.sub[s.kode] ?? 0).toFixed(2)}×${s.v.toFixed(2)}`)
      .join(" + ");
  }

  function rincianIk(kode: string): string {
    const bagian: string[] = [];
    for (const [kc, peta] of Object.entries(bobotU)) {
      const b = peta[kode];
      if (b) bagian.push(`${(hasil?.cpmk[kc] ?? 0).toFixed(2)}×${b.toFixed(2)}`);
    }
    return bagian.join(" + ");
  }

  // Hanya IK yang diukur MK ini; porsi z dinormalisasi atas IK tersebut (sama dengan hitungCPL).
  const daftarIKTerukur = DAFTAR_IK.filter((i) => i.kode in hasil.ik);
  const daftarCPLTerukur = DAFTAR_CPL.filter((c) => c.kode in hasil.cpl);

  function rincianCpl(kode: string): string {
    const penyusun = daftarIKTerukur.filter((i) => i.cpl === kode);
    const totalZ = penyusun.reduce((a, i) => a + i.z, 0) || 1;
    return penyusun
      .map((i) => `${(hasil?.ik[i.kode] ?? 0).toFixed(2)}×${(i.z / totalZ).toFixed(2)}`)
      .join(" + ");
  }

  function BlokSkor({ skor }: { skor: number }) {
    const ok = statusCapaian(skor, ambang) === "Tercapai";
    return (
      <span className="inline-flex items-center gap-2">
        <span className={`tabular-nums text-sm font-bold ${ok ? "text-primary" : "text-danger"}`}>{skor.toFixed(2)}</span>
        <BadgeHuruf skor={skor} />
        <BadgeStatus tercapai={ok} />
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={mhs.nama}
        desc={`NRP ${mhs.nrp}, kelas ${mhs.kelas}. Hitungan capaian dari nilai indikator sampai CPL.`}
        action={
          <>
            <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
              Batas lulus
              <input type="number" min={0} max={100} value={ambang} onChange={(e) => setAmbang(Number(e.target.value))} className={`${inputCls} !w-20 tabular-nums`} data-tour="Atur batas lulus khusus halaman ini." data-tour-title="Batas lulus" />
            </label>
            <Btn variant="outline" onClick={() => window.print()} tour="Cetak rincian capaian mahasiswa ini sebagai PDF." tourTitle="Cetak">
              Cetak
            </Btn>
          </>
        }
      />

      <section aria-label="Konteks" className="rounded-lg border border-line bg-white print:hidden">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
            <OfferingSelect
              daftar={penawaranKelas}
              kode={offering.kode}
              tahun={offering.tahun}
              kelas={offering.kelas}
              onChange={(kode, tahun, kelas) => setOffering({ kode, tahun, kelas })}
              id="konteks-capaian"
              label="Mata kuliah"
              className="w-full sm:max-w-md"
            />
          <div className="pb-0.5">
            <DosenChip daftar={penawaranKelas} kode={offering.kode} tahun={offering.tahun} kelas={offering.kelas} />
          </div>
        </div>
        <nav aria-label="Mahasiswa lain di kelas ini" className="flex items-center justify-between gap-3 border-t border-line px-5 py-2.5 text-sm">
          {mhsPrev ? (
            <Link href={hrefMahasiswa(mhsPrev.nrp)} className="min-w-0 truncate text-primary hover:underline">Sebelumnya: {mhsPrev.nama}</Link>
          ) : <span />}
          <span className="shrink-0 tabular-nums text-ink-muted">{idx + 1} dari {rosterKelas.length}</span>
          {mhsNext ? (
            <Link href={hrefMahasiswa(mhsNext.nrp)} className="min-w-0 truncate text-right text-primary hover:underline">Berikutnya: {mhsNext.nama}</Link>
          ) : <span />}
        </nav>
      </section>

      <section aria-labelledby="status-cpmk" className={`rounded-lg border border-l-[3px] bg-white p-5 ${tuntas ? "border-line border-l-success" : "border-line border-l-danger"}`}>
        <h2 id="status-cpmk" className="font-semibold text-ink">
          {tuntas ? "Semua CPMK sudah mencapai batas lulus" : "Ada CPMK yang belum mencapai batas lulus"}
        </h2>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {daftarCPMK.map((c) => {
            const skor = hasil.cpmk[c.kode] ?? 0;
            return (
              <div key={c.kode} className="flex gap-1.5">
                <dt className="text-ink-muted">{c.kode}</dt>
                <dd className={`font-semibold tabular-nums ${skor >= ambang ? "text-ink" : "text-danger"}`}>{skor.toFixed(2)}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <div className="print:hidden">
        <Stepper
          steps={[
            { title: "Nilai", desc: "Indikator rubrik" },
            { title: "Sub-CPMK", desc: "Per topik" },
            { title: "CPMK", desc: "Mata kuliah" },
            { title: "IK", desc: "Indikator kinerja" },
            { title: "CPL", desc: "Capaian lulusan" },
          ]}
          active={langkah}
          onStep={setLangkah}
        />
      </div>

      <StepPanel stepKey={langkah}>
      {langkah === 0 ? (
      <Card>
        <h3 className="mb-1 text-lg font-semibold text-primary">Nilai asesmen</h3>
        <p className="mb-4 max-w-[70ch] text-sm leading-relaxed text-ink-muted">Skor tiap indikator rubrik (0–100). Nilai komponen adalah rata-rata indikatornya; nilai akhir adalah jumlah nilai komponen dikali bobotnya.</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {daftarAsesmenAktif.map((a) => {
            const milik = indikator.filter((i) => i.asesmen === a.kode);
            if (milik.length === 0) return null;
            const bobotKomponen = milik.reduce((t, i) => t + i.bobot, 0);
            return (
              <div key={a.kode} className="rounded-lg bg-paper p-3">
                <p className="text-xs font-bold text-primary">{a.nama} <span className="font-normal text-ink-muted">({bobotKomponen.toFixed(0)}%)</span></p>
                <ul className="mt-2 space-y-1">
                  {milik.map((i) => (
                    <li key={i.kunci} className="flex items-start justify-between gap-2 text-xs text-ink">
                      <span title={i.label} className="line-clamp-2">{i.label}</span>
                      <span className="tabular-nums text-sm font-bold text-ink">{ambilNilai(nilaiMhs, i)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex justify-between border-t border-line pt-1.5 text-xs font-semibold text-ink">
                  <span>Rata-rata</span>
                  <span className="tabular-nums">{(hasil.nilaiAsesmen[a.kode] ?? 0).toFixed(2)}</span>
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-ink">Nilai akhir mata kuliah: <span className="tabular-nums font-bold text-primary">{hasil.nilaiAkhir.toFixed(2)}</span> <BadgeHuruf skor={hasil.nilaiAkhir} /></p>
      </Card>
      ) : null}

      {langkah === 1 ? (
      <Card>
        <h3 className="mb-1 text-lg font-semibold text-primary">Sub-CPMK</h3>
        <p className="mb-4 max-w-[70ch] text-sm leading-relaxed text-ink-muted">Rata-rata berbobot dari indikator yang terhubung ke tiap Sub-CPMK, mengikuti tabel distribusi rubrik.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                <Th>Kode</Th>
                <Th>Deskripsi</Th>
                <Th className="text-right">Skor</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {daftarSub.map((s) => (
                <tr key={s.kode} className="hover:bg-paper/70">
                  <Td>
                    <span className="font-semibold tabular-nums text-primary">{s.kode}</span>
                    <span className="block text-xs text-ink-muted">bagian dari {s.cpmk}</span>
                  </Td>
                  <Td className="max-w-56 text-ink">{s.deskripsi} <span className="text-ink-muted">({s.level})</span></Td>
                  <Td className="text-right">
                    <BlokSkor skor={hasil.sub[s.kode] ?? 0} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Accordion title="Lihat cara hitung Sub-CPMK" desc="Nilai indikator × porsinya di Sub-CPMK" className="mt-4">
          <div className="space-y-1.5">
            {daftarSub.map((s) => (
              <p key={s.kode} className="tabular-nums text-xs text-ink-muted"><strong className="text-primary">{s.kode}</strong>: {rincianSub(s.kode)} = {(hasil.sub[s.kode] ?? 0).toFixed(2)}</p>
            ))}
          </div>
        </Accordion>
      </Card>
      ) : null}

      {langkah === 2 ? (
      <Card>
        <h3 className="mb-1 text-lg font-semibold text-primary">CPMK</h3>
        <p className="mb-4 max-w-[70ch] text-sm leading-relaxed text-ink-muted">Gabungan Sub-CPMK sesuai bobotnya di RPS.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                <Th>Kode</Th>
                <Th>Deskripsi</Th>
                <Th className="text-right">Skor</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {daftarCPMK.map((c) => (
                <tr key={c.kode} className="hover:bg-paper/70">
                  <Td>
                    <span className="font-semibold tabular-nums text-primary">{c.kode}</span>
                  </Td>
                  <Td className="max-w-72 text-sm text-ink">{c.deskripsi}</Td>
                  <Td className="text-right">
                    <BlokSkor skor={hasil.cpmk[c.kode] ?? 0} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Accordion title="Lihat cara hitung CPMK" desc="Gabungan Sub-CPMK sesuai porsinya" className="mt-4">
          <div className="space-y-1.5">
            {daftarCPMK.map((c) => (
              <p key={c.kode} className="tabular-nums text-xs text-ink-muted"><strong className="text-primary">{c.kode}</strong>: {rincianCpmk(c.kode)} = {(hasil.cpmk[c.kode] ?? 0).toFixed(2)}</p>
            ))}
          </div>
        </Accordion>
      </Card>
      ) : null}

      {langkah === 3 ? (
      <Card>
        <h3 className="mb-1 text-lg font-semibold text-primary">Indikator kinerja (IK)</h3>
        <p className="mb-4 max-w-[70ch] text-sm leading-relaxed text-ink-muted">Gabungan CPMK yang menopang indikator kinerja yang sama.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {daftarIKTerukur.map((i) => (
            <div key={i.kode} className="rounded-md border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-primary">{i.kode}</span>
                <BlokSkor skor={hasil.ik[i.kode] ?? 0} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink">{i.deskripsi}</p>
              <Accordion title="Cara hitung" className="mt-2">
                <p className="tabular-nums text-xs text-ink-muted">{rincianIk(i.kode)} = {(hasil.ik[i.kode] ?? 0).toFixed(2)}</p>
              </Accordion>
            </div>
          ))}
        </div>
      </Card>
      ) : null}

      {langkah === 4 ? (
      <Card>
        <h3 className="mb-1 text-lg font-semibold text-primary">Capaian pembelajaran lulusan (CPL)</h3>
        <p className="mb-4 max-w-[70ch] text-sm leading-relaxed text-ink-muted">Gabungan IK yang terukur di mata kuliah ini, sesuai porsinya.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {daftarCPLTerukur.map((c) => (
            <div key={c.kode} className="rounded-md border border-line p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-primary">{c.kode}</span>
                <BlokSkor skor={hasil.cpl[c.kode] ?? 0} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink">{c.deskripsiSingkat}</p>
              <Accordion title="Cara hitung" className="mt-2">
                <p className="tabular-nums text-xs text-ink-muted">{rincianCpl(c.kode)} = {(hasil.cpl[c.kode] ?? 0).toFixed(2)}</p>
              </Accordion>
            </div>
          ))}
        </div>
      </Card>
      ) : null}

      {langkah === 4 ? (
      <Card className="border-l-[3px] border-l-accent">
        <h3 className="mb-2 text-base font-bold text-primary">Rekomendasi tindak lanjut</h3>
        <p className="mb-4 max-w-[70ch] text-sm leading-relaxed text-ink-muted">Saran perbaikan berdasarkan capaian CPMK dan Sub-CPMK. Perhitungan level program studi berhenti pada CPL.</p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink">
          {saran.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Card>
      ) : null}
      </StepPanel>

      <div className="flex items-center justify-between print:hidden">
        <button
          disabled={langkah === 0}
          onClick={() => setLangkah(Math.max(0, langkah - 1))}
          className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-paper disabled:opacity-40"
        >
          Langkah sebelumnya
        </button>
        <span className="text-xs text-ink-muted">Langkah {langkah + 1} dari 5</span>
        <button
          disabled={langkah === 4}
          onClick={() => setLangkah(Math.min(4, langkah + 1))}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40"
        >
          Langkah berikutnya
        </button>
      </div>
    </div>
  );
}
