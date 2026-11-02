"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApp } from "@/app/lib/store";
import {
  AMBANG_DEFAULT,
  DAFTAR_ASESMEN,
  DAFTAR_CPL,
  DAFTAR_IK,
  DAFTAR_MAHASISWA,
  mahasiswaUntukKelas,
  type AsesmenKode,
  type NilaiMahasiswa,
} from "@/app/lib/data";
import {
  hitungCapaianSatuMahasiswa,
  kolomNilai,
  konversiHuruf,
  statusCapaian,
  susunRekomendasi,
} from "@/app/lib/hitung";
import { BadgeHuruf, BadgeStatus, Btn, Card, EmptyState, PageHeading, Td, Th, inputCls } from "@/app/components/ui";
import Stepper, { StepPanel } from "@/app/components/reactbits/Stepper";
import Accordion from "@/app/components/reactbits/Accordion";
import FadeContent from "@/app/components/reactbits/FadeContent";
import OfferingSelect, { DosenChip } from "@/app/components/OfferingSelect";
import { offeringTerbaru } from "@/app/lib/store";

export default function DetailCapaianPage({ params, searchParams }: { params: Promise<{ nrp: string }>; searchParams: Promise<{ kode?: string | string[]; tahun?: string | string[] }> }) {
  const { nrp } = use(params);
  const query = use(searchParams);
  const { nilaiUntuk, strukturUntuk, mataKuliah } = useApp();
  const mhs = DAFTAR_MAHASISWA.find((m) => m.nrp === nrp);
  const rosterKelas = mahasiswaUntukKelas(mhs?.kelas ?? "A");
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
    return hitungCapaianSatuMahasiswa(nilaiMhs, { w: struktur.bobotW, u: struktur.bobotU }, struktur.sub, struktur.cpmk);
  })();

  if (!mhs || !nilaiMhs || !hasil) {
    return (
      <div className="space-y-6">
        <PageHeading title="Detail Capaian Mahasiswa" />
        <EmptyState title="Mahasiswa tidak ditemukan" desc={`Tidak ada data nilai untuk NRP ${nrp}.`} />
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
          ← Kembali ke Dashboard
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

  function rincianSub(kode: string): string {
    const w = bobotW[kode] ?? {};
    return Object.entries(w)
      .map(([a, b]) => `${nm[a as AsesmenKode]?.[kode] ?? 0}×${Number(b).toFixed(2)}`)
      .join(" + ");
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
    const { huruf } = konversiHuruf(skor);
    return (
      <span className="inline-flex items-center gap-2">
        <span className={`font-mono text-sm font-bold ${ok ? "text-primary" : "text-red-600"}`}>{skor.toFixed(2)}</span>
        <BadgeHuruf skor={skor} />
        <span className="hidden text-[11px] text-gray-400 xl:inline">{huruf}</span>
        <BadgeStatus tercapai={ok} />
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={mhs.nama}
        action={
          <>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              ← Dashboard
            </Link>
            <Btn variant="accent" onClick={() => window.print()} tour="Cetak rincian capaian mahasiswa ini sebagai PDF." tourTitle="Cetak">
              Cetak
            </Btn>
            <span className="inline-flex items-center gap-2 text-sm text-gray-600">
              T =
              <input type="number" min={0} max={100} value={ambang} onChange={(e) => setAmbang(Number(e.target.value))} className={`${inputCls} !w-20 !py-1.5`} aria-label="Batas lulus" data-tour="Atur batas lulus (T) khusus halaman ini." data-tour-title="Batas lulus (T)" />
            </span>
          </>
        }
      />

      <div className="flex items-center justify-between gap-2 print:hidden">
        {mhsPrev ? (
          <Link href={hrefMahasiswa(mhsPrev.nrp)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">← {mhsPrev.nama}</Link>
        ) : <span />}
        <span className="font-mono text-[11px] text-gray-400">Mahasiswa {idx + 1} dari {rosterKelas.length} Kelas {mhs.kelas}</span>
        {mhsNext ? (
          <Link href={hrefMahasiswa(mhsNext.nrp)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">{mhsNext.nama} →</Link>
        ) : <span />}
      </div>

      <FadeContent>
        <Card className="!p-5 print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <OfferingSelect
              daftar={penawaranKelas}
              kode={offering.kode}
              tahun={offering.tahun}
              kelas={offering.kelas}
              onChange={(kode, tahun, kelas) => setOffering({ kode, tahun, kelas })}
              id="konteks-capaian"
              label="Sumber nilai — mata kuliah & tahun ajaran"
              className="w-full sm:max-w-md"
            />
            <div className="pb-0.5">
              <DosenChip daftar={penawaranKelas} kode={offering.kode} tahun={offering.tahun} kelas={offering.kelas} />
            </div>
          </div>
        </Card>
      </FadeContent>

      <Card className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${tuntas ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
        <div>
          <p className="text-sm font-semibold text-primary">
            {tuntas ? "Tuntas — seluruh capaian mata kuliah (CPMK) sudah ≥ T" : "Belum tuntas — ada capaian mata kuliah (CPMK) di bawah T"}
          </p>
          <p className="text-[13px] text-gray-600">
            CPMK-1 {hasil.cpmk["CPMK-1"]?.toFixed(2)} • CPMK-2 {hasil.cpmk["CPMK-2"]?.toFixed(2)} • CPMK-3{" "}
            {hasil.cpmk["CPMK-3"]?.toFixed(2)} (batas T = {ambang})
          </p>
        </div>
        <BadgeStatus tercapai={tuntas} />
      </Card>

      <FadeContent>
        <Card className="print:hidden">
          <Stepper
            steps={[
              { title: "Nilai", desc: "Tugas & ujian" },
              { title: "Sub-CPMK", desc: "Capaian kecil" },
              { title: "CPMK", desc: "Capaian MK" },
              { title: "IK", desc: "Kemampuan spesifik" },
              { title: "CPL", desc: "Capaian lulusan" },
            ]}
            active={langkah}
            onStep={setLangkah}
          />
        </Card>
      </FadeContent>

      <StepPanel stepKey={langkah}>
      {langkah === 0 ? (
      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Langkah 1 — Nilai asesmen (masukan)</h3>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">Nilai tiap asesmen per indikator Sub-CPMK sesuai rubrik • skala 0–100. Ini satu-satunya data yang diinput dosen.</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {DAFTAR_ASESMEN.map((a) => {
            const kolom = kolomNilai(daftarSub, bobotW, [a]);
            if (kolom.length === 0) return null;
            return (
              <div key={a.kode} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-bold text-primary">{a.nama}</p>
                <ul className="mt-2 space-y-1">
                  {kolom.map(({ sub }) => (
                    <li key={sub} className="flex items-center justify-between gap-2 text-xs text-gray-600">
                      <span>{sub}</span>
                      <span className="font-mono text-sm font-bold text-gray-800">{nilaiMhs[a.kode]?.[sub] ?? 0}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-gray-700">Nilai akhir mata kuliah: <span className="font-mono font-bold text-primary">{hasil.nilaiAkhir.toFixed(2)}</span> <BadgeHuruf skor={hasil.nilaiAkhir} /></p>
      </Card>
      ) : null}

      {langkah === 1 ? (
      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Langkah 2 — Skor capaian kecil (Sub-CPMK)</h3>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">Rata-rata berbobot dari nilai asesmen. Skor + status di depan, detail hitung tersembunyi di bawah.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <Th>Kode</Th>
                <Th>Deskripsi</Th>
                <Th className="text-right">Skor</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {daftarSub.map((s) => (
                <tr key={s.kode} className="hover:bg-gray-50/70">
                  <Td>
                    <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-white">{s.kode}</span>
                    <span className="ml-2 text-[11px] text-gray-400">→ {s.cpmk}</span>
                  </Td>
                  <Td className="max-w-56 text-gray-700">{s.deskripsi} <span className="text-gray-400">({s.level})</span></Td>
                  <Td className="text-right">
                    <BlokSkor skor={hasil.sub[s.kode] ?? 0} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Accordion title="Lihat cara hitung Sub-CPMK" desc="Contoh: 80×0,50 + 70×0,50 = 75" className="mt-4">
          <div className="space-y-1.5">
            {daftarSub.map((s) => (
              <p key={s.kode} className="font-mono text-[11px] text-gray-500"><strong className="text-primary">{s.kode}</strong>: {rincianSub(s.kode)} = {(hasil.sub[s.kode] ?? 0).toFixed(2)}</p>
            ))}
          </div>
        </Accordion>
      </Card>
      ) : null}

      {langkah === 2 ? (
      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Langkah 3 — Skor capaian mata kuliah (CPMK)</h3>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">Gabungan capaian-capaian kecil di atasnya sesuai porsinya.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <Th>Kode</Th>
                <Th>Deskripsi</Th>
                <Th className="text-right">Skor</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {daftarCPMK.map((c) => (
                <tr key={c.kode} className="hover:bg-gray-50/70">
                  <Td>
                    <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-white">{c.kode}</span>
                  </Td>
                  <Td className="max-w-72 text-[13px] text-gray-700">{c.deskripsi}</Td>
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
              <p key={c.kode} className="font-mono text-[11px] text-gray-500"><strong className="text-primary">{c.kode}</strong>: {rincianCpmk(c.kode)} = {(hasil.cpmk[c.kode] ?? 0).toFixed(2)}</p>
            ))}
          </div>
        </Accordion>
      </Card>
      ) : null}

      {langkah === 3 ? (
      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Langkah 4 — Kemampuan spesifik (IK)</h3>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">Gabungan CPMK yang mengukur kemampuan yang sama.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {daftarIKTerukur.map((i) => (
            <div key={i.kode} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-primary">{i.kode}</span>
                <BlokSkor skor={hasil.ik[i.kode] ?? 0} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{i.deskripsi}</p>
              <Accordion title="Cara hitung" className="mt-2" desc={rincianIk(i.kode)}>
                <p className="font-mono text-[11px] text-gray-500">{rincianIk(i.kode)} = {(hasil.ik[i.kode] ?? 0).toFixed(2)}</p>
              </Accordion>
            </div>
          ))}
        </div>
      </Card>
      ) : null}

      {langkah === 4 ? (
      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Langkah 5 — Capaian lulusan (CPL)</h3>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">Gabungan kemampuan spesifik sesuai porsinya.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {daftarCPLTerukur.map((c) => (
            <div key={c.kode} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-primary">{c.kode}</span>
                <BlokSkor skor={hasil.cpl[c.kode] ?? 0} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{c.deskripsiSingkat}</p>
              <Accordion title="Cara hitung" className="mt-2" desc={rincianCpl(c.kode)}>
                <p className="font-mono text-[11px] text-gray-500">{rincianCpl(c.kode)} = {(hasil.cpl[c.kode] ?? 0).toFixed(2)}</p>
              </Accordion>
            </div>
          ))}
        </div>
      </Card>
      ) : null}

      {langkah === 4 ? (
      <Card className="border-accent/60">
        <h3 className="mb-2 text-base font-bold text-primary">Rekomendasi tindak lanjut</h3>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">Saran perbaikan berdasarkan capaian CPMK dan Sub-CPMK. Perhitungan level program studi berhenti pada CPL.</p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-700">
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
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
        >
          ← Sebelumnya
        </button>
        <span className="text-xs text-gray-500">Langkah {langkah + 1} dari 5</span>
        <button
          disabled={langkah === 4}
          onClick={() => setLangkah(Math.min(4, langkah + 1))}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-primary/90"
        >
          Berikutnya →
        </button>
      </div>
    </div>
  );
}
