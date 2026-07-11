// Mock veri — Faz A. Faz B'de Supabase ile değiştirilecek.

export type NavKey =
  | "dashboard"
  | "leads"
  | "conversations"
  | "briefs"
  | "close"
  | "campaign";

export type NavItem = {
  key: NavKey;
  label: string;
  href: string;
  icon: string; // lucide ikon adı
  badge?: string;
  locked?: boolean;
  lockLabel?: string;
};

export const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: "LayoutGrid" },
  { key: "leads", label: "Leads", href: "/leads", icon: "List", badge: "3" },
  { key: "conversations", label: "Conversations", href: "/conversations", icon: "Inbox" },
  { key: "briefs", label: "Meeting briefs", href: "/briefs", icon: "FileText" },
  {
    key: "close",
    label: "Close & Contract",
    href: "/close",
    icon: "PenLine",
    lockLabel: "SPRINT 3",
  },
  { key: "campaign", label: "Campaign", href: "/campaign", icon: "Crosshair" },
];

export const currentUser = {
  name: "Selin Özkan",
  role: "BD Lead · Studio Nova",
  initials: "SÖ",
};

export const activeCampaign = {
  name: "Fintech & E-commerce · TR/EU",
};

export type AgentActivity = {
  agent: string;
  message: string;
};

export const agentActivity: AgentActivity = {
  agent: "Research agent",
  message: "Tera Enerji'nin basın haberlerini okuyor…",
};

export const agentsActiveCount = 3;

// --- Dashboard (A2) ---

export type MetricTone = "default" | "positive" | "warning";

export type Metric = {
  label: string;
  value: string;
  sub: string;
  tone: MetricTone;
};

export const metrics: Metric[] = [
  { label: "Bulunan lead", value: "34", sub: "+4 bugün", tone: "positive" },
  { label: "Araştırılan", value: "26", sub: "+3 bugün", tone: "positive" },
  { label: "Onay bekleyen", value: "3", sub: "senin sıran", tone: "warning" },
  { label: "Gönderilen", value: "11", sub: "+2 bu hafta", tone: "positive" },
  { label: "Yanıtlar", value: "6", sub: "%55 yanıt oranı", tone: "default" },
  { label: "Toplantılar", value: "3", sub: "+1 bu hafta", tone: "positive" },
  { label: "Kazanılan", value: "1", sub: "€14.5k MRR", tone: "default" },
];

export type FunnelStage = {
  n: string;
  label: string;
  value: number;
  color: string; // tailwind bg sınıfı
};

// Barlar lime → forest geçişli (Bul en açık/lime, Yaz en koyu)
export const funnel: FunnelStage[] = [
  { n: "01", label: "Bul", value: 34, color: "bg-lime-500" },
  { n: "02", label: "Araştır", value: 26, color: "bg-forest-400" },
  { n: "03", label: "Skorla", value: 21, color: "bg-forest-600" },
  { n: "04", label: "Yaz", value: 14, color: "bg-forest-800" },
];

export type ApprovalTint = "lime" | "pink";

export type Approval = {
  company: string;
  initials: string;
  contact: string;
  reason: string;
  tint: ApprovalTint;
};

// --- Leads (A4) ---

export type Stage =
  | "awaiting_approval"
  | "sent"
  | "replied"
  | "meeting_booked"
  | "won";

export type StageTone = "warning" | "default" | "positive" | "accent";

export const stageMeta: Record<Stage, { label: string; tone: StageTone }> = {
  awaiting_approval: { label: "Onay bekliyor", tone: "warning" },
  sent: { label: "Gönderildi", tone: "default" },
  replied: { label: "Yanıtladı", tone: "positive" },
  meeting_booked: { label: "Toplantı ayarlandı", tone: "accent" },
  won: { label: "Kazanıldı", tone: "positive" },
};

export type LeadTint = "lime" | "sage" | "amber" | "pink";

