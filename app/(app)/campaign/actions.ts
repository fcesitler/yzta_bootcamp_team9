"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { runCampaign } from "@/trigger/run-campaign";

export async function saveCampaign(data: {
  name: string;
  icp: Record<string, string>;
  signals: string[];
  maxLeads?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  const campaignName =
    `${data.icp.sector ?? ""} & ${data.icp.geography ?? ""}`.trim().replace(/^&\s*|&\s*$/g, "") ||
    "Yeni kampanya";

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      owner_id: user.id,
      name: campaignName,
      icp: data.icp,
      signals: data.signals,
      status: "running",
    })
    .select()
    .single();

  if (error || !campaign) return { error: error?.message ?? "Kampanya kaydedilemedi." };

  // Trigger.dev görevini arka planda başlat
  try {
    await tasks.trigger<typeof runCampaign>("run-campaign", {
      campaign_id: campaign.id,
      // Kullanıcının seçtiği sayıya saygı duy. Eskiden Math.max(100, …) ile
      // taban 100'e zorlanıyordu — Apollo'da bu kampanya başına 100 kredi demek.
      max_leads: Math.min(100, Math.max(1, data.maxLeads ?? 25)),
    });
  } catch (e) {
    console.error("Trigger.dev görevi başlatılamadı:", e);
  }

  redirect("/campaigns");
}
