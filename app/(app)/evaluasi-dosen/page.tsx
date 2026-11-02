"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp, type MataKuliahItem } from "@/app/lib/store";
import { AMBANG_DEFAULT, type CPMK, type SubCPMK } from "@/app/lib/data";
import { hitungSemua, rataRata, round2, titikTerlemah } from "@/app/lib/hitung";
import { Bar, Card, EmptyState, PageHeading, StatCard, inputCls } from "@/app/components/ui";
import FadeContent from "@/app/components/reactbits/FadeContent";
import SpotlightCard from "@/app/components/reactbits/SpotlightCard";
import AnimatedList, { AnimatedItem } from "@/app/components/reactbits/AnimatedList";
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
    status === "Baik"
      ? "bg-green-100 text-green-800"
      : status === "Cukup"
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-700";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${gaya}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "Baik" ? "bg-green-600" : status === "Cukup" ? "bg-amber-500" : "bg-red-600"}`}
      />
      {status}
    </span>
  );
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
        const semua = hitungSemua(nilaiUntuk(mk.kode, mk.tahun, mk.kelas), { w: struktur.bobotW }, struktur.sub, struktur.cpmk);
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
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .slice(0, 2)
        .map(([k]) => k)
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
          `Kelemahan mengampu pada ${lemahCpmk.kode} ` +
          `— terendah pada ${lemahSub.kode}${infoSub ? ` (${infoSub.deskripsi})` : ""} ` +
          `(rata-rata ${lemahSub.nilai.toFixed(2)}). ` +
          `${diBawahT > 0 ? `${diBawahT} dari ${penawaran.length} penawaran di bawah T. ` : "Tidak ada penawaran di bawah T, pertahankan. "}` +
          `${asesmenTop ? `Perkuat asesmen penopang: ${asesmenTop}.` : ""}`,
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
        title="Evaluasi Dosen"
        action={
          <span className="inline-flex items-center gap-2 text-sm text-gray-600">
            Batas T =
            <input
              type="number"
              min={0}
              max={100}
              value={ambang}
              onChange={(e) => setAmbang(Number(e.target.value))}
              className={`${inputCls} !w-20 !py-1.5`}
              aria-label="Batas lulus"
              data-tour="Atur batas lulus (T) — status Baik / Cukup / Perlu Pembinaan mengikuti nilai ini."
              data-tour-title="Batas lulus (T)"
            />
          </span>
        }
      />

      <FadeContent>
        <Card className="!p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="filter-tahun-dosen" className="mb-1.5 block text-sm font-medium text-gray-700">
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
            <p className="pb-2 text-xs leading-relaxed text-gray-500">
              Menilai dosen dari capaian kelas yang diampunya (rata-rata CPMK + ketuntasan mahasiswa),
              bukan dari nilai per mahasiswa.
            </p>
          </div>
        </Card>
      </FadeContent>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Dosen dievaluasi" value={String(evaluasi.daftar.length)} numeric={evaluasi.daftar.length} sub={tahunFilter ? `Tahun ${tahunFilter}` : "Seluruh tahun ajaran"} />
        <StatCard label="Rata-rata capaian (baseline)" value={evaluasi.baseline.toFixed(2)} numeric={evaluasi.baseline} decimals={2} sub="Rata-rata seluruh penawaran" />
        <StatCard label="Perlu pembinaan" value={String(butuhBina)} numeric={butuhBina} sub="Rata-rata di bawah T − 10" highlight={butuhBina > 0} />
      </div>

      {evaluasi.daftar.length === 0 ? (
        <EmptyState
          title="Belum ada dosen untuk dievaluasi"
          desc="Isi dosen pengampu tiap penawaran MK + tahun pada halaman Mata Kuliah."
        />
      ) : (
        <AnimatedList className="space-y-4" step={0.07}>
          {evaluasi.daftar.map((d) => (
            <AnimatedItem key={d.nama}>
              <SpotlightCard className="p-6" spotlightColor={d.status === "Baik" ? "rgba(16,185,129,0.10)" : d.status === "Cukup" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.10)"}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-bold text-primary">{d.nama}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                      {d.penawaran.map((p) => `${p.mk.kode} ${p.mk.tahun}`).join(" • ")}
                    </p>
                  </div>
                  <StatusPill status={d.status} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[13px] font-medium text-gray-500">Rata-rata CPMK</p>
                    <p className="mt-1 text-2xl font-bold text-primary">{d.rataCpmk.toFixed(2)}</p>
                    <div className="mt-2"><Bar value={d.rataCpmk} tone={d.rataCpmk < ambang ? "red" : "primary"} /></div>
                    <p className={`mt-1 font-mono text-[11px] ${d.selisih >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {d.selisih >= 0 ? "+" : ""}{d.selisih.toFixed(2)} vs rata-rata keseluruhan
                    </p>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-500">Mahasiswa tuntas</p>
                    <p className="mt-1 text-2xl font-bold text-primary">{d.tuntasPct.toFixed(1)}%</p>
                    <p className="mt-2 text-xs text-gray-500">{d.tuntas} dari {d.total} mahasiswa di {d.penawaran.length} penawaran</p>
                  </div>
                  <div className="rounded-xl bg-red-50/70 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-500">Kelemahan mengampu</p>
                    <p className="mt-1 font-mono text-sm font-bold text-red-700">{d.lemahCpmk.kode} • {d.lemahCpmk.nilai.toFixed(2)}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{d.saran}</p>
                  </div>
                </div>

                <Accordion title={`Rincian ${d.penawaran.length} penawaran`} desc="Rata-rata CPMK + ketuntasan per MK+tahun" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Penawaran</th>
                          <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Rata CPMK</th>
                          <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Tuntas</th>
                          <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {d.penawaran.map((p) => {
                          const rata = rerata(Object.values(p.rataCpmk));
                          return (
                            <tr key={`${p.mk.kode}::${p.mk.tahun}`}>
                              <td className="py-2 pr-2">
                                <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-white">{p.mk.kode}</span>
                                <span className="ml-1.5 font-mono text-xs text-gray-500">{p.mk.tahun}{p.mk.kelas ? ` • ${p.mk.kelas}` : ""}</span>
                              </td>
                              <td className={`py-2 text-right font-mono font-semibold ${rata < ambang ? "text-red-600" : "text-gray-800"}`}>{rata.toFixed(2)}</td>
                              <td className="py-2 text-right font-mono text-[13px] text-gray-600">{p.tuntas}/{p.total}</td>
                              <td className="py-2 text-right">
                                <Link href={`/mata-kuliah/${p.mk.kode}/capaian`} className="text-xs font-semibold text-primary hover:underline">
                                  Capaian →
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Accordion>
              </SpotlightCard>
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      <FadeContent>
        <Card className="!p-5">
          <h3 className="text-sm font-bold text-primary">Cara membaca status</h3>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-gray-600">
            <li><strong className="text-green-700">Baik</strong> — rata-rata CPMK ≥ T dan ≥ 75% mahasiswa tuntas di seluruh penawarannya.</li>
            <li><strong className="text-amber-700">Cukup</strong> — rata-rata masih dalam 10 poin di bawah T; pantau titik lemahnya.</li>
            <li><strong className="text-red-700">Perlu Pembinaan</strong> — rata-rata lebih dari 10 poin di bawah T; tindak lanjuti via saran perbaikan.</li>
          </ul>
          {tanpaDosen > 0 ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
              {tanpaDosen} penawaran belum punya dosen pengampu dan tidak ikut dinilai — lengkapi di halaman{" "}
              <Link href="/mata-kuliah" className="font-semibold underline">Mata Kuliah</Link>.
            </p>
          ) : null}
        </Card>
      </FadeContent>
    </div>
  );
}
