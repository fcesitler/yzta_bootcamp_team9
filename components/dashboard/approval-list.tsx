import { cn } from "@/lib/utils";
import { approvals } from "@/lib/mock";

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  pink: "bg-danger-bg text-danger",
};

export function ApprovalList() {
  return (
    <div className="rounded-card border border-hair bg-surface px-6 py-5">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-medium text-text-strong">
          Onayını bekliyor
        </h2>
        <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-[12px] font-medium text-warning">
          {approvals.length} taslak
        </span>
      </div>

      <div className="mt-4 divide-y divide-hair">
        {approvals.map((a) => (
          <div key={a.company} className="flex items-start gap-3 py-3.5">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium",
                tintClass[a.tint]
              )}
            >
              {a.initials}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-text-strong">
                {a.company}{" "}
                <span className="font-normal text-text-muted">· {a.contact}</span>
              </p>
              <p className="mt-0.5 truncate text-[13px] text-text-muted">
                {a.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