export type Lead = {
  id: string;
  company: string;
  initials: string;
  tint: LeadTint;
  industry: string;
  size: string;
  location: string;
  contact: string;
  title: string;
  stage: Stage;
  score: number;
  whyNow: string;
  draftSubject: string;
  draftBody: string;
};

export const leads: Lead[] = [
  {
    id: "nexora",
    company: "Nexora Retail",
    initials: "NR",
    tint: "lime",
    industry: "E-ticaret",
    size: "120 çalışan",
    location: "İstanbul, TR",
    contact: "Elif Kaya",
    title: "Head of Growth",
    stage: "awaiting_approval",
    score: 92,
    whyNow:
      "Geçen salı $8M Series A turu açıkladı ve 6 büyüme pozisyonu ilanı yayınladı — hızlı ölçekleme moduna girdiler, dış performans desteğine açık dönem.",
    draftSubject: "Series A sonrası büyüme ekibinizi hızlandırmak",
    draftBody:
      "Merhaba Elif,\n\nSeries A turunuzu ve açtığınız 6 büyüme pozisyonunu gördüm — tebrikler. Bu tempoda ekip kurulurken performans tarafında dış bir hızlandırıcı çoğu zaman ilk 2 çeyreği kurtarıyor.\n\nBenzer bir e-ticaret markasında ilk 90 günde CAC'ı %22 düşürdüğümüz bir çalışmayı 20 dakikada anlatabilirim. Bu hafta uygun bir vaktiniz olur mu?",
  },
  {
    id: "halka",
    company: "Halka Studio",
    initials: "HS",
    tint: "sage",
    industry: "PropTech",
    size: "45 çalışan",
    location: "İzmir, TR",
    contact: "Deniz Acar",
    title: "Kurucu",
    stage: "awaiting_approval",
    score: 88,
    whyNow:
      "Dün Webrazzi'de yer aldı ve Körfez pazarı açılımını duyurdu — yeni pazarda marka bilinirliği ve talep yaratma ihtiyacı taze.",
    draftSubject: "Körfez açılımınız için talep yaratma",
    draftBody:
      "Merhaba Deniz,\n\nWebrazzi'deki Körfez açılımı haberinizi okudum. Yeni bir pazarda ilk 6 ay, doğru kanaldan talep yaratmakla ilgili genelde.\n\nBölgede benzer bir PropTech için kurduğumuz erişim modelini paylaşabilirim — kısa bir görüşme ayarlayalım mı?",
  },
  {
    id: "moda",
    company: "Moda Loop",
    initials: "ML",
    tint: "pink",
    industry: "Moda pazaryeri",
    size: "80 çalışan",
    location: "İstanbul, TR",
    contact: "Camille Roux",
    title: "CMO",
    stage: "awaiting_approval",
    score: 79,
    whyNow:
      "Black Friday kampanya brief'i şirket içinde dolaşıyor; mevcut ajansları tempoya yetişemiyor — sezon öncesi ek kapasite arayışında.",
    draftSubject: "Black Friday'e yetişen ek kapasite",
    draftBody:
      "Merhaba Camille,\n\nSezon yaklaşırken kampanya temposunun ajans kapasitesini zorladığı dönemi iyi biliyoruz.\n\nBlack Friday'e özel, hızlı devreye giren bir üretim modelimiz var. 15 dakikada anlatayım mı?",
  },
  {
    id: "atlas",
    company: "Atlas Fintek",
    initials: "AF",
    tint: "sage",
    industry: "Fintech",
    size: "210 çalışan",
    location: "Ankara, TR",
    contact: "Mert Demir",
    title: "CMO",
    stage: "sent",
    score: 85,
    whyNow:
      "Yeni bir KOBİ kredi ürünü lansmanına hazırlanıyor; lansman öncesi konumlandırma ve içerik ihtiyacı yüksek.",
    draftSubject: "KOBİ kredi lansmanınız için konumlandırma",
    draftBody:
      "Merhaba Mert,\n\nYeni KOBİ kredi ürününüz için lansman hazırlığı yaptığınızı duydum...",
  },
  {
    id: "verde",
    company: "Verde Foods",
    initials: "VF",
    tint: "lime",
    industry: "CPG / D2C",
    size: "95 çalışan",
    location: "Amsterdam, NL",
    contact: "Sofie de Vries",
    title: "Brand Lead",
    stage: "sent",
    score: 81,
    whyNow:
      "D2C aboneliğe geçiş sinyalleri veriyor; retention odaklı yaşam döngüsü pazarlamasına ihtiyaç var.",
    draftSubject: "Abonelik modeline geçişte retention",
    draftBody: "Merhaba Sofie,\n\nAbonelik modeline geçiş sinyallerinizi fark ettik...",
  },
  {
    id: "kuzey",
    company: "Kuzey Lojistik",
    initials: "KL",
    tint: "amber",
    industry: "Lojistik",
    size: "340 çalışan",
    location: "Gebze, TR",
    contact: "Baran Yıldız",
    title: "BD Director",
    stage: "replied",
    score: 76,
    whyNow:
      "AB'ye yönelik operasyonu büyüyor; İngilizce/Almanca satış içeriği ve kurumsal erişim eksikliği var.",
    draftSubject: "AB pazarı için satış içeriği",
    draftBody: "Merhaba Baran,\n\nAB operasyonunuzun büyüdüğünü görüyoruz...",
  },
  {
    id: "brightline",
    company: "Brightline Legal",
    initials: "BL",
    tint: "sage",
    industry: "LegalTech",
    size: "60 çalışan",
    location: "Londra, UK",
    contact: "James Okafor",
    title: "Growth Manager",
    stage: "replied",
    score: 72,
    whyNow:
      "Yeni bir self-serve ürün çıkardı; ürün-öncülüğünde büyüme (PLG) hunisi kurma ihtiyacında.",
    draftSubject: "PLG hunisi kurulumu",
    draftBody: "Merhaba James,\n\nSelf-serve ürününüz için PLG hunisi...",
  },
  {
    id: "meridian",
    company: "Meridian Health",
    initials: "MH",
    tint: "lime",
    industry: "Healthtech",
    size: "210 çalışan",
    location: "Berlin, DE",
    contact: "Dr. Lena Hoffmann",
    title: "VP Marketing",
    stage: "meeting_booked",
    score: 90,
    whyNow:
      "CareOS birleşmesi sonrası tek markaya geçiyor; Q4'te yatırımcı gününe yetişecek regüle bir yeniden markalaşma var.",
    draftSubject: "Regüle sektörde yeniden markalaşma",
    draftBody: "Merhaba Lena,\n\nCareOS birleşmesi sonrası marka birleştirme süreciniz...",
  },
  {
    id: "fjord",
    company: "Fjord Analytics",
    initials: "FA",
    tint: "amber",
    industry: "Veri / AI",
    size: "70 çalışan",
    location: "Oslo, NO",
    contact: "Ingrid Larsen",
    title: "CEO",
    stage: "sent",
    score: 68,
    whyNow:
      "Kurumsal segmente açılıyor; enterprise satış anlatısı ve vaka çalışması üretimi gerekiyor.",
    draftSubject: "Kurumsal segment satış anlatısı",
    draftBody: "Merhaba Ingrid,\n\nKurumsal segmente açıldığınızı görüyoruz...",
  },
  {
    id: "tera",
    company: "Tera Enerji",
    initials: "TE",
    tint: "sage",
    industry: "CleanTech",
    size: "150 çalışan",
    location: "İstanbul, TR",
    contact: "Selin Aydın",
    title: "Comms Director",
    stage: "won",
    score: 94,
    whyNow:
      "Basında görünürlük artışı ve yeni bir yeşil tahvil ihracı; kurumsal itibar ve içerik yönetimi ihtiyacı yüksekti.",
    draftSubject: "Yeşil tahvil sonrası kurumsal itibar",
    draftBody: "Merhaba Selin,\n\nYeşil tahvil ihracınız ve artan basın ilginiz...",
  },
];

