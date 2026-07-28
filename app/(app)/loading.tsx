import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Başlık */}
      <div className="flex items-baseline justify-between gap-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Metric kartları */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-hair bg-surface p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Alt grid: sol geniş + sağ dar */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sol: chart + pipeline */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-card border border-hair bg-surface p-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-4 h-[180px] w-full rounded-[8px]" />
          </div>
          <div className="rounded-card border border-hair bg-surface p-5">
            <Skeleton className="h-4 w-28" />
            <div className="mt-4 flex items-end gap-3">
              {[80, 60, 45, 30, 20].map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-[6px]" style={{ height: h }} />
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: approval queue + activity */}
        <div className="flex flex-col gap-6">
          <div className="rounded-card border border-hair bg-surface p-5">
            <Skeleton className="h-4 w-32" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-[8px]" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="mt-1.5 h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-card border border-hair bg-surface p-5">
            <Skeleton className="h-4 w-28" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Skeleton className="mt-0.5 size-2 shrink-0 rounded-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
