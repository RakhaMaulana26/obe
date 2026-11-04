"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp, type MataKuliahItem } from "@/app/lib/store";
import { AMBANG_DEFAULT, DAFTAR_ASESMEN, type CPMK, type SubCPMK } from "@/app/lib/data";
import { hitungSemua, rataRata, round2, titikTerlemah } from "@/app/lib/hitung";
import { Bar, Card, EmptyState, PageHeading, StatCard, inputCls } from "@/app/components/ui";
import Accordion from "@/app/components/reactbits/Accordion";

type StatusDosen = "Baik" | "Cukup" | "Perlu Pembinaan";

interface PenawaranStat {
  mk: MataKuliahItem;
  rataCpmk: Record<string, number>;
  rataSub: Record<string, number>;
  cpmk: CPMK[];
  sub: SubCPMK[];
  bobotW: Record<string, Partial<Record<string, number>>>;
  tuntas: number;
  total: number;
}

interface EvalDosen {
  nama: string;
  penawaran: PenawaranStat[];
  perCpmk: Record<string, number>;
  perSub: Record<string, number>;
  rataCpmk: number;
  tuntas: number;
  total: number;
  tuntasPct: number;
  lemahCpmk: { kode: string; nilai: number };
  lemahSub: { kode: string; nilai: number };
  diBawahT: number;
  saran: string;
  selisih: number;
  status: StatusDosen;
}

