import {
  Users,
  Target,
  Clock,
  Send,
  MessageSquare,
  Calendar,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metric } from "@/lib/mock";

const LABEL_ICON: Record<string, LucideIcon> = {
  "Bulunan Lead": Users,
  "Ort. ICP Skoru": Target,
  "Onay Bekleyen": Clock,
  "Gönderilen": Send,
  "Yanıtlar": MessageSquare,
  "Toplantılar": Calendar,
  "Kazanılan": Trophy,
};

const chipClass: Record<Metric["tone"], string> = {
  default: "bg-surface-2 text-text-muted",
  positive: "bg-lime-100 text-forest-700",
  warning: "bg-warning-bg text-warning",
};

const subClass: Record<Metric["tone"], string> = {
  default: "text-text-muted",
  positive: "text-positive",
  warning: "text-warning",
};

const SPARKLINE_LABELS = new Set(["Gönderilen", "Yanıtlar"]);

function seed(label: string): () => number {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) & 0x7fff;
  return () => { h = (h * 1664525 + 1013904223) & 0x7fff; return h / 0x7fff; };
}

function sparklinePoints(label: string, end: number): number[] {
  const rand = seed(label);
  const v = Math.max(0, end);
  let cur = Math.max(0, v * (0.3 + rand() * 0.3));
  const pts: number[] = [];
  for (let i = 0; i < 6; i++) {
    cur = Math.max(0, cur + (rand() - 0.42) * Math.max(2, v * 0.3));
    pts.push(cur);
  }
  pts.push(v);
  return pts;
}

function heroBars(end: number): number[] {
  const v = Math.max(1, end);
  return Array.from({ length: 7 }, (_, i) => {
    const progress = i / 6;
    return Math.max(1, Math.round(v * (0.4 + progress * 0.55) + Math.sin(i * 1.9) * v * 0.07));
  });
}

function LineSparkline({ label, value }: { label: string; value: string }) {
  const num = parseInt(value) || 0;
  const pts = sparklinePoints(label, num);
  const max = Math.max(...pts, 1);
  const W = 72, H = 22;
  const step = W / (pts.length - 1);
  const poly = pts.map((p, i) => `${(i * step).toFixed(1)},${(H - (p / max) * H).toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={poly}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}

function HeroBars({ value }: { value: string }) {
  const num = parseInt(value) || 0;
  const bars = heroBars(num);
  const max = Math.max(...bars, 1);
  const W = 120, H = 36, gap = 4;
  const barW = Math.floor((W - gap * (bars.length - 1)) / bars.length);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {bars.map((b, i) => {
        const bh = Math.max(3, (b / max) * H);
        return (
          <rect
            key={i}
            x={(barW + gap) * i}
            y={H - bh}
            width={barW}
            height={bh}
            rx="2.5"
            fill="var(--color-lime-500)"
            opacity={0.45 + (i / (bars.length - 1)) * 0.55}
          />
        );
      })}
    </svg>
  );
}

export function MetricCard({
  metric,
  hero = false,
  className,
}: {
  metric: Metric;
  hero?: boolean;
  className?: string;
}) {
  const Icon = LABEL_ICON[metric.label];

  if (hero) {
    const num = parseInt(metric.value) || 0;
    const bars = heroBars(num);
    const first = bars[0] ?? 1;
    const trendPct = first > 0 ? Math.round(((num - first) / first) * 100) : 0;
    const trendText = trendPct >= 0 ? `+${trendPct}%` : `${trendPct}%`;
    return (
      <div
        className={cn(
          "flex flex-col rounded-card bg-forest-800 px-5 py-5 shadow-card",
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-300">
            {metric.label}
          </p>
          {Icon && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-forest-700 text-lime-400">
              <Icon className="size-[14px]" strokeWidth={2} />
            </span>
          )}
        </div>
        <p className="mt-3 text-[44px] font-bold leading-none tracking-tight text-white">
          {metric.value}
        </p>
        {metric.sub && (
          <p className="mt-1 text-[12px] text-forest-400">{metric.sub}</p>
        )}
        <div className="mt-auto pt-5">
          <HeroBars value={metric.value} />
          <p className="mt-2 text-[12px] font-semibold text-lime-400">
            {trendText} son 7 günde
          </p>
        </div>
      </div>
    );
  }

  const showSparkline = SPARKLINE_LABELS.has(metric.label) && (parseInt(metric.value) || 0) > 0;

  return (
    <div className={cn("rounded-card border border-hair bg-surface px-5 py-4 shadow-card", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">
          {metric.label}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-[8px]",
              chipClass[metric.tone]
            )}
          >
            <Icon className="size-[14px]" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-2 text-[36px] font-bold leading-none tracking-tight text-text-strong">
        {metric.value}
      </p>
      {showSparkline && (
        <div className="mt-2 text-text-muted">
          <LineSparkline label={metric.label} value={metric.value} />
        </div>
      )}
      {metric.sub && (
        <p className={cn("mt-2 text-[12px] font-medium", subClass[metric.tone])}>
          {metric.sub}
        </p>
      )}
    </div>
  );
}
