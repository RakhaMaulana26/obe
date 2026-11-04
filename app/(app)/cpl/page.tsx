"use client";

import { useState } from "react";
import { DAFTAR_CPL, DAFTAR_IK, type CPL } from "@/app/lib/data";
import { bacaDataTersimpan } from "@/app/lib/store";
import { Btn, Card, EmptyState, Field, Modal, PageHeading, StatCard, Td, Th, inputCls } from "@/app/components/ui";

function bacaLS<T>(kunci: string, fallback: T): T {
  return bacaDataTersimpan(kunci, fallback);
}

export default function CPLPage() {
  const [cplList, setCplList] = useState<CPL[]>(() => bacaLS("obe-cpl", DAFTAR_CPL));
  const [ikList] = useState(() => bacaLS("obe-ik", DAFTAR_IK));
  const [modal, setModal] = useState<null | { mode: "tambah" } | { mode: "ubah"; kode: string }>(null);
  const [form, setForm] = useState<CPL>({ kode: "", deskripsiSingkat: "", deskripsi: "" });
  const [hapus, setHapus] = useState<string | null>(null);
  const [galat, setGalat] = useState("");

  function tulisCpl(daftar: CPL[]) {
    setCplList(daftar);
    try {
      window.localStorage.setItem("obe-cpl", JSON.stringify(daftar));
    } catch {
      /* abaikan */
    }
  }

  // ikList hanya dibaca untuk validasi hapus (tidak diubah di halaman ini).

  function simpan() {
    const kode = form.kode.trim().toUpperCase();
    if (!kode || !form.deskripsi.trim()) return setGalat("Kode dan deskripsi CPL wajib diisi.");
    if (modal?.mode === "tambah" && cplList.some((c) => c.kode === kode)) return setGalat("Kode CPL sudah ada.");
    if (modal?.mode === "tambah") tulisCpl([...cplList, { ...form, kode }]);
    else if (modal?.mode === "ubah") tulisCpl(cplList.map((c) => (c.kode === modal.kode ? { ...form, kode: modal.kode } : c)));
    setModal(null);
    setGalat("");
  }

  function prosesHapus() {
    if (!hapus) return;
    const anak = ikList.filter((i) => i.cpl === hapus);
    if (anak.length > 0) {
      setGalat(`${hapus} masih dijabarkan oleh ${anak.map((a) => a.kode).join(", ")}. Pindahkan/hapus IK-nya dulu.`);
      setHapus(null);
      return;
    }
    tulisCpl(cplList.filter((c) => c.kode !== hapus));
    setHapus(null);
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Capaian pembelajaran lulusan"
        desc="CPL program studi menurut Kurikulum 2026, beserta indikator kinerjanya."
        action={<Btn onClick={() => { setForm({ kode: "", deskripsiSingkat: "", deskripsi: "" }); setGalat(""); setModal({ mode: "tambah" }); }} tour="Tambah Capaian Pembelajaran Lulusan (CPL) baru." tourTitle="Tambah CPL">+ Tambah CPL</Btn>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total CPL" value={String(cplList.length)} numeric={cplList.length} sub="Capaian lulusan terdaftar" />
        <StatCard label="Total IK penopang" value={String(ikList.length)} numeric={ikList.length} sub="Kemampuan spesifik terdaftar" />
        <StatCard label="Tanpa IK" value={String(cplList.filter((c) => !ikList.some((i) => i.cpl === c.kode)).length)} sub="CPL yang belum dijabarkan" highlight={cplList.some((c) => !ikList.some((i) => i.cpl === c.kode))} />
      </div>

      {galat && <div className="rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{galat}</div>}

      <div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary">Daftar CPL</h3>
            <p className="text-sm text-ink-muted">Kolom “IK penopang” menunjukkan indikator dan porsinya pada setiap CPL. Atur hubungan tersebut di halaman IK.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-line"><Th>Kode</Th><Th>Nama singkat</Th><Th>Deskripsi</Th><Th>IK penopang</Th><Th>Aksi</Th></tr></thead>
            <tbody className="divide-y divide-line">
              {cplList.map((c) => (
                <tr key={c.kode} className="hover:bg-paper/70">
                  <Td><span className="font-semibold tabular-nums text-primary">{c.kode}</span></Td>
                  <Td className="font-medium text-ink">{c.deskripsiSingkat}</Td>
                  <Td className="max-w-xl text-sm text-ink">{c.deskripsi}</Td>
                  <Td><span className="tabular-nums text-xs text-ink-muted">{ikList.filter((i) => i.cpl === c.kode).map((i) => `${i.kode} (${Math.round(i.z * 100)}%)`).join(", ") || "Belum ada"}</span></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ ...c }); setGalat(""); setModal({ mode: "ubah", kode: c.kode }); }} data-tour="Ubah data pada baris ini." data-tour-title="Ubah" className="rounded p-1.5 text-sm font-semibold text-ink-muted hover:bg-paper hover:text-primary">Ubah</button>
                      <button onClick={() => setHapus(c.kode)} data-tour="Hapus data pada baris ini (ada konfirmasi dulu)." data-tour-title="Hapus" className="rounded p-1.5 text-sm font-semibold text-ink-muted hover:bg-danger-bg hover:text-danger">Hapus</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cplList.length === 0 && <EmptyState title="Belum ada CPL" desc="Tambah CPL pertama program studi." />}
        <p className="mt-4 max-w-[72ch] border-l-[3px] border-primary/40 pl-3 text-sm leading-relaxed text-ink-muted">
          Perhitungan program studi berakhir di CPL. Profil lulusan dikelola terpisah sebagai informasi referensi dan tidak masuk ke perhitungan skor.
        </p>
      </Card>
      </div>

      {modal && (
        <Modal title={modal.mode === "tambah" ? "Tambah CPL" : `Ubah ${modal.kode}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kode CPL">
                <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="CPL12" className={`${inputCls} tabular-nums`} disabled={modal.mode === "ubah"} />
              </Field>
              <Field label="Nama singkat">
                <input value={form.deskripsiSingkat} onChange={(e) => setForm({ ...form, deskripsiSingkat: e.target.value })} placeholder="Keamanan siber" className={inputCls} />
              </Field>
            </div>
            <Field label="Deskripsi lengkap">
              <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={3} className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2"><Btn variant="outline" onClick={() => setModal(null)}>Batal</Btn><Btn onClick={simpan}>Simpan</Btn></div>
          </div>
        </Modal>
      )}

      {hapus && (
        <Modal title={`Hapus ${hapus}?`} onClose={() => setHapus(null)}>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setHapus(null)}>Batal</Btn>
            <Btn variant="danger" onClick={prosesHapus}>Hapus CPL</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
