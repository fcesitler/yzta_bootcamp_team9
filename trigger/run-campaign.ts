import { task, logger } from "@trigger.dev/sdk/v3";
import Anthropic from "@anthropic-ai/sdk";
import { Firecrawl } from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";

// Lazy: modül seviyesinde kurulursa eksik anahtar deploy'un index adımını düşürür.
let _anthropic: Anthropic | null = null;
function getAnthropic() {
  return (_anthropic ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));
}

let _firecrawl: Firecrawl | null = null;
function getFirecrawl() {
  return (_firecrawl ??= new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! }));
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

// Tüm Claude çağrıları aynı modeli kullanır. Tek sabit: sürüm değişince yedi ayrı
// yeri bulmak ve birini atlayıp iki farklı modelle skorlama yapmak riski kalkıyor.
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

// Geçici hatalarda tekrar dener. Öncesinde Apollo veya Tavily'nin tek bir geçici
// 5xx/timeout'u tüm kampanyayı sıfır lead'le döndürebiliyordu.
// Yalnız geçici sayılan durumlar tekrarlanır: ağ hatası, 5xx, 429 (rate limit).
// 4xx tekrarlanmaz — yanlış parametre veya geçersiz anahtar tekrar denemekle düzelmez.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status < 500 && res.status !== 429) return res;
      // Son deneme de geçici hata verdiyse yanıtı olduğu gibi döndür —
      // çağıranlar zaten !res.ok durumunu kendileri ele alıyor.
      if (i === attempts - 1) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
      if (i === attempts - 1) throw e;
    }
    const waitMs = 1000 * 2 ** i;
    logger.warn("İstek başarısız, tekrar denenecek", {
      url: url.split("?")[0],
      deneme: i + 1,
      bekleme_ms: waitMs,
      hata: String(lastError),
    });
    await new Promise((r) => setTimeout(r, waitMs));
  }
  throw lastError;
}

type Campaign = {
  id: string;
  owner_id: string;
  name: string;
  icp: Record<string, string> | string | null;
  signals: string[] | string | null;
};

// ICP'yi Claude'un göreceği metne çevirir. Eskiden ham "role: X, size: Y" virgül
// dökümüydü — LLM için düz metin cümlesi gibi okunuyor, alan sınırları belirsizdi.
// Şimdi sabit sırayla, etiketli, satır satır: bu format extraction/pre-scoring/
// fit-scoring dahil icpStr kullanan HER Claude çağrısına otomatik yansır (tek yerden
// düzeltiliyor). Bilinmeyen/ekstra alan varsa (gelecekte ICP şeması genişlerse) sona
// ham haliyle eklenir, kaybolmaz.
const ICP_FIELD_LABELS: Array<[key: string, label: string]> = [
  ["role", "Rol"],
  ["sector", "Sektör"],
  ["size", "Büyüklük"],
  ["geography", "Coğrafya"],
];

function icpToText(icp: Campaign["icp"]): string {
  if (!icp) return "Rol: dijital ajans CEO'su\nCoğrafya: Türkiye";
  if (typeof icp === "string") return icp;
  const knownKeys = new Set(ICP_FIELD_LABELS.map(([k]) => k));
  const known = ICP_FIELD_LABELS.filter(([k]) => icp[k]).map(([k, label]) => `${label}: ${icp[k]}`);
  const extra = Object.entries(icp)
    .filter(([k, v]) => v && !knownKeys.has(k))
    .map(([k, v]) => `${k}: ${v}`);
  return [...known, ...extra].join("\n");
}

function signalsToText(signals: Campaign["signals"]): string | null {
  if (!signals) return null;
  if (typeof signals === "string") return signals;
  return signals.join(", ");
}

type Contact = {
  name: string;
  first_name: string;
  last_name: string;
  title: string | null;
  email: string | null;
  linkedin_url: string | null;
  // Apollo'nun kişi id'si. Arama sonucunda (0 kredi) zaten geliyor; lead'e kaydedilir
  // ki sonraki kampanyalarda ENRICHMENT ÖNCESİ dedupe yapılabilsin (kredi tasarrufu).
  // Apify yolunda doldurulmaz.
  apollo_id?: string | null;
  organization: {
    name: string;
    website_url: string | null;
    industry: string | null;
    estimated_num_employees: number | null;
    city: string | null;
    country: string | null;
    // Apollo'nun firma etiketleri. Enrichment yanıtında ZATEN geliyor (ek maliyet yok)
    // ama daha önce hiç kullanılmıyordu. Sektör alanı çoğu şirkette aynı çıkıyor
    // (46 firmalık örneklemde 37'si "information technology & services"), etiketler ise
    // ayırt edici. Skorlama prompt'una eklendiğinde (2026-08-02, 45 firmalık etiketli
    // örneklem) eşiği geçen ajans sayısı 13/13 → 6/13'e indi, gerçek SaaS'larda kayıp
    // OLMADI (28/32 sabit kaldı).
    keywords: string[];
  } | null;
};

type SenderProfile = {
  full_name: string | null;
  company: string | null;
  sector: string | null;
};

type ResearchResult = {
  industry: string;
  size: string;
  location: string;
  whyNow: string;
  websiteSummary: string;
  newsSummary: string;
};

async function log(
  db: ReturnType<typeof getDb>,
  campaignId: string,
  leadId: string | null,
  ownerId: string,
  step: string,
  status: string,
  summary: string
) {
  try {
    await db.from("agent_activity").insert({
      campaign_id: campaignId,
      lead_id: leadId,
      owner_id: ownerId,
      step,
      status,
      summary,
    });
  } catch (e) {
    logger.warn("logActivity failed", { error: e });
  }
}

// ============================================================
// APOLLO (birincil lead kaynağı)
// ============================================================
// Kredi modeli: search = 0 kredi (email maskeli döner),
// bulk_match = lead başına 1 kredi (yalnız email; telefon 8 kredi → KAPALI TUTULMALI).
// Bu yüzden akış: ara (bedava) → ön-skorla → yalnız en iyileri enrich et.

const APOLLO_BASE = "https://api.apollo.io/api/v1";
// mixed_people/search API çağrıları için DEPRECATED (422 döner) — api_search kullanılmalı.
// 2026-07-17 canlı testte doğrulandı.
const APOLLO_SEARCH_PATH = process.env.APOLLO_SEARCH_PATH || "mixed_people/api_search";

// Aday havuzu = hedef lead sayısının bu katı (search bedava olduğu için geniş tutuyoruz)
const CANDIDATE_MULTIPLIER = 4;
// Aynı anda kaç lead işlensin (Research+Score+Write) — timeout'u önler
const PIPELINE_CONCURRENCY = 10;
// Apollo bulk_match tek istekte en fazla 10 kayıt kabul eder
const APOLLO_MATCH_CHUNK = 10;
// Apollo search sayfa başına en fazla 100 kayıt döndürür.
const APOLLO_PER_PAGE = 100;
// Sayfa derinliği tavanı: 5 sayfa = 500 aday. Arama 0 kredi olduğu için sayfalamanın
// maliyeti yok, ama Apollo'nun sayfa derinliği limitine dayanmamak ve tek kampanyanın
// dakikalarca sayfa çevirmesini önlemek için üst sınır konuyor.
const APOLLO_MAX_PAGES = 5;

type ApolloParams = {
  person_titles: string[];
  person_seniorities: string[];
  person_locations: string[];
  organization_locations: string[];
  q_organization_keyword_tags: string[];
  organization_num_employees_ranges: string[];
  // Satın-alma sinyali filtreleri (opsiyonel) — arama bedava olduğu için
  // bunları uygulamak kredi maliyeti YOK, sadece havuz kalitesini yükseltir.
  person_not_titles?: string[];
  organization_num_jobs_range?: { min: number; max: number };
  organization_latest_funding_stage_cd?: string[];
  q_organization_job_titles?: string[];
  currently_using_any_of_technology_uids?: string[];
  organization_headcount_growth_6m_ranges?: string[];
  person_has_changed_jobs_in_last_n_months?: number;
  person_in_current_title_for_months_max?: number;
  contact_phone_types?: string[];
};

