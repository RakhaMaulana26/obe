"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { bacaDataTersimpan, useApp, kunciOffering, offeringTerbaru } from "@/app/lib/store";
import {
  AMBANG_DEFAULT,
  DAFTAR_CPL,
  DAFTAR_IK,
  type CPL,
  type IK,
} from "@/app/lib/data";
import { hitungSemua, rataRata } from "@/app/lib/hitung";
import { BadgeHuruf, BadgeStatus, Card, EmptyState, PageHeading, inputCls } from "@/app/components/ui";
import Tabs from "@/app/components/reactbits/Tabs";

// ------------------------------------------------------------------
// Hirarki capaian terukur: CPL → IK → CPMK → Sub-CPMK.
// Kartu berukuran tetap sehingga konektor SVG bisa dihitung
// tanpa mengukur DOM.
// ------------------------------------------------------------------

const CARD_W = 230;
const CARD_H = 156;
const H_GAP = 18;
const ROW_GAP = 20;
const MAX_PER_ROW = 10;
const CANVAS_PAD = 24;
const V_GAP = 76; // jarak vertikal antar jenjang (ruang kurva konektor)
const LABEL_H = 44; // tinggi label jenjang

type Level = 0 | 1 | 2 | 3;

interface Simpul {
  id: string;
  kode: string;
  level: Level;
  judul: string;
  meta: string;
  kelola: string;
  isDummy?: boolean;
  /** Penjelasan manusiawi untuk tooltip (bobot → kontribusi %). */
  penjelas?: string;
}

const LEVEL_LABEL: Record<Level, string> = {
  0: "CPL",
  1: "Indikator Kinerja",
  2: "CPMK",
  3: "Sub-CPMK",
};

// Garis kiri kartu membedakan jenjang tanpa ikon tambahan.
const LEVEL_GARIS: Record<Level, string> = {
  0: "border-l-primary",
  1: "border-l-accent",
  2: "border-l-primary/50",
  3: "border-l-line",
};

function bacaLS<T>(kunci: string, fallback: T): T {
  return bacaDataTersimpan(kunci, fallback);
}

function warnaBar(skor: number, ambang: number): string {
  if (skor < ambang) return "bg-danger";
  if (ambang < 80 && skor < 80) return "bg-warning";
  return "bg-success";
}

