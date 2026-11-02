"use client";

import { useState } from "react";
import { DAFTAR_CPL, DAFTAR_IK, type IK } from "@/app/lib/data";
import { bacaDataTersimpan } from "@/app/lib/store";
import { Btn, Card, EmptyState, Field, Modal, PageHeading, StatCard, Td, Th, inputCls } from "@/app/components/ui";
import FadeContent from "@/app/components/reactbits/FadeContent";

function bacaLS<T>(kunci: string, fallback: T): T {
  return bacaDataTersimpan(kunci, fallback);
}

export default function IKPage() {
  const [ikList, setIkList] = useState<IK[]>(() => bacaLS("obe-ik", DAFTAR_IK));
  const [cplList] = useState(() => bacaLS("obe-cpl", DAFTAR_CPL));
  const [modal, setModal] = useState<null | { mode: "tambah" } | { mode: "ubah"; kode: string }>(null);
  const [form, setForm] = useState<IK>({ kode: "", deskripsi: "", cpl: "CPL1", z: 1 });
  const [hapus, setHapus] = useState<string | null>(null);
  const [galat, setGalat] = useState("");

  function tulisIk(daftar: IK[]) {
    setIkList(daftar);
    try {
      window.localStorage.setItem("obe-ik", JSON.stringify(daftar));
    } catch {
      /* abaikan */
    }
  }

  function totalZ(kodeCpl: string): number {
    return ikList.filter((i) => i.cpl === kodeCpl).reduce((a, i) => a + i.z, 0);
  }

  const zValid = cplList.every((c) => {
    const anak = ikList.filter((i) => i.cpl === c.kode);
    if (anak.length === 0) return true;
    return Math.abs(totalZ(c.kode) - 1) < 0.001;
  });
  function simpan() {
    const kode = form.kode.trim().toUpperCase();
    if (!kode || !form.deskripsi.trim()) return setGalat("Kode dan deskripsi IK wajib diisi.");
    if (form.z < 0 || form.z > 1) return setGalat("Bobot z harus 0–1.");
    if (modal?.mode === "tambah" && ikList.some((i) => i.kode === kode)) return setGalat("Kode IK sudah ada.");
    if (modal?.mode === "tambah") {
      tulisIk([...ikList, { ...form, kode }]);
    } else if (modal?.mode === "ubah") tulisIk(ikList.map((i) => (i.kode === modal.kode ? { ...form, kode: modal.kode } : i)));
    setModal(null);
    setGalat("");
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Kemampuan Spesifik (IK)"
        action={<Btn disabled={cplList.length === 0} onClick={() => { setForm({ kode: "", deskripsi: "", cpl: cplList[0]?.kode ?? "", z: 1 }); setGalat(""); setModal({ mode: "tambah" }); }} tour="Tambah kemampuan spesifik (IK) baru: pilih CPL induk dan porsinya." tourTitle="Tambah IK">+ Tambah IK</Btn>}
      />

      {galat && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{galat}</div>}
      {!zValid && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-800">Total porsi IK pada setiap CPL harus = 1,00 (100%).</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total IK" value={String(ikList.length)} numeric={ikList.length} sub="Kemampuan spesifik terdaftar" />
        <StatCard label="Porsi (z) valid" value={cplList.length === 0 ? "—" : zValid ? "Ya" : "Belum"} sub="Total per CPL = 1,00" highlight={!zValid} />
      </div>

      <FadeContent>
      <Card>
        <p className="mb-3 text-xs leading-relaxed text-gray-500">Atur porsi kontribusi setiap IK terhadap CPL induknya.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-gray-200"><Th>Kode</Th><Th>Deskripsi</Th><Th>CPL induk</Th><Th className="text-right">Porsi ke CPL</Th><Th>Aksi</Th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {ikList.map((ik) => (
                <tr key={ik.kode} className="hover:bg-gray-50/70">
                  <Td>
                    <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-white">{ik.kode}</span>
                    {ik.isDummy ? <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">dummy</span> : null}
                  </Td>
                  <Td className="max-w-md text-[13px] text-gray-700">{ik.deskripsi}</Td>
                  <Td><span className="font-mono text-xs text-gray-600">{ik.cpl}</span></Td>
                  <Td className="text-right font-mono text-[13px] font-semibold text-gray-800"><span title={`Berkontribusi ${Math.round(ik.z * 100)}% ke ${ik.cpl}`}>{ik.z.toFixed(2)} <span className="font-normal text-gray-400">({Math.round(ik.z * 100)}%)</span></span></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ ...ik }); setGalat(""); setModal({ mode: "ubah", kode: ik.kode }); }} data-tour="Ubah data pada baris ini." data-tour-title="Ubah" className="rounded p-1.5 text-[13px] font-semibold text-gray-500 hover:bg-gray-100 hover:text-primary">Ubah</button>
                      <button onClick={() => setHapus(ik.kode)} data-tour="Hapus data pada baris ini (ada konfirmasi dulu)." data-tour-title="Hapus" className="rounded p-1.5 text-[13px] font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600">Hapus</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ikList.length === 0 && <EmptyState title="Belum ada IK" desc={cplList.length === 0 ? "Tambahkan CPL terlebih dahulu, lalu buat IK untuk CPL tersebut." : "Tambah indikator kinerja pertama."} />}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          {cplList.map((c) => {
            const t = totalZ(c.kode);
            const ok = Math.abs(t - 1) < 0.001;
            return (
              <span key={c.kode} title={`${c.kode}: total ${t.toFixed(2)}, harus 1,00`} className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono font-semibold ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                Σ {c.kode} = {t.toFixed(2)}
                <span className="inline-block h-1.5 w-12 overflow-hidden rounded-full bg-white/70">
                  <span className={`block h-full rounded-full ${ok ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${Math.min(100, t * 100)}%` }} />
                </span>
              </span>
            );
          })}
        </div>
      </Card>
      </FadeContent>

      {modal && (
        <Modal title={modal.mode === "tambah" ? "Tambah IK" : `Ubah ${modal.kode}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kode IK">
                <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="IK-6" className={`${inputCls} font-mono`} disabled={modal.mode === "ubah"} />
              </Field>
              <Field label="Porsi ke CPL (0–1, mis. 0,50 = 50%)">
                <input type="number" step={0.05} min={0} max={1} value={form.z} onChange={(e) => setForm({ ...form, z: Number(e.target.value) })} className={inputCls} />
              </Field>
            </div>
            <Field label="Deskripsi">
              <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} className={inputCls} />
            </Field>
            <Field label="CPL induk">
              <select value={form.cpl} onChange={(e) => setForm({ ...form, cpl: e.target.value })} className={inputCls}>
                {cplList.map((c) => <option key={c.kode} value={c.kode}>{c.kode} — {c.deskripsiSingkat}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2"><Btn variant="outline" onClick={() => setModal(null)}>Batal</Btn><Btn onClick={simpan}>Simpan</Btn></div>
          </div>
        </Modal>
      )}

      {hapus && (
        <Modal title={`Hapus ${hapus}?`} onClose={() => setHapus(null)}>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setHapus(null)}>Batal</Btn>
            <Btn variant="danger" onClick={() => { tulisIk(ikList.filter((i) => i.kode !== hapus)); setHapus(null); }}>Ya, Hapus</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
