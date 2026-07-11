"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  List,
  Inbox,
  FileText,
  PenLine,
  Crosshair,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  navItems,
  currentUser,
  agentActivity,
  agentsActiveCount,
} from "@/lib/mock";

const icons: Record<string, LucideIcon> = {
  LayoutGrid,
  List,
  Inbox,
  FileText,
  PenLine,
  Crosshair,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-hair bg-paper px-3 py-5">
      {/* Marka */}
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-forest-800">
          <Sparkles className="size-5 text-lime-500" strokeWidth={2.2} />
        </div>
        <span className="text-[17px] font-medium tracking-tight text-forest-800">
          Hallederiz
        </span>
      </div>

      {/* Navigasyon */}
      <nav className="mt-8 flex flex-col gap-0.5">
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
                <Icon className="size-[18px]" />
                <span className="text-[15px]">{item.label}</span>
                {item.lockLabel && (
                  <span className="ml-auto rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-medium text-forest-800">
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
                "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] transition-colors",
                active
                  ? "bg-forest-50 font-medium text-forest-800"
                  : "text-text hover:bg-surface-2"
              )}
            >
              <Icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.9} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-medium text-warning">
                  {item.badge}
                </span>
              )}
              {item.lockLabel && (
                <span className="ml-auto rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-medium text-forest-800">
                  {item.lockLabel}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Ajan aktivite widget'ı */}
      <div className="mt-auto rounded-[12px] border border-hair bg-surface/60 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-positive" />
          <span className="text-[13px] font-medium text-text-strong">
            {agentsActiveCount} ajan aktif
          </span>
        </div>
        <p className="mt-1.5 text-[12px] leading-snug text-text-muted">
          {agentActivity.message}
        </p>
      </div>

      {/* Kullanıcı */}
      <div className="mt-3 flex items-center gap-3 px-1">
        <div className="flex size-9 items-center justify-center rounded-full bg-forest-50 text-[13px] font-medium text-forest-800">
          {currentUser.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-text-strong">
            {currentUser.name}
          </p>
          <p className="truncate text-[12px] text-text-muted">
            {currentUser.role}
          </p>
        </div>
      </div>
    </aside>
  );
}
