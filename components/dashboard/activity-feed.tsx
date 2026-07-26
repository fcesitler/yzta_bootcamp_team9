import {
  Search,
  Telescope,
  Gauge,
  PenLine,
  Send,
  MessageSquare,
  CalendarCheck,
  FileSignature,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { DbAgentActivity } from "@/lib/db/types";

const stepMeta: Record<string, { icon: LucideIcon; label: string }> = {
  find: { icon: Search, label: "Bul" },
  research: { icon: Telescope, label: "Araştır" },
  score: { icon: Gauge, label: "Skorla" },
  write: { icon: PenLine, label: "Yaz" },
  send: { icon: Send, label: "Gönder" },
  classify: { icon: MessageSquare, label: "Sınıflandır" },
  meeting: { icon: CalendarCheck, label: "Toplantı" },
  contract: { icon: FileSignature, label: "Sözleşme" },
};

const statusDot: Record<string, string> = {
  started: "bg-text-faint",
  completed: "bg-forest-600",
  error: "bg-danger",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.floor(hr / 24);
  return `${day} gün önce`;
}

export function ActivityFeed({ items }: { items: DbAgentActivity[] }) {
  return (
    <div className="rounded-card border border-hair bg-surface px-6 py-5">
      <div className="flex items-center gap-1.5 text-forest-800">
        <Sparkles className="size-3.5" />
        <h2 className="text-[11px] font-medium uppercase tracking-wide">
          Agent aktivitesi
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-[13px] text-text-muted">
          Henüz agent aktivitesi yok. Kampanya çalıştığında adımlar burada görünür.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-hair">
          {items.map((a) => {
            const meta = stepMeta[a.step] ?? { icon: Sparkles, label: a.step };
            const Icon = meta.icon;
            return (
              <div key={a.id} className="flex items-start gap-3 py-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-surface-2 text-forest-800">
                  <Icon className="size-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${
                        statusDot[a.status] ?? "bg-text-faint"
                      }`}
                    />
                    <p className="text-[13px] font-medium text-text-strong">
                      {meta.label}
                    </p>
                    <span className="ml-auto shrink-0 text-[12px] text-text-faint">
                      {relativeTime(a.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-text-muted">
                    {a.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
