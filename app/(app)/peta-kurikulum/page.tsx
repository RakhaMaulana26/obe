"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Btn, Card, EmptyState, Modal, PageHeading, StatCard, inputCls } from "@/app/components/ui";
import { DAFTAR_CPL, DAFTAR_IK, PEMETAAN_KURIKULUM_SEED, type CPL, type IK } from "@/app/lib/data";
import { bacaDataTersimpan, useApp } from "@/app/lib/store";

type PemetaanMK = Record<string, Record<string, number>>;
type KelompokIK = { kode: string; nama: string; ik: IK[] };
type StatusFilter = "semua" | "belum" | "draft" | "lengkap";

function bacaDaftar<T>(kunci: string, fallback: T): T {
  return bacaDataTersimpan(kunci, fallback);
}

function bersihkanPemetaan(nilai: unknown): PemetaanMK {
  if (!nilai || typeof nilai !== "object" || Array.isArray(nilai)) return {};
  const hasil: PemetaanMK = {};
  for (const [kodeMK, baris] of Object.entries(nilai)) {
    if (!baris || typeof baris !== "object" || Array.isArray(baris)) continue;
    const ik: Record<string, number> = {};
    for (const [kodeIK, mentah] of Object.entries(baris)) {
      const bobot = Number(mentah);
      if (Number.isFinite(bobot) && bobot > 0 && bobot <= 100) ik[kodeIK] = bobot;
    }
    hasil[kodeMK.toUpperCase()] = ik;
  }
  return hasil;
}

function kelompokkanIK(cplList: CPL[], ikList: IK[]): KelompokIK[] {
  const urutKode = (a: { kode: string }, b: { kode: string }) =>
    a.kode.localeCompare(b.kode, "id", { numeric: true, sensitivity: "base" });
  const kelompok: KelompokIK[] = cplList
    .map((cpl) => ({
      kode: cpl.kode,
      nama: cpl.deskripsiSingkat || cpl.deskripsi,
      ik: ikList.filter((ik) => ik.cpl === cpl.kode).sort(urutKode),
    }))
    .filter((item) => item.ik.length > 0);
  const kodeCPL = new Set(cplList.map((cpl) => cpl.kode));
  const ikTanpaCPL = ikList.filter((ik) => !kodeCPL.has(ik.cpl)).sort(urutKode);
  if (ikTanpaCPL.length > 0) kelompok.push({ kode: "__tanpa_cpl__", nama: "CPL belum tersedia", ik: ikTanpaCPL });
  return kelompok;
}

function formatPersen(nilai: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(nilai);
}

function kutipCSV(nilai: string | number): string {
  return `"${String(nilai).replaceAll('"', '""')}"`;
}

