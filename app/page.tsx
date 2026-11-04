import Image from "next/image";
import Link from "next/link";

// ------------------------------------------------------------------
// Halaman publik SPK OBE. Isinya sengaja sederhana: apa aplikasinya,
// bagaimana nilai dihitung (contoh nyata dari rubrik Data Mining),
// siapa penggunanya, dan pertanyaan yang sering muncul.
// ------------------------------------------------------------------

const NAV = [
  { id: "cara-hitung", label: "Cara hitung" },
  { id: "pengguna", label: "Pengguna" },
  { id: "faq", label: "Pertanyaan" },
  { id: "kontak", label: "Kontak" },
];

// Komponen penilaian Data Mining (rubrik): rata-rata indikator × bobot.
const CONTOH_ASESMEN = [
  { nama: "Kuis", indikator: 3, rata: 82, bobot: 10 },
  { nama: "Laporan praktikum", indikator: 7, rata: 78, bobot: 30 },
  { nama: "Mini project", indikator: 4, rata: 74, bobot: 10 },
  { nama: "Mid test", indikator: 4, rata: 68, bobot: 25 },
  { nama: "Post test", indikator: 4, rata: 71, bobot: 25 },
];
const CONTOH_AKHIR = CONTOH_ASESMEN.reduce((s, a) => s + (a.rata * a.bobot) / 100, 0);

const JENJANG = [
  { kode: "Nilai asesmen", isi: "Dosen mengisi skor 0–100 untuk setiap indikator rubrik: kuis, laporan praktikum, mini project, mid test, dan post test." },
  { kode: "Sub-CPMK", isi: "Setiap indikator terhubung ke satu Sub-CPMK. Skor Sub-CPMK adalah rata-rata berbobot indikatornya, mengikuti tabel distribusi rubrik." },
  { kode: "CPMK", isi: "Gabungan Sub-CPMK sesuai bobotnya di RPS." },
  { kode: "IK", isi: "Indikator kinerja program studi yang ditopang CPMK. Porsinya diturunkan otomatis dari bobot Sub-CPMK." },
  { kode: "CPL", isi: "Capaian pembelajaran lulusan, dihitung dari IK yang benar-benar terukur di mata kuliah itu." },
];

const PERAN = [
  {
    peran: "Dosen pengampu",
    tugas: [
      "Mengisi nilai per indikator rubrik untuk setiap kelas",
      "Melihat mahasiswa dan Sub-CPMK yang masih di bawah batas lulus",
      "Menelusuri hitungan satu mahasiswa sampai ke CPL",
    ],
  },
  {
    peran: "Admin program studi",
    tugas: [
      "Mengelola CPL, IK, dan profil lulusan Kurikulum 2026",
      "Mengatur struktur dan bobot mata kuliah dari RPS",
      "Mengunduh rekap capaian untuk bahan akreditasi",
    ],
  },
];

const FAQ = [
  {
    q: "Apa yang dimaksud batas lulus?",
    a: "Skor minimal agar sebuah capaian dinyatakan tercapai. Acuannya 60, setara nilai C. Kalau batasnya diubah, status di seluruh aplikasi ikut menyesuaikan.",
  },
  {
    q: "Apakah nilai akhir sama dengan skor CPMK?",
    a: "Tidak. Nilai akhir memakai bobot komponen penilaian (kuis 10%, laporan 30%, mini project 10%, mid 25%, post 25%). Skor Sub-CPMK dan CPMK memakai bobot distribusi rubrik per indikator, jadi angkanya bisa berbeda.",
  },
  {
    q: "Bagaimana kalau ada indikator yang belum dinilai?",
    a: "Nilai belum bisa disimpan selama masih ada sel kosong. Halaman input menunjukkan berapa sel yang belum terisi, karena indikator yang kosong akan dihitung sebagai nol.",
  },
  {
    q: "Apakah profil lulusan ikut dihitung?",
    a: "Tidak. Perhitungan berhenti di CPL. Profil lulusan disimpan sebagai rujukan kurikulum saja.",
  },
  {
    q: "Di mana data disimpan?",
    a: "Versi ini menyimpan data di browser yang dipakai. Data tidak dikirim ke server lain, jadi gunakan perangkat yang sama untuk melanjutkan pekerjaan.",
  },
];

