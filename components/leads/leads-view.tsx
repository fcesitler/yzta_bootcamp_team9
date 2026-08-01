"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  leadTabs,
  stageMeta,
  type Lead,
  type Stage,
} from "@/lib/mock";
import { LeadDrawer } from "@/components/leads/lead-drawer";

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
  danger: "bg-danger-bg text-danger",
};

export function LeadsView({ initialLeads = [] }: { initialLeads?: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [tab, setTab] = useState<"all" | Stage>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // "Tümü" düşük ICP'li lead'leri GÖSTERMEZ — bunlar kendi "Düşük ICP" sekmesinde
  // kalır, kullanıcının varsayılan görünümünü kaliteli lead'lerle temiz tutar.
  const filtered =
    tab === "all"
      ? leads.filter((l) => l.stage !== "low_score")
      : leads.filter((l) => l.stage === tab);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const count = (key: "all" | Stage) =>
    key === "all"
      ? leads.filter((l) => l.stage !== "low_score").length
      : leads.filter((l) => l.stage === key).length;

  const handleStageChange = (id: string, stage: Stage) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
  };

  return (
    <div>
      {/* Filtre sekmeleri */}
      <div className="flex flex-wrap gap-1.5">
        {leadTabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                active
                  ? "border-forest-800 bg-forest-800 font-medium text-paper"
                  : "border-hair text-text-muted hover:border-hair-2 hover:text-text"
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px]",
                  active ? "bg-forest-700 text-paper" : "text-text-faint"
                )}
              >
                {count(t.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tablo */}
      <div className="mt-5 overflow-hidden rounded-card border border-hair bg-surface shadow-card">
        <div className="grid grid-cols-[1.4fr_1.2fr_auto] gap-4 border-b border-hair px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-text-faint">
          <span>Şirket</span>
          <span>Kişi</span>
          <span className="text-right">Durum</span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-[14px] text-text-muted">
            Bu durumda lead yok.
          </p>
        ) : (
          filtered.map((lead) => {
            const meta = stageMeta[lead.stage] ?? { label: lead.stage, tone: "default" as const };
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className="grid w-full grid-cols-[1.4fr_1.2fr_auto] items-center gap-4 border-b border-hair px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium",
                      tintClass[lead.tint]
                    )}
                  >
                    {lead.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-text-strong">
                      {lead.company}
                    </p>
                    {lead.website ? (
                      <a
                        href={
                          lead.website.startsWith("http")
                            ? lead.website
                            : `https://${lead.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="block truncate text-[11px] text-text-muted hover:text-forest-700 hover:underline"
                      >
                        {lead.website}
                      </a>
                    ) : (
                      <p className="truncate text-[11px] text-text-muted">
                        Website yok
                      </p>
                    )}
                    <p className="truncate text-[12px] text-text-muted">
                      {lead.industry}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] text-text-strong">
                    {lead.contact}
                  </p>
                  <p className="truncate text-[12px] text-text-muted">
                    {lead.title}
                  </p>
                </div>
                <div className="justify-self-end">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
                      stageToneClass[meta.tone]
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current opacity-70" />
                    {meta.label}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <LeadDrawer
        lead={selected}
        onClose={() => setSelectedId(null)}
        onStageChange={handleStageChange}
      />
    </div>
  );
}
