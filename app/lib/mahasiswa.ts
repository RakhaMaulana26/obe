import { DAFTAR_KELAS, type Mahasiswa, type NilaiMap } from "./data";

/** Pecah satu baris CSV; mendukung sel berkutip ("Budi, S.") dan kutip ganda di dalamnya (""). */
function pecahBaris(baris: string, pemisah: string): string[] {
  const sel: string[] = [];
  let isi = "";
  let dalamKutip = false;
  for (let i = 0; i < baris.length; i++) {
    const ch = baris[i];
    if (dalamKutip) {
      if (ch === '"' && baris[i + 1] === '"') { isi += '"'; i++; }
      else if (ch === '"') dalamKutip = false;
      else isi += ch;
    } else if (ch === '"') dalamKutip = true;
    else if (ch === pemisah) { sel.push(isi.trim()); isi = ""; }
    else isi += ch;
  }
  sel.push(isi.trim());
  return sel;
}

/**
 * Baca CSV mahasiswa dengan header NRP, Nama, Kelas (urutan bebas, tidak peka huruf besar).
 * Pemisah koma atau titik koma (Excel berbahasa Indonesia) dideteksi dari baris header; BOM dibuang.
 */
export function parseCSVMahasiswa(teks: string): { data: Mahasiswa[]; galat: string[] } {
  const baris = teks.replace(/^﻿/, "").split(/\r?\n/);
  const header = baris[0] ?? "";
  const pemisah = (header.match(/;/g)?.length ?? 0) > (header.match(/,/g)?.length ?? 0) ? ";" : ",";
  const kolom = pecahBaris(header, pemisah).map((k) => k.toLowerCase());
  const iNrp = kolom.indexOf("nrp");
  const iNama = kolom.indexOf("nama");
  const iKelas = kolom.indexOf("kelas");

  const hilang = [iNrp < 0 && "NRP", iNama < 0 && "Nama", iKelas < 0 && "Kelas"].filter(Boolean);
  if (hilang.length > 0) return { data: [], galat: [`Header wajib memuat kolom ${hilang.join(", ")}`] };

  const data: Mahasiswa[] = [];
  const galat: string[] = [];
  const nrpTerpakai = new Set<string>();
  const kelasValid = new Set<string>(DAFTAR_KELAS);

  baris.slice(1).forEach((isi, indeks) => {
    if (isi.trim() === "") return;
    const nomor = indeks + 2;
    const sel = pecahBaris(isi, pemisah);
    const nrp = sel[iNrp] ?? "";
    const nama = sel[iNama] ?? "";
    const kelas = (sel[iKelas] ?? "").toUpperCase();
    if (!nrp) return void galat.push(`Baris ${nomor}: NRP kosong`);
    if (!nama) return void galat.push(`Baris ${nomor}: nama kosong`);
    if (!kelasValid.has(kelas)) return void galat.push(`Baris ${nomor}: kelas "${sel[iKelas] ?? ""}" tidak dikenal`);
    if (nrpTerpakai.has(nrp)) return void galat.push(`Baris ${nomor}: NRP ${nrp} sudah ada`);
    nrpTerpakai.add(nrp);
    data.push({ nrp, nama, kelas });
  });
  return { data, galat };
}

/** Buang nilai satu NRP dari semua penawaran, agar mahasiswa yang dihapus tidak ikut statistik. */
export function hapusNilaiMahasiswa(nilaiOffering: Record<string, NilaiMap>, nrp: string): Record<string, NilaiMap> {
  return Object.fromEntries(
    Object.entries(nilaiOffering).map(([kunci, peta]) => {
      const salin = { ...peta };
      delete salin[nrp];
      return [kunci, salin];
    }),
  );
}

/** Data mahasiswa dari localStorage: hanya entri berbentuk { nrp, nama, kelas } bertipe string yang dipakai. */
export function daftarMahasiswaValid(x: unknown): Mahasiswa[] {
  if (!Array.isArray(x)) return [];
  return x.filter((m): m is Mahasiswa =>
    Boolean(m) && typeof m === "object" && typeof m.nrp === "string" && typeof m.nama === "string" && typeof m.kelas === "string");
}
