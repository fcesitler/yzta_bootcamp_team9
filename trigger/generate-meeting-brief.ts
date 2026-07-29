import { task, logger } from "@trigger.dev/sdk";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Lazy: modül seviyesinde kurulursa eksik anahtar deploy'un index adımını düşürür.
let _anthropic: Anthropic | null = null;
function getAnthropic() {
  return (_anthropic ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

// Lead'in owner_id'si yoksa fallback — orijinal Make flow'undaki sabit değer.
const OWNER_ID =
  process.env.HALLEDERIZ_OWNER_ID || "07339195-b942-4d21-b7d0-c12368be9f48";

// won/lost dışındaki leadler eşleşmeye aday (orijinal kural).
const EXCLUDED_STAGES = new Set(["won", "lost"]);

// Cal.com booking'i Make copy flow'undan gelen temiz payload.
// encoding="base64": serbest metin alanları (isimler, event başlığı) base64 gelir —
// ham metindeki tırnak/satır sonu raw JSON'u bozmasın diye. E-posta/tarih/URL düz.
type MeetingBriefPayload = {
  invitee_email: string;
  invitee_name: string;
  host_name?: string;
  event_title?: string;
  meeting_start: string;
  meeting_end?: string;
  meet_url?: string;
  owner_id?: string;
  encoding?: "base64" | "plain";
};

type LeadRow = {
  id: string;
  owner_id: string | null;
  campaign_id: string | null;
  company: string;
  contact: string | null;
  title: string | null;
  email: string | null;
  stage: string;
  research: Record<string, unknown> | null;
};

type MessageRow = {
  direction: string;
  body: string;
  sent_at: string;
};

function decodeField(value: string | undefined, encoding: string | undefined): string {
  if (!value) return "";
  if (encoding === "base64") return Buffer.from(value, "base64").toString("utf-8");
  return value;
}

// Türkçe-güvenli ilk-isim karşılaştırması (İ/ı sorununu tr locale ile ele alır).
function firstNameLower(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0].toLocaleLowerCase("tr");
}

async function generateBrief(
  lead: LeadRow,
  messages: MessageRow[],
  payload: MeetingBriefPayload,
  invitee_name: string
): Promise<string> {
  const conversation = messages.length
    ? messages
        .map((m) => `[${m.direction === "out" ? "Biz" : "Müşteri"}] ${m.body}`)
        .join("\n")
    : "(önceki mesaj yok)";

  const msg = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    system: `Sen bir AI SDR toplantı brief üreticisisin. Cal.com üzerinden toplantı ayarlanmış bir lead için Türkçe, kısa ve net bir brief hazırla. Tam olarak şu dört bölümü kullan (markdown başlıkları aynen, başka başlık ekleme):

**Firma:** [şirket + araştırmadan bildiklerimiz]
**İletişim:** [kişi adı ve unvanı]
**Konuşma Özeti:** [mesajlaşmadan ana noktalar — ne teklif ettik, nasıl karşılık verdiler]
**Toplantı Notları:** [2-3 somut hazırlık önerisi, akıcı cümlelerle]

Kesin kurallar:
- Her bölümü akıcı, tam Türkçe cümlelerle doldur. Hiçbir bölümü boş bırakma.
- Kısa çizgi (-), madde imi (•, *) veya "-" gibi yer tutucu KULLANMA; bilgi eksikse o bölümü elindeki verilerle anlamlı bir cümleyle yine de yaz.
- Yalnızca yukarıdaki dört başlığı kullan; "Ağrı Noktası", "İş Modeli", "Hızlı Kazanım" gibi ek/alt başlık ÜRETME.
- İngilizce terimler yerine Türkçe karşılıklarını kullan (reporting→raporlama, backoffice→arka ofis, white-label→markasız/etiketsiz çözüm, quick win→hızlı kazanım). Yazım ve dilbilgisine özen göster; "klient" değil "müşteri" yaz.

Sadece brief'i döndür, başka açıklama yazma.`,
    messages: [
      {
        role: "user",
        content: `Şirket: ${lead.company}
İletişim: ${lead.contact ?? invitee_name} (${lead.title ?? "?"})
Toplantı: ${payload.meeting_start}${payload.event_title ? ` — ${payload.event_title}` : ""}
Araştırma (JSON): ${JSON.stringify(lead.research ?? {})}
Mesajlaşma:
${conversation}`,
      },
    ],
  });

  return (msg.content[0] as { type: string; text: string }).text.trim();
}