export const leadTabs: { key: "all" | Stage; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "awaiting_approval", label: "Onay bekleyen" },
  { key: "sent", label: "Gönderilen" },
  { key: "replied", label: "Yanıtladı" },
  { key: "meeting_booked", label: "Toplantı" },
  { key: "won", label: "Kazanıldı" },
];

// --- Close & Contract (A7) ---

export type ContractStatus = "draft" | "sent" | "signed";

export const contractStatusMeta: Record<
  ContractStatus,
  { label: string; tone: "default" | "warning" | "positive" }
> = {
  draft: { label: "Taslak", tone: "default" },
  sent: { label: "Gönderildi", tone: "warning" },
  signed: { label: "İmzalandı", tone: "positive" },
};

export type Contract = {
  id: string;
  leadId: string;
  scope: string;
  amount: number;
  currency: string;
  billing: string; // "aylık" | "proje"
  term: string;
  startDate: string;
  status: ContractStatus;
};

export const contracts: Contract[] = [
  {
    id: "ct-tera",
    leadId: "tera",
    scope: "Kurumsal itibar & içerik yönetimi",
    amount: 14500,
    currency: "€",
    billing: "aylık",
    term: "6 ay",
    startDate: "15 Temmuz 2026",
    status: "draft",
  },
];

export const formatMoney = (amount: number, currency: string) =>
  `${currency}${amount.toLocaleString("tr-TR")}`;

