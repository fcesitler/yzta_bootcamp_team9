"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarCheck,
  Check,
  PenLine,
  Radar,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* Login'in sağ paneli: ajan hattı sırayla ilerler.
   Kartlar birikmez — sabit yükseklikli tek yüzeyde yerinde değişir,
   böylece metinler kaymaz. Tamamen dekoratif (aria-hidden). */

type Step = {
  icon: LucideIcon;
  agent: string;
  text: string;
  meta: string;
};

const steps: Step[] = [
  { icon: Search, agent: "Bul", text: "12 yeni lead bulundu", meta: "ICP eşleşmesi" },
  { icon: Radar, agent: "Araştır", text: "Nexora Retail · ICP 92", meta: "Yatırım turu sinyali" },
  { icon: PenLine, agent: "Yaz", text: "Taslak e-posta hazırlandı", meta: "Sinyale göre kişiselleştirildi" },
  { icon: Check, agent: "Onay", text: "Elif Kaya'ya gönderildi", meta: "Gmail" },
  { icon: CalendarCheck, agent: "Toplantı", text: "Yarın 13:00 — takvimde", meta: "Cal.com" },
];

const STEP_MS = 2600;

export function AgentStage() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % steps.length), STEP_MS);
    return () => clearInterval(id);
  }, [reduce]);

  const active = steps[i];

  return (
    <div
      aria-hidden
      className="relative isolate hidden h-full overflow-hidden bg-forest-900 lg:flex lg:flex-col lg:justify-center"
    >
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 30% 15%, #B6E82F, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #F3F4EC 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="px-12 xl:px-16">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            {!reduce && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-500 opacity-60" />
            )}
            <span className="relative inline-flex size-2 rounded-full bg-lime-500" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lime-400">
            Ajanlar çalışıyor
          </p>
        </div>

        <h2 className="mt-5 max-w-sm text-balance text-[34px] font-medium leading-[1.12] tracking-[-0.02em] text-paper xl:text-[40px]">
          Sen yalnızca toplantılara odaklan, gerisini ajanlar halleder
        </h2>

        {/* Adım rayı — sabit, yalnızca aktif olan vurgulanır */}
        <ol className="mt-10 flex max-w-md items-center gap-2">
          {steps.map((s, idx) => (
            <li key={s.agent} className="flex flex-1 flex-col gap-2">
              <span className="relative block h-0.5 overflow-hidden rounded-full bg-forest-400/25">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-lime-500"
                  initial={false}
                  animate={{ width: idx <= i ? "100%" : "0%" }}
                  transition={{ duration: idx === i ? 0.5 : 0.2, ease: "easeOut" }}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors duration-300",
                  idx === i ? "text-lime-400" : "text-forest-100/40"
                )}
              >
                {s.agent}
              </span>
            </li>
          ))}
        </ol>

        {/* Tek yüzey, sabit yükseklik — içerik yerinde değişir, kaymaz */}
        <div className="mt-5 h-[92px] max-w-md">
          <div className="relative h-full overflow-hidden rounded-[14px] bg-forest-800/70 ring-1 ring-forest-400/25 backdrop-blur-sm">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.agent}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center gap-3.5 px-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-lime-500/15">
                  <active.icon className="size-[18px] text-lime-400" strokeWidth={2.1} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-paper">
                    {active.text}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-forest-100/70">
                    {active.agent} ajanı · {active.meta}
                  </p>
                </div>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-lime-500/20">
                  <Check className="size-3.5 text-lime-400" strokeWidth={2.8} />
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-8 border-t border-forest-400/20 pt-6">
          <div>
            <p className="text-[22px] font-semibold tabular-nums text-paper">2.880</p>
            <p className="mt-0.5 text-[11px] text-forest-100/70">eşleşen şirket</p>
          </div>
          <div>
            <p className="text-[22px] font-semibold tabular-nums text-paper">7</p>
            <p className="mt-0.5 text-[11px] text-forest-100/70">bu hafta toplantı</p>
          </div>
          <div>
            <p className="text-[22px] font-semibold tabular-nums text-paper">%38</p>
            <p className="mt-0.5 text-[11px] text-forest-100/70">yanıt oranı</p>
          </div>
        </div>
      </div>
    </div>
  );
}
