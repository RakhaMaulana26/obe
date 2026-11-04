"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApp, daftarTahunOffering, daftarKelasOffering, kelasAktifUntuk, tahunAktifUntuk } from "@/app/lib/store";
import { DAFTAR_KELAS, nilaiAwalUntuk, type AsesmenKode, type NilaiMap } from "@/app/lib/data";
import { Btn, Card, EmptyState, Field, Modal, PageHeading, inputCls } from "@/app/components/ui";
import { parseCSVMahasiswa } from "@/app/lib/mahasiswa";
import { hitungNilaiAkhir, hitungSub, kolomNilai } from "@/app/lib/hitung";

export default function NilaiPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params);
  const mkKode = decodeURIComponent(kode).toUpperCase();
  const { mataKuliah, nilaiUntuk, setNilaiOffering, daftarAsesmen, strukturUntuk, tahunDipilih, setTahunDipilih, kelasDipilih, setKelasDipilih, mahasiswaUntuk, tambahMahasiswa, hapusMahasiswa, imporMahasiswa } = useApp();
  const daftarTahun = daftarTahunOffering(mataKuliah, mkKode);
  const tahun = tahunAktifUntuk(mataKuliah, tahunDipilih, mkKode);
  const daftarKelas = daftarKelasOffering(mataKuliah, mkKode, tahun);
  const kelas = kelasAktifUntuk(mataKuliah, kelasDipilih, mkKode, tahun);
  const mk = mataKuliah.find((m) => m.kode === mkKode && m.tahun === tahun && m.kelas === kelas) ?? mataKuliah.find((m) => m.kode === mkKode);

  const struktur = strukturUntuk(mkKode);
  // Satu kolom per pasangan (asesmen, Sub-CPMK) yang berbobot di rubrik.
  const kolom = kolomNilai(struktur.sub, struktur.bobotW, daftarAsesmen);
  const kunciKolom = (k: { asesmen: AsesmenKode; sub: string }) => `${k.asesmen}|${k.sub}`;
  const grupAsesmen = daftarAsesmen
    .map((a) => ({ asesmen: a, jumlah: kolom.filter((k) => k.asesmen === a.kode).length }))
    .filter((g) => g.jumlah > 0);
  // Bobot absolut pasangan terhadap MK (persen) = porsi w × bobot Sub-CPMK.
  const bobotPersen = (k: { asesmen: AsesmenKode; sub: string }) => {
    const sub = struktur.sub.find((s) => s.kode === k.sub);
    return (struktur.bobotW[k.sub]?.[k.asesmen] ?? 0) * (sub?.bobot ?? 0);
  };
  // Salinan kerja nilai penawaran aktif; disetel ulang saat konteks (MK/tahun) berubah.
  const konteks = `${mkKode}::${tahun}::${kelas}`;
  const [konteksLalu, setKonteksLalu] = useState(konteks);
  const [draft, setDraft] = useState<NilaiMap>(() => JSON.parse(JSON.stringify(nilaiUntuk(mkKode, tahun, kelas))) as NilaiMap);
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");
  const [kotor, setKotor] = useState(false);
  const [modalMhs, setModalMhs] = useState(false);
  const [formMhs, setFormMhs] = useState({ nrp: "", nama: "" });
  const [galatMhs, setGalatMhs] = useState("");
  const [galatImpor, setGalatImpor] = useState<string[]>([]);
  const [hapusNrp, setHapusNrp] = useState<string | null>(null);

  function simpanMahasiswa() {
    const galatBaru = tambahMahasiswa({ ...formMhs, kelas });
    if (galatBaru) return setGalatMhs(galatBaru);
    setModalMhs(false);
    setPesan(`Mahasiswa ${formMhs.nama.trim()} ditambahkan ke Kelas ${kelas}.`);
  }

  async function imporCSV(file: File | undefined) {
    if (!file) return;
    const { data, galat } = parseCSVMahasiswa(await file.text());
    imporMahasiswa(data);
    setGalatImpor(galat);
    setPesan(`${data.length} mahasiswa diimpor${galat.length ? `, ${galat.length} baris dilewati (lihat rincian di bawah)` : ""}.`);
  }

  if (konteksLalu !== konteks) {
    setKonteksLalu(konteks);
    setDraft(JSON.parse(JSON.stringify(nilaiUntuk(mkKode, tahun, kelas))) as NilaiMap);
    setKotor(false);
    setPesan("");
  }

  const q = cari.trim().toLowerCase();
  const roster = mahasiswaUntuk(kelas);
  const baris = q ? roster.filter((m) => m.nama.toLowerCase().includes(q) || m.nrp.includes(q)) : roster;

  const galat: string[] = [];
  for (const m of roster) {
    for (const k of kolom) {
      const v = draft[m.nrp]?.[k.asesmen]?.[k.sub];
      if (v === undefined || v === null || Number.isNaN(v) || v < 0 || v > 100) galat.push(`${m.nrp}/${kunciKolom(k)}`);
    }
  }

  function ubah(nrp: string, k: { asesmen: AsesmenKode; sub: string }, v: number) {
    setDraft((p) => ({ ...p, [nrp]: { ...p[nrp], [k.asesmen]: { ...p[nrp]?.[k.asesmen], [k.sub]: v } } }));
    setKotor(true);
  }

  function simpan() {
    if (galat.length > 0) {
      setPesan(`${galat.length} sel belum valid (harus 0–100). Perbaiki sel yang bertanda merah.`);
      return;
    }
    setNilaiOffering(mkKode, tahun, kelas, draft);
    setKotor(false);
    setPesan(`Nilai ${mkKode} tahun ${tahun} Kelas ${kelas} tersimpan. Dashboard dan detail capaian otomatis menghitung ulang.`);
  }

  const rataKolom: Record<string, number | null> = {};
  for (const k of kolom) {
    const arr = roster
      .map((m) => draft[m.nrp]?.[k.asesmen]?.[k.sub])
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100);
    rataKolom[kunciKolom(k)] = arr.length
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100
      : null;
  }
  const nilaiAkhir = (nrp: string): number | null => {
    const nilai = draft[nrp] ?? {};
    const lengkap = kolom.length > 0 && kolom.every((k) => {
      const skor = nilai[k.asesmen]?.[k.sub];
      return typeof skor === "number" && Number.isFinite(skor) && skor >= 0 && skor <= 100;
    });
    return lengkap ? hitungNilaiAkhir(hitungSub(nilai, struktur.bobotW, struktur.sub), struktur.sub) : null;
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title={`Input Nilai — ${mk?.kode ?? mkKode} | Kelas ${kelas}`}
        action={<Link href={`/mata-kuliah/${mkKode}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">← Hub MK</Link>}
      />

      {pesan && <div className={`rounded-lg border p-3 text-sm ${galat.length === 0 ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{pesan}</div>}

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="w-full max-w-xs">
            <label htmlFor="pilih-tahun-nilai" className="mb-1.5 block text-sm font-medium text-gray-700">
              Tahun ajaran (nilai tersimpan per tahun)
            </label>
            <select
              id="pilih-tahun-nilai"
              value={tahun}
              onChange={(e) => setTahunDipilih(mkKode, e.target.value)}
              className={inputCls}
            >
              {daftarTahun.map((t) => (
                <option key={t} value={t}>{t}{t === tahun && mk?.dosen ? ` • ${mk.dosen}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="w-full max-w-xs">
            <label htmlFor="pilih-kelas-nilai" className="mb-1.5 block text-sm font-medium text-gray-700">Kelas</label>
            <select id="pilih-kelas-nilai" value={kelas} onChange={(e) => setKelasDipilih(mkKode, tahun, e.target.value)} className={inputCls}>
              {DAFTAR_KELAS.filter((item) => daftarKelas.includes(item)).map((item) => <option key={item} value={item}>Kelas {item}</option>)}
            </select>
          </div>
          {mk?.dosen ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.06] px-3 py-2 text-xs font-medium text-primary">
              {mk.dosen}
              {mk.kelas ? ` • Kelas ${mk.kelas}` : ""}
            </span>
          ) : null}
        </div>
        {roster.length > 0 ? <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama / NRP..." className={`${inputCls} lg:!w-64`} />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${galat.length === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
              {galat.length === 0 ? "Semua sel valid" : `${galat.length} sel belum valid`}
            </span>
            {kotor && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Belum disimpan</span>}
            <Btn variant="outline" onClick={() => { setDraft(nilaiAwalUntuk(mkKode, tahun, kelas)); setKotor(true); setPesan(`Nilai Kelas ${kelas} dikosongkan. Klik Simpan nilai untuk menerapkan.`); }} tour="Kosongkan seluruh nilai penawaran ini (belum tersimpan sampai klik Simpan)." tourTitle="Kosongkan nilai">Kosongkan</Btn>
            <Btn onClick={simpan} tour="Simpan seluruh nilai — dashboard dan capaian menghitung ulang otomatis." tourTitle="Simpan nilai">Simpan nilai</Btn>
          </div>
        </div> : null}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Btn variant="outline" onClick={() => { setFormMhs({ nrp: "", nama: "" }); setGalatMhs(""); setModalMhs(true); }}>+ Tambah mahasiswa</Btn>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary/25">
            Impor CSV
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { void imporCSV(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <span className="text-xs text-gray-500">Format CSV: kolom NRP, Nama, Kelas (pemisah koma atau titik koma).</span>
        </div>
        {galatImpor.length > 0 ? (
          <ul className="mb-4 list-disc space-y-0.5 rounded-lg border border-amber-200 bg-amber-50 py-2 pl-8 pr-3 text-xs text-amber-800">
            {galatImpor.map((g) => <li key={g}>{g}</li>)}
          </ul>
        ) : null}

        {roster.length === 0 ? <EmptyState title="Belum ada mahasiswa" desc={`Tambahkan mahasiswa Kelas ${kelas} satu per satu atau impor dari file CSV, lalu isi nilainya.`} /> : <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead>
              <tr>
                <th rowSpan={2} className="border-b border-gray-200 pb-3 pr-2 align-bottom text-xs font-semibold uppercase tracking-wide text-gray-500">NRP</th>
                <th rowSpan={2} className="border-b border-gray-200 pb-3 pr-2 align-bottom text-xs font-semibold uppercase tracking-wide text-gray-500">Nama</th>
                {grupAsesmen.map((g) => (
                  <th key={g.asesmen.kode} colSpan={g.jumlah} className="border-l border-gray-200 px-1 pb-1 text-center text-xs font-semibold uppercase tracking-wide text-primary" title={g.asesmen.deskripsi}>{g.asesmen.nama}</th>
                ))}
                <th rowSpan={2} className="border-b border-l border-gray-200 px-2 pb-3 text-center align-bottom text-xs font-semibold uppercase tracking-wide text-gray-500">Nilai akhir</th>
              </tr>
              <tr className="border-b border-gray-200">
                {kolom.map((k, i) => (
                  <th key={kunciKolom(k)} className={`px-1 pb-2 text-center text-xs font-medium text-gray-500 ${i === 0 || kolom[i - 1].asesmen !== k.asesmen ? "border-l border-gray-200" : ""}`} title={`${k.sub} — bobot ${bobotPersen(k).toFixed(0)}% dari nilai MK`}>
                    {k.sub.replace("Sub-CPMK.", "Sub ")}
                    <span className="block text-[11px] font-normal text-gray-400">{bobotPersen(k).toFixed(0)}%</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {baris.map((m, i) => (
                <tr key={m.nrp} className="hover:bg-gray-50/70">
                  <td className="py-1.5 pr-2 font-mono text-xs text-gray-400">{m.nrp}</td>
                  <td className="max-w-52 py-1.5 pr-2 text-[13px] font-medium text-gray-800" title={m.nama}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-400">{i + 1}.</span>
                      <span className="truncate">{m.nama}</span>
                      {hapusNrp === m.nrp ? (
                        <span className="ml-auto flex shrink-0 gap-1">
                          <button type="button" onClick={() => { hapusMahasiswa(m.nrp); setDraft((p) => { const salin = { ...p }; delete salin[m.nrp]; return salin; }); setHapusNrp(null); }} className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-50">Hapus</button>
                          <button type="button" onClick={() => setHapusNrp(null)} className="rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100">Batal</button>
                        </span>
                      ) : (
                        <button type="button" aria-label={`Hapus ${m.nama}`} onClick={() => setHapusNrp(m.nrp)} className="ml-auto shrink-0 rounded px-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600">×</button>
                      )}
                    </div>
                  </td>
                  {kolom.map((k) => {
                    const v = draft[m.nrp]?.[k.asesmen]?.[k.sub];
                    const valid = v !== undefined && v !== null && !Number.isNaN(v) && v >= 0 && v <= 100;
                    return (
                      <td key={kunciKolom(k)} className="px-1 py-1.5">
                        <input
                          type="number" min={0} max={100}
                          value={v ?? ""}
                          aria-label={`${m.nama} — ${k.asesmen} ${k.sub}`}
                          onChange={(e) => ubah(m.nrp, k, e.target.value === "" ? Number.NaN : Number(e.target.value))}
                          className={`w-[68px] rounded-md border px-2 py-1.5 text-center font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25 ${valid ? "border-gray-200 text-gray-800" : "border-red-400 bg-red-50 text-red-700"}`}
                        />
                      </td>
                    );
                  })}
                  <td className="border-l border-gray-100 px-2 py-1.5 text-center font-mono text-[13px] font-bold text-primary">{nilaiAkhir(m.nrp)?.toFixed(2) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/60">
                <td colSpan={2} className="py-2.5 pr-2 text-right text-xs font-bold text-primary">Rata-rata</td>
                {kolom.map((k) => {
                  const rata = rataKolom[kunciKolom(k)];
                  return (
                    <td key={kunciKolom(k)} className="px-1 py-2.5 text-center font-mono text-[13px] font-bold text-primary">{rata === null ? "—" : rata.toFixed(1)}</td>
                  );
                })}
                <td className="px-2 py-2.5 text-center font-mono text-[13px] font-bold text-primary">
                  {(() => {
                    const nilaiTerisi = roster.map((m) => nilaiAkhir(m.nrp)).filter((nilai): nilai is number => nilai !== null);
                    return nilaiTerisi.length
                      ? (nilaiTerisi.reduce((total, nilai) => total + nilai, 0) / nilaiTerisi.length).toFixed(2)
                      : "—";
                  })()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>}

        {modalMhs ? (
          <Modal title={`Tambah mahasiswa — Kelas ${kelas}`} onClose={() => setModalMhs(false)}>
            <div className="space-y-4">
              {galatMhs ? <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{galatMhs}</p> : null}
              <Field label="NRP" htmlFor="mhs-nrp">
                <input id="mhs-nrp" value={formMhs.nrp} onChange={(e) => setFormMhs({ ...formMhs, nrp: e.target.value })} className={inputCls} autoFocus />
              </Field>
              <Field label="Nama" htmlFor="mhs-nama">
                <input id="mhs-nama" value={formMhs.nama} onChange={(e) => setFormMhs({ ...formMhs, nama: e.target.value })} className={inputCls} />
              </Field>
              <div className="flex justify-end gap-2">
                <Btn variant="outline" onClick={() => setModalMhs(false)}>Batal</Btn>
                <Btn onClick={simpanMahasiswa}>Simpan</Btn>
              </div>
            </div>
          </Modal>
        ) : null}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#103968] transition hover:brightness-95">
            Lihat hasil di Dashboard →
          </Link>
        </div>
      </Card>
    </div>
  );
}
