import type { Metadata } from "next";
import { SiteNav } from "@/components/landing/site-nav";
import { Hero } from "@/components/landing/hero";
import { Pipeline, Features, Integrations } from "@/components/landing/sections";
import { Faq, ClosingCta, SiteFooter } from "@/components/landing/closing";

export const metadata: Metadata = {
  title: "Hallederiz — Bul, araştır, yaz. Sen toplantıya gir.",
  description:
    "Hallederiz ideal müşterini bulur, sinyalleri araştırır, kişiselleştirilmiş e-postayı yazar ve toplantını takvimine koyar. Ajanslar ve B2B hizmet firmaları için AI SDR.",
};

export default function LandingPage() {
  return (
    <div className="min-h-full bg-paper">
      <SiteNav />
      <main>
        <Hero />
        <Pipeline />
        <Features />
        <Integrations />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
