"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Check, Sparkles, Play } from "lucide-react";

const ThinkingOrb = dynamic(
  () => import("thinking-orbs").then((m) => ({ default: m.ThinkingOrb })),
  { ssr: false }
);
import { cn } from "@/lib/utils";
import {
  campaignOptions,
  signalOptions,
  defaultSignals,
  matchingUniverse,
} from "@/lib/mock";
import { saveCampaign } from "@/app/(app)/campaign/actions";

function OptionGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[12px] font-medium text-text-strong">{label}</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={cn(
                "flex items-center gap-2 rounded-[12px] border px-4 py-3 text-left text-[14px] font-medium transition-all",
                active
                  ? "border-forest-600 bg-forest-50 text-forest-800 ring-2 ring-forest-100"
                  : "border-hair bg-surface text-text-muted hover:border-forest-300 hover:text-text-strong"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  active ? "border-forest-600 bg-forest-600" : "border-hair-2"
                )}
              >
                {active && <Check className="size-3 text-white" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">{o}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CampaignBuilder() {
  const [industry, setIndustry] = useState(campaignOptions.industry[0]);
  const [size, setSize] = useState(campaignOptions.size[0]);
  const [geo, setGeo] = useState(campaignOptions.geo[0]);
  const [role, setRole] = useState(campaignOptions.role[0]);
  const [signals, setSignals] = useState<string[]>(defaultSignals);
  const [maxLeads, setMaxLeads] = useState(10);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleSignal = (s: string) =>
    setSignals((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

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
    <div className="relative mx-auto max-w-3xl">
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="flex items-center gap-4 rounded-full bg-forest-800 px-6 py-4 shadow-2xl ring-1 ring-lime-500/30">
            <ThinkingOrb state="searching" size={64} theme="dark" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[16px] font-bold text-white">Kampanya başlatılıyor</span>
              <span className="text-[12px] font-medium text-lime-400">Lead taraması hazırlanıyor…</span>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-[28px] font-medium leading-tight tracking-tight text-text-strong">
        Kampanya
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-text-muted">
        İdeal müşteri profilini tanımla, kampanyayı başlat.
      </p>

      {/* İdeal müşteri profili */}
      <section className="mt-8 rounded-card border border-hair bg-surface px-6 py-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
          İdeal müşteri profili
        </p>

        <div className="mt-5 flex flex-col gap-6">
          <OptionGroup
            label="Sektör"
            value={industry}
            options={campaignOptions.industry}
            onChange={setIndustry}
          />
          <OptionGroup
            label="Çalışan sayısı"
            value={size}
            options={campaignOptions.size}
            onChange={setSize}
          />
          <OptionGroup
            label="Bölge"
            value={geo}
            options={campaignOptions.geo}
            onChange={setGeo}
          />
          <OptionGroup
            label="Rol"
            value={role}
            options={campaignOptions.role}
            onChange={setRole}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-lime-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-forest-700" />
            <p className="text-[13px] leading-relaxed text-forest-800">
              Eşleşen evren:{" "}
              <span className="font-medium">
                {matchingUniverse.toLocaleString("tr-TR")}
              </span>{" "}
              şirket · Bul ajanı bu kampanyada{" "}
              <span className="font-medium">{maxLeads}</span> lead çeker.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <label className="text-[12px] font-medium text-forest-700 whitespace-nowrap">
              Lead sayısı
            </label>
            <input
              type="number"
              min={1}
              step={5}
              value={maxLeads}
              onChange={(e) => setMaxLeads(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="w-20 rounded-md border border-forest-200 bg-white px-2 py-1 text-[13px] font-medium text-forest-800 focus:border-forest-400 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Sinyaller */}
      <section className="mt-4 rounded-card border border-hair bg-surface px-6 py-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
          Araştırma ajanının önceliklendireceği sinyaller
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {signalOptions.map((s) => {
            const active = signals.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSignal(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] transition-colors",
                  active
                    ? "border-forest-800 bg-forest-50 font-medium text-forest-800"
                    : "border-hair text-text-muted hover:border-hair-2 hover:text-text"
                )}
              >
                {active && <Check className="size-3.5" strokeWidth={2.6} />}
                {s}
              </button>
            );
          })}
        </div>
      </section>

      {/* Kaydet & başlat */}
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700 disabled:opacity-60"
        >
          <Play className="size-4" strokeWidth={2.4} />
          Kaydet & kampanyayı başlat
        </button>
        {error && (
          <p className="text-[13px] font-medium text-danger">{error}</p>
        )}
      </div>
    </div>
  );
}
