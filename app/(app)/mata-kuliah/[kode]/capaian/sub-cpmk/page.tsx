"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApp, daftarTahunOffering, daftarKelasOffering, kelasAktifUntuk, tahunAktifUntuk } from "@/app/lib/store";
import { DAFTAR_KELAS, AMBANG_DEFAULT } from "@/app/lib/data";
import { hitungSemua, konversiHuruf, rataRata, titikTerlemah } from "@/app/lib/hitung";
import { BadgeHuruf, BadgeStatus, Bar, Card, EmptyState, PageHeading, StatCard, Td, Th, inputCls } from "@/app/components/ui";

function DaftarRataSub({ data, deskripsi, ambang }: { data: Record<string, number>; deskripsi: (kode: string) => string; ambang: number }) {
  const keys = Object.keys(data).sort();
  if (keys.length === 0) return <p className="text-sm text-gray-400">Belum ada data Sub-CPMK.</p>;
  return (
    <div className="space-y-3">
      {keys.map((kode) => {
        const skor = data[kode];
        const gagal = skor < ambang;
        return (
          <div key={kode}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-gray-700">
                {kode} <span className="font-normal text-gray-400">• {deskripsi(kode)}</span>
              </span>
              <span className={"font-bold " + (gagal ? "text-red-600" : "text-primary")}>{skor.toFixed(2)}</span>
            </div>
            <Bar value={skor} tone={gagal ? "red" : "primary"} />
          </div>
        );
      })}
    </div>
  );
}

