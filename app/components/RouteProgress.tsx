"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Bilah progres di tepi atas saat berpindah halaman:
// mulai saat tautan internal diklik, selesai saat rute baru tampil.
export default function RouteProgress() {
  const pathname = usePathname();
  const [fase, setFase] = useState<"idle" | "loading" | "done">("idle");
  const [pathLalu, setPathLalu] = useState(pathname);
  const pathRef = useRef(pathname);

  // Sinkron ref + selesaikan progres saat rute berubah (pola render-phase, tanpa effect).
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);
  if (pathLalu !== pathname) {
    setPathLalu(pathname);
    if (fase === "loading") setFase("done");
  }

  useEffect(() => {
    function onKlik(e: MouseEvent) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!el || el.target === "_blank") return;
      let tujuan = "";
      try {
        tujuan = new URL(el.href, window.location.origin).pathname;
      } catch {
        return;
      }
      if (!tujuan.startsWith("/") || tujuan === pathRef.current) return;
      setFase("loading");
    }
    document.addEventListener("click", onKlik);
    return () => document.removeEventListener("click", onKlik);
  }, []);

  useEffect(() => {
    if (fase !== "done") return;
    const t = setTimeout(() => setFase("idle"), 400);
    return () => clearTimeout(t);
  }, [fase]);

  return (
    <AnimatePresence>
      {fase !== "idle" ? (
        <motion.div
          aria-hidden
          className="fixed inset-x-0 top-0 z-[80] h-[3px] origin-left bg-accent print:hidden"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={
            fase === "loading"
              ? { scaleX: 0.75, transition: { duration: 0.9, ease: "easeOut" } }
              : { scaleX: 1, transition: { duration: 0.25, ease: "easeOut" } }
          }
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        />
      ) : null}
    </AnimatePresence>
  );
}