function KartuSimpul({
  simpul,
  skor,
  aktif,
  ambang,
}: {
  simpul: Simpul;
  skor?: number;
  aktif: boolean;
  ambang: number;
}) {
  const pct = skor === undefined ? 0 : Math.max(0, Math.min(100, skor));
  return (
    <div
      className={`rounded-md border border-l-[3px] border-line bg-white p-3 ${LEVEL_GARIS[simpul.level]} ${aktif ? "" : "opacity-35"}`}
      style={{ height: CARD_H, width: CARD_W }}
      title={`${simpul.kode}: ${simpul.judul}. ${simpul.penjelas ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold tabular-nums text-primary">{simpul.kode}</p>
        {simpul.isDummy ? (
          <span title="Deskripsi atau pemetaan simpul ini masih berupa data contoh." className="shrink-0 rounded bg-warning-bg px-1.5 py-0.5 text-xs font-bold text-warning">Demo</span>
        ) : null}
        <Link
          href={simpul.kelola}
          title={`Kelola ${simpul.kode}`}
          className="shrink-0 rounded p-1 text-ink-muted/60 transition-colors hover:bg-paper hover:text-primary"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>

      <p className="mt-1.5 line-clamp-2 min-h-9 text-sm font-semibold leading-snug text-ink">{simpul.judul}</p>
      <p className="mt-0.5 truncate text-xs text-ink-muted">{simpul.meta}</p>

      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
          <div className={`h-full rounded-full ${warnaBar(pct, ambang)}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="tabular-nums text-xs font-bold text-ink">{skor === undefined ? "—" : skor.toFixed(0)}</span>
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span className="tabular-nums text-xs text-ink-muted">
          {skor === undefined ? "belum ada skor" : `skor ${skor.toFixed(2)}`}
        </span>
        {skor === undefined ? null : (
          <span className="flex items-center gap-1.5">
            <BadgeHuruf skor={skor} />
            <BadgeStatus tercapai={skor >= ambang} />
          </span>
        )}
      </div>
    </div>
  );
}

export default function HirarkiPage() {
  const { nilaiUntuk, strukturUntuk, mataKuliah } = useApp();
  const penawaranDefault = offeringTerbaru(mataKuliah);
  const [filterKey, setFilterKey] = useState<string>("");
  const [ambang, setAmbang] = useState<number>(AMBANG_DEFAULT);
  const [mode, setMode] = useState("peta");
  const [jenjangAktif, setJenjangAktif] = useState<Level>(0);
  const [zoom, setZoom] = useState(70);

  const [cplList] = useState<CPL[]>(() => bacaLS("obe-cpl", DAFTAR_CPL));
  const [ikList] = useState<IK[]>(() => bacaLS("obe-ik", DAFTAR_IK));

  const filterKeyAktif = useMemo(() => {
    if (mataKuliah.some((mk) => kunciOffering(mk.kode, mk.tahun, mk.kelas) === filterKey)) return filterKey;
    return penawaranDefault.kode ? kunciOffering(penawaranDefault.kode, penawaranDefault.tahun, penawaranDefault.kelas) : "";
  }, [mataKuliah, filterKey, penawaranDefault.kode, penawaranDefault.tahun, penawaranDefault.kelas]);
  const mkAktif = useMemo(
    () => mataKuliah.find((mk) => kunciOffering(mk.kode, mk.tahun, mk.kelas) === filterKeyAktif),
    [mataKuliah, filterKeyAktif],
  );
  const mataKuliahPerSemester = useMemo(() => {
    const kelompok = new Map<number | null, typeof mataKuliah>();
    for (const mk of mataKuliah) {
      const daftar = kelompok.get(mk.semester) ?? [];
      daftar.push(mk);
      kelompok.set(mk.semester, daftar);
    }
    return [...kelompok.entries()].sort(([semesterA], [semesterB]) => {
      if (semesterA === null) return 1;
      if (semesterB === null) return -1;
      return semesterA - semesterB;
    });
  }, [mataKuliah]);

  // Hitung dan tampilkan hanya struktur serta nilai penawaran yang sedang dipilih.
  const penawaranTampil = useMemo(() => {
    if (!mkAktif) return [];
    const struktur = strukturUntuk(mkAktif.kode);
    const subValid = struktur.sub.filter((sub) => struktur.cpmk.some((cpmk) => cpmk.kode === sub.cpmk));
    const nilai = nilaiUntuk(mkAktif.kode, mkAktif.tahun, mkAktif.kelas);
    const capaian = hitungSemua(nilai, { w: struktur.bobotW, u: struktur.bobotU, rubrik: struktur.rubrik }, subValid, struktur.cpmk);
    return [{
      mk: mkAktif,
      cpmk: struktur.cpmk,
      sub: subValid,
      bobotU: struktur.bobotU,
      skor: {
        cpl: rataRata(capaian, "cpl"),
        ik: rataRata(capaian, "ik"),
        cpmk: rataRata(capaian, "cpmk"),
        sub: rataRata(capaian, "sub"),
      },
    }];
  }, [mkAktif, strukturUntuk, nilaiUntuk]);

  // Relasi induk (DAG): IK←CPL, tiap CPMK←IK pada penawarannya, dan tiap Sub←CPMK.
  const induk = useMemo(() => {
    const p: Record<string, string[]> = {};
    for (const ik of ikList) p[ik.kode] = [ik.cpl];
    for (const item of penawaranTampil) {
      const prefix = kunciOffering(item.mk.kode, item.mk.tahun, item.mk.kelas);
      for (const cpmk of item.cpmk) {
        const id = `${prefix}::${cpmk.kode}`;
        p[id] = ikList.filter((ik) => (item.bobotU[cpmk.kode]?.[ik.kode] ?? 0) > 0).map((ik) => ik.kode);
      }
      for (const sub of item.sub) p[`${prefix}::${sub.kode}`] = [`${prefix}::${sub.cpmk}`];
    }
    return p;
  }, [ikList, penawaranTampil]);

  const aktif = useMemo(() => {
    const hasil = new Set<string>();
    const item = penawaranTampil[0];
    if (!item || !mkAktif) return hasil;
    const cplAktif = new Set(mkAktif.cpl.filter((kode) => cplList.some((cpl) => cpl.kode === kode)));
    const ikAktif = new Set(ikList.filter((ik) => cplAktif.has(ik.cpl)).map((ik) => ik.kode));
    const cpmkAktif = new Set(
      item.cpmk
        .filter((cpmk) => ikList.some((ik) => ikAktif.has(ik.kode) && (item.bobotU[cpmk.kode]?.[ik.kode] ?? 0) > 0))
        .map((cpmk) => cpmk.kode),
    );
    const prefix = kunciOffering(item.mk.kode, item.mk.tahun, item.mk.kelas);
    for (const kode of cplAktif) hasil.add(kode);
    for (const kode of ikAktif) hasil.add(kode);
    for (const kode of cpmkAktif) hasil.add(`${prefix}::${kode}`);
    for (const sub of item.sub) if (cpmkAktif.has(sub.cpmk)) hasil.add(`${prefix}::${sub.kode}`);
    return hasil;
  }, [mkAktif, cplList, ikList, penawaranTampil]);

  const kolom: Simpul[][] = useMemo(() => {
    const cplNodes: Simpul[] = cplList.map((cpl) => ({
      id: cpl.kode,
      kode: cpl.kode,
      level: 0,
      judul: cpl.deskripsiSingkat || cpl.kode,
      meta: `${ikList.filter((ik) => ik.cpl === cpl.kode).length} kemampuan spesifik penopang`,
      kelola: "/cpl",
      penjelas: "Batas akhir perhitungan capaian program studi: agregat dari kemampuan spesifik (IK) di bawahnya.",
    }));
    const ikNodes: Simpul[] = ikList.map((ik) => ({
      id: ik.kode,
      kode: ik.kode,
      level: 1,
      judul: ik.deskripsi,
      meta: `${(ik.z * 100).toFixed(0)}% dari ${ik.cpl}`,
      kelola: "/ik",
      penjelas: `Berkontribusi ${(ik.z * 100).toFixed(0)}% ke ${ik.cpl}.`,
    }));
    const cpmkNodes: Simpul[] = penawaranTampil.flatMap((item) => {
      const prefix = kunciOffering(item.mk.kode, item.mk.tahun, item.mk.kelas);
      return item.cpmk.map((cpmk) => ({
        id: `${prefix}::${cpmk.kode}`,
        kode: `${item.mk.kode} / ${cpmk.kode}`,
        level: 2,
        judul: cpmk.deskripsi,
        meta: `${item.mk.nama}, ${item.mk.tahun}, ${item.sub.filter((sub) => sub.cpmk === cpmk.kode).length} Sub-CPMK`,
        kelola: `/mata-kuliah/${item.mk.kode}/struktur`,
        isDummy: cpmk.isDummy,
        penjelas: `CPMK pada penawaran ${item.mk.kode} tahun ${item.mk.tahun}: agregat dari Sub-CPMK di bawahnya.`,
      }));
    });
    const subNodes: Simpul[] = penawaranTampil.flatMap((item) => {
      const prefix = kunciOffering(item.mk.kode, item.mk.tahun, item.mk.kelas);
      return item.sub.map((sub) => ({
        id: `${prefix}::${sub.kode}`,
        kode: `${item.mk.kode} / ${sub.kode}`,
        level: 3,
        judul: sub.deskripsi,
        meta: `${sub.level}, ${(sub.v * 100).toFixed(0)}% dari ${sub.cpmk}`,
        kelola: `/mata-kuliah/${item.mk.kode}/struktur`,
        isDummy: sub.isDummy,
        penjelas: `Sub-CPMK pada ${item.mk.kode} tahun ${item.mk.tahun}, dengan porsi ${(sub.v * 100).toFixed(0)}% ke ${sub.cpmk}.`,
      }));
    });
    return [cplNodes, ikNodes, cpmkNodes, subNodes];
  }, [cplList, ikList, penawaranTampil]);

  const skorKolom = useMemo(() => {
    const item = penawaranTampil[0];
    if (!item) return [{}, {}, {}, {}];
    const prefix = kunciOffering(item.mk.kode, item.mk.tahun, item.mk.kelas);
    const cpmk: Record<string, number> = {};
    const sub: Record<string, number> = {};
    for (const [kode, nilai] of Object.entries(item.skor.cpmk)) cpmk[`${prefix}::${kode}`] = nilai;
    for (const [kode, nilai] of Object.entries(item.skor.sub)) sub[`${prefix}::${kode}`] = nilai;
    return [item.skor.cpl, item.skor.ik, cpmk, sub];
  }, [penawaranTampil]);

  // Geometri peta bertingkat. Setiap jenjang membungkus simpul maksimal 10 per baris.
  const { lebar, tinggi, sisi } = useMemo(() => {
    const maxSimpulPerBaris = Math.min(MAX_PER_ROW, Math.max(...kolom.map((nodes) => nodes.length), 1));
    const lebarKonten = maxSimpulPerBaris * CARD_W + (maxSimpulPerBaris - 1) * H_GAP;
    const W = lebarKonten + CANVAS_PAD * 2;
    const atasJenjang: number[] = [];
    let y = 0;
    kolom.forEach((nodes, j) => {
      atasJenjang[j] = y;
      const baris = Math.ceil(nodes.length / MAX_PER_ROW);
      const tinggiKartu = baris > 0 ? baris * CARD_H + (baris - 1) * ROW_GAP : 0;
      y += LABEL_H + tinggiKartu + (j < kolom.length - 1 ? V_GAP : 0);
    });

    const posisi: Record<string, { x: number; y: number }> = {};
    kolom.forEach((nodes, j) => {
      nodes.forEach((node, i) => {
        const baris = Math.floor(i / MAX_PER_ROW);
        const kolomDalamBaris = i % MAX_PER_ROW;
        const mulaiBaris = baris * MAX_PER_ROW;
        const jumlahDalamBaris = Math.min(MAX_PER_ROW, nodes.length - mulaiBaris);
        const lebarBaris = jumlahDalamBaris * CARD_W + (jumlahDalamBaris - 1) * H_GAP;
        posisi[node.id] = {
          x: (W - lebarBaris) / 2 + kolomDalamBaris * (CARD_W + H_GAP),
          y: atasJenjang[j] + LABEL_H + baris * (CARD_H + ROW_GAP),
        };
      });
    });

    const daftar: { d: string; aktif: boolean; kunci: string }[] = [];
    kolom.forEach((nodes, j) => {
      if (j === 0) return;
      nodes.forEach((n) => {
        for (const kodeInduk of induk[n.id] ?? []) {
          const indukPos = posisi[kodeInduk];
          const anakPos = posisi[n.id];
          if (!indukPos || !anakPos) continue;
          const x1 = indukPos.x + CARD_W / 2;
          const x2 = anakPos.x + CARD_W / 2;
          const y1 = indukPos.y + CARD_H;
          const y2 = anakPos.y;
          const lengkung = Math.max(16, (y2 - y1) / 2);
          daftar.push({
            d: `M ${x1} ${y1} C ${x1} ${y1 + lengkung}, ${x2} ${y2 - lengkung}, ${x2} ${y2}`,
            aktif: aktif.has(n.id) && aktif.has(kodeInduk),
            kunci: `${kodeInduk}→${n.id}`,
          });
        }
      });
    });
    return { lebar: W, tinggi: Math.max(y + CANVAS_PAD, 1), sisi: daftar };
  }, [kolom, induk, aktif]);

  const hitungAktif = (level: Level) => kolom[level].filter((n) => aktif.has(n.id)).length;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Hirarki capaian"
        desc="Bagaimana Sub-CPMK, CPMK, dan IK satu mata kuliah menopang CPL program studi."
        action={
          <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
            Batas lulus
            <input
              type="number"
              min={0}
              max={100}
              value={ambang}
              onChange={(e) => setAmbang(Number(e.target.value))}
              className={`${inputCls} !w-20 tabular-nums`}
              data-tour="Atur batas lulus. Warna skor pada kartu mengikuti nilai ini."
              data-tour-title="Batas lulus"
            />
          </label>
        }
      />

      <div
        data-tour="Pilih tampilan hirarki."
        data-tour-title="Mode tampilan"
      >
      <Tabs
        tabs={[
          { id: "peta", label: "Peta lengkap", hint: "Semua simpul beserta garis hubungnya" },
          { id: "jalur", label: "Daftar per jenjang", hint: "Pilih jenjang capaian yang ingin ditinjau" },
        ]}
        active={mode}
        onChange={setMode}
      />
      </div>

      <Card className="sticky top-[calc(var(--header-height)+0.75rem)] z-30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-md">
            <label htmlFor="pilih-mk-hirarki" className="mb-1.5 block text-sm font-medium text-ink">
              Pilih penawaran mata kuliah
            </label>
            <select
              id="pilih-mk-hirarki"
              value={filterKeyAktif}
              onChange={(e) => setFilterKey(e.target.value)}
              disabled={mataKuliah.length === 0}
              className={`${inputCls}`}
              data-tour="Pilih satu penawaran mata kuliah untuk melihat hirarki capaian dan skornya."
              data-tour-title="Pilih mata kuliah"
            >
              {mataKuliah.length === 0 ? <option value="">Belum ada mata kuliah</option> : null}
              {mataKuliahPerSemester.map(([semester, daftar]) => (
                <optgroup key={semester ?? "tanpa-semester"} label={semester === null ? "Semester belum ditentukan" : `Semester ${semester}`}>
                  {daftar.map((mk) => (
                    <option key={kunciOffering(mk.kode, mk.tahun, mk.kelas)} value={kunciOffering(mk.kode, mk.tahun, mk.kelas)}>
                      {mk.kode} {mk.nama}, {mk.tahun}, kelas {mk.kelas}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <dl className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-muted" aria-label="Keterangan warna skor">
              <div className="flex items-center gap-1.5"><dt className="flex items-center"><span aria-hidden className="block h-2 w-5 rounded-full bg-success" /><span className="sr-only">Hijau:</span></dt><dd>{ambang < 80 ? "80 ke atas" : `${ambang} ke atas`}</dd></div>
              {ambang < 80 ? <div className="flex items-center gap-1.5"><dt className="flex items-center"><span aria-hidden className="block h-2 w-5 rounded-full bg-warning" /><span className="sr-only">Cokelat:</span></dt><dd>{ambang} sampai di bawah 80</dd></div> : null}
              <div className="flex items-center gap-1.5"><dt className="flex items-center"><span aria-hidden className="block h-2 w-5 rounded-full bg-danger" /><span className="sr-only">Merah:</span></dt><dd>di bawah {ambang}</dd></div>
              <div className="flex items-center gap-1.5"><dt className="flex items-center"><span aria-hidden className="block h-3 w-5 rounded-sm border border-line bg-white opacity-40" /><span className="sr-only">Kartu pucat:</span></dt><dd>tidak dipetakan</dd></div>
            </dl>
          </div>
        </div>

        {mkAktif ? (
          <p className="mt-4 border-t border-line pt-3 text-sm text-ink-muted">
            <span className="font-semibold text-ink">{mkAktif.nama}</span> memetakan{" "}
            <span className="tabular-nums text-ink">{hitungAktif(0)} CPL, {hitungAktif(1)} IK, {hitungAktif(2)} CPMK, dan {hitungAktif(3)} Sub-CPMK</span>.
          </p>
        ) : null}
      </Card>

      <div className="rounded-lg border border-line bg-white p-4 sm:p-6">
        {mode === "peta" ? (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-primary">Peta capaian</h2>
            </div>
            <div role="group" aria-label="Kontrol pembesaran peta" className="inline-flex w-fit items-center gap-1 rounded-lg border border-line bg-white p-1">
              <button
                type="button"
                onClick={() => setZoom((nilai) => Math.max(40, nilai - 10))}
                disabled={zoom <= 40}
                aria-label="Perkecil peta"
                title="Perkecil peta"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-semibold text-primary transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span aria-hidden>−</span>
              </button>
              <output aria-live="polite" aria-atomic="true" className="min-w-14 text-center tabular-nums text-xs font-bold text-ink">{zoom}%</output>
              <button
                type="button"
                onClick={() => setZoom((nilai) => Math.min(150, nilai + 10))}
                disabled={zoom >= 150}
                aria-label="Perbesar peta"
                title="Perbesar peta"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-semibold text-primary transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span aria-hidden>+</span>
              </button>
              <span aria-hidden className="mx-0.5 h-5 w-px bg-line" />
              <button
                type="button"
                onClick={() => setZoom(70)}
                aria-label="Atur ulang zoom ke 70 persen"
                title="Atur ulang zoom"
                className="rounded-lg px-2.5 py-2 text-xs font-semibold text-ink transition hover:bg-paper hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Reset
              </button>
            </div>
          </div>
        ) : null}

        <div className={mode === "peta" ? "max-h-[72vh] overflow-auto rounded-md border border-line bg-paper p-4 sm:p-5" : ""}>
          {!mkAktif ? (
            <EmptyState title="Belum ada mata kuliah" desc="Tambahkan penawaran mata kuliah untuk meninjau CPL, IK, CPMK, dan Sub-CPMK." />
          ) : mode === "jalur" ? (
            <JalurSederhana
              kolom={kolom}
              skorKolom={skorKolom}
              aktif={aktif}
              ambang={ambang}
              jenjangAktif={jenjangAktif}
              setJenjangAktif={setJenjangAktif}
              tahun={mkAktif.tahun}
            />
          ) : (
            <div style={{ width: (lebar * zoom) / 100, height: (tinggi * zoom) / 100 }}>
              <div
                className="relative origin-top-left"
                style={{ width: lebar, height: tinggi, transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
              >
                <svg className="pointer-events-none absolute inset-0" width={lebar} height={tinggi} aria-hidden="true">
                  {sisi.map((s) => (
                    <path
                      key={s.kunci}
                      d={s.d}
                      fill="none"
                      style={{ stroke: s.aktif ? "var(--primary)" : "var(--line)" }}
                      strokeOpacity={s.aktif ? 0.45 : 1}
                      strokeWidth={s.aktif ? 2 : 1.5}
                    />
                  ))}
                </svg>

                <div className="relative">
                  {kolom.map((nodes, j) => {
                    const jumlahBaris = Math.ceil(nodes.length / MAX_PER_ROW);
                    const baris = Array.from({ length: jumlahBaris }, (_, indeks) =>
                      nodes.slice(indeks * MAX_PER_ROW, (indeks + 1) * MAX_PER_ROW),
                    );
                    return (
                      <div key={LEVEL_LABEL[j as Level]} style={{ marginBottom: j < kolom.length - 1 ? V_GAP : 0 }}>
                        <div className="flex items-center justify-center" style={{ height: LABEL_H }}>
                          <p className="text-center text-sm">
                            <span className="font-semibold text-primary">{LEVEL_LABEL[j as Level]}</span>{" "}
                            <span className="tabular-nums text-ink-muted">{hitungAktif(j as Level)} dari {nodes.length} dipetakan</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-center" style={{ gap: ROW_GAP }}>
                          {baris.map((simpulBaris, indeksBaris) => (
                            <div key={`${j}-${indeksBaris}`} className="flex justify-center" style={{ gap: H_GAP }}>
                              {simpulBaris.map((node) => (
                                <KartuSimpul key={node.id} simpul={node} skor={skorKolom[j][node.id]} aktif={aktif.has(node.id)} ambang={ambang} />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KartuCapaianJalur({
  simpul,
  skor,
  ambang,
  tahun,
}: {
  simpul: Simpul;
  skor?: number;
  ambang: number;
  tahun: string;
}) {
  const pct = skor === undefined ? 0 : Math.max(0, Math.min(100, skor));
  const labelKelola = simpul.level === 0 ? "Kelola CPL" : simpul.level === 1 ? "Kelola IK" : "Kelola struktur mata kuliah";

  return (
    <Link
      href={simpul.kelola}
      title={`${simpul.kode}: ${simpul.judul}. ${simpul.penjelas ?? ""}`}
      className="group block h-full rounded-lg border border-line bg-white p-4 transition hover:border-primary/50 hover:bg-paper/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold tabular-nums text-primary">{simpul.kode}</span>
        <span className="text-sm text-ink-muted">{LEVEL_LABEL[simpul.level]}, {tahun}</span>
        {simpul.isDummy ? <span className="rounded-md bg-warning-bg px-2 py-1 text-xs font-bold text-warning">Demo</span> : null}
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-ink group-hover:text-primary" title={simpul.judul}>
        {simpul.judul}
      </p>
      <p className="mt-1 min-h-8 line-clamp-2 text-xs leading-relaxed text-ink-muted" title={simpul.meta}>
        {simpul.meta}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-muted">Rata-rata capaian</span>
        <span className="tabular-nums text-sm font-bold text-ink">{skor === undefined ? "Belum ada skor" : skor.toFixed(2)}</span>
      </div>
      {skor === undefined ? (
        <div className="mt-2 h-2 rounded-full bg-paper" aria-hidden="true" />
      ) : (
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-paper"
          role="meter"
          aria-label={`Rata-rata capaian ${simpul.kode}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Number(skor.toFixed(2))}
          aria-valuetext={`${skor.toFixed(2)} dari 100; ${skor >= ambang ? "memenuhi" : "di bawah"} batas ${ambang}`}
        >
          <span className={`block h-full rounded-full ${warnaBar(pct, ambang)}`} style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="mt-3 flex min-h-6 items-center justify-between gap-2">
        {skor === undefined ? (
          <span className="text-xs text-ink-muted">Data skor belum tersedia</span>
        ) : (
          <span className="flex items-center gap-1.5">
            <BadgeHuruf skor={skor} />
            <BadgeStatus tercapai={skor >= ambang} />
          </span>
        )}
        <span className="inline-flex items-center text-xs font-bold text-primary">
          {labelKelola}
        </span>
      </div>
    </Link>
  );
}

function JalurSederhana({
  kolom,
  skorKolom,
  aktif,
  ambang,
  jenjangAktif,
  setJenjangAktif,
  tahun,
}: {
  kolom: Simpul[][];
  skorKolom: Record<string, number>[];
  aktif: Set<string>;
  ambang: number;
  jenjangAktif: Level;
  setJenjangAktif: (level: Level) => void;
  tahun: string;
}) {
  const pilihan: { level: Level; judul: string; deskripsi: string }[] = [
    { level: 0, judul: "CPL", deskripsi: "Capaian Pembelajaran Lulusan" },
    { level: 1, judul: "IK", deskripsi: "Indikator Kinerja" },
    { level: 2, judul: "CPMK", deskripsi: "Capaian Pembelajaran Mata Kuliah" },
    { level: 3, judul: "Sub-CPMK", deskripsi: "Capaian pembelajaran per sub" },
  ];
  const daftar = kolom[jenjangAktif].filter((simpul) => aktif.has(simpul.id));
  const labelAktif = pilihan.find((item) => item.level === jenjangAktif)?.judul ?? "capaian";

  return (
    <section className="space-y-5" aria-labelledby="pilih-jenjang-heading">
      <div>
        <h2 id="pilih-jenjang-heading" className="sr-only">Pilih jenis capaian</h2>
      </div>

      <div role="group" aria-label="Pilihan jenis capaian" data-tour="Pilih jenis capaian untuk melihat daftar skor dan pemetaannya." data-tour-title="Pilih jenjang capaian" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {pilihan.map((item) => {
          const aktifTerpetakan = kolom[item.level].filter((simpul) => aktif.has(simpul.id)).length;
          const terpilih = item.level === jenjangAktif;
          return (
            <button
              key={item.level}
              type="button"
              aria-pressed={terpilih}
              onClick={() => setJenjangAktif(item.level)}
              data-tour="Pilih jenjang CPL, IK, CPMK, atau Sub-CPMK."
              data-tour-title={item.judul}
              className={`flex items-baseline justify-between gap-3 rounded-md border px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${terpilih ? "border-primary bg-white ring-1 ring-primary" : "border-line bg-white hover:border-primary/40"}`}
            >
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${terpilih ? "text-primary" : "text-ink"}`}>{item.judul}</span>
                <span className="block text-xs text-ink-muted">{item.deskripsi}</span>
              </span>
              <span className={`text-lg font-semibold tabular-nums ${terpilih ? "text-primary" : "text-ink-muted"}`}>{aktifTerpetakan}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 border-t border-line pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink">{labelAktif}</h3>
        </div>
        <p className="text-xs font-medium text-ink-muted">Tahun ajaran {tahun}, batas lulus {ambang}</p>
      </div>

      {daftar.length === 0 ? (
        <EmptyState title={`Belum ada ${labelAktif.toLowerCase()} terpetakan`} desc="Periksa kembali struktur dan pemetaan capaian pada mata kuliah terpilih." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-label={`Daftar ${labelAktif}`}>
          {daftar.map((simpul) => (
            <li key={simpul.id} className="h-full">
              <KartuCapaianJalur simpul={simpul} skor={skorKolom[jenjangAktif][simpul.id]} ambang={ambang} tahun={tahun} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