export default function PetaKurikulumPage() {
  const { mataKuliah, ubahMK } = useApp();
  const [cplList] = useState<CPL[]>(() => bacaDaftar("obe-cpl", DAFTAR_CPL));
  const [ikList] = useState<IK[]>(() => bacaDaftar("obe-ik", DAFTAR_IK));
  const [pemetaan, setPemetaan] = useState<PemetaanMK>(() =>
    bersihkanPemetaan(bacaDaftar<unknown>("obe-pemetaan-kurikulum", PEMETAAN_KURIKULUM_SEED)),
  );
  const [cari, setCari] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("semua");
  const [editKode, setEditKode] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [galat, setGalat] = useState("");

  const daftarMK = useMemo(() => {
    const unik = new Map<string, { kode: string; nama: string; sks: number; semester: number | null }>();
    for (const mk of mataKuliah) {
      if (!unik.has(mk.kode)) unik.set(mk.kode, { kode: mk.kode, nama: mk.nama, sks: mk.sks, semester: mk.semester });
    }
    return [...unik.values()].sort((a, b) => a.kode.localeCompare(b.kode, "id", { numeric: true }));
  }, [mataKuliah]);

  const kelompok = useMemo(() => kelompokkanIK(cplList, ikList), [cplList, ikList]);
  const daftarKolomIK = useMemo(() => kelompok.flatMap((item) => item.ik), [kelompok]);

  function totalMK(kodeMK: string, data: PemetaanMK = pemetaan): number {
    return Object.entries(data[kodeMK] ?? {}).reduce(
      (total, [kodeIK, bobot]) => total + (ikList.some((ik) => ik.kode === kodeIK) ? bobot : 0),
      0,
    );
  }

  function statusMK(kodeMK: string): "belum" | "draft" | "lengkap" {
    const total = totalMK(kodeMK);
    if (total === 0) return "belum";
    return Math.abs(total - 100) < 0.001 ? "lengkap" : "draft";
  }

  const jumlahLengkap = daftarMK.filter((mk) => statusMK(mk.kode) === "lengkap").length;
  const jumlahDraft = daftarMK.filter((mk) => statusMK(mk.kode) === "draft").length;
  const jumlahBelum = daftarMK.filter((mk) => statusMK(mk.kode) === "belum").length;

  const daftarTampil = daftarMK.filter((mk) => {
    const kata = cari.trim().toLocaleLowerCase("id-ID");
    const cocokCari = !kata || mk.kode.toLocaleLowerCase("id-ID").includes(kata) || mk.nama.toLocaleLowerCase("id-ID").includes(kata);
    return cocokCari && (filterStatus === "semua" || statusMK(mk.kode) === filterStatus);
  });

  const mkDiedit = daftarMK.find((mk) => mk.kode === editKode) ?? null;
  const totalDraft = Object.values(draft).reduce((total, mentah) => {
    const bobot = Number(mentah);
    return mentah.trim() !== "" && Number.isFinite(bobot) ? total + bobot : total;
  }, 0);

  function bukaEditor(kodeMK: string) {
    setEditKode(kodeMK);
    setDraft(
      Object.fromEntries(Object.entries(pemetaan[kodeMK] ?? {}).map(([kodeIK, bobot]) => [kodeIK, String(bobot)])),
    );
    setGalat("");
  }

  function simpanPemetaan() {
    if (!editKode) return;
    const baru: Record<string, number> = {};
    for (const [kodeIK, mentah] of Object.entries(draft)) {
      if (mentah.trim() === "") continue;
      const bobot = Number(mentah);
      if (!Number.isInteger(bobot) || bobot < 0 || bobot > 100) {
        setGalat("Bobot setiap IK harus bilangan bulat dari 0 sampai 100.");
        return;
      }
      if (bobot > 0 && ikList.some((ik) => ik.kode === kodeIK)) baru[kodeIK] = bobot;
    }
    const berikutnya = { ...pemetaan, [editKode]: baru };
    try {
      window.localStorage.setItem("obe-pemetaan-kurikulum", JSON.stringify(berikutnya));
    } catch {
      setGalat("Pemetaan belum dapat disimpan di browser ini.");
      return;
    }
    setPemetaan(berikutnya);
    const cplTerpetakan = [...new Set(
      ikList
        .filter((ik) => (baru[ik.kode] ?? 0) > 0 && cplList.some((cpl) => cpl.kode === ik.cpl))
        .map((ik) => ik.cpl),
    )];
    mataKuliah
      .filter((mk) => mk.kode === editKode)
      .forEach((mk) => ubahMK(mk.kode, mk.tahun, mk.kelas, { ...mk, cpl: cplTerpetakan }));
    setEditKode(null);
    setGalat("");
  }

  function unduhCSV() {
    const judulIK = daftarKolomIK.map((ik) => {
      const induk = cplList.find((cpl) => cpl.kode === ik.cpl);
      return induk ? `${induk.kode} - ${ik.kode}` : `Tanpa CPL - ${ik.kode}`;
    });
    const header = ["No", "Kode MK", "Nama Mata Kuliah", "SKS", ...judulIK, "Total Bobot (%)"];
    const baris = daftarMK.map((mk, index) => [
      index + 1,
      mk.kode,
      mk.nama,
      mk.sks,
      ...daftarKolomIK.map((ik) => pemetaan[mk.kode]?.[ik.kode] ?? ""),
      totalMK(mk.kode),
    ]);
    const isi = [header, ...baris].map((row) => row.map(kutipCSV).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", isi], { type: "text/csv;charset=utf-8" }));
    const tautan = document.createElement("a");
    tautan.href = url;
    tautan.download = "peta-kurikulum.csv";
    tautan.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Peta kurikulum" desc="Bobot setiap mata kuliah terhadap indikator kinerja (IK), sesuai lembar Peta Kurikulum." action={<Btn variant="outline" onClick={unduhCSV} disabled={daftarMK.length === 0}>Unduh CSV</Btn>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mata kuliah" value={String(daftarMK.length)} numeric={daftarMK.length} sub="Berdasarkan kode mata kuliah" />
        <StatCard label="Pemetaan lengkap" value={String(jumlahLengkap)} numeric={jumlahLengkap} sub="Total bobot IK = 100%" />
        <StatCard label="Perlu dilengkapi" value={String(jumlahDraft)} numeric={jumlahDraft} sub="Sudah ada bobot, total belum 100%" highlight={jumlahDraft > 0} />
        <StatCard label="Belum dipetakan" value={String(jumlahBelum)} numeric={jumlahBelum} sub="Belum memiliki bobot IK" highlight={jumlahBelum > 0} />
      </div>

      {(cplList.length === 0 || ikList.length === 0) ? (
        <div className="rounded-lg border border-warning/30 bg-warning-bg p-4 text-sm text-warning">
          <p className="font-semibold">Siapkan struktur CPL dan IK terlebih dahulu.</p>
          <p className="mt-1">Pemetaan memakai IK sebagai kolom dan menampilkan CPL sebagai kelompok indikator.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cplList.length === 0 ? <Link href="/cpl" className="rounded-lg border border-warning/30 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-warning-bg">Kelola CPL</Link> : null}
            {ikList.length === 0 ? <Link href="/ik" className="rounded-lg border border-warning/30 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-warning-bg">Kelola IK</Link> : null}
          </div>
        </div>
      ) : null}

      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b border-line p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Pemetaan mata kuliah ke IK</h3>
            <p className="mt-1 text-xs text-ink-muted">Atur persentase kontribusi tiap mata kuliah pada IK. CPL ditampilkan sebagai kelompok IK dan mengikuti IK yang diberi bobot.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-muted">Cari mata kuliah</span>
              <input value={cari} onChange={(event) => setCari(event.target.value)} placeholder="Kode atau nama MK" className={`${inputCls} min-w-56`} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-muted">Status pemetaan</span>
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as StatusFilter)} className={inputCls}>
                <option value="semua">Semua mata kuliah</option>
                <option value="belum">Belum dipetakan</option>
                <option value="draft">Perlu dilengkapi</option>
                <option value="lengkap">Lengkap 100%</option>
              </select>
            </label>
          </div>
        </div>

        {daftarMK.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Belum ada mata kuliah" desc="Tambahkan mata kuliah terlebih dahulu. Setiap kode mata kuliah akan muncul satu kali di peta ini." />
            <div className="mt-4 text-center"><Link href="/mata-kuliah" className="text-sm font-semibold text-primary hover:underline">Buka halaman Mata Kuliah</Link></div>
          </div>
        ) : daftarKolomIK.length === 0 ? (
          <div className="p-5"><EmptyState title="Kolom IK belum tersedia" desc="Tambahkan CPL dan IK untuk mulai membuat peta bobot mata kuliah." /></div>
        ) : daftarTampil.length === 0 ? (
          <div className="p-5"><EmptyState title="Tidak ada hasil" desc="Ubah pencarian atau filter status untuk melihat mata kuliah lain." /></div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="min-w-max border-separate border-spacing-0 text-left">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr>
                    <th rowSpan={2} className="sticky left-0 z-30 border-b border-r border-line bg-paper px-3 py-3 text-xs font-semibold text-ink-muted">No</th>
                    <th rowSpan={2} className="sticky left-12 z-30 border-b border-r border-line bg-paper px-3 py-3 text-xs font-semibold text-ink-muted">Kode MK</th>
                    <th rowSpan={2} className="sticky left-[150px] z-30 min-w-56 border-b border-r border-line bg-paper px-3 py-3 text-xs font-semibold text-ink-muted">Mata Kuliah</th>
                    <th rowSpan={2} className="border-b border-r border-line bg-paper px-3 py-3 text-center text-xs font-semibold text-ink-muted">SKS</th>
                    {kelompok.map((grup) => (
                      <th key={grup.kode} colSpan={grup.ik.length} title={grup.nama} className={`border-b border-r border-line px-3 py-2 text-center text-xs font-bold ${grup.kode === "__tanpa_cpl__" ? "bg-warning-bg text-warning" : "bg-primary/[0.05] text-primary"}`}>
                        <span className="block">{grup.kode === "__tanpa_cpl__" ? "CPL belum tersedia" : grup.kode}</span>
                        {grup.kode !== "__tanpa_cpl__" ? <span className="mt-0.5 block max-w-56 truncate text-xs font-normal text-ink-muted">{grup.nama}</span> : null}
                      </th>
                    ))}
                    <th rowSpan={2} className="border-b border-r border-line bg-paper px-3 py-3 text-right text-xs font-semibold text-ink-muted">Total</th>
                    <th rowSpan={2} className="border-b border-r border-line bg-paper px-3 py-3 text-xs font-semibold text-ink-muted">Status</th>
                    <th rowSpan={2} className="border-b border-line bg-paper px-3 py-3 text-xs font-semibold text-ink-muted">Aksi</th>
                  </tr>
                  <tr>
                    {kelompok.flatMap((grup) => grup.ik.map((ik) => (
                      <th key={ik.kode} title={ik.deskripsi} className="border-b border-r border-line bg-paper px-3 py-2 text-center tabular-nums text-xs font-bold text-ink">{ik.kode}</th>
                    )))}
                  </tr>
                </thead>
                <tbody>
                  {daftarTampil.map((mk, index) => {
                    const total = totalMK(mk.kode);
                    const status = statusMK(mk.kode);
                    const badge = status === "lengkap"
                      ? "bg-success-bg text-success"
                      : status === "draft"
                        ? "bg-warning-bg text-warning"
                        : "bg-paper text-ink-muted";
                    return (
                      <tr key={mk.kode} className="group">
                        <td className="sticky left-0 z-10 border-b border-r border-line bg-white px-3 py-3 text-xs text-ink-muted group-hover:bg-paper">{index + 1}</td>
                        <td className="sticky left-12 z-10 border-b border-r border-line bg-white px-3 py-3 tabular-nums text-xs font-bold text-primary group-hover:bg-paper">{mk.kode}</td>
                        <td className="sticky left-[150px] z-10 max-w-64 border-b border-r border-line bg-white px-3 py-3 text-sm text-ink group-hover:bg-paper" title={mk.nama}>{mk.nama}</td>
                        <td className="border-b border-r border-line px-3 py-3 text-center text-sm text-ink">{mk.sks || "—"}</td>
                        {daftarKolomIK.map((ik) => {
                          const bobot = pemetaan[mk.kode]?.[ik.kode];
                          return <td key={ik.kode} className="border-b border-r border-line px-3 py-3 text-center tabular-nums text-xs tabular-nums text-ink">{bobot ? `${formatPersen(bobot)}%` : <span className="text-ink-muted/60">—</span>}</td>;
                        })}
                        <td className="border-b border-r border-line px-3 py-3 text-right tabular-nums text-sm font-bold tabular-nums text-ink">{formatPersen(total)}%</td>
                        <td className="border-b border-r border-line px-3 py-3"><span className={`whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold ${badge}`}>{status === "lengkap" ? "Lengkap" : status === "draft" ? "Perlu dilengkapi" : "Belum dipetakan"}</span></td>
                        <td className="border-b border-line px-3 py-3"><button type="button" onClick={() => bukaEditor(mk.kode)} className="whitespace-nowrap rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/[0.04]">{status === "belum" ? "Atur pemetaan" : "Ubah"}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-1 border-t border-line px-5 py-3 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
              <span>Menampilkan {daftarTampil.length} dari {daftarMK.length} mata kuliah unik.</span>
              <span>Bobot IK per mata kuliah diharapkan berjumlah 100%.</span>
            </div>
          </>
        )}
      </Card>

      {editKode && mkDiedit ? (
        <Modal
          title={`Pemetaan ${mkDiedit.kode}`}
          desc={`${mkDiedit.nama}, ${mkDiedit.sks} SKS. Isi bobot (%) untuk setiap IK yang dibebankan; CPL mata kuliah akan mengikuti kelompok IK berbobot.`}
          onClose={() => { setEditKode(null); setGalat(""); }}
          wide
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-paper p-3">
              <div>
                <p className="text-xs font-medium text-ink-muted">Total bobot saat ini</p>
                <p className={`tabular-nums text-xl font-bold tabular-nums ${Math.abs(totalDraft - 100) < 0.001 ? "text-success" : totalDraft > 100 ? "text-danger" : "text-warning"}`}>{formatPersen(totalDraft)}%</p>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-ink-muted">Total 100% berstatus lengkap. Nilai lain tetap dapat disimpan sebagai draft dan dilengkapi nanti. Kosongkan kolom untuk menghapus bobot IK.</p>
            </div>

            <div className="max-h-[52vh] space-y-4 overflow-y-auto pr-1">
              {kelompok.map((grup) => (
                <section key={grup.kode} className="rounded-lg border border-line p-4">
                  <div className="mb-3 border-b border-line pb-2">
                    <h4 className="text-sm font-bold text-primary">{grup.kode === "__tanpa_cpl__" ? "IK tanpa CPL valid" : grup.kode}</h4>
                    {grup.kode !== "__tanpa_cpl__" ? <p className="mt-0.5 text-xs text-ink-muted">{grup.nama}</p> : null}
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {grup.ik.map((ik) => (
                      <label key={ik.kode} className="flex min-w-0 items-center gap-3 rounded-lg border border-line p-3 transition hover:border-line">
                        <span className="min-w-0 flex-1">
                          <span className="block tabular-nums text-xs font-bold text-ink">{ik.kode}</span>
                          <span className="mt-0.5 block line-clamp-2 text-xs leading-snug text-ink-muted" title={ik.deskripsi}>{ik.deskripsi}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          <input
                            aria-label={`Bobot ${ik.kode}`}
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={draft[ik.kode] ?? ""}
                            onChange={(event) => setDraft((sebelumnya) => ({ ...sebelumnya, [ik.kode]: event.target.value }))}
                            placeholder="0"
                            className="w-[4.5rem] rounded-lg border border-line px-2 py-2 text-right tabular-nums text-sm tabular-nums text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                          />
                          <span className="text-xs text-ink-muted">%</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {galat ? <p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{galat}</p> : null}
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Btn variant="outline" onClick={() => { setEditKode(null); setGalat(""); }}>Batal</Btn>
              <Btn onClick={simpanPemetaan}>Simpan pemetaan</Btn>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
