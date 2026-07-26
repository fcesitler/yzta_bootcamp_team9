"use client";

import { useState, useTransition } from "react";
import { Calendar, Sparkles, Trophy, AlertTriangle, X, FileText, Wallet, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbLead } from "@/lib/db/types";
import { closeDeal, loseDeal } from "@/app/(app)/briefs/actions";
import type { ContractInput } from "@/app/(app)/briefs/actions";

const tintClass: Record<string, string> = {
  lime: "bg-lime-100 text-forest-800",
  sage: "bg-forest-50 text-forest-800",
  amber: "bg-warning-bg text-warning",
  pink: "bg-danger-bg text-danger",
};

function formatMeetingTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const EMPTY_FORM: ContractInput = {
  scope: "",
  amount: 0,
  currency: "TRY",
  billing: "aylık",
  term: "",
  start_date: "",
};

export function BriefsView({ leads }: { leads: DbLead[] }) {
  const [activeId, setActiveId] = useState(leads[0].id);
  const [modalOpen, setModalOpen] = useState(false);
  const [lostConfirm, setLostConfirm] = useState(false);
  const [form, setForm] = useState<ContractInput>(EMPTY_FORM);
  const [actionError, setActionError] = useState("");
  const [wonPending, startWonTransition] = useTransition();
  const [lostPending, startLostTransition] = useTransition();

  const active = leads.find((l) => l.id === activeId) ?? leads[0];

  function switchActive(id: string) {
    setActiveId(id);
    setModalOpen(false);
    setLostConfirm(false);
    setActionError("");
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setActionError("");
    setModalOpen(true);
  }

  function handleWonSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.scope.trim() || !form.term.trim() || !form.start_date) return;
    setActionError("");
    startWonTransition(async () => {
      const result = await closeDeal(active.id, form);
      if (result.success) {
        setModalOpen(false);
      } else {
        setActionError(result.error ?? "Hata oluştu.");
      }
    });
  }

  function handleLost() {
    setActionError("");
    startLostTransition(async () => {
      const result = await loseDeal(active.id);
      if (!result.success) setActionError(result.error ?? "Hata oluştu.");
      setLostConfirm(false);
    });
  }

  const field = (label: string, children: React.ReactNode, hint?: string) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-text-strong">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-text-faint">{hint}</p>}
    </div>
  );

  const inputCls = "w-full rounded-[10px] border border-hair bg-surface px-3.5 py-2.5 text-[14px] text-text-strong placeholder:text-text-faint transition-all focus:outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100";

  const currencySymbol: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

  return (
    <>
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-6xl gap-4">
      {/* Toplantı listesi */}
      <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="border-b border-hair px-4 py-3">
          <h1 className="text-[15px] font-medium text-text-strong">Yaklaşan toplantılar</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leads.map((l) => {
            const isActive = l.id === activeId;
            return (
              <button
                key={l.id}
                onClick={() => switchActive(l.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-hair px-4 py-3 text-left transition-colors",
                  isActive ? "bg-forest-50" : "hover:bg-surface-2"
                )}
              >
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium", tintClass[l.tint] ?? tintClass.lime)}>
                  {l.initials ?? l.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-text-strong">{l.company}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-text-muted">
                    <Calendar className="size-3" />
                    {formatMeetingTime(l.research?.meetingTime)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brief detayı */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        {/* Header */}
        <div className="border-b border-hair px-7 py-5">
          <div className="flex items-start gap-3">
            <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-medium", tintClass[active.tint] ?? tintClass.lime)}>
              {active.initials ?? active.company.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[20px] font-medium text-text-strong">{active.company}</p>
              <p className="text-[13px] text-text-muted">
                {active.contact}
                {active.research?.industry ? ` · ${active.research.industry}` : ""}
                {active.research?.meetingTime ? ` · ${formatMeetingTime(active.research.meetingTime)}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Brief içeriği */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <div className="flex items-center gap-1.5 text-forest-800">
            <Sparkles className="size-3.5" />
            <p className="text-[11px] font-medium uppercase tracking-wide">AI Toplantı Brief&apos;i</p>
          </div>
          <div className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-text">
            {active.research?.meetingBrief ?? "Brief henüz oluşturulmadı."}
          </div>
        </div>

        {/* Aksiyon çubuğu */}
        <div className="flex items-center gap-3 border-t border-hair px-7 py-4">
          {actionError && (
            <p className="mr-auto text-[13px] text-danger">{actionError}</p>
          )}

          {lostConfirm ? (
            <div className="flex w-full items-center gap-3">
              <p className="text-[13px] text-text-muted">Anlaşma kaybedildi olarak işaretlensin mi?</p>
              <button
                onClick={() => { setLostConfirm(false); setActionError(""); }}
                disabled={lostPending}
                className="ml-auto inline-flex items-center gap-1.5 rounded-[10px] border border-hair px-4 py-2 text-[13px] font-medium text-text hover:bg-surface-2 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleLost}
                disabled={lostPending}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-danger px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
              >
                {lostPending ? "İşleniyor..." : "Onayla"}
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setLostConfirm(true)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-hair px-4 py-2.5 text-[14px] font-medium text-text-muted transition-colors hover:border-danger hover:text-danger"
              >
                <AlertTriangle className="size-4" strokeWidth={2} />
                Anlaşma Bağlanamadı
              </button>
              <button
                onClick={openModal}
                className="ml-auto inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700"
              >
                <Trophy className="size-4" strokeWidth={2} />
                Anlaşma Bağlandı
              </button>
            </>
          )}
        </div>
      </div>

    </div>

    {/* Modal — layout dışına taşındı, viewport'a fixed */}
    {modalOpen && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-forest-950/50 p-4 backdrop-blur-sm"
        onClick={() => setModalOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="my-8 w-full max-w-[560px] overflow-hidden rounded-[18px] border border-hair bg-surface shadow-[0_24px_60px_-12px_rgba(15,58,42,0.28)]"
        >
          {/* Header */}
          <div className="relative border-b border-hair bg-gradient-to-br from-forest-50 to-surface px-7 pt-6 pb-5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-[10px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text-strong"
              aria-label="Kapat"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
            <div className="flex items-center gap-3">
              <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[14px] font-semibold", tintClass[active.tint] ?? tintClass.lime)}>
                {active.initials ?? active.company.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Trophy className="size-3.5 text-forest-700" strokeWidth={2.2} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-forest-700">
                    Anlaşma Detayları
                  </p>
                </div>
                <p className="mt-0.5 text-[17px] font-semibold text-text-strong">{active.company}</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-text-muted">
              Sözleşme değişkenlerini doldur — sistem PDF üretip Gmail taslağı hazırlayacak.
            </p>
          </div>

          <form onSubmit={handleWonSubmit}>
          {/* Form */}
          <div className="space-y-5 px-7 py-6">
            {/* Kapsam */}
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-text-strong">
                <FileText className="size-3.5 text-forest-700" strokeWidth={2.2} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">Hizmet</p>
              </div>
              {field("Kapsam",
                <textarea
                  className={cn(inputCls, "resize-none leading-relaxed")}
                  rows={3}
                  placeholder="Örn: AI SDR kurulumu, ICP tanımı, 3 aylık kampanya yönetimi ve haftalık optimizasyon"
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                  required
                />,
                "Sözleşmenin 1. maddesinde kullanılacak"
              )}
            </div>

            <div className="h-px bg-hair" />

            {/* Bedel */}
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-text-strong">
                <Wallet className="size-3.5 text-forest-700" strokeWidth={2.2} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">Ücretlendirme</p>
              </div>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                {field("Bedel",
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-text-faint">
                      {currencySymbol[form.currency] ?? ""}
                    </span>
                    <input
                      type="number"
                      min={0}
                      className={cn(inputCls, "pl-8 tabular-nums")}
                      placeholder="5000"
                      value={form.amount || ""}
                      onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                      required
                    />
                  </div>
                )}
                {field("Para Birimi",
                  <select
                    className={cn(inputCls, "cursor-pointer pr-8")}
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                )}
              </div>
              <div className="mt-3">
                {field("Faturalama",
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { v: "aylık", l: "Aylık" },
                      { v: "yıllık", l: "Yıllık" },
                      { v: "tek seferlik", l: "Tek sefer" },
                      { v: "proje bazlı", l: "Proje" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, billing: o.v }))}
                        className={cn(
                          "rounded-[10px] border px-3 py-2 text-[13px] font-medium transition-all",
                          form.billing === o.v
                            ? "border-forest-600 bg-forest-50 text-forest-800"
                            : "border-hair bg-surface text-text-muted hover:border-forest-300 hover:text-text-strong"
                        )}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-hair" />

            {/* Süre & Tarih */}
            <div>
              <div className="mb-3 flex items-center gap-1.5 text-text-strong">
                <CalendarDays className="size-3.5 text-forest-700" strokeWidth={2.2} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">Zaman Çerçevesi</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("Süre",
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint" strokeWidth={1.8} />
                    <input
                      type="text"
                      className={cn(inputCls, "pl-10")}
                      placeholder="3 ay"
                      value={form.term}
                      onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
                      required
                    />
                  </div>
                )}
                {field("Başlangıç",
                  <input
                    type="date"
                    className={cn(inputCls, "cursor-pointer tabular-nums")}
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    required
                  />
                )}
              </div>
            </div>

            {actionError && (
              <div className="rounded-[10px] border border-danger/20 bg-danger-bg px-3.5 py-2.5 text-[13px] text-danger">
                {actionError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-hair bg-surface-2/40 px-7 py-4">
            <p className="text-[12px] text-text-muted">
              Sözleşme e-posta ile gönderilmeden önce onayınıza sunulur.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-[10px] px-4 py-2.5 text-[14px] font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text-strong"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={wonPending}
                className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-5 py-2.5 text-[14px] font-semibold text-paper shadow-sm transition-all hover:bg-forest-700 disabled:opacity-50"
              >
                <Trophy className="size-4" strokeWidth={2.2} />
                {wonPending ? "Oluşturuluyor..." : "Sözleşme Oluştur"}
              </button>
            </div>
          </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
