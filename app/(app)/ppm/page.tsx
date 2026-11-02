import { Card, EmptyState, PageHeading } from "@/app/components/ui";
import { DAFTAR_GAE_IABEE, DAFTAR_PPM, MISI_PRODI, VISI_PRODI } from "@/app/lib/data";

export default function PPMPage() {
  const hasData = DAFTAR_PPM.length > 0 || Boolean(VISI_PRODI) || MISI_PRODI.length > 0 || DAFTAR_GAE_IABEE.length > 0;
  return (
    <div className="space-y-6">
      <PageHeading title="PPM" />
      {!hasData ? (
        <Card><EmptyState title="Belum ada data PPM" desc="Data program pengembangan dan profil institusi belum ditambahkan." /></Card>
      ) : (
        <>
      <div className="grid grid-cols-1 gap-4">
        {DAFTAR_PPM.map((ppm) => (
          <Card key={ppm.kode}>
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white">
                {ppm.kode.replace("PPM-", "")}
              </span>
              <div>
                <h2 className="text-base font-bold text-primary">{ppm.kode}</h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{ppm.deskripsi}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-base font-bold text-primary">Visi Program Studi</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{VISI_PRODI}</p>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-base font-bold text-primary">Misi Program Studi</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-gray-600">
            {MISI_PRODI.map((misi) => <li key={misi}>{misi}</li>)}
          </ol>
        </Card>
        <Card>
          <h2 className="text-base font-bold text-primary">Graduate Attributes (IEA)</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DAFTAR_GAE_IABEE.map((atribut) => (
              <div key={atribut.kode} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">{atribut.kode}</span>
                <span>{atribut.nama}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