// Türkçe metni ASCII küçük harfe indirger — kalıp eşleştirme için.
// İki tuzak var:
//   1) "İ".toLowerCase() araya birleşik nokta (U+0307) koyar → "işe" kalıbı tutmaz
//   2) "ı" (noktasız i, U+0131) ayrı bir harftir, NFD onu ÇÖZMEZ → "yatırım" ≠ "yatirim"
// Bu ikisi elle çevrilir; ş/ğ/ü/ö/ç zaten NFD ile ayrışıp aksanı atılır.
function toAsciiLower(input: string): string {
  return input
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// ── Önceden belirlenmiş (kürate) Apollo filtreleri ─────────────────────────
// Her sinyal çipi, KANITLANMIŞ Apollo arama parametrelerine BİREBİR eşlenir.
// Eski yaklaşımın (serbest metni regex'le tahmin) yerini alır: UI'daki 8 çipin
// çoğu regex'e takılmıyor, sessizce no-op oluyordu (ör. "Ajans sözleşmesi bitiyor",
// "Liderlik değişikliği" hiçbir filtreye dönüşmüyordu). Arama 0 kredi olduğu için
// bu filtreler bedava hassasiyet — yalnız havuz kalitesini yükseltir, maliyet yok.
// 2026-07-17 canlı testte parametrelerin gerçekten uygulandığı doğrulandı
// (uydurma parametreler Apollo tarafında sessizce yok sayılır).
const SIGNAL_APOLLO_PRESETS: Record<string, Partial<ApolloParams>> = {
  "Yatırım turu açıklandı": {
    organization_latest_funding_stage_cd: ["seed", "series_a", "series_b"],
  },
  "İşe alım artışı (growth rolleri)": {
    organization_num_jobs_range: { min: 1, max: 100 },
    organization_headcount_growth_6m_ranges: ["2,5", "5,10", "10,25", "25,100"],
    q_organization_job_titles: [
      "sales development representative",
      "account executive",
      "marketing manager",
    ],
  },
  "Ürün lansmanı yaklaşıyor": {
    organization_num_jobs_range: { min: 1, max: 100 },
    q_organization_job_titles: ["product manager", "product marketing manager"],
  },
  "Pazar genişlemesi": {
    organization_headcount_growth_6m_ranges: ["5,10", "10,25", "25,100"],
  },
  "Liderlik değişikliği": {
    person_has_changed_jobs_in_last_n_months: 3,
    person_in_current_title_for_months_max: 12,
  },
  "Ajans sözleşmesi bitiyor": {
    // Doğrudan Apollo karşılığı yok; pazarlama ekibi kuran firmalar en yakın proxy.
    q_organization_job_titles: ["marketing manager", "head of marketing"],
  },
  // Aşağıdaki iki sinyalin Apollo ARAMASINDA karşılığı yok — haber/araştırma
  // aşamasında (Tavily + scoreContact) değerlendirilir, arama filtresi değildirler.
  "Basında görünürlük artışı": {},
  "Yeniden markalaşma / birleşme": {},
};

// Bilinmeyen/eski serbest-metin sinyaller için geriye dönük regex eşlemesi.
// (Önceden belirlenmiş çip etiketleriyle eşleşmeyen kayıtlar buraya düşer.)
function legacyRegexFilters(signal: string): Partial<ApolloParams> {
  const f: Partial<ApolloParams> = {};
  const s = toAsciiLower(signal);
  if (/ise alim|hiring|buyume|growth|ekip/.test(s)) {
    f.organization_num_jobs_range = { min: 1, max: 100 };
  }
  if (/satis|sales|pazarlama|marketing|sdr/.test(s)) {
    f.q_organization_job_titles = [
      "sales development representative",
      "account executive",
      "marketing manager",
    ];
  }
  if (/buyume|growth|hizla|scale|scaling|ekip/.test(s)) {
    f.organization_headcount_growth_6m_ranges = ["2,5", "5,10", "10,25", "25,100"];
  }
  if (/is degistir|job change|yeni rol|new role|yeni goreve/.test(s)) {
    f.person_has_changed_jobs_in_last_n_months = 3;
  }
  if (/yeni basla|recently started|yeni atanan|just joined|ilk yil/.test(s)) {
    f.person_in_current_title_for_months_max = 12;
  }
  if (/finansman|yatirim|funding|fon|invest/.test(s)) {
    f.organization_latest_funding_stage_cd = ["seed", "series_a", "series_b"];
  }
  if (/telefon|phone|mobil|mobile/.test(s)) {
    f.contact_phone_types = ["mobile"];
  }
  return f;
}

// Birden çok sinyalin filtrelerini birleştir + her aramada geçerli taban filtre.
// Diziler birleştirilip tekilleştirilir; sayısal aralıklar en geniş/gevşek alınır
// (aşırı daralmayı önlemek için — funding testinde havuz -%98 daralmıştı).
function mergeApolloFilters(parts: Partial<ApolloParams>[]): Partial<ApolloParams> {
  const out: Partial<ApolloParams> = {
    // Taban hassasiyet: karar verici olmayanları (stajyer/asistan) her zaman ele.
    person_not_titles: ["intern", "assistant", "student", "trainee"],
  };
  const jobTitles = new Set<string>();
  const headcount = new Set<string>();
  const fundingStages = new Set<string>();

  for (const p of parts) {
    p.q_organization_job_titles?.forEach((t) => jobTitles.add(t));
    p.organization_headcount_growth_6m_ranges?.forEach((r) => headcount.add(r));
    p.organization_latest_funding_stage_cd?.forEach((r) => fundingStages.add(r));
    if (p.organization_num_jobs_range) {
      out.organization_num_jobs_range = out.organization_num_jobs_range
        ? {
            min: Math.min(out.organization_num_jobs_range.min, p.organization_num_jobs_range.min),
            max: Math.max(out.organization_num_jobs_range.max, p.organization_num_jobs_range.max),
          }
        : p.organization_num_jobs_range;
    }
    if (p.person_has_changed_jobs_in_last_n_months != null) {
      out.person_has_changed_jobs_in_last_n_months = Math.max(
        out.person_has_changed_jobs_in_last_n_months ?? 0,
        p.person_has_changed_jobs_in_last_n_months
      );
    }
    if (p.person_in_current_title_for_months_max != null) {
      out.person_in_current_title_for_months_max = Math.max(
        out.person_in_current_title_for_months_max ?? 0,
        p.person_in_current_title_for_months_max
      );
    }
    if (p.contact_phone_types?.length) out.contact_phone_types = p.contact_phone_types;
  }

  if (jobTitles.size) out.q_organization_job_titles = Array.from(jobTitles);
  if (headcount.size) out.organization_headcount_growth_6m_ranges = Array.from(headcount);
  if (fundingStages.size) out.organization_latest_funding_stage_cd = Array.from(fundingStages);
  return out;
}

// Kampanyanın "signals" alanını (çip etiketleri) önceden belirlenmiş Apollo
// filtrelerine çevirir. Bilinen çipler kürate preset'e, bilinmeyenler regex'e düşer.
function signalsToApolloFilters(signals: Campaign["signals"]): Partial<ApolloParams> {
  const labels: string[] = Array.isArray(signals)
    ? signals
    : typeof signals === "string" && signals
      ? signals.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const parts = labels.map((label) => {
    const preset = SIGNAL_APOLLO_PRESETS[label];
    return preset ?? legacyRegexFilters(label);
  });
  return mergeApolloFilters(parts);
}

// Apollo search sonucu — KASITLI OLARAK ÇOK SINIRLI.
// api_search yalnızca şunları döndürür: id, first_name, title, organization.name
// ve has_* boolean bayrakları. Soyad maskeli (last_name_obfuscated), linkedin_url yok,
// firma sektörü/çalışan sayısı/ülkesi yok — hepsi ancak enrichment'ta geliyor.
type ApolloCandidate = {
  apollo_id: string;
  first_name: string;
  title: string | null;
  organization_name: string;
  has_email: boolean;
};

type ApifyParams = {
  personTitle: string[];
  seniority: string[];
  personCountry: string[];
  companyCountry: string[];
  industry: string[];
  industryKeywords: string[];
  companyEmployeeSize: string[];
};

const defaultApifyParams: ApifyParams = {
  personTitle: ["CEO", "Founder"],
  seniority: ["Founder", "CEO", "CXO"],
  personCountry: ["Turkey"],
  companyCountry: ["Turkey"],
  industry: [],
  industryKeywords: [],
  companyEmployeeSize: ["11 - 50", "51 - 200"],
};

// ICP.sector'ün "BİZİM SATTIĞIMIZ ürünün sektörü" anlamına geldiği sektörler.
// Yalnız bu durumda hedef şirketin sektörü ICP.sector'den FARKLI (alıcı tarafı) olmalıdır.
// Diğer TÜM sektörlerde (fintech, SaaS, sağlık, tüketici, ajans, eğitim) ICP.sector
// doğrudan HEDEF şirketin sektörüdür — orada alıcı-tarafı çevirisi yapmak yanlış olur.
// (Yaşanmış hata: "fintech & e-ticaret" kampanyasında skorlama prompt'una "hedef şirketin
// sektörü fintech OLMAMALI, aranan sektörler: Financial Services..." gibi kendi içinde
// çelişkili bir talimat gitti; Getaround gibi gerçek eşleşmeler 28/100 aldı.)
function isBuyerSideSector(sector: string | null | undefined): boolean {
  if (!sector) return false;
  const s = sector.toLowerCase();
  return (
    s.includes("kereste") ||
    s.includes("wood") ||
    s.includes("timber") ||
    s.includes("orman urunleri") ||
    s.includes("orman ürünleri") ||
    s.includes("lumber")
  );
}

// ICP sector → bilinen kategori eşlemesi. "matched: true" demek, sector metni tanınan
// bir kalıba uydu ve keywords listesi bilinçli seçildi (ör. alıcı-sektör eşlemesi) —
// bu durumda çağıran, Claude'un icpStr'den bağımsız çıkardığı ham keyword'leri EKLEMEMELİ,
// aksi halde (ör. kereste ICP'sinde) "wood"/"timber" gibi rakip-sektör kelimeleri geri sızar.
// "matched: false" demek, hiçbir kalıp tutmadı ve girdi ham metin olarak kullanıldı.
function resolveSectorMapping(sector: string | null | undefined): { keywords: string[]; matched: boolean } {
  if (!sector) return { keywords: [], matched: false };
  const s = sector.toLowerCase();
  if (s.includes("fintech") || s.includes("e-ticaret") || s.includes("finans"))
    return { keywords: ["Financial Services", "Technology, Information and Internet", "Internet Marketplace Platforms", "Software Development"], matched: true };
  if (s.includes("sağlık") || s.includes("health"))
    return { keywords: ["Hospitals and Health Care", "Technology, Information and Internet", "Medical and Diagnostic Laboratories"], matched: true };
  if (s.includes("saas") || s.includes("yazılım") || s.includes("software"))
    // 2026-08-02 ölçümü: "IT Services and IT Consulting" etiketi havuza yazılım
    // AJANSLARINI (müşteriye geliştirme hizmeti satan firmalar) çekiyordu — 20 kişilik
    // rastgele örneklemde gerçek SaaS oranı %60'a düşmüştü. Bu etiket çıkarılıp "saas"
    // eklendiğinde aynı ölçüm %85'e çıktı. Ajanslar skorlamada da ayırt edilemiyordu
    // (88 puan alıp 75 eşiğini geçiyorlardı), o yüzden çözüm arama tarafında.
    return { keywords: ["saas", "Software Development", "Technology, Information and Internet"], matched: true };
  if (s.includes("tüketici") || s.includes("marka") || s.includes("retail") || s.includes("consumer"))
    return { keywords: ["Consumer Services", "Retail", "Advertising Services", "Marketing Services"], matched: true };
  if (s.includes("ajans") || s.includes("agency") || s.includes("reklam"))
    return { keywords: ["Advertising Services", "Marketing Services", "Business Consulting and Services"], matched: true };
  if (s.includes("eğitim") || s.includes("education"))
    return { keywords: ["Education", "E-Learning Providers", "Higher Education"], matched: true };
  // NOT: ICP.sector kullanıcı tarafından genelde "kendi ürettiğim/sattığım şey" olarak
  // dolduruluyor (ör. bir kereste ihracatçısı "Wood, Timber" yazıyor). Bunu ham keyword
  // olarak Apollo'ya göndermek, o sektördeki RAKİPLERİ bulur (Apollo kendi organizasyon
  // etiketiyle eşleştirir). Kereste/odun gibi hammadde/ürün sektörleri için, aramanın
  // asıl hedefi bu ürünü SATIN ALAN sektörler olmalı — mobilya, inşaat, yapı malzemeleri
  // toptan satış/ithalat gibi. (Yaşanmış örnek: "Wood, Timber" ICP'siyle çalışan bir
  // kampanya, Apollo'dan ABD'li kereste ÜRETİCİLERİ döndürmüştü.)
  // 2026-07-31: "Import and Export" ve genel "Wholesale" canlı testte çok geniş
  // çıktı — ürün fark etmeksizin HER ihracatçı/toptancıyı çekti (meyve, metal,
  // kimya firmaları sızdı). Hasan Kulu'nun kendi sitesinde teyit ettiği alıcı
  // segmentlerine (bayi/distribütör, inşaat/yapı malzemeleri, iç tasarım ve
  // dekorasyon) daraltıldı; genel/geniş etiketler kaldırıldı.
  if (isBuyerSideSector(sector))
    return {
      keywords: [
        "Furniture and Home Furnishings Manufacturing",
        "Construction",
        "Wholesale Building Materials",
        "Interior Design",
      ],
      matched: true,
    };
  // Hiçbir bilinen pattern eşleşmezse girişi doğrudan keyword olarak kullan.
  // Virgülle ayrılmış çoklu değer (ör. "Emlak, Galeri") her biri ayrı keyword olur.
  return { keywords: sector.split(",").map((p) => p.trim()).filter(Boolean), matched: false };
}

function sectorToIndustries(sector: string | null | undefined): string[] {
  return resolveSectorMapping(sector).keywords;
}

// Tek bir coğrafya token'ından ülke listesi — virgülle bölünmüş değerlerin her parçası buraya girer.
function resolveCountryToken(token: string): string[] {
  const g = toAsciiLower(token.trim());
  if (!g) return [];
  if (g.includes("dach")) return ["Germany", "Austria", "Switzerland"];
  if (g.includes("ingiltere") || g.includes("uk") || g.includes("ireland") || g.includes("irlanda"))
    return ["United Kingdom", "Ireland"];
  if (g.includes("ab") || g.includes("europe") || g.includes("avrupa"))
    return ["Turkey", "Germany", "France", "Netherlands", "Spain", "Italy", "Sweden", "Poland", "Belgium", "Austria"];
  if (g.includes("global") || g.includes("dunya") || g.includes("worldwide"))
    return ["Turkey", "United States", "United Kingdom", "Germany", "France"];
  // NOT: "south america"/"latin america" gibi bileşik bölge adları "america" alt-string'ini
  // içerdiği için, ABD eşleşmesinden ÖNCE ve daha spesifik olarak kontrol edilmeli —
  // aksi halde "South America" yanlışlıkla "United States" olarak çözümlenir (yaşanmış bug).
  if (g.includes("guney amerika") || g.includes("south america") || g.includes("latin amerika") || g.includes("latin america"))
    return ["Brazil", "Argentina", "Chile", "Peru", "Colombia", "Ecuador", "Uruguay", "Paraguay", "Bolivia", "Mexico"];
  if (g.includes("afrika") || g.includes("africa"))
    return ["South Africa", "Nigeria", "Egypt", "Kenya", "Morocco", "Ghana", "Ethiopia", "Algeria", "Tanzania", "Ivory Coast"];
  // "amerika" (Türkçe yazım, k ile) "america" (İngilizce, c ile) kalıbına uymuyor —
  // ayrı kontrol edilmezse boş sonuç döner, caller sessizce Turkey varsayılanına düşer
  // (yaşanmış bug: "Amerika" yazan kullanıcı hep Türk kurucu almıştı).
  if (g.includes("us") || g.includes("abd") || g.includes("united states") || g.includes("america") || g.includes("amerika"))
    return ["United States"];
  if (g.includes("dubai") || g.includes("bae") || g.includes("uae") || g.includes("birlesik arap"))
    return ["United Arab Emirates"];
  if (g.includes("almanya") || g.includes("germany")) return ["Germany"];
  if (g.includes("fransa") || g.includes("france")) return ["France"];
  if (g.includes("hollanda") || g.includes("netherlands")) return ["Netherlands"];
  if (g.includes("polonya") || g.includes("poland")) return ["Poland"];
  if (g.includes("ispanya") || g.includes("spain")) return ["Spain"];
  if (g.includes("italya") || g.includes("italy")) return ["Italy"];
  if (g.includes("turkiye") || g.includes("turkey") || g.includes("istanbul") || g.includes("ankara") || g.includes("izmir"))
    return ["Turkey"];
  // Tanınmayan token → boş bırak (caller gerekirse default ekler)
  return [];
}

// ICP geography → Apify enum-geçerli ülke adları (Claude'a bırakılmaz — enum kısıtlı).
// Virgülle ayrılmış çoklu değer (ör. "Dubai, İngiltere") her biri ayrı işlenir,
// sonuçlar birleştirilip tekilleştirilir.
function geographyToCountries(geography: string | null | undefined): string[] {
  if (!geography) return ["Turkey"];
  // toAsciiLower kullanılmalı: "İ".toLowerCase() → "i̇" (U+0307 birleşik nokta),
  // bu yüzden plain .toLowerCase() ile "ingiltere" alt-string'i hiç eşleşmez.
  const parts = geography.split(",");
  const results: string[] = [];
  for (const part of parts) {
    const countries = resolveCountryToken(part);
    for (const c of countries) {
      if (!results.includes(c)) results.push(c);
    }
  }
  return results.length > 0 ? results : ["Turkey"];
}

type ClaudeApifyParams = Pick<ApifyParams, "personTitle" | "seniority" | "industryKeywords" | "companyEmployeeSize">;

// Claude ile ICP metninden Apify arama parametrelerini çıkar
// NOT: enum-kısıtlı alanlar (industry, personCountry, companyCountry) Claude'a bırakılmaz
async function extractApifyParams(icp: string, signals: string | null): Promise<ClaudeApifyParams> {
  const fallback: ClaudeApifyParams = {
    personTitle: defaultApifyParams.personTitle,
    seniority: defaultApifyParams.seniority,
    industryKeywords: defaultApifyParams.industryKeywords,
    companyEmployeeSize: defaultApifyParams.companyEmployeeSize,
  };

  const msg = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `ICP açıklamasından Apify B2B lead araması için parametreler çıkar.

ICP: ${icp}
Sinyaller: ${signals || "büyüme, işe alım, yeni ürün"}

Kurallar:
- companyEmployeeSize için YALNIZCA şu değerleri kullan (harf harf aynı): "0 - 1", "2 - 10", "11 - 50", "51 - 200", "201 - 500", "501 - 1000", "1001 - 5000", "5001 - 10000", "10000+"
- seniority için YALNIZCA şu değerleri kullan: "Founder", "Chairman", "President", "CEO", "CXO", "Vice President", "Director", "Head", "Manager", "Senior"
- personTitle: unvan adları (İngilizce veya Türkçe)
- industryKeywords: serbest metin anahtar kelimeler (enum değil)

Sadece JSON döndür:
{
  "personTitle": ["CEO", "Founder"],
  "seniority": ["Founder", "CEO", "CXO"],
  "industryKeywords": ["saas", "b2b", "dijital ajans"],
  "companyEmployeeSize": ["11 - 50", "51 - 200"]
}`,
      },
    ],
  });

  try {
    const text = (msg.content[0] as { type: string; text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : fallback;
  } catch {
    return fallback;
  }
}

function parseEmployeeCount(size: string | null | undefined): number | null {
  if (!size) return null;
  const match = size.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// Maskeli/geçersiz e-postayı ayıkla.
// Apollo search "email_not_unlocked@domain.com" placeholder'ı döndürür — bu e-posta DEĞİLDİR.
function realEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return null;
  if (e.includes("email_not_unlocked")) return null;
  if (e.startsWith("noreply@") || e.startsWith("no-reply@")) return null;
  return email.trim();
}

// Sınırlı eşzamanlılıkla map — sıralı döngü 300s timeout'a takılıyordu
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ICP geography → Apollo lokasyon adları (serbest metin kabul eder)
function geographyToApolloLocations(geography: string | null | undefined): string[] {
  return geographyToCountries(geography);
}

type ClaudeApolloParams = {
  person_titles: string[];
  person_seniorities: string[];
  q_organization_keyword_tags: string[];
  organization_num_employees_ranges: string[];
  // ICP'nin "sektör" alanı BİZİM SATTIĞIMIZ ürünü mü tarif ediyor (kereste ihracatçısı
  // "Wood, Timber" yazar) yoksa doğrudan HEDEF şirketlerin sektörünü mü ("SaaS")?
  // İlkinde hedef, o ürünü SATIN ALAN sektörlerdir. Eskiden bu karar isBuyerSideSector()
  // içinde kereste/wood/timber olarak HARDCODE'du — yalnız tek bir müşteri için çalışıyordu.
  sectorIsOwnProduct: boolean;
};

// Claude ile ICP metninden Apollo arama parametreleri çıkar.
// NOT: seniority Apollo'da enum-kısıtlı; geçerli değerler prompt'ta sabitlenir.
async function extractApolloParams(
  icp: string,
  signals: string | null
): Promise<ClaudeApolloParams> {
  const fallback: ClaudeApolloParams = {
    person_titles: ["CEO", "Founder", "Head of Growth", "Marketing Director"],
    person_seniorities: ["owner", "founder", "c_suite", "vp", "head", "director"],
    q_organization_keyword_tags: [],
    organization_num_employees_ranges: ["11,20", "21,50", "51,100", "101,200"],
    sectorIsOwnProduct: false,
  };

  // Sinyal seçilmediğinde prompt'a sinyal listesi ENJEKTE EDİLMEZ. Eskiden boş değer
  // "büyüme, işe alım, yeni ürün" yedeğine düşüyordu ve bu, kullanıcının seçmediği
  // sinyalleri arama anahtar kelimesine çeviriyordu (3/3 test çalıştırmasında "growth",
  // "hiring", "product launch" gibi çöp keyword'ler üretildi — havuzu bulandırıyor).
  const signalLine = signals?.trim() ? `\nSinyaller: ${signals}` : "";

  try {
    const msg = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `ICP açıklamasından Apollo.io People Search parametreleri çıkar.
Apollo veritabanı İNGİLİZCEDİR — çıktıdaki TÜM değerler İngilizce olmalı.

ICP: ${icp}${signalLine}

ÖNEMLİ — "Sektör" alanının yorumu iki türlü olabilir:
(a) HEDEF şirketlerin sektörü. Yazılım/hizmet/dikey adı gibi görünüyorsa budur.
    Örnek: "SaaS", "İnşaat", "sağlık teknolojisi", "e-ticaret", "dijital ajans".
(b) BİZİM SATTIĞIMIZ ürünün sektörü. Hammadde, ürün, malzeme veya bileşen adı gibi
    görünüyorsa budur — bu durumda hedef, o ürünü SATIN ALAN sektörlerdir.
    Örnek: "Kereste" satan biri mobilya üreticisi, inşaat firması ve yapı malzemeleri
    toptancısı arar; "ambalaj" satan biri gıda/kozmetik üreticisi arar.

Kurallar:
- sector_is_own_product: (b) ise true, (a) ise false.
- organization_keywords: HEDEF şirketleri tanımlayan 3-6 İNGİLİZCE anahtar kelime.
  * Türkçe girdiyi mutlaka ÇEVİR ("İnşaat" → "construction", "sağlık" → "healthcare").
    Çıktıda Türkçe kelime BULUNMASIN — Apollo Türkçe etiketle neredeyse hiç eşleşmiyor.
  * (b) durumunda buraya ALICI sektörlerini yaz, ürünün kendi sektörünü YAZMA
    (aksi halde arama rakipleri getirir).
  * Hedef kendi ürününü satan şirketlerse, hizmet/ajans çağrıştıran kelimeler
    ("IT services", "consulting", "agency", "outsourcing", "software development
    services") EKLEME — bunlar müşteriye hizmet satan ajansları havuza çeker.
- person_seniorities için YALNIZCA şu değerler (harf harf aynı): "owner", "founder", "c_suite", "partner", "vp", "head", "director", "manager", "senior", "entry", "intern"
- organization_num_employees_ranges için YALNIZCA şu format: "1,10", "11,20", "21,50", "51,100", "101,200", "201,500", "501,1000", "1001,2000", "2001,5000", "5001,10000", "10001"
- person_titles: İngilizce unvan adları

Sadece JSON döndür:
{
  "sector_is_own_product": false,
  "organization_keywords": ["saas", "b2b software"],
  "person_titles": ["CEO", "Founder"],
  "person_seniorities": ["owner", "founder", "c_suite"],
  "organization_num_employees_ranges": ["11,20", "21,50"]
}`,
        },
      ],
    });

    const text = (msg.content[0] as { type: string; text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]) as {
      sector_is_own_product?: boolean;
      organization_keywords?: string[];
      person_titles?: string[];
      person_seniorities?: string[];
      organization_num_employees_ranges?: string[];
    };
    return {
      person_titles: parsed.person_titles?.length ? parsed.person_titles : fallback.person_titles,
      person_seniorities: parsed.person_seniorities?.length
        ? parsed.person_seniorities
        : fallback.person_seniorities,
      q_organization_keyword_tags: parsed.organization_keywords ?? [],
      organization_num_employees_ranges: parsed.organization_num_employees_ranges?.length
        ? parsed.organization_num_employees_ranges
        : fallback.organization_num_employees_ranges,
      sectorIsOwnProduct: parsed.sector_is_own_product === true,
    };
  } catch (e) {
    logger.warn("Apollo parametre çıkarımı başarısız, varsayılan kullanılıyor", { error: e });
    return fallback;
  }
}

