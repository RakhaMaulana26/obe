import type { PayloadGeneratorDokumen, KategoriRubrik, RencanaTugasRubrik } from "./dokumen";
import { KATEGORI_RUBRIK, LABEL_KATEGORI_RUBRIK } from "./dokumen";
import { bacaDocx, isiEntriDocx, isiEntriBaru, tulisDocx } from "./docx-zip";

interface RentangBlok {
  awal: number;
  akhir: number;
}

interface RubrikBaris {
  indikator: string;
  bobot: number;
  tingkat: string[];
}

interface RencanaTugasSiap extends RencanaTugasRubrik {
  bobot: number;
  kodeSubs: string[];
}

const INDEKS_TUGAS: Record<KategoriRubrik, number> = {
  laporan: 2,
  proyek: 6,
  kuis: 10,
  mid: 14,
  post: 18,
};

const INDEKS_RUBRIK_UMUM: Record<KategoriRubrik, number> = {
  laporan: 3,
  proyek: 7,
  kuis: 11,
  mid: 15,
  post: 19,
};

const INDEKS_RUBRIK_DETAIL: Record<KategoriRubrik, number> = {
  laporan: 4,
  proyek: 8,
  kuis: 12,
  mid: 16,
  post: 20,
};

const INDEKS_LEMBAR_SKOR: Record<KategoriRubrik, number> = {
  laporan: 5,
  proyek: 9,
  kuis: 13,
  mid: 17,
  post: 21,
};

function blokXml(xml: string, nama: string): RentangBlok[] {
  const pola = new RegExp(`<${nama}(?=[\\s>])|<\\/${nama}>`, "g");
  const hasil: RentangBlok[] = [];
  let kedalaman = 0;
  let awal = -1;
  let cocok: RegExpExecArray | null;
  while ((cocok = pola.exec(xml))) {
    if (cocok[0].startsWith("</")) {
      kedalaman--;
      if (kedalaman === 0 && awal >= 0) {
        hasil.push({ awal, akhir: pola.lastIndex });
        awal = -1;
      }
    } else {
      if (kedalaman === 0) awal = cocok.index;
      kedalaman++;
    }
  }
  return hasil;
}

function isiBlok(xml: string, rentang: RentangBlok): string {
  return xml.slice(rentang.awal, rentang.akhir);
}

function gantiBlok(xml: string, rentang: RentangBlok, isi: string): string {
  return xml.slice(0, rentang.awal) + isi + xml.slice(rentang.akhir);
}

function escapekanXml(teks: string): string {
  return teks.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function teksParagraph(paragraf: string, teks: string): string {
  let nodePertama = true;
  const polaTeks = /<w:t\b[^>]*>[\s\S]*?<\/w:t>/g;
  let hasil = paragraf.replace(polaTeks, (node) => {
    const pembuka = node.match(/^<w:t\b[^>]*>/)?.[0] ?? "<w:t>";
    if (!nodePertama) return `${pembuka}</w:t>`;
    nodePertama = false;
    const pembukaAman = /xml:space=/.test(pembuka) || !/^\s|\s$/.test(teks)
      ? pembuka
      : pembuka.replace(/>$/, ' xml:space="preserve">');
    return `${pembukaAman}${escapekanXml(teks)}</w:t>`;
  });
  if (!nodePertama) return hasil;

  const properti = hasil.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/);
  const sisip = `<w:r><w:t xml:space="preserve">${escapekanXml(teks)}</w:t></w:r>`;
  if (properti) return hasil.replace(properti[0], `${properti[0]}${sisip}`);
  return hasil.replace(/<w:p\b[^>]*>/, (pembuka) => `${pembuka}${sisip}`);
}

function teksSel(sel: string, isi: string | string[]): string {
  const baris = (Array.isArray(isi) ? isi : isi.split(/\r?\n/)).map((teks) => teks ?? "");
  const paragraf = blokXml(sel, "w:p");
  if (paragraf.length === 0) return sel;
  const sumber = paragraf.map((blok) => isiBlok(sel, blok));
  const baru = baris.map((teks, indeks) => teksParagraph(sumber[Math.min(indeks, sumber.length - 1)], teks));
  return sel.slice(0, paragraf[0].awal) + baru.join("") + sel.slice(paragraf[paragraf.length - 1].akhir);
}