// --- Meeting briefs (A6) ---

export type KeyPerson = { name: string; role: string; note: string };

export type Meeting = {
  id: string;
  leadId: string;
  domain: string;
  when: string;
  duration: string;
  channel: string;
  conversation: string;
  keyPeople: KeyPerson[];
  talkingPoints: string[];
};

export const meetings: Meeting[] = [
  {
    id: "m-meridian",
    leadId: "meridian",
    domain: "meridianhealth.io",
    when: "4 Tem Cuma · 09:30",
    duration: "30 dk",
    channel: "Google Meet",
    conversation:
      "Lena 4 saat içinde yanıtladı ve zamanlamayı \"neredeyse şüpheli derecede iyi\" buldu — pazartesi tam da ajans desteğini konuşmuşlar. Regüle sektörde rebrand deneyimini özellikle sordu ve sert bir teslim tarihi paylaştı: yatırımcı günü, 15 Ekim.",
    keyPeople: [
      {
        name: "Dr. Lena Hoffmann",
        role: "VP Marketing · katılımcınız",
        note: "Eski Zalando, 8 ay önce katıldı; rebrand bütçesinin sahibi.",
      },
      {
        name: "Tomas Berg",
        role: "CEO · nihai onay",
        note: "CareOS birleşmesi sonrası \"Q4'te tek marka\" sözünü kamuya verdi.",
      },
    ],
    talkingPoints: [
      "NordCare ile aç: 16 haftalık regüle rebrand, sert yatırımcı teslim tarihine yetişti — onların 15 Ekim kısıtının en yakın örneği.",
      "Lena 8 aylık ve bu ilk büyük bütçe kararı — onu güvende hissettir, sadece etkileme.",
      "Birleşme iki tasarım sistemi + iki onay zinciri demek; risk onay döngülerinde — süreç şablonunu göster.",
    ],
  },
  {
    id: "m-kuzey",
    leadId: "kuzey",
    domain: "kuzeylojistik.com",
    when: "7 Tem Pazartesi · 14:00",
    duration: "30 dk",
    channel: "Google Meet",
    conversation:
      "Baran cold e-postaya olumlu döndü ve AB içeriğinde zorlandıklarını açıkça söyledi. Lojistik alanında örnek çalışma ve kabaca ilk proje kapsamı istedi; önerilen yanıtta iki soru da yanıtlandı ve 30 dk görüşme önerildi.",
    keyPeople: [
      {
        name: "Baran Yıldız",
        role: "BD Director · katılımcınız",
        note: "AB açılımını yürütüyor; İngilizce/Almanca içerik açığından bizzat sorumlu.",
      },
    ],
    talkingPoints: [
      "Gebze taşıma firması vakasıyla aç: 6 ayda %34 daha fazla AB RFQ — sektör birebir örtüşüyor.",
      "İlk proje kapsamını net ver: EN/DE site çekirdeği (8 sayfa) + koridor-özel açılış sayfası, 4 hafta sabit ücret.",
      "Karar kriterini sor: hız mı, dil kalitesi mi, yoksa yerel SEO mu önce geliyor?",
    ],
  },
];

