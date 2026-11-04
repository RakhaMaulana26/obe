"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AKUN_DEMO } from "@/app/lib/data";
import { useApp } from "@/app/lib/store";

// Foto gedung PENS di folder public.
const FOTO_GEDUNG = "/gedungpens2.jpg";

// Jenjang perhitungan, dari masukan dosen sampai capaian program studi.
const RANTAI = ["Nilai asesmen", "Sub-CPMK", "CPMK", "IK", "CPL"];

const kolomInput =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-ink placeholder:text-ink-muted/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export default function LoginPage() {
  const router = useRouter();
  const { masuk } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const akun = AKUN_DEMO.find((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
    if (akun) {
      masuk({ nama: akun.nama, email: akun.email, peran: akun.peran });
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Email atau password tidak cocok. Pakai salah satu akun demo di bawah form.");
      setIsLoading(false);
    }
  };

  function isiDemo(emailDemo: string) {
    setEmail(emailDemo);
    setPassword("password123");
    setError("");
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex">
        <Image src={FOTO_GEDUNG} alt="Gedung Politeknik Elektronika Negeri Surabaya" fill priority className="object-cover opacity-30 mix-blend-luminosity" sizes="42vw" />
        <div className="relative flex items-center gap-3">
          <Image src="/penswhite.png" alt="Logo PENS" width={40} height={40} className="h-10 w-10 object-contain" priority />
          <div className="leading-tight">
            <p className="font-bold">Politeknik Elektronika Negeri Surabaya</p>
            <p className="text-sm text-white/75">D4 Teknik Informatika</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">SPK OBE</h1>
          <p className="mt-3 max-w-[34ch] text-base leading-relaxed text-white/85">
            Sistem pendukung keputusan untuk mengukur ketercapaian capaian pembelajaran, dari nilai yang dosen masukkan sampai CPL program studi.
          </p>
          <ol className="mt-8 flex flex-wrap items-center gap-y-2 text-sm" aria-label="Jenjang perhitungan capaian">
            {RANTAI.map((jenjang, i) => (
              <li key={jenjang} className="flex items-center">
                <span className={`rounded border px-2 py-1 ${i === 0 ? "border-accent bg-accent font-semibold text-primary" : "border-white/30 text-white"}`}>{jenjang}</span>
                {i < RANTAI.length - 1 ? (
                  <svg aria-hidden className="mx-1.5 h-3 w-3 text-white/50" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6}>
                    <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <p className="relative text-sm text-white/60">Kurikulum 2026 Program Studi Sarjana Terapan Teknik Informatika</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary">
              <Image src="/penswhite.png" alt="Logo PENS" width={32} height={32} className="h-8 w-8 object-contain" priority />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-primary">SPK OBE</p>
              <p className="text-sm text-ink-muted">PENS D4 Teknik Informatika</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-primary">Masuk</h2>
          <p className="mt-1 text-sm text-ink-muted">Pakai akun dosen atau admin prodi.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error ? <p role="alert" className="rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{error}</p> : null}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={kolomInput} placeholder="nama@pens.ac.id" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className={kolomInput} />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Memeriksa…" : "Masuk"}
            </button>
          </form>

          <section aria-labelledby="akun-demo" className="mt-8 border-t border-line pt-5">
            <h3 id="akun-demo" className="text-sm font-semibold text-ink">Akun demo</h3>
            <p className="mt-0.5 text-sm text-ink-muted">Pilih salah satu untuk mengisi form. Password keduanya <span className="font-semibold tabular-nums text-ink">password123</span>.</p>
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-white">
              {[
                { peran: "Dosen", email: "dosen@pens.ac.id", tugas: "Mengisi nilai dan melihat capaian kelas" },
                { peran: "Admin prodi", email: "prodi@pens.ac.id", tugas: "Mengelola kurikulum dan CPL" },
              ].map((akun) => (
                <button
                  key={akun.email}
                  type="button"
                  onClick={() => isiDemo(akun.email)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
                >
                  <span>
                    <span className="block text-sm font-semibold text-primary">{akun.peran}</span>
                    <span className="block text-xs text-ink-muted">{akun.tugas}</span>
                  </span>
                  <span className="text-xs tabular-nums text-ink-muted">{akun.email}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