function fmt(n: number) {
  return n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <a href="#isi" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-primary">
        Lompat ke isi
      </a>

      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Image src="/penswhite.png" alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" priority />
            </span>
            <span className="leading-tight">
              <span className="block font-bold text-primary">SPK OBE</span>
              <span className="block text-xs text-ink-muted">PENS D4 Teknik Informatika</span>
            </span>
          </Link>
          <nav aria-label="Navigasi halaman" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-paper hover:text-primary">
                {n.label}
              </a>
            ))}
          </nav>
          <Link href="/login" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2">
            Masuk
          </Link>
        </div>
      </header>

      <main id="isi">
        {/* Pembuka: penjelasan singkat + contoh lembar nilai satu mahasiswa */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-20">
            <div>
              <h1 className="max-w-[18ch] text-4xl font-bold leading-[1.15] text-primary sm:text-5xl">
                Dari nilai kuis sampai capaian lulusan, dalam satu hitungan.
              </h1>
              <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-ink-muted">
                SPK OBE membantu dosen dan program studi D4 Teknik Informatika PENS mengukur ketercapaian
                Sub-CPMK, CPMK, IK, dan CPL berdasarkan rubrik dan RPS tiap mata kuliah. Dosen cukup mengisi
                nilai indikator; sisanya dihitung dan bisa ditelusuri ulang.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2">
                  Masuk dengan akun demo
                </Link>
                <a href="#cara-hitung" className="inline-flex h-11 items-center rounded-lg border border-line bg-white px-5 font-semibold text-primary hover:border-primary/40">
                  Lihat cara hitungnya
                </a>
              </div>
            </div>

            <figure className="rounded-lg border border-line bg-paper p-1.5">
              <div className="rounded-md border border-line bg-white">
                <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3.5">
                  <div>
                    <p className="font-semibold text-primary">Data Mining, kelas A</p>
                    <p className="text-sm text-ink-muted">Contoh nilai satu mahasiswa</p>
                  </div>
                  <p className="text-sm text-ink-muted">22 indikator</p>
                </div>
                <table className="w-full text-sm">
                  <caption className="sr-only">Contoh perhitungan nilai akhir dari rata-rata indikator dan bobot komponen</caption>
                  <thead>
                    <tr className="text-left text-ink-muted">
                      <th scope="col" className="px-5 py-2 font-medium">Komponen</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Rata-rata</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">Bobot</th>
                      <th scope="col" className="px-5 py-2 text-right font-medium">Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {CONTOH_ASESMEN.map((a) => (
                      <tr key={a.nama} className="border-t border-line">
                        <th scope="row" className="px-5 py-2.5 text-left font-normal text-ink">
                          {a.nama} <span className="text-ink-muted">({a.indikator})</span>
                        </th>
                        <td className="px-2 py-2.5 text-right">{a.rata}</td>
                        <td className="px-2 py-2.5 text-right text-ink-muted">{a.bobot}%</td>
                        <td className="px-5 py-2.5 text-right">{fmt((a.rata * a.bobot) / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-primary">
                      <th scope="row" colSpan={3} className="px-5 py-3 text-left font-semibold text-primary">Nilai akhir</th>
                      <td className="px-5 py-3 text-right">
                        <span className="text-lg font-bold tabular-nums text-primary">{fmt(CONTOH_AKHIR)}</span>
                        <span className="ml-2 rounded border border-primary/30 px-1.5 py-0.5 text-xs font-semibold text-primary">B</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <figcaption className="px-3 pb-1.5 pt-2.5 text-xs leading-relaxed text-ink-muted">
                Angka ilustrasi. Bobot komponen mengikuti rubrik penilaian Data Mining.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Cara hitung: urutan jenjang (memang berurutan, jadi diberi nomor) */}
        <section id="cara-hitung" className="scroll-mt-4 border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <h2 className="text-2xl font-bold text-primary">Cara nilai dihitung</h2>
              <p className="mt-3 max-w-[40ch] leading-relaxed text-ink-muted">
                Setiap jenjang dihitung dari jenjang di bawahnya. Di aplikasi, hitungan satu mahasiswa bisa dibuka langkah demi langkah.
              </p>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              {JENJANG.map((j, i) => (
                <li key={j.kode} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-5 sm:grid-cols-[2.5rem_9rem_1fr]">
                  <span className="text-lg font-bold tabular-nums text-primary/40">{i + 1}</span>
                  <p className="font-semibold text-primary">{j.kode}</p>
                  <p className="col-start-2 mt-1 leading-relaxed text-ink sm:col-start-3 sm:mt-0">{j.isi}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pengguna */}
        <section id="pengguna" className="scroll-mt-4 border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold text-primary">Siapa yang memakai</h2>
            <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {PERAN.map((p) => (
                <div key={p.peran} className="border-l-[3px] border-accent pl-5">
                  <h3 className="text-lg font-semibold text-ink">{p.peran}</h3>
                  <ul className="mt-3 space-y-2 leading-relaxed text-ink-muted">
                    {p.tugas.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pertanyaan */}
        <section id="faq" className="scroll-mt-4 border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
            <h2 className="text-2xl font-bold text-primary">Pertanyaan yang sering muncul</h2>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <svg aria-hidden className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-45" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                    </svg>
                  </summary>
                  <p className="max-w-[64ch] pb-5 leading-relaxed text-ink-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Kontak */}
        <section id="kontak" className="scroll-mt-4 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="text-2xl font-bold text-primary">Kontak</h2>
              <address className="mt-4 not-italic leading-relaxed text-ink">
                <p className="font-semibold">Politeknik Elektronika Negeri Surabaya</p>
                <p className="text-ink-muted">Jalan Raya ITS, Keputih, Sukolilo, Surabaya 60111</p>
              </address>
              <dl className="mt-6 grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
                <dt className="text-ink-muted">Email</dt>
                <dd><a href="mailto:info@pens.ac.id" className="text-primary underline-offset-2 hover:underline">info@pens.ac.id</a></dd>
                <dt className="text-ink-muted">Telepon</dt>
                <dd className="tabular-nums">+62 31 594 7280</dd>
                <dt className="text-ink-muted">Jam layanan</dt>
                <dd>Senin–Jumat, 08.00–16.00 WIB</dd>
              </dl>
            </div>
            <div className="overflow-hidden rounded-lg border border-line">
              <iframe
                title="Peta lokasi Politeknik Elektronika Negeri Surabaya"
                src="https://www.google.com/maps?q=Politeknik+Elektronika+Negeri+Surabaya&output=embed"
                className="h-72 w-full"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-semibold">SPK OBE, D4 Teknik Informatika PENS</p>
          <p className="text-white/70">© 2026 Politeknik Elektronika Negeri Surabaya</p>
        </div>
      </footer>
    </div>
  );
}