// --- Conversations (A5) ---

export const leadById = (id: string) => leads.find((l) => l.id === id)!;

export type Classification = "interested" | "objection" | "not_now";

export const classificationMeta: Record<
  Classification,
  { label: string; tone: "positive" | "warning" | "default" }
> = {
  interested: { label: "İlgili", tone: "positive" },
  objection: { label: "İtiraz", tone: "warning" },
  not_now: { label: "Şimdi değil", tone: "default" },
};

export type ThreadMessage = {
  from: "us" | "them";
  time: string;
  text: string;
};

export type Conversation = {
  id: string;
  leadId: string;
  classification: Classification;
  preview: string;
  messages: ThreadMessage[];
  suggested: { note: string; body: string };
};

export const conversations: Conversation[] = [
  {
    id: "c-kuzey",
    leadId: "kuzey",
    classification: "interested",
    preview: "Zamanlaması iyi oldu — tam da AB içeriğinde zorlanıyoruz…",
    messages: [
      {
        from: "us",
        time: "2 gün önce",
        text: "Merhaba Baran,\n\nAB operasyonunuzun büyüdüğünü görüyoruz. İngilizce/Almanca satış içeriğinde bir açık varsa, benzer bir lojistik firması için kurduğumuz modeli 15 dakikada paylaşabilirim.",
      },
      {
        from: "them",
        time: "Bugün, 08:41",
        text: "Zamanlaması iyi oldu — tam da AB'ye yönelik içerikte zorlanıyoruz. Lojistik alanında örnek çalışmalar paylaşabilir misiniz? Ve kabaca ilk kapsamlı proje neye benzer?",
      },
    ],
    suggested: {
      note: "İki soruyu da yanıtlıyor, görüşme öneriyor",
      body: "Merhaba Baran,\n\nMemnuniyetle — iki ilgili örnek: Gebze merkezli bir taşıma firması için kurduğumuz DE/EN içerik sistemi (6 ayda %34 daha fazla AB RFQ'su) ve bir gümrük acentesi için iki dilli satış materyali kiti.\n\nSizin için kapsamlı ilk proje kabaca şöyle olur: EN/DE site çekirdeği (8 sayfa) + bir koridor-özel açılış sayfası — 4 hafta, sabit ücret.\n\nÖrnekleri canlı göstermek en kolayı. Bu hafta 30 dakikalık bir görüşme uygun mu?",
    },
  },
  {
    id: "c-meridian",
    leadId: "meridian",
    classification: "interested",
    preview: "Zamanlama neredeyse şüpheli derecede iyi — rebrand deneyiminizi…",
    messages: [
      {
        from: "us",
        time: "3 gün önce",
        text: "Merhaba Lena,\n\nCareOS birleşmesi sonrası marka birleştirme sürecinizde, regüle bir sektörde yeniden markalaşma deneyimimiz işinize yarayabilir.",
      },
      {
        from: "them",
        time: "Dün, 16:20",
        text: "Zamanlama neredeyse şüpheli derecede iyi — pazartesi tam da ajans desteğini konuştuk. Regüle sektörlerde rebrand deneyiminizi merak ediyorum; sert bir teslim tarihimiz var: yatırımcı günü, 15 Ekim.",
      },
    ],
    suggested: {
      note: "Deneyim kanıtı sunuyor, teslim tarihine güven veriyor",
      body: "Merhaba Lena,\n\n15 Ekim net bir hedef — benzer bir teslim baskısını NordCare için 16 haftalık regüle bir rebrand'de yönettik ve yatırımcı gününe yetiştirdik.\n\nİki tasarım sistemini tek markaya indirmenin en riskli kısmı genelde onay döngüleri; orada işleyen bir süreç şablonumuz var. 20 dakikada anlatayım mı?",
    },
  },
  {
    id: "c-brightline",
    leadId: "brightline",
    classification: "not_now",
    preview: "İlginç ama bu çeyrek bütçemiz kilitli, belki Q1'de…",
    messages: [
      {
        from: "us",
        time: "4 gün önce",
        text: "Merhaba James,\n\nSelf-serve ürününüz için ürün-öncülüğünde büyüme (PLG) hunisi kurmanıza yardımcı olabiliriz.",
      },
      {
        from: "them",
        time: "Bugün, 10:05",
        text: "İlginç görünüyor ama bu çeyrek için bütçemiz kilitli. Belki Q1'de tekrar konuşabiliriz.",
      },
    ],
    suggested: {
      note: "Kapıyı açık tutuyor, Q1 için hafif takip planlıyor",
      body: "Merhaba James,\n\nGayet anlaşılır — Q1 kulağa mantıklı geliyor. O zamana dek işinize yarayabilecek, benzer bir LegalTech'in PLG hunisini nasıl kurduğunu anlatan kısa bir vaka çalışması göndereyim; baskı olmadan.\n\nAralık sonunda kısaca tekrar dokunayım mı?",
    },
  },
];

