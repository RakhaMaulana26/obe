import { deflateRawSync, inflateRawSync } from "node:zlib";

interface EntriZip {
  nama: string;
  versiPembuat: number;
  versiEkstrak: number;
  bendera: number;
  metode: number;
  waktu: number;
  tanggal: number;
  crc: number;
  ukuranAsli: number;
  dataKompres: Buffer;
  dataLokalEkstra: Buffer;
  dataPusatEkstra: Buffer;
  komentar: Buffer;
  nomorDisk: number;
  atributDalam: number;
  atributLuar: number;
  dataBaru?: Buffer;
}

const TANDA_PUSAT = 0x02014b50;
const TANDA_LOKAL = 0x04034b50;
const TANDA_AKHIR = 0x06054b50;

const TABEL_CRC = (() => {
  const tabel = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let bit = 0; bit < 8; bit++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    tabel[n] = c >>> 0;
  }
  return tabel;
})();

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = TABEL_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function cariAkhirZip(data: Buffer): number {
  const minimum = Math.max(0, data.length - 22 - 0xffff);
  for (let posisi = data.length - 22; posisi >= minimum; posisi--) {
    if (data.readUInt32LE(posisi) === TANDA_AKHIR) return posisi;
  }
  throw new Error("Berkas DOCX tidak memiliki penanda ZIP yang valid.");
}

export function bacaDocx(data: Buffer): EntriZip[] {
  const akhir = cariAkhirZip(data);
  const jumlah = data.readUInt16LE(akhir + 10);
  const awalPusat = data.readUInt32LE(akhir + 16);
  const entri: EntriZip[] = [];
  let posisi = awalPusat;

  for (let i = 0; i < jumlah; i++) {
    if (data.readUInt32LE(posisi) !== TANDA_PUSAT) throw new Error("Struktur direktori DOCX tidak valid.");
    const versiPembuat = data.readUInt16LE(posisi + 4);
    const versiEkstrak = data.readUInt16LE(posisi + 6);
    const bendera = data.readUInt16LE(posisi + 8);
    const metode = data.readUInt16LE(posisi + 10);
    const waktu = data.readUInt16LE(posisi + 12);
    const tanggal = data.readUInt16LE(posisi + 14);
    const crc = data.readUInt32LE(posisi + 16);
    const ukuranKompres = data.readUInt32LE(posisi + 20);
    const ukuranAsli = data.readUInt32LE(posisi + 24);
    const panjangNama = data.readUInt16LE(posisi + 28);
    const panjangEkstra = data.readUInt16LE(posisi + 30);
    const panjangKomentar = data.readUInt16LE(posisi + 32);
    const nomorDisk = data.readUInt16LE(posisi + 34);
    const atributDalam = data.readUInt16LE(posisi + 36);
    const atributLuar = data.readUInt32LE(posisi + 38);
    const offsetLokal = data.readUInt32LE(posisi + 42);
    const awalNama = posisi + 46;
    const nama = data.subarray(awalNama, awalNama + panjangNama).toString("utf8");
    const dataPusatEkstra = data.subarray(awalNama + panjangNama, awalNama + panjangNama + panjangEkstra);
    const komentar = data.subarray(awalNama + panjangNama + panjangEkstra, awalNama + panjangNama + panjangEkstra + panjangKomentar);

    if ((bendera & 1) !== 0) throw new Error("DOCX terenkripsi tidak didukung.");
    if (ukuranKompres === 0xffffffff || ukuranAsli === 0xffffffff || offsetLokal === 0xffffffff) {
      throw new Error("DOCX berformat ZIP64 tidak didukung.");
    }
    if (data.readUInt32LE(offsetLokal) !== TANDA_LOKAL) throw new Error("Data lokal DOCX tidak valid.");
    const panjangNamaLokal = data.readUInt16LE(offsetLokal + 26);
    const panjangEkstraLokal = data.readUInt16LE(offsetLokal + 28);
    const awalData = offsetLokal + 30 + panjangNamaLokal + panjangEkstraLokal;
    const dataKompres = data.subarray(awalData, awalData + ukuranKompres);
    const dataLokalEkstra = data.subarray(offsetLokal + 30 + panjangNamaLokal, awalData);

    entri.push({
      nama,
      versiPembuat,
      versiEkstrak,
      bendera,
      metode,
      waktu,
      tanggal,
      crc,
      ukuranAsli,
      dataKompres,
      dataLokalEkstra,
      dataPusatEkstra,
      komentar,
      nomorDisk,
      atributDalam,
      atributLuar,
    });
    posisi = awalNama + panjangNama + panjangEkstra + panjangKomentar;
  }
  return entri;
}

