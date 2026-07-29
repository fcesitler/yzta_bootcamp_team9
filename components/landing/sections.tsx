"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  Database,
  FileSignature,
  Filter,
  MessagesSquare,
  PenLine,
  Radar,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Reveal, staggerChild, staggerParent } from "./motion-primitives";
import { GmailIcon, MonogramIcon, SupabaseIcon } from "./brand-icons";

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-700 ring-1 ring-forest-100">
        <span className="size-1.5 rounded-full bg-lime-500" />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-balance text-[32px] font-medium leading-[1.12] tracking-[-0.025em] text-text-strong sm:text-[42px]">
        {title}
      </h2>
      {lead && (
        <p className="mt-4 text-balance text-[16px] leading-relaxed text-text-muted">
          {lead}
        </p>
      )}
    </Reveal>
  );
}

/* ------------------------------- Nasıl çalışır ------------------------------ */

const steps = [
  {
    icon: Search,
    title: "Bul",
    body: "Tarif ettiğin profile uyan şirketleri ve karar vericileri getirir.",
    output: "12 lead",
  },
  {
    icon: Radar,
    title: "Araştır",
    body: "Yatırım, işe alım, lansman sinyallerini tarar ve ICP skoru verir.",
    output: "ICP 92",
  },
  {
    icon: PenLine,
    title: "Yaz",
    body: "O sinyale dayanan, kişiselleştirilmiş bir e-posta taslağı hazırlar.",
    output: "Taslak hazır",
  },
  {
    icon: MessagesSquare,
    title: "Takip et",
    body: "Yanıtları sınıflandırır, gerekirse takip mesajını zamanında yollar.",
    output: "3 yanıt",
  },
  {
    icon: FileSignature,
    title: "Kapat",
    body: "Toplantı brief'i çıkarır, sözleşme PDF'ini ve Gmail taslağını hazırlar.",
    output: "Sözleşme",
  },
];

