"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AKUN_DEMO } from "@/app/lib/data";
import { useApp } from "@/app/lib/store";
import BlurText from "@/app/components/reactbits/BlurText";
import FadeContent from "@/app/components/reactbits/FadeContent";
import SpotlightCard from "@/app/components/reactbits/SpotlightCard";
import AnimatedList, { AnimatedItem } from "@/app/components/reactbits/AnimatedList";

// Foto gedung PENS di folder public.
const FOTO_GEDUNG = "/gedungpens2.jpg";

const ALUR = [
  { tahap: "Nilai", desc: "Tugas, praktikum, ETS & EAS" },
  { tahap: "Sub-CPMK", desc: "Capaian kecil per topik" },
  { tahap: "CPMK", desc: "Capaian tiap mata kuliah" },
  { tahap: "IK → CPL", desc: "Agregat capaian program studi" },
];

export default function LoginPage() {
  const router = useRouter();
  const { masuk } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const akun = AKUN_DEMO.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (akun) {
      masuk({ nama: akun.nama, email: akun.email, peran: akun.peran });
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Email atau password salah. Gunakan salah satu akun demo di bawah.");
    }
    setIsLoading(false);
  };

  function isiDemo(emailDemo: string) {
    setEmail(emailDemo);
    setPassword("password123");
    setError("");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Panel kiri — foto gedung berlapis + branding */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex">
        {/* Lapisan 1 — foto gedung */}
        <Image
          src={FOTO_GEDUNG}
          alt="Gedung Politeknik Elektronika Negeri Surabaya"
          fill
          priority
          className="object-cover"
          sizes="44vw"
        />
        {/* Lapisan 2 — gradasi navy agar teks terbaca */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[#103968]/85 via-[#103968]/65 to-[#0a2547]/90"
        />
        {/* Lapisan 3 — aksen cahaya kuning + vignette */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(520px circle at 15% 12%, rgba(242,200,8,0.22), transparent 60%), radial-gradient(640px circle at 90% 100%, rgba(242,200,8,0.10), transparent 60%)",
          }}
        />

        {/* Lapisan 4 — konten */}
        <div className="relative">
          <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
            <Image src="/penswhite.png" alt="Logo PENS" width={36} height={36} className="h-9 w-9 object-contain" priority />
          </div>
          <BlurText text="SPK OBE" as="h1" className="mt-6 text-4xl font-bold drop-shadow-sm" />
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
            Pengukuran Capaian Pembelajaran • PENS D4 Teknik Informatika. Nilai mahasiswa mengalir
            berjenjang sampai CPL.
          </p>
        </div>

        <AnimatedList className="relative mt-10 space-y-3" step={0.08}>
          {ALUR.map((a, i) => (
            <AnimatedItem key={a.tahap}>
              <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold">{a.tahap}</p>
                  <p className="mt-0.5 text-xs text-white/70">{a.desc}</p>
                </div>
              </div>
            </AnimatedItem>
          ))}
        </AnimatedList>

        <p className="relative mt-10 font-mono text-[11px] text-white/50">
          Weighted Scoring berjenjang • ambang T = 60 (nilai C)
        </p>
      </div>

      {/* Panel kanan — form */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <FadeContent>
            <div className="mb-6 text-center lg:hidden">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary">
                <Image src="/penswhite.png" alt="Logo PENS" width={40} height={40} className="h-10 w-10 object-contain" priority />
              </div>
              <BlurText text="SPK OBE" as="h1" className="justify-center text-3xl font-bold text-primary" />
              <p className="mt-1 text-sm text-gray-600">Pengukuran Capaian Pembelajaran • PENS</p>
            </div>
            <div className="hidden lg:block">
              <BlurText text="Masuk ke aplikasi" as="h2" className="text-2xl font-bold text-primary" />
              <p className="mt-1 text-sm text-gray-600">Gunakan akun demo di bawah untuk mencoba peran Dosen / Prodi.</p>
            </div>
            <p className="mt-1 text-sm text-gray-600 lg:hidden">Masuk untuk mengelola capaian pembelajaran.</p>
          </FadeContent>

          <FadeContent delay={0.08}>
            <SpotlightCard className="mt-6 p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
                )}

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="dosen@pens.ac.id"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600">Ingat saya</span>
                  </label>
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
                    Lupa Password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Masuk...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </button>
              </form>

              <div className="mt-6 space-y-2 border-t border-gray-200 pt-6">
                <p className="text-center text-sm font-medium text-gray-500">Akun demo — klik untuk mengisi otomatis</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => isiDemo("dosen@pens.ac.id")}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary/[0.04]"
                  >
                    <span className="block text-xs font-bold text-primary">Dosen</span>
                    <span className="block truncate font-mono text-[11px] text-gray-500">dosen@pens.ac.id</span>
                  </button>
                  <button
                    onClick={() => isiDemo("prodi@pens.ac.id")}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary/[0.04]"
                  >
                    <span className="block text-xs font-bold text-primary">Prodi</span>
                    <span className="block truncate font-mono text-[11px] text-gray-500">prodi@pens.ac.id</span>
                  </button>
                </div>
                <p className="text-center font-mono text-[11px] text-gray-400">password: password123</p>
              </div>
            </SpotlightCard>
          </FadeContent>

          <p className="mt-6 text-center text-xs text-gray-400">
            Alur nilai: asesmen → Sub-CPMK → CPMK → IK → CPL
          </p>
        </div>
      </div>
    </div>
  );
}
