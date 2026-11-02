"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, PageHeading } from "@/app/components/ui";
import DocxEditorWorkspace from "@/app/components/DocxEditorWorkspace";
import { DAFTAR_CPL, DAFTAR_IK, PEMETAAN_KURIKULUM_SEED } from "@/app/lib/data";
import {
  KATEGORI_RUBRIK,
  LABEL_KATEGORI_RUBRIK,
  type DokumenMKConfig,
  type KategoriRubrik,
  type PayloadGeneratorDokumen,
  type RencanaSubCPMK,
  type RencanaTugasRubrik,
} from "@/app/lib/dokumen";
import { KONFIGURASI_DOKUMEN_SEED, kunciConfigDokumen } from "@/app/lib/dokumen-seed";
import { bacaDataTersimpan, useApp } from "@/app/lib/store";


function labelTugas(kategori: KategoriRubrik, namaMK: string): RencanaTugasRubrik {
  const target = "Sub-CPMK yang dibebankan pada komponen ini";
  const label = LABEL_KATEGORI_RUBRIK[kategori];
  const umum: RencanaTugasRubrik = {
    judul: `${label} ${namaMK}`.trim(),
    bentuk: `Penilaian ${label.toLowerCase()} sesuai capaian mata kuliah.`,
    waktu: "Sesuai jadwal pembelajaran dan ketentuan pada RPS.",
    deskripsi: `Kegiatan ini menilai capaian ${target}.`,
    metode: "Dikerjakan sesuai bentuk asesmen dan petunjuk dosen pengampu. Hasil kerja dikumpulkan melalui LMS atau media yang ditetapkan.",
    luaran: "Hasil kerja mahasiswa sesuai bentuk asesmen, disertai penjelasan atau laporan bila diperlukan.",
    indikator: `Ketepatan dan kelengkapan pencapaian ${target}.`,
    jadwal: "Mengikuti jadwal pertemuan yang tercantum pada RPS.",
    lain: "Ketentuan teknis dan susulan mengikuti kebijakan dosen pengampu dan program studi.",
  };
  if (kategori === "kuis") {
    umum.bentuk = "Kuis individual, tertulis di kelas atau melalui LMS sesuai pengaturan dosen pengampu.";
    umum.luaran = "Jawaban soal, uraian singkat, dan/atau langkah penyelesaian sesuai materi yang dinilai.";
  } else if (kategori === "laporan") {
    umum.bentuk = "Laporan hasil praktikum atau tugas individual sesuai topik pembelajaran.";
    umum.luaran = "Hasil kerja, notebook atau berkas praktik, dan laporan yang menjelaskan proses serta hasil.";
  } else if (kategori === "proyek") {
    umum.bentuk = "Proyek atau produk pembelajaran yang disertai dokumentasi dan demonstrasi bila diperlukan.";
    umum.luaran = "Produk atau prototipe, source code atau berkas pendukung, dan laporan singkat.";
  } else {
    umum.bentuk = "Tes tertulis dan/atau praktik individual sesuai bentuk asesmen.";
    umum.luaran = "Jawaban tes, hasil praktik, dan penjelasan hasil sesuai instruksi asesmen.";
  }
  return umum;
}

