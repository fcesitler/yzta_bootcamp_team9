"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Check, Loader2, ChevronDown, Upload, Eye, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveContractTemplate } from "@/app/(app)/close/actions";
import { CONTRACT_TEMPLATE_TOKENS } from "@/lib/contracts/default-template";
import { renderContractHtml } from "@/lib/contracts/render";

// Canlı önizlemede token'ların nasıl dolacağını gösteren örnek veri.
const PREVIEW_DATA = {
  company: "Delta Teknoloji",
  contact: "Ayşe Yılmaz",
  email: "ayse@deltateknoloji.com",
  scope: "AI SDR kurulumu — otomatik lead bulma, e-posta ve toplantı yönetimi",
  amount: "15.000",
  currency: "₺",
  billing: "aylık",
  term: "12 ay",
  start_date: "1 Ağustos 2026",
} as const;

// Sözleşme şablonu düzenleme kartı — "sıfırıncı adım": kullanıcı kendi HTML
// şablonunu buraya yükler (dosya ile veya elle), anlaşma kapandığında bu şablon
// token'ları doldurulur. Canlı önizleme örnek verilerle sonucu gösterir.
export function ContractTemplateCard({
  initialHtml,
  isCustom,
  defaultOpen = false,
}: {
  initialHtml: string;
  isCustom: boolean;
  defaultOpen?: boolean;
}) {
  const [html, setHtml] = useState(initialHtml);
  const [open, setOpen] = useState(defaultOpen);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [dragOver, setDragOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = html !== initialHtml;
  const previewSrc = renderContractHtml(html, PREVIEW_DATA);

  function loadFile(file: File | undefined) {
    setError("");
    if (!file) return;
    const isHtml = /\.html?$/i.test(file.name) || file.type === "text/html";
    if (!isHtml) {
      setError("Yalnızca .html dosyası yükleyebilirsin.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setHtml(String(reader.result ?? ""));
      setSaved(false);
      setView("preview");
    };
    reader.onerror = () => setError("Dosya okunamadı.");
    reader.readAsText(file);
  }

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveContractTemplate(html);
      if (result?.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <section className="rounded-card border border-hair bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-6 py-4 text-left"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-lime-100 text-forest-800">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-text-strong">Sözleşme şablonu</p>
          <p className="text-[13px] text-text-muted">
            {isCustom
              ? "Kendi şablonun yüklü — anlaşma kapandığında bu kullanılır."
              : "Varsayılan şablon kullanılıyor. Kendi sözleşme şablonunu yükleyebilirsin."}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-text-faint transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="border-t border-hair px-6 py-5">
          {/* Dosya yükleme alanı (B) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              loadFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed px-4 py-6 text-center transition-colors",
              dragOver ? "border-forest-400 bg-lime-50" : "border-hair bg-surface-2/40"
            )}
          >
            <Upload className="size-5 text-text-faint" strokeWidth={1.6} />
            <p className="text-[13px] text-text">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-medium text-forest-800 underline underline-offset-2 hover:text-forest-700"
              >
                Bir .html dosyası seç
              </button>{" "}
              veya buraya sürükle
            </p>
            <p className="text-[12px] text-text-faint">
              Şirketinin sözleşme şablonunu yükle — token&apos;ları eklemeyi unutma
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm,text/html"
              className="hidden"
              onChange={(e) => loadFile(e.target.files?.[0])}
            />
          </div>

          {/* Token listesi */}
          <p className="mt-5 text-[12px] text-text-muted">
            Aşağıdaki token&apos;ları HTML içinde kullan — anlaşma kapandığında
            gerçek değerlerle doldurulur:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CONTRACT_TEMPLATE_TOKENS.map((t) => (
              <code
                key={t}
                className="rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-forest-800"
              >{`{{${t}}}`}</code>
            ))}
          </div>

          {/* Düzenle / Önizleme sekmeleri */}
          <div className="mt-4 flex items-center gap-1 rounded-[10px] bg-surface-2 p-1 w-fit">
            <button
              type="button"
              onClick={() => setView("edit")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === "edit" ? "bg-surface text-text-strong shadow-sm" : "text-text-muted"
              )}
            >
              <Code className="size-3.5" /> HTML
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                view === "preview" ? "bg-surface text-text-strong shadow-sm" : "text-text-muted"
              )}
            >
              <Eye className="size-3.5" /> Önizleme
            </button>
          </div>

          {/* Canlı önizleme (A) — örnek verilerle render */}
          {view === "preview" ? (
            <div className="mt-3 overflow-hidden rounded-[10px] border border-hair bg-white">
              <div className="flex items-center gap-2 border-b border-hair bg-surface-2/60 px-3 py-1.5">
                <span className="text-[11px] text-text-faint">
                  Örnek verilerle önizleme — {PREVIEW_DATA.company}
                </span>
              </div>
              <iframe
                title="Sözleşme önizleme"
                sandbox=""
                srcDoc={previewSrc}
                className="h-[440px] w-full bg-white"
              />
            </div>
          ) : (
            <textarea
              value={html}
              onChange={(e) => {
                setHtml(e.target.value);
                setSaved(false);
              }}
              rows={14}
              spellCheck={false}
              className="mt-3 w-full rounded-[10px] border border-hair bg-surface-2/50 px-4 py-3 font-mono text-[12px] leading-relaxed text-text outline-none focus:border-forest-400"
            />
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !dirty}
              className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={2.4} />
              ) : (
                <Check className="size-4" strokeWidth={2.4} />
              )}
              {isPending ? "Kaydediliyor…" : "Şablonu kaydet"}
            </button>
            {saved && !dirty && (
              <span className="text-[13px] font-medium text-positive">Kaydedildi ✓</span>
            )}
            {error && <span className="text-[13px] font-medium text-danger">{error}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
