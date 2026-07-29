import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLeads } from "@/lib/db/queries";
import { LeadsView } from "@/components/leads/leads-view";
import type { Lead } from "@/lib/mock";
import { ArrowLeft } from "lucide-react";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  const dbLeads = await getLeads(id);

  const leads: Lead[] = dbLeads.map((l) => ({
    id: l.id,
    company: l.company,
    initials: l.initials ?? l.company.slice(0, 2).toUpperCase(),
    tint: (l.tint as Lead["tint"]) ?? "lime",
    industry: l.research?.industry ?? "—",
    size: l.research?.size ?? "—",
    location: l.research?.location ?? "—",
    contact: l.contact ?? "—",
    title: l.title ?? "—",
    linkedin: l.linkedin_url,
    stage: (l.stage as Lead["stage"]) ?? "awaiting_approval",
    score: l.score ?? 0,
    whyNow: l.research?.whyNow ?? "",
    draftSubject: l.research?.draftSubject ?? "",
    draftBody: l.draft_email ?? "",
  }));

  const icp = typeof campaign.icp === "object" && campaign.icp
    ? (campaign.icp as Record<string, string>)
    : {};
  const date = new Date(campaign.created_at).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-4">
        <Link
          href="/campaigns"
          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-[8px] text-text-faint hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-[28px] font-medium leading-tight tracking-tight text-text-strong">
            {campaign.name}
          </h1>
          <p className="mt-1 text-[14px] text-text-muted">{date}</p>
          {Object.keys(icp).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(icp).map(([k, v]) =>
                v ? (
                  <span
                    key={k}
                    className="rounded-full bg-forest-50 px-3 py-0.5 text-[12px] font-medium text-forest-800"
                  >
                    {v}
                  </span>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {leads.length === 0 ? (
          <p className="text-center text-[15px] text-text-muted py-16">
            Bu kampanyada henüz lead yok.
          </p>
        ) : (
          <LeadsView initialLeads={leads} />
        )}
      </div>
    </div>
  );
}
