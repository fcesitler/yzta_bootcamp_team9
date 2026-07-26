"use client";

import { useState, useTransition } from "react";
import { Sparkles, FileText, Send, Check, Trophy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbContract } from "@/lib/db/types";
import { prepareDraft } from "@/app/(app)/close/actions";

export type CloseContract = DbContract & {
  leads: {
    company: string;
    initials: string | null;
    tint: string;
    contact: string | null;
    title: string | null;
  } | null;
};

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  sage: "bg-forest-50 text-forest-800",
  amber: "bg-warning-bg text-warning",
  pink: "bg-danger-bg text-danger",
};

const statusMeta: Record<string, { label: string; tone: string }> = {
  draft: { label: "Taslak", tone: "default" },
  draft_ready: { label: "Taslak Hazır", tone: "warning" },
  sent: { label: "Gönderildi", tone: "positive" },
  signed: { label: "İmzalandı", tone: "positive" },
};

const statusToneClass: Record<string, string> = {
  default: "bg-surface-2 text-text-muted",
  warning: "bg-warning-bg text-warning",
  positive: "bg-positive-bg text-positive",
};

function formatMoney(amount: number | null, currency: string) {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function CloseView({ contracts }: { contracts: CloseContract[] }) {
  const [activeId, setActiveId] = useState(contracts[0].id);
  const [draftError, setDraftError] = useState("");
  const [draftSent, setDraftSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const active = contracts.find((c) => c.id === activeId) ?? contracts[0];
  const lead = active.leads;
  const meta = statusMeta[active.status] ?? statusMeta.draft;

  function switchActive(id: string) {
    setActiveId(id);
    setDraftError("");
    setDraftSent(false);
  }

  function handlePrepareDraft() {
    setDraftError("");
    startTransition(async () => {
      const result = await prepareDraft(active.id);
      if (result.success) {
        setDraftSent(true);
      } else {
        setDraftError(result.error ?? "Hata oluştu.");
      }
    });
  }

  const variables = [
    { label: "Firma", value: lead?.company ?? "—" },
    { label: "Kapsam", value: active.scope ?? "—" },
    {
      label: "Bedel",
      value: active.amount != null
        ? `${formatMoney(active.amount, active.currency)} / ${active.billing ?? ""}`
        : "—",
    },
    { label: "Süre", value: active.term ?? "—" },
    { label: "Başlangıç", value: active.start_date ?? "—" },
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-6xl gap-4">
      {/* Kapanan anlaşmalar listesi */}
      <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="border-b border-hair px-4 py-3">
          <h1 className="text-[15px] font-medium text-text-strong">Kapanan anlaşmalar</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contracts.map((c) => {
            const l = c.leads;
            const isActive = c.id === activeId;
            const m = statusMeta[c.status] ?? statusMeta.draft;
            return (
              <button
                key={c.id}
                onClick={() => switchActive(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-hair px-4 py-3 text-left transition-colors",
                  isActive
                    ? "bg-forest-50 shadow-[inset_3px_0_0_var(--forest-800)]"
                    : "hover:bg-surface-2"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium",
                    tintClass[l?.tint ?? "lime"] ?? tintClass.lime
                  )}
                >
                  {l?.initials ?? l?.company.slice(0, 2).toUpperCase() ?? "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-text-strong">
                    {l?.company ?? "—"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-[12px] text-text-muted">
                    {formatMoney(c.amount, c.currency)}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        statusToneClass[m.tone] ?? statusToneClass.default
                      )}
                    >
                      {m.label}
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sözleşme detayı */}
      <div className="min-w-0 flex-1 overflow-y-auto rounded-card border border-hair bg-surface">
        {/* Başlık */}
        <div className="flex items-center gap-3 border-b border-hair px-7 py-5">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[14px] font-medium",
              tintClass[lead?.tint ?? "lime"] ?? tintClass.lime
            )}
          >
            {lead?.initials ?? lead?.company.slice(0, 2).toUpperCase() ?? "—"}
          </div>
          <div className="min-w-0">
            <p className="text-[18px] font-medium text-text-strong">{lead?.company ?? "—"}</p>
            <p className="text-[13px] text-text-muted">
              {lead?.contact} {lead?.title ? `· ${lead.title}` : ""}
            </p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-positive-bg px-3 py-1 text-[12px] font-medium text-positive">
            <Trophy className="size-3.5" />
            Anlaşma kazanıldı
          </span>
        </div>

        <div className="space-y-6 px-7 py-6">
          {/* Değişkenler */}
          <section>
            <div className="flex items-center gap-1.5 text-forest-800">
              <Sparkles className="size-3.5" />
              <p className="text-[11px] font-medium uppercase tracking-wide">
                Sözleşme Değişkenleri
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {variables.map((v) => (
                <div key={v.label} className="rounded-[10px] bg-lime-50 px-4 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-forest-700">{v.label}</p>
                  <p className="mt-0.5 text-[14px] font-medium text-forest-900">{v.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Belge önizleme */}
          <section>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
              Belge Önizleme
            </p>
            <div className="mt-3 rounded-[10px] border border-hair bg-surface-2/40 px-6 py-5 text-[13px] leading-relaxed text-text">
              <p className="text-center text-[15px] font-medium text-text-strong">HİZMET SÖZLEŞMESİ</p>
              <p className="mt-4">
                İşbu sözleşme, <b className="text-forest-800">Hallederiz</b> (&quot;Hizmet
                Sağlayıcı&quot;) ile{" "}
                <b className="text-forest-800">{lead?.company ?? "—"}</b> (&quot;Müşteri&quot;)
                arasında{" "}
                <b className="text-forest-800">{active.start_date ?? "—"}</b> tarihinde
                akdedilmiştir.
              </p>
              <p className="mt-3">
                <b>1. Kapsam.</b> Hizmet Sağlayıcı, Müşteri&apos;ye{" "}
                <b className="text-forest-800">{active.scope ?? "—"}</b> hizmetini{" "}
                <b className="text-forest-800">{active.term ?? "—"}</b> süresince sağlayacaktır.
              </p>
              <p className="mt-3">
                <b>2. Bedel.</b> Hizmet bedeli{" "}
                <b className="text-forest-800">{formatMoney(active.amount, active.currency)}</b>{" "}
                olup <b className="text-forest-800">{active.billing ?? "—"}</b> olarak
                faturalandırılacaktır.
              </p>
              <p className="mt-3 text-text-muted">
                3. Gizlilik, fesih ve diğer standart maddeler taslak e-postada yer almaktadır.
              </p>
            </div>
          </section>

          {/* Aksiyonlar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-[10px] border border-hair px-4 py-2.5 text-[14px] font-medium text-text transition-colors hover:bg-surface-2"
            >
              <FileText className="size-4" />
              PDF oluştur
            </button>

            {active.status === "draft_ready" ? (
              <a
                href="https://mail.google.com/mail/u/0/#drafts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700"
              >
                <Send className="size-4" strokeWidth={2.2} />
                Gmail Taslakları Aç
              </a>
            ) : active.status === "sent" || active.status === "signed" ? (
              <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-positive px-4 py-2.5 text-[14px] font-medium text-white">
                <Check className="size-4" strokeWidth={2.4} />
                Gönderildi
              </span>
            ) : draftSent ? (
              <p className="text-[13px] text-text-muted">
                Taslak hazırlanıyor — ~1 dk sonra Gmail&apos;i kontrol edin.
              </p>
            ) : (
              <button
                onClick={handlePrepareDraft}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2.2} />
                ) : (
                  <Send className="size-4" strokeWidth={2.2} />
                )}
                {isPending ? "Gönderiliyor..." : "Taslak Hazırla"}
              </button>
            )}

            {draftError && (
              <p className="text-[13px] text-danger">{draftError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
