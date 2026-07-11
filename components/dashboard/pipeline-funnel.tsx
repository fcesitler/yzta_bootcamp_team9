import Link from "next/link";
import { cn } from "@/lib/utils";
import { funnel } from "@/lib/mock";

export function PipelineFunnel() {
  const max = Math.max(...funnel.map((s) => s.value));

  return (
    <div className="rounded-card border border-hair bg-surface px-6 py-5">
      <h2 className="text-[16px] font-medium text-text-strong">
        Pipeline hunisi
      </h2>

      <div className="mt-5 grid grid-cols-4 gap-4">
        {funnel.map((stage) => (
          <Link
            key={stage.n}
            href="/leads"
            className="group flex flex-col gap-2 rounded-[10px] p-2 transition-colors hover:bg-surface-2"
          >
            <span className="text-[12px] text-text-faint">{stage.n}</span>
            <span className="text-[14px] font-medium text-text-strong">
              {stage.label}
            </span>
            <span className="text-[24px] font-medium leading-none text-text-strong">
              {stage.value}
            </span>
            <div className="mt-1 flex h-9 items-end">
              <div
                className={cn(
                  "w-full rounded-[6px] transition-all group-hover:opacity-90",
                  stage.color
                )}
                style={{ height: `${Math.round((stage.value / max) * 100)}%` }}
              />
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-4 text-[13px] text-text-muted">
        Bir adıma tıkla → lead listesini filtrele.
      </p>
    </div>
  );
}
