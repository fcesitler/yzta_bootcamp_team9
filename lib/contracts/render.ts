import { CONTRACT_TEMPLATE_TOKENS, type ContractTemplateToken } from "./default-template";

// Merge değerlerini HTML-escape eder — kullanıcı verisi şablon layout'unu bozmasın
// veya markup enjekte etmesin (ör. scope içinde "<" karakteri).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type ContractData = Partial<
  Record<ContractTemplateToken, string | number | null | undefined>
>;

// Şablondaki {{token}} yerlerini gerçek değerlerle doldurur.
// Token çevresindeki boşluğa toleranslıdır ({{ scope }} da eşleşir).
// Değer boş/null ise "—" basılır (Make'teki mevcut davranışla tutarlı).
export function renderContractHtml(template: string, data: ContractData): string {
  let html = template;
  for (const token of CONTRACT_TEMPLATE_TOKENS) {
    const raw = data[token];
    const value =
      raw === null || raw === undefined || raw === "" ? "—" : escapeHtml(String(raw));
    html = html.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "g"), value);
  }
  return html;
}
