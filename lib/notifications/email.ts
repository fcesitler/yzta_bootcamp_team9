import { Resend } from "resend";

// Resend'i modül seviyesinde kurmuyoruz: anahtar yoksa constructor fırlatıyor ve
// Trigger.dev task dosyalarını import ederken deploy'u komple düşürüyor.
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const LABELS: Record<string, string> = {
  interested: "İlgileniyor",
  objection: "İtiraz",
  not_now: "Şimdi değil",
};

export async function sendReplyNotification({
  ownerEmail,
  company,
  classification,
  summary,
}: {
  ownerEmail: string;
  company: string;
  classification: string;
  summary: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const label = LABELS[classification] ?? classification;

  await getResend().emails.send({
    from: "Hallederiz <onboarding@resend.dev>",
    to: ownerEmail,
    subject: `${company} yanıt verdi — ${label}`,
    html: `
      <p><strong>${company}</strong> kampanyanıza yanıt verdi.</p>
      <p><strong>Durum:</strong> ${label}</p>
      <p><strong>Özet:</strong> ${summary}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://hallederiz.com"}/conversations">Konuşmayı görüntüle →</a></p>
    `,
  });
}
