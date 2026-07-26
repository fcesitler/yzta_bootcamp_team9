"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/db/activity";
import { renderContractHtml } from "@/lib/contracts/render";
import { DEFAULT_CONTRACT_TEMPLATE } from "@/lib/contracts/default-template";

// Oturumdaki kullanıcının sözleşme şablonunu kaydeder (hesap başına tek satır → upsert).
export async function saveContractTemplate(html: string) {
  const trimmed = html.trim();
  if (!trimmed) return { error: "Şablon boş olamaz." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("contract_templates")
    .upsert(
      { owner_id: user.id, html: trimmed, updated_at: new Date().toISOString() },
      { onConflict: "owner_id" }
    );
  if (error) return { error: "Şablon kaydedilemedi." };

  revalidatePath("/close");
  return { success: true };
}

export async function prepareDraft(contractId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("contracts")
    .select("*, leads(company, contact, email, campaign_id)")
    .eq("id", contractId)
    .single();

  if (error || !data) return { error: "Sözleşme bulunamadı." };

  const lead = data.leads as {
    company: string;
    contact: string | null;
    email: string | null;
    campaign_id: string | null;
  } | null;
  if (!lead?.email) return { error: "Lead e-posta adresi yok." };

  const webhook = process.env.MAKE_CONTRACT_WEBHOOK;
  if (!webhook) return { error: "Sözleşme webhook'u henüz yapılandırılmamış." };

  // Kullanıcının yüklediği şablonu al (yoksa varsayılan) → sözleşme HTML'ini
  // uygulama tarafında render et. Make bu html'i (Batch 2 sonrası) doğrudan
  // taslağa basar; henüz baskı yapmıyorsa kendi hardcoded şablonunu kullanır.
  const { data: tpl } = await admin
    .from("contract_templates")
    .select("html")
    .eq("owner_id", data.owner_id)
    .maybeSingle();
  const templateHtml = tpl?.html ?? DEFAULT_CONTRACT_TEMPLATE;
  const renderedHtml = renderContractHtml(templateHtml, {
    company: lead.company,
    contact: lead.contact || lead.company,
    email: lead.email,
    scope: data.scope,
    amount: data.amount,
    currency: data.currency,
    billing: data.billing,
    term: data.term,
    start_date: data.start_date,
  });

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.MAKE_CONTRACT_API_KEY
          ? { "x-make-apikey": process.env.MAKE_CONTRACT_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        contract_id: contractId,
        lead_id: data.lead_id,
        company: lead.company,
        contact: lead.contact ?? "",
        email: lead.email,
        scope: data.scope ?? "",
        amount: data.amount ?? 0,
        currency: data.currency,
        billing: data.billing ?? "",
        term: data.term ?? "",
        start_date: data.start_date ?? "",
        // Uygulama tarafında render edilmiş nihai sözleşme HTML'i (Batch 2'de
        // Make bunu {{1.html}} ile doğrudan taslağa basacak).
        html: renderedHtml,
      }),
    });
    if (!res.ok) return { error: `Webhook hatası (HTTP ${res.status}).` };
  } catch {
    return { error: "Webhook servisine ulaşılamadı." };
  }

  await admin.from("contracts").update({ status: "draft_ready" }).eq("id", contractId);

  if (data.owner_id) {
    await logActivity({
      ownerId: data.owner_id,
      leadId: data.lead_id,
      campaignId: lead.campaign_id ?? null,
      step: "contract",
      status: "completed",
      summary: `${lead.company} için sözleşme taslağı hazırlandı.`,
    });
  }

  return { success: true };
}
