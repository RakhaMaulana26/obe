"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

// Transisi antar halaman: fade singkat (≤ 150ms, spec desain) dan gulir kembali ke atas.
// Dimatikan bila pengguna memilih prefers-reduced-motion.
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const kurangiGerak = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: kurangiGerak ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: kurangiGerak ? 1 : 0 }}
        transition={{ duration: kurangiGerak ? 0 : 0.15, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
