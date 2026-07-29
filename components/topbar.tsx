"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Bell, X } from "lucide-react";
import type { UserInfo } from "@/components/app-shell";

export function Topbar({ user }: { user: UserInfo }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const onConversations = pathname === "/conversations";

  // Konuşmalar sayfasındaysak arama kutusu URL'deki ?q ile senkron kalsın
  // (geri/ileri veya dışarıdan gelen q değeri kutuya yansısın).
  const [query, setQuery] = useState(onConversations ? searchParams.get("q") ?? "" : "");

  useEffect(() => {
    if (onConversations) setQuery(searchParams.get("q") ?? "");
  }, [onConversations, searchParams]);

  // Konuşmalar sayfasında: her tuşta URL'i replace et → liste anlık filtrelenir.
  function pushQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/conversations?${qs}` : "/conversations", { scroll: false });
  }

  function handleChange(value: string) {
    setQuery(value);
    if (onConversations) pushQuery(value);
  }

  // Başka sayfadaysak Enter'a basınca Konuşmalar'a gidip filtreyi uygula.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !onConversations && query.trim()) {
      router.push(`/conversations?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function clearQuery() {
    setQuery("");
    if (onConversations) pushQuery("");
  }

  return (
    <header className="flex items-center gap-4 border-b border-hair bg-surface px-8 py-3.5">
      {/* Arama */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Firma, kişi, konuşma ara…"
          className="h-10 w-full rounded-[10px] border border-hair bg-surface-2/60 pl-9 pr-14 text-[13px] text-text-strong placeholder:text-text-faint focus:border-forest-400 focus:bg-surface focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Aramayı temizle"
            className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-text-faint transition-colors hover:bg-surface-2 hover:text-text-strong"
          >
            <X className="size-3.5" strokeWidth={2.4} />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-hair bg-surface px-1.5 py-0.5 text-[11px] text-text-faint">
            ⌘K
          </kbd>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Pipeline durumu */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="size-2 rounded-full bg-positive" />
        </div>

        {/* Bildirim zili */}
        <button
          className="relative flex size-9 items-center justify-center rounded-[10px] border border-hair bg-surface-2/60 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-strong"
          title="Bildirimler"
        >
          <Bell className="size-[17px]" strokeWidth={1.8} />
        </button>

        {/* Yeni kampanya */}
        <Link href="/campaign" className="flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[13px] font-semibold text-paper transition-colors hover:bg-forest-700">
          <Plus className="size-4" strokeWidth={2.4} />
          Yeni kampanya
        </Link>

        {/* Kullanıcı avatarı */}
        <div className="flex items-center gap-2.5 border-l border-hair pl-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-800 text-[11px] font-bold text-paper">
            {user.initials}
          </div>
          <div className="hidden flex-col lg:flex">
            <span className="text-[13px] font-semibold leading-tight text-text-strong">
              {user.name}
            </span>
            <span className="text-[11px] leading-tight text-text-faint">
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
