import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PayloadGeneratorDokumen } from "@/app/lib/dokumen";
import { buatDokumen } from "@/app/lib/docx-generator";

export const runtime = "nodejs";

function namaDokumen(payload: PayloadGeneratorDokumen): string {
  const nama = payload.mataKuliah.nama.replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").trim().replace(/\s+/g, "-");
  return `${payload.mataKuliah.kode}-${payload.jenis === "rps" ? "RPS" : "Rubrik"}-${nama || "Mata-Kuliah"}.docx`;
}

function jumlahBobot(payload: PayloadGeneratorDokumen): number {
  return payload.struktur.sub.reduce((total, sub) => {
    const bobot = payload.konfigurasi.bobotRubrik[sub.kode];
    return total + (bobot ? Object.values(bobot).reduce((jumlah, nilai) => jumlah + Number(nilai || 0), 0) : 0);
  }, 0);
}

function validasi(payload: PayloadGeneratorDokumen): string | null {
  if (!payload || (payload.jenis !== "rps" && payload.jenis !== "rubrik")) return "Jenis dokumen tidak dikenali.";
  if (!payload.mataKuliah?.kode || !payload.mataKuliah?.nama) return "Data mata kuliah belum lengkap.";
  if (!payload.struktur?.cpmk?.length || !payload.struktur?.sub?.length) return "Tambahkan CPMK dan Sub-CPMK sebelum membuat dokumen.";
  if (!payload.konfigurasi?.umum || !payload.konfigurasi?.bobotRubrik) return "Lengkapi informasi dokumen dan bobot penilaian terlebih dahulu.";
  if (!Array.isArray(payload.cpl) || !Array.isArray(payload.ik) || !payload.pemetaanKurikulum) return "Data CPL, IK, atau peta kurikulum belum tersedia.";
  if (payload.struktur.sub.some((sub) => !payload.struktur.cpmk.some((cpmk) => cpmk.kode === sub.cpmk))) {
    return "Setiap Sub-CPMK harus terhubung ke CPMK sebelum dokumen dibuat.";
  }
  const bobotTidakValid = payload.struktur.sub.some((sub) =>
    Object.values(payload.konfigurasi.bobotRubrik[sub.kode] ?? {}).some((nilai) => {
      const angka = Number(nilai);
      return !Number.isFinite(angka) || angka < 0 || angka > 100;
    }),
  );
  if (bobotTidakValid) return "Setiap bobot komponen harus berupa angka antara 0 dan 100%.";
  const total = jumlahBobot(payload);
  if (Math.abs(total - 100) > 0.01) return `Total bobot rubrik saat ini ${total.toFixed(2)}%. Atur total bobot menjadi 100% sebelum membuat dokumen.`;
  if (payload.jenis === "rps") {
    const teori = Number(payload.konfigurasi.umum.sksTeori);
    const praktik = Number(payload.konfigurasi.umum.sksPraktik);
    if (!Number.isFinite(teori) || !Number.isFinite(praktik) || teori < 0 || praktik < 0 || teori + praktik !== payload.mataKuliah.sks) {
      return `Jumlah SKS teori dan praktik harus sama dengan total SKS mata kuliah (${payload.mataKuliah.sks}).`;
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PayloadGeneratorDokumen;
    const pesanValidasi = validasi(payload);
    if (pesanValidasi) return Response.json({ error: pesanValidasi }, { status: 422 });

    const pathTemplat = path.join(process.cwd(), "public", "document-templates", `${payload.jenis}.docx`);
    const templat = await readFile(pathTemplat);
    const berkas = buatDokumen(payload, templat);
    const fileName = namaDokumen(payload);
    const fileNameFallback = fileName.replace(/[^\x20-\x7E]/g, "_");
    return new Response(new Uint8Array(berkas), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileNameFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const pesan = error instanceof Error ? error.message : "Dokumen gagal dibuat.";
    return Response.json({ error: pesan }, { status: 500 });
  }
}