function configAwal(
  mk: { nama: string; dosen: string } | undefined,
  subList: Array<{ kode: string; deskripsi: string }>,
): DokumenMKConfig {
  const namaMK = mk?.nama ?? "Mata Kuliah";
  const mingguBelajar = Array.from({ length: 15 }, (_, indeks) => indeks + 1).filter((minggu) => minggu !== 8);
  const rencanaSub: DokumenMKConfig["rencanaSub"] = {};
  const bobotRubrik: DokumenMKConfig["bobotRubrik"] = {};
  subList.forEach((sub, indeks) => {
    const awal = Math.floor((indeks * mingguBelajar.length) / Math.max(subList.length, 1));
    const akhir = Math.floor(((indeks + 1) * mingguBelajar.length) / Math.max(subList.length, 1));
    const pertemuan = mingguBelajar.slice(awal, Math.max(awal + 1, akhir));
    rencanaSub[sub.kode] = {
      pertemuan: pertemuan.join(", "),
      indikator: `Ketepatan mencapai capaian ${sub.kode}: ${sub.deskripsi}`,
      kriteria: "Ketepatan, kelengkapan, dan ketercapaian indikator; gunakan pedoman penskoran dan rubrik analitik.",
      tatapMuka: "Kuliah dan/atau praktikum tatap muka; metode, penugasan, dan estimasi waktu disesuaikan dengan materi.",
      daring: "Kelas sinkron daring dan/atau praktikum berbasis perangkat lunak; hasil kerja dikumpulkan melalui LMS.",
      materi: sub.deskripsi,
    };
    bobotRubrik[sub.kode] = { kuis: 0, laporan: 0, proyek: 0, mid: 0, post: 0 };
  });
  const tugasRubrik = Object.fromEntries(
    KATEGORI_RUBRIK.map((kategori) => [kategori, labelTugas(kategori, namaMK)]),
  ) as DokumenMKConfig["tugasRubrik"];

  return {
    umum: {
      rumpun: "",
      sksTeori: "",
      sksPraktik: "",
      tanggal: "",
      pengembang: mk?.dosen ?? "",
      koordinator: "",
      kaprodi: "",
      deskripsi: subList.length > 0
        ? `Mata kuliah ini membekali mahasiswa dengan kemampuan yang dirumuskan dalam ${subList.length} Sub-CPMK. Materi, kegiatan, dan penilaian dirinci pada bagian mingguan RPS.`
        : "",
      referensiUtama: "",
      referensiPendukung: "",
      prasyarat: "",
    },
    rencanaSub,
    bobotRubrik,
    tugasRubrik,
  };
}

function gabungkanConfig(tersimpan: Partial<DokumenMKConfig> | null, awal: DokumenMKConfig): DokumenMKConfig {
  if (!tersimpan) return awal;
  const rencanaSub = { ...awal.rencanaSub, ...(tersimpan.rencanaSub ?? {}) };
  const bobotRubrik = { ...awal.bobotRubrik };
  for (const [kode, bobot] of Object.entries(tersimpan.bobotRubrik ?? {})) {
    if (bobotRubrik[kode]) bobotRubrik[kode] = { ...bobotRubrik[kode], ...bobot };
  }
  const rubrikUmum = { ...awal.rubrikUmum, ...(tersimpan.rubrikUmum ?? {}) };
  const rubrikDetail = Object.fromEntries(KATEGORI_RUBRIK.map((kategori) => [
    kategori,
    { ...(awal.rubrikDetail?.[kategori] ?? {}), ...(tersimpan.rubrikDetail?.[kategori] ?? {}) },
  ])) as DokumenMKConfig["rubrikDetail"];
  return {
    umum: { ...awal.umum, ...(tersimpan.umum ?? {}) },
    rencanaSub,
    bobotRubrik,
    tugasRubrik: { ...awal.tugasRubrik, ...(tersimpan.tugasRubrik ?? {}) },
    rubrikUmum,
    rubrikDetail,
    rpsUjian: { ...awal.rpsUjian, ...(tersimpan.rpsUjian ?? {}) },
  };
}

function bacaDaftar<T>(kunci: string, fallback: T): T {
  return bacaDataTersimpan(kunci, fallback);
}