// ADIM 1 — Apollo People Search. 0 KREDİ harcar; e-postalar maskeli döner.
async function searchApolloPeople(
  params: ApolloParams,
  limit: number
): Promise<ApolloCandidate[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    logger.error("APOLLO_API_KEY tanımlı değil");
    return [];
  }

  const baseBody: Record<string, unknown> = {
    // Yalnız doğrulanmış e-postası olan kişileri getir → enrich isabet oranı yükselir
    contact_email_status: ["verified"],
    ...(params.person_titles.length && { person_titles: params.person_titles }),
    ...(params.person_seniorities.length && { person_seniorities: params.person_seniorities }),
    ...(params.person_locations.length && { person_locations: params.person_locations }),
    ...(params.organization_locations.length && {
      organization_locations: params.organization_locations,
    }),
    ...(params.q_organization_keyword_tags.length && {
      q_organization_keyword_tags: params.q_organization_keyword_tags,
    }),
    ...(params.organization_num_employees_ranges.length && {
      organization_num_employees_ranges: params.organization_num_employees_ranges,
    }),
    // Sinyal filtreleri (varsa)
    ...(params.person_not_titles?.length && { person_not_titles: params.person_not_titles }),
    ...(params.organization_num_jobs_range && {
      organization_num_jobs_range: params.organization_num_jobs_range,
    }),
    ...(params.organization_latest_funding_stage_cd?.length && {
      organization_latest_funding_stage_cd: params.organization_latest_funding_stage_cd,
    }),
    ...(params.q_organization_job_titles?.length && {
      q_organization_job_titles: params.q_organization_job_titles,
    }),
    ...(params.currently_using_any_of_technology_uids?.length && {
      currently_using_any_of_technology_uids: params.currently_using_any_of_technology_uids,
    }),
    ...(params.organization_headcount_growth_6m_ranges?.length && {
      organization_headcount_growth_6m_ranges: params.organization_headcount_growth_6m_ranges,
    }),
    ...(params.person_has_changed_jobs_in_last_n_months != null && {
      person_has_changed_jobs_in_last_n_months: params.person_has_changed_jobs_in_last_n_months,
    }),
    ...(params.person_in_current_title_for_months_max != null && {
      person_in_current_title_for_months_max: params.person_in_current_title_for_months_max,
    }),
    ...(params.contact_phone_types?.length && {
      contact_phone_types: params.contact_phone_types,
    }),
  };

  logger.info("Apollo arama başlıyor (0 kredi)", { path: APOLLO_SEARCH_PATH, limit });

  // Arama 0 kredi olduğu için sayfalamak BEDAVA. Öncesinde yalnız page:1 isteniyordu
  // ve per_page 100'de tavanlandığı için, 25'ten fazla lead hedeflendiğinde aday
  // havuzu sessizce 100'de tıkanıyordu — CANDIDATE_MULTIPLIER (4x) ile amaçlanan
  // "geniş havuzdan en iyileri seç" avantajı kayboluyor, kredi daha kötü adaylara
  // harcanıyordu.
  const out: ApolloCandidate[] = [];
  let totalEntries: number | undefined;

  for (let page = 1; page <= APOLLO_MAX_PAGES && out.length < limit; page++) {
    // Kalan ihtiyaç kadar iste: küçük havuzlarda 100'lük sayfa çekmek gereksiz veri
    // (ve yanıltıcı log) üretiyordu.
    const want = Math.min(APOLLO_PER_PAGE, limit - out.length);

    const res = await fetchWithRetry(`${APOLLO_BASE}/${APOLLO_SEARCH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ ...baseBody, page, per_page: want }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error("Apollo arama başarısız", {
        status: res.status,
        page,
        body: errText.slice(0, 500),
      });
      // İlk sayfa patladıysa elde bir şey yok; sonraki sayfalarda toplananı koru.
      break;
    }

    const data = (await res.json()) as {
      people?: Array<Record<string, unknown>>;
      total_entries?: number;
    };
    const people = data.people ?? [];
    totalEntries ??= data.total_entries;

    for (const p of people) {
      const id = (p.id as string) || "";
      if (!id) continue;
      // Apollo e-postası olmayanı baştan söylüyor — bunlara kredi harcamayalım
      if (p.has_email === false) continue;
      const org = p.organization as Record<string, unknown> | undefined;
      out.push({
        apollo_id: id,
        first_name: (p.first_name as string) || "",
        title: (p.title as string) || null,
        organization_name: (org?.name as string) || "Bilinmeyen",
        has_email: true,
      });
    }

    // İstenenden az geldiyse sonuç bitmiştir, sonraki sayfayı istemeye gerek yok.
    if (people.length < want) break;
  }

  logger.info(
    `Apollo ${out.length} aday döndürdü (toplam eşleşme: ${totalEntries ?? "?"}, kredi harcanmadı)`
  );

  return out.slice(0, limit);
}

// ADIM 2 — Ön skorlama. Yalnız search metadata'sıyla, TEK Claude çağrısında.
// Amaç: krediyi yalnız en iyi adaylara harcamak.
async function preScoreCandidates(
  candidates: ApolloCandidate[],
  icp: string
): Promise<number[]> {
  if (candidates.length === 0) return [];

  // NOT: search yalnızca unvan + firma adı veriyor (sektör/büyüklük/ülke enrichment'ta gelir).
  // Lokasyon, çalışan aralığı ve sektör filtreleri zaten Apollo tarafında uygulandı;
  // buradaki skorlama unvan hassasiyeti ve firma tanınırlığı için bir SIRALAMA katmanı.
  const list = candidates
    .map((c, i) => `${i}. ${c.title || "?"} @ ${c.organization_name}`)
    .join("\n");

  try {
    const msg = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Her adayı ICP'ye uyumuna göre 0-100 arası skorla.
Elimizde yalnızca unvan ve firma adı var; unvanın ICP'ye ne kadar tam oturduğuna
ve firma hakkında bildiklerine göre sırala.

ICP: ${icp}

Adaylar:
${list}

Sadece JSON dizisi döndür — her eleman {"i": index, "s": skor}:
[{"i":0,"s":85},{"i":1,"s":42}]`,
        },
      ],
    });

    const text = (msg.content[0] as { type: string; text: string }).text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return candidates.map(() => 50);

    const parsed = JSON.parse(jsonMatch[0]) as Array<{ i: number; s: number }>;
    const scores = candidates.map(() => 50);
    for (const { i, s } of parsed) {
      if (i >= 0 && i < scores.length && typeof s === "number") {
        scores[i] = Math.min(100, Math.max(0, s));
      }
    }
    return scores;
  } catch (e) {
    logger.warn("Ön skorlama başarısız, tümü 50 kabul edildi", { error: e });
    return candidates.map(() => 50);
  }
}