export default function CapaianSubCPMKPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params);
  const mkKode = decodeURIComponent(kode).toUpperCase();
  const { mataKuliah, nilaiUntuk, strukturUntuk, tahunDipilih, setTahunDipilih, kelasDipilih, setKelasDipilih, mahasiswaUntuk } = useApp();
  const daftarTahun = daftarTahunOffering(mataKuliah, mkKode);
  const tahun = tahunAktifUntuk(mataKuliah, tahunDipilih, mkKode);
  const daftarKelas = daftarKelasOffering(mataKuliah, mkKode, tahun);
  const kelas = kelasAktifUntuk(mataKuliah, kelasDipilih, mkKode, tahun);
  const mk = mataKuliah.find((item) => item.kode === mkKode && item.tahun === tahun && item.kelas === kelas)
    ?? mataKuliah.find((item) => item.kode === mkKode);
  const struktur = strukturUntuk(mkKode);
  const { bobotW, sub: daftarSub, cpmk: daftarCPMK } = struktur;
  const [ambang, setAmbang] = useState<number>(AMBANG_DEFAULT);
  const [cari, setCari] = useState("");

  const nilaiAktif = nilaiUntuk(mkKode, tahun, kelas);
  const semua = hitungSemua(nilaiAktif, { w: bobotW, u: struktur.bobotU }, daftarSub, daftarCPMK);
  const rataSub = rataRata(semua, "sub");
  const capaianMahasiswa = Object.values(semua);
  const totalSkorSub = capaianMahasiswa.flatMap((capaian) => daftarSub.map((sub) => capaian.sub[sub.kode] ?? 0));
  const rataKeseluruhan = totalSkorSub.length ? totalSkorSub.reduce((jumlah, skor) => jumlah + skor, 0) / totalSkorSub.length : 0;
  const roster = mahasiswaUntuk(kelas);
  const query = cari.trim().toLowerCase();
  const mahasiswa = query
    ? roster.filter((item) => item.nama.toLowerCase().includes(query) || item.nrp.includes(query))
    : roster;
  const tuntas = capaianMahasiswa.filter((capaian) => daftarSub.length > 0 && daftarSub.every((sub) => (capaian.sub[sub.kode] ?? 0) >= ambang)).length;
  const perluPerhatian = capaianMahasiswa.length - tuntas;
  const lemah = titikTerlemah(rataSub);
  const mahasiswaBelumTuntas = roster
    .map((item) => ({ mahasiswa: item, capaian: semua[item.nrp] }))
    .filter(({ capaian }) => capaian && daftarSub.some((sub) => (capaian.sub[sub.kode] ?? 0) < ambang))
    .slice(0, 8);

  if (!mk) {
    return (
      <div className="space-y-6">
        <PageHeading title={mkKode} />
        <EmptyState title="MK tidak ada" desc="Kembali ke daftar mata kuliah." />
        <Link href="/mata-kuliah" className="text-sm font-semibold text-primary hover:underline">← Daftar MK</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={"Capaian Sub-CPMK — " + mk.kode}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={"/mata-kuliah/" + mk.kode + "/capaian"} className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Lihat CPMK</Link>
            <Link href={"/mata-kuliah/" + mk.kode} className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Hub MK</Link>
          </div>
        }
      />

      <Card className="flex flex-col gap-4 bg-primary/[0.03] lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Ambang ketercapaian Sub-CPMK (T)</p>
          <p className="mt-0.5 text-[13px] text-gray-600">Sub-CPMK tercapai bila skornya ≥ T. Acuan awal T = 60; status pada halaman ini mengikuti ambang yang dipilih.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {mk.dosen ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-medium text-primary ring-1 ring-gray-200">{mk.dosen} • {tahun}</span> : null}
          <label htmlFor="pilih-tahun-capaian-sub" className="sr-only">Tahun ajaran</label>
          <select id="pilih-tahun-capaian-sub" value={tahun} onChange={(event) => setTahunDipilih(mkKode, event.target.value)} className={inputCls + " !w-auto"} title="Tahun ajaran">
            {daftarTahun.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label htmlFor="pilih-kelas-capaian-sub" className="sr-only">Kelas</label>
          <select id="pilih-kelas-capaian-sub" value={kelas} onChange={(event) => setKelasDipilih(mkKode, tahun, event.target.value)} className={inputCls + " !w-auto"} title="Kelas">
            {DAFTAR_KELAS.filter((item) => daftarKelas.includes(item)).map((item) => <option key={item} value={item}>Kelas {item}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label htmlFor="ambang-capaian-sub" className="text-sm font-medium text-gray-700">T =</label>
            <input id="ambang-capaian-sub" type="number" min={0} max={100} value={ambang} onChange={(event) => setAmbang(Number(event.target.value))} className={inputCls + " !w-24"} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mahasiswa" value={String(capaianMahasiswa.length)} numeric={capaianMahasiswa.length} sub={"Kelas " + (mk.kelas || "—")} />
        <StatCard label="Rata-rata Sub-CPMK" value={rataKeseluruhan.toFixed(2)} numeric={rataKeseluruhan} decimals={2} sub={"Huruf ≈ " + konversiHuruf(rataKeseluruhan).huruf} />
        <StatCard label="Tuntas semua Sub-CPMK" value={String(tuntas)} numeric={tuntas} sub={((tuntas / Math.max(1, capaianMahasiswa.length)) * 100).toFixed(1) + "% dari kelas"} highlight />
        <StatCard label="Perlu perhatian" value={String(perluPerhatian)} numeric={perluPerhatian} sub="Minimal 1 Sub-CPMK di bawah T" />
      </div>

      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Rata-rata capaian Sub-CPMK</h3>
        <p className="mb-4 text-xs text-gray-500">Skor tiap Sub-CPMK merupakan gabungan nilai asesmen sesuai bobot. Merah menandakan skor di bawah T.</p>
        <DaftarRataSub data={rataSub} deskripsi={(kodeSub) => daftarSub.find((item) => item.kode === kodeSub)?.deskripsi ?? ""} ambang={ambang} />
      </Card>

      <Card className="border-accent/60">
        <h3 className="mb-1 text-base font-bold text-primary">Diagnosis Sub-CPMK</h3>
        <p className="mb-4 text-xs text-gray-500">
          Sub-CPMK dengan rata-rata kelas terendah: {lemah.kode || "—"} ({Number.isFinite(lemah.nilai) ? lemah.nilai.toFixed(2) : "0.00"})
          {lemah.kode ? " — " + (daftarSub.find((sub) => sub.kode === lemah.kode)?.deskripsi ?? "") : ""}.
        </p>
        {mahasiswaBelumTuntas.length === 0 ? (
          <p className="text-sm text-gray-500">Semua mahasiswa mencapai ambang Sub-CPMK T = {ambang}.</p>
        ) : (
          <ul className="space-y-2">
            {mahasiswaBelumTuntas.map(({ mahasiswa: item, capaian }) => {
              if (!capaian) return null;
              const gagal = daftarSub.filter((sub) => (capaian.sub[sub.kode] ?? 0) < ambang).map((sub) => sub.kode).join(", ");
              return (
                <li key={item.nrp} className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-primary">{item.nama}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-gray-400">{item.nrp} • Sub-CPMK di bawah T: {gagal}</p>
                  </div>
                  <Link href={"/capaian/" + item.nrp + "?kode=" + mkKode + "&tahun=" + encodeURIComponent(tahun)} className="text-xs font-semibold text-primary hover:underline">Detail mahasiswa →</Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Rekapitulasi Sub-CPMK per mahasiswa</h3>
            <p className="text-xs text-gray-500">Nilai merah berada di bawah ambang T. Kolom kode Sub-CPMK menampilkan deskripsi saat diarahkan.</p>
          </div>
          <input value={cari} onChange={(event) => setCari(event.target.value)} placeholder="Cari nama / NRP..." className={inputCls + " sm:!w-64"} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <Th>NRP</Th>
                <Th>Nama</Th>
                {daftarSub.map((sub) => <Th key={sub.kode} className="text-right" title={sub.deskripsi}>{sub.kode}</Th>)}
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mahasiswa.map((item) => {
                const capaian = semua[item.nrp];
                if (!capaian) return null;
                const semuaTuntas = daftarSub.length > 0 && daftarSub.every((sub) => (capaian.sub[sub.kode] ?? 0) >= ambang);
                return (
                  <tr key={item.nrp} className="hover:bg-gray-50/70">
                    <Td className="font-mono text-xs text-gray-500">{item.nrp}</Td>
                    <Td className="font-medium text-gray-800">{item.nama}</Td>
                    {daftarSub.map((sub) => {
                      const skor = capaian.sub[sub.kode] ?? 0;
                      const gagal = skor < ambang;
                      return (
                        <Td key={sub.kode} className="text-right">
                          <span className={"inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[13px] font-semibold " + (gagal ? "bg-red-50 text-red-700" : "text-gray-800")}>
                            {skor.toFixed(2)} <BadgeHuruf skor={skor} />
                          </span>
                        </Td>
                      );
                    })}
                    <Td><BadgeStatus tercapai={semuaTuntas} /></Td>
                    <Td><Link href={"/capaian/" + item.nrp + "?kode=" + mkKode + "&tahun=" + encodeURIComponent(tahun)} className="text-[13px] font-semibold text-primary hover:underline">Detail</Link></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={"/mata-kuliah/" + mk.kode + "/nilai"} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Kelola nilai asesmen</Link>
        </div>
      </Card>
    </div>
  );
}