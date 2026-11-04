"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApp, daftarTahunOffering, daftarKelasOffering, kelasAktifUntuk, tahunAktifUntuk } from "@/app/lib/store";
import { DAFTAR_KELAS, AMBANG_DEFAULT } from "@/app/lib/data";
import { hitungSemua, konversiHuruf, rataRata, titikTerlemah } from "@/app/lib/hitung";
import { BadgeHuruf, BadgeStatus, Bar, Card, EmptyState, PageHeading, StatCard, Td, Th, inputCls } from "@/app/components/ui";

function JenjangBar({ data, label, ambang }: { data: Record<string, number>; label: (kode: string) => string; ambang: number }) {
  const keys = Object.keys(data).sort();
  if (keys.length === 0) return <p className="text-sm text-ink-muted">Belum ada data CPMK.</p>;
  return (
    <div className="space-y-3">
      {keys.map((kode) => {
        const skor = data[kode];
        const gagal = skor < ambang;
        return (
          <div key={kode}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-ink">
                {kode} <span className="font-normal text-ink-muted">{label(kode)}</span>
              </span>
              <span className={"font-bold " + (gagal ? "text-danger" : "text-primary")}>{skor.toFixed(2)}</span>
            </div>
            <Bar value={skor} tone={gagal ? "red" : "primary"} />
          </div>
        );
      })}
    </div>
  );
}

