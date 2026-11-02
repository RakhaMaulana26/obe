"use client";

// ReactBits — ShinyText
// Kilau cahaya menyapu teks (untuk aksen headline). Murni CSS, non-blocking.
export default function ShinyText({
  text,
  className = "",
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}) {
  const AnyTag = Tag as "span";
  return (
    <AnyTag className={`animate-shine bg-[linear-gradient(110deg,#f2c808_40%,#fff7d6_50%,#f2c808_60%)] bg-[length:200%_100%] bg-clip-text text-transparent ${className}`}>
      {text}
    </AnyTag>
  );
}
