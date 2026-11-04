import Link from "next/link";
import { Card, PageHeading } from "@/app/components/ui";

export default async function DokumenMKPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  const kodeMK = decodeURIComponent(kode).toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeading title="Dokumen RPS dan rubrik" desc={`${kodeMK}. Susun dan unduh dokumen RPS serta rubrik penilaian.`} action={<Link href={`/mata-kuliah/${kodeMK}`} className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper">Kembali ke mata kuliah</Link>} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="h-full">
          <h2 className="mt-1 text-lg font-bold text-primary">RPS</h2>
          <p className="mt-2 text-sm text-ink">Lengkapi identitas dan rencana kegiatan, lalu unduh dokumen RPS.</p>
          <Link href={`/mata-kuliah/${kodeMK}/dokumen/rps`} className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Buka RPS</Link>
        </Card>
        <Card className="h-full">
          <h2 className="mt-1 text-lg font-bold text-primary">Rubrik</h2>
          <p className="mt-2 text-sm text-ink">Lengkapi distribusi bobot dan rincian tugas, lalu unduh rubrik penilaian.</p>
          <Link href={`/mata-kuliah/${kodeMK}/dokumen/rubrik`} className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Buka Rubrik</Link>
        </Card>
      </div>
    </div>
  );
}
