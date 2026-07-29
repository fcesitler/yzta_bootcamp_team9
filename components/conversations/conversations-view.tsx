"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Pencil, Send, CalendarPlus, Check, SearchX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { classificationMeta, type Classification } from "@/lib/mock";
import type { DbMessage } from "@/lib/db/types";
import type { LeadResearch } from "@/lib/db/types";
import { sendReply } from "@/app/(app)/conversations/actions";

type ConvLead = {
  id: string;
  company: string;
  initials: string | null;
  tint: string;
  contact: string | null;
  title: string | null;
  stage: string;
  research: LeadResearch | null;
};

type ConvItem = {
  lead: ConvLead;
  messages: DbMessage[];
  latestAt: string;
};

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
    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-medium", classToneClass[meta.tone])}>
      {meta.label}
    </span>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function ConversationsView({ conversations }: { conversations: ConvItem[] }) {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim().toLocaleLowerCase("tr-TR");

  // Topbar araması: firma, kişi, unvan ve mesaj içeriğinde eşleşenleri süz.
  const filtered = useMemo(() => {
    if (!query) return conversations;
    return conversations.filter((c) => {
      const haystack = [
        c.lead.company,
        c.lead.contact ?? "",
        c.lead.title ?? "",
        ...c.messages.map((m) => m.body),
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return haystack.includes(query);
    });
  }, [conversations, query]);

  const [activeId, setActiveId] = useState(conversations[0].lead.id);
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Aktif seçim filtre dışında kaldıysa görünen ilk konuşmaya düş.
  // (conversations en az 1 eleman içerir — boşsa page.tsx farklı ekran basar.)
  const hasResults = filtered.length > 0;
  const active =
    filtered.find((c) => c.lead.id === activeId) ?? filtered[0] ?? conversations[0];

  function switchActive(id: string) {
    setActiveId(id);
    setEditMode(false);
    setEditedText("");
    setSent(false);
  }

  const classification = (active.lead.research?.replyClassification ?? "irrelevant") as Classification;
  const suggestedReply =
    [...active.messages].reverse().find((m) => m.direction === "in")?.ai_suggested_reply ??
    active.lead.research?.suggestedReply ??
    "";
  const replyToSend = editMode ? editedText : suggestedReply;

  function handleEditToggle() {
    if (!editMode) setEditedText(suggestedReply);
    setEditMode((v) => !v);
  }

  function handleSend() {
    startTransition(async () => {
      const result = await sendReply(active.lead.id, replyToSend);
      if (result.success) {
        setSent(true);
        setEditMode(false);
        toast.success(`${active.lead.company} — yanıt gönderildi`);
      } else {
        toast.error("Yanıt gönderilemedi", { description: result.error ?? "Hata oluştu." });
      }
    });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-6xl gap-4">
      {/* Konuşma listesi */}
      <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="border-b border-hair px-4 py-3">
          <h1 className="text-[15px] font-medium text-text-strong">
            Konuşmalar
            {query && (
              <span className="ml-2 text-[12px] font-normal text-text-muted">
                {filtered.length} sonuç
              </span>
            )}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!hasResults && (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <SearchX className="size-6 text-text-faint" strokeWidth={1.6} />
              <p className="text-[13px] text-text-muted">
                “{searchParams.get("q")}” için konuşma bulunamadı.
              </p>
            </div>
          )}
          {filtered.map((c) => {
            const cls = (c.lead.research?.replyClassification ?? "irrelevant") as Classification;
            const preview = c.messages.find((m) => m.direction === "in")?.body ?? c.messages[0]?.body ?? "—";
            const isActive = c.lead.id === activeId;
            return (
              <button
                key={c.lead.id}
                onClick={() => switchActive(c.lead.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-hair px-4 py-3 text-left transition-colors",
                  isActive
                    ? "bg-forest-50 shadow-[inset_3px_0_0_var(--forest-800)]"
                    : "hover:bg-surface-2"
                )}
              >
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium", tintClass[c.lead.tint] ?? tintClass.lime)}>
                  {c.lead.initials ?? c.lead.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[14px] font-medium text-text-strong">{c.lead.company}</p>
                    <ClassBadge c={cls} />
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-text-muted">{preview}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread */}
      {!hasResults ? (
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-card border border-hair bg-surface text-center">
          <SearchX className="size-8 text-text-faint" strokeWidth={1.5} />
          <p className="text-[14px] text-text-muted">
            Aramanla eşleşen konuşma yok.
          </p>
        </div>
      ) : (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-hair bg-surface">
        <div className="flex items-center gap-3 border-b border-hair px-6 py-4">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-medium", tintClass[active.lead.tint] ?? tintClass.lime)}>
            {active.lead.initials ?? active.lead.company.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-text-strong">{active.lead.company}</p>
            <p className="text-[12px] text-text-muted">
              {active.lead.contact} · {active.lead.title}
            </p>
          </div>
          <div className="ml-auto">
            <ClassBadge c={classification} />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {active.messages.map((m) => (
            <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
              <div className="max-w-[78%]">
                <div className={cn(
                  "whitespace-pre-line rounded-[12px] px-4 py-3 text-[13px] leading-relaxed",
                  m.direction === "out" ? "bg-forest-50 text-forest-900" : "bg-surface-2 text-text"
                )}>
                  {m.body}
                </div>
                <p className={cn("mt-1 text-[11px] text-text-faint", m.direction === "out" ? "text-right" : "text-left")}>
                  {m.direction === "out" ? "Sen" : active.lead.contact} · {formatTime(m.sent_at)}
                </p>
              </div>
            </div>
          ))}

          {suggestedReply && (
            <div className="rounded-[12px] border border-lime-200 bg-lime-50 px-4 py-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-800 px-2.5 py-1 text-[11px] font-medium text-lime-400">
                <Sparkles className="size-3" />
                AI ÖNERİLEN YANIT
              </span>
              {editMode ? (
                <textarea
                  className="mt-3 w-full resize-none rounded-[8px] border border-lime-300 bg-white px-3 py-2 text-[13px] leading-relaxed text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
                  rows={6}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                />
              ) : (
                <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-forest-900">
                  {suggestedReply}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-hair px-6 py-4">
          <div className="flex gap-2">
            <button
              onClick={handleEditToggle}
              className="inline-flex items-center gap-2 rounded-[10px] border border-hair px-4 py-2.5 text-[14px] font-medium text-text transition-colors hover:bg-surface-2"
            >
              <Pencil className="size-4" />
              {editMode ? "İptal" : "Yanıtı düzenle"}
            </button>
            {sent ? (
              <button disabled className="inline-flex items-center gap-2 rounded-[10px] bg-positive px-4 py-2.5 text-[14px] font-medium text-white">
                <Check className="size-4" strokeWidth={2.2} />
                Gönderildi
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={isPending || !replyToSend}
                className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700 disabled:opacity-50"
              >
                <Send className="size-4" strokeWidth={2.2} />
                {isPending ? "Gönderiliyor..." : "Yanıtı gönder"}
              </button>
            )}
            <button
              onClick={() => window.open("https://cal.com/furkan-cesitler-dyxfcl/30min", "_blank")}
              className="ml-auto inline-flex items-center gap-2 rounded-[10px] bg-lime-500 px-4 py-2.5 text-[14px] font-medium text-forest-900 transition-colors hover:bg-lime-400"
            >
              <CalendarPlus className="size-4" strokeWidth={2.2} />
              Toplantı ayarla
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
