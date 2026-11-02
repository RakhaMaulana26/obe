"use client";

import { MotionConfig } from "motion/react";
import { AppProvider } from "@/app/lib/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>{children}</AppProvider>
    </MotionConfig>
  );
}
