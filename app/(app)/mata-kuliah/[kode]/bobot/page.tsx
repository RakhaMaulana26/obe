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
      setPesan("Belum bisa disimpan: pastikan setiap total baris w dan total v per CPMK tepat = 1,00.");
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
        title="Porsi nilai"
        desc={`${mk?.kode ?? mkKode}. Porsi tiap asesmen di dalam setiap Sub-CPMK; jumlah per Sub-CPMK harus 100%.`}
        action={<Link href={`/mata-kuliah/${mkKode}`} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper">Halaman mata kuliah</Link>}
      />

      {pesan && <div className={`rounded-lg border p-3 text-sm ${semuaValid || tersimpan ? "border-success/30 bg-success-bg text-success" : "border-warning/30 bg-warning-bg text-warning"}`}>{pesan}</div>}

      <Card>
        <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Langkah A: Porsi asesmen ke capaian kecil</h3>
            <p className="text-xs leading-relaxed text-ink-muted">Tiap baris = satu capaian kecil. Total baris harus = 1,00 (100%), “–” = tidak berkaitan (0)</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={normalisasi} disabled={daftarSub.length === 0} tour="Samakan otomatis total tiap baris menjadi 1,00 secara proporsional." tourTitle="Normalisasi otomatis">Normalisasi otomatis</Btn>
            <Btn variant="outline" onClick={resetKeRPS} disabled={daftarSub.length === 0} tour="Kembalikan seluruh bobot ke nilai bawaan RPS." tourTitle="Reset RPS">Reset RPS</Btn>
            <Btn onClick={simpan} disabled={!semuaValid} tour="Simpan perubahan bobot: capaian dihitung ulang otomatis." tourTitle="Simpan bobot">Simpan bobot</Btn>
          </div>
        </div>
        {daftarSub.length === 0 ? <p className="py-4 text-sm text-ink-muted">Belum ada Sub-CPMK. Tambahkan struktur CPMK terlebih dahulu.</p> : <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-3 text-xs font-semibold text-ink-muted">Sub-CPMK</th>
                {kolom.map((k) => (
                  <th key={k} className="px-1 pb-3 text-center text-xs font-semibold text-ink-muted">{k}</th>
                ))}
                <th className="pb-3 text-right text-xs font-semibold text-ink-muted">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {daftarSub.map((s) => {
                const tot = totalBaris(s.kode);
                const ok = Math.abs(tot - 1) < 0.001;
                return (
                  <tr key={s.kode} className="hover:bg-paper/70">
                    <td className="py-2 pr-2">
                      <span className="font-semibold tabular-nums text-primary">{s.kode}</span>
                    </td>
                    {kolom.map((k) => (
                      <td key={k} className="px-1 py-2">
                        <input
                          type="number" step={0.05} min={0} max={1}
                          value={draft[s.kode]?.[k] ?? 0}
                          onChange={(e) => { setDraft((p) => ({ ...p, [s.kode]: { ...p[s.kode], [k]: Number(e.target.value) } })); setTersimpan(false); }}
                          className={`w-[70px] rounded-md border px-2 py-1.5 text-center tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 ${draft[s.kode]?.[k] ? "border-line text-ink" : "border-line text-ink-muted/60"}`}
                        />
                      </td>
                    ))}
                    <td className="py-2 text-right">
                      <span className={`rounded-md px-2 py-1 tabular-nums text-sm font-bold ${ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>{tot.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
        <p className="mt-3 text-xs text-ink-muted">Atur bobot asesmen sesuai RPS yang berlaku.</p>
      </Card>

      <Card>
        <h3 className="mb-1 text-base font-bold text-primary">Bobot v: Sub-CPMK terhadap CPMK (Pers. 3.2)</h3>
        <p className="mb-4 text-xs text-ink-muted">Total v per CPMK harus = 1,00</p>
        {daftarCPMK.length === 0 ? <p className="py-4 text-sm text-ink-muted">Belum ada CPMK. Tambahkan struktur RPS terlebih dahulu.</p> : <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {daftarCPMK.map((c) => {
            const penyusun = daftarSub.filter((s) => s.cpmk === c.kode);
            const tot = totalV(c.kode);
            const ok = Math.abs(tot - 1) < 0.001;
            return (
              <div key={c.kode} className={`rounded-lg border p-4 ${ok ? "border-line bg-white" : "border-danger/30 bg-danger-bg/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold tabular-nums text-primary">{c.kode}</span>
                  <span className={`rounded-md px-2 py-0.5 tabular-nums text-xs font-bold ${ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>Σ = {tot.toFixed(2)}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {penyusun.map((s) => (
                    <label key={s.kode} className="flex items-center justify-between gap-2 text-sm">
                      <span className="tabular-nums text-xs text-ink">{s.kode}</span>
                      <input
                        type="number" step={0.05} min={0} max={1}
                        value={draftV[s.kode] ?? s.v}
                        onChange={(e) => { setDraftV((p) => ({ ...p, [s.kode]: Number(e.target.value) })); setTersimpan(false); }}
                        className="w-24 rounded-md border border-line px-2 py-1.5 text-center tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </label>
                  ))}
                  {penyusun.length === 0 && <p className="text-xs text-ink-muted">Belum ada Sub-CPMK pada {c.kode}.</p>}
                </div>
              </div>
            );
          })}
        </div>}
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="outline" onClick={normalisasi} disabled={daftarSub.length === 0} tour="Samakan otomatis total tiap baris menjadi 1,00 secara proporsional." tourTitle="Normalisasi otomatis">Normalisasi otomatis</Btn>
          <Btn onClick={simpan} disabled={!semuaValid} tour="Simpan perubahan bobot: capaian dihitung ulang otomatis." tourTitle="Simpan bobot">Simpan bobot</Btn>
        </div>
        {!tersimpan && <p className="mt-2 text-right text-xs text-warning">Ada perubahan belum disimpan.</p>}
        <p className="mt-2 text-xs text-ink-muted">Atur bobot Sub-CPMK terhadap CPMK sesuai RPS yang berlaku.</p>
      </Card>
    </div>
  );
}
