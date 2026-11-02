"use client";

import DokumenMKEditor from "@/app/components/DokumenMKEditor";

export default function RubrikPage({ params }: { params: Promise<{ kode: string }> }) {
  return <DokumenMKEditor params={params} mode="rubrik" />;
}
