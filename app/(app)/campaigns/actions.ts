"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/db/activity";

// Panelde "Onayla & gönder" → Make webhook'una cold outreach e-postasını gönder,
// ardından leads.stage='sent' + messages'a giden mesaj kaydı ekle.
export async function approveLead(leadId: string, bodyOverride?: string) {
  // 1. Oturum doğrula
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  // 2. Lead + taslak bilgilerini servis-rol ile getir (ownership check zorunlu)
  const admin = createAdminClient();
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("id, campaign_id, company, contact, email, draft_email, research, stage")
    .eq("id", leadId)
    .eq("owner_id", user.id)
    .single();

  if (leadErr || !lead) return { error: "Lead bulunamadı." };
  if (!lead.email)
    return { error: "Bu lead için e-posta adresi yok — gönderilemez." };

  const subject =
    (lead.research as { draftSubject?: string } | null)?.draftSubject ??
    `${lead.company} için`;
  const body = bodyOverride?.trim() || lead.draft_email || "";

  if (!body.trim()) return { error: "Taslak e-posta boş — gönderilemez." };

  // 3. Make webhook → Gmail gönderim
  const webhook = process.env.SEND_EMAIL_WEBHOOK;
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
        body,
        reply_to: user.email ?? "",
      }),
    });
    if (!res.ok) {
      return { error: `Gönderim başarısız (HTTP ${res.status}).` };
    }
  } catch (e) {
    console.error("Make webhook hatası:", e);
    return { error: "Gönderim servisine ulaşılamadı." };
  }

  // 4. Durumu güncelle + giden mesajı kaydet
  const { error: updErr } = await admin
    .from("leads")
    .update({ stage: "sent" })
    .eq("id", leadId);
  if (updErr) return { error: "Durum güncellenemedi." };

  await admin.from("messages").insert({
    owner_id: user.id,
    lead_id: leadId,
    direction: "out",
    channel: "email",
    body,
  });

  await logActivity({
    ownerId: user.id,
    leadId,
    campaignId: lead.campaign_id ?? null,
    step: "send",
    status: "completed",
    summary: `${lead.company} firmasına e-posta gönderildi.`,
  });

  revalidatePath("/campaigns");
  if (lead.campaign_id) revalidatePath(`/campaigns/${lead.campaign_id}`);
  revalidatePath("/");
  return { success: true };
}
