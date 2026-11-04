"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp, offeringTerbaru } from "@/app/lib/store";
import { DAFTAR_ASESMEN, DAFTAR_CPL, DAFTAR_IK, AMBANG_DEFAULT } from "@/app/lib/data";
import { hitungSemua, rataRata, susunRekomendasi } from "@/app/lib/hitung";
import { ambilNilai, asesmenDariBobot, daftarIndikator } from "@/app/lib/penilaian";
import { BadgeStatus, Btn, Card, EmptyState, PageHeading, StatCard, Td, Th, inputCls } from "@/app/components/ui";
import Tabs, { TabPanel } from "@/app/components/reactbits/Tabs";
import OfferingSelect from "@/app/components/OfferingSelect";

export default function LaporanPage() {
  const { nilaiUntuk, strukturUntuk, mataKuliah, mahasiswaUntuk } = useApp();
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
  const semua = hitungSemua(nilaiAktif, { w: struktur.bobotW, u: struktur.bobotU, rubrik: struktur.rubrik }, struktur.sub, struktur.cpmk);

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
  // Kolom CSV mengikuti lembar penilaian rubrik: satu kolom per indikator, lalu rata-rata tiap asesmen.
  // IK/CPL hanya yang diukur MK ini.
  const daftarAsesmenCSV = asesmenDariBobot(bobotW, DAFTAR_ASESMEN);
  const kolomCSV = daftarIndikator(daftarSub, bobotW, daftarAsesmenCSV, struktur.rubrik);
  const asesmenCSV = daftarAsesmenCSV.filter((a) => kolomCSV.some((k) => k.asesmen === a.kode));
  const selCSV = (teks: string) => `"${teks.replace(/"/g, '""')}"`;
  const ikCSV = DAFTAR_IK.filter((i) => i.kode in rataIk);
  const cplCSV = DAFTAR_CPL.filter((c) => c.kode in rataCpl);

  const roster = mahasiswaUntuk(offering.kelas);
  const bermasalah = roster.map((m) => ({ m, c: semua[m.nrp] })).filter(({ c }) => c && Object.values(c.cpmk).some((v) => v < ambang));

  function unduhCSV() {
    setInfoUnduh("Menyiapkan file…");    const kepala = [
      "No", "NRP", "Nama",
      ...kolomCSV.map((k) => selCSV(`${daftarAsesmenCSV.find((a) => a.kode === k.asesmen)?.nama ?? k.asesmen}: ${k.label}`)),
      ...asesmenCSV.map((a) => selCSV(`Rata-rata ${a.nama}`)),
      ...daftarSub.map((s) => s.kode),
      ...daftarCPMK.map((cpmk) => cpmk.kode),
      ...ikCSV.map((i) => i.kode),
      ...cplCSV.map((c) => c.kode),
      "Nilai akhir",
      "Status",
    ];
    const baris = roster.map((m, i) => {
      const c = semua[m.nrp];
      const n = nilaiAktif[m.nrp];
      const tuntas = c && Object.values(c.cpmk).every((v) => v >= ambang);
      return [
        i + 1, m.nrp, `"${m.nama}"`,
        ...kolomCSV.map((k) => (n ? ambilNilai(n, k) : "")),
        ...asesmenCSV.map((a) => c?.nilaiAsesmen[a.kode]?.toFixed(2) ?? ""),
        ...daftarSub.map((s) => c?.sub[s.kode]?.toFixed(2) ?? ""),
        ...daftarCPMK.map((cpmk) => c?.cpmk[cpmk.kode]?.toFixed(2) ?? ""),
        ...ikCSV.map((ik) => c?.ik[ik.kode]?.toFixed(2) ?? ""),
        ...cplCSV.map((cc) => c?.cpl[cc.kode]?.toFixed(2) ?? ""),
        c?.nilaiAkhir.toFixed(2) ?? "",
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
        title="Laporan capaian"
        desc="Rekap capaian satu kelas untuk arsip dan bahan akreditasi."
        action={roster.length > 0 ? (
          <>
            <Btn variant="outline" onClick={() => window.print()} tour="Cetak halaman ini sebagai laporan PDF siap akreditasi." tourTitle="Cetak PDF">Cetak PDF</Btn>
            <Btn onClick={unduhCSV} tour="Unduh rekap capaian per mahasiswa dalam format CSV (Excel)." tourTitle="Unduh CSV">Unduh CSV</Btn>
          </>
        ) : undefined}
      />
      {infoUnduh ? (
        <div>
          <p className="rounded-lg border border-success/30 bg-success-bg px-4 py-2.5 text-sm font-medium text-success">{infoUnduh}</p>
        </div>
      ) : null}

      <div>
      <Card className="print:hidden">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <OfferingSelect
            daftar={mataKuliah}
            kode={offering.kode}
            tahun={offering.tahun}
            kelas={offering.kelas}
            onChange={(kode, tahun, kelas) => setOffering({ kode, tahun, kelas })}
            id="f-mk"
            label="Mata kuliah, tahun, dan kelas"
            tour="Pilih penawaran yang ingin dilaporkan: rekap di bawah mengikuti pilihan ini."
            tourTitle="Filter laporan"
          />
          <div>
            <label htmlFor="f-smt" className="mb-1.5 block text-sm font-medium text-ink">Semester dan pengampu</label>
            <input id="f-smt" value={`${mk?.semester ? `Semester ${mk.semester}` : "Semester belum ditetapkan"}, ${mk?.dosen || "—"}`} disabled className={`${inputCls} opacity-70`} />
          </div>
          <div>
            <label htmlFor="f-t" className="mb-1.5 block text-sm font-medium text-ink">Batas lulus</label>
            <input id="f-t" type="number" min={0} max={100} value={ambang} onChange={(e) => setAmbang(Number(e.target.value))} className={inputCls} data-tour="Ubah batas lulus khusus untuk laporan ini." data-tour-title="Batas lulus" />
          </div>
        </div>
      </Card>
      </div>

      {roster.length === 0 ? (
        <Card><EmptyState title="Belum ada data laporan" desc="Tambahkan mata kuliah dan data mahasiswa untuk mulai menyusun laporan capaian." /></Card>
      ) : (
      <>
      <div className="hidden print:block">
        <h2 className="text-xl font-bold text-black">Laporan Capaian Pembelajaran: {mkKode} (batas lulus {ambang})</h2>
        <p className="text-sm text-black">PENS, D4 Teknik Informatika, {mkKode} {offering.tahun}, Kelas {mk?.kelas || "—"}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mahasiswa" value={String(ringkas.total)} numeric={ringkas.total} sub={`${mkKode}, ${offering.tahun}, Kelas ${mk?.kelas || "—"}`} />
        <StatCard label="Rata-rata CPMK" value={ringkas.rata.toFixed(2)} numeric={ringkas.rata} decimals={2} sub={`Batas lulus ${ambang}`} />
        <StatCard label="Tuntas" value={String(ringkas.tuntas)} numeric={ringkas.tuntas} sub={`${((ringkas.tuntas / Math.max(1, ringkas.total)) * 100).toFixed(1)}% dari kelas`} />
        <StatCard label="Belum tuntas" value={String(ringkas.belum)} numeric={ringkas.belum} highlight={ringkas.belum > 0} sub="Ada CPMK di bawah batas lulus" />
      </div>

      <Tabs
        tabs={[
          { id: "insight", label: "Ringkasan", hint: "Rata-rata per jenjang dan rekomendasi" },
          { id: "tabel", label: "Tabel dan ekspor", hint: "Rekap per mahasiswa" },
        ]}
        active={tab}
        onChange={setTab}
        className="print:hidden"
      />

      {tab === "insight" ? (
      <TabPanel tabKey="insight">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
        <Card>
          <h3 className="mb-1 font-semibold text-primary">Rata-rata per jenjang</h3>
          <p className="mb-3 text-sm text-ink-muted">CPMK, IK, dan CPL yang diukur mata kuliah ini.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-line"><Th>Kode</Th><Th className="text-right">Rata-rata</Th><Th className="pl-6">Status</Th></tr></thead>
              <tbody className="divide-y divide-line">
                {[...Object.entries(rataCpmk), ...Object.entries(rataIk), ...Object.entries(rataCpl)].map(([k, v]) => (
                  <tr key={k}>
                    <Td className="font-semibold tabular-nums text-primary">{k}</Td>
                    <Td className="text-right tabular-nums font-semibold">{v.toFixed(2)}</Td>
                    <Td className="pl-6"><BadgeStatus tercapai={v >= ambang} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </div>
        <div>
        <Card>
          <h3 className="mb-1 font-semibold text-primary">Mahasiswa belum tuntas</h3>
          <p className="mb-3 text-sm text-ink-muted">Rekomendasi utama tiap mahasiswa. Buka rincian untuk melihat hitungannya.</p>
          {bermasalah.length === 0 ? (
            <p className="border-l-[3px] border-success py-1 pl-4 text-sm text-ink">Semua mahasiswa tuntas pada batas lulus {ambang}.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {bermasalah.map(({ m, c }) => (
                <li key={m.nrp} className="py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{m.nama} <span className="font-normal tabular-nums text-ink-muted">{m.nrp}</span></span>
                    <Link href={`/capaian/${m.nrp}?kode=${mkKode}&tahun=${encodeURIComponent(offering.tahun)}`} className="shrink-0 text-sm font-semibold text-primary hover:underline print:hidden">Rincian</Link>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{susunRekomendasi(c, ambang, daftarSub, bobotW)[0]}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>
      </div>
      </TabPanel>
      ) : null}

      {tab === "tabel" ? (
      <TabPanel tabKey="tabel">
      <Card>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-primary">Rekap CPMK seluruh mahasiswa</h3>
            <p className="text-sm text-ink-muted">Angka merah berada di bawah batas lulus {ambang}.</p>
          </div>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama atau NRP"
            aria-label="Cari mahasiswa"
            className={`${inputCls} !w-64 print:hidden`}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <Th>No</Th><Th>NRP</Th><Th>Nama</Th>
                {daftarCPMK.map((cpmk) => <Th key={cpmk.kode} className="text-right">{cpmk.kode}</Th>)}
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rekapTampil.map((m, i) => {
                const c = semua[m.nrp];
                if (!c) return null;
                const tuntas = Object.values(c.cpmk).every((v) => v >= ambang);
                return (
                  <tr key={m.nrp} className="hover:bg-paper/70">
                    <Td className="text-ink-muted">{i + 1}</Td>
                    <Td className="tabular-nums text-xs text-ink-muted">{m.nrp}</Td>
                    <Td className="font-medium text-ink">{m.nama}</Td>
                    {daftarCPMK.map((cpmk) => (
                      <Td key={cpmk.kode} className={`text-right tabular-nums font-semibold ${(c.cpmk[cpmk.kode] ?? 0) < ambang ? "text-danger" : "text-ink"}`}>
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
            <p className="p-4 text-center text-sm text-ink-muted">Tidak ada mahasiswa cocok dengan “{cari}”.</p>
          ) : null}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Skor dihitung berjenjang dari nilai indikator ke Sub-CPMK, CPMK, IK, lalu CPL. Profil lulusan tidak diberi skor. Berkas CSV bisa dibuka di Excel.
        </p>
      </Card>
      </TabPanel>
      ) : null}
      </>
      )}
    </div>
  );
}
