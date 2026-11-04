"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useApp } from "@/app/lib/store";
import type { Asesmen, CPMK, SubCPMK } from "@/app/lib/data";
import { Btn, Card, Field, Modal, PageHeading, Td, Th, inputCls } from "@/app/components/ui";
import Tabs from "@/app/components/reactbits/Tabs";

type Tab = "cpmk" | "sub" | "asesmen";

export default function StrukturPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = use(params);
  const mkKode = decodeURIComponent(kode).toUpperCase();
  const { mataKuliah, strukturUntuk, simpanStruktur, daftarAsesmen, setDaftarAsesmen } = useApp();
  const struktur = strukturUntuk(mkKode);
  const daftarCPMK = struktur.cpmk;
  const daftarSub = struktur.sub;
  const mk = mataKuliah.find((m) => m.kode === mkKode);
  const [tab, setTab] = useState<Tab>("cpmk");
  const [galat, setGalat] = useState("");

  const [modalCpmk, setModalCpmk] = useState<null | { mode: "tambah" } | { mode: "ubah"; kode: string }>(null);
  const [formCpmk, setFormCpmk] = useState<CPMK>({ kode: "", deskripsi: "" });
  const [modalSub, setModalSub] = useState<null | { mode: "tambah" } | { mode: "ubah"; kode: string }>(null);
  const [formSub, setFormSub] = useState<SubCPMK>({ kode: "", nomor: 1, deskripsi: "", level: "C4", cpmk: "CPMK-1", v: 0.25, bobot: 0 });
  const [modalAsm, setModalAsm] = useState<null | { mode: "tambah" } | { mode: "ubah"; kode: string }>(null);
  const [formAsm, setFormAsm] = useState<Asesmen>({ kode: "T1", nama: "", deskripsi: "" });
  const [hapus, setHapus] = useState<null | { jenis: Tab; kode: string }>(null);

  const subByCpmk: Record<string, SubCPMK[]> = {};
  for (const s of daftarSub) {
    subByCpmk[s.cpmk] = subByCpmk[s.cpmk] ?? [];
    subByCpmk[s.cpmk].push(s);
  }

  function simpanCpmk() {
    const kodeBaru = formCpmk.kode.trim().toUpperCase();
    if (!kodeBaru || !formCpmk.deskripsi.trim()) return setGalat("Kode dan deskripsi CPMK wajib diisi.");
    if (modalCpmk?.mode === "tambah" && daftarCPMK.some((c) => c.kode === kodeBaru)) return setGalat("Kode CPMK sudah ada.");
    if (modalCpmk?.mode === "tambah") simpanStruktur(mkKode, { ...struktur, cpmk: [...daftarCPMK, { ...formCpmk, kode: kodeBaru }] });
    else if (modalCpmk?.mode === "ubah") simpanStruktur(mkKode, { ...struktur, cpmk: daftarCPMK.map((c) => (c.kode === modalCpmk.kode ? { ...formCpmk, kode: modalCpmk.kode } : c)) });
    setModalCpmk(null);
    setGalat("");
  }

  function simpanSub() {
    const kodeBaru = formSub.kode.trim().toUpperCase();
    if (!kodeBaru || !formSub.deskripsi.trim()) return setGalat("Kode dan deskripsi Sub-CPMK wajib diisi.");
    if (formSub.v < 0 || formSub.v > 1) return setGalat("Bobot v harus di antara 0 dan 1.");
    if (!(formSub.bobot >= 0 && formSub.bobot <= 100)) return setGalat("Bobot terhadap MK harus di antara 0 dan 100%.");
    if (modalSub?.mode === "tambah" && daftarSub.some((s) => s.kode === kodeBaru)) return setGalat("Kode Sub-CPMK sudah ada.");
    if (modalSub?.mode === "tambah") simpanStruktur(mkKode, { ...struktur, sub: [...daftarSub, { ...formSub, kode: kodeBaru }] });
    else if (modalSub?.mode === "ubah") simpanStruktur(mkKode, { ...struktur, sub: daftarSub.map((s) => (s.kode === modalSub.kode ? { ...formSub, kode: modalSub.kode } : s)) });
    setModalSub(null);
    setGalat("");
  }

  function simpanAsm() {
    const kodeBaru = formAsm.kode.trim();
    if (!kodeBaru || !formAsm.nama.trim()) return setGalat("Kode dan nama asesmen wajib diisi.");
    if (modalAsm?.mode === "tambah" && daftarAsesmen.some((a) => a.kode === kodeBaru)) return setGalat("Kode asesmen sudah ada.");
    if (modalAsm?.mode === "tambah") setDaftarAsesmen([...daftarAsesmen, { ...formAsm, kode: kodeBaru as Asesmen["kode"] }]);
    else if (modalAsm?.mode === "ubah") setDaftarAsesmen(daftarAsesmen.map((a) => (a.kode === modalAsm.kode ? { ...formAsm, kode: modalAsm.kode as Asesmen["kode"] } : a)));
    setModalAsm(null);
    setGalat("");
  }

  function prosesHapus() {
    if (!hapus) return;
    if (hapus.jenis === "cpmk") {
      if ((subByCpmk[hapus.kode] ?? []).length > 0) {
        setGalat(`${hapus.kode} masih memiliki Sub-CPMK. Pindahkan/hapus Sub-CPMK-nya dulu.`);
        setHapus(null);
        return;
      }
      simpanStruktur(mkKode, { ...struktur, cpmk: daftarCPMK.filter((c) => c.kode !== hapus.kode) });
    } else if (hapus.jenis === "sub") {
      simpanStruktur(mkKode, { ...struktur, sub: daftarSub.filter((s) => s.kode !== hapus.kode) });
    } else {
      setDaftarAsesmen(daftarAsesmen.filter((a) => a.kode !== hapus.kode));
    }
    setHapus(null);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "cpmk", label: `CPMK (${daftarCPMK.length})` },
    { id: "sub", label: `Sub-CPMK (${daftarSub.length})` },
    { id: "asesmen", label: `Asesmen (${daftarAsesmen.length})` },
  ];

  return (
    <div className="space-y-6">
      <PageHeading
        title="Struktur RPS"
        desc={`${mk?.kode ?? mkKode}${mk?.nama ? ` ${mk.nama}` : ""}. CPMK, Sub-CPMK beserta bobotnya, dan daftar asesmen.`}
        action={<Link href={`/mata-kuliah/${mkKode}`} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper">Halaman mata kuliah</Link>}
      />

      <div
        data-tour="Pindah antara daftar CPMK, Sub-CPMK beserta bobotnya, dan komponen asesmen."
        data-tour-title="Tab struktur"
      >
      <Tabs
        tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
        active={tab}
        onChange={(id) => setTab(id as Tab)}
      />
      </div>

      {galat && <div className="rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{galat}</div>}

      {tab === "cpmk" && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-primary">Capaian Pembelajaran Mata Kuliah</h3>
            <Btn onClick={() => { setFormCpmk({ kode: "", deskripsi: "" }); setGalat(""); setModalCpmk({ mode: "tambah" }); }} tour="Tambah CPMK baru beserta deskripsinya." tourTitle="Tambah CPMK">+ Tambah CPMK</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-line"><Th>Kode</Th><Th>Deskripsi</Th><Th>Sub penyusun</Th><Th>Aksi</Th></tr></thead>
              <tbody className="divide-y divide-line">
                {daftarCPMK.map((c) => (
                  <tr key={c.kode} className="hover:bg-paper/70">
                    <Td><span className="font-semibold tabular-nums text-primary">{c.kode}</span></Td>
                    <Td className="max-w-xl text-sm text-ink">{c.deskripsi}</Td>
                    <Td className="text-sm text-ink">{(subByCpmk[c.kode] ?? []).map((s) => s.kode).join(", ") || "—"}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => { setFormCpmk({ ...c }); setGalat(""); setModalCpmk({ mode: "ubah", kode: c.kode }); }} data-tour="Ubah data pada baris ini." data-tour-title="Ubah" className="rounded p-1.5 text-ink-muted hover:bg-paper hover:text-primary text-sm font-semibold">Ubah</button>
                        <button onClick={() => setHapus({ jenis: "cpmk", kode: c.kode })} data-tour="Hapus data pada baris ini (ada konfirmasi dulu)." data-tour-title="Hapus" className="rounded p-1.5 text-ink-muted hover:bg-danger-bg hover:text-danger text-sm font-semibold">Hapus</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "sub" && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-primary">Sub-CPMK beserta bobot v ke CPMK induk</h3>
            <Btn onClick={() => { setFormSub({ kode: "", nomor: daftarSub.length + 1, deskripsi: "", level: "C4", cpmk: daftarCPMK[0]?.kode ?? "CPMK-1", v: 0.25, bobot: 0 }); setGalat(""); setModalSub({ mode: "tambah" }); }} tour="Tambah Sub-CPMK: tentukan level, CPMK induk, dan bobot v-nya." tourTitle="Tambah Sub">+ Tambah Sub</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-line"><Th>Kode</Th><Th>Deskripsi</Th><Th>Level</Th><Th>CPMK</Th><Th className="text-right">v</Th><Th>Aksi</Th></tr></thead>
              <tbody className="divide-y divide-line">
                {daftarSub.map((s) => (
                  <tr key={s.kode} className="hover:bg-paper/70">
                    <Td><span className="font-semibold tabular-nums text-primary">{s.kode}</span></Td>
                    <Td className="max-w-md text-sm text-ink">{s.deskripsi}</Td>
                    <Td><span className="rounded-md bg-accent/25 px-2 py-0.5 text-xs font-bold text-primary">{s.level}</span></Td>
                    <Td className="tabular-nums text-xs text-ink">{s.cpmk}</Td>
                    <Td className="text-right tabular-nums text-sm font-semibold text-ink">{s.v.toFixed(2)}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => { setFormSub({ ...s }); setGalat(""); setModalSub({ mode: "ubah", kode: s.kode }); }} data-tour="Ubah data pada baris ini." data-tour-title="Ubah" className="rounded p-1.5 text-sm font-semibold text-ink-muted hover:bg-paper hover:text-primary">Ubah</button>
                        <button onClick={() => setHapus({ jenis: "sub", kode: s.kode })} data-tour="Hapus data pada baris ini (ada konfirmasi dulu)." data-tour-title="Hapus" className="rounded p-1.5 text-sm font-semibold text-ink-muted hover:bg-danger-bg hover:text-danger">Hapus</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-muted">Bobot v divalidasi total = 1 per CPMK pada halaman Pengaturan Bobot.</p>
        </Card>
      )}

      {tab === "asesmen" && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-primary">Komponen Asesmen</h3>
            <Btn onClick={() => { setFormAsm({ kode: "T1", nama: "", deskripsi: "" }); setGalat(""); setModalAsm({ mode: "tambah" }); }} tour="Tambah komponen asesmen baru (tugas, praktikum, ETS, EAS)." tourTitle="Tambah Asesmen">+ Tambah Asesmen</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-line"><Th>Kode</Th><Th>Nama</Th><Th>Deskripsi</Th><Th>Aksi</Th></tr></thead>
              <tbody className="divide-y divide-line">
                {daftarAsesmen.map((a) => (
                  <tr key={a.kode} className="hover:bg-paper/70">
                    <Td><span className="rounded-md bg-accent px-2 py-0.5 tabular-nums text-xs font-bold text-primary">{a.kode}</span></Td>
                    <Td className="font-medium text-ink">{a.nama}</Td>
                    <Td className="text-sm text-ink">{a.deskripsi}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => { setFormAsm({ ...a }); setGalat(""); setModalAsm({ mode: "ubah", kode: a.kode }); }} data-tour="Ubah data pada baris ini." data-tour-title="Ubah" className="rounded p-1.5 text-sm font-semibold text-ink-muted hover:bg-paper hover:text-primary">Ubah</button>
                        <button onClick={() => setHapus({ jenis: "asesmen", kode: a.kode })} data-tour="Hapus data pada baris ini (ada konfirmasi dulu)." data-tour-title="Hapus" className="rounded p-1.5 text-sm font-semibold text-ink-muted hover:bg-danger-bg hover:text-danger">Hapus</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {modalCpmk && (
        <Modal title={modalCpmk.mode === "tambah" ? "Tambah CPMK" : `Ubah ${modalCpmk.kode}`} onClose={() => setModalCpmk(null)}>
          <div className="space-y-4">
            <Field label="Kode CPMK">
              <input value={formCpmk.kode} onChange={(e) => setFormCpmk({ ...formCpmk, kode: e.target.value })} placeholder="CPMK-4" className={`${inputCls} tabular-nums`} disabled={modalCpmk.mode === "ubah"} />
            </Field>
            <Field label="Deskripsi">
              <textarea value={formCpmk.deskripsi} onChange={(e) => setFormCpmk({ ...formCpmk, deskripsi: e.target.value })} rows={3} className={inputCls} placeholder="Mahasiswa mampu ..." />
            </Field>
            <div className="flex justify-end gap-2"><Btn variant="outline" onClick={() => setModalCpmk(null)}>Batal</Btn><Btn onClick={simpanCpmk}>Simpan</Btn></div>
          </div>
        </Modal>
      )}

      {modalSub && (
        <Modal title={modalSub.mode === "tambah" ? "Tambah Sub-CPMK" : `Ubah ${modalSub.kode}`} onClose={() => setModalSub(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kode">
                <input value={formSub.kode} onChange={(e) => setFormSub({ ...formSub, kode: e.target.value })} placeholder="S11" className={`${inputCls} tabular-nums`} disabled={modalSub.mode === "ubah"} />
              </Field>
              <Field label="Nomor">
                <input type="number" min={1} value={formSub.nomor} onChange={(e) => setFormSub({ ...formSub, nomor: Number(e.target.value) })} className={inputCls} />
              </Field>
            </div>
            <Field label="Deskripsi">
              <textarea value={formSub.deskripsi} onChange={(e) => setFormSub({ ...formSub, deskripsi: e.target.value })} rows={2} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Level Bloom">
                <select value={formSub.level} onChange={(e) => setFormSub({ ...formSub, level: e.target.value })} className={inputCls}>
                  {["C1", "C2", "C3", "C4", "C5", "C6"].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="CPMK induk">
                <select value={formSub.cpmk} onChange={(e) => setFormSub({ ...formSub, cpmk: e.target.value })} className={inputCls}>
                  {daftarCPMK.map((c) => <option key={c.kode} value={c.kode}>{c.kode}</option>)}
                </select>
              </Field>
              <Field label="Bobot v">
                <input type="number" step={0.05} min={0} max={1} value={formSub.v} onChange={(e) => setFormSub({ ...formSub, v: Number(e.target.value) })} className={inputCls} />
              </Field>
              <Field label="Bobot MK (%)">
                <input type="number" step={1} min={0} max={100} value={formSub.bobot ?? 0} onChange={(e) => setFormSub({ ...formSub, bobot: Number(e.target.value) })} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end gap-2"><Btn variant="outline" onClick={() => setModalSub(null)}>Batal</Btn><Btn onClick={simpanSub}>Simpan</Btn></div>
          </div>
        </Modal>
      )}

      {modalAsm && (
        <Modal title={modalAsm.mode === "tambah" ? "Tambah Asesmen" : `Ubah ${modalAsm.kode}`} onClose={() => setModalAsm(null)}>
          <div className="space-y-4">
            <Field label="Kode">
                <input value={formAsm.kode} onChange={(e) => setFormAsm({ ...formAsm, kode: e.target.value as Asesmen["kode"] })} placeholder="T5" className={`${inputCls} tabular-nums`} disabled={modalAsm.mode === "ubah"} />
              </Field>
            <Field label="Nama">
              <input value={formAsm.nama} onChange={(e) => setFormAsm({ ...formAsm, nama: e.target.value })} placeholder="Tugas 5" className={inputCls} />
            </Field>
            <Field label="Deskripsi">
              <input value={formAsm.deskripsi} onChange={(e) => setFormAsm({ ...formAsm, deskripsi: e.target.value })} placeholder="Materi yang diukur" className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2"><Btn variant="outline" onClick={() => setModalAsm(null)}>Batal</Btn><Btn onClick={simpanAsm}>Simpan</Btn></div>
          </div>
        </Modal>
      )}

      {hapus && (
        <Modal title={`Hapus ${hapus.kode}?`} onClose={() => setHapus(null)}>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setHapus(null)}>Batal</Btn>
            <Btn variant="danger" onClick={prosesHapus}>Ya, Hapus</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
