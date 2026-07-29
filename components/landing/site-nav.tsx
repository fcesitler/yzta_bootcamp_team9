"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#nasil-calisir", label: "Nasıl çalışır" },
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#entegrasyonlar", label: "Entegrasyonlar" },
  { href: "#sss", label: "SSS" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-hair bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-forest-800">
            <Sparkles className="size-4.5 text-lime-500" strokeWidth={2.2} />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-forest-800">
            Hallederiz
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-text-muted transition-colors hover:bg-surface hover:text-text-strong"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-text-strong transition-colors hover:bg-surface"
          >
            Giriş yap
          </Link>
          <Link
            href="/signup"
            className="rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700"
          >
            Ücretsiz dene
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-lg text-text-strong transition-colors hover:bg-surface md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-hair bg-paper px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-text transition-colors hover:bg-surface"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-hair pt-3">
            <Link
              href="/login"
              className="rounded-[10px] px-3 py-2.5 text-center text-[15px] font-medium text-text-strong ring-1 ring-hair"
            >
              Giriş yap
            </Link>
            <Link
              href="/signup"
              className="rounded-[10px] bg-forest-800 px-3 py-2.5 text-center text-[15px] font-medium text-paper"
            >
              Ücretsiz dene
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
