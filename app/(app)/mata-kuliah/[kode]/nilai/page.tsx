"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApp, daftarTahunOffering, daftarKelasOffering, kelasAktifUntuk, tahunAktifUntuk } from "@/app/lib/store";
import { DAFTAR_KELAS, type NilaiMap } from "@/app/lib/data";
import { Btn, Card, EmptyState, Field, Modal, PageHeading, inputCls } from "@/app/components/ui";
import { parseCSVMahasiswa } from "@/app/lib/mahasiswa";
import { asesmenDariBobot, daftarIndikator, hitungNilaiAkhirRubrik, nilaiPerAsesmen } from "@/app/lib/penilaian";

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
  // Satu kolom per indikator lembar penilaian rubrik (TI045105: 22 indikator).
  const asesmenAktif = asesmenDariBobot(struktur.bobotW, daftarAsesmen);
  const kolom = daftarIndikator(struktur.sub, struktur.bobotW, asesmenAktif, struktur.rubrik);
  type Kolom = (typeof kolom)[number];
  const kunciKolom = (k: Kolom) => `${k.asesmen}|${k.kunci}`;
  // Nilai mentah satu sel; nilai Mini Project format lama (satu nilai per Sub-CPMK) dipakai sampai sel diisi ulang.
  const nilaiSel = (nrp: string, k: Kolom): number | undefined => {
    const peta = draft[nrp]?.[k.asesmen];
    return peta?.[k.kunci] ?? (k.kunci !== k.sub ? peta?.[k.sub] : undefined);
  };
  const labelKolom = (k: Kolom) => `${k.sub.replace("Sub-CPMK.", "Sub ")}${k.kunci.includes("#") ? `.${k.kunci.split("#")[1]}` : ""}`;
  const keteranganKolom = (k: Kolom) =>
    [`${k.label}`, `Bobot ${k.bobot.toFixed(1).replace(/\.0$/, "")}% dari nilai MK`, ...(k.tingkat.length ? ["", "Tingkat capaian (tertinggi → terendah):", ...k.tingkat.map((t) => `• ${t}`)] : [])].join("\n");
  const grupAsesmen = daftarAsesmen
    .map((a) => ({ asesmen: a, jumlah: kolom.filter((k) => k.asesmen === a.kode).length }))
    .filter((g) => g.jumlah > 0);
  // Salinan kerja nilai penawaran aktif; disetel ulang saat konteks (MK/tahun) berubah.
  const konteks = `${mkKode}::${tahun}::${kelas}`;
  const [konteksLalu, setKonteksLalu] = useState(konteks);
  const [draft, setDraft] = useState<NilaiMap>(() => JSON.parse(JSON.stringify(nilaiUntuk(mkKode, tahun, kelas))) as NilaiMap);
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");
  const [kotor, setKotor] = useState(false);
  // Sel kosong baru ditandai merah setelah dosen mencoba menyimpan; nilai di luar 0–100 selalu ditandai.
  const [cobaSimpan, setCobaSimpan] = useState(false);
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
    setCobaSimpan(false);
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
      const v = nilaiSel(m.nrp, k);
      if (v === undefined || v === null || Number.isNaN(v) || v < 0 || v > 100) galat.push(`${m.nrp}/${kunciKolom(k)}`);
    }
  }

  function ubah(nrp: string, k: Kolom, v: number) {
    setDraft((p) => ({ ...p, [nrp]: { ...p[nrp], [k.asesmen]: { ...p[nrp]?.[k.asesmen], [k.kunci]: v } } }));
    setKotor(true);
  }

  function simpan() {
    if (galat.length > 0) {
      setCobaSimpan(true);
      setPesan(`${galat.length} sel masih kosong atau di luar 0–100. Sel tersebut ditandai merah.`);
      return;
    }
    setCobaSimpan(false);
    setNilaiOffering(mkKode, tahun, kelas, draft);
    setKotor(false);
    setPesan(`Nilai ${mkKode} tahun ${tahun} Kelas ${kelas} tersimpan. Dashboard dan detail capaian otomatis menghitung ulang.`);
  }

  const rataKolom: Record<string, number | null> = {};
  for (const k of kolom) {
    const arr = roster
      .map((m) => nilaiSel(m.nrp, k))
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100);
    rataKolom[kunciKolom(k)] = arr.length
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100
      : null;
  }
  const nilaiAkhir = (nrp: string): number | null => {
    const nilai = draft[nrp] ?? {};
    const lengkap = kolom.length > 0 && kolom.every((k) => {
      const skor = nilaiSel(nrp, k);
      return typeof skor === "number" && Number.isFinite(skor) && skor >= 0 && skor <= 100;
    });
    return lengkap ? hitungNilaiAkhirRubrik(nilai, kolom) : null;
  };
  // Rincian "Nilai skor rerata skor" per asesmen, untuk dicocokkan dengan lembar penilaian manual.
  const rincianAsesmen = (nrp: string) => {
    const rerata = nilaiPerAsesmen(draft[nrp] ?? {}, kolom);
    return daftarAsesmen.filter((a) => rerata[a.kode] !== undefined).map((a) => `${a.nama}: ${rerata[a.kode]?.toFixed(2)}`).join("\n");
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Input nilai"
        desc={`${mk?.kode ?? mkKode}${mk?.nama ? ` ${mk.nama}` : ""}, kelas ${kelas}. Satu kolom untuk setiap indikator lembar penilaian rubrik.`}
        action={<Link href={`/mata-kuliah/${mkKode}`} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper">Halaman mata kuliah</Link>}
      />

      {pesan && <div className={`rounded-lg border p-3 text-sm ${galat.length === 0 ? "border-success/30 bg-success-bg text-success" : "border-warning/30 bg-warning-bg text-warning"}`}>{pesan}</div>}

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="w-full max-w-xs">
            <label htmlFor="pilih-tahun-nilai" className="mb-1.5 block text-sm font-medium text-ink">
              Tahun ajaran (nilai tersimpan per tahun)
            </label>
            <select
              id="pilih-tahun-nilai"
              value={tahun}
              onChange={(e) => setTahunDipilih(mkKode, e.target.value)}
              className={inputCls}
            >
              {daftarTahun.map((t) => (
                <option key={t} value={t}>{t}{t === tahun && mk?.dosen ? `, ${mk.dosen}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="w-full max-w-xs">
            <label htmlFor="pilih-kelas-nilai" className="mb-1.5 block text-sm font-medium text-ink">Kelas</label>
            <select id="pilih-kelas-nilai" value={kelas} onChange={(e) => setKelasDipilih(mkKode, tahun, e.target.value)} className={inputCls}>
              {DAFTAR_KELAS.filter((item) => daftarKelas.includes(item)).map((item) => <option key={item} value={item}>Kelas {item}</option>)}
            </select>
          </div>
          {mk?.dosen ? (
            <p className="pb-2 text-sm text-ink-muted">Dosen pengampu: <span className="text-ink">{mk.dosen}</span></p>
          ) : null}
        </div>
        {roster.length > 0 ? <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama atau NRP" className={`${inputCls} lg:!w-64`} />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <span className="text-sm tabular-nums text-ink-muted">
              {galat.length === 0 ? "Semua sel terisi" : `${roster.length * kolom.length - galat.length} dari ${roster.length * kolom.length} sel terisi`}
              {kotor ? <span className="ml-2 font-semibold text-warning">belum disimpan</span> : null}
            </span>
            <Btn variant="outline" onClick={() => { setDraft(Object.fromEntries(roster.map((m) => [m.nrp, {}]))); setKotor(true); setPesan(`Nilai Kelas ${kelas} dikosongkan. Klik Simpan nilai untuk menerapkan.`); }} tour="Kosongkan seluruh nilai penawaran ini (belum tersimpan sampai klik Simpan)." tourTitle="Kosongkan nilai">Kosongkan</Btn>
            <Btn onClick={simpan} tour="Simpan seluruh nilai: dashboard dan capaian menghitung ulang otomatis." tourTitle="Simpan nilai">Simpan nilai</Btn>
          </div>
        </div> : null}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Btn variant="outline" onClick={() => { setFormMhs({ nrp: "", nama: "" }); setGalatMhs(""); setModalMhs(true); }}>+ Tambah mahasiswa</Btn>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper focus-within:ring-2 focus-within:ring-primary/25">
            Impor CSV
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { void imporCSV(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          <span className="text-xs text-ink-muted">Format CSV: kolom NRP, Nama, Kelas (pemisah koma atau titik koma).</span>
        </div>
        {galatImpor.length > 0 ? (
          <ul className="mb-4 list-disc space-y-0.5 rounded-lg border border-warning/30 bg-warning-bg py-2 pl-8 pr-3 text-xs text-warning">
            {galatImpor.map((g) => <li key={g}>{g}</li>)}
          </ul>
        ) : null}

        {roster.length === 0 ? <EmptyState title="Belum ada mahasiswa" desc={`Tambahkan mahasiswa Kelas ${kelas} satu per satu atau impor dari file CSV, lalu isi nilainya.`} /> : <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead>
              <tr>
                <th rowSpan={2} className="border-b border-line pb-3 pr-2 align-bottom text-xs font-semibold text-ink-muted">NRP</th>
                <th rowSpan={2} className="border-b border-line pb-3 pr-2 align-bottom text-xs font-semibold text-ink-muted">Nama</th>
                {grupAsesmen.map((g) => (
                  <th key={g.asesmen.kode} colSpan={g.jumlah} className="border-l border-line px-1 pb-1 text-center text-xs font-semibold text-primary" title={g.asesmen.deskripsi}>{g.asesmen.nama}</th>
                ))}
                <th rowSpan={2} className="border-b border-l border-line px-2 pb-3 text-center align-bottom text-xs font-semibold text-ink-muted">Nilai akhir</th>
              </tr>
              <tr className="border-b border-line">
                {kolom.map((k, i) => (
                  <th key={kunciKolom(k)} className={`cursor-help px-1 pb-2 text-center text-xs font-medium text-ink-muted ${i === 0 || kolom[i - 1].asesmen !== k.asesmen ? "border-l border-line" : ""}`} title={keteranganKolom(k)}>
                    {labelKolom(k)}
                    <span className="block text-xs font-normal text-ink-muted">{k.bobot.toFixed(1).replace(/\.0$/, "")}%</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {baris.map((m, i) => (
                <tr key={m.nrp} className="hover:bg-paper/70">
                  <td className="py-1.5 pr-2 tabular-nums text-xs text-ink-muted">{m.nrp}</td>
                  <td className="max-w-52 py-1.5 pr-2 text-sm font-medium text-ink" title={m.nama}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-ink-muted">{i + 1}.</span>
                      <span className="truncate">{m.nama}</span>
                      {hapusNrp === m.nrp ? (
                        <span className="ml-auto flex shrink-0 gap-1">
                          <button type="button" onClick={() => { hapusMahasiswa(m.nrp); setDraft((p) => { const salin = { ...p }; delete salin[m.nrp]; return salin; }); setHapusNrp(null); }} className="rounded px-1.5 py-0.5 text-xs font-semibold text-danger hover:bg-danger-bg">Hapus</button>
                          <button type="button" onClick={() => setHapusNrp(null)} className="rounded px-1.5 py-0.5 text-xs text-ink-muted hover:bg-paper">Batal</button>
                        </span>
                      ) : (
                        <button type="button" aria-label={`Hapus ${m.nama}`} onClick={() => setHapusNrp(m.nrp)} className="ml-auto shrink-0 rounded px-1.5 text-ink-muted hover:bg-paper hover:text-danger">×</button>
                      )}
                    </div>
                  </td>
                  {kolom.map((k) => {
                    const v = nilaiSel(m.nrp, k);
                    const kosong = v === undefined || v === null || Number.isNaN(v);
                    const valid = kosong ? !cobaSimpan : v >= 0 && v <= 100;
                    return (
                      <td key={kunciKolom(k)} className="px-1 py-1.5">
                        <input
                          type="number" min={0} max={100}
                          value={v ?? ""}
                          aria-label={`${m.nama}, ${daftarAsesmen.find((a) => a.kode === k.asesmen)?.nama ?? k.asesmen}: ${k.label}`}
                          onChange={(e) => ubah(m.nrp, k, e.target.value === "" ? Number.NaN : Number(e.target.value))}
                          className={`w-[68px] rounded-md border px-2 py-1.5 text-center tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 ${valid ? "border-line text-ink" : "border-danger bg-danger-bg text-danger"}`}
                        />
                      </td>
                    );
                  })}
                  <td className="border-l border-line px-2 py-1.5 text-center tabular-nums text-sm font-bold text-primary" title={rincianAsesmen(m.nrp)}>{nilaiAkhir(m.nrp)?.toFixed(2) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line bg-paper/60">
                <td colSpan={2} className="py-2.5 pr-2 text-right text-xs font-bold text-primary">Rata-rata</td>
                {kolom.map((k) => {
                  const rata = rataKolom[kunciKolom(k)];
                  return (
                    <td key={kunciKolom(k)} className="px-1 py-2.5 text-center tabular-nums text-sm font-bold text-primary">{rata === null ? "—" : rata.toFixed(1)}</td>
                  );
                })}
                <td className="px-2 py-2.5 text-center tabular-nums text-sm font-bold text-primary">
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
          <Modal title={`Tambah mahasiswa: Kelas ${kelas}`} onClose={() => setModalMhs(false)}>
            <div className="space-y-4">
              {galatMhs ? <p className="rounded-lg bg-danger-bg p-2.5 text-sm text-danger">{galatMhs}</p> : null}
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
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-primary transition hover:brightness-95">
            Lihat hasil di Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}
