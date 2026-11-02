"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { bacaDataTersimpan, useApp, TAHUN_DEFAULT, type MataKuliahItem } from "@/app/lib/store";
import { DAFTAR_CPL, DAFTAR_KELAS } from "@/app/lib/data";
import { Btn, Card, EmptyState, Field, Modal, PageHeading, StatCard, inputCls } from "@/app/components/ui";
import Stepper, { StepPanel } from "@/app/components/reactbits/Stepper";
import FadeContent from "@/app/components/reactbits/FadeContent";

const KOSONG: MataKuliahItem = {
  kode: "",
  nama: "",
  semester: null,
  sks: 0,
  kategori: "wajib",
  kelas: "A",
  tahun: TAHUN_DEFAULT,
  dosen: "",
  cpl: [],
  bahanKajian: [],
  isDummyMapping: false,
};

const SARAN_TAHUN: string[] = [];

function bacaCplTersedia(): { kode: string; deskripsiSingkat: string }[] {
  const daftar = bacaDataTersimpan("obe-cpl", DAFTAR_CPL);
  return daftar.length > 0 ? daftar : DAFTAR_CPL;
}

export default function MataKuliahPage() {
  const { mataKuliah, tambahMK, ubahMK, hapusMK, setKelasDipilih, setTahunDipilih, mahasiswa } = useApp();
  const [cari, setCari] = useState("");
  const [modal, setModal] = useState<null | { mode: "tambah" } | { mode: "ubah"; kode: string; tahun: string; kelas: string }>(null);
  const [hapus, setHapus] = useState<null | { kode: string; tahun: string; kelas: string }>(null);
  const [form, setForm] = useState<MataKuliahItem>(KOSONG);
  const [galat, setGalat] = useState("");
  const [cplTersedia] = useState(bacaCplTersedia);
  const [langkahForm, setLangkahForm] = useState(0);
  const [kelasFilter, setKelasFilter] = useState("A");

  function toggleCplForm(kode: string) {
    setForm((f) => ({
      ...f,
      cpl: f.cpl.includes(kode) ? f.cpl.filter((c) => c !== kode) : [...f.cpl, kode],
    }));
  }

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return mataKuliah.filter(
      (m) =>
        m.kelas === kelasFilter &&
        (!q ||
        m.nama.toLowerCase().includes(q) ||
        m.kode.toLowerCase().includes(q) ||
        m.tahun.toLowerCase().includes(q) ||
        (m.dosen ?? "").toLowerCase().includes(q)),
    );
  }, [mataKuliah, cari, kelasFilter]);

  function bukaTambah() {
    setForm(KOSONG);
    setGalat("");
    setLangkahForm(0);
    setModal({ mode: "tambah" });
  }

  function bukaUbah(mk: MataKuliahItem) {
    setForm({ ...mk });
    setGalat("");
    setLangkahForm(0);
    setModal({ mode: "ubah", kode: mk.kode, tahun: mk.tahun, kelas: mk.kelas });
  }

  function simpan() {
    if (!form.kode.trim() || !form.nama.trim()) {
      setGalat("Kode dan nama mata kuliah wajib diisi.");
      return;
    }
    if (form.kategori === "wajib" && !form.semester) {
      setGalat("Semester wajib diisi untuk mata kuliah wajib.");
      return;
    }
    const tahun = form.tahun.trim();
    if (!tahun) {
      setGalat("Tahun ajaran wajib diisi (mis. 2026/2027).");
      return;
    }
    if (!/^\d{4}\/\d{4}$/.test(tahun)) {
      setGalat("Format tahun ajaran: 2026/2027.");
      return;
    }
    const kode = form.kode.trim().toUpperCase();
    const data = { ...form, kode, tahun, dosen: form.dosen.trim() };
    if (modal?.mode === "tambah") {
      const kelasBelumAda = DAFTAR_KELAS.filter((kelas) => !mataKuliah.some((m) => m.kode === kode && m.tahun === tahun && m.kelas === kelas));
      if (kelasBelumAda.length === 0) {
        setGalat(`Penawaran ${kode} tahun ${tahun} sudah memiliki Kelas A, B, C, dan D.`);
        return;
      }
      kelasBelumAda.forEach((kelas) => tambahMK({ ...data, kelas }));
    } else if (modal?.mode === "ubah") ubahMK(modal.kode, modal.tahun, modal.kelas, data);
    setModal(null);
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Mata Kuliah"
        action={<Btn onClick={bukaTambah} tour="Tambah penawaran mata kuliah baru: info dasar, peta CPL, lalu konfirmasi." tourTitle="Tambah MK">+ Tambah MK</Btn>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total MK" value={String(new Set(mataKuliah.map((mk) => mk.kode)).size)} numeric={new Set(mataKuliah.map((mk) => mk.kode)).size} />
        <StatCard label="Penawaran" value={String(mataKuliah.length)} numeric={mataKuliah.length} />
        <StatCard label="Mahasiswa" value={String(mahasiswa.length)} numeric={mahasiswa.length} />
      </div>

      <FadeContent>
      <Card>
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <select aria-label="Pilih kelas mata kuliah" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className={`${inputCls} sm:!w-36`}>
            {DAFTAR_KELAS.map((kelas) => <option key={kelas} value={kelas}>Kelas {kelas}</option>)}
          </select>
          <input aria-label="Cari mata kuliah" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari mata kuliah..." className={`${inputCls} sm:!w-64`} />
        </div>

        {daftar.length === 0 ? (
          <EmptyState title="Tidak ada mata kuliah" desc="Ubah kata kunci pencarian atau tambah mata kuliah baru." />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-label="Daftar penawaran mata kuliah">
            {daftar.map((mk) => {
              const kategori = mk.kategori === "wajib" ? "Wajib" : mk.kategori === "pilihan-institusi" ? "Pilihan Institusi" : mk.kategori === "pilihan-prodi" ? "Pilihan Prodi" : "Kategori belum ditetapkan";
              return (
                <li key={`${mk.kode}::${mk.tahun}::${mk.kelas}`} className="h-full">
                  <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary/40 hover:bg-slate-50/60 hover:shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary px-2 py-1 font-mono text-xs font-bold text-white">{mk.kode}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">{mk.tahun}</span>
                      <span className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600">{mk.semester ? `Semester ${mk.semester}` : "Semester belum ditetapkan"}</span>
                      {mk.isDemoOffering ? <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800">Penawaran demo</span> : null}
                      {mk.isDummyMapping ? <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Data demo</span> : null}
                    </div>

                    <h3 className="mt-3 text-sm font-semibold leading-snug text-slate-900">{mk.nama}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{mk.dosen || "Dosen belum diisi"} <span aria-hidden>·</span> {mk.sks} SKS</p>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <Link
                        href={`/mata-kuliah/${mk.kode}`}
                        onClick={() => { setTahunDipilih(mk.kode, mk.tahun); setKelasDipilih(mk.kode, mk.tahun, mk.kelas); }}
                        title="Buka halaman mata kuliah"
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        data-tour="Buka input nilai, capaian pembelajaran, dan generator dokumen mata kuliah."
                        data-tour-title="Buka mata kuliah"
                      >
                        Buka mata kuliah <span aria-hidden>→</span>
                      </Link>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => bukaUbah(mk)} title={`Ubah ${mk.kode} ${mk.tahun}`} aria-label={`Ubah ${mk.kode}, tahun ${mk.tahun}`} data-tour="Ubah data penawaran mata kuliah ini." data-tour-title="Ubah mata kuliah" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button type="button" onClick={() => setHapus({ kode: mk.kode, tahun: mk.tahun, kelas: mk.kelas })} title={`Hapus ${mk.kode} ${mk.tahun} Kelas ${mk.kelas}`} aria-label={`Hapus ${mk.kode}, tahun ${mk.tahun}, kelas ${mk.kelas}`} data-tour="Hapus penawaran mata kuliah ini setelah konfirmasi." data-tour-title="Hapus mata kuliah" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      </FadeContent>

      {modal && (
        <Modal title={modal.mode === "tambah" ? "Tambah Mata Kuliah" : `Ubah ${modal.kode} • ${modal.tahun}`} desc="3 langkah: info dasar → peta CPL → konfirmasi" onClose={() => setModal(null)} wide>
          <Stepper
            steps={[
              { title: "Info dasar", desc: "Kode, nama, SKS" },
              { title: "Peta CPL", desc: "Sorotan Hirarki" },
              { title: "Konfirmasi", desc: "Simpan" },
            ]}
            active={langkahForm}
            onStep={setLangkahForm}
            className="mb-5"
          />
          <StepPanel stepKey={langkahForm}>
          <div className="space-y-4">
            {galat && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{galat}</div>}
            {langkahForm === 0 ? (
            <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kode MK (mis. TI045105)">
                <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="TI045105" className={`${inputCls} font-mono`} disabled={modal.mode === "ubah"} />
              </Field>
              {modal.mode === "ubah" ? <Field label="Kelas"><input value={`Kelas ${form.kelas}`} readOnly className={`${inputCls} bg-gray-50`} /></Field> : null}
            </div>
            <Field label="Nama Mata Kuliah">
              <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Workshop Data Mining" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tahun ajaran (mis. 2026/2027)">
                <input
                  value={form.tahun}
                  onChange={(e) => setForm({ ...form, tahun: e.target.value })}
                  placeholder="2026/2027"
                  list="saran-tahun"
                  className={`${inputCls} font-mono`}
                  disabled={modal.mode === "ubah"}
                />
                <datalist id="saran-tahun">
                  {SARAN_TAHUN.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field label="Dosen pengampu (boleh beda tiap tahun)">
                <input value={form.dosen} onChange={(e) => setForm({ ...form, dosen: e.target.value })} placeholder="Nama dosen" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Kategori">
                <select
                  value={form.kategori}
                  onChange={(e) => {
                    const kategori = e.target.value as MataKuliahItem["kategori"];
                    setForm({ ...form, kategori, semester: kategori === "wajib" ? form.semester ?? 1 : null });
                  }}
                  className={inputCls}
                >
                  <option value="wajib">Wajib</option>
                  <option value="pilihan-institusi">Pilihan Institusi</option>
                  <option value="pilihan-prodi">Pilihan Prodi</option>
                  <option value="belum-ditetapkan">Belum ditetapkan</option>
                </select>
              </Field>
              <Field label="Semester">
                <input type="number" min={1} max={8} value={form.semester ?? ""} disabled={form.kategori !== "wajib"} onChange={(e) => setForm({ ...form, semester: e.target.value === "" ? null : Number(e.target.value) })} className={inputCls} />
              </Field>
              <Field label="Total SKS">
                <input type="number" min={0} max={40} value={form.sks} onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })} className={inputCls} />
              </Field>
            </div>
            </>
            ) : null}
            {langkahForm === 1 ? (
            <Field label="CPL yang dibebankan (peta kurikulum)">
              <div className="flex flex-wrap gap-2">
                {cplTersedia.map((c) => (
                  <label
                    key={c.kode}
                    title={c.deskripsiSingkat}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-xs font-bold transition-colors ${form.cpl.includes(c.kode) ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-600 hover:border-primary"}`}
                  >
                    <input type="checkbox" className="hidden" checked={form.cpl.includes(c.kode)} onChange={() => toggleCplForm(c.kode)} />
                    {c.kode}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">Pilih CPL yang dibebankan pada mata kuliah ini.</p>
            </Field>
            ) : null}
            {langkahForm === 2 ? (
            <div className="rounded-xl bg-primary/[0.04] p-4 text-sm leading-relaxed text-gray-700">
              <p><strong className="text-primary">{form.kode || "(kode?)"} — {form.nama || "(nama?)"}</strong></p>
              <p className="mt-1">Tahun {form.tahun || "(tahun?)"} • {form.dosen || "Dosen belum diisi"} • Smt {form.semester ?? "Pilihan"} • {form.sks} SKS • Kelas {modal.mode === "tambah" ? "A, B, C, D" : form.kelas || "—"} • CPL: {form.cpl.join(", ") || "belum dipetakan"}</p>
              
            </div>
            ) : null}
            <div className="flex items-center justify-between pt-2">
              <button disabled={langkahForm === 0} onClick={() => setLangkahForm(Math.max(0, langkahForm - 1))} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50">← Kembali</button>
              {langkahForm < 2 ? (
                <Btn onClick={() => {
                  if (langkahForm === 0 && (!form.kode.trim() || !form.nama.trim())) { setGalat("Isi kode dan nama dulu sebelum lanjut."); return; }
                  if (langkahForm === 0 && !/^\d{4}\/\d{4}$/.test(form.tahun.trim())) { setGalat("Isi tahun ajaran dengan format 2026/2027 sebelum lanjut."); return; }
                  if (langkahForm === 0 && form.kategori === "wajib" && !form.semester) { setGalat("Isi semester untuk mata kuliah wajib sebelum lanjut."); return; }
                  setGalat("");
                  setLangkahForm(langkahForm + 1);
                }}>Lanjut →</Btn>
              ) : (
                <div className="flex gap-2">
                  <Btn variant="outline" onClick={() => setModal(null)}>Batal</Btn>
                  <Btn onClick={simpan}>Simpan MK</Btn>
                </div>
              )}
            </div>
          </div>
          </StepPanel>
        </Modal>
      )}

      {hapus && (
        <Modal title="Hapus penawaran MK?" desc={`Data ${hapus.kode} tahun ${hapus.tahun} kelas ${hapus.kelas} beserta nilainya akan dihapus. Kelas lain tidak ikut terhapus.`} onClose={() => setHapus(null)}>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setHapus(null)}>Batal</Btn>
            <Btn variant="danger" onClick={() => { hapusMK(hapus.kode, hapus.tahun, hapus.kelas); setHapus(null); }}>Ya, Hapus</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
