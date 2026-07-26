import Link from "next/link";
import { getCampaignsWithStats } from "@/lib/db/queries";
import { ChevronRight, Crosshair } from "lucide-react";

export default async function CampaignsPage() {
  const campaigns = await getCampaignsWithStats();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-medium leading-tight tracking-tight text-text-strong">
          Campaigns
        </h1>
        <Link
          href="/campaign"
          className="flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2 text-[13px] font-medium text-paper hover:bg-forest-700 transition-colors"
        >
          <Crosshair className="size-3.5" />
          Yeni kampanya
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="mt-16 text-center text-text-muted text-[15px]">
          Henüz kampanya yok.{" "}
          <Link href="/campaign" className="font-medium text-forest-700 hover:underline">
            İlk kampanyayı başlat →
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {campaigns.map((c) => {
            const date = new Date(c.created_at).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const icp = typeof c.icp === "object" && c.icp ? c.icp as Record<string, string> : {};
            const subtitle = [icp.sector, icp.geography, icp.role].filter(Boolean).join(" · ");

            return (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="flex items-center gap-4 rounded-[14px] border border-hair bg-surface px-5 py-4 shadow-card transition-colors hover:bg-surface-2"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-forest-50">
                  <Crosshair className="size-4.5 text-forest-700" strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold text-text-strong">{c.name}</p>
                    {c.status === "active" && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-positive-bg px-2 py-0.5 text-[11px] font-semibold text-positive">
                        <span className="size-1.5 rounded-full bg-positive" />
                        Aktif
                      </span>
                    )}
                  </div>
                  {subtitle && (
                    <p className="mt-0.5 truncate text-[12px] text-text-muted">{subtitle}</p>
                  )}
                  <p className="mt-0.5 text-[12px] text-text-faint">{date}</p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <p className="text-[20px] font-semibold text-text-strong">{c.leadCount}</p>
                    <p className="text-[11px] text-text-faint">lead</p>
                  </div>
                  {c.topScore !== null && (
                    <div className="text-right">
                      <p className="text-[20px] font-semibold text-forest-700">{c.topScore}</p>
                      <p className="text-[11px] text-text-faint">top skor</p>
                    </div>
                  )}
                  <ChevronRight className="size-4 text-text-faint" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