// ADIM 3 — Enrichment. Lead başına 1 KREDİ (yalnız e-posta).
// reveal_phone_number KESİNLİKLE false kalmalı — açılırsa kredi 8 katına çıkar.
async function enrichApolloPeople(
  candidates: ApolloCandidate[]
): Promise<Contact[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return [];

  const enriched: Contact[] = [];

  for (let i = 0; i < candidates.length; i += APOLLO_MATCH_CHUNK) {
    const chunk = candidates.slice(i, i + APOLLO_MATCH_CHUNK);

    try {
      // KASITLI OLARAK retry YOK: bulk_match lead başına 1 kredi harcıyor.
      // İstek Apollo tarafında işlendikten sonra yanıt düşerse (timeout), tekrar
      // denemek aynı kişiler için ikinci kez kredi yakabilir. Buradaki hata zaten
      // yalnız 10'luk bir grubu kaybettiriyor ve döngü devam ediyor — arama
      // (0 kredi) tarafındaki retry kampanyanın tamamen boş dönmesini önlüyor.
      const res = await fetch(`${APOLLO_BASE}/people/bulk_match`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({
          reveal_personal_emails: false,
          reveal_phone_number: false, // 8 kredi/kişi — asla açma
          // Yalnız id gönderiyoruz: canlı testte id ile eşleşme birebir çalışıyor.
          // Search'ten gelen soyad maskeli (St***d) — gönderilirse eşleşmeyi bozar.
          details: chunk.map((c) => ({ id: c.apollo_id })),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error("Apollo enrichment başarısız", {
          status: res.status,
          body: errText.slice(0, 500),
        });
        continue;
      }

      const data = (await res.json()) as { matches?: Array<Record<string, unknown> | null> };
      const matches = data.matches ?? [];

      matches.forEach((m, idx) => {
        const base = chunk[idx];
        if (!m || !base) return;

        const email = realEmail(m.email as string | undefined);
        // E-posta yoksa veya doğrulanmamışsa lead açma:
        // gönderilemeyen/bounce eden lead deliverability'yi bozar.
        if (!email) return;
        const status = (m.email_status as string) || "";
        if (status && status !== "verified") {
          logger.info("Doğrulanmamış e-posta atlandı", { status, company: base.organization_name });
          return;
        }

        const org = (m.organization ?? {}) as Record<string, unknown>;
        const domain = org.primary_domain as string | undefined;

        enriched.push({
          // Enrich güncel işvereni ve tam adı döndürür —
          // kişi firma değiştirdiyse burada yakalanır.
          name: (m.name as string) || `${m.first_name || base.first_name} ${m.last_name || ""}`.trim(),
          first_name: (m.first_name as string) || base.first_name,
          last_name: (m.last_name as string) || "",
          title: (m.title as string) || base.title,
          email,
          linkedin_url: (m.linkedin_url as string) || null,
          apollo_id: base.apollo_id,
          organization: {
            name: (org.name as string) || base.organization_name,
            website_url:
              (org.website_url as string) || (domain ? `https://${domain}` : null),
            industry: (org.industry as string) || null,
            estimated_num_employees: (org.estimated_num_employees as number) ?? null,
            city: (org.city as string) || null,
            country: (org.country as string) || null,
            // Uzun listeler prompt'u şişiriyor; ilk 12 etiket ayrım için fazlasıyla yeterli.
            keywords: Array.isArray(org.keywords)
              ? (org.keywords as string[]).slice(0, 12)
              : [],
          },
        });
      });
    } catch (e) {
      logger.error("Apollo enrichment isteği hata verdi", { error: e });
    }
  }

  logger.info(`Apollo enrichment: ${enriched.length}/${candidates.length} doğrulanmış e-posta`);
  return enriched;
}

// Apify actor ile lead ara
async function searchApify(
  params: ApifyParams,
  maxResults: number
): Promise<Contact[]> {
  logger.info("Apify arama başlıyor", { ...params, maxResults });

  const runInput: Record<string, unknown> = {
    maxResults,
    contactEmailStatus: "verified",
    ...(params.personTitle.length > 0 && { personTitle: params.personTitle }),
    ...(params.seniority.length > 0 && { seniority: params.seniority }),
    ...(params.personCountry.length > 0 && { personCountry: params.personCountry }),
    ...(params.companyCountry.length > 0 && { companyCountry: params.companyCountry }),
    ...(params.industry.length > 0 && { industry: params.industry }),
    ...(params.industryKeywords.length > 0 && { industryKeywords: params.industryKeywords }),
    ...(params.companyEmployeeSize.length > 0 && { companyEmployeeSize: params.companyEmployeeSize }),
  };

  const res = await fetch(
    `https://api.apify.com/v2/acts/braveleads~leads-finder-linkedin-apollo-leads-generator/runs?token=${process.env.APIFY_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(runInput),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    logger.error("Apify run başlatılamadı", { status: res.status, body: errText });
    return [];
  }

  const runData = (await res.json()) as { data?: { id?: string } };
  const runId = runData.data?.id;
  if (!runId) {
    logger.error("Apify run ID alınamadı");
    return [];
  }

  // Run tamamlanana kadar bekle (max 300s, 5s aralıklarla)
  let attempts = 0;
  while (attempts < 60) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${process.env.APIFY_API_KEY}`
    );
    const statusData = (await statusRes.json()) as { data?: { status?: string } };
    const status = statusData.data?.status;
    if (status === "SUCCEEDED") break;
    if (status === "FAILED" || status === "ABORTED") {
      logger.error("Apify run başarısız", { status });
      return [];
    }
    attempts++;
  }

  // Sonuçları çek
  const itemsRes = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${process.env.APIFY_API_KEY}&limit=${maxResults}`
  );

  if (!itemsRes.ok) {
    logger.error("Apify dataset alınamadı");
    return [];
  }

  const items = (await itemsRes.json()) as Array<Record<string, unknown>>;
  logger.info(`Apify ${items.length} lead döndürdü`);

  return items.map((p) => ({
    name: (p.fullName as string) || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
    first_name: (p.firstName as string) || "",
    last_name: (p.lastName as string) || "",
    title: (p.position as string) || null,
    email: (p.email as string) || null,
    linkedin_url: (p.linkedinUrl as string) || null,
    organization: {
      name: (p.organizationName as string) || "Bilinmeyen",
      website_url: (p.organizationWebsite as string) || null,
      industry: (p.organizationIndustry as string) || null,
      estimated_num_employees: parseEmployeeCount(p.organizationSize as string),
      city: (p.organizationCity as string) || null,
      country: (p.organizationCountry as string) || null,
      // Apify actor'ü firma etiketi döndürmüyor — skorlama bu alan boşken de çalışır.
      keywords: [],
    },
  }));
}

// Şirket araştırması: Firecrawl + Tavily + Claude
async function researchCompany(
  contact: Contact,
  signals: string | null
): Promise<ResearchResult> {
  const orgName = contact.organization?.name || "Bilinmeyen";

  // Firecrawl ile web sitesi
  let websiteContent = "";
  if (contact.organization?.website_url) {
    try {
      const result = await getFirecrawl().scrapeUrl(
        contact.organization.website_url,
        { formats: ["markdown"] }
      ) as { markdown?: string };
      if (result?.markdown) {
        websiteContent = result.markdown.slice(0, 2000);
      }
    } catch (e) {
      logger.warn("Firecrawl başarısız", {
        url: contact.organization.website_url,
        error: e,
      });
    }
  }

  // Tavily ile haberler
  let newsContent = "";
  try {
    const currentYear = new Date().getFullYear();
    const res = await fetchWithRetry("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `${orgName} news funding hiring ${currentYear - 1} ${currentYear}`,
        search_depth: "basic",
        max_results: 3,
        include_raw_content: false,
      }),
    });
    const data = (await res.json()) as {
      results?: Array<{ title: string; content: string; published_date?: string; url?: string }>;
    };
    newsContent = (data.results || [])
      .map(
        (r) =>
          `[Kaynak: ${r.url || "bilinmiyor"} | Tarih: ${r.published_date || "bilinmiyor"}]\n${r.title}: ${r.content}`
      )
      .join("\n\n")
      .slice(0, 2000);
  } catch (e) {
    logger.warn("Tavily başarısız", { error: e });
  }

  // Claude ile sentez
  const todayIso = new Date().toISOString().slice(0, 10);

  // Kullanıcı hiç sinyal çipi seçmediyse prompt'a sinyal listesi ENJEKTE EDİLMEZ.
  // Eskiden boş değer `signals || "büyüme, işe alım, yeni ürün, finansman"` yedeğine
  // düşüyordu; bu, kullanıcının seçmediği SaaS odaklı sinyalleri arattırıp whyNow'a
  // "aranan işe alım, finansman veya yeni ürün sinyalleri mevcut değildir" gibi
  // alakasız bir cümle yazdırıyordu (2026-08-01 gözlemi). Artık sinyal seçilmediğinde
  // model serbest arama yapıyor: ne varsa onu raporluyor.
  // NOT: signalsToText boş dizi için "" döndürür (null değil), o yüzden trim kontrolü şart.
  const signalInstruction = signals?.trim()
    ? `Öncelikli aranan sinyaller: ${signals}
(Bunlar öncelikli; ancak şirkete özgü başka somut bir gelişme varsa onu da değerlendirebilirsin.)`
    : `Aranan sinyal türü belirtilmemiş — şirkete özgü SOMUT ve GÜNCEL herhangi bir gelişmeyi değerlendir (yeni tesis/kapasite, işe alım, finansman, ürün lansmanı, ortaklık, pazar genişlemesi, sertifika/mevzuat vb.). Belirli bir sinyal türünü aramaya çalışma.`;
  const msg = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `Şirket araştırmasına dayanarak satış sinyali çıkar. Bugünün tarihi: ${todayIso}.

Şirket: ${orgName}
Sektör: ${contact.organization?.industry || "bilinmiyor"}
Çalışan: ${contact.organization?.estimated_num_employees || "bilinmiyor"}
Konum: ${[contact.organization?.city, contact.organization?.country].filter(Boolean).join(", ") || "bilinmiyor"}

Web sitesi:
${websiteContent || "(scraple edilemedi)"}

Haberler (her birinin kaynağı ve tarihi belirtilmiştir):
${newsContent || "(haber bulunamadı)"}

${signalInstruction}

KURALLAR (çok önemli, kesinlikle uy):
1. Sadece yukarıdaki web sitesi ve haber metinlerinde AÇIKÇA yazan bilgileri kullan. Hiçbir rakam, tarih, tutar veya olayı uydurma ya da tahmin etme.
2. Web sitesinden gelen bir bilgi ile haberden gelen ayrı bir bilgiyi TEK bir olaymış gibi birleştirme (ör. bir haberdeki yatırım tutarını başka bir haberdeki farklı bir yatırım/lokasyon ile karıştırma). Her iddia tek bir kaynağa dayanmalı.
3. Bir haberin tarihi bugünden (${todayIso}) 18 aydan eskiyse veya tarih belirsizse, bunu "güncel değil" ya da "geçmiş" olarak nitele; yakın zamanda olmuş gibi sunma.
4. Sağlanan metinlerde somut, doğrulanabilir bir "neden şimdi" sinyali yoksa whyNow alanına uydurma bir sinyal yazma — bunun yerine "Belirgin bir güncel sinyal bulunamadı." yaz.
5. Emin olmadığın veya kaynakta net karşılığı olmayan hiçbir detayı (tutar, şehir, kişi sayısı vb.) whyNow'a ekleme.
6. whyNow'da HANGİ sinyal türlerini aradığını yazma ("aranan işe alım/finansman sinyalleri yok" gibi). Kullanıcıyı ilgilendiren tek şey şirkete dair ne bulunduğudur; bulunamadıysa sadece "Belirgin bir güncel sinyal bulunamadı." de ve varsa kısa gerekçesini (ör. haberler şirketle ilgili değil / tarih çok eski) ekle.

Sadece JSON döndür:
{
  "industry": "sektör",
  "size": "çalışan sayısı/büyüklük",
  "location": "şehir, ülke",
  "whyNow": "1-2 cümle: sadece kaynaklarda geçen somut ve güncel neden şimdi sinyali, yoksa 'Belirgin bir güncel sinyal bulunamadı.'",
  "websiteSummary": "1 cümle web sitesi özeti",
  "newsSummary": "1 cümle haber özeti (kaynakta yoksa boş bırak)"
}`,
      },
    ],
  });

  try {
    const text = (msg.content[0] as { type: string; text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? JSON.parse(jsonMatch[0])
      : fallbackResearch(contact);
  } catch {
    return fallbackResearch(contact);
  }
}

function fallbackResearch(contact: Contact): ResearchResult {
  return {
    industry: contact.organization?.industry || "—",
    size: contact.organization?.estimated_num_employees?.toString() || "—",
    location:
      [contact.organization?.city, contact.organization?.country]
        .filter(Boolean)
        .join(", ") || "—",
    whyNow: "Sinyal bulunamadı.",
    websiteSummary: "",
    newsSummary: "",
  };
}

type ScoreResult = {
  icpFit: number;
  signalStrength: number;
  passes: boolean;
};

// 2026-07-31: signalStrength'i geçiş kapısından tamamen çıkardık. Kereste/inşaat gibi
// dijital ayak izi zayıf, geleneksel B2B sektörlerde (özellikle G. Amerika/Afrika)
// Tavily/Firecrawl çoğu zaman somut bir "neden şimdi" haberi bulamıyor — bu "ilgisiz
// lead" anlamına gelmiyor, sadece haber kaynağı kıt demek. 4 test kampanyasında işlenen
// ~20 adayın hiçbiri signalStrength 60'ı geçemedi; ICP uyumu 70+ olan gerçek adaylar
// (ör. WAS Co Mexico: icpFit 78) sırf bu yüzden eleniyordu. signalStrength artık SADECE
// whyNow metninin kalitesini/gösterimini etkiliyor — geçiş kararı yalnız icpFit'e bakıyor.
// Onay öncesi taslak zaten insan gözden geçirmesinden geçiyor, o yüzden eşiği gevşetmek
// "yanlış lead'e mail gitmesi" değil, "gözden geçirilecek taslak sayısının artması" riski taşıyor.
const ICP_FIT_PASS = 75;

// Araştırma öncesi ön eleme eşiği. Bilerek nihai eşikten (75) düşük tutuldu:
// bu noktada elimizde yalnız Apollo'nun ham sektör etiketi var; araştırmadan gelen
// sektör bilgisi bazen daha isabetli çıkıyor ve sınırdaki adayı yukarı çekebiliyor.
// Aradaki 15 puanlık boşluk o adaylara ikinci şans bırakıyor — buranın altındakiler
// ise araştırmadan sonra da 75'i geçemeyecek kadar uzak.
const ICP_FIT_PRE_GATE = 60;

// icpStr'e ICP'nin gerçek "aranan alıcı sektörü" bağlamını ekler. ICP.sector genelde
// SATTIĞIMIZ ürünün sektörü (ör. "Wood, Timber") — hedef şirketlerin sektörü bu DEĞİL,
// bunu SATIN ALAN sektörler (resolveSectorMapping'in çözdüğü liste). Bu bağlam
// skorlama LLM'ine iletilmezse (önceki tasarımda iletilmiyordu), model literal
// sektör metnini hedef şirketin sektörüyle karşılaştırıp gerçek eşleşen adaylara
// bile tutarsız/düşük puan veriyordu (kanıt: iki farklı şirket, birebir aynı
// "building materials" etiketiyle 78 ve 15 aldı — bkz. 2026-08-01 analiz).
function buildIcpFitContext(
  icp: string,
  icpRecord: Record<string, string>,
  buyerIndustries: string[]
): string {
  if (buyerIndustries.length === 0) return icp;
  return `Rol: ${icpRecord.role || "belirtilmemiş"}
Büyüklük: ${icpRecord.size || "belirtilmemiş"}
Coğrafya: ${icpRecord.geography || "belirtilmemiş"}
NOT: ICP'nin "sektör" alanı (${icpRecord.sector}) bizim SATTIĞIMIZ ürünün sektörü —
hedef şirketin sektörü bu OLMAMALI, bunu SATIN ALAN sektörlerden biri olmalı.
Aranan gerçek alıcı sektörleri: ${buyerIndustries.join(", ")}`;
}

// icpFit ve signalStrength İKİ AYRI çağrıyla hesaplanır (tek çağrıda birleşikken
// whyNow metni icpFit'i de görüyordu — "bağımsız olsun" talimatına rağmen model
// zayıf/boş whyNow'u gördüğünde genel güvenini düşürüp icpFit'i de aşağı çekiyordu).
async function scoreIcpFit(
  contact: Contact,
  research: ResearchResult,
  icpContext: string
): Promise<number> {
  const msg = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 60,
    messages: [
      {
        role: "user",
        content: `Bir şirketin ICP'ye uyum skorunu ver (0-100). SADECE rol, sektör, büyüklük, coğrafyaya bak — haber/sinyal bilgisi verilmiyor, onu değerlendirme.

ICP:
${icpContext}

Değerlendirilecek şirket: ${contact.organization?.name}
Şirket sektörü: ${research.industry}
Şirket büyüklüğü: ${research.size}
Konum: ${research.location}
Kişi: ${contact.name}, ünvan: ${contact.title}${
            contact.organization?.keywords?.length
              ? `\nŞirketin anahtar kelimeleri: ${contact.organization.keywords.join(", ")}`
              : ""
          }

Puanlama rehberi:
- 85-100: sektör aranan (alıcı) sektörlerden biriyle net eşleşiyor VE rol net eşleşiyor VE büyüklük/coğrafya uygun
- 65-84: sektör ilişkili ama net değil, veya rol/büyüklük kısmen uyuyor
- 35-64: sektör zayıf ilişkili veya rol belirsiz
- 0-34: sektör aranan listeyle tamamen alakasız (ör. madencilik, tarım, sağlık, çevre hizmetleri, BT hizmetleri gibi hiç örtüşmeyen alanlar)

Sadece JSON döndür: {"icpFit": 0-100}`,
      },
    ],
  });

  const text = (msg.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { icpFit?: number };
      if (typeof parsed.icpFit === "number") return Math.min(100, Math.max(0, parsed.icpFit));
    } catch {
      // fallback değer kullanılır
    }
  }
  return 50;
}

async function scoreSignalStrength(research: ResearchResult): Promise<number> {
  const msg = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 40,
    messages: [
      {
        role: "user",
        content: `"Neden şimdi" sinyalinin ne kadar güncel/somut/güçlü olduğunu puanla (0-100).

Sinyal metni: ${research.whyNow}

Puanlama rehberi:
- 0-20: sinyal bulunamadı veya tamamen genel/alakasız
- 20-50: belirsiz tarihli veya dolaylı bir işaret var
- 50-80: somut ama tarih net değil
- 80-100: net, tarihli, güçlü büyüme/işe alım/yatırım/kapasite sinyali

Sadece JSON döndür: {"signalStrength": 0-100}`,
      },
    ],
  });

  const text = (msg.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { signalStrength?: number };
      if (typeof parsed.signalStrength === "number") return Math.min(100, Math.max(0, parsed.signalStrength));
    } catch {
      // fallback değer kullanılır
    }
  }
  return 50;
}

async function scoreContact(
  contact: Contact,
  research: ResearchResult,
  icpContext: string
): Promise<ScoreResult> {
  const [icpFit, signalStrength] = await Promise.all([
    scoreIcpFit(contact, research, icpContext),
    scoreSignalStrength(research),
  ]);
  const passes = icpFit >= ICP_FIT_PASS;
  return { icpFit, signalStrength, passes };
}

// Lead'in ülkesi ve e-posta/web domain TLD'sinden e-posta dilini belirle.
// Türkiye → Türkçe; diğer bilinen ülkeler kendi dillerine; geri kalan → İngilizce.
function detectEmailLanguage(contact: Contact): string {
  const country = (contact.organization?.country ?? "").toLowerCase().trim();
  const emailDomain = (contact.email ?? "").split("@")[1]?.toLowerCase() ?? "";
  const siteDomain = (contact.organization?.website_url ?? "").toLowerCase().replace(/https?:\/\//, "").split("/")[0];
  const effectiveDomain = emailDomain || siteDomain;
  const tld = effectiveDomain.split(".").pop() ?? "";

  const COUNTRY_LANG: Record<string, string> = {
    turkey: "Turkish",
    türkiye: "Turkish",
    germany: "German",
    austria: "German",
    switzerland: "German",
    france: "French",
    spain: "Spanish",
    mexico: "Spanish",
    argentina: "Spanish",
    colombia: "Spanish",
    chile: "Spanish",
    peru: "Spanish",
    ecuador: "Spanish",
    uruguay: "Spanish",
    paraguay: "Spanish",
    bolivia: "Spanish",
    italy: "Italian",
    netherlands: "Dutch",
    belgium: "Dutch",
    poland: "Polish",
    portugal: "Portuguese",
    brazil: "Portuguese",
    russia: "Russian",
    japan: "Japanese",
    "south korea": "Korean",
    korea: "Korean",
    "united states": "English",
    "united kingdom": "English",
    ireland: "English",
    australia: "English",
    canada: "English",
  };

  const TLD_LANG: Record<string, string> = {
    tr: "Turkish",
    de: "German",
    fr: "French",
    es: "Spanish",
    it: "Italian",
    nl: "Dutch",
    pl: "Polish",
    pt: "Portuguese",
    ru: "Russian",
    jp: "Japanese",
    kr: "Korean",
  };

  return COUNTRY_LANG[country] ?? TLD_LANG[tld] ?? "English";
}

// Kişiselleştirilmiş e-posta yaz
async function writeEmail(
  contact: Contact,
  research: ResearchResult,
  campaign: Campaign,
  emailLang: string = "Turkish",
  sender: SenderProfile
): Promise<{ subject: string; body: string }> {
  const senderLine = [sender.full_name, sender.company].filter(Boolean).join(", ");
  const senderBusiness = sender.company
    ? `${sender.company}${sender.sector ? ` (${sender.sector})` : ""}`
    : null;

  const msg = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Bu lead için kişiselleştirilmiş B2B soğuk e-posta yaz.

Gönderen: ${senderLine || "Bilinmiyor"}${senderBusiness ? `\nGönderenin işi: ${senderBusiness} — e-posta, alıcıyı bu işin somut değer önerisine (ör. ürün/hizmet) bağlamalı, "supply chain optimization" gibi belirsiz danışmanlık jargonu KULLANMA.` : ""}
Alıcı: ${contact.name}, ${contact.title} @ ${contact.organization?.name}
Sinyal: ${research.whyNow}
Web özeti: ${research.websiteSummary}
Haber özeti: ${research.newsSummary}
Kampanya: ${campaign.name}

Kurallar:
- Max 4-5 cümle, samimi ve doğal
- İlk cümlede "neden şimdi" sinyalini kullan
- Satıcı tonu değil, merak uyandırıcı ama gönderenin gerçek iş alanına somut şekilde bağlı
- Dil: ${emailLang}. Selamlama, kapanış ve tüm içerik bu dilde olsun.
- Kapanışta imza olarak "${sender.full_name || "[İsim]"}" kullan, placeholder bırakma

Sadece JSON döndür:
{
  "subject": "konu satırı",
  "body": "e-posta gövdesi"
}`,
      },
    ],
  });

  const signOff = sender.full_name || "Saygılarımla";

  try {
    const text = (msg.content[0] as { type: string; text: string }).text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch
      ? JSON.parse(jsonMatch[0])
      : {
          subject: `${contact.organization?.name} için bir fikrim var`,
          body: `Merhaba ${contact.first_name},\n\n${research.whyNow}\n\nGörüşmek ister misiniz?\n\n${signOff}`,
        };
  } catch {
    return {
      subject: `${contact.organization?.name} için bir fikrim var`,
      body: `Merhaba ${contact.first_name},\n\n${research.whyNow}\n\nGörüşmek ister misiniz?\n\n${signOff}`,
    };
  }
}

