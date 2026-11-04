"use client";

// Chart SVG ringan mengikuti warna proyek — tanpa dependensi tambahan.

export function Donut({
  pct,
  size = 190,
  thick = 22,
  centerTop,
  centerBottom,
}: {
  pct: number;
  size?: number;
  thick?: number;
  centerTop: string;
  centerBottom: string;
}) {
  const r = (size - thick) / 2;
  const keliling = 2 * Math.PI * r;
  const terisi = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${terisi.toFixed(1)} persen ketuntasan. ${centerTop}. ${centerBottom}.`}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: "var(--line)" }} strokeWidth={thick} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thick}
          strokeLinecap="round"
          strokeDasharray={`${(terisi / 100) * keliling} ${keliling}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ stroke: "var(--primary)", transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease" }}
        />
        <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="700" style={{ fill: "var(--primary)" }}>
          {terisi.toFixed(0)}%
        </text>
        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontSize="12" style={{ fill: "var(--ink-muted)" }}>
          {centerBottom}
        </text>
      </svg>
      <p className="mt-1 text-sm font-semibold text-primary">{centerTop}</p>
    </div>
  );
}

export function Radar({
  items,
  size = 270,
}: {
  items: { label: string; value: number }[];
  size?: number;
}) {
  const n = Math.max(3, items.length);
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 52;
  const titik = (i: number, radius: number): [number, number] => {
    const sudut = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + radius * Math.cos(sudut), cy + radius * Math.sin(sudut)];
  };
  const poligon = (radius: number) => items.map((_, i) => titik(i, radius).join(",")).join(" ");
  const nilaiPoligon = items.map((it, i) => titik(i, (Math.max(0, Math.min(100, it.value)) / 100) * R).join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {[25, 50, 75, 100].map((p) => (
        <polygon key={p} points={poligon((p / 100) * R)} fill="none" style={{ stroke: "var(--line)" }} strokeWidth={1} />
      ))}
      {items.map((_, i) => {
        const [x, y] = titik(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} style={{ stroke: "var(--line)" }} strokeWidth={1} />;
      })}
      <polygon points={nilaiPoligon} style={{ fill: "var(--primary)", stroke: "var(--primary)" }} fillOpacity={0.14} strokeWidth={2} strokeLinejoin="round" />
      {items.map((it, i) => {
        const [x, y] = titik(i, (Math.max(0, Math.min(100, it.value)) / 100) * R);
        const [lx, ly] = titik(i, R + 22);
        return (
          <g key={it.label}>
            <circle cx={x} cy={y} r={4.5} style={{ fill: "var(--accent)", stroke: "var(--primary)" }} strokeWidth={2} />
            <text x={lx} y={ly - 2} textAnchor="middle" fontSize="12" fontWeight="700" style={{ fill: "var(--primary)" }}>
              {it.label}
            </text>
            <text x={lx} y={ly + 12} textAnchor="middle" fontSize="12" style={{ fill: "var(--ink-muted)" }}>
              {it.value.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Histogram({
  bands,
}: {
  bands: { label: string; sub: string; count: number; tone: "red" | "amber" | "green" }[];
}) {
  const maks = Math.max(1, ...bands.map((b) => b.count));
  const warna: Record<string, string> = {
    red: "bg-danger",
    amber: "bg-warning",
    green: "bg-success",
  };
  return (
    <ol className="space-y-3" aria-label="Jumlah mahasiswa per rentang nilai">
      {bands.map((b) => (
        <li
          key={b.label}
          className="grid grid-cols-[minmax(68px,0.55fr)_minmax(0,2fr)_40px] items-center gap-3 sm:grid-cols-[minmax(90px,0.45fr)_minmax(0,2fr)_48px] sm:gap-4"
          title={`${b.count} mahasiswa pada rentang ${b.sub}`}
        >
          <div>
            <p className="text-sm font-bold text-primary">Nilai {b.label}</p>
            <p className="tabular-nums text-xs text-ink-muted sm:text-xs">{b.sub}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-paper" aria-hidden="true">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${warna[b.tone]}`}
              style={{ width: `${(b.count / maks) * 100}%` }}
            />
          </div>
          <p className="text-right tabular-nums text-sm font-bold tabular-nums text-ink">{b.count}</p>
        </li>
      ))}
    </ol>
  );
}
