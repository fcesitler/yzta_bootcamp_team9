import {
  Users,
  Target,
  Clock,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Metric } from "@/lib/mock";

const LABEL_ICON: Record<string, LucideIcon> = {
  "Bulunan Lead": Users,
  "Ort. ICP Skoru": Target,
  "Yanıt Oranı": TrendingUp,
  "Onay Bekleyen": Clock,
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

function heroBars(end: number): number[] {
  const v = Math.max(1, end);
  return Array.from({ length: 7 }, (_, i) => {
    const progress = i / 6;
    return Math.max(1, Math.round(v * (0.4 + progress * 0.55) + Math.sin(i * 1.9) * v * 0.07));
  });
}

function HeroBars({ value }: { value: string }) {
  const num = parseInt(value) || 0;
  const bars = heroBars(num);
  const max = Math.max(...bars, 1);
  const W = 88, H = 24, gap = 3;
  const barW = Math.floor((W - gap * (bars.length - 1)) / bars.length);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {bars.map((b, i) => {
        const bh = Math.max(2, (b / max) * H);
        return (
          <rect
            key={i}
            x={(barW + gap) * i}
            y={H - bh}
            width={barW}
            height={bh}
            rx="2"
            fill="var(--color-lime-500)"
            opacity={0.4 + (i / (bars.length - 1)) * 0.6}
          />
        );
      })}
    </svg>
  );
}

export function MetricCard({
  metric,
  hero = false,
  sparkline = false,
  className,
}: {
  metric: Metric;
  hero?: boolean;
  sparkline?: boolean;
  className?: string;
}) {
  const Icon = LABEL_ICON[metric.label];

  if (hero || sparkline) {
    const num = parseInt(metric.value) || 0;
    const bars = heroBars(num);
    const first = bars[0] ?? 1;
    const trendPct = first > 0 ? Math.round(((num - first) / first) * 100) : 0;
    const trendText = trendPct >= 0 ? `+${trendPct}%` : `${trendPct}%`;
    return (
      <div
        className={cn(
          "flex flex-col rounded-card bg-forest-800 px-5 py-4 shadow-card",
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
        <p className="mt-2 text-[36px] font-bold leading-none tracking-tight text-white">
          {metric.value}
        </p>
        {metric.sub && (
          <p className="mt-1 text-[12px] text-forest-400">{metric.sub}</p>
        )}
        <div className="mt-3 flex items-end justify-between gap-2">
          <HeroBars value={metric.value} />
          <p className="text-[11px] font-semibold leading-tight text-right text-lime-400">
            {trendText}<br />son 7 gün
          </p>
        </div>
      </div>
    );
  }

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
      {metric.sub && (
        <p className={cn("mt-2 text-[12px] font-medium", subClass[metric.tone])}>
          {metric.sub}
        </p>
      )}
    </div>
  );
}
