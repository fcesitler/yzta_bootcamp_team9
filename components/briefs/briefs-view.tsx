"use client";

import { useState } from "react";
import { Calendar, Clock, Video, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { meetings, leadById } from "@/lib/mock";

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  sage: "bg-forest-50 text-forest-800",
  amber: "bg-warning-bg text-warning",
  pink: "bg-danger-bg text-danger",
};

const personInitials = (name: string) =>
  name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function BriefsView() {
  const [activeId, setActiveId] = useState(meetings[0].id);
  const active = meetings.find((m) => m.id === activeId)!;
  const lead = leadById(active.leadId);

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-6xl gap-4">
      {/* Toplantı listesi */}
      <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="border-b border-hair px-4 py-3">
          <h1 className="text-[15px] font-medium text-text-strong">
            Yaklaşan toplantılar
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {meetings.map((m) => {
            const l = leadById(m.leadId);
            const isActive = m.id === activeId;
            return (
              <button
                key={m.id}
                onClick={() => setActiveId(m.id)}
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
                  <p className="truncate text-[14px] font-medium text-text-strong">
                    {l.company}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-text-muted">
                    <Calendar className="size-3" />
                    {m.when}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brief detayı */}
      <div className="min-w-0 flex-1 overflow-y-auto rounded-card border border-hair bg-surface">
        {/* Başlık */}
        <div className="border-b border-hair px-7 py-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-medium",
                tintClass[lead.tint]
              )}
            >
              {lead.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[20px] font-medium text-text-strong">
                {lead.company}
              </p>
              <p className="text-[13px] text-text-muted">
                {lead.industry} · {lead.size} · {lead.location} · {active.domain}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-text">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 text-forest-700" />
              {active.when}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 text-forest-700" />
              {active.duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Video className="size-4 text-forest-700" />
              {active.channel}
            </span>
          </div>
        </div>

        <div className="space-y-7 px-7 py-6">
          {/* Önemli kişiler */}
          <section>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
              Önemli kişiler
            </p>
            <div className="mt-3 space-y-3">
              {active.keyPeople.map((p) => (
                <div key={p.name} className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-[12px] font-medium text-forest-800">
                    {personInitials(p.name)}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-text-strong">
                      {p.name}
                    </p>
                    <p className="text-[12px] text-text-muted">{p.role}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-text">
                      {p.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Konuşma özeti */}
          <section>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
              Konuşma özeti
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-text">
              {active.conversation}
            </p>
          </section>

          {/* Konuşma noktaları */}
          <section>
            <div className="flex items-center gap-1.5 text-forest-800">
              <Sparkles className="size-3.5" />
              <p className="text-[11px] font-medium uppercase tracking-wide">
                Konuşma noktaları
              </p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {active.talkingPoints.map((point, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lime-500" />
                  <span className="text-[14px] leading-relaxed text-text">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