function teksBaris(baris: string, nilai: Array<string | string[] | null | undefined>): string {
  const sel = blokXml(baris, "w:tc");
  let hasil = baris;
  for (let indeks = Math.min(sel.length, nilai.length) - 1; indeks >= 0; indeks--) {
    const isi = nilai[indeks];
    if (isi === null || isi === undefined) continue;
    const bagian = blokXml(hasil, "w:tc")[indeks];
    hasil = gantiBlok(hasil, bagian, teksSel(isiBlok(hasil, bagian), isi));
  }
  return hasil;
}

function gantiBarisTabel(tabel: string, barisBaru: string[]): string {
  const baris = blokXml(tabel, "w:tr");
  if (baris.length === 0) return tabel;
  return tabel.slice(0, baris[0].awal) + barisBaru.join("") + tabel.slice(baris[baris.length - 1].akhir);
}

function ubahTabel(xml: string, indeks: number, ubah: (tabel: string) => string): string {
  const tabel = blokXml(xml, "w:tbl")[indeks];
  if (!tabel) throw new Error(`Tabel ${indeks + 1} tidak ditemukan di templat DOCX.`);
  return gantiBlok(xml, tabel, ubah(isiBlok(xml, tabel)));
}

function klonBaris(baris: string): string {
  return baris.replace(/\s+w14:paraId="[^"]*"/g, "").replace(/\s+w14:textId="[^"]*"/g, "");
}

