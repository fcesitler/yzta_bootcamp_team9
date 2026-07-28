import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-6xl gap-4">
      {/* Konuşma listesi */}
      <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="border-b border-hair px-4 py-3">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-hair px-4 py-3">
              <Skeleton className="size-9 shrink-0 rounded-[10px]" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                <Skeleton className="mt-1.5 h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thread paneli */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="flex items-center gap-3 border-b border-hair px-6 py-4">
          <Skeleton className="size-9 shrink-0 rounded-[10px]" />
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1.5 h-3 w-48" />
          </div>
          <div className="ml-auto">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex-1 space-y-4 px-6 py-5">
          <div className="flex justify-end">
            <Skeleton className="h-20 w-[60%] rounded-[12px]" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-16 w-[55%] rounded-[12px]" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-[45%] rounded-[12px]" />
          </div>
          <Skeleton className="h-28 w-full rounded-[12px]" />
        </div>
        <div className="border-t border-hair px-6 py-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-[10px]" />
            <Skeleton className="h-10 w-32 rounded-[10px]" />
            <Skeleton className="ml-auto h-10 w-36 rounded-[10px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
