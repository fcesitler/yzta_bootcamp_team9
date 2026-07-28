import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Geri + başlık */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Stage filtre şeridi */}
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Lead kartları */}
      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-card border border-hair bg-surface px-5 py-3.5">
            <Skeleton className="size-9 shrink-0 rounded-[10px]" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-3 w-48" />
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-[8px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
