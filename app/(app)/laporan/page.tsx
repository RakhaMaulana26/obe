"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp, offeringTerbaru } from "@/app/lib/store";
import { DAFTAR_ASESMEN, DAFTAR_CPL, DAFTAR_IK, mahasiswaUntukKelas, AMBANG_DEFAULT } from "@/app/lib/data";
import { hitungSemua, rataRata, susunRekomendasi } from "@/app/lib/hitung";
import { BadgeStatus, Btn, Card, EmptyState, PageHeading, StatCard, Td, Th, inputCls } from "@/app/components/ui";
import Tabs, { TabPanel } from "@/app/components/reactbits/Tabs";
import FadeContent from "@/app/components/reactbits/FadeContent";
import AnimatedList, { AnimatedItem } from "@/app/components/reactbits/AnimatedList";
import OfferingSelect, { DosenChip } from "@/app/components/OfferingSelect";

export default function LaporanPage() {
  const { nilaiUntuk, strukturUntuk, mataKuliah } = useApp();
  const [offering, setOffering] = useState(() => offeringTerbaru(mataKuliah));
  const [ambang, setAmbang] = useState(AMBANG_DEFAULT);
  const [tab, setTab] = useState("insight");
  const [cari, setCari] = useState("");
  const [infoUnduh, setInfoUnduh] = useState("");

  const mkKode = offering.kode;
  const mk = mataKuliah.find((m) => m.kode === offering.kode && m.tahun === offering.tahun && m.kelas === offering.kelas)
    ?? mataKuliah.find((m) => m.kode === offering.kode)
    ?? mataKuliah[0];
  const struktur = strukturUntuk(offering.kode);
  const { sub: daftarSub, cpmk: daftarCPMK, bobotW } = struktur;

  const nilaiAktif = useMemo(
    () => (offering.kode ? nilaiUntuk(offering.kode, offering.tahun, offering.kelas) : {}),
    [nilaiUntuk, offering],
  );
  const semua = hitungSemua(nilaiAktif, { w: struktur.bobotW, u: struktur.bobotU }, struktur.sub, struktur.cpmk);

  const ringkas = (() => {
    const arr = Object.values(semua);
    const tuntas = arr.filter((c) => Object.values(c.cpmk).every((v) => v >= ambang)).length;
    const semuaCpmk = arr.flatMap((c) => Object.values(c.cpmk));
    const rata = semuaCpmk.length ? semuaCpmk.reduce((a, b) => a + b, 0) / semuaCpmk.length : 0;
    return { total: arr.length, tuntas, belum: arr.length - tuntas, rata };
  })();

  const rataCpmk = rataRata(semua, "cpmk");
  const rataIk = rataRata(semua, "ik");
  const rataCpl = rataRata(semua, "cpl");

  const roster = mahasiswaUntukKelas(offering.kelas);
  const bermasalah = roster.map((m) => ({ m, c: semua[m.nrp] })).filter(({ c }) => c && Object.values(c.cpmk).some((v) => v < ambang));

  function unduhCSV() {
    setInfoUnduh("Menyiapkan file…");    const kepala = [
      "No", "NRP", "Nama",
      ...DAFTAR_ASESMEN.map((a) => a.kode),
      ...daftarSub.map((s) => s.kode),
      ...daftarCPMK.map((cpmk) => cpmk.kode),
      ...DAFTAR_IK.map((i) => i.kode),
      ...DAFTAR_CPL.map((c) => c.kode),
      "Status",
    ];
    const baris = roster.map((m, i) => {
      const c = semua[m.nrp];
      const n = nilaiAktif[m.nrp];
      const tuntas = c && Object.values(c.cpmk).every((v) => v >= ambang);
      return [
        i + 1, m.nrp, `"${m.nama}"`,
        ...DAFTAR_ASESMEN.map((a) => n?.[a.kode] ?? ""),
        ...daftarSub.map((s) => c?.sub[s.kode]?.toFixed(2) ?? ""),
        ...daftarCPMK.map((cpmk) => c?.cpmk[cpmk.kode]?.toFixed(2) ?? ""),
        ...DAFTAR_IK.map((ik) => c?.ik[ik.kode]?.toFixed(2) ?? ""),
        ...DAFTAR_CPL.map((cc) => c?.cpl[cc.kode]?.toFixed(2) ?? ""),
        tuntas ? "Tuntas" : "Belum",
      ].join(",");
    });
    const csv = [kepala.join(","), ...baris].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-capaian-${mkKode}-${offering.tahun}-kelas-${offering.kelas}-T${ambang}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setInfoUnduh(`Berhasil diunduh: laporan-capaian-${mkKode}-${offering.tahun}-kelas-${offering.kelas}-T${ambang}.csv`);
    setTimeout(() => setInfoUnduh(""), 4000);
  }

  const rekapTampil = roster.filter(
    (m) => !cari || m.nama.toLowerCase().includes(cari.toLowerCase()) || m.nrp.includes(cari),
  );

  return (
    <div className="space-y-6">
      <PageHeading
        title="Laporan Capaian"
        action={roster.length > 0 ? (
          <>
            <Btn variant="outline" onClick={() => window.print()} tour="Cetak halaman ini sebagai laporan PDF siap akreditasi." tourTitle="Cetak PDF">Cetak PDF</Btn>
            <Btn variant="accent" onClick={unduhCSV} tour="Unduh rekap capaian per mahasiswa dalam format CSV (Excel)." tourTitle="Unduh Excel">Unduh Excel (CSV)</Btn>
          </>
        ) : undefined}
      />
      {infoUnduh ? (
        <FadeContent>
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-800">{infoUnduh}</p>
        </FadeContent>
      ) : null}

      <FadeContent>
      <Card className="print:hidden">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Langkah 1 — Filter laporan</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <OfferingSelect
            daftar={mataKuliah}
            kode={offering.kode}
            tahun={offering.tahun}
            kelas={offering.kelas}
            onChange={(kode, tahun, kelas) => setOffering({ kode, tahun, kelas })}
            id="f-mk"
            label="Mata kuliah, tahun, dan kelas"
            tour="Pilih penawaran yang ingin dilaporkan — rekap di bawah mengikuti pilihan ini."
            tourTitle="Filter laporan"
          />
          <div>
            <label htmlFor="f-smt" className="mb-1.5 block text-sm font-medium text-gray-700">Semester & pengampu</label>
            <input id="f-smt" value={`${mk?.semester ? `Semester ${mk.semester}` : "Semester belum ditetapkan"} • ${mk?.dosen || "—"}`} disabled className={`${inputCls} opacity-70`} />
          </div>
          <div>
            <label htmlFor="f-t" className="mb-1.5 block text-sm font-medium text-gray-700">Batas lulus T (skor ≥ T = lulus)</label>
            <input id="f-t" type="number" min={0} max={100} value={ambang} onChange={(e) => setAmbang(Number(e.target.value))} className={inputCls} data-tour="Ubah batas lulus (T) khusus untuk laporan ini." data-tour-title="Batas lulus (T)" />
          </div>
        </div>
        <div className="mt-3">
          <DosenChip daftar={mataKuliah} kode={offering.kode} tahun={offering.tahun} kelas={offering.kelas} />
        </div>
      </Card>
      </FadeContent>

      {roster.length === 0 ? (
        <Card><EmptyState title="Belum ada data laporan" desc="Tambahkan mata kuliah dan data mahasiswa untuk mulai menyusun laporan capaian." /></Card>
      ) : (
      <>
      <div className="hidden print:block">
        <h2 className="text-xl font-bold text-black">Laporan Capaian Pembelajaran — {mkKode} (T = {ambang})</h2>
        <p className="text-sm text-black">PENS • D4 Teknik Informatika • {mkKode} {offering.tahun} • Kelas {mk?.kelas || "—"}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mahasiswa" value={String(ringkas.total)} numeric={ringkas.total} sub={`${mkKode} • ${offering.tahun} • Kelas ${mk?.kelas || "—"}`} />
        <StatCard label="Rata-rata CPMK" value={ringkas.rata.toFixed(2)} numeric={ringkas.rata} decimals={2} sub={`Batas T = ${ambang}`} />
        <StatCard label="Tuntas" value={`${ringkas.tuntas} mhs`} numeric={ringkas.tuntas} sub={`${((ringkas.tuntas / Math.max(1, ringkas.total)) * 100).toFixed(1)}% kelas`} highlight />
        <StatCard label="Belum tuntas" value={`${ringkas.belum} mhs`} numeric={ringkas.belum} sub="Ada CPMK di bawah T" />
      </div>

      <Tabs
        tabs={[
          { id: "insight", label: "Langkah 2 • Insight", hint: "Rata-rata + rekomendasi" },
          { id: "tabel", label: "Langkah 3 • Tabel & Ekspor", hint: "Rekap per mahasiswa" },
        ]}
        active={tab}
        onChange={setTab}
        className="print:hidden"
      />

      {tab === "insight" ? (
      <TabPanel tabKey="insight">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FadeContent>
        <Card>
          <h3 className="mb-1 text-base font-bold text-primary">Rata-rata per jenjang</h3>
          <p className="mb-3 text-xs text-gray-500">Hijau = lulus (≥ T), merah = belum</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-gray-200"><Th>Kode</Th><Th className="text-right">Rata-rata</Th><Th>Status</Th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {[...Object.entries(rataCpmk), ...Object.entries(rataIk), ...Object.entries(rataCpl)].map(([k, v]) => (
                  <tr key={k}>
                    <Td className="font-mono text-xs font-bold text-primary">{k}</Td>
                    <Td className="text-right font-mono font-semibold">{v.toFixed(2)}</Td>
                    <Td><BadgeStatus tercapai={v >= ambang} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </FadeContent>
        <FadeContent delay={0.06}>
        <Card>
          <h3 className="mb-1 text-base font-bold text-primary">Mahasiswa belum tuntas & rekomendasi</h3>
          <p className="mb-3 text-xs text-gray-500">Klik Detail untuk traceability per mahasiswa</p>
          {bermasalah.length === 0 ? (
            <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">Seluruh mahasiswa tuntas pada T = {ambang}. Pertahankan.</p>
          ) : (
            <AnimatedList className="space-y-2.5" step={0.05}>
              {bermasalah.map(({ m, c }) => (
                <AnimatedItem key={m.nrp}>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-primary">{m.nama}</span>
                    <Link href={`/capaian/${m.nrp}?kode=${mkKode}&tahun=${encodeURIComponent(offering.tahun)}`} className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-gray-200 hover:ring-primary print:hidden">Detail →</Link>
                  </div>
                  <p className="font-mono text-[11px] text-gray-400">{m.nrp}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{susunRekomendasi(c, ambang, daftarSub, bobotW)[0]}</p>
                </div>
                </AnimatedItem>
              ))}
            </AnimatedList>
          )}
        </Card>
        </FadeContent>
      </div>
      </TabPanel>
      ) : null}

      {tab === "tabel" ? (
      <TabPanel tabKey="tabel">
      <Card>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Rekapitulasi CPMK seluruh mahasiswa</h3>
            <p className="text-xs text-gray-500">Merah = di bawah T. Gunakan pencarian untuk sidang / verifikasi cepat.</p>
          </div>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama / NRP…"
            aria-label="Cari mahasiswa"
            className={`${inputCls} !w-64 print:hidden`}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <Th>No</Th><Th>NRP</Th><Th>Nama</Th>
                {daftarCPMK.map((cpmk) => <Th key={cpmk.kode} className="text-right">{cpmk.kode}</Th>)}
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rekapTampil.map((m, i) => {
                const c = semua[m.nrp];
                if (!c) return null;
                const tuntas = Object.values(c.cpmk).every((v) => v >= ambang);
                return (
                  <tr key={m.nrp} className="hover:bg-gray-50/70">
                    <Td className="text-gray-400">{i + 1}</Td>
                    <Td className="font-mono text-xs text-gray-500">{m.nrp}</Td>
                    <Td className="font-medium text-gray-800">{m.nama}</Td>
                    {daftarCPMK.map((cpmk) => (
                      <Td key={cpmk.kode} className={`text-right font-mono font-semibold ${(c.cpmk[cpmk.kode] ?? 0) < ambang ? "text-red-600" : "text-gray-800"}`}>
                        {(c.cpmk[cpmk.kode] ?? 0).toFixed(2)}
                      </Td>
                    ))}
                    <Td><BadgeStatus tercapai={tuntas} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rekapTampil.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">Tidak ada mahasiswa cocok dengan “{cari}”.</p>
          ) : null}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-gray-400">
          Metode: rata-rata berbobot berjenjang dari nilai → Sub-CPMK → CPMK → IK → CPL. Perhitungan berhenti di CPL; profil lulusan tidak diberi skor. CSV dapat dibuka di Excel.
        </p>
      </Card>
      </TabPanel>
      ) : null}
      </>
      )}
    </div>
  );
}
