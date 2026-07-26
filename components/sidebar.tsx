"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  List,
  History,
  Inbox,
  FileText,
  PenLine,
  Crosshair,
  Sparkles,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, agentActivity, agentsActiveCount } from "@/lib/mock";
import { createClient } from "@/lib/supabase/client";
import type { UserInfo } from "@/components/app-shell";

const icons: Record<string, LucideIcon> = {
  LayoutGrid,
  List,
  History,
  Inbox,
  FileText,
  PenLine,
  Crosshair,
};

export function Sidebar({ user }: { user: UserInfo }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-hair bg-surface px-3 py-5">
      {/* Marka */}
      <div className="flex items-center gap-2.5 px-3 py-1">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-forest-800">
          <Sparkles className="size-5 text-lime-500" strokeWidth={2.2} />
        </div>
        <span className="text-[17px] font-semibold tracking-tight text-forest-900">
          Hallederiz
        </span>
      </div>

      {/* Navigasyon */}
      <nav className="mt-7 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          if (item.locked) {
            return (
              <div
                key={item.key}
                className="flex cursor-default items-center gap-3 rounded-[10px] px-3 py-2.5 text-text-faint"
                title="Sprint 3'te açılacak"
              >
                <Icon className="size-[18px]" strokeWidth={1.8} />
                <span className="text-[14px]">{item.label}</span>
                {item.lockLabel && (
                  <span className="ml-auto rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-semibold text-forest-800">
                    {item.lockLabel}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] transition-colors",
                active
                  ? "bg-forest-50 font-semibold text-forest-800 shadow-[inset_3px_0_0_var(--forest-800)]"
                  : "text-text hover:bg-surface-2"
              )}
            >
              <Icon
                className={cn("size-[18px]", active ? "text-forest-800" : "text-text-muted")}
                strokeWidth={active ? 2.3 : 1.8}
              />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-semibold text-warning">
                  {item.badge}
                </span>
              )}
              {item.lockLabel && (
                <span className="ml-auto rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-semibold text-forest-800">
                  {item.lockLabel}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Ajan aktivite widget'ı — Donezo dark-card stili */}
      <div className="mt-auto rounded-[12px] bg-forest-900 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-lime-500" />
          </span>
          <span className="text-[13px] font-semibold text-paper">
            {agentsActiveCount} ajan aktif
          </span>
        </div>
        <p className="mt-1.5 text-[12px] leading-snug text-forest-200">
          {agentActivity.message}
        </p>
      </div>

      {/* Kullanıcı */}
      <div className="mt-3 flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors hover:bg-surface-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-800 text-[12px] font-bold text-paper">
          {user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-text-strong">
            {user.name}
          </p>
          <p className="truncate text-[11px] text-text-faint">{user.role}</p>
        </div>
        <button
          onClick={handleSignOut}
          title="Çıkış yap"
          className="flex size-7 shrink-0 items-center justify-center rounded-[8px] text-text-faint transition-colors hover:bg-danger-bg hover:text-danger"
        >
          <LogOut className="size-[15px]" strokeWidth={1.9} />
        </button>
      </div>
    </aside>
  );
}
