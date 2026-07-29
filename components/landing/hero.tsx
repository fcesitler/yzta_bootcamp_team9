"use client";

import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Mail,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Floating } from "./motion-primitives";

/* ---------------------------------------------------------------- *
 * Hero'daki kartlar dekoratif değil — ürünün gerçek yüzeyleri:
 * ICP tanımı, skorlanmış lead, yazılmış taslak, ayarlanan toplantı.
 * ---------------------------------------------------------------- */

function IcpNote() {
  return (
    <div className="w-[248px] -rotate-[4deg] rounded-[14px] bg-lime-100 p-5 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.18)] ring-1 ring-lime-200">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-forest-700">
        İdeal müşteri profili
      </p>
      <p className="mt-2.5 text-[13px] leading-relaxed text-forest-900">
        SaaS alanında, 50–250 çalışanlı, Türkiye &amp; AB merkezli şirketlerdeki{" "}
        <span className="font-semibold">Growth liderleri</span>.
      </p>
      <div className="mt-3 flex items-center gap-1.5 border-t border-lime-200 pt-2.5">
        <Sparkles className="size-3 text-forest-700" strokeWidth={2.4} />
        <span className="text-[11px] font-medium text-forest-800">
          2.880 şirket eşleşti
        </span>
      </div>
    </div>
  );
}

function LeadCard() {
  return (
    <div className="w-[276px] rounded-[14px] bg-surface p-4 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22)] ring-1 ring-hair">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-lime-100 text-[12px] font-semibold text-forest-800">
          NR
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-text-strong">
            Nexora Retail
          </p>
          <p className="truncate text-[12px] text-text-muted">
            Elif Kaya · Head of Growth
          </p>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-semibold leading-none text-positive">92</p>
          <p className="mt-0.5 text-[9px] uppercase tracking-wide text-text-faint">
            ICP
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-[10px] bg-lime-50 px-3 py-2">
        <p className="text-[11px] leading-relaxed text-forest-800">
          <span className="font-semibold">Neden şimdi?</span> Yatırım turu
          açıklandı, growth ekibini büyütüyorlar.
        </p>
      </div>
    </div>
  );
}

function DraftCard() {
  return (
    <div className="w-[290px] rounded-[14px] bg-surface p-4 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22)] ring-1 ring-hair">
      <div className="flex items-center gap-2">
        <Mail className="size-3.5 text-forest-700" strokeWidth={2.2} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-faint">
          Taslak e-posta
        </p>
      </div>
      <p className="mt-2.5 text-[13px] font-semibold text-text-strong">
        Growth ekibi büyürken ilk 90 gün
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-text-muted">
        Merhaba Elif, yatırım turunuzu okudum — ekip büyürken outbound&apos;u…
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-forest-800 px-2.5 py-1 text-[11px] font-medium text-paper">
          <Check className="size-3" strokeWidth={3} />
          Onayla &amp; gönder
        </span>
        <span className="text-[11px] text-text-faint">Düzenle</span>
      </div>
    </div>
  );
}

function MeetingCard() {
  return (
    <div className="w-[250px] rounded-[14px] bg-surface p-4 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.22)] ring-1 ring-hair">
      <div className="flex items-center gap-2">
        <CalendarCheck className="size-3.5 text-forest-700" strokeWidth={2.2} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-faint">
          Toplantı ayarlandı
        </p>
      </div>
      <p className="mt-2.5 text-[13px] font-semibold text-text-strong">
        Nexora Retail
      </p>
      <div className="mt-2.5 flex items-center justify-between rounded-[10px] bg-surface-2 px-3 py-2">
        <span className="text-[11px] text-text-muted">Bugün</span>
        <span className="text-[11px] font-semibold tabular-nums text-forest-800">
          13:00 – 13:30
        </span>
      </div>
      <p className="mt-2.5 text-[11px] leading-relaxed text-text-muted">
        Brief hazır — konuşma özeti ve 3 hazırlık notu.
      </p>
    </div>
  );
}

function PipelineChip() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.25)] ring-1 ring-hair">
      <TrendingUp className="size-3.5 text-positive" strokeWidth={2.4} />
      <span className="text-[12px] font-medium text-text-strong">
        Bu hafta <span className="tabular-nums">7</span> toplantı
      </span>
    </div>
  );
}

/* Sunucuda false, hydration sonrası true döner — paralaks katmanı yalnızca
   istemcide basılsın diye. setState-in-effect'e göre hydration'a daha güvenli. */
const subscribeNoop = () => () => {};

