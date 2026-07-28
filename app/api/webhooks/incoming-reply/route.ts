import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/db/activity";
import { sendReplyNotification } from "@/lib/notifications/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from_email, classification, summary, suggested_reply } = body as {
      from_email: string;
      classification: "interested" | "objection" | "not_now" | "irrelevant";
      summary: string;
      suggested_reply: string;
    };

    if (!from_email || !classification) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (classification === "irrelevant") {
      return NextResponse.json({ ok: true, matched: false });
    }

    const admin = createAdminClient();

    const { data: lead } = await admin
      .from("leads")
      .select("id, research, stage, owner_id, campaign_id, company")
      .eq("email", from_email)
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
