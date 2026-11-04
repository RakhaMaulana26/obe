import { EmptyState, JudulBagian, PageHeading } from "@/app/components/ui";
import { DAFTAR_GAE_IABEE, DAFTAR_PPM, MISI_PRODI, VISI_PRODI } from "@/app/lib/data";

export default function PPMPage() {
  const hasData = DAFTAR_PPM.length > 0 || Boolean(VISI_PRODI) || MISI_PRODI.length > 0 || DAFTAR_GAE_IABEE.length > 0;
  return (
    <div className="space-y-8">
      <PageHeading title="PPM dan identitas prodi" desc="Visi, misi, PPM, dan atribut lulusan IABEE dari Kurikulum 2026." />
      {!hasData ? (
        <EmptyState title="Belum ada data PPM" desc="Visi, misi, dan PPM program studi belum ditambahkan ke data kurikulum." />
      ) : (
        <article className="rounded-lg border border-line bg-white">
          {VISI_PRODI ? (
            <section aria-labelledby="visi" className="border-b border-line px-6 py-6 sm:px-8">
              <h2 id="visi" className="text-sm font-semibold text-ink-muted">Visi program studi</h2>
              <p className="mt-2 max-w-[62ch] text-lg font-semibold leading-relaxed text-primary">{VISI_PRODI}</p>
            </section>
          ) : null}

          {MISI_PRODI.length > 0 ? (
            <section aria-labelledby="misi" className="border-b border-line px-6 py-6 sm:px-8">
              <h2 id="misi" className="text-sm font-semibold text-ink-muted">Misi program studi</h2>
              <ol className="mt-3 max-w-[70ch] space-y-3 text-sm leading-relaxed text-ink">
                {MISI_PRODI.map((misi, i) => (
                  <li key={misi} className="grid grid-cols-[2rem_1fr]">
                    <span className="font-semibold tabular-nums text-primary">{i + 1}.</span>
                    <span>{misi.replace(/^\d+\.\s*/, "")}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {DAFTAR_PPM.length > 0 ? (
            <section aria-labelledby="ppm" className="border-b border-line px-6 py-6 sm:px-8">
              <h2 id="ppm" className="text-sm font-semibold text-ink-muted">PPM</h2>
              <dl className="mt-3 max-w-[70ch] space-y-3 text-sm leading-relaxed">
                {DAFTAR_PPM.map((ppm) => (
                  <div key={ppm.kode} className="grid grid-cols-[4.5rem_1fr] gap-2">
                    <dt className="font-semibold tabular-nums text-primary">{ppm.kode}</dt>
                    <dd className="text-ink">{ppm.deskripsi}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {DAFTAR_GAE_IABEE.length > 0 ? (
            <section aria-labelledby="gae" className="px-6 py-6 sm:px-8">
              <JudulBagian id="gae" judul="Graduate attributes (IEA)" keterangan="Atribut lulusan acuan akreditasi IABEE." />
              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                {DAFTAR_GAE_IABEE.map((atribut) => (
                  <div key={atribut.kode} className="grid grid-cols-[1.75rem_1fr] border-b border-line/70 py-1.5">
                    <dt className="font-semibold text-primary">{atribut.kode}</dt>
                    <dd className="text-ink">{atribut.nama}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </article>
      )}
    </div>
  );
}
