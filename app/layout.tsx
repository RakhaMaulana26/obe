import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// Plus Jakarta Sans (Tokotype) — satu keluarga untuk judul sampai isi; angka tabel memakai `tabular-nums`.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OBE - PENS",
  description:
    "Sistem Pendukung Keputusan pengukuran capaian pembelajaran berbasis Weighted Scoring berjenjang dari asesmen sampai CPL (asesmen → Sub-CPMK → CPMK → IK → CPL).",
  icons: {
    icon: "/penswhite.png",
    apple: "/penswhite.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
