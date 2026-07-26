import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ApprovalLead = {
  id: string;
  company: string;
  initials: string | null;
  tint: string;
  contact: string | null;
  score: number | null;
  research: { whyNow?: string } | null;
};

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  sage: "bg-forest-50 text-forest-800",
  amber: "bg-warning-bg text-warning",
  pink: "bg-danger-bg text-danger",
};

export function ApprovalList({ leads }: { leads: ApprovalLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col rounded-card border border-hair bg-surface px-6 py-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[16px] font-medium text-text-strong">Onayını bekliyor</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="flex size-11 items-center justify-center rounded-[12px] bg-forest-50 text-forest-700">
            <Check className="size-5" strokeWidth={2} />
          </div>
          <p className="mt-3 text-[14px] font-medium text-text-strong">Hepsi temiz</p>
          <p className="mt-1 text-[13px] text-text-muted">
            Onay bekleyen taslak yok. Kampanya çalışınca yeni leadler burada belirir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-hair bg-surface px-6 py-5">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-medium text-text-strong">Onayını bekliyor</h2>
        <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-[12px] font-medium text-warning">
          {leads.length} taslak
        </span>
      </div>

      <div className="mt-4 divide-y divide-hair">
        {leads.map((l) => (
          <div key={l.id} className="flex items-start gap-3 py-3.5">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium", tintClass[l.tint] ?? tintClass.lime)}>
              {l.initials ?? l.company.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-text-strong">
                {l.company}{" "}
                {l.contact && <span className="font-normal text-text-muted">· {l.contact}</span>}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-text-muted">
                {l.research?.whyNow ?? (l.score ? `ICP skoru ${l.score}` : "Taslak hazır")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
