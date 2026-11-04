"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { bacaDataTersimpan, useApp, TAHUN_DEFAULT, type MataKuliahItem } from "@/app/lib/store";
import { DAFTAR_CPL, DAFTAR_KELAS } from "@/app/lib/data";
import { Btn, EmptyState, Field, JudulBagian, Modal, PageHeading, StatCard, inputCls } from "@/app/components/ui";
import Stepper, { StepPanel } from "@/app/components/reactbits/Stepper";

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
        title="Mata kuliah"
        desc="Penawaran mata kuliah per tahun ajaran dan kelas, sesuai Peta Kurikulum 2026."
        action={<Btn onClick={bukaTambah} tour="Tambah penawaran mata kuliah baru: info dasar, peta CPL, lalu konfirmasi." tourTitle="Tambah penawaran">Tambah penawaran</Btn>}
      />

      <div className="grid grid-cols-3 gap-x-6 sm:max-w-xl">
        <StatCard label="Mata kuliah" value={String(new Set(mataKuliah.map((mk) => mk.kode)).size)} numeric={new Set(mataKuliah.map((mk) => mk.kode)).size} />
        <StatCard label="Penawaran" value={String(mataKuliah.length)} numeric={mataKuliah.length} />
        <StatCard label="Mahasiswa" value={String(mahasiswa.length)} numeric={mahasiswa.length} />
      </div>

      <section aria-labelledby="daftar-mk-heading">
        <JudulBagian
          id="daftar-mk-heading"
          judul="Daftar penawaran"
          keterangan={`${daftar.length} penawaran untuk kelas ${kelasFilter}. Buka mata kuliah untuk mengisi nilai, melihat capaian, dan menyusun dokumen.`}
          aksi={
            <>
              <select aria-label="Pilih kelas mata kuliah" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className={`${inputCls} sm:!w-32`}>
                {DAFTAR_KELAS.map((kelas) => <option key={kelas} value={kelas}>Kelas {kelas}</option>)}
              </select>
              <input aria-label="Cari mata kuliah" type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari kode atau nama" className={`${inputCls} sm:!w-60`} />
            </>
          }
        />

        {daftar.length === 0 ? (
          <EmptyState title="Tidak ada mata kuliah" desc="Ubah kata kunci pencarian atau tambah penawaran baru." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full min-w-[720px] text-left text-sm" aria-label="Daftar penawaran mata kuliah">
              <thead className="bg-paper text-xs text-ink-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="px-4 py-2.5 font-semibold">Kode</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Mata kuliah</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">SKS</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Tahun</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Semester</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold"><span className="sr-only">Aksi</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {daftar.map((mk) => (
                  <tr key={`${mk.kode}::${mk.tahun}::${mk.kelas}`} className="hover:bg-paper/70">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-primary">{mk.kode}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/mata-kuliah/${mk.kode}`}
                        onClick={() => { setTahunDipilih(mk.kode, mk.tahun); setKelasDipilih(mk.kode, mk.tahun, mk.kelas); }}
                        className="font-medium text-ink hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        data-tour="Buka input nilai, capaian pembelajaran, dan generator dokumen mata kuliah."
                        data-tour-title="Buka mata kuliah"
                      >
                        {mk.nama}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {mk.dosen || "Dosen belum diisi"}
                        {mk.isDummyMapping ? <span className="ml-2 rounded border border-warning/30 bg-warning-bg px-1 text-warning">data contoh</span> : null}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{mk.sks}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{mk.tahun}</td>
                    <td className="px-4 py-3 text-ink-muted">{mk.semester ? mk.semester : "Belum ditetapkan"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => bukaUbah(mk)} title={`Ubah ${mk.kode} ${mk.tahun}`} aria-label={`Ubah ${mk.kode}, tahun ${mk.tahun}`} data-tour="Ubah data penawaran mata kuliah ini." data-tour-title="Ubah mata kuliah" className="rounded-md p-2 text-ink-muted transition-colors hover:bg-paper hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button type="button" onClick={() => setHapus({ kode: mk.kode, tahun: mk.tahun, kelas: mk.kelas })} title={`Hapus ${mk.kode} ${mk.tahun} kelas ${mk.kelas}`} aria-label={`Hapus ${mk.kode}, tahun ${mk.tahun}, kelas ${mk.kelas}`} data-tour="Hapus penawaran mata kuliah ini setelah konfirmasi." data-tour-title="Hapus mata kuliah" className="rounded-md p-2 text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <Modal title={modal.mode === "tambah" ? "Tambah Mata Kuliah" : `Ubah ${modal.kode}, ${modal.tahun}`} desc="Tiga langkah: info dasar, peta CPL, lalu konfirmasi." onClose={() => setModal(null)} wide>
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
            {galat && <div className="rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{galat}</div>}
            {langkahForm === 0 ? (
            <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kode MK (mis. TI045105)">
                <input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="TI045105" className={`${inputCls} tabular-nums`} disabled={modal.mode === "ubah"} />
              </Field>
              {modal.mode === "ubah" ? <Field label="Kelas"><input value={`Kelas ${form.kelas}`} readOnly className={`${inputCls} bg-paper`} /></Field> : null}
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
                  className={`${inputCls} tabular-nums`}
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
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 tabular-nums text-xs font-bold transition-colors ${form.cpl.includes(c.kode) ? "border-primary bg-primary text-white" : "border-line text-ink hover:border-primary"}`}
                  >
                    <input type="checkbox" className="hidden" checked={form.cpl.includes(c.kode)} onChange={() => toggleCplForm(c.kode)} />
                    {c.kode}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">Pilih CPL yang dibebankan pada mata kuliah ini.</p>
            </Field>
            ) : null}
            {langkahForm === 2 ? (
            <div className="rounded-md border border-line bg-paper p-4 text-sm leading-relaxed text-ink">
              <p><strong className="text-primary">{form.kode || "(kode?)"} {form.nama || "(nama?)"}</strong></p>
              <p className="mt-1">Tahun {form.tahun || "(tahun?)"}, {form.dosen || "Dosen belum diisi"}, Smt {form.semester ?? "Pilihan"}, {form.sks} SKS, Kelas {modal.mode === "tambah" ? "A, B, C, D" : form.kelas || "—"}, CPL: {form.cpl.join(", ") || "belum dipetakan"}</p>
              
            </div>
            ) : null}
            <div className="flex items-center justify-between pt-2">
              <button disabled={langkahForm === 0} onClick={() => setLangkahForm(Math.max(0, langkahForm - 1))} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink disabled:opacity-40 hover:bg-paper">← Kembali</button>
              {langkahForm < 2 ? (
                <Btn onClick={() => {
                  if (langkahForm === 0 && (!form.kode.trim() || !form.nama.trim())) { setGalat("Isi kode dan nama dulu sebelum lanjut."); return; }
                  if (langkahForm === 0 && !/^\d{4}\/\d{4}$/.test(form.tahun.trim())) { setGalat("Isi tahun ajaran dengan format 2026/2027 sebelum lanjut."); return; }
                  if (langkahForm === 0 && form.kategori === "wajib" && !form.semester) { setGalat("Isi semester untuk mata kuliah wajib sebelum lanjut."); return; }
                  setGalat("");
                  setLangkahForm(langkahForm + 1);
                }}>Lanjut</Btn>
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
