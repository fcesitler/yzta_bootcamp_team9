"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/db/activity";

export async function sendReply(leadId: string, replyBody: string) {
  if (!replyBody.trim()) return { error: "Yanıt boş olamaz." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const admin = createAdminClient();
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("id, campaign_id, company, contact, email, research")
    .eq("id", leadId)
    .eq("owner_id", user.id)
    .single();

  if (leadErr || !lead) return { error: "Lead bulunamadı." };
  if (!lead.email) return { error: "Lead e-posta adresi yok." };

  const draftSubject =
    (lead.research as { draftSubject?: string } | null)?.draftSubject ?? "";
  const subject = draftSubject ? `Re: ${draftSubject}` : "Re: Hallederiz";

  const webhook = process.env.MAKE_SEND_EMAIL_WEBHOOK;
  if (!webhook) return { error: "Gönderim webhook'u yapılandırılmamış." };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: lead.id,
        to_email: lead.email,
        to_name: lead.contact ?? "",
        subject,
        body: replyBody,
        reply_to: user.email ?? "",
      }),
    });
    if (!res.ok) return { error: `Gönderim başarısız (HTTP ${res.status}).` };
  } catch {
    return { error: "Gönderim servisine ulaşılamadı." };
  }

  await admin.from("messages").insert({
    owner_id: user.id,
    lead_id: leadId,
    direction: "out",
    channel: "email",
    body: replyBody,
  });

  await logActivity({
    ownerId: user.id,
    leadId,
    campaignId: lead.campaign_id ?? null,
    step: "send",
    status: "completed",
    summary: `${lead.company} ile konuşmada yanıt gönderildi.`,
  });

  revalidatePath("/conversations");
  return { success: true };
}