function formatPersen(nilai: number): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(nilai)}%`;
}

function bobotSub(payload: PayloadGeneratorDokumen, kodeSub: string): number {
  return KATEGORI_RUBRIK.reduce((jumlah, kategori) => jumlah + Number(payload.konfigurasi.bobotRubrik[kodeSub]?.[kategori] ?? 0), 0);
}

function bobotKategori(payload: PayloadGeneratorDokumen, kategori: KategoriRubrik): number {
  return payload.struktur.sub.reduce((jumlah, sub) => jumlah + Number(payload.konfigurasi.bobotRubrik[sub.kode]?.[kategori] ?? 0), 0);
}

function materiSub(payload: PayloadGeneratorDokumen, kodeSub: string): string {
  return payload.konfigurasi.rencanaSub[kodeSub]?.materi?.trim() || "—";
}

function formatAngka(nilai: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(nilai);
}

function daftarSubKategori(payload: PayloadGeneratorDokumen, kategori: KategoriRubrik) {
  return payload.struktur.sub.filter((sub) => (payload.konfigurasi.bobotRubrik[sub.kode]?.[kategori] ?? 0) > 0);
}

function teksDaftar(values: string[]): string {
  return values.length > 0 ? values.map((item) => `• ${item}`).join("\n") : "—";
}

function ubahTabelBertingkatRPS(
  xml: string,
  indeksTabel: number,
  indeksBaris: number,
  indeksSel: number,
  indeksTabelDalam: number,
  ubah: (tabel: string) => string,
): string {
  const tabelUtama = blokXml(xml, "w:tbl")[indeksTabel];
  if (!tabelUtama) throw new Error("Tabel utama RPS tidak ditemukan.");
  let hasilTabel = isiBlok(xml, tabelUtama);
  const baris = blokXml(hasilTabel, "w:tr")[indeksBaris];
  if (!baris) throw new Error("Baris capaian RPS tidak ditemukan.");
  let hasilBaris = isiBlok(hasilTabel, baris);
  const sel = blokXml(hasilBaris, "w:tc")[indeksSel];
  if (!sel) throw new Error("Sel capaian RPS tidak ditemukan.");
  let hasilSel = isiBlok(hasilBaris, sel);
  const tabelDalam = blokXml(hasilSel, "w:tbl")[indeksTabelDalam];
  if (!tabelDalam) throw new Error(`Tabel capaian bertingkat ${indeksTabelDalam + 1} tidak ditemukan.`);
  hasilSel = gantiBlok(hasilSel, tabelDalam, ubah(isiBlok(hasilSel, tabelDalam)));
  hasilBaris = gantiBlok(hasilBaris, sel, hasilSel);
  hasilTabel = gantiBlok(hasilTabel, baris, hasilBaris);
  return gantiBlok(xml, tabelUtama, hasilTabel);
}

function ubahTabelCapaianRPS(xml: string, payload: PayloadGeneratorDokumen): string {
  const cplDibebankan = payload.cpl.filter((item) => payload.mataKuliah.cpl.includes(item.kode));
  const bobotIK = payload.pemetaanKurikulum[payload.mataKuliah.kode] ?? {};
  const ikDibebankan = payload.ik.filter((item) => (bobotIK[item.kode] ?? 0) > 0);

  xml = ubahTabelBertingkatRPS(xml, 0, 4, 1, 0, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const cplTemplate = baris[0];
    const ikTemplate = baris[1];
    const baru: string[] = [];
    for (const cpl of cplDibebankan) {
      baru.push(teksBaris(klonBaris(cplTemplate), [cpl.kode, cpl.deskripsi]));
      for (const indikator of ikDibebankan.filter((item) => item.cpl === cpl.kode)) {
        baru.push(teksBaris(klonBaris(ikTemplate), ["", indikator.kode, indikator.deskripsi]));
      }
    }
    const ikTanpaCPL = ikDibebankan.filter((item) => !cplDibebankan.some((cpl) => cpl.kode === item.cpl));
    if (ikTanpaCPL.length > 0) {
      baru.push(teksBaris(klonBaris(cplTemplate), ["CPL belum tersedia", "Induk CPL untuk IK ini belum terdaftar."]));
      for (const indikator of ikTanpaCPL) baru.push(teksBaris(klonBaris(ikTemplate), ["", indikator.kode, indikator.deskripsi]));
    }
    if (baru.length === 0) baru.push(teksBaris(klonBaris(cplTemplate), ["—", "Belum ada CPL dan IK yang dipetakan pada mata kuliah."]));
    return gantiBarisTabel(tabel, baru);
  });

  xml = ubahTabelBertingkatRPS(xml, 0, 4, 1, 1, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const template = baris[0];
    const baru = payload.struktur.cpmk.map((cpmk) => teksBaris(klonBaris(template), [cpmk.kode, cpmk.deskripsi]));
    if (baru.length === 0) baru.push(teksBaris(klonBaris(template), ["—", "Belum ada CPMK."]));
    return gantiBarisTabel(tabel, baru);
  });

  xml = ubahTabelBertingkatRPS(xml, 0, 4, 1, 2, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const header = blokXml(baris[0], "w:tc").length;
    const kolom = header - 1;
    const labelCPMK = payload.struktur.cpmk.length > kolom
      ? [...payload.struktur.cpmk.slice(0, kolom - 1).map((cpmk) => cpmk.kode), `${payload.struktur.cpmk[kolom - 1]?.kode ?? "CPMK"}+`]
      : payload.struktur.cpmk.map((cpmk) => cpmk.kode);
    const headerValues = ["IK-CPL", ...labelCPMK, ...Array.from({ length: Math.max(0, kolom - labelCPMK.length) }, () => "")];
    const headerBaris = teksBaris(baris[0], headerValues);
    const template = baris[1];
    const baru = ikDibebankan.map((indikator) => {
      const nilai = payload.struktur.cpmk.slice(0, kolom).map((cpmk, indeks) => {
        const terpetakan = (payload.struktur.bobotU[cpmk.kode]?.[indikator.kode] ?? 0) > 0;
        if (indeks === kolom - 1 && payload.struktur.cpmk.length > kolom) {
          return payload.struktur.cpmk.slice(kolom - 1).some((item) => (payload.struktur.bobotU[item.kode]?.[indikator.kode] ?? 0) > 0) ? "✓" : "—";
        }
        return terpetakan ? "✓" : "—";
      });
      return teksBaris(klonBaris(template), [indikator.kode, ...nilai, ...Array.from({ length: Math.max(0, kolom - nilai.length) }, () => "")]);
    });
    if (baru.length === 0) baru.push(teksBaris(klonBaris(template), ["—", ...Array.from({ length: kolom }, () => "—")]));
    return gantiBarisTabel(tabel, [headerBaris, ...baru]);
  });

  xml = ubahTabelBertingkatRPS(xml, 0, 4, 1, 3, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const template = baris[0];
    const baru = payload.struktur.sub.map((sub) => teksBaris(klonBaris(template), [`${sub.kode} [${sub.level}]`, sub.deskripsi]));
    if (baru.length === 0) baru.push(teksBaris(klonBaris(template), ["—", "Belum ada Sub-CPMK."]));
    return gantiBarisTabel(tabel, baru);
  });

  xml = ubahTabelBertingkatRPS(xml, 0, 4, 1, 4, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const headerSel = blokXml(baris[0], "w:tc");
    const jumlahSub = headerSel.length - 1;
    const subHeader = payload.struktur.sub.length > jumlahSub
      ? [...payload.struktur.sub.slice(0, jumlahSub - 1).map((sub) => sub.kode), `${payload.struktur.sub[jumlahSub - 1]?.kode ?? "Sub-CPMK"}+`]
      : payload.struktur.sub.map((sub) => sub.kode);
    const header = teksBaris(baris[0], ["CPMK", ...subHeader, ...Array.from({ length: Math.max(0, jumlahSub - subHeader.length) }, () => "")]);
    const template = baris[1];
    const isi = payload.struktur.cpmk.map((cpmk) => {
      const tanda = payload.struktur.sub.slice(0, jumlahSub).map((sub, indeks) => {
        const sesuai = sub.cpmk === cpmk.kode;
        if (indeks === jumlahSub - 1 && payload.struktur.sub.length > jumlahSub) {
          return payload.struktur.sub.slice(jumlahSub - 1).some((item) => item.cpmk === cpmk.kode) ? "✓" : "—";
        }
        return sesuai ? "✓" : "—";
      });
      return teksBaris(klonBaris(template), [cpmk.kode, ...tanda, ...Array.from({ length: Math.max(0, jumlahSub - tanda.length) }, () => "")]);
    });
    if (isi.length === 0) isi.push(teksBaris(klonBaris(template), ["—", ...Array.from({ length: jumlahSub }, () => "—")]));
    return gantiBarisTabel(tabel, [header, ...isi]);
  });

  return ubahTabelBertingkatRPS(xml, 0, 4, 1, 5, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const template = baris[1];
    const isi = payload.struktur.sub.map((sub) => teksBaris(klonBaris(template), [sub.kode, formatAngka(bobotSub(payload, sub.kode))]));
    const total = payload.struktur.sub.reduce((jumlah, sub) => jumlah + bobotSub(payload, sub.kode), 0);
    const akhir = teksBaris(klonBaris(baris[baris.length - 1]), [`Σ = ${formatAngka(total)}%`, formatAngka(total)]);
    return gantiBarisTabel(tabel, [baris[0], ...isi, akhir]);
  });
}

function ubahTabelRPSUmum(xml: string, payload: PayloadGeneratorDokumen): string {
  const { mataKuliah: mk, konfigurasi, struktur } = payload;
  const umum = konfigurasi.umum;
  const tanggal = umum.tanggal ? umum.tanggal.split("-").reverse().join("-") : "—";
  return ubahTabel(xml, 0, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const baru = [...baris];
    baru[1] = teksBaris(baru[1], [mk.nama, mk.kode, umum.rumpun || "—", `T=${umum.sksTeori || "—"}`, `P=${umum.sksPraktik || "—"}`, String(mk.semester ?? "—"), tanggal]);
    baru[3] = teksBaris(baru[3], [null, umum.pengembang || "—", umum.koordinator || "—", umum.kaprodi || "—"]);
    // Cell ini berisi enam tabel bertingkat yang diisi terpisah agar tata letaknya tetap sama.
    baru[5] = teksBaris(baru[5], [null, umum.deskripsi || `Mata kuliah ${mk.nama} membahas capaian dan materi yang tercantum pada RPS. Kegiatan pembelajaran mengikuti jadwal mingguan dan asesmen yang ditetapkan.`]);
    const materi = struktur.sub.map((sub) => konfigurasi.rencanaSub[sub.kode]?.materi?.trim()).filter((item): item is string => Boolean(item));
    baru[6] = teksBaris(baru[6], [null, teksDaftar([...new Set(materi)])]);
    baru[8] = teksBaris(baru[8], [null, teksDaftar(umum.referensiUtama.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))]);
    baru[10] = teksBaris(baru[10], [null, teksDaftar(umum.referensiPendukung.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))]);
    baru[11] = teksBaris(baru[11], [null, mk.dosen || "—"]);
    baru[12] = teksBaris(baru[12], [null, umum.prasyarat || "—"]);
    return gantiBarisTabel(tabel, baru);
  });
}

function barisUjianRPS(baris: string, minggu: string, judul: string): string {
  return teksBaris(baris, [minggu, judul]);
}

function ubahTabelJadwalRPS(xml: string, payload: PayloadGeneratorDokumen): string {
  const { struktur, konfigurasi } = payload;
  return ubahTabel(xml, 1, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const barisSub = baris[3];
    const mid = konfigurasi.tugasRubrik.mid;
    const post = konfigurasi.tugasRubrik.post;
    const kegiatan: Array<{ minggu: number; urutan: number; prioritas: number; baris: string }> = [];
    struktur.sub.forEach((sub, indeks) => {
      const rencana = konfigurasi.rencanaSub[sub.kode];
      const isi = [
        rencana?.pertemuan || "—",
        `${sub.kode}: ${sub.deskripsi}${sub.level ? ` [${sub.level}]` : ""}`,
        rencana?.indikator || `Ketepatan mencapai capaian ${sub.kode}.`,
        rencana?.kriteria || "Pedoman penskoran dan rubrik analitik; penilaian hasil kerja mahasiswa.",
        rencana?.tatapMuka || "Kuliah dan/atau praktikum tatap muka; metode demonstrasi dan praktik terbimbing.",
        rencana?.daring || "Kelas sinkron daring dan praktikum berbasis perangkat lunak.",
        rencana?.materi || sub.deskripsi,
        formatAngka(bobotSub(payload, sub.kode)),
      ];
      kegiatan.push({
        minggu: angkaMingguPertama(rencana?.pertemuan, indeks + 1),
        urutan: indeks,
        prioritas: 0,
        baris: teksBaris(klonBaris(barisSub), isi),
      });
    });
    kegiatan.push({
      minggu: Number(mingguDariJadwal(mid.jadwal, "8")),
      urutan: struktur.sub.length,
      prioritas: 1,
      baris: barisUjianRPS(baris[7], mingguDariJadwal(mid.jadwal, "8"), konfigurasi.rpsUjian?.mid ?? `Mid Test: ${mid.indikator}`),
    });
    kegiatan.push({
      minggu: Number(mingguDariJadwal(post.jadwal, "16")),
      urutan: struktur.sub.length + 1,
      prioritas: 1,
      baris: barisUjianRPS(baris[12], mingguDariJadwal(post.jadwal, "16"), konfigurasi.rpsUjian?.post ?? `Post Test: ${post.indikator}`),
    });
    kegiatan.sort((a, b) => a.minggu - b.minggu || a.prioritas - b.prioritas || a.urutan - b.urutan);
    return gantiBarisTabel(tabel, [...baris.slice(0, 3), ...kegiatan.map((item) => item.baris)]);
  });
}

function angkaMingguPertama(jadwal: string | undefined, cadangan: number): number {
  const minggu = jadwal?.match(/\d+/)?.[0];
  return minggu ? Number(minggu) : cadangan;
}

function mingguDariJadwal(jadwal: string, cadangan: string): string {
  const cocok = jadwal.match(/(?:minggu|pertemuan)\s*(?:ke[- ]?)?(\d+)/i);
  return cocok?.[1] ?? cadangan;
}

function barisRubrikUmum(isi: string): string[] {
  const awalan = isi.trim() || "Capaian pembelajaran";
  return [
    `Seluruh indikator ${awalan} tercapai secara tepat, lengkap, mandiri, dan didukung bukti kerja yang benar.`,
    `Sebagian besar indikator ${awalan} tercapai; terdapat kekurangan kecil yang tidak mengubah hasil utama.`,
    `Sebagian indikator ${awalan} tercapai, tetapi masih ada kesalahan penting atau analisis belum lengkap.`,
    `Pencapaian ${awalan} masih terbatas; banyak kesalahan dan hasil memerlukan perbaikan besar.`,
    `Belum menunjukkan bukti capaian ${awalan} yang memadai atau pekerjaan tidak diselesaikan.`,
  ];
}

function tingkatKriteria(payload: PayloadGeneratorDokumen, kodeSub: string, limaTingkat: boolean): string[] {
  const sub = payload.struktur.sub.find((item) => item.kode === kodeSub);
  const indikator = payload.konfigurasi.rencanaSub[kodeSub]?.indikator?.trim() || sub?.deskripsi || "indikator Sub-CPMK";
  const tingkat = [
    `Mencapai seluruh aspek indikator ${indikator} dengan tepat, lengkap, dan mandiri.`,
    `Mencapai sebagian besar aspek indikator ${indikator} dengan kekurangan kecil.`,
    `Mencapai sebagian aspek indikator ${indikator}; masih terdapat kesalahan penting.`,
    `Pencapaian indikator ${indikator} terbatas dan pekerjaan memerlukan banyak perbaikan.`,
    `Belum menunjukkan bukti pencapaian indikator ${indikator} yang memadai.`,
  ];
  if (limaTingkat) return tingkat;
  return [
    tingkat[0],
    tingkat[1],
    tingkat[2],
    `${tingkat[3]} Bukti pencapaian belum memadai.`,
  ];
}

function kriteriaKategori(payload: PayloadGeneratorDokumen, kategori: KategoriRubrik): RubrikBaris[] {
  const subs = daftarSubKategori(payload, kategori);
  return subs.flatMap((sub) => {
    const detail = payload.konfigurasi.rubrikDetail?.[kategori]?.[sub.kode];
    if (detail?.length) return detail.map((item) => ({ ...item }));
    return [{
      indikator: `${sub.kode}: ${payload.konfigurasi.rencanaSub[sub.kode]?.indikator?.trim() || sub.deskripsi}`,
      bobot: payload.konfigurasi.bobotRubrik[sub.kode]?.[kategori] ?? 0,
      tingkat: tingkatKriteria(payload, sub.kode, kategori === "kuis"),
    }];
  });
}

function barisRubrikDetail(template: string, kriteria: RubrikBaris, nomor: number, jumlahKolomTingkat: number): string {
  const tingkat = kriteria.tingkat.slice(0, jumlahKolomTingkat);
  const isi = [String(nomor), kriteria.indikator, formatPersen(kriteria.bobot), ...tingkat];
  return teksBaris(klonBaris(template), isi);
}

function ubahTabelRubrikPembelajaran(xml: string, payload: PayloadGeneratorDokumen): string {
  const bobotTotal = payload.struktur.sub.reduce((jumlah, sub) => jumlah + bobotSub(payload, sub.kode), 0);
  xml = ubahTabel(xml, 0, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const template = baris[1];
    const isi = payload.struktur.sub.map((sub, indeks) => teksBaris(klonBaris(template), [
      sub.kode,
      sub.deskripsi,
      materiSub(payload, sub.kode),
      formatPersen(bobotSub(payload, sub.kode)),
    ]));
    const total = teksBaris(klonBaris(baris[baris.length - 1]), ["Total", "", "", formatPersen(bobotTotal)]);
    return gantiBarisTabel(tabel, [baris[0], ...isi, total]);
  });

  return ubahTabel(xml, 1, (tabel) => {
    const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
    const template = baris[1];
    const isi = payload.struktur.sub.map((sub) => teksBaris(klonBaris(template), [
      sub.kode,
      ...KATEGORI_RUBRIK.map((kategori) => formatPersen(payload.konfigurasi.bobotRubrik[sub.kode]?.[kategori] ?? 0)),
      formatPersen(bobotSub(payload, sub.kode)),
    ]));
    const jumlahKategori = KATEGORI_RUBRIK.map((kategori) => formatPersen(bobotKategori(payload, kategori)));
    const total = teksBaris(klonBaris(baris[baris.length - 1]), ["Total", ...jumlahKategori, formatPersen(bobotTotal)]);
    return gantiBarisTabel(tabel, [baris[0], ...isi, total]);
  });
}

function teksSubCPMK(subKode: string, payload: PayloadGeneratorDokumen): string {
  const sub = payload.struktur.sub.find((item) => item.kode === subKode);
  if (!sub) return "Belum ada Sub-CPMK yang dibebankan pada komponen ini.";
  return payload.konfigurasi.rencanaSub[subKode]?.indikator?.trim() || sub.deskripsi;
}

function kategoriTugas(payload: PayloadGeneratorDokumen, kategori: KategoriRubrik): RencanaTugasSiap {
  const konfigurasi = payload.konfigurasi.tugasRubrik[kategori];
  const subs = daftarSubKategori(payload, kategori);
  const kodeSubs = subs.map((item) => item.kode);
  const deskripsi = kodeSubs.map((kode) => teksSubCPMK(kode, payload));
  const total = bobotKategori(payload, kategori);
  return {
    ...konfigurasi,
    judul: konfigurasi.judul || `${LABEL_KATEGORI_RUBRIK[kategori]} ${payload.mataKuliah.nama}`,
    bentuk: konfigurasi.bentuk || `Penilaian ${LABEL_KATEGORI_RUBRIK[kategori].toLowerCase()} sesuai capaian mata kuliah.`,
    waktu: konfigurasi.waktu || "Sesuai jadwal pembelajaran dan ketentuan pada RPS.",
    deskripsi: konfigurasi.deskripsi || `Kegiatan ini menilai capaian ${kodeSubs.join(", ") || "Sub-CPMK yang ditetapkan"}.`,
    metode: konfigurasi.metode || "Dikerjakan sesuai bentuk asesmen dan petunjuk dosen pengampu. Hasil kerja dikumpulkan melalui LMS atau media yang ditetapkan.",
    luaran: konfigurasi.luaran || "Hasil kerja mahasiswa sesuai bentuk asesmen, disertai penjelasan atau laporan bila diperlukan.",
    indikator: konfigurasi.indikator || deskripsi.map((item) => `Ketepatan dan kelengkapan: ${item}`).join("\n") || "Belum ada Sub-CPMK yang dibebankan.",
    jadwal: konfigurasi.jadwal || "Mengikuti jadwal pertemuan yang tercantum pada RPS.",
    lain: konfigurasi.lain || "Ketentuan teknis dan susulan mengikuti kebijakan dosen pengampu dan program studi.",
    bobot: total,
    kodeSubs,
  };
}

function labelDanNomorTugas(kategori: KategoriRubrik): [string, string] {
  if (kategori === "laporan") return ["Tugas ke", "1 – Laporan Praktikum (Eval-1 s.d. Eval-7 pada RPS)"];
  if (kategori === "proyek") return ["Tugas ke", "2 – Mini Project Kelompok (Eval-8 pada RPS)"];
  if (kategori === "kuis") return ["Kuis ke", "1–3 (bagian kuis dari Eval-1, Eval-3, dan Eval-5 pada RPS)"];
  if (kategori === "mid") return ["Evaluasi ke", "1 (Mid Test)"];
  return ["Evaluasi ke", "2 (Post Test)"];
}

function ubahTabelRencanaTugas(xml: string, payload: PayloadGeneratorDokumen): string {
  for (const kategori of KATEGORI_RUBRIK) {
    const tugas = kategoriTugas(payload, kategori);
    const indeks = INDEKS_TUGAS[kategori];
    xml = ubahTabel(xml, indeks, (tabel) => {
      const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
      const baru = [...baris];
      const [labelKe, nomorKe] = labelDanNomorTugas(kategori);
      baru[2] = teksBaris(baru[2], [null, payload.mataKuliah.nama]);
      baru[3] = teksBaris(baru[3], [null, payload.mataKuliah.kode, null, `T = ${payload.konfigurasi.umum.sksTeori || "—"}, P = ${payload.konfigurasi.umum.sksPraktik || "—"}`, null, String(payload.mataKuliah.semester ?? "—")]);
      baru[4] = teksBaris(baru[4], [null, payload.mataKuliah.dosen || "—"]);
      baru[5] = teksBaris(baru[5], [labelKe, nomorKe]);
      baru[7] = teksBaris(baru[7], [`Mendukung pencapaian ${tugas.kodeSubs.length ? tugas.kodeSubs.join(", ") : "Sub-CPMK sesuai RPS"}`]);
      baru[9] = teksBaris(baru[9], [tugas.bentuk, tugas.waktu]);
      baru[11] = teksBaris(baru[11], [tugas.judul]);
      baru[13] = teksBaris(baru[13], [tugas.deskripsi]);
      baru[15] = teksBaris(baru[15], [tugas.metode]);
      baru[17] = teksBaris(baru[17], [tugas.luaran]);
      baru[19] = teksBaris(baru[19], [tugas.indikator]);
      baru[20] = teksBaris(baru[20], [null, formatPersen(tugas.bobot)]);
      baru[22] = teksBaris(baru[22], [tugas.jadwal]);
      baru[24] = teksBaris(baru[24], [tugas.lain]);
      const referensi = [payload.konfigurasi.umum.referensiUtama, payload.konfigurasi.umum.referensiPendukung].filter(Boolean).join("\n");
      baru[26] = teksBaris(baru[26], [referensi || "—"]);
      return gantiBarisTabel(tabel, baru);
    });
  }
  return xml;
}

function ubahTabelRubrikDeskripsi(xml: string, payload: PayloadGeneratorDokumen): string {
  for (const kategori of KATEGORI_RUBRIK) {
    const indeks = INDEKS_RUBRIK_UMUM[kategori];
    const sub = daftarSubKategori(payload, kategori);
    const ringkas = sub.length > 0
      ? sub.map((item) => item.kode).join(", ")
      : `komponen ${LABEL_KATEGORI_RUBRIK[kategori]}`;
    xml = ubahTabel(xml, indeks, (tabel) => {
      const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
      const teks = payload.konfigurasi.rubrikUmum?.[kategori]?.length
        ? payload.konfigurasi.rubrikUmum[kategori]!
        : barisRubrikUmum(ringkas);
      const deskripsi = teksBaris(baris[2], ["Deskripsi Umum", ...teks]);
      return gantiBarisTabel(tabel, [baris[0], baris[1], deskripsi]);
    });
  }
  return xml;
}

function ubahTabelRubrikDetail(xml: string, payload: PayloadGeneratorDokumen): string {
  for (const kategori of KATEGORI_RUBRIK) {
    const indeks = INDEKS_RUBRIK_DETAIL[kategori];
    const kriteria = kriteriaKategori(payload, kategori);
    xml = ubahTabel(xml, indeks, (tabel) => {
      const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
      const jumlahKolomTingkat = Math.max(0, blokXml(baris[0], "w:tc").length - 3);
      const data = kriteria.length > 0
        ? kriteria.map((item, i) => barisRubrikDetail(baris[1], item, i + 1, jumlahKolomTingkat))
        : [teksBaris(klonBaris(baris[1]), ["—", "Tidak ada Sub-CPMK yang dibebankan pada komponen ini.", "0%", ...Array.from({ length: jumlahKolomTingkat }, () => "—")])];
      return gantiBarisTabel(tabel, [baris[0], ...data]);
    });
  }
  return xml;
}

function ubahLembarSkor(xml: string, payload: PayloadGeneratorDokumen): string {
  for (const kategori of KATEGORI_RUBRIK) {
    const indeks = INDEKS_LEMBAR_SKOR[kategori];
    const kriteria = kriteriaKategori(payload, kategori);
    xml = ubahTabel(xml, indeks, (tabel) => {
      const baris = blokXml(tabel, "w:tr").map((rentang) => isiBlok(tabel, rentang));
      const awalan = baris.slice(0, 3);
      const akhiran = baris.slice(-2);
      const template = baris[3];
      const data = kriteria.length > 0
        ? kriteria.map((item, i) => teksBaris(klonBaris(template), [String(i + 1), item.indikator]))
        : [teksBaris(klonBaris(template), ["—", "Belum ada Sub-CPMK yang dibebankan pada komponen ini."])];
      return gantiBarisTabel(tabel, [...awalan, ...data, ...akhiran]);
    });
  }
  return xml;
}

function ubahJudulDokumenRubrik(xml: string, payload: PayloadGeneratorDokumen): string {
  const paragraf = blokXml(xml, "w:p");
  for (let i = paragraf.length - 1; i >= 0; i--) {
    const bagian = isiBlok(xml, paragraf[i]);
    if (!bagian.includes("Rencana Penilaian")) continue;
    const baru = teksParagraph(bagian, `Rencana Penilaian & Evaluasi – ${payload.mataKuliah.nama}`);
    xml = gantiBlok(xml, paragraf[i], baru);
    break;
  }
  return xml;
}

export function buatDokumen(payload: PayloadGeneratorDokumen, templat: Buffer): Buffer {
  const entri = bacaDocx(templat);
  const dokumen = entri.find((item) => item.nama === "word/document.xml");
  if (!dokumen) throw new Error("Isi utama tidak ditemukan pada templat DOCX.");
  let xml = isiEntriDocx(dokumen).toString("utf8");

  if (payload.jenis === "rps") {
    xml = ubahTabelRPSUmum(xml, payload);
    xml = ubahTabelCapaianRPS(xml, payload);
    xml = ubahTabelJadwalRPS(xml, payload);
  } else {
    xml = ubahJudulDokumenRubrik(xml, payload);
    xml = ubahTabelRubrikPembelajaran(xml, payload);
    xml = ubahTabelRencanaTugas(xml, payload);
    xml = ubahTabelRubrikDeskripsi(xml, payload);
    xml = ubahTabelRubrikDetail(xml, payload);
    xml = ubahLembarSkor(xml, payload);
  }

  isiEntriBaru(dokumen, Buffer.from(xml, "utf8"));
  return tulisDocx(entri);
}
