import Link from "next/link";

type PipelineStage = { n: string; label: string; value: number; color?: string };

// Tailwind v4 statik tarama için hardcode — dinamik string'den gelen renk derlenmez
const BAR_COLORS = [
  "bg-lime-500",
  "bg-forest-400",
  "bg-forest-600",
  "bg-forest-800",
] as const;

export function PipelineFunnel({ stages }: { stages: PipelineStage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="rounded-card border border-hair bg-surface px-6 py-5 shadow-card">
      <h2 className="text-[15px] font-semibold text-text-strong">Pipeline</h2>

      <div className="mt-5 flex flex-col gap-4">
        {stages.map((stage, i) => {
          const pct = Math.max(5, Math.round((stage.value / max) * 100));
          const barColor = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <Link
              key={stage.n}
              href="/campaigns"
              className="group flex flex-col gap-2"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-text-faint">
                    {stage.n}
                  </span>
                  <span className="text-[13px] font-medium text-text-strong transition-colors group-hover:text-forest-800">
                    {stage.label}
                  </span>
                </div>
                <span className="text-[20px] font-bold leading-none tracking-tight text-text-strong">
                  {stage.value}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-hair">
                <div
                  className={`h-3 rounded-full transition-all duration-500 group-hover:opacity-75 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
