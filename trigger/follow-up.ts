import { schedules, logger } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getOwnerEmail(
  db: ReturnType<typeof getDb>,
  cache: Map<string, string | null>,
  ownerId: string
): Promise<string | null> {
  if (cache.has(ownerId)) return cache.get(ownerId) ?? null;
  const { data } = await db.auth.admin.getUserById(ownerId);
  const email = data.user?.email ?? null;
  cache.set(ownerId, email);
  return email;
}

// Kaç gün yanıtsız kalınca follow-up atılır / en fazla kaç follow-up
const FOLLOW_UP_AFTER_DAYS = Number(process.env.FOLLOW_UP_AFTER_DAYS || 3);
const FOLLOW_UP_MAX = Number(process.env.FOLLOW_UP_MAX || 2);
// Tek çalıştırmada işlenecek maksimum lead — maliyet emniyeti
const FOLLOW_UP_BATCH_LIMIT = 20;

type LeadRow = {
  id: string;
  campaign_id: string | null;
  owner_id: string | null;
  company: string;
  contact: string | null;
  email: string | null;
  draft_email: string | null;
  research: {
    whyNow?: string;
    draftSubject?: string;
    followUpCount?: number;
    followUpLastAt?: string;
  } | null;
};

async function writeFollowUp(
  lead: LeadRow,
  followUpNumber: number
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Yanıtlanmamış bir cold outreach e-postası için kısa bir takip (follow-up) e-postası yaz.

Şirket: ${lead.company}
Kişi: ${lead.contact || "yetkili"}
Neden şimdi sinyali: ${lead.research?.whyNow || "(yok)"}
Orijinal e-posta:
${lead.draft_email || "(yok)"}

Bu ${followUpNumber}. takip e-postası (en fazla ${FOLLOW_UP_MAX} atılıyor).

Kurallar:
- Türkçe, samimi ama profesyonel, 2-4 cümle. Kısa tut.
- Orijinal e-postayı tekrarlama; hafifçe hatırlat ve tek bir net soru sor.
- ${followUpNumber === FOLLOW_UP_MAX ? "Bu son takip — kibarca kapıyı açık bırakıp konuyu kapat." : "Baskı kurma, değer hatırlat."}
- Selamlama ile başla, imza yazma.
- Sadece e-posta gövdesini döndür, başka hiçbir şey yazma.`,
      },
    ],
  });

  return (msg.content[0] as { type: string; text: string }).text.trim();
}

export const followUpEmails = schedules.task({
  id: "follow-up-emails",
  // Her gün 09:00 İstanbul — iş saatinde tek tarama yeterli
  cron: { pattern: "0 9 * * *", timezone: "Europe/Istanbul" },
  maxDuration: 300,
  run: async () => {
    const webhook = process.env.MAKE_SEND_EMAIL_WEBHOOK;
    if (!webhook) {
      logger.error("MAKE_SEND_EMAIL_WEBHOOK tanımlı değil — follow-up atlanıyor");
      return { sent: 0, skipped: "no-webhook" };
    }

    const db = getDb();
    const ownerEmailCache = new Map<string, string | null>();
    const cutoff = new Date(
      Date.now() - FOLLOW_UP_AFTER_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // 'sent' aşamasında kalan (yanıt gelseydi webhook stage'i 'replied' yapardı) leadler
    const { data: leads, error } = await db
      .from("leads")
      .select("id, campaign_id, owner_id, company, contact, email, draft_email, research")
      .eq("stage", "sent")
      .not("email", "is", null);

    if (error) {
      logger.error("Lead sorgusu başarısız", { error });
      return { sent: 0, error: error.message };
    }

    let sent = 0;

    for (const lead of (leads ?? []) as LeadRow[]) {
      if (sent >= FOLLOW_UP_BATCH_LIMIT) break;

      const research = lead.research ?? {};
      const followUpCount = research.followUpCount ?? 0;
      if (followUpCount >= FOLLOW_UP_MAX) continue;

      // Son giden mesaj (cold mail ya da önceki follow-up) yeterince eski mi?
      const { data: lastOut } = await db
        .from("messages")
        .select("sent_at")
        .eq("lead_id", lead.id)
        .eq("direction", "out")
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastOut || lastOut.sent_at > cutoff) continue;

      // Emniyet: bu arada yanıt geldiyse (stage güncellenmemiş olsa bile) atla
      const { count: inCount } = await db
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id)
        .eq("direction", "in");
      if ((inCount ?? 0) > 0) continue;

      const followUpNumber = followUpCount + 1;

      try {
        const body = await writeFollowUp(lead, followUpNumber);
        const subject = `Re: ${research.draftSubject ?? lead.company}`;

        // Make senaryosunun Follow-up rotası (type = "followup") üzerinden gönder
        const replyTo = lead.owner_id
          ? await getOwnerEmail(db, ownerEmailCache, lead.owner_id)
          : null;

        const res = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: lead.id,
            to_email: lead.email,
            to_name: lead.contact ?? "",
            subject,
            body,
            type: "followup",
            follow_up_number: followUpNumber,
            reply_to: replyTo ?? "",
          }),
        });
        if (!res.ok) {
          logger.error("Make webhook başarısız", {
            company: lead.company,
            status: res.status,
          });
          continue;
        }

        // Mesajı kaydet + sayaç güncelle — idempotency bu sayaca dayanır
        await db.from("messages").insert({
          lead_id: lead.id,
          owner_id: lead.owner_id,
          direction: "out",
          channel: "email",
          subject,
          body,
        });

        await db
          .from("leads")
          .update({
            research: {
              ...research,
              followUpCount: followUpNumber,
              followUpLastAt: new Date().toISOString(),
            },
          })
          .eq("id", lead.id);

        if (lead.owner_id) {
          await db.from("agent_activity").insert({
            campaign_id: lead.campaign_id,
            lead_id: lead.id,
            owner_id: lead.owner_id,
            step: "send",
            status: "completed",
            summary: `${lead.company} firmasına takip e-postası gönderildi (${followUpNumber}/${FOLLOW_UP_MAX}).`,
          });
        }

        sent++;
        logger.info(`Follow-up gönderildi: ${lead.company} (${followUpNumber}/${FOLLOW_UP_MAX})`);
      } catch (e) {
        logger.error("Follow-up işlenemedi", { company: lead.company, error: e });
      }
    }

    logger.info("Follow-up taraması tamamlandı", { sent });
    return { sent };
  },
});
