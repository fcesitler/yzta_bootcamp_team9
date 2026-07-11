"use client";

import { useEffect } from "react";
import { X, Sparkles, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Lead, type Stage, stageMeta } from "@/lib/mock";

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  sage: "bg-forest-50 text-forest-800",
  amber: "bg-warning-bg text-warning",
  pink: "bg-danger-bg text-danger",
};

const stageToneClass: Record<string, string> = {
  warning: "bg-warning-bg text-warning",
  default: "bg-surface-2 text-text-muted",
  positive: "bg-positive-bg text-positive",
  accent: "bg-lime-100 text-forest-800",
};

const scoreColor = (score: number) =>
  score >= 85 ? "text-positive" : score >= 70 ? "text-forest-700" : "text-warning";

export function LeadDrawer({
  lead,
  onClose,
  onStageChange,
}: {
  lead: Lead | null;
  onClose: () => void;
  onStageChange: (id: string, stage: Stage) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = lead !== null;

  return (
    <>
      {/* Örtü */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-forest-900/20 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[440px] max-w-[92vw] flex-col border-l border-hair bg-surface shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {lead && (
          <>
            {/* Başlık */}
            <div className="flex items-start gap-3 border-b border-hair px-6 py-5">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[14px] font-medium",
                  tintClass[lead.tint]
                )}
              >
                {lead.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-medium text-text-strong">
                  {lead.company}
                </p>
                <p className="text-[13px] text-text-muted">
                  {lead.industry} · {lead.size} · {lead.location}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Kapat"
                className="rounded-md p-1 text-text-faint transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Kişi + skor */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-medium text-text-strong">
                    {lead.contact}
                  </p>
                  <p className="text-[13px] text-text-muted">{lead.title}</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-[26px] font-medium leading-none", scoreColor(lead.score))}>
                    {lead.score}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-text-faint">
                    ICP skoru
                  </p>
                </div>
              </div>

              {/* Neden şimdi */}
              <div className="mt-5 rounded-[10px] bg-lime-50 px-4 py-3">
                <div className="flex items-center gap-1.5 text-forest-800">
                  <Sparkles className="size-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">
                    Neden şimdi?
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-forest-900">
                  {lead.whyNow}
                </p>
              </div>

              {/* Taslak mesaj */}
              <div className="mt-5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
                  Taslak e-posta
                </p>
                <div className="mt-2 rounded-[10px] border border-hair bg-surface-2/50 px-4 py-3">
                  <p className="text-[13px] font-medium text-text-strong">
                    {lead.draftSubject}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-text">
                    {lead.draftBody}
                  </p>
                </div>
              </div>
            </div>

            {/* Aksiyonlar */}
            <div className="border-t border-hair px-6 py-4">
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-text-muted">Durum:</span>
                {(Object.keys(stageMeta) as Stage[]).map((s) => {
                  const active = lead.stage === s;
                  return (
                    <button
                      key={s}
                      onClick={() => onStageChange(lead.id, s)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[12px] transition-colors",
                        active
                          ? stageToneClass[stageMeta[s].tone]
                          : "text-text-faint hover:bg-surface-2"
                      )}
                    >
                      {stageMeta[s].label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700">
                  <Check className="size-4" strokeWidth={2.4} />
                  Onayla &amp; gönder
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-hair px-4 py-2.5 text-[14px] font-medium text-text transition-colors hover:bg-surface-2">
                  <Pencil className="size-4" />
                  Düzenle
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