export function isiEntriDocx(entri: EntriZip): Buffer {
  if (entri.metode === 0) return Buffer.from(entri.dataKompres);
  if (entri.metode === 8) return inflateRawSync(entri.dataKompres);
  throw new Error(`Metode kompresi DOCX tidak didukung: ${entri.metode}.`);
}

export function isiEntriBaru(entri: EntriZip, data: Buffer): void {
  entri.dataBaru = data;
}

export function tulisDocx(daftar: EntriZip[]): Buffer {
  const lokal: Buffer[] = [];
  const pusat: Buffer[] = [];
  let offset = 0;

  for (const entri of daftar) {
    const nama = Buffer.from(entri.nama, "utf8");
    const dataAsli = entri.dataBaru;
    const dataKompres = dataAsli ? deflateRawSync(dataAsli) : entri.dataKompres;
    const metode = dataAsli ? 8 : entri.metode;
    const ukuranAsli = dataAsli ? dataAsli.length : entri.ukuranAsli;
    const crc = dataAsli ? crc32(dataAsli) : entri.crc;
    const bendera = entri.bendera & ~0x0008;
    const ekstraLokal = entri.dataLokalEkstra;
    const headerLokal = Buffer.alloc(30);
    headerLokal.writeUInt32LE(TANDA_LOKAL, 0);
    headerLokal.writeUInt16LE(entri.versiEkstrak, 4);
    headerLokal.writeUInt16LE(bendera, 6);
    headerLokal.writeUInt16LE(metode, 8);
    headerLokal.writeUInt16LE(entri.waktu, 10);
    headerLokal.writeUInt16LE(entri.tanggal, 12);
    headerLokal.writeUInt32LE(crc, 14);
    headerLokal.writeUInt32LE(dataKompres.length, 18);
    headerLokal.writeUInt32LE(ukuranAsli, 22);
    headerLokal.writeUInt16LE(nama.length, 26);
    headerLokal.writeUInt16LE(ekstraLokal.length, 28);
    lokal.push(headerLokal, nama, ekstraLokal, dataKompres);

    const headerPusat = Buffer.alloc(46);
    headerPusat.writeUInt32LE(TANDA_PUSAT, 0);
    headerPusat.writeUInt16LE(entri.versiPembuat, 4);
    headerPusat.writeUInt16LE(entri.versiEkstrak, 6);
    headerPusat.writeUInt16LE(bendera, 8);
    headerPusat.writeUInt16LE(metode, 10);
    headerPusat.writeUInt16LE(entri.waktu, 12);
    headerPusat.writeUInt16LE(entri.tanggal, 14);
    headerPusat.writeUInt32LE(crc, 16);
    headerPusat.writeUInt32LE(dataKompres.length, 20);
    headerPusat.writeUInt32LE(ukuranAsli, 24);
    headerPusat.writeUInt16LE(nama.length, 28);
    headerPusat.writeUInt16LE(entri.dataPusatEkstra.length, 30);
    headerPusat.writeUInt16LE(entri.komentar.length, 32);
    headerPusat.writeUInt16LE(entri.nomorDisk, 34);
    headerPusat.writeUInt16LE(entri.atributDalam, 36);
    headerPusat.writeUInt32LE(entri.atributLuar, 38);
    headerPusat.writeUInt32LE(offset, 42);
    pusat.push(headerPusat, nama, entri.dataPusatEkstra, entri.komentar);
    offset += headerLokal.length + nama.length + ekstraLokal.length + dataKompres.length;
  }

  const pusatBuffer = Buffer.concat(pusat);
  const akhir = Buffer.alloc(22);
  akhir.writeUInt32LE(TANDA_AKHIR, 0);
  akhir.writeUInt16LE(0, 4);
  akhir.writeUInt16LE(0, 6);
  akhir.writeUInt16LE(daftar.length, 8);
  akhir.writeUInt16LE(daftar.length, 10);
  akhir.writeUInt32LE(pusatBuffer.length, 12);
  akhir.writeUInt32LE(offset, 16);
  akhir.writeUInt16LE(0, 20);
  return Buffer.concat([...lokal, pusatBuffer, akhir]);
}
