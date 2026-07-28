"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { approveLead } from "@/app/(app)/campaigns/actions";

// Tip burada lokal tanımlı — queries.ts server-only Supabase client import ettiği
// için client bundle'a sızmasın diye oradan import edilmiyor.
type QueueLead = {
  id: string;
  company: string;
  initials: string | null;
  tint: string;
  contact: string | null;
  title: string | null;
  score: number | null;
};

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  sage: "bg-forest-50 text-forest-800",
  amber: "bg-warning-bg text-warning",
  pink: "bg-danger-bg text-danger",
};

export function ApprovalQueue({
  leads,
  total,
}: {
  leads: QueueLead[];
  total: number;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleApprove(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await approveLead(id);
      setPendingId(null);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex h-full flex-col rounded-card border border-hair bg-surface px-6 py-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-text-strong">
          <CheckCircle2 className="size-[15px] text-forest-800" strokeWidth={2} />
          Onay Bekleyen Leadler
        </h2>
        {total > 0 && (
          <span className="shrink-0 rounded-full bg-warning-bg px-2.5 py-0.5 text-[11px] font-medium text-warning">
            {total} bekliyor
          </span>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-[12px] bg-forest-50 text-forest-700">
            <CheckCircle2 className="size-5" strokeWidth={2} />
          </div>
          <p className="mt-3 text-[14px] font-medium text-text-strong">Kuyruk temiz</p>
          <p className="mt-1 text-[13px] text-text-muted">
            Onay bekleyen taslak yok. Kampanya çalışınca yeni leadler burada belirir.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <p className="mt-3 rounded-[8px] bg-danger-bg px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          )}

          <div className="mt-3 divide-y divide-hair">
            {leads.map((l) => {
              const isPending = pendingId === l.id;
              const meta = [l.contact, l.title].filter(Boolean).join(" · ");
              return (
                <div key={l.id} className="flex items-center gap-3 py-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-semibold",
                      tintClass[l.tint] ?? tintClass.lime
                    )}
                  >
                    {l.initials ?? l.company.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-text-strong">
                      {l.company}
                    </p>
                    {meta && (
                      <p className="truncate text-[12px] text-text-muted">{meta}</p>
                    )}
                  </div>

                  {l.score != null && (
                    <span className="shrink-0 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-forest-700">
                      {l.score}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleApprove(l.id)}
                    disabled={pendingId !== null}
                    className="flex shrink-0 items-center gap-1 rounded-[7px] bg-forest-800 px-2.5 py-1.5 text-[11.5px] font-semibold text-lime-400 transition-opacity hover:opacity-85 disabled:opacity-45"
                  >
                    {isPending && <Loader2 className="size-3 animate-spin" />}
                    {isPending ? "Gönderiliyor" : "Onayla"}
                  </button>
                </div>
              );
            })}
          </div>

          {total > leads.length && (
            <Link
              href="/campaigns"
              className="mt-3 flex items-center justify-center gap-1 text-[12px] font-medium text-text-muted transition-colors hover:text-forest-800"
            >
              {total - leads.length} lead daha
              <ArrowRight className="size-3" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