function rerata(arr: number[]): number {
  if (arr.length === 0) return 0;
  return round2(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function StatusPill({ status }: { status: StatusDosen }) {
  const gaya =
    status === "Baik" ? "border-success/40 text-success" : status === "Cukup" ? "border-warning/40 text-warning" : "border-danger/40 text-danger";
  return <span className={`inline-flex items-center rounded border px-2 py-0.5 text-sm font-semibold ${gaya}`}>{status}</span>;
}

export default function EvaluasiDosenPage() {
  const { mataKuliah, nilaiUntuk, strukturUntuk } = useApp();
  const [tahunFilter, setTahunFilter] = useState("");
  const [ambang, setAmbang] = useState<number>(AMBANG_DEFAULT);

  const daftarTahun = useMemo(
    () => [...new Set(mataKuliah.map((m) => m.tahun))].sort().reverse(),
    [mataKuliah],
  );

  const evaluasi = useMemo(() => {
    const cocok = mataKuliah.filter(
      (m) => (!tahunFilter || m.tahun === tahunFilter) && m.dosen.trim() !== "",
    );
    const perDosen = new Map<string, MataKuliahItem[]>();
    for (const m of cocok) {
      const nama = m.dosen.trim();
      if (!perDosen.has(nama)) perDosen.set(nama, []);
      perDosen.get(nama)?.push(m);
    }

    const daftar: EvalDosen[] = [];
    for (const [nama, daftarMk] of perDosen) {
      const penawaran: PenawaranStat[] = daftarMk.map((mk) => {
        const struktur = strukturUntuk(mk.kode);
        const semua = hitungSemua(nilaiUntuk(mk.kode, mk.tahun, mk.kelas), { w: struktur.bobotW, rubrik: struktur.rubrik }, struktur.sub, struktur.cpmk);
        const arr = Object.values(semua);
        const tuntas = arr.filter((c) => Object.values(c.cpmk).every((v) => v >= ambang)).length;
        return { mk, rataCpmk: rataRata(semua, "cpmk"), rataSub: rataRata(semua, "sub"), cpmk: struktur.cpmk, sub: struktur.sub, bobotW: struktur.bobotW, tuntas, total: arr.length };
      });

      const perCpmk: Record<string, number> = {};
      const perSub: Record<string, number> = {};
      for (const p of penawaran) {
        for (const c of p.cpmk) perCpmk[`${p.mk.kode}::${c.kode}`] = rerata(penawaran.filter((x) => x.mk.kode === p.mk.kode).map((x) => x.rataCpmk[c.kode] ?? 0));
        for (const s of p.sub) perSub[`${p.mk.kode}::${s.kode}`] = rerata(penawaran.filter((x) => x.mk.kode === p.mk.kode).map((x) => x.rataSub[s.kode] ?? 0));
      }

      const lemahCpmkKey = titikTerlemah(perCpmk);
      const [mkLemah, kodeCpmkLemah] = lemahCpmkKey.kode.split("::");
      const penawaranLemah = penawaran.find((p) => p.mk.kode === mkLemah);
      const lemahCpmk = { kode: `${mkLemah} ${kodeCpmkLemah}`, nilai: lemahCpmkKey.nilai };
      const anakSub = (penawaranLemah?.sub ?? []).filter((s) => s.cpmk === kodeCpmkLemah);
      const petaAnak: Record<string, number> = {};
      for (const s of anakSub) petaAnak[s.kode] = perSub[`${mkLemah}::${s.kode}`] ?? 0;
      const lemahSubRaw = anakSub.length > 0 ? titikTerlemah(petaAnak) : { kode: "", nilai: 0 };
      const lemahSub = { kode: lemahSubRaw.kode ? `${mkLemah} ${lemahSubRaw.kode}` : "—", nilai: lemahSubRaw.nilai };
      const infoSub = anakSub.find((s) => s.kode === lemahSubRaw.kode);
      const asesmenTop = Object.entries(penawaranLemah?.bobotW[lemahSubRaw.kode] ?? {})
        .filter(([, w]) => (w ?? 0) > 0)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .slice(0, 2)
        .map(([k]) => DAFTAR_ASESMEN.find((x) => x.kode === k)?.nama ?? k)
        .join(", ");
      const diBawahT = penawaran.filter((p) => p.mk.kode === mkLemah && (p.rataCpmk[kodeCpmkLemah] ?? 0) < ambang).length;

      const tuntas = penawaran.reduce((a, p) => a + p.tuntas, 0);
      const total = penawaran.reduce((a, p) => a + p.total, 0);
      const rataCpmk = rerata(Object.values(perCpmk));
      const tuntasPct = total ? round2((tuntas / total) * 100) : 0;
      const status: StatusDosen =
        rataCpmk >= ambang && tuntasPct >= 75 ? "Baik" : rataCpmk >= ambang - 10 ? "Cukup" : "Perlu Pembinaan";

      daftar.push({
        nama,
        penawaran,
        perCpmk,
        perSub,
        rataCpmk,
        tuntas,
        total,
        tuntasPct,
        lemahCpmk,
        lemahSub,
        diBawahT,
        saran:
          `Sub-CPMK terendah ${lemahSub.kode}${infoSub ? ` (${infoSub.deskripsi})` : ""}, ` +
          `rata-rata ${lemahSub.nilai.toFixed(2)}. ` +
          `${diBawahT > 0 ? `${diBawahT} dari ${penawaran.length} kelas berada di bawah batas lulus. ` : "Semua kelas di atas batas lulus. "}` +
          `${asesmenTop ? `Perkuat ${asesmenTop}.` : ""}`,
        selisih: 0,
        status,
      });
    }

    // Baseline keseluruhan + selisih per dosen.
    const semuaRata = daftar.flatMap((d) => d.penawaran.flatMap((p) => Object.values(p.rataCpmk)));
    const baseline = rerata(semuaRata);
    for (const d of daftar) d.selisih = round2(d.rataCpmk - baseline);
    daftar.sort((a, b) => b.rataCpmk - a.rataCpmk);
    return { daftar, baseline };
  }, [mataKuliah, tahunFilter, nilaiUntuk, strukturUntuk, ambang]);

  const butuhBina = evaluasi.daftar.filter((d) => d.status === "Perlu Pembinaan").length;
  const tanpaDosen = mataKuliah.filter(
    (m) => (!tahunFilter || m.tahun === tahunFilter) && m.dosen.trim() === "",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Evaluasi dosen"
        desc="Dosen dinilai dari capaian kelas yang diampunya: rata-rata CPMK dan persentase mahasiswa tuntas."
        action={
          <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
            Batas lulus
            <input
              type="number"
              min={0}
              max={100}
              value={ambang}
              onChange={(e) => setAmbang(Number(e.target.value))}
              className={`${inputCls} !w-20 tabular-nums`}
              data-tour="Atur batas lulus: status Baik, Cukup, atau Perlu pembinaan mengikuti nilai ini."
              data-tour-title="Batas lulus"
            />
          </label>
        }
      />

      <div>
        <Card className="!p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="filter-tahun-dosen" className="mb-1.5 block text-sm font-medium text-ink">
                Tahun ajaran
              </label>
              <select
                id="filter-tahun-dosen"
                value={tahunFilter}
                onChange={(e) => setTahunFilter(e.target.value)}
                className={inputCls}
                data-tour="Saring evaluasi dosen per tahun ajaran, atau tampilkan semua tahun."
                data-tour-title="Tahun ajaran"
              >
                <option value="">Semua tahun</option>
                {daftarTahun.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Dosen dievaluasi" value={String(evaluasi.daftar.length)} numeric={evaluasi.daftar.length} sub={tahunFilter ? `Tahun ${tahunFilter}` : "Seluruh tahun ajaran"} />
        <StatCard label="Rata-rata seluruh kelas" value={evaluasi.baseline.toFixed(2)} numeric={evaluasi.baseline} decimals={2} sub="Rata-rata seluruh penawaran" />
        <StatCard label="Perlu pembinaan" value={String(butuhBina)} numeric={butuhBina} sub={`Rata-rata di bawah ${ambang - 10}`} highlight={butuhBina > 0} />
      </div>

      {evaluasi.daftar.length === 0 ? (
        <EmptyState
          title="Belum ada dosen untuk dievaluasi"
          desc="Isi dosen pengampu tiap penawaran di halaman Daftar mata kuliah."
        />
      ) : (
        <div className="space-y-4">
          {evaluasi.daftar.map((d) => (
            <div key={d.nama}>
              <div className="rounded-lg border border-line bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">{d.nama}</h2>
                    <p className="mt-0.5 tabular-nums text-xs text-ink-muted">
                      {d.penawaran.map((p) => `${p.mk.kode} ${p.mk.tahun}`).join(", ")}
                    </p>
                  </div>
                  <StatusPill status={d.status} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-ink-muted">Rata-rata CPMK</p>
                    <p className="mt-1 text-2xl font-bold text-primary">{d.rataCpmk.toFixed(2)}</p>
                    <div className="mt-2"><Bar value={d.rataCpmk} tone={d.rataCpmk < ambang ? "red" : "primary"} /></div>
                    <p className={`mt-1 tabular-nums text-xs ${d.selisih >= 0 ? "text-success" : "text-danger"}`}>
                      {d.selisih >= 0 ? "+" : ""}{d.selisih.toFixed(2)} vs rata-rata keseluruhan
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-muted">Mahasiswa tuntas</p>
                    <p className="mt-1 text-2xl font-bold text-primary">{d.tuntasPct.toFixed(1)}%</p>
                    <p className="mt-2 text-xs text-ink-muted">{d.tuntas} dari {d.total} mahasiswa di {d.penawaran.length} penawaran</p>
                  </div>
                  <div className="border-l-[3px] border-danger pl-4">
                    <p className="text-sm font-medium text-ink-muted">CPMK terendah</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-danger">{d.lemahCpmk.kode} <span className="text-ink">{d.lemahCpmk.nilai.toFixed(2)}</span></p>
                    <p className="mt-1 text-sm leading-relaxed text-ink">{d.saran}</p>
                  </div>
                </div>

                <Accordion title={`Rincian ${d.penawaran.length} penawaran`} desc="Rata-rata CPMK dan ketuntasan per kelas" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-line">
                          <th className="pb-2 text-xs font-semibold text-ink-muted">Penawaran</th>
                          <th className="pb-2 text-right text-xs font-semibold text-ink-muted">Rata CPMK</th>
                          <th className="pb-2 text-right text-xs font-semibold text-ink-muted">Tuntas</th>
                          <th className="pb-2 text-right text-xs font-semibold text-ink-muted">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {d.penawaran.map((p) => {
                          const rata = rerata(Object.values(p.rataCpmk));
                          return (
                            <tr key={`${p.mk.kode}::${p.mk.tahun}`}>
                              <td className="py-2 pr-2">
                                <span className="font-semibold tabular-nums text-primary">{p.mk.kode}</span>
                                <span className="ml-1.5 tabular-nums text-xs text-ink-muted">{p.mk.tahun}{p.mk.kelas ? `, ${p.mk.kelas}` : ""}</span>
                              </td>
                              <td className={`py-2 text-right tabular-nums font-semibold ${rata < ambang ? "text-danger" : "text-ink"}`}>{rata.toFixed(2)}</td>
                              <td className="py-2 text-right tabular-nums text-sm text-ink">{p.tuntas}/{p.total}</td>
                              <td className="py-2 text-right">
                                <Link href={`/mata-kuliah/${p.mk.kode}/capaian`} className="text-xs font-semibold text-primary hover:underline">
                                  Capaian
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <Card>
          <h2 className="font-semibold text-primary">Cara membaca status</h2>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink">
            <li><strong className="text-success">Baik</strong>: rata-rata CPMK minimal sama dengan batas lulus dan sedikitnya 75% mahasiswa tuntas di seluruh penawarannya.</li>
            <li><strong className="text-warning">Cukup</strong>: rata-rata paling jauh 10 poin di bawah batas lulus. Pantau CPMK terendahnya.</li>
            <li><strong className="text-danger">Perlu pembinaan</strong>: rata-rata lebih dari 10 poin di bawah batas lulus. Tindak lanjuti dengan saran perbaikan.</li>
          </ul>
          {tanpaDosen > 0 ? (
            <p className="mt-3 rounded-lg bg-warning-bg px-3 py-2 text-sm text-warning">
              {tanpaDosen} penawaran belum punya dosen pengampu dan tidak ikut dinilai: lengkapi di halaman{" "}
              <Link href="/mata-kuliah" className="font-semibold underline">Mata Kuliah</Link>.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
