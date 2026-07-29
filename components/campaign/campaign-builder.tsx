"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  Check,
  MapPin,
  Play,
  Plus,
  Radar,
  Search,
  Sparkles,
  Target,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

const ThinkingOrb = dynamic(
  () => import("thinking-orbs").then((m) => ({ default: m.ThinkingOrb })),
  { ssr: false }
);
import { cn } from "@/lib/utils";
import {
  campaignOptions,
  signalOptions,
  defaultSignals,
} from "@/lib/mock";
import { saveCampaign } from "@/app/(app)/campaign/actions";

/* ---------------------- ICP kart-grid seçici bloğu ------------------------ */

function IcpCard({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder: string;
}) {
  // value bir preset değilse kullanıcının yazdığı serbest bir keyword'dür.
  const isCustom = value.length > 0 && !options.includes(value);
  const [draft, setDraft] = useState(() => (isCustom ? value : ""));

  function selectPreset(o: string) {
    onChange(o);
    setDraft("");
  }
  function commit() {
    const v = draft.trim();
    if (v) onChange(v);
    else if (isCustom) onChange(options[0]); // temizlenince ilk presete dön
  }
  function clearCustom() {
    setDraft("");
    onChange(options[0]);
  }

  return (
    <div className="rounded-[16px] bg-surface p-5 ring-1 ring-hair transition-shadow duration-300 hover:shadow-[0_16px_36px_-20px_rgba(15,23,42,0.22)]">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-forest-50">
          <Icon className="size-4 text-forest-800" strokeWidth={1.9} />
        </span>
        <p className="text-[13px] font-semibold text-text-strong">{label}</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              type="button"
              onClick={() => selectPreset(o)}
              aria-pressed={active}
              className={cn(
                "group/opt flex items-center gap-2 rounded-[11px] px-3 py-2.5 text-left text-[13.5px] transition-all",
                active
                  ? "bg-forest-800 text-paper shadow-[0_8px_20px_-10px_rgba(28,75,60,0.6)]"
                  : "bg-paper text-text-muted hover:bg-forest-50 hover:text-text-strong"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  active
                    ? "border-lime-500 bg-lime-500"
                    : "border-hair-2 group-hover/opt:border-forest-400"
                )}
              >
                {active && (
                  <Check className="size-2.5 text-forest-900" strokeWidth={3.4} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{o}</span>
            </button>
          );
        })}
      </div>

      {/* Diğer — kullanıcının kendi keyword'ü (örn. "mobilyacılar") */}
      <div
        className={cn(
          "mt-2 flex items-center gap-2 rounded-[11px] px-3 py-2 transition-all",
          isCustom
            ? "bg-forest-50 ring-1 ring-forest-300"
            : "bg-paper ring-1 ring-hair focus-within:ring-forest-400"
        )}
      >
        <Plus
          className={cn(
            "size-3.5 shrink-0",
            isCustom ? "text-forest-700" : "text-text-faint"
          )}
          strokeWidth={2.4}
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
              e.currentTarget.blur();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          aria-label={`${label} için kendi değerini yaz`}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-text-strong outline-none placeholder:text-text-faint"
        />
        {isCustom && (
          <button
            type="button"
            onClick={clearCustom}
            aria-label="Özel değeri temizle"
            className="flex size-5 shrink-0 items-center justify-center rounded-full text-forest-700 transition-colors hover:bg-forest-100"
          >
            <X className="size-3" strokeWidth={2.6} />
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------- Sinyal + "Diğer" alanı ------------------------ */

function KeywordInput({
  keywords,
  onAdd,
  onRemove,
}: {
  keywords: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    // Virgülle ayrılmış çoklu giriş — tek input, tek Enter.
    const parts = draft
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    parts.forEach(onAdd);
    setDraft("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && keywords.length) {
      onRemove(keywords[keywords.length - 1]);
    }
  }

  return (
    <div className="mt-3 rounded-[12px] bg-paper p-2 ring-1 ring-hair focus-within:ring-forest-400">
      <div className="flex flex-wrap items-center gap-1.5">
        {keywords.map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 rounded-full bg-lime-100 px-2.5 py-1 text-[12px] font-medium text-forest-800"
          >
            {k}
            <button
              type="button"
              onClick={() => onRemove(k)}
              aria-label={`${k} kaldır`}
              className="flex size-4 items-center justify-center rounded-full text-forest-800/70 transition-colors hover:bg-forest-200 hover:text-forest-900"
            >
              <X className="size-3" strokeWidth={2.6} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => draft && commit()}
          placeholder={
            keywords.length ? "Bir sinyal daha ekle…" : "Örn: SOC 2 sertifikası, ISO 27001, açık pozisyon…"
          }
          className="min-w-[180px] flex-1 bg-transparent px-2 py-1 text-[13.5px] text-text-strong outline-none placeholder:text-text-faint"
        />
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-text-faint">
        Enter veya virgülle ekle · Backspace ile son eklediğini kaldır
      </p>
    </div>
  );
}

/* ------------------------------ Ana bileşen ------------------------------- */

const PRESET_SIGNALS = new Set<string>(signalOptions);

export function CampaignBuilder() {
  const [industry, setIndustry] = useState(campaignOptions.industry[0]);
  const [size, setSize] = useState(campaignOptions.size[0]);
  const [geo, setGeo] = useState(campaignOptions.geo[0]);
  const [role, setRole] = useState(campaignOptions.role[0]);
  const [signals, setSignals] = useState<string[]>(defaultSignals);
  const [maxLeads, setMaxLeads] = useState(10);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Kullanıcının eklediği serbest metin sinyaller — DB'ye aynı array içinde
  // gider ama UI'da preset olmayanları ayrı kısımda gösteririz.
  const customSignals = useMemo(
    () => signals.filter((s) => !PRESET_SIGNALS.has(s)),
    [signals]
  );

  const toggleSignal = (s: string) =>
    setSignals((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  function addCustomSignal(v: string) {
    const trimmed = v.trim();
    if (!trimmed) return;
    setSignals((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }

  function removeSignal(v: string) {
    setSignals((prev) => prev.filter((x) => x !== v));
  }

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await saveCampaign({
        name: `${industry} · ${geo}`,
        icp: { sector: industry, size, geography: geo, role },
        signals,
        maxLeads,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="relative mx-auto max-w-5xl pb-24">
      {/* Kampanya başlatma perdesi */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/40 backdrop-blur-[3px]">
          <div className="flex items-center gap-4 rounded-full bg-forest-800 px-6 py-4 shadow-2xl ring-1 ring-lime-500/30">
            <ThinkingOrb state="searching" size={64} theme="dark" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[16px] font-bold text-white">
                Kampanya başlatılıyor
              </span>
              <span className="text-[12px] font-medium text-lime-400">
                Lead taraması hazırlanıyor…
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Başlık */}
      <header className="flex items-start justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-700 ring-1 ring-forest-100">
            <span className="size-1.5 rounded-full bg-lime-500" />
            Yeni kampanya
          </span>
          <h1 className="mt-3 text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-text-strong">
            İdeal müşteri profilini tanımla
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-text-muted">
            Ajanlar bu profile uyan şirketleri bulur, sinyalleri araştırır ve
            onaya sunar.
          </p>
        </div>

        {/* Canlı özet paneli */}
        <div className="hidden shrink-0 rounded-[16px] bg-forest-800 p-4 text-paper shadow-[0_18px_40px_-16px_rgba(28,75,60,0.55)] lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-lime-400">
            Kampanya özeti
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-forest-100">
            <span className="font-semibold text-paper">{industry}</span>{" "}
            alanında, {size} çalışanlı,{" "}
            <span className="font-semibold text-paper">{geo}</span> merkezli
            şirketlerdeki{" "}
            <span className="font-semibold text-paper">{role}</span>.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-forest-400/25 pt-3">
            <div>
              <p className="text-[18px] font-semibold tabular-nums">280M+</p>
              <p className="text-[11px] text-forest-100/70">şirket veritabanı</p>
            </div>
            <div>
              <p className="text-[18px] font-semibold tabular-nums">
                {maxLeads}
              </p>
              <p className="text-[11px] text-forest-100/70">
                bu kampanyada lead
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* İdeal müşteri profili — 2×2 kart-grid */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <IcpCard
          icon={Building2}
          label="Sektör"
          value={industry}
          options={campaignOptions.industry}
          onChange={setIndustry}
          placeholder="Diğer sektör — örn. mobilyacılar"
        />
        <IcpCard
          icon={UserRound}
          label="Çalışan sayısı"
          value={size}
          options={campaignOptions.size}
          onChange={setSize}
          placeholder="Diğer aralık — örn. 1000+"
        />
        <IcpCard
          icon={MapPin}
          label="Bölge"
          value={geo}
          options={campaignOptions.geo}
          onChange={setGeo}
          placeholder="Diğer bölge — örn. Orta Doğu"
        />
        <IcpCard
          icon={Target}
          label="Karar verici rolü"
          value={role}
          options={campaignOptions.role}
          onChange={setRole}
          placeholder="Diğer rol — örn. Satın alma müdürü"
        />
      </section>

      {/* Sinyaller + serbest metin */}
      <section className="mt-4 rounded-[16px] bg-surface p-6 ring-1 ring-hair">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-forest-50">
            <Radar className="size-4 text-forest-800" strokeWidth={1.9} />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-text-strong">
              Araştırma sinyalleri
            </p>
            <p className="mt-0.5 text-[12.5px] text-text-muted">
              Araştırma ajanı bu sinyalleri önceliklendirir, kişiselleştirme
              taslağı bunlara dayanır.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {signalOptions.map((s) => {
            const active = signals.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSignal(s)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-all",
                  active
                    ? "border-forest-800 bg-forest-800 font-medium text-paper"
                    : "border-hair text-text-muted hover:border-forest-300 hover:text-text-strong"
                )}
              >
                {active && <Check className="size-3" strokeWidth={3} />}
                {s}
              </button>
            );
          })}
        </div>

        <div className="mt-5 border-t border-hair pt-5">
          <div className="flex items-center gap-2">
            <Plus className="size-3.5 text-forest-700" strokeWidth={2.4} />
            <p className="text-[12px] font-semibold uppercase tracking-wide text-text-strong">
              Diğer — kendi anahtar kelimelerin
            </p>
          </div>
          <p className="mt-1 text-[12.5px] text-text-muted">
            Yukarıda olmayan sinyalleri kendin yazabilirsin — sertifikasyon,
            teknoloji yığını, sözleşme yenilenmesi vb.
          </p>
          <KeywordInput
            keywords={customSignals}
            onAdd={addCustomSignal}
            onRemove={removeSignal}
          />
        </div>
      </section>

      {/* Lead sayısı + eşleşme özeti — genişletilmiş */}
      <section className="mt-4 flex flex-wrap items-center gap-4 rounded-[16px] bg-lime-50 p-5 ring-1 ring-lime-200">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-lime-500/25">
            <Sparkles className="size-4 text-forest-800" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold text-forest-900">
              Lead veritabanında{" "}
              <span className="tabular-nums">280M+</span> şirket
            </p>
            <p className="text-[12px] text-forest-800/80">
              Bul ajanı profiline uyanları bulur, seçtiğin lead sayısını çeker.
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3 rounded-[11px] bg-white px-3.5 py-2 ring-1 ring-forest-200">
          <label
            htmlFor="maxLeads"
            className="text-[12px] font-medium text-forest-700 whitespace-nowrap"
          >
            Lead sayısı
          </label>
          <button
            type="button"
            onClick={() => setMaxLeads((v) => Math.max(1, v - 5))}
            aria-label="Azalt"
            className="flex size-7 items-center justify-center rounded-[7px] text-forest-800 transition-colors hover:bg-forest-50"
          >
            −
          </button>
          <input
            id="maxLeads"
            type="number"
            min={1}
            max={100}
            value={maxLeads}
            onChange={(e) =>
              setMaxLeads(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
            }
            className="w-14 rounded-md bg-transparent text-center text-[15px] font-semibold tabular-nums text-forest-800 outline-none"
          />
          <button
            type="button"
            onClick={() => setMaxLeads((v) => Math.min(100, v + 5))}
            aria-label="Arttır"
            className="flex size-7 items-center justify-center rounded-[7px] text-forest-800 transition-colors hover:bg-forest-50"
          >
            +
          </button>
        </div>
      </section>

      {/* Kaydet & başlat */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-forest-800 px-6 text-[15px] font-medium text-paper shadow-[0_12px_28px_-12px_rgba(28,75,60,0.6)] transition-all hover:bg-forest-700 hover:shadow-[0_16px_34px_-12px_rgba(28,75,60,0.7)] disabled:opacity-60"
        >
          <Play className="size-4" strokeWidth={2.4} />
          Kaydet ve kampanyayı başlat
        </button>
        <p className="flex items-center gap-1.5 text-[12.5px] text-text-muted">
          <Search className="size-3.5 text-forest-700" strokeWidth={2.2} />
          Ajan saniyeler içinde ilk lead&apos;leri bulur, hepsi onaya düşer.
        </p>
        {error && (
          <p className="text-[13px] font-medium text-danger">{error}</p>
        )}
      </div>

    </div>
  );
}
