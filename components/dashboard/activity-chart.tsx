import { Activity } from "lucide-react";
import type { DailyPoint } from "@/lib/db/queries";

const TR_MONTHS = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

// "2026-07-26" → "26 Tem". Date parse etmiyoruz ki timezone kayması olmasın.
function fmtDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${TR_MONTHS[(m ?? 1) - 1]}`;
}

const W = 480;
const H = 120;

const SERIES = [
  { key: "found" as const, label: "Bulunan", stroke: "var(--color-forest-800)" },
  { key: "sent" as const, label: "Gönderilen", stroke: "var(--color-forest-400)" },
  { key: "replied" as const, label: "Yanıt", stroke: "var(--color-lime-700)" },
];

export function ActivityChart({ points }: { points: DailyPoint[] }) {
  // Birikimli seriler: lead'ler tek bir tarama gününde toplu düştüğü için ham
  // günlük değerler tek sivri uç veriyor. Birikimli eğri trendi okunur kılıyor.
  let f = 0, s = 0, r = 0;
  const cum = points.map((p) => {
    f += p.found;
    s += p.sent;
    r += p.replied;
    return { date: p.date, found: f, sent: s, replied: r };
  });

  const max = Math.max(...cum.map((c) => c.found), 1);
  const hasData = f + s + r > 0;

  const step = cum.length > 1 ? W / (cum.length - 1) : W;
  const px = (i: number) => i * step;
  const py = (v: number) => H - (v / max) * H;

  const linePts = (key: "found" | "sent" | "replied") =>
    cum.map((c, i) => `${px(i).toFixed(1)},${py(c[key]).toFixed(1)}`).join(" ");

  const areaPath = (key: "found" | "sent" | "replied") =>
    `M0,${H} ` +
    cum.map((c, i) => `L${px(i).toFixed(1)},${py(c[key]).toFixed(1)}`).join(" ") +
    ` L${W},${H} Z`;

  const labelIdx = [
    ...new Set([
      0,
      Math.floor((cum.length - 1) * 0.25),
      Math.floor((cum.length - 1) * 0.5),
      Math.floor((cum.length - 1) * 0.75),
      cum.length - 1,
    ]),
  ].filter((i) => i >= 0 && i < cum.length);

  return (
    <div className="flex h-full flex-col rounded-card border border-hair bg-surface px-6 py-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-text-strong">
          <Activity className="size-[15px] text-forest-800" strokeWidth={2} />
          Son 14 Gün
        </h2>
        <span className="text-[11px] text-text-faint">birikimli · 0–{max}</span>
      </div>

      {!hasData ? (
        <div className="flex flex-1 items-center justify-center py-10 text-center">
          <p className="text-[13px] text-text-muted">
            Son 14 günde aktivite yok. Kampanya çalıştığında trend burada belirir.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-text-muted">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: s.stroke }}
                />
                {s.label}
              </span>
            ))}
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="mt-4 h-[132px] w-full"
            role="img"
            aria-label="Son 14 günün birikimli bulunan, gönderilen ve yanıt sayıları"
          >
            <defs>
              <linearGradient id="chart-found" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-forest-800)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="var(--color-forest-800)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="chart-replied" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-lime-500)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-lime-500)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map((p) => (
              <line
                key={p}
                x1="0"
                y1={H * p}
                x2={W}
                y2={H * p}
                stroke="var(--color-hair)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path d={areaPath("found")} fill="url(#chart-found)" />
            <path d={areaPath("replied")} fill="url(#chart-replied)" />

            {SERIES.map((s) => (
              <polyline
                key={s.key}
                points={linePts(s.key)}
                fill="none"
                stroke={s.stroke}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="mt-2 flex justify-between">
            {labelIdx.map((i) => (
              <span key={i} className="text-[10px] tabular-nums text-text-faint">
                {fmtDay(cum[i]!.date)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