export default function CapaianCPMKPage({ params }: { params: Promise<{ kode: string }> }) {
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
  const { cpmk: daftarCPMK } = struktur;
  const [ambang, setAmbang] = useState<number>(AMBANG_DEFAULT);
  const [cari, setCari] = useState("");

  const nilaiAktif = nilaiUntuk(mkKode, tahun, kelas);
  const semua = hitungSemua(nilaiAktif, { w: struktur.bobotW, u: struktur.bobotU, rubrik: struktur.rubrik }, struktur.sub, struktur.cpmk);
  const daftarRata = rataRata(semua, "cpmk");
  const capaianMahasiswa = Object.values(semua);
  const totalSkor = capaianMahasiswa.flatMap((capaian) => daftarCPMK.map((cpmk) => capaian.cpmk[cpmk.kode] ?? 0));
  const rataCPMK = totalSkor.length ? totalSkor.reduce((jumlah, skor) => jumlah + skor, 0) / totalSkor.length : 0;
  const roster = mahasiswaUntuk(kelas);
  const query = cari.trim().toLowerCase();
  const mahasiswa = query
    ? roster.filter((item) => item.nama.toLowerCase().includes(query) || item.nrp.includes(query))
    : roster;
  const tuntas = capaianMahasiswa.filter((capaian) => daftarCPMK.length > 0 && daftarCPMK.every((cpmk) => (capaian.cpmk[cpmk.kode] ?? 0) >= ambang)).length;
  const perluPerhatian = capaianMahasiswa.length - tuntas;
  const lemah = titikTerlemah(daftarRata);
  const mahasiswaBelumTuntas = roster
    .map((item) => ({ mahasiswa: item, capaian: semua[item.nrp] }))
    .filter(({ capaian }) => capaian && daftarCPMK.some((cpmk) => (capaian.cpmk[cpmk.kode] ?? 0) < ambang))
    .slice(0, 8);

  if (!mk) {
    return (
      <div className="space-y-6">
        <PageHeading title={mkKode} />
        <EmptyState title="MK tidak ada" desc="Kembali ke daftar mata kuliah." />
        <Link href="/mata-kuliah" className="text-sm font-semibold text-primary hover:underline">Daftar mata kuliah</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Capaian CPMK"
        desc={`${mk.kode} ${mk.nama}. Skor tiap CPMK per mahasiswa terhadap batas kelulusan.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={"/mata-kuliah/" + mk.kode + "/capaian/sub-cpmk"} className="inline-flex items-center rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper">Lihat Sub-CPMK</Link>
            <Link href={"/mata-kuliah/" + mk.kode} className="inline-flex items-center rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper">Ringkasan MK</Link>
          </div>
        }
      />

      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Batas lulus CPMK</p>
          <p className="mt-0.5 text-sm text-ink">CPMK dinyatakan tercapai bila skornya sama dengan atau di atas batas lulus. Acuannya 60 (nilai C).</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {mk.dosen ? <span className="text-sm text-ink-muted">Dosen pengampu: <span className="text-ink">{mk.dosen}</span></span> : null}
          <label htmlFor="pilih-tahun-capaian-cpmk" className="sr-only">Tahun ajaran</label>
          <select id="pilih-tahun-capaian-cpmk" value={tahun} onChange={(event) => setTahunDipilih(mkKode, event.target.value)} className={inputCls + " !w-auto"} title="Tahun ajaran">
            {daftarTahun.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label htmlFor="pilih-kelas-capaian-cpmk" className="sr-only">Kelas</label>
          <select id="pilih-kelas-capaian-cpmk" value={kelas} onChange={(event) => setKelasDipilih(mkKode, tahun, event.target.value)} className={inputCls + " !w-auto"} title="Kelas">
            {DAFTAR_KELAS.filter((item) => daftarKelas.includes(item)).map((item) => <option key={item} value={item}>Kelas {item}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <label htmlFor="ambang-capaian-cpmk" className="text-sm font-medium text-ink">T =</label>
            <input id="ambang-capaian-cpmk" type="number" min={0} max={100} value={ambang} onChange={(event) => setAmbang(Number(event.target.value))} className={inputCls + " !w-24"} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mahasiswa" value={String(capaianMahasiswa.length)} numeric={capaianMahasiswa.length} sub={"Kelas " + (mk.kelas || "—")} />
        <StatCard label="Rata-rata CPMK" value={rataCPMK.toFixed(2)} numeric={rataCPMK} decimals={2} sub={"Huruf ≈ " + konversiHuruf(rataCPMK).huruf} />
        <StatCard label="Tuntas semua CPMK" value={String(tuntas)} numeric={tuntas} sub={((tuntas / Math.max(1, capaianMahasiswa.length)) * 100).toFixed(1) + "% dari kelas"} highlight />
        <StatCard label="Perlu perhatian" value={String(perluPerhatian)} numeric={perluPerhatian} sub="Minimal 1 CPMK di bawah T" />
      </div>

      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Rata-rata capaian CPMK</h3>
        <p className="mb-4 text-xs text-ink-muted">Skor CPMK merupakan gabungan Sub-CPMK sesuai bobotnya. Merah menandakan skor di bawah T.</p>
        <JenjangBar data={daftarRata} label={(kodeCPMK) => daftarCPMK.find((item) => item.kode === kodeCPMK)?.deskripsi.slice(0, 80) ?? ""} ambang={ambang} />
      </Card>

      <Card className="border-accent/60">
        <h3 className="mb-1 text-base font-bold text-primary">Diagnosis CPMK</h3>
        <p className="mb-4 text-xs text-ink-muted">
          CPMK dengan rata-rata kelas terendah: {lemah.kode || "—"} ({Number.isFinite(lemah.nilai) ? lemah.nilai.toFixed(2) : "0.00"}).
        </p>
        {mahasiswaBelumTuntas.length === 0 ? (
          <p className="text-sm text-ink-muted">Semua mahasiswa mencapai batas lulus CPMK ({ambang}).</p>
        ) : (
          <ul className="space-y-2">
            {mahasiswaBelumTuntas.map(({ mahasiswa: item, capaian }) => {
              if (!capaian) return null;
              const gagal = daftarCPMK.filter((cpmk) => (capaian.cpmk[cpmk.kode] ?? 0) < ambang).map((cpmk) => cpmk.kode).join(", ");
              return (
                <li key={item.nrp} className="flex flex-col gap-2 rounded-lg bg-paper p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{item.nama}</p>
                    <p className="mt-0.5 tabular-nums text-xs text-ink-muted">{item.nrp}, CPMK di bawah T: {gagal}</p>
                  </div>
                  <Link href={"/capaian/" + item.nrp + "?kode=" + mkKode + "&tahun=" + encodeURIComponent(tahun)} className="text-xs font-semibold text-primary hover:underline">Detail mahasiswa</Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Rekapitulasi CPMK per mahasiswa</h3>
            <p className="text-xs text-ink-muted">Nilai merah berada di bawah ambang T. Buka detail mahasiswa untuk melihat perhitungan lengkap.</p>
          </div>
          <input value={cari} onChange={(event) => setCari(event.target.value)} placeholder="Cari nama / NRP..." className={inputCls + " sm:!w-64"} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                <Th>NRP</Th>
                <Th>Nama</Th>
                {daftarCPMK.map((cpmk) => <Th key={cpmk.kode} className="text-right">{cpmk.kode}</Th>)}
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mahasiswa.map((item) => {
                const capaian = semua[item.nrp];
                if (!capaian) return null;
                const semuaTuntas = daftarCPMK.length > 0 && daftarCPMK.every((cpmk) => (capaian.cpmk[cpmk.kode] ?? 0) >= ambang);
                return (
                  <tr key={item.nrp} className="hover:bg-paper/70">
                    <Td className="tabular-nums text-xs text-ink-muted">{item.nrp}</Td>
                    <Td className="font-medium text-ink">{item.nama}</Td>
                    {daftarCPMK.map((cpmk) => {
                      const skor = capaian.cpmk[cpmk.kode] ?? 0;
                      const gagal = skor < ambang;
                      return (
                        <Td key={cpmk.kode} className="text-right">
                          <span className={"inline-flex items-center gap-1.5 rounded-md px-2 py-1 tabular-nums text-sm font-semibold " + (gagal ? "bg-danger-bg text-danger" : "text-ink")}>
                            {skor.toFixed(2)} <BadgeHuruf skor={skor} />
                          </span>
                        </Td>
                      );
                    })}
                    <Td><BadgeStatus tercapai={semuaTuntas} /></Td>
                    <Td><Link href={"/capaian/" + item.nrp + "?kode=" + mkKode + "&tahun=" + encodeURIComponent(tahun)} className="text-sm font-semibold text-primary hover:underline">Detail</Link></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={"/mata-kuliah/" + mk.kode + "/nilai"} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper">Kelola nilai asesmen</Link>
        </div>
      </Card>
    </div>
  );
}