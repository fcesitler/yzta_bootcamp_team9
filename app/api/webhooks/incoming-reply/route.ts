import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/db/activity";
import { sendReplyNotification } from "@/lib/notifications/email";
import { verifyWebhookSecret } from "@/lib/webhooks/verify";

export async function POST(request: Request) {
  try {
    if (!verifyWebhookSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { from_email, classification, summary, suggested_reply, owner_id } = body as {
      from_email: string;
      classification: "interested" | "objection" | "not_now" | "irrelevant";
      summary: string;
      suggested_reply: string;
      owner_id?: string;
    };

    if (!from_email || !classification) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (classification === "irrelevant") {
      return NextResponse.json({ ok: true, matched: false });
    }

    const admin = createAdminClient();

    // owner_id verilmişse hesap bazında kapsa — aynı lead e-postası iki müşteride
    // olabilir ve yanıt yanlış hesaba yazılmamalı.
    // order+limit(1): çıplak maybeSingle() birden fazla satırda HATA fırlatıyordu,
    // bu da yanıtın sessizce kaybolmasına ("matched: false") yol açıyordu.
    let leadQuery = admin
      .from("leads")
      .select("id, research, stage, owner_id, campaign_id, company")
      .eq("email", from_email);
    if (owner_id) leadQuery = leadQuery.eq("owner_id", owner_id);

    const { data: lead } = await leadQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lead) {
      return NextResponse.json({ ok: true, matched: false });
    }

    // Pipeline'da ileri aşamadaysa stage'i geri döndürme
    if (lead.stage === "meeting_booked" || lead.stage === "won") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const currentResearch = (lead.research as Record<string, unknown>) ?? {};
    await admin
      .from("leads")
      .update({
        stage: "replied",
        research: {
          ...currentResearch,
          replyClassification: classification,
          replySummary: summary,
          suggestedReply: suggested_reply,
        },
      })
      .eq("id", lead.id);

    await admin.from("messages").insert({
      owner_id: lead.owner_id,
      lead_id: lead.id,
      direction: "in",
      channel: "email",
      body: summary,
    });

    const classificationLabels: Record<string, string> = {
      interested: "İlgileniyor",
      objection: "İtiraz",
      not_now: "Şimdi değil",
    };
    if (lead.owner_id) {
      const { data: ownerData } = await admin.auth.admin.getUserById(lead.owner_id);
      const ownerEmail = ownerData.user?.email;
      if (ownerEmail) {
        await sendReplyNotification({
          ownerEmail,
          company: lead.company,
          classification,
          summary,
        }).catch((e) => console.error("Bildirim gönderilemedi:", e));
      }

      await logActivity({
        ownerId: lead.owner_id,
        leadId: lead.id,
        campaignId: lead.campaign_id ?? null,
        step: "classify",
        status: "completed",
        summary: `${lead.company} yanıtı sınıflandı: ${
          classificationLabels[classification] ?? classification
        }.`,
      });
    }

    revalidatePath("/campaigns");
    if (lead.campaign_id) revalidatePath(`/campaigns/${lead.campaign_id}`);
    revalidatePath("/conversations");

    return NextResponse.json({ ok: true, matched: true, lead_id: lead.id });
  } catch (err) {
    console.error("incoming-reply webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
