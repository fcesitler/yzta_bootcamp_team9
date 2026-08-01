import { createHash, timingSafeEqual } from "crypto";

// Gelen webhook'lar (n8n → /api/webhooks/*) için paylaşılan sır doğrulaması.
//
// Bu route'lar createAdminClient() ile RLS'i baypas ederek lead stage'i değiştiriyor,
// mesaj yazıyor ve bildirim e-postası tetikliyor. Doğrulama olmadan URL'i bilen herkes
// sahte "müşteri ilgileniyor" yanıtı veya sahte toplantı enjekte edebilir.
//
// FAIL-CLOSED: INBOUND_WEBHOOK_SECRET tanımlı değilse doğrulama BAŞARISIZ olur.
// Kasıtlı — env'i eklemeyi unutmak, korumanın sessizce devre dışı kalmasıyla değil,
// webhook'ların gürültülü şekilde 401 dönmesiyle sonuçlanmalı.
//
// Giden yöndeki muadili: app/(app)/close/actions.ts (CONTRACT_WEBHOOK_API_KEY).
export const WEBHOOK_SECRET_HEADER = "x-webhook-secret";

export function verifyWebhookSecret(request: Request): boolean {
  const expected = process.env.INBOUND_WEBHOOK_SECRET;
  if (!expected) return false;

  const got = request.headers.get(WEBHOOK_SECRET_HEADER) ?? "";

  // Önce sabit uzunluğa indirge: timingSafeEqual farklı uzunlukta hata fırlatır,
  // ham karşılaştırma ise sırrın uzunluğunu zamanlama üzerinden sızdırır.
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
