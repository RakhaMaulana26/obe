"use client";

import { useEffect, useState } from "react";
import { DAFTAR_PL, type PL } from "@/app/lib/data";
import { bacaDataTersimpan } from "@/app/lib/store";
import { Btn, Card, EmptyState, Field, Modal, PageHeading, StatCard, Td, Th, inputCls } from "@/app/components/ui";

export default function PLPage() {
  const [plList, setPlList] = useState<PL[]>(() =>
    bacaDataTersimpan<PL[]>("obe-pl", DAFTAR_PL).map(({ kode, nama, deskripsi }) => ({ kode, nama, deskripsi })),
  );
  const [modal, setModal] = useState<null | { mode: "tambah" } | { mode: "ubah"; kode: string }>(null);
  const [form, setForm] = useState<PL>({ kode: "", nama: "", deskripsi: "" });
  const [hapus, setHapus] = useState<string | null>(null);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    try {
      window.localStorage.setItem("obe-pl", JSON.stringify(plList));
    } catch {
      /* abaikan */
    }
  }, [plList]);

  function simpanPL() {
    const kode = form.kode.trim().toUpperCase();
    if (!kode || !form.nama.trim()) return setGalat("Kode dan nama profil lulusan wajib diisi.");
    if (modal?.mode === "tambah" && plList.some((p) => p.kode === kode)) return setGalat("Kode profil lulusan sudah ada.");
    if (modal?.mode === "tambah") setPlList([...plList, { ...form, kode }]);
    else if (modal?.mode === "ubah") setPlList(plList.map((p) => (p.kode === modal.kode ? { ...form, kode: modal.kode } : p)));
    setModal(null);
    setGalat("");
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Profil Lulusan"
        action={<Btn onClick={() => { setForm({ kode: "", nama: "", deskripsi: "" }); setGalat(""); setModal({ mode: "tambah" }); }}>+ Tambah Profil</Btn>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total profil" value={String(plList.length)} numeric={plList.length} sub="Profil lulusan terdaftar" />
        <StatCard label="Batas perhitungan" value="CPL" sub="Profil lulusan tidak menghasilkan skor" />
      </div>

      <Card className="border-blue-100 bg-blue-50/50">
        <p className="text-sm leading-relaxed text-gray-700">
          Profil lulusan disimpan sebagai informasi peran target lulusan. Perhitungan capaian mahasiswa dan kelas berhenti pada CPL; profil lulusan tidak diberi bobot atau nilai.
        </p>
      </Card>

      {galat && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{galat}</div>}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-gray-200"><Th>Kode</Th><Th>Profil Lulusan</Th><Th>Deskripsi</Th><Th>Aksi</Th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {plList.map((p) => (
                <tr key={p.kode} className="hover:bg-gray-50/70">
                  <Td><span className="rounded-md bg-primary px-2 py-0.5 font-mono text-xs font-bold text-white">{p.kode}</span></Td>
                  <Td className="font-medium text-gray-800">{p.nama}</Td>
                  <Td className="max-w-2xl text-[13px] text-gray-600">{p.deskripsi}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({ kode: p.kode, nama: p.nama, deskripsi: p.deskripsi }); setGalat(""); setModal({ mode: "ubah", kode: p.kode }); }} className="rounded p-1.5 text-[13px] font-semibold text-gray-500 hover:bg-gray-100 hover:text-primary">Ubah</button>
                      <button onClick={() => setHapus(p.kode)} className="rounded p-1.5 text-[13px] font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600">Hapus</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {plList.length === 0 && <EmptyState title="Belum ada profil lulusan" desc="Tambah profil lulusan pertama." />}
      </Card>

      {modal && (
        <Modal title={modal.mode === "tambah" ? "Tambah Profil Lulusan" : `Ubah ${modal.kode}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kode profil">
                <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="PL-4" className={`${inputCls} font-mono`} disabled={modal.mode === "ubah"} />
              </Field>
              <Field label="Nama profil">
                <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Analis Sistem" className={inputCls} />
              </Field>
            </div>
            <Field label="Deskripsi">
              <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={3} className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2"><Btn variant="outline" onClick={() => setModal(null)}>Batal</Btn><Btn onClick={simpanPL}>Simpan</Btn></div>
          </div>
        </Modal>
      )}

      {hapus && (
        <Modal title={`Hapus ${hapus}?`} onClose={() => setHapus(null)}>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setHapus(null)}>Batal</Btn>
            <Btn variant="danger" onClick={() => { setPlList(plList.filter((p) => p.kode !== hapus)); setHapus(null); }}>Ya, Hapus</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
