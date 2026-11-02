"use client";

import DokumenMKEditor from "@/app/components/DokumenMKEditor";

export default function RPSPage({ params }: { params: Promise<{ kode: string }> }) {
  return <DokumenMKEditor params={params} mode="rps" />;
}
