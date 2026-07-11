"use client";

import { useState } from "react";
import { Sparkles, FileText, Send, Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  contracts,
  contractStatusMeta,
  leadById,
  formatMoney,
  type ContractStatus,
} from "@/lib/mock";

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  sage: "bg-forest-50 text-forest-800",
  amber: "bg-warning-bg text-warning",
  pink: "bg-danger-bg text-danger",
};

const statusToneClass: Record<string, string> = {
  default: "bg-surface-2 text-text-muted",
  warning: "bg-warning-bg text-warning",
  positive: "bg-positive-bg text-positive",
};

export function CloseView() {
  const [activeId, setActiveId] = useState(contracts[0].id);
  const [statusById, setStatusById] = useState<Record<string, ContractStatus>>(
    Object.fromEntries(contracts.map((c) => [c.id, c.status]))
  );

  const active = contracts.find((c) => c.id === activeId)!;
  const lead = leadById(active.leadId);
  const status = statusById[active.id];

  const setStatus = (s: ContractStatus) =>
    setStatusById((prev) => ({ ...prev, [active.id]: s }));

  const variables = [
    { label: "Firma", value: lead.company },
    { label: "Kapsam", value: active.scope },
    {
      label: "Bedel",
      value: `${formatMoney(active.amount, active.currency)} / ${active.billing}`,
    },
    { label: "Süre", value: active.term },
    { label: "Başlangıç", value: active.startDate },
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-6xl gap-4">
      {/* Kapanan anlaşmalar */}
      <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="border-b border-hair px-4 py-3">
          <h1 className="text-[15px] font-medium text-text-strong">
            Kapanan anlaşmalar
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contracts.map((c) => {
            const l = leadById(c.leadId);
            const isActive = c.id === activeId;
            const meta = contractStatusMeta[statusById[c.id]];
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
                  <p className="truncate text-[14px] font-medium text-text-strong">
                    {l.company}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-[12px] text-text-muted">
                    {formatMoney(c.amount, c.currency)}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        statusToneClass[meta.tone]
                      )}
                    >
                      {meta.label}
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sözleşme */}
      <div className="min-w-0 flex-1 overflow-y-auto rounded-card border border-hair bg-surface">
        {/* Başlık */}
        <div className="flex items-center gap-3 border-b border-hair px-7 py-5">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[14px] font-medium",
              tintClass[lead.tint]
            )}
          >
            {lead.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[18px] font-medium text-text-strong">
              {lead.company}
            </p>
            <p className="text-[13px] text-text-muted">
              {lead.contact} · {lead.title}
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-positive-bg px-3 py-1 text-[12px] font-medium text-positive">
            <Trophy className="size-3.5" />
            Anlaşma kazanıldı
          </span>
        </div>

        <div className="space-y-6 px-7 py-6">
          {/* AI doldurdu — değişkenler */}
          <section>
            <div className="flex items-center gap-1.5 text-forest-800">
              <Sparkles className="size-3.5" />
              <p className="text-[11px] font-medium uppercase tracking-wide">
                Sözleşme değişkenleri · AI doldurdu
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {variables.map((v) => (
                <div
                  key={v.label}
                  className="rounded-[10px] bg-lime-50 px-4 py-2.5"
                >
                  <p className="text-[11px] uppercase tracking-wide text-forest-700">
                    {v.label}
                  </p>
                  <p className="mt-0.5 text-[14px] font-medium text-forest-900">
                    {v.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Belge önizleme */}
          <section>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
              Belge önizleme
            </p>
            <div className="mt-3 rounded-[10px] border border-hair bg-surface-2/40 px-6 py-5 text-[13px] leading-relaxed text-text">
              <p className="text-center text-[15px] font-medium text-text-strong">
                HİZMET SÖZLEŞMESİ
              </p>
              <p className="mt-4">
                İşbu sözleşme, <b className="text-forest-800">Studio Nova</b> (&quot;Hizmet
                Sağlayıcı&quot;) ile{" "}
                <b className="text-forest-800">{lead.company}</b> (&quot;Müşteri&quot;)
                arasında{" "}
                <b className="text-forest-800">{active.startDate}</b> tarihinde
                akdedilmiştir.
              </p>
              <p className="mt-3">
                <b>1. Kapsam.</b> Hizmet Sağlayıcı, Müşteri&apos;ye{" "}
                <b className="text-forest-800">{active.scope}</b> hizmetini{" "}
                <b className="text-forest-800">{active.term}</b> süresince sağlayacaktır.
              </p>
              <p className="mt-3">
                <b>2. Bedel.</b> Hizmet bedeli{" "}
                <b className="text-forest-800">
                  {formatMoney(active.amount, active.currency)}
                </b>{" "}
                olup <b className="text-forest-800">{active.billing}</b> olarak
                faturalandırılacaktır.
              </p>
              <p className="mt-3 text-text-muted">
                3. Gizlilik, fesih ve diğer standart maddeler ekte yer almaktadır.
              </p>
            </div>
          </section>

          {/* Aksiyonlar */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-[10px] border border-hair px-4 py-2.5 text-[14px] font-medium text-text transition-colors hover:bg-surface-2">
              <FileText className="size-4" />
              PDF oluştur
            </button>
            <button
              onClick={() => setStatus("sent")}
              className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700"
            >
              <Send className="size-4" strokeWidth={2.2} />
              Müşteriye gönder
            </button>
            {status === "sent" && (
              <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-positive">
                <Check className="size-4" strokeWidth={2.4} />
                Sözleşme {lead.contact}&apos;a gönderildi.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