export const generateMeetingBrief = task({
  id: "generate-meeting-brief",
  maxDuration: 180,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 10_000,
  },
  queue: { concurrencyLimit: 3 },
  run: async (payload: MeetingBriefPayload) => {
    if (!payload?.invitee_email || !payload?.meeting_start) {
      logger.warn("Eksik payload — atlanıyor", { payload });
      return { skipped: "invalid-payload" as const };
    }

    const invitee_name = decodeField(payload.invitee_name, payload.encoding);
    const host_name = decodeField(payload.host_name, payload.encoding);

    const db = getDb();

    // Davetli (invitee) e-postasıyla aday leadler — host değil, müşteri.
    const { data: leadsRaw, error: selErr } = await db
      .from("leads")
      .select("id, owner_id, campaign_id, company, contact, title, email, stage, research")
      .eq("email", payload.invitee_email)
      .order("created_at", { ascending: false });

    if (selErr) {
      logger.error("Lead sorgusu başarısız", { error: selErr.message });
      throw new Error(selErr.message);
    }

    // Host ismine eşit contact'ları ve terminal stage'leri ele — host asla eşleşmez.
    const hostLower = host_name.trim().toLocaleLowerCase("tr");
    const candidates = ((leadsRaw ?? []) as LeadRow[]).filter(
      (l) =>
        !EXCLUDED_STAGES.has(l.stage) &&
        (!hostLower || (l.contact ?? "").trim().toLocaleLowerCase("tr") !== hostLower)
    );

    if (candidates.length === 0) {
      logger.info("Uygun lead bulunamadı", { email: payload.invitee_email });
      return { db_updated: false, error: "lead not found" as const };
    }

    // İlk-isim eşleşen adayı tercih et; yoksa en güncel (created_at desc, zaten sıralı).
    const inviteeFirst = firstNameLower(invitee_name);
    const lead =
      candidates.find((l) => inviteeFirst && firstNameLower(l.contact) === inviteeFirst) ??
      candidates[0];

    const { data: messages } = await db
      .from("messages")
      .select("direction, body, sent_at")
      .eq("lead_id", lead.id)
      .order("sent_at", { ascending: true });

    const brief = await generateBrief(
      lead,
      (messages ?? []) as MessageRow[],
      payload,
      invitee_name
    );

    const ownerId = payload.owner_id ?? lead.owner_id ?? OWNER_ID;
    const research = (lead.research ?? {}) as Record<string, unknown>;

    // Toplantı süresi — start/end verildiyse hesapla, yoksa kolon default'u (30).
    let durationMin: number | undefined;
    if (payload.meeting_end) {
      const diff =
        (new Date(payload.meeting_end).getTime() -
          new Date(payload.meeting_start).getTime()) /
        60000;
      if (Number.isFinite(diff) && diff > 0) durationMin = Math.round(diff);
    }

    // 1) Lead → meeting_booked + brief'i research'e yaz (app lead drawer bunu okuyor).
    const { error: updErr } = await db
      .from("leads")
      .update({
        stage: "meeting_booked",
        research: {
          ...research,
          meetingBrief: brief,
          meetingTime: payload.meeting_start,
        },
      })
      .eq("id", lead.id);
    if (updErr) throw new Error(`leads update: ${updErr.message}`);

    // 2) meetings kaydı — app'in toplantı görünümü brief.summary'yi okuyor.
    const { error: meetErr } = await db.from("meetings").insert({
      owner_id: ownerId,
      lead_id: lead.id,
      scheduled_at: payload.meeting_start,
      ...(durationMin ? { duration_min: durationMin } : {}),
      meet_url: payload.meet_url ?? null,
      platform: "google_meet",
      brief: { summary: brief },
    });
    if (meetErr) throw new Error(`meetings insert: ${meetErr.message}`);

    // 3) agent_activity — dashboard akışı için.
    const { error: actErr } = await db.from("agent_activity").insert({
      owner_id: ownerId,
      lead_id: lead.id,
      campaign_id: lead.campaign_id,
      step: "meeting",
      status: "completed",
      summary: `${lead.company} ile toplantı ayarlandı, brief hazır.`,
    });
    if (actErr) throw new Error(`agent_activity insert: ${actErr.message}`);

    logger.info("Toplantı brief'i oluşturuldu", { lead_id: lead.id });
    return { brief, db_updated: true, lead_id: lead.id };
  },
});
