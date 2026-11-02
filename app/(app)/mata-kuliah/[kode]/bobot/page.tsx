"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/app/lib/store";
import { buatStrukturDummy } from "@/app/lib/data";
import type { AsesmenKode } from "@/app/lib/data";
import { Btn, Card, PageHeading } from "@/app/components/ui";

type DraftW = Record<string, Record<string, number>>;

export default function BobotPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params);
  const mkKode = decodeURIComponent(kode).toUpperCase();
  const { mataKuliah, strukturUntuk, simpanStruktur, daftarAsesmen } = useApp();
  const mk = mataKuliah.find((m) => m.kode === mkKode);
  const struktur = strukturUntuk(mkKode);
  const daftarSub = struktur.sub;
  const daftarCPMK = struktur.cpmk;
  const bobotW = struktur.bobotW;

  const kolom = useMemo(() => daftarAsesmen.map((a) => a.kode), [daftarAsesmen]);

  function bangunDraftW(
    subs: typeof daftarSub,
    kols: string[],
    sumber: typeof bobotW,
  ): DraftW {
    const d: DraftW = {};
    for (const s of subs) {
      d[s.kode] = {};
      for (const k of kols) d[s.kode][k] = (sumber[s.kode] as Record<string, number> | undefined)?.[k] ?? 0;
    }
    return d;
  }

  // Salinan kerja; diinisialisasi dari store saat halaman dibuka.
  const [draft, setDraft] = useState<DraftW>(() => bangunDraftW(daftarSub, kolom, bobotW));
  const [draftV, setDraftV] = useState<Record<string, number>>(() => Object.fromEntries(daftarSub.map((s) => [s.kode, s.v])));
  const [tersimpan, setTersimpan] = useState(true);
  const [pesan, setPesan] = useState("");

  function resetKeRPS() {
    const acuan = buatStrukturDummy(mk ?? { kode: mkKode, nama: mkKode, cpl: [] });
    setDraft(bangunDraftW(daftarSub, kolom, acuan.bobotW));
    setDraftV(Object.fromEntries(daftarSub.map((s) => [s.kode, acuan.sub.find((item) => item.kode === s.kode)?.v ?? s.v])));
    simpanStruktur(mkKode, {
      ...struktur,
      bobotW: acuan.bobotW,
      sub: daftarSub.map((s) => ({ ...s, v: acuan.sub.find((item) => item.kode === s.kode)?.v ?? s.v })),
    });
    setTersimpan(true);
    setPesan(`Bobot untuk ${mk?.nama ?? mkKode} dikosongkan.`);
  }

  function totalBaris(kodeSub: string): number {
    return kolom.reduce((a, k) => a + (draft[kodeSub]?.[k] ?? 0), 0);
  }

  function totalV(kodeCpmk: string): number {
    return daftarSub.filter((s) => s.cpmk === kodeCpmk).reduce((a, s) => a + (draftV[s.kode] ?? 0), 0);
  }

  const semuaValid =
    daftarSub.length > 0 && daftarCPMK.length > 0 &&
    daftarSub.every((s) => Math.abs(totalBaris(s.kode) - 1) < 0.001) &&
    daftarCPMK.every((c) => Math.abs(totalV(c.kode) - 1) < 0.001);

  function normalisasi() {
    const d: DraftW = {};
    for (const s of daftarSub) {
      const sum = kolom.reduce((a, k) => a + (draft[s.kode]?.[k] ?? 0), 0);
      d[s.kode] = {};
      for (const k of kolom) d[s.kode][k] = sum > 0 ? Math.round(((draft[s.kode]?.[k] ?? 0) / sum) * 100) / 100 : 0;
    }
    setDraft(d);
    const v: Record<string, number> = {};
    for (const c of daftarCPMK) {
      const penyusun = daftarSub.filter((s) => s.cpmk === c.kode);
      const sum = penyusun.reduce((a, s) => a + (draftV[s.kode] ?? 0), 0);
      for (const s of penyusun) v[s.kode] = sum > 0 ? Math.round(((draftV[s.kode] ?? 0) / sum) * 100) / 100 : 0;
    }
    setDraftV((p) => ({ ...p, ...v }));
    setTersimpan(false);
    setPesan("Bobot dinormalisasi (total per baris = 1). Klik Simpan untuk menerapkan.");
  }

  function simpan() {
    if (!semuaValid) {
      setPesan("Belum bisa disimpan — pastikan setiap total baris w dan total v per CPMK tepat = 1,00.");
      return;
    }
    const bersih: Record<string, Partial<Record<AsesmenKode, number>>> = {};
    for (const s of daftarSub) {
      bersih[s.kode] = {};
      for (const k of kolom) {
        const v = draft[s.kode]?.[k] ?? 0;
        if (v > 0) (bersih[s.kode] as Record<string, number>)[k] = v;
      }
    }
    simpanStruktur(mkKode, {
      ...struktur,
      bobotW: bersih,
      sub: daftarSub.map((s) => ({ ...s, v: draftV[s.kode] ?? s.v })),
    });
    setTersimpan(true);
    setPesan("Bobot tersimpan dan langsung dipakai dashboard serta detail capaian.");
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={`Porsi Nilai — ${mk?.kode ?? mkKode}`}
        action={<Link href={`/mata-kuliah/${mkKode}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">← Hub MK</Link>}
      />

      {pesan && <div className={`rounded-lg border p-3 text-sm ${semuaValid || tersimpan ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{pesan}</div>}

      <Card>
        <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Langkah A — Porsi asesmen ke capaian kecil</h3>
            <p className="text-xs leading-relaxed text-gray-500">Tiap baris = satu capaian kecil. Total baris harus = 1,00 (100%) • “–” = tidak berkaitan (0)</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={normalisasi} disabled={daftarSub.length === 0} tour="Samakan otomatis total tiap baris menjadi 1,00 secara proporsional." tourTitle="Normalisasi otomatis">Normalisasi otomatis</Btn>
            <Btn variant="outline" onClick={resetKeRPS} disabled={daftarSub.length === 0} tour="Kembalikan seluruh bobot ke nilai bawaan RPS." tourTitle="Reset RPS">Reset RPS</Btn>
            <Btn onClick={simpan} disabled={!semuaValid} tour="Simpan perubahan bobot — capaian dihitung ulang otomatis." tourTitle="Simpan bobot">Simpan bobot</Btn>
          </div>
        </div>
        {daftarSub.length === 0 ? <p className="py-4 text-sm text-gray-500">Belum ada Sub-CPMK. Tambahkan struktur CPMK terlebih dahulu.</p> : <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Sub-CPMK</th>
                {kolom.map((k) => (
                  <th key={k} className="px-1 pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">{k}</th>
                ))}
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {daftarSub.map((s) => {
                const tot = totalBaris(s.kode);
                const ok = Math.abs(tot - 1) < 0.001;
                return (
                  <tr key={s.kode} className="hover:bg-gray-50/70">
                    <td className="py-2 pr-2">
                      <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-white">{s.kode}</span>
                    </td>
                    {kolom.map((k) => (
                      <td key={k} className="px-1 py-2">
                        <input
                          type="number" step={0.05} min={0} max={1}
                          value={draft[s.kode]?.[k] ?? 0}
                          onChange={(e) => { setDraft((p) => ({ ...p, [s.kode]: { ...p[s.kode], [k]: Number(e.target.value) } })); setTersimpan(false); }}
                          className={`w-[70px] rounded-md border px-2 py-1.5 text-center font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25 ${draft[s.kode]?.[k] ? "border-gray-300 text-gray-900" : "border-gray-200 text-gray-300"}`}
                        />
                      </td>
                    ))}
                    <td className="py-2 text-right">
                      <span className={`rounded-md px-2 py-1 font-mono text-[13px] font-bold ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>{tot.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
        <p className="mt-3 text-xs text-gray-400">Atur bobot asesmen sesuai RPS yang berlaku.</p>
      </Card>

      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Bobot v — Sub-CPMK terhadap CPMK (Pers. 3.2)</h3>
        <p className="mb-4 text-xs text-gray-500">Total v per CPMK harus = 1,00</p>
        {daftarCPMK.length === 0 ? <p className="py-4 text-sm text-gray-500">Belum ada CPMK. Tambahkan struktur RPS terlebih dahulu.</p> : <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {daftarCPMK.map((c) => {
            const penyusun = daftarSub.filter((s) => s.cpmk === c.kode);
            const tot = totalV(c.kode);
            const ok = Math.abs(tot - 1) < 0.001;
            return (
              <div key={c.kode} className={`rounded-xl border p-4 ${ok ? "border-gray-200 bg-white" : "border-red-200 bg-red-50/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-white">{c.kode}</span>
                  <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>Σ = {tot.toFixed(2)}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {penyusun.map((s) => (
                    <label key={s.kode} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-mono text-xs text-gray-600">{s.kode}</span>
                      <input
                        type="number" step={0.05} min={0} max={1}
                        value={draftV[s.kode] ?? s.v}
                        onChange={(e) => { setDraftV((p) => ({ ...p, [s.kode]: Number(e.target.value) })); setTersimpan(false); }}
                        className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-center font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </label>
                  ))}
                  {penyusun.length === 0 && <p className="text-xs text-gray-400">Belum ada Sub-CPMK pada {c.kode}.</p>}
                </div>
              </div>
            );
          })}
        </div>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="outline" onClick={normalisasi} disabled={daftarSub.length === 0} tour="Samakan otomatis total tiap baris menjadi 1,00 secara proporsional." tourTitle="Normalisasi otomatis">Normalisasi otomatis</Btn>
          <Btn onClick={simpan} disabled={!semuaValid} tour="Simpan perubahan bobot — capaian dihitung ulang otomatis." tourTitle="Simpan bobot">Simpan bobot</Btn>
        </div>
        {!tersimpan && <p className="mt-2 text-right text-xs text-amber-600">Ada perubahan belum disimpan.</p>}
        <p className="mt-2 text-xs text-gray-400">Atur bobot Sub-CPMK terhadap CPMK sesuai RPS yang berlaku.</p>
      </Card>
    </div>
  );
}