// Ana görev
export const runCampaign = task({
  id: "run-campaign",
  // Lead başına Research+Score+Write ~12-15sn sürüyor. 300sn ile 25 lead'lik
  // kampanya yarıda kesiliyordu; paralelleştirmeyle birlikte tavan da yükseltildi.
  maxDuration: 600,
  run: async (payload: { campaign_id: string; max_leads?: number }) => {
    const db = getDb();

    // Kampanyayı çek
    const { data: campaign, error: campErr } = await db
      .from("campaigns")
      .select("*")
      .eq("id", payload.campaign_id)
      .single();

    if (campErr || !campaign) {
      throw new Error(`Kampanya bulunamadı: ${payload.campaign_id}`);
    }

    // Gönderenin profil bilgisi — e-posta taslağı jenerik "supply chain optimization"
    // danışmanlık diliyle değil, gönderenin gerçek şirketi/ürünü üzerinden yazılsın diye.
    const { data: ownerProfile } = await db
      .from("profiles")
      .select("full_name, company, sector")
      .eq("id", (campaign as Campaign).owner_id)
      .single();
    const sender: SenderProfile = {
      full_name: (ownerProfile?.full_name as string) || null,
      company: (ownerProfile?.company as string) || null,
      sector: (ownerProfile?.sector as string) || null,
    };

    const { id: campaignId, owner_id: ownerId } = campaign as Campaign;
    logger.info("Kampanya başlatıldı", { campaignId });

    const c = campaign as Campaign;
    const icpStr = icpToText(c.icp);
    const signalsStr = signalsToText(c.signals);
    const icpRecord = typeof c.icp === "object" && c.icp ? (c.icp as Record<string, string>) : {};

    // Hedef lead sayısı — çağıran ne isterse o. (Eskiden Math.max(100, …) ile
    // taban 100'e zorlanıyordu; Apollo'da bu kampanya başına 100 kredi demekti.)
    const targetLeads = Math.min(100, Math.max(1, payload.max_leads ?? 25));
    const useApollo = (process.env.LEAD_SOURCE ?? "apollo") === "apollo";

    // Sektör→anahtar kelime çözümü. Kürate tablo (resolveSectorMapping) yalnız 7 kalıbı
    // tanıyor; tanımadığı her sektörde girdi HAM haliyle Apollo'ya gidiyordu. Türkçe
    // girdide bu ölümcül: "İnşaat" 21 kişi bulurken "Construction" 2.023 kişi buluyor (96×).
    // Artık kürate tablo eşleşmezse Claude'un İngilizceye çevirdiği keyword'ler kullanılıyor.
    const sectorMapping = resolveSectorMapping(icpRecord.sector);
    const extracted = useApollo
      ? await extractApolloParams(icpStr, signalsStr)
      : null;

    // Alıcı-tarafı ("sattığımız ürünü SATIN ALAN sektörler") kararı: kürate tablodaki
    // hardcode kereste kontrolü VEYA Claude'un yorumu. Böylece kereste dışındaki
    // hammadde/ürün ICP'lerinde de doğru çalışıyor.
    const sectorIsOwnProduct =
      isBuyerSideSector(icpRecord.sector) || extracted?.sectorIsOwnProduct === true;

    const searchKeywords = sectorMapping.matched
      ? sectorMapping.keywords
      : extracted?.q_organization_keyword_tags?.length
        ? extracted.q_organization_keyword_tags
        : sectorMapping.keywords;

    // Skorlamaya "aranan gerçek alıcı sektörleri" bağlamı, yalnız (b) durumunda verilir —
    // aksi halde prompt kendi kendisiyle çelişiyor (bkz. buildIcpFitContext).
    const buyerIndustries = sectorIsOwnProduct ? searchKeywords : [];
    const icpFitContext = buildIcpFitContext(icpStr, icpRecord, buyerIndustries);

    // ---------- FIND ----------
    let contacts: Contact[] = [];

    if (useApollo && extracted) {
      await log(db, campaignId, null, ownerId, "find", "started", "ICP'e uygun adaylar Apollo'da aranıyor...");

      const locations = geographyToApolloLocations(icpRecord.geography);
      logger.info("Apollo arama parametreleri çözüldü", {
        keywords: searchKeywords,
        sektorKendiUrunumuz: sectorIsOwnProduct,
        kurateEslesme: sectorMapping.matched,
      });

      const baseParams: ApolloParams = {
        person_titles: extracted.person_titles,
        person_seniorities: extracted.person_seniorities,
        person_locations: locations,
        organization_locations: locations,
        q_organization_keyword_tags: searchKeywords.slice(0, 10),
        organization_num_employees_ranges: extracted.organization_num_employees_ranges,
      };

      // 1) Ara — 0 kredi. Önce satın-alma sinyali filtreleriyle dene:
      // kampanyanın "signals" alanı artık Apollo'da ARAMA ANINDA uygulanıyor,
      // sonradan tahmin edilmiyor. Maliyeti yok, havuz kalitesini yükseltiyor.
      const signalFilters = signalsToApolloFilters(c.signals);
      const poolSize = targetLeads * CANDIDATE_MULTIPLIER;

      let candidates = await searchApolloPeople({ ...baseParams, ...signalFilters }, poolSize);

      // Sinyal filtreleri havuzu aşırı daraltabiliyor (funding testinde -98%).
      // Yeterli aday çıkmazsa sinyalsiz tekrar ara — kampanya boş dönmesin.
      if (candidates.length < targetLeads) {
        logger.info("Sinyal filtreleri havuzu daralttı, sinyalsiz tekrar aranıyor", {
          bulunan: candidates.length,
          hedef: targetLeads,
        });
        const wider = await searchApolloPeople(
          { ...baseParams, person_not_titles: signalFilters.person_not_titles },
          poolSize
        );
        if (wider.length > candidates.length) candidates = wider;
      }

      if (candidates.length === 0) {
        await log(db, campaignId, null, ownerId, "find", "error", "Apollo'da aday bulunamadı. Kampanya parametrelerini kontrol edin.");
        return { leads_created: 0 };
      }

      // 1.5) ENRICHMENT ÖNCESİ DEDUPE — 0 kredi.
      // Daha önce enrich edilmiş kişiler BURADA elenmeli. Aksi halde her biri için
      // 1 kredi harcanıp sonra aşağıdaki e-posta dedupe'unda çöpe atılıyorlar.
      // (2026-08-01 gözlemi: 5 lead istendi → 5 kredi harcandı → 4'ü tekrar çıktı →
      // elde 1 lead kaldı. Veritabanı büyüdükçe bu israf oranı artıyor.)
      // NOT: apollo_id kolonu yeni eklendi; eski lead'lerde null olduğu için
      // aşağıdaki e-posta bazlı dedupe emniyet ağı olarak KORUNUYOR.
      const { data: knownRows } = await db
        .from("leads")
        .select("apollo_id")
        .eq("owner_id", ownerId)
        .not("apollo_id", "is", null);

      const knownApolloIds = new Set((knownRows ?? []).map((r) => r.apollo_id as string));
      if (knownApolloIds.size > 0) {
        const beforeCount = candidates.length;
        candidates = candidates.filter((cand) => !knownApolloIds.has(cand.apollo_id));
        const removed = beforeCount - candidates.length;
        if (removed > 0) {
          logger.info("Enrichment öncesi dedupe (kredi harcanmadı)", {
            atlanan: removed,
            kalan: candidates.length,
          });
        }
      }

      if (candidates.length === 0) {
        await log(
          db, campaignId, null, ownerId, "find", "error",
          "Yeni aday kalmadı — bulunan adayların tamamı daha önce işlenmiş. Kredi harcanmadı."
        );
        return { leads_created: 0 };
      }

      // 2) Ön skorla — 0 kredi, tek Claude çağrısı
      const preScores = await preScoreCandidates(candidates, icpStr);
      const ranked = candidates
        .map((cand, i) => ({ cand, score: preScores[i] }))
        .sort((a, b) => b.score - a.score)
        .slice(0, targetLeads)
        .map((r) => r.cand);

      await log(
        db, campaignId, null, ownerId, "find", "started",
        `${candidates.length} aday tarandı, en iyi ${ranked.length} tanesi zenginleştiriliyor...`
      );

      // 3) Yalnız seçilenleri enrich et — lead başına 1 kredi
      contacts = await enrichApolloPeople(ranked);
    } else {
      await log(db, campaignId, null, ownerId, "find", "started", "ICP'e uygun lead'ler Apify'da aranıyor...");

      const extractedParams = await extractApifyParams(icpStr, signalsStr);
      const countries = geographyToCountries(icpRecord.geography);
      const industries = sectorToIndustries(icpRecord.sector);
      contacts = await searchApify(
        { ...extractedParams, personCountry: countries, companyCountry: countries, industry: industries },
        targetLeads
      );
      // Apify de zaman zaman e-postasız kayıt döndürüyor — gönderilemez lead açmayalım
      contacts = contacts.filter((ct) => realEmail(ct.email));
    }

    if (contacts.length === 0) {
      await log(db, campaignId, null, ownerId, "find", "error", "Doğrulanmış e-postalı lead bulunamadı.");
      return { leads_created: 0 };
    }

    // ---------- DEDUPE ----------
    // Aynı kişiyi tekrar işlemek hem kredi hem Claude/Firecrawl maliyeti demek.
    const emails = contacts.map((ct) => ct.email!).filter(Boolean);
    const { data: existingLeads } = await db
      .from("leads")
      .select("email")
      .eq("owner_id", ownerId)
      .in("email", emails);

    const known = new Set((existingLeads ?? []).map((r) => (r.email as string)?.toLowerCase()));
    const seenInBatch = new Set<string>();
    const freshContacts = contacts.filter((ct) => {
      const key = ct.email!.toLowerCase();
      if (known.has(key) || seenInBatch.has(key)) return false;
      seenInBatch.add(key);
      return true;
    });

    const skipped = contacts.length - freshContacts.length;
    if (freshContacts.length === 0) {
      await log(db, campaignId, null, ownerId, "find", "error", `${skipped} lead zaten mevcuttu, yeni lead yok.`);
      return { leads_created: 0 };
    }

    await log(
      db, campaignId, null, ownerId, "find", "completed",
      `${freshContacts.length} yeni lead bulundu${skipped > 0 ? ` (${skipped} tekrar atlandı)` : ""}.`
    );

    // ---------- RESEARCH → SCORE → WRITE (paralel) ----------
    // Sıralı döngü lead başına ~12-15sn sürüyordu; 25 lead 300sn limitini aşıyordu.
    const tints = ["lime", "sage", "amber", "pink"];
    let leadsCreated = 0;

    await mapLimit(freshContacts, PIPELINE_CONCURRENCY, async (contact, i) => {
      const tint = tints[i % tints.length];
      const orgName = contact.organization?.name || contact.name;

      try {
        // ÖN KAPI — araştırma YAPILMADAN, yalnız Apollo enrichment verisiyle ICP uyumu.
        // icpFit zaten sektör/büyüklük/konum/unvana bakıyor ve bunların hepsi
        // enrichment'tan geliyor; araştırma sadece whyNow (sinyal) için gerekli.
        // Öncesinde sıra "araştır → skorla → eleyeceksen ele" idi: elenen her lead için
        // Firecrawl + Tavily + 600 token'lık Claude çağrısı zaten harcanmış oluyordu.
        const preResearch = fallbackResearch(contact);
        const preIcpFit = await scoreIcpFit(contact, preResearch, icpFitContext);

        if (preIcpFit < ICP_FIT_PRE_GATE) {
          await log(
            db, campaignId, null, ownerId, "score", "completed",
            `${orgName}: ICP uyumu ${preIcpFit}/100 — araştırma yapılmadan elendi.`
          );
          await db.from("leads").insert({
            campaign_id: campaignId,
            owner_id: ownerId,
            company: orgName,
            initials: orgName.slice(0, 2).toUpperCase(),
            tint,
            contact: contact.name || null,
            title: contact.title || null,
            email: contact.email || null,
            linkedin_url: contact.linkedin_url || null,
            apollo_id: contact.apollo_id ?? null,
            stage: "low_score",
            score: preIcpFit,
            research: {
              industry: preResearch.industry,
              size: preResearch.size,
              location: preResearch.location,
              website: contact.organization?.website_url ?? null,
              whyNow: "ICP uyumu eşiğin altında kaldığı için araştırma yapılmadı.",
              signalStrength: 0,
            },
            draft_email: null,
          });
          return;
        }

        // RESEARCH — yalnız ön kapıyı geçenler için
        await log(db, campaignId, null, ownerId, "research", "started", `${orgName} araştırılıyor...`);
        const research = await researchCompany(contact, signalsStr);
        await log(db, campaignId, null, ownerId, "research", "completed", `"${research.whyNow.slice(0, 80)}"`);

        // SCORE — icpFit ve signalStrength ayrı hesaplanır; geçiş kararı yalnız
        // icpFit'e bakar (bkz. ICP_FIT_PASS), signalStrength sadece whyNow'u besler.
        const { icpFit, signalStrength, passes } = await scoreContact(contact, research, icpFitContext);
        await log(
          db, campaignId, null, ownerId, "score", "completed",
          `${orgName}: ICP uyumu ${icpFit}/100, sinyal ${signalStrength}/100`
        );

        if (!passes) {
          await log(
            db, campaignId, null, ownerId, "score", "completed",
            `${orgName}: eşiğin altında (ICP ${icpFit}, sinyal ${signalStrength}) — mesaj hazırlanmıyor.`
          );
          await db.from("leads").insert({
            campaign_id: campaignId,
            owner_id: ownerId,
            company: orgName,
            initials: orgName.slice(0, 2).toUpperCase(),
            tint,
            contact: contact.name || null,
            title: contact.title || null,
            email: contact.email || null,
            linkedin_url: contact.linkedin_url || null,
            apollo_id: contact.apollo_id ?? null,
            stage: "low_score",
            score: icpFit,
            research: {
              industry: research.industry,
              size: research.size,
              location: research.location,
              website: contact.organization?.website_url ?? null,
              whyNow: research.whyNow,
              signalStrength,
            },
            draft_email: null,
          });
          return;
        }

        // WRITE (yalnız ICP_FIT_PASS eşiğini geçenler)
        const emailLang = detectEmailLanguage(contact);
        await log(db, campaignId, null, ownerId, "write", "started", `${orgName} için e-posta yazılıyor (${emailLang})...`);
        const draft = await writeEmail(contact, research, campaign as Campaign, emailLang, sender);
        await log(db, campaignId, null, ownerId, "write", "completed", `Taslak hazır — "${draft.subject}"`);

        // LEAD KAYDET
        const { data: lead, error: leadErr } = await db
          .from("leads")
          .insert({
            campaign_id: campaignId,
            owner_id: ownerId,
            company: orgName,
            initials: orgName.slice(0, 2).toUpperCase(),
            tint,
            contact: contact.name || null,
            title: contact.title || null,
            email: contact.email || null,
            linkedin_url: contact.linkedin_url || null,
            apollo_id: contact.apollo_id ?? null,
            stage: "awaiting_approval",
            score: icpFit,
            research: {
              industry: research.industry,
              size: research.size,
              location: research.location,
              website: contact.organization?.website_url ?? null,
              whyNow: research.whyNow,
              signalStrength,
              draftSubject: draft.subject,
            },
            draft_email: draft.body,
          })
          .select()
          .single();

        if (leadErr || !lead) {
          logger.error("Lead kaydedilemedi", { error: leadErr, company: orgName });
          return;
        }

        // MESSAGE KAYDET
        await db.from("messages").insert({
          lead_id: lead.id,
          owner_id: ownerId,
          direction: "outbound",
          channel: "email",
          subject: draft.subject,
          body: draft.body,
          status: "draft",
        });

        leadsCreated++;
        logger.info(`Lead kaydedildi: ${orgName} — ICP: ${icpFit}, sinyal: ${signalStrength}`);
      } catch (e) {
        // Tek bir lead patlarsa tüm kampanya çökmesin
        logger.error("Lead işlenemedi", { company: orgName, error: e });
      }
    });

    logger.info("Kampanya tamamlandı", { leadsCreated, source: useApollo ? "apollo" : "apify" });
    return { leads_created: leadsCreated };
  },
});
