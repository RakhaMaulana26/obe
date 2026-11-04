"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import Header from "@/app/components/Header";
import RouteProgress from "@/app/components/RouteProgress";
import PageTransition from "@/app/components/PageTransition";
import Tour from "@/app/components/Tour";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const mentah = window.localStorage.getItem("obe-user");
      if (!mentah) router.replace("/login");
    } catch {
      /* abaikan */
    }
  }, [router, pathname]);

  return (
    <div className="min-h-screen bg-paper">
      <RouteProgress />
      <Sidebar />
      <Header />
      {/* Konten: lebar penuh di bawah 1024px (menu di drawer), bergeser selebar rail/sidebar di atasnya. */}
      <main
        className="min-h-screen min-w-0 px-4 pb-6 pt-[calc(var(--header-height)+1.25rem)] sm:px-6 lg:ml-[var(--sidebar-rail-width)] xl:ml-[var(--sidebar-width)] print:ml-0 print:p-0"
        suppressHydrationWarning
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <Tour />
    </div>
  );
}