// --- Campaign (A3) ---

export const campaignOptions = {
  industry: ["fintech & e-ticaret", "sağlık teknolojisi", "SaaS", "tüketici markaları"],
  size: ["50–250", "10–50", "250–1000"],
  geo: ["Türkiye & AB", "Türkiye", "DACH", "İngiltere & İrlanda"],
  role: ["Growth liderleri", "CMO'lar", "Pazarlama direktörleri", "Kurucular"],
};

export const signalOptions = [
  "Yatırım turu açıklandı",
  "İşe alım artışı (growth rolleri)",
  "Ajans sözleşmesi bitiyor",
  "Ürün lansmanı yaklaşıyor",
  "Basında görünürlük artışı",
  "Pazar genişlemesi",
  "Yeniden markalaşma / birleşme",
  "Liderlik değişikliği",
];

export const defaultSignals = [
  "Yatırım turu açıklandı",
  "İşe alım artışı (growth rolleri)",
  "Ürün lansmanı yaklaşıyor",
];

export const matchingUniverse = 2880;
export const dailyPull = 10;

export const approvals: Approval[] = [
  {
    company: "Nexora Retail",
    initials: "NR",
    contact: "Elif Kaya",
    reason:
      "Geçen salı $8M Series A turu aldı ve 6 büyüme pozisyonu ilanı yayınladı.",
    tint: "lime",
  },
  {
    company: "Halka Studio",
    initials: "HS",
    contact: "Deniz Acar",
    reason: "Dün Webrazzi'de yer aldı; Körfez pazarı açılımını duyuruyor.",
    tint: "lime",
  },
  {
    company: "Moda Loop",
    initials: "ML",
    contact: "Camille Roux",
    reason:
      "Black Friday kampanya brief'i şirket içinde dolaşıyor; mevcut ajansları yetişemiyor.",
    tint: "pink",
  },
];
