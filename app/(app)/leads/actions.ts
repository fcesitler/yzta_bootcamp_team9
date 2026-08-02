"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Taslak e-postalar alıcının diline yazılıyor (bkz. detectEmailLanguage) — bu doğru,
// ama kullanıcı her dili bilemez. Bu action taslağı Türkçeye çevirir ve sonucu
// research.draftTranslationTr'ye YAZAR: aynı taslak ikinci kez çevrildiğinde Claude'a
// tekrar gidilmez. Orijinal metin (draft_email) hiçbir zaman değiştirilmez — gönderim
// her zaman orijinalden yapılır, çeviri yalnız okuma amaçlıdır.
export async function translateDraft(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const admin = createAdminClient();
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("id, draft_email, research")
    .eq("id", leadId)
    .eq("owner_id", user.id)
    .single();

  if (leadErr || !lead) return { error: "Lead bulunamadı." };

  const body = (lead.draft_email as string | null)?.trim();
  if (!body) return { error: "Çevrilecek taslak yok." };

  const research = (lead.research as Record<string, unknown> | null) ?? {};

  // Önbellek: taslak değişmediyse (kullanıcı düzenlemediyse) kayıtlı çeviriyi döndür.
  // Taslağın kendisini parmak izi olarak saklıyoruz ki düzenlenen taslakta bayat
  // çeviri gösterilmesin.
  if (
    typeof research.draftTranslationTr === "string" &&
    research.draftTranslationSource === body
  ) {
    return { translation: research.draftTranslationTr as string, cached: true };
  }

  let translation: string;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Aşağıdaki soğuk satış e-postasını Türkçeye çevir.

Kurallar:
- Yalnızca çeviriyi döndür; açıklama, başlık veya tırnak ekleme.
- Satır sonlarını ve paragraf yapısını koru.
- Şirket adlarını, ürün adlarını ve kişi adlarını olduğu gibi bırak.
- Metin zaten Türkçeyse aynen geri döndür.

E-posta:
${body}`,
        },
      ],
    });
    const first = msg.content[0];
    translation = first && first.type === "text" ? first.text.trim() : "";
  } catch (e) {
    console.error("translateDraft failed:", e);
    return { error: "Çeviri yapılamadı, tekrar deneyin." };
  }

  if (!translation) return { error: "Çeviri boş döndü, tekrar deneyin." };

  // Önbelleğe yaz. Başarısız olursa çeviriyi yine de döndür — kullanıcı için
  // önemli olan metni görmek, önbellek yalnız maliyet optimizasyonu.
  const { error: updErr } = await admin
    .from("leads")
    .update({
      research: {
        ...research,
        draftTranslationTr: translation,
        draftTranslationSource: body,
      },
    })
    .eq("id", leadId);
  if (updErr) console.error("translateDraft cache write failed:", updErr);

  return { translation, cached: false };
}
