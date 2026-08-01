import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/db/activity";
import { verifyWebhookSecret } from "@/lib/webhooks/verify";

// B6 — Toplantı ayarlandı receiver.
// Make akışı: Cal.com "meeting booked" tetikleyici → ai-local-agent brief üretir
// → bu route'a POST. Lead'i email ile eşler, meetings satırı ekler,
// leads.stage='meeting_booked' + research.meetingBrief/meetingTime yazar.
export async function POST(request: Request) {
  try {
    if (!verifyWebhookSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      from_email,
      scheduled_at,
      duration_min,
      platform,
      meet_url,
      brief_text,
      brief,
      owner_id,
    } = body as {
      from_email: string;
      scheduled_at: string;
      duration_min?: number;
      platform?: string;
      meet_url?: string;
      brief_text?: string;
      owner_id?: string;
      brief?: {
        keyPeople?: { name: string; role: string; note: string }[];
        talkingPoints?: string[];
        summary?: string;
      };
    };

    if (!from_email || !scheduled_at) {
      return NextResponse.json(
        { error: "Missing fields: from_email, scheduled_at" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // owner_id verilmişse hesap bazında kapsa; order+limit(1) ile çoklu satırda
    // maybeSingle()'ın hata fırlatıp toplantıyı sessizce düşürmesini engelle.
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

    // Anlaşma kapandıysa toplantı ayarlamayla geri döndürme
    if (lead.stage === "won") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const currentResearch = (lead.research as Record<string, unknown>) ?? {};
    await admin
      .from("leads")
      .update({
        stage: "meeting_booked",
        research: {
          ...currentResearch,
          meetingBrief: brief_text ?? brief?.summary ?? "",
          meetingTime: scheduled_at,
        },
      })
      .eq("id", lead.id);

    await admin.from("meetings").insert({
      lead_id: lead.id,
      scheduled_at,
      duration_min: duration_min ?? 30,
      platform: platform ?? null,
      meet_url: meet_url ?? null,
      brief: brief ?? null,
    });

    if (lead.owner_id) {
      await logActivity({
        ownerId: lead.owner_id,
        leadId: lead.id,
        campaignId: lead.campaign_id ?? null,
        step: "meeting",
        status: "completed",
        summary: `${lead.company} ile toplantı ayarlandı, brief hazır.`,
      });
    }

    revalidatePath("/campaigns");
    revalidatePath("/briefs");
    revalidatePath("/conversations");

    return NextResponse.json({ ok: true, matched: true, lead_id: lead.id });
  } catch (err) {
    console.error("meeting-booked webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
