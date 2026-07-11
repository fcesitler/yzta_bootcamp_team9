"use client";

import { useState } from "react";
import { Sparkles, Pencil, Send, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  conversations,
  classificationMeta,
  leadById,
  type Classification,
} from "@/lib/mock";

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  sage: "bg-forest-50 text-forest-800",
  amber: "bg-warning-bg text-warning",
  pink: "bg-danger-bg text-danger",
};

const classToneClass: Record<string, string> = {
  positive: "bg-positive-bg text-positive",
  warning: "bg-warning-bg text-warning",
  default: "bg-surface-2 text-text-muted",
};

function ClassBadge({ c }: { c: Classification }) {
  const meta = classificationMeta[c];
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
        classToneClass[meta.tone]
      )}
    >
      {meta.label}
    </span>
  );
}

export function ConversationsView() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const active = conversations.find((c) => c.id === activeId)!;
  const lead = leadById(active.leadId);

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-6xl gap-4">
      {/* Konuşma listesi */}
      <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="border-b border-hair px-4 py-3">
          <h1 className="text-[15px] font-medium text-text-strong">Konuşmalar</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const l = leadById(c.leadId);
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-hair px-4 py-3 text-left transition-colors",
                  isActive ? "bg-forest-50" : "hover:bg-surface-2"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium",
                    tintClass[l.tint]
                  )}
                >
                  {l.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[14px] font-medium text-text-strong">
                      {l.company}
                    </p>
                    <ClassBadge c={c.classification} />
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-text-muted">
                    {c.preview}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="flex items-center gap-3 border-b border-hair px-6 py-4">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium",
              tintClass[lead.tint]
            )}
          >
            {lead.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-text-strong">
              {lead.company}
            </p>
            <p className="text-[12px] text-text-muted">
              {lead.contact} · {lead.title}
            </p>
          </div>
          <div className="ml-auto">
            <ClassBadge c={active.classification} />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {active.messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.from === "us" ? "justify-end" : "justify-start")}
            >
              <div className="max-w-[78%]">
                <div
                  className={cn(
                    "whitespace-pre-line rounded-[12px] px-4 py-3 text-[13px] leading-relaxed",
                    m.from === "us"
                      ? "bg-forest-50 text-forest-900"
                      : "bg-surface-2 text-text"
                  )}
                >
                  {m.text}
                </div>
                <p
                  className={cn(
                    "mt-1 text-[11px] text-text-faint",
                    m.from === "us" ? "text-right" : "text-left"
                  )}
                >
                  {m.from === "us" ? "Sen" : lead.contact} · {m.time}
                </p>
              </div>
            </div>
          ))}

          {/* AI önerilen yanıt */}
          <div className="rounded-[12px] border border-lime-200 bg-lime-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-800 px-2.5 py-1 text-[11px] font-medium text-lime-400">
                <Sparkles className="size-3" />
                AI ÖNERİLEN YANIT
              </span>
              <span className="text-[12px] text-forest-700">{active.suggested.note}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-forest-900">
              {active.suggested.body}
            </p>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex gap-2 border-t border-hair px-6 py-4">
          <button className="inline-flex items-center gap-2 rounded-[10px] border border-hair px-4 py-2.5 text-[14px] font-medium text-text transition-colors hover:bg-surface-2">
            <Pencil className="size-4" />
            Yanıtı düzenle
          </button>
          <button className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700">
            <Send className="size-4" strokeWidth={2.2} />
            Yanıtı gönder
          </button>
          <button className="ml-auto inline-flex items-center gap-2 rounded-[10px] bg-lime-500 px-4 py-2.5 text-[14px] font-medium text-forest-900 transition-colors hover:bg-lime-400">
            <CalendarPlus className="size-4" strokeWidth={2.2} />
            Toplantı ayarla
          </button>
        </div>
      </div>
    </div>
  );
}
