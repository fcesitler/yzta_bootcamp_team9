import { cn } from "@/lib/utils";
import type { Metric } from "@/lib/mock";

const toneClass: Record<Metric["tone"], string> = {
  default: "text-text-muted",
  positive: "text-positive",
  warning: "text-warning",
};

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="rounded-card border border-hair bg-surface px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
        {metric.label}
      </p>
      <p className="mt-1 text-[28px] font-medium leading-none text-text-strong">
        {metric.value}
      </p>
      <p className={cn("mt-2 text-[13px] font-medium", toneClass[metric.tone])}>
        {metric.sub}
      </p>
    </div>
  );
}