export function Pipeline() {
  return (
    <section
      id="nasil-calisir"
      className="relative scroll-mt-20 overflow-hidden px-5 py-28"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-hair-2 to-transparent"
      />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Nasıl çalışır"
          title="Beş adımlık satış hattı, tek akışta"
          lead="Her adımı bir ajan üstlenir. Sen yalnızca onay verirsin — kontrol hep sende kalır."
        />

        <motion.ol
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="relative mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {/* Adımları bağlayan akış hattı */}
          <div
            aria-hidden
            className="absolute inset-x-[10%] top-[58px] -z-10 hidden h-px bg-gradient-to-r from-forest-100 via-lime-400 to-forest-100 lg:block"
          />

          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              variants={staggerChild}
              className="group relative overflow-hidden rounded-[18px] bg-surface p-5 ring-1 ring-hair transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_-18px_rgba(15,23,42,0.28)] hover:ring-forest-200"
            >
              {/* Arka plandaki hayalet numara */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-5 select-none text-[76px] font-bold leading-none text-forest-50 transition-colors duration-300 group-hover:text-lime-100"
              >
                {i + 1}
              </span>

              <div className="relative flex size-11 items-center justify-center rounded-[13px] bg-forest-800 shadow-[0_8px_20px_-8px_rgba(28,75,60,0.7)]">
                <s.icon className="size-5 text-lime-500" strokeWidth={1.9} />
              </div>

              <h3 className="relative mt-4 text-[17px] font-semibold text-text-strong">
                {s.title}
              </h3>
              <p className="relative mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
                {s.body}
              </p>

              <div className="relative mt-4 flex items-center gap-1.5 border-t border-hair pt-3">
                <Check className="size-3 text-positive" strokeWidth={3} />
                <span className="text-[12px] font-medium text-forest-800">
                  {s.output}
                </span>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

/* -------------------------- Özellikler (bento) ---------------------------- */

function ApprovalMock() {
  return (
    <div className="mt-6 space-y-2.5">
      {[
        { c: "Nexora Retail", p: "Elif Kaya", s: 92 },
        { c: "Bloom Studio", p: "Deniz Acar", s: 84 },
      ].map((r) => (
        <div
          key={r.c}
          className="flex items-center gap-3 rounded-[12px] bg-paper px-3.5 py-2.5 ring-1 ring-hair"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-lime-100 text-[11px] font-semibold text-forest-800">
            {r.c.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-text-strong">
              {r.c}
            </p>
            <p className="truncate text-[11px] text-text-muted">{r.p}</p>
          </div>
          <span className="text-[13px] font-semibold tabular-nums text-positive">
            {r.s}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-forest-800 px-2.5 py-1 text-[11px] font-medium text-paper">
            <Check className="size-3" strokeWidth={3} />
            Onayla
          </span>
        </div>
      ))}
    </div>
  );
}

function ScoreMock() {
  return (
    <div className="mt-5 flex items-end gap-3">
      <p className="text-[40px] font-semibold leading-none tabular-nums text-positive">
        92
      </p>
      <div className="flex-1 pb-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-forest-600 to-lime-500" />
        </div>
        <p className="mt-1.5 text-[11px] text-text-faint">ICP uyumu</p>
      </div>
    </div>
  );
}

function DraftMock() {
  return (
    <div className="mt-5 rounded-[12px] bg-paper p-3.5 ring-1 ring-hair">
      <p className="text-[12px] font-semibold text-text-strong">
        Growth ekibi büyürken ilk 90 gün
      </p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-text-muted">
        Merhaba Elif, yatırım turunuzu okudum — ekip büyürken outbound&apos;u…
      </p>
      <div className="mt-2.5 flex gap-1.5">
        <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-medium text-forest-800">
          Yatırım turu
        </span>
        <span className="rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-medium text-forest-700">
          İşe alım
        </span>
      </div>
    </div>
  );
}

function ReplyMock() {
  return (
    <div className="mt-5 flex flex-wrap gap-1.5">
      {[
        { l: "İlgileniyor", c: "bg-positive-bg text-positive" },
        { l: "İtiraz", c: "bg-danger-bg text-danger" },
        { l: "Şimdi değil", c: "bg-warning-bg text-warning" },
        { l: "Alakasız", c: "bg-surface-2 text-text-muted" },
      ].map((t) => (
        <span
          key={t.l}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${t.c}`}
        >
          {t.l}
        </span>
      ))}
    </div>
  );
}

function Tile({
  icon: Icon,
  title,
  body,
  className = "",
  children,
}: {
  icon: typeof Filter;
  title: string;
  body: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={staggerChild}
      className={`group relative overflow-hidden rounded-[20px] bg-surface p-6 ring-1 ring-hair transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-20px_rgba(15,23,42,0.25)] hover:ring-forest-200 ${className}`}
    >
      <div className="flex size-11 items-center justify-center rounded-[13px] bg-forest-50 transition-colors duration-300 group-hover:bg-lime-100">
        <Icon className="size-5 text-forest-800" strokeWidth={1.9} />
      </div>
      <h3 className="mt-4 text-[16.5px] font-semibold text-text-strong">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-text-muted">{body}</p>
      {children}
    </motion.div>
  );
}

export function Features() {
  return (
    <section
      id="ozellikler"
      className="relative scroll-mt-20 overflow-hidden px-5 py-28"
    >
      {/* Bölümü ayıran yumuşak zemin */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-surface-2/50" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #C7CDBE 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, #000 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, #000 20%, transparent 75%)",
        }}
      />

      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Özellikler"
          title="Bir SDR ekibinin yaptığı işler, otomatikleşmiş hâliyle"
          lead="Araştırmadan sözleşmeye kadar tüm adımlar aynı yerde toplanır."
        />

        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Tile
            icon={Filter}
            title="ICP skorlama"
            body="Her lead 0–100 arası puanlanır; kimi önce arayacağını tahmin etmen gerekmez."
          >
            <ScoreMock />
          </Tile>

          <Tile
            icon={BadgeCheck}
            title="Onay kuyruğu"
            body="Hiçbir e-posta sen görmeden çıkmaz. Tek tıkla onayla, istersen düzenle."
            className="sm:col-span-2"
          >
            <ApprovalMock />
          </Tile>

          <Tile
            icon={Zap}
            title="Sinyale dayalı yazım"
            body="Genel şablon yok. Taslak, o şirkette az önce ne olduğuna dayanır."
            className="sm:col-span-2"
          >
            <DraftMock />
          </Tile>

          <Tile
            icon={MessagesSquare}
            title="Yanıt sınıflandırma"
            body="Gelen cevaplar otomatik etiketlenir, önerilen yanıt hazır bekler."
          >
            <ReplyMock />
          </Tile>

          <Tile
            icon={CalendarClock}
            title="Toplantı brief'i"
            body="Toplantıdan önce firma özeti, konuşma geçmişi ve hazırlık notları elinde."
          />
          <Tile
            icon={FileSignature}
            title="Sözleşme ve PDF"
            body="Anlaşma bağlandığında sözleşme PDF'i üretilir, Gmail taslağı hazırlanır."
          />
          <Tile
            icon={Sparkles}
            title="Otomatik takip"
            body="Yanıt gelmezse takip mesajı doğru aralıkla, senin sesinle gönderilir."
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------ Entegrasyonlar ----------------------------- */

const integrations = [
  {
    name: "Lead veritabanı",
    role: "Lead kaynağı",
    node: (
      <span className="flex size-9 items-center justify-center rounded-[9px] bg-forest-800">
        <Database className="size-[18px] text-lime-500" strokeWidth={1.9} />
      </span>
    ),
  },
  {
    name: "Gmail",
    role: "Gönderim ve taslak",
    node: <GmailIcon className="size-9 p-1" />,
  },
  {
    name: "Cal.com",
    role: "Toplantı takvimi",
    node: <MonogramIcon label="Cal" bg="#111827" className="size-9" />,
  },
  {
    name: "Supabase",
    role: "Veri katmanı",
    node: <SupabaseIcon className="size-9 p-0.5" />,
  },
  {
    name: "Trigger.dev",
    role: "Ajan görevleri",
    node: <MonogramIcon label="T." bg="#41FF54" fg="#0B1A0E" className="size-9" />,
  },
  {
    name: "Make",
    role: "Otomasyon köprüsü",
    node: <MonogramIcon label="M" bg="#6D00CC" className="size-9" />,
  },
  {
    name: "Claude",
    role: "Yazım ve analiz",
    node: <MonogramIcon label="C" bg="#D97757" className="size-9" />,
  },
  {
    name: "Resend",
    role: "Bildirimler",
    node: <MonogramIcon label="R" bg="#111827" className="size-9" />,
  },
  {
    name: "Firecrawl",
    role: "Web araştırma",
    node: <MonogramIcon label="FC" bg="#FF4500" className="size-9" />,
  },
  {
    name: "Tavily",
    role: "Gerçek zamanlı arama",
    node: <MonogramIcon label="Tv" bg="#0057FF" className="size-9" />,
  },
];

export function Integrations() {
  return (
    <section id="entegrasyonlar" className="scroll-mt-20 px-5 py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Entegrasyonlar"
          title="Zaten kullandığın araçların üstünde çalışır"
          lead="Yeni bir CRM'e taşınmana gerek yok; Hallederiz mevcut akışına bağlanır."
        />

        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          {integrations.map((it) => (
            <motion.div
              key={it.name}
              variants={staggerChild}
              className="group flex items-center gap-3.5 rounded-[16px] bg-surface px-4 py-4 ring-1 ring-hair transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.24)] hover:ring-forest-200"
            >
              <span className="shrink-0 transition-transform duration-300 group-hover:scale-105">
                {it.node}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-text-strong">
                  {it.name}
                </p>
                <p className="truncate text-[12px] text-text-muted">{it.role}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <Reveal delay={0.15} className="mt-8 text-center">
          <a
            href="#sss"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-forest-700 transition-colors hover:text-forest-800"
          >
            Kurulum nasıl işliyor?
            <ArrowRight className="size-3.5" strokeWidth={2.4} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