const cards = [
  {
    key: "icp",
    node: <IcpNote />,
    position: "absolute left-[3%] top-[16%] xl:left-[7%]",
    depth: "far" as const,
    delay: 0.3,
    amplitude: 9,
    duration: 7,
    floatDelay: 0,
  },
  {
    key: "lead",
    node: <LeadCard />,
    position: "absolute bottom-[13%] left-[4%] xl:left-[8%]",
    depth: "near" as const,
    delay: 0.46,
    amplitude: 12,
    duration: 8,
    floatDelay: 0.6,
  },
  {
    key: "meeting",
    node: <MeetingCard />,
    position: "absolute right-[3%] top-[14%] xl:right-[7%]",
    depth: "far" as const,
    delay: 0.38,
    amplitude: 10,
    duration: 7.5,
    floatDelay: 0.3,
  },
  {
    key: "draft",
    node: <DraftCard />,
    position: "absolute bottom-[11%] right-[3%] xl:right-[7%]",
    depth: "near" as const,
    delay: 0.54,
    amplitude: 11,
    duration: 8.5,
    floatDelay: 1,
  },
  {
    key: "chip",
    node: <PipelineChip />,
    // Başlık ortada geniş yer kapladığı için sol boşluğa alındı —
    // ICP notu ile lead kartı arasındaki koridora oturuyor.
    position: "absolute left-[11%] top-[47%] xl:left-[15%]",
    depth: "near" as const,
    delay: 0.7,
    amplitude: 7,
    duration: 6,
    floatDelay: 1.4,
  },
];

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  // İmleç paralaksı — kartlar farklı derinliklerde hafifçe kayar.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  const near = {
    x: useTransform(sx, [-0.5, 0.5], [16, -16]),
    y: useTransform(sy, [-0.5, 0.5], [12, -12]),
  };
  const far = {
    x: useTransform(sx, [-0.5, 0.5], [-24, 24]),
    y: useTransform(sy, [-0.5, 0.5], [-16, 16]),
  };

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <section
      ref={ref}
      onMouseMove={handleMouse}
      className="relative isolate overflow-hidden px-5 pb-24 pt-16 sm:pt-20"
    >
      {/* Noktalı kâğıt dokusu + merkeze doğru açılan yumuşak ışık */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #C7CDBE 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse 70% 55% at 50% 42%, #000 35%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 55% at 50% 42%, #000 35%, transparent 78%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        {/* Marka işareti */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto flex size-14 items-center justify-center rounded-[16px] bg-forest-800 shadow-[0_14px_34px_-10px_rgba(28,75,60,0.55)]"
        >
          <Sparkles className="size-7 text-lime-500" strokeWidth={2.2} />
        </motion.div>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-[12px] font-medium text-forest-800 ring-1 ring-hair"
        >
          <span className="inline-block size-1.5 rounded-full bg-lime-500" />
          Yapay zekâ satış geliştirme asistanı
        </motion.p>

        {/* Başlık — iki tonlu */}
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-4xl text-balance text-[44px] font-medium leading-[1.02] tracking-[-0.03em] text-text-strong sm:text-[64px] lg:text-[76px]"
        >
          Bul, araştır, yaz
          <span className="block text-text-faint">sen toplantıya gir</span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mx-auto mt-6 max-w-xl text-balance text-[16px] leading-relaxed text-text-muted sm:text-[17px]"
        >
          Hallederiz ideal müşterini bulur, arkasındaki sinyalleri araştırır,
          kişiselleştirilmiş e-postayı yazar ve toplantını takvimine koyar.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/signup"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-forest-800 px-7 text-[15px] font-medium text-paper shadow-[0_12px_30px_-10px_rgba(28,75,60,0.6)] transition-all hover:bg-forest-700 hover:shadow-[0_16px_36px_-10px_rgba(28,75,60,0.7)] sm:w-auto"
          >
            Ücretsiz dene
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.4}
            />
          </Link>
          <Link
            href="#nasil-calisir"
            className="inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-surface px-7 text-[15px] font-medium text-text-strong ring-1 ring-hair transition-colors hover:bg-surface-2 sm:w-auto"
          >
            Nasıl çalışır?
          </Link>
        </motion.div>

        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          className="mt-4 text-[12px] text-text-faint"
        >
          Kredi kartı gerekmez · Gmail ve Cal.com ile çalışır
        </motion.p>
      </div>

      {/* Uçuşan ürün kartları — geniş ekran.
          Yalnızca mount sonrası basılır: paralaks motion value'ları sunucuda
          bilinmediği için SSR/hydration transform uyuşmazlığı yaratıyordu. */}
      {mounted && (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          {cards.map((c) => (
            <motion.div
              key={c.key}
              style={c.depth === "near" ? near : far}
              className={c.position}
            >
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.65,
                  delay: c.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Floating
                  amplitude={c.amplitude}
                  duration={c.duration}
                  delay={c.floatDelay}
                >
                  {c.node}
                </Floating>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Mobil / tablet — kartları tek sütunda göster */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mx-auto mt-14 flex max-w-md flex-col items-center gap-4 lg:hidden"
      >
        <LeadCard />
        <DraftCard />
      </motion.div>
    </section>
  );
}
