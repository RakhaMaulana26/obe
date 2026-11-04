import Link from "next/link";

export interface SimpulCapaian {
  /** Nama jenjang, mis. "Sub-CPMK". */
  jenjang: string;
  /** Rata-rata kelas pada jenjang ini (0–100). */
  nilai: number;
  /** Butir dengan rata-rata terendah pada jenjang ini. */
  terlemah?: { kode: string; nilai: number };
  /** Tautan ke halaman rincian jenjang ini. */
  href?: string;
}

/**
 * Rantai capaian: nilai mengalir dari asesmen sampai CPL. Setiap simpul menunjukkan rata-rata kelas dan butir
 * terlemahnya; simpul dengan rata-rata terendah ditandai stabilo kuning PENS, simpul di bawah ambang ditulis merah.
 */
export default function RantaiCapaian({ simpul, ambang }: { simpul: SimpulCapaian[]; ambang: number }) {
  const terendah = simpul.reduce((min, s, i) => (s.nilai < simpul[min].nilai ? i : min), 0);
  return (
    <ol className="grid grid-cols-1 overflow-hidden rounded-lg border border-line bg-white sm:grid-cols-2 lg:grid-cols-5">
      {simpul.map((s, i) => {
        const belum = s.nilai < ambang;
        const isi = (
          <>
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span>{s.jenjang}</span>
              {i < simpul.length - 1 ? (
                <svg aria-hidden className="ml-auto hidden h-4 w-4 text-line lg:block" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
            <p className={`mt-1 text-2xl font-bold tabular-nums leading-tight ${belum ? "text-danger" : "text-primary"}`}>
              <span className={i === terendah ? "rounded-sm bg-accent/45 px-1 -mx-1" : undefined}>{s.nilai.toFixed(2)}</span>
            </p>
            {s.terlemah ? (
              <p className="mt-1 text-xs text-ink-muted">
                Terendah <span className="font-semibold text-ink">{s.terlemah.kode}</span> <span className="tabular-nums">{s.terlemah.nilai.toFixed(2)}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-muted">{belum ? `Di bawah ambang ${ambang}` : `Ambang ${ambang}`}</p>
            )}
          </>
        );
        return (
          <li key={s.jenjang} className="border-b border-line p-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
            {s.href ? (
              <Link href={s.href} className="-m-2 block rounded-md p-2 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                {isi}
              </Link>
            ) : (
              isi
            )}
          </li>
        );
      })}
    </ol>
  );
}
