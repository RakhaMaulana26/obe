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
    <div className="min-h-screen bg-gray-50">
      <RouteProgress />
      <Sidebar />
      <Header />
      <main
        className="min-h-screen print:ml-0 print:p-0"
        style={{
          marginLeft: "var(--sidebar-width)",
          padding: "0 1.5rem 1.5rem",
          paddingTop: "calc(var(--header-height) + 1.5rem)",
        }}
        suppressHydrationWarning
      >
        <PageTransition>{children}</PageTransition>
      </main>
      <Tour />
    </div>
  );
}
