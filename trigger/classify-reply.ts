import { task, logger } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { sendReplyNotification } from "../lib/notifications/email";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CAL_LINK =
  process.env.CAL_BOOKING_LINK ||
  "https://cal.com/furkan-cesitler-dyxfcl/30min";
const CAL_SENTENCE = `Toplantı için uygun zamanınızı şu linkten seçebilirsiniz: ${CAL_LINK}`;

// meeting_booked / won aşamasındaki leadlere dokunma — orijinal kural.
const TERMINAL_STAGES = new Set(["meeting_booked", "won"]);

type Classification = "interested" | "objection" | "not_now" | "irrelevant";

// Make HTTP modülünden gelen payload. message_id Gmail mesaj ID'si:
// Make trigger ederken options.idempotencyKey = message_id geçmeli (bkz. Batch 2).
// encoding="base64": Make, subject/body'yi base64 gönderir — ham e-posta metnindeki
// tırnak/satır sonu raw JSON gövdesini bozmasın diye. Task burada decode eder.
// Elle/test amaçlı düz metinle tetiklemek için encoding'i atla (varsayılan plain).
type ClassifyReplyPayload = {
  message_id: string;
  from_email: string;
  subject?: string;
  body: string;
  encoding?: "base64" | "plain";
};

function decodeField(value: string | undefined, encoding: string | undefined): string {
  if (!value) return "";
  if (encoding === "base64") return Buffer.from(value, "base64").toString("utf-8");
  return value;
}

type ClassifyResult = {
  classification: Classification;
  summary: string;
  suggested_reply: string;
};

const VALID: Classification[] = [
  "interested",
  "objection",
  "not_now",
  "irrelevant",
];

const SYSTEM_PROMPT = `You are an AI SDR reply classifier.

Classify an inbound email reply to our cold outreach into exactly one of:
- interested: positive reply, wants to learn more or schedule a meeting
- objection: has concerns but still engaging
- not_now: politely declining or asking to be contacted later
- irrelevant: spam, newsletter, auto-reply, promotional email, wrong person, unrelated to our outreach

Also produce:
- summary: a one-sentence Turkish summary of the reply
- suggested_reply: a follow-up reply suggestion in Turkish (empty string if irrelevant)

Return ONLY this JSON, no markdown, no backticks:
{"classification":"...","summary":"...","suggested_reply":"..."}`;

async function classify(
  payload: ClassifyReplyPayload
): Promise<ClassifyResult> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `From: ${payload.from_email}
Subject: ${payload.subject ?? ""}
Body: ${payload.body}`,
      },
    ],
  });

  const text = (msg.content[0] as { type: string; text: string }).text.trim();
  // Model bazen JSON'u ```json ... ``` ile sarabiliyor — ilk { ile son } arasını al.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error(`Sınıflandırma JSON döndürmedi: ${text.slice(0, 200)}`);
  }
  const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<ClassifyResult>;

  const classification = (parsed.classification ?? "").toString() as Classification;
  if (!VALID.includes(classification)) {
    throw new Error(`Geçersiz classification: ${parsed.classification}`);
  }

  let suggested = (parsed.suggested_reply ?? "").toString().trim();
  // interested ise Cal.com cümlesi zorunlu — modele güvenmeden kodda garanti et.
  if (classification === "interested" && !suggested.includes(CAL_LINK)) {
    suggested = suggested ? `${suggested}\n\n${CAL_SENTENCE}` : CAL_SENTENCE;
  }

  return {
    classification,
    summary: (parsed.summary ?? "").toString().trim(),
    suggested_reply: suggested,
  };
}

export const classifyReply = task({
  id: "classify-reply",
  maxDuration: 120,
  // Sonsuz retry yok — 3 deneme, backoff'lu. Make'teki kontrolsüz retry storm'unun çözümü.
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 10_000,
  },
  // Eşzamanlılık tavanı — aynı anda en fazla 3 sınıflandırma, API balance'ı öngörülebilir.
  queue: { concurrencyLimit: 3 },
  run: async (payload: ClassifyReplyPayload) => {
    if (!payload?.from_email || !payload?.body) {
      logger.warn("Eksik payload — atlanıyor", { payload });
      return { skipped: "invalid-payload" as const };
    }

    // base64 ise çöz — Make'ten gelen ham e-posta metni burada normal metne döner.
    const normalized: ClassifyReplyPayload = {
      ...payload,
      subject: decodeField(payload.subject, payload.encoding),
      body: decodeField(payload.body, payload.encoding),
    };

    const result = await classify(normalized);
    logger.info("Sınıflandırma tamam", {
      from: payload.from_email,
      classification: result.classification,
    });

    // irrelevant → DB'ye dokunma (orijinal davranış).
    if (result.classification === "irrelevant") {
      return { classification: result.classification, db_updated: false };
    }

    const db = getDb();

    // Aynı e-postaya birden fazla lead olabilir — terminal olmayan en güncel olanı seç.
    const { data: leads, error: selErr } = await db
      .from("leads")
      .select("id, stage, research, owner_id, company")
      .eq("email", payload.from_email)
      .order("created_at", { ascending: false });

    if (selErr) {
      logger.error("Lead sorgusu başarısız", { error: selErr.message });
      throw new Error(selErr.message);
    }

    const lead = (leads ?? []).find((l) => !TERMINAL_STAGES.has(l.stage));
    if (!lead) {
      logger.info("Uygun lead bulunamadı — DB güncellenmedi", {
        from: payload.from_email,
      });
      return { classification: result.classification, db_updated: false };
    }

    const research = (lead.research ?? {}) as Record<string, unknown>;

    const { error: updErr } = await db
      .from("leads")
      .update({
        stage: "replied",
        research: {
          ...research,
          replyClassification: result.classification,
          replySummary: result.summary,
          suggestedReply: result.suggested_reply,
        },
      })
      .eq("id", lead.id);

    if (updErr) {
      logger.error("Lead güncellenemedi", { error: updErr.message });
      throw new Error(updErr.message);
    }

    const { error: msgErr } = await db.from("messages").insert({
      owner_id: lead.owner_id,
      lead_id: lead.id,
      direction: "in",
      channel: "email",
      body: result.summary,
      ai_suggested_reply: result.suggested_reply,
    });

    if (msgErr) {
      logger.error("Mesaj kaydedilemedi", { error: msgErr.message });
      throw new Error(msgErr.message);
    }

    const { data: ownerData } = await db.auth.admin.getUserById(lead.owner_id);
    const ownerEmail = ownerData.user?.email;
    if (ownerEmail) {
      await sendReplyNotification({
        ownerEmail,
        company: (lead as { company?: string }).company ?? "Firma",
        classification: result.classification,
        summary: result.summary,
      }).catch((e) => logger.warn("Bildirim gönderilemedi", { error: e }));
    }

    logger.info("DB güncellendi", {
      lead_id: lead.id,
      classification: result.classification,
    });

    return {
      classification: result.classification,
      db_updated: true,
      lead_id: lead.id,
    };
  },
});