export default function DokumenMKEditor({ params, mode }: { params: Promise<{ kode: string }>; mode: "rps" | "rubrik" }) {
  const { kode } = use(params);
  const mkKode = decodeURIComponent(kode).toUpperCase();
  const { mataKuliah, strukturUntuk, simpanStruktur } = useApp();
  const mk = mataKuliah.find((item) => item.kode === mkKode);
  const struktur = strukturUntuk(mkKode);
  const key = kunciConfigDokumen(mkKode);
  const awal = useMemo(() => configAwal(mk, struktur.sub), [mk, struktur.sub]);
  const configBawaan = useMemo(
    () => gabungkanConfig(KONFIGURASI_DOKUMEN_SEED[mkKode] ?? null, awal),
    [mkKode, awal],
  );
  const [konfigurasi, setKonfigurasi] = useState<DokumenMKConfig>(() =>
    gabungkanConfig(bacaDaftar<Partial<DokumenMKConfig> | null>(key, null), configBawaan),
  );
  const [cplList] = useState(() => bacaDaftar("obe-cpl", DAFTAR_CPL));
  const [ikList] = useState(() => bacaDaftar("obe-ik", DAFTAR_IK));
  const [pemetaanKurikulum] = useState(() =>
      bacaDaftar<Record<string, Record<string, number>>>("obe-pemetaan-kurikulum", PEMETAAN_KURIKULUM_SEED),
    );
  const [sedangMenghasilkan, setSedangMenghasilkan] = useState(false);
  const [pesan, setPesan] = useState("");
  const totalBobot = useMemo(
    () => struktur.sub.reduce((total, sub) => total + KATEGORI_RUBRIK.reduce((jumlah, kategori) => jumlah + (konfigurasi.bobotRubrik[sub.kode]?.[kategori] ?? 0), 0), 0),
    [struktur.sub, konfigurasi.bobotRubrik],
  );
  const totalValid = Math.abs(totalBobot - 100) < 0.01;
  const sksTeori = Number(konfigurasi.umum.sksTeori || 0);
  const sksPraktik = Number(konfigurasi.umum.sksPraktik || 0);
  const sksValid = Boolean(mk) && sksTeori + sksPraktik === mk?.sks;
  const strukturValid = struktur.cpmk.length > 0 && struktur.sub.length > 0 && struktur.sub.every((sub) => struktur.cpmk.some((cpmk) => cpmk.kode === sub.cpmk));

  // Sinkronkan konfigurasi lokal ketika daftar Sub-CPMK berubah.
  useEffect(() => {
    const tersimpan = bacaDaftar<Partial<DokumenMKConfig> | null>(key, null);
    const gabungan = gabungkanConfig(tersimpan, configBawaan);
    setKonfigurasi((lama) => {
      const kodeLama = Object.keys(lama.rencanaSub).sort().join("|");
      const kodeBaru = Object.keys(gabungan.rencanaSub).sort().join("|");
      return kodeLama === kodeBaru ? lama : gabungan;
    });
  }, [key, configBawaan]);

  const payload = useMemo<PayloadGeneratorDokumen>(() => ({
    jenis: mode,
    mataKuliah: {
      kode: mk?.kode ?? mkKode,
      nama: mk?.nama ?? "",
      semester: mk?.semester ?? null,
      sks: mk?.sks ?? 0,
      tahun: mk?.tahun ?? "",
      kelas: mk?.kelas ?? "",
      dosen: mk?.dosen ?? "",
      cpl: mk?.cpl ?? [],
    },
    struktur,
    cpl: cplList,
    ik: ikList,
    pemetaanKurikulum,
    konfigurasi,
  }), [mode, mk, mkKode, struktur, cplList, ikList, pemetaanKurikulum, konfigurasi]);

  function simpanLokal(baru: DokumenMKConfig) {
    setKonfigurasi(baru);
    setPesan("");
    try {
      window.localStorage.setItem(key, JSON.stringify(baru));
    } catch {
      setPesan("Perubahan belum dapat disimpan. Periksa ruang penyimpanan browser.");
    }
  }

  function ubahUmum(kolom: keyof DokumenMKConfig["umum"], nilai: string) {
    simpanLokal({ ...konfigurasi, umum: { ...konfigurasi.umum, [kolom]: nilai } });
  }

  function ubahRencana(kodeSub: string, kolom: keyof RencanaSubCPMK, nilai: string) {
    simpanLokal({
      ...konfigurasi,
      rencanaSub: { ...konfigurasi.rencanaSub, [kodeSub]: { ...konfigurasi.rencanaSub[kodeSub], [kolom]: nilai } },
    });
  }

  function ubahBobot(kodeSub: string, kategori: KategoriRubrik, nilai: string) {
    const angka = nilai.trim() === "" ? 0 : Number(nilai);
    if (!Number.isFinite(angka) || angka < 0 || angka > 100) return;
    simpanLokal({
      ...konfigurasi,
      bobotRubrik: { ...konfigurasi.bobotRubrik, [kodeSub]: { ...konfigurasi.bobotRubrik[kodeSub], [kategori]: angka } },
    });
  }

  function ubahTugas(kategori: KategoriRubrik, kolom: keyof RencanaTugasRubrik, nilai: string) {
    simpanLokal({
      ...konfigurasi,
      tugasRubrik: { ...konfigurasi.tugasRubrik, [kategori]: { ...konfigurasi.tugasRubrik[kategori], [kolom]: nilai } },
    });
  }

  function ubahCPMKDeskripsi(kodeCpmk: string, deskripsi: string) {
    const cpmkBaru = struktur.cpmk.map((cpmk) =>
      cpmk.kode === kodeCpmk ? { ...cpmk, deskripsi } : cpmk
    );
    simpanStruktur(mkKode, { ...struktur, cpmk: cpmkBaru });
  }

  function ubahSubCPMK(kodeSub: string, kolom: "deskripsi" | "level" | "cpmk", nilai: string) {
    const subBaru = struktur.sub.map((sub) =>
      sub.kode === kodeSub ? { ...sub, [kolom]: nilai } : sub
    );
    simpanStruktur(mkKode, { ...struktur, sub: subBaru });
  }

  function toggleMatriksIKCPMK(kodeCpmk: string, kodeIk: string) {
    const bobotULama = struktur.bobotU[kodeCpmk] ?? {};
    const nilaiLama = bobotULama[kodeIk] ?? 0;
    const nilaiBaru = nilaiLama > 0 ? 0 : 1;
    const bobotUBaru = {
      ...struktur.bobotU,
      [kodeCpmk]: {
        ...bobotULama,
        [kodeIk]: nilaiBaru,
      },
    };
    simpanStruktur(mkKode, { ...struktur, bobotU: bobotUBaru });
  }

  function toggleMatriksCPMKSub(kodeSub: string, kodeCpmk: string) {
    const sub = struktur.sub.find((s) => s.kode === kodeSub);
    if (!sub) return;
    const cpmkTarget = sub.cpmk === kodeCpmk ? "" : kodeCpmk;
    ubahSubCPMK(kodeSub, "cpmk", cpmkTarget);
  }

  function ubahRpsUjian(jenis: "mid" | "post", teks: string) {
    simpanLokal({
      ...konfigurasi,
      rpsUjian: {
        ...konfigurasi.rpsUjian,
        [jenis]: teks,
      },
    });
  }

  function ubahJudulKustom(kunci: string, nilai: string) {
    simpanLokal({
      ...konfigurasi,
      judulKustom: {
        ...konfigurasi.judulKustom,
        [kunci]: nilai,
      },
    });
  }

  async function hasilkan() {
    setSedangMenghasilkan(true);
    setPesan("");
    try {
      const response = await fetch("/api/generate-dokumen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Dokumen tidak dapat dibuat.");
      }
      const blob = await response.blob();
      const alamat = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = alamat;
      const namaMK = mk?.nama.replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").trim().replace(/\s+/g, "-");
      link.download = `${mk?.kode}-${mode === "rps" ? "RPS" : "Rubrik"}-${namaMK || "Mata-Kuliah"}.docx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(alamat), 1000);
      setPesan(`${mode === "rps" ? "RPS" : "Rubrik"} berhasil dibuat dari template DOCX.`);
    } catch (error) {
      setPesan(error instanceof Error ? error.message : "Dokumen gagal dibuat.");
    } finally {
      setSedangMenghasilkan(false);
    }
  }

  if (!mk) {
    return (
      <div className="space-y-6">
        <PageHeading title={mode === "rps" ? "RPS" : "Rubrik"} />
        <EmptyState title="Mata kuliah tidak ditemukan" desc="Kembali ke daftar Mata Kuliah dan pilih mata kuliah yang akan dibuatkan dokumennya." />
        <Link href="/mata-kuliah" className="text-sm font-semibold text-primary hover:underline">← Daftar Mata Kuliah</Link>
      </div>
    );
  }

  return (
    <DocxEditorWorkspace
      mode={mode}
      mk={mk}
      struktur={struktur}
      pemetaanKurikulum={pemetaanKurikulum}
      konfigurasi={konfigurasi}
      totalBobot={totalBobot}
      totalValid={totalValid}
      sksValid={sksValid}
      strukturValid={strukturValid}
      sedangMenghasilkan={sedangMenghasilkan}
      pesan={pesan}
      onUmumChange={ubahUmum}
      onRencanaChange={ubahRencana}
      onBobotChange={ubahBobot}
      onTugasChange={ubahTugas}
      onRubrikDetailChange={(kategori, kodeSub, detail) => {
        simpanLokal({
          ...konfigurasi,
          rubrikDetail: {
            ...konfigurasi.rubrikDetail,
            [kategori]: {
              ...(konfigurasi.rubrikDetail?.[kategori] ?? {}),
              [kodeSub]: detail,
            },
          },
        });
      }}
      onCPMKDeskripsiChange={ubahCPMKDeskripsi}
      onSubCPMKChange={ubahSubCPMK}
      onToggleMatriksIKCPMK={toggleMatriksIKCPMK}
      onToggleMatriksCPMKSub={toggleMatriksCPMKSub}
      onRpsUjianChange={ubahRpsUjian}
      onJudulKustomChange={ubahJudulKustom}
      onDownload={hasilkan}
    />
  );
}
