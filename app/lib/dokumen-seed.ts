import sumber from "./sumber-dokumen-datamining.json";
import type { DokumenMKConfig, KategoriRubrik, RencanaTugasRubrik, RencanaSubCPMK } from "./dokumen";

interface SumberRPSRubrik {
  mataKuliah: {
    kode: string;
    rumpun: string;
    sksTeori: string;
    sksPraktik: string;
    tanggal: string;
    pengembang: string;
    koordinator: string;
    kaprodi: string;
    deskripsi: string;
    referensiUtama: string[];
    referensiPendukung: string[];
    prasyarat: string;
  };
  rencanaSub: Record<string, RencanaSubCPMK>;
  bobotRubrik: Record<string, Record<KategoriRubrik, number>>;
  tugasRubrik: Record<KategoriRubrik, RencanaTugasRubrik>;
  rubrikUmum: Partial<Record<KategoriRubrik, string[]>>;
  rubrikDetail: NonNullable<DokumenMKConfig["rubrikDetail"]>;
  barisUjian: NonNullable<DokumenMKConfig["rpsUjian"]>;
}

const DATA = sumber as unknown as SumberRPSRubrik;

export const KONFIGURASI_DOKUMEN_SEED: Record<string, DokumenMKConfig> = {
  [DATA.mataKuliah.kode]: {
    umum: {
      rumpun: DATA.mataKuliah.rumpun,
      sksTeori: DATA.mataKuliah.sksTeori,
      sksPraktik: DATA.mataKuliah.sksPraktik,
      tanggal: DATA.mataKuliah.tanggal,
      pengembang: DATA.mataKuliah.pengembang,
      koordinator: DATA.mataKuliah.koordinator,
      kaprodi: DATA.mataKuliah.kaprodi,
      deskripsi: DATA.mataKuliah.deskripsi,
      referensiUtama: DATA.mataKuliah.referensiUtama.join("\n"),
      referensiPendukung: DATA.mataKuliah.referensiPendukung.join("\n"),
      prasyarat: DATA.mataKuliah.prasyarat,
    },
    rencanaSub: DATA.rencanaSub,
    bobotRubrik: DATA.bobotRubrik,
    tugasRubrik: DATA.tugasRubrik,
    rubrikUmum: DATA.rubrikUmum,
    rubrikDetail: DATA.rubrikDetail,
    rpsUjian: DATA.barisUjian,
  },
};

export function kunciConfigDokumen(kode: string): string {
  const kodeMK = kode.toUpperCase();
  return Object.hasOwn(KONFIGURASI_DOKUMEN_SEED, kodeMK)
    ? `obe-dokumen-${kodeMK}-docx-20261030`
    : `obe-dokumen-${kodeMK}`;
}
