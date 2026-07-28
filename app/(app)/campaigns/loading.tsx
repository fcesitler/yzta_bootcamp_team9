import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-9 w-36 rounded-[10px]" />
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-hair bg-surface px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-1.5 h-3 w-64" />
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-3 w-12" />
                  ))}
                </div>
                <Skeleton className="size-5 rounded-[4px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
