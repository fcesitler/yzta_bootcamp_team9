// Varsayılan sözleşme şablonu.
// Kaynak: Make flow-contract senaryosundaki (9571481) hardcoded HTML.
// Make token'ları ({{1.company}} vb.) uygulama token'larına ({{company}} vb.) çevrildi;
// {{if(1.contact; 1.contact; 1.company)}} → {{contact}} (prepareDraft contact yoksa company geçer).
// Kullanıcı kendi şablonunu yüklemediğinde renderContractHtml bunu kullanır → geriye dönük uyum.
export const DEFAULT_CONTRACT_TEMPLATE = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;"><div style="border-bottom:3px solid #1C4B3C;padding-bottom:16px;margin-bottom:24px;"><h1 style="color:#1C4B3C;font-size:22px;margin:0;">Hallederiz</h1><p style="color:#666;font-size:13px;margin:4px 0 0;">AI SDR Hizmet Sözleşmesi</p></div><p>Merhaba {{contact}},</p><p>{{company}} ile gerçekleştirdiğimiz görüşme doğrultusunda hazırlanan hizmet sözleşmemizi aşağıda bulabilirsiniz. Sözleşmeyi inceleyip onaylamanız yeterli — onayınızın ardından imza sürecini birlikte tamamlayacağız.</p><table style="width:100%;border-collapse:collapse;margin:24px 0;"><tr style="background:#B6E82F;"><th style="padding:10px 14px;text-align:left;font-size:13px;color:#1C4B3C;border:1px solid #ccc;" colspan="2">Sözleşme Detayları</th></tr><tr><td style="padding:10px 14px;border:1px solid #ddd;font-weight:600;background:#f9f9f9;width:40%;">Hizmet Kapsamı</td><td style="padding:10px 14px;border:1px solid #ddd;">{{scope}}</td></tr><tr><td style="padding:10px 14px;border:1px solid #ddd;font-weight:600;background:#f9f9f9;">Bedel</td><td style="padding:10px 14px;border:1px solid #ddd;">{{amount}} {{currency}} / {{billing}}</td></tr><tr><td style="padding:10px 14px;border:1px solid #ddd;font-weight:600;background:#f9f9f9;">Sözleşme Süresi</td><td style="padding:10px 14px;border:1px solid #ddd;">{{term}}</td></tr><tr><td style="padding:10px 14px;border:1px solid #ddd;font-weight:600;background:#f9f9f9;">Başlangıç Tarihi</td><td style="padding:10px 14px;border:1px solid #ddd;">{{start_date}}</td></tr></table><div style="background:#f0f9f4;border-left:4px solid #1C4B3C;padding:16px;margin:24px 0;border-radius:4px;"><p style="margin:0;font-size:14px;color:#1C4B3C;"><strong>Sonraki Adım:</strong> Sözleşmeyi inceleyip onaylamanız yeterli. Onayınızın ardından dijital imza için sizinle iletişime geçeceğiz.</p></div><p>Herhangi bir sorunuz olursa lütfen bu e-postayı yanıtlayın.</p><p>Saygılarımla,</p><div style="border-top:1px solid #eee;padding-top:16px;margin-top:24px;"><p style="margin:0;font-weight:600;color:#1C4B3C;">Furkan Çeşitler</p><p style="margin:4px 0;font-size:13px;color:#666;">Hallederiz AI SDR</p><p style="margin:4px 0;font-size:13px;color:#666;">fcesitler@gmail.com</p></div></body></html>`;

// Kullanıcıya gösterilecek kullanılabilir token listesi (UI Batch 2'de kullanılacak).
export const CONTRACT_TEMPLATE_TOKENS = [
  "company",
  "contact",
  "email",
  "scope",
  "amount",
  "currency",
  "billing",
  "term",
  "start_date",
] as const;

export type ContractTemplateToken = (typeof CONTRACT_TEMPLATE_TOKENS)[number];
