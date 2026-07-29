"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./motion-primitives";

/* ----------------------------------- SSS ---------------------------------- */

const faqs = [
  {
    q: "E-postalar ben görmeden gönderilir mi?",
    a: "Hayır. Her taslak onay kuyruğuna düşer; sen onaylayana kadar hiçbir mesaj çıkmaz. İstersen taslağı göndermeden önce düzenleyebilirsin.",
  },
  {
    q: "Lead verisi nereden geliyor?",
    a: "Tarif ettiğin ideal müşteri profiline uyan şirketler ve karar vericiler entegre lead veritabanından çekilir. Kredi tüketimini sınırlamak için lead sayısını kampanya bazında sen belirlersin.",
  },
  {
    q: "Kendi e-posta adresimden mi gönderiliyor?",
    a: "Evet. Gmail hesabın bağlandığında mesajlar senin adresinden gider, yanıtlar da doğrudan sana döner. Hallederiz araya girmez.",
  },
  {
    q: "Toplantı brief'i ne içeriyor?",
    a: "Firma özeti, iletişimdeki kişi ve unvanı, o güne kadarki yazışmanın özeti ve toplantı için 2–3 somut hazırlık notu.",
  },
  {
    q: "Kurulum ne kadar sürüyor?",
    a: "İdeal müşteri profilini tanımlaman birkaç dakika sürüyor. Kampanyayı başlattığın anda ajanlar lead taramasına geçiyor.",
  },
];

export function Faq() {
  return (
    <section id="sss" className="scroll-mt-20 px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-700">
            SSS
          </p>
          <h2 className="mt-3 text-balance text-[32px] font-medium leading-[1.12] tracking-[-0.02em] text-text-strong sm:text-[40px]">
            Sık sorulanlar
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <Accordion className="overflow-hidden rounded-[16px] bg-surface ring-1 ring-hair">
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`faq-${i}`}
                className="border-hair px-5 not-last:border-b"
              >
                <AccordionTrigger className="py-5 text-[15px] font-medium text-text-strong hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 pr-6 text-[14px] leading-relaxed text-text-muted">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------- Kapanış CTA ------------------------------- */

export function ClosingCta() {
  return (
    <section className="px-5 pb-24">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative isolate overflow-hidden rounded-[24px] bg-forest-800 px-6 py-16 text-center sm:px-16">
          {/* Limon ışık — koyu zeminde tek vurgu */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-25"
            style={{
              background:
                "radial-gradient(ellipse 55% 70% at 50% 0%, #B6E82F, transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.14]"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, #F3F4EC 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />

          <h2 className="mx-auto max-w-2xl text-balance text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-paper sm:text-[44px]">
            Bu hafta ilk toplantını ayarla
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-balance text-[16px] leading-relaxed text-forest-100">
            İdeal müşteri profilini tanımla, kampanyayı başlat. Ajanlar gerisini
            hallederiz.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-lime-500 px-7 text-[15px] font-semibold text-forest-900 transition-all hover:bg-lime-400 sm:w-auto"
            >
              Ücretsiz dene
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.4}
              />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-[12px] px-7 text-[15px] font-medium text-paper ring-1 ring-forest-400/50 transition-colors hover:bg-forest-700 sm:w-auto"
            >
              Giriş yap
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* --------------------------------- Footer --------------------------------- */

export function SiteFooter() {
  return (
    <footer className="border-t border-hair px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-[8px] bg-forest-800">
            <Sparkles className="size-4 text-lime-500" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-forest-800">
            Hallederiz
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <a
            href="#nasil-calisir"
            className="text-[13px] text-text-muted transition-colors hover:text-text-strong"
          >
            Nasıl çalışır
          </a>
          <a
            href="#ozellikler"
            className="text-[13px] text-text-muted transition-colors hover:text-text-strong"
          >
            Özellikler
          </a>
          <a
            href="#sss"
            className="text-[13px] text-text-muted transition-colors hover:text-text-strong"
          >
            SSS
          </a>
          <Link
            href="/login"
            className="text-[13px] text-text-muted transition-colors hover:text-text-strong"
          >
            Giriş yap
          </Link>
        </nav>

        <p className="text-[12px] text-text-faint">
          © {new Date().getFullYear()} Hallederiz
        </p>
      </div>
    </footer>
  );
}
