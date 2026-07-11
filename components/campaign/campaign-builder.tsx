"use client";

import { useState } from "react";
import { ChevronDown, Check, Sparkles, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  campaignOptions,
  signalOptions,
  defaultSignals,
  matchingUniverse,
  dailyPull,
} from "@/lib/mock";

function InlineSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <span className="relative inline-flex items-center align-baseline">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-md border border-forest-100 bg-forest-50 py-1 pl-3 pr-8 text-[17px] font-medium text-forest-800 focus:border-forest-400 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 size-4 text-forest-600" />
    </span>
  );
}

export function CampaignBuilder() {
  const [industry, setIndustry] = useState(campaignOptions.industry[0]);
  const [size, setSize] = useState(campaignOptions.size[0]);
  const [geo, setGeo] = useState(campaignOptions.geo[0]);
  const [role, setRole] = useState(campaignOptions.role[0]);
  const [signals, setSignals] = useState<string[]>(defaultSignals);
  const [saved, setSaved] = useState(false);

  const toggleSignal = (s: string) => {
    setSaved(false);
    setSignals((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[28px] font-medium leading-tight tracking-tight text-text-strong">
        Kampanya
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-text-muted">
        İdeal müşterini tarif et — Bul ajanı her sabah Apollo&apos;dan eşleşen
        şirketleri getirir.
      </p>

      {/* İdeal müşteri profili */}
      <section className="mt-8 rounded-card border border-hair bg-surface px-6 py-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
          İdeal müşteri profili
        </p>
        <p className="mt-4 text-[17px] leading-[2.6] text-text">
          <InlineSelect
            label="Sektör"
            value={industry}
            options={campaignOptions.industry}
            onChange={(v) => {
              setSaved(false);
              setIndustry(v);
            }}
          />{" "}
          alanında,{" "}
          <InlineSelect
            label="Çalışan sayısı"
            value={size}
            options={campaignOptions.size}
            onChange={(v) => {
              setSaved(false);
              setSize(v);
            }}
          />{" "}
          çalışanlı,{" "}
          <InlineSelect
            label="Bölge"
            value={geo}
            options={campaignOptions.geo}
            onChange={(v) => {
              setSaved(false);
              setGeo(v);
            }}
          />{" "}
          merkezli şirketlerdeki{" "}
          <InlineSelect
            label="Rol"
            value={role}
            options={campaignOptions.role}
            onChange={(v) => {
              setSaved(false);
              setRole(v);
            }}
          />{" "}
          bul.
        </p>

        <div className="mt-5 flex items-start gap-2 rounded-[10px] bg-lime-50 px-4 py-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-forest-700" />
          <p className="text-[13px] leading-relaxed text-forest-800">
            Eşleşen evren:{" "}
            <span className="font-medium">
              {matchingUniverse.toLocaleString("tr-TR")}
            </span>{" "}
            şirket Apollo&apos;da · Bul ajanı günde en iyi{" "}
            <span className="font-medium">{dailyPull}</span> tanesini çeker.
          </p>
        </div>
      </section>

      {/* Sinyaller */}
      <section className="mt-4 rounded-card border border-hair bg-surface px-6 py-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
          Araştırma ajanının önceliklendireceği sinyaller
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {signalOptions.map((s) => {
            const active = signals.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSignal(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
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
          onClick={() => setSaved(true)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-5 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700"
        >
          <Play className="size-4" strokeWidth={2.4} />
          Kaydet &amp; kampanyayı başlat
        </button>
        {saved && (
          <p className="text-[13px] font-medium text-positive">
            Kampanya kaydedildi — Bul ajanı {signals.length} sinyalle çalışmaya
            başladı.
          </p>
        )}
      </div>
    </div>
  );
}
