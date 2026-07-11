# Hallederiz — AI SDR · Prompt Dosyası

> Parça parça ilerlemek için: aşağıdaki promptları **sırayla** ver. Her prompt çalışan bir parça üretir.
> Önce tüm frontend mock veriyle ayağa kalkar (Faz A), sonra ekran ekran gerçek backend'e bağlanır (Faz B), en son Sprint 3 + deploy (Faz C).

---

## Kurulum Promptu

Hallederiz ekibi (Team 9) için **AI SDR — Yapay Zekâ Satış Asistanı** panelini sıfırdan inşa edeceğiz. Lütfen önce dosya yapısını ve bir `project_specs.md` dosyasını oluştur; kod yazmaya sonraki promptlarla başlayacağız.

**Proje:** Ajanslar ve B2B hizmet firmaları için hedef müşteri bulan → araştıran → skorlayan → kişiselleştirilmiş mesaj yazan → insan onayından sonra gönderen → yanıtları sınıflandırıp toplantı ayarlayan → satış kapanınca sözleşme hazırlayan no-code + AI satış sistemi. Yaklaşım: **"aza derin"** — az sayıda hedefe gerçek araştırmaya dayalı, yüksek kaliteli temas.

**Teknoloji yığını:**
| Katman | Araç |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) + Tailwind v4 (shadcn kullanılmadı, bileşenler elle) |
| **Sunucu mantığı / API** | **Next.js Route Handlers** (`app/api/*`) — **FastAPI/Python YOK** |
| Kimlik doğrulama | **Supabase Auth** (e-posta/şifre) + `profiles` tablosu |
| Orkestrasyon | Make (native modüller + `ai-local-agent`) |
| Çok-API muhakeme | Trigger.dev — yalnızca `run-campaign` görevi (Find→Research→Score→Write) |
| Tek-çağrı muhakeme | Make native `ai-local-agent` (reply sınıflandırma, brief, sözleşme) |
| Hafıza / DB | Supabase |
| Lead / araştırma | Apollo (Find) · Firecrawl + Tavily (Research) · Claude (Score/Write) |
| Toplantı / sözleşme | Cal.com (Make native) · Google Docs (Make native) |

**Frontend ↔ backend iletişimi (FastAPI neden yok):** No-code kategorisi olduğu için ayrı Python API sunucusu tezimizle çelişir ve gereksiz deploy hedefi ekler. Bunun yerine:
- **Veri:** Frontend Supabase'i `@supabase/supabase-js` (+ SSR için `@supabase/ssr`) ile doğrudan okur/yazar; RLS sahipliği korur.
- **Aksiyonlar (tetikleme/hesap silme gibi hassas işler):** Next.js Route Handler → Make/Trigger.dev webhook'u; service-role key yalnızca sunucuda.
- **Sonuç:** Make/Trigger.dev Supabase'e yazar, panel realtime okur.

**Tasarım referansı — kesin, harfiyen uy:**
- Marka: **"Hallederiz"** (tagline yok — "FEW BUT DEEP" kaldırıldı).
- Renk sistemi: repodaki `design-tokens.css` → palet **"Orman & Limon"**.
  - Birincil/çapa: orman yeşili `#1C4B3C` (buton, aktif nav, başlık vurgu)
  - Vurgu/spark: limon `#B6E82F` (logo spark, funnel highlight, küçük aksanlar — **beyaz üstünde metin olarak kullanma**, kontrast düşük)
  - Sayfa bg sıcak kâğıt `#F3F4EC`, beyaz kart yüzeyi, slate nötr iskele
  - Semantik: amber `#B45309` = uyarı/"senin sıran", kırmızı `#BE123C` = itiraz/hata, yeşil `#3B7A2E` = olumlu
- `design-tokens.css`'i Tailwind theme'ine (CSS değişkenleri) bağla; bileşenler daima token okur, hardcode hex yok.
- Layout: solda ~240px koyu-değil **açık** sidebar (marka + nav + "agents active" widget'ı + kullanıcı kartı), sağda üst arama/aksiyon bar + içerik. Kartlar 12px radius, 0.5px hairline border, gölgesiz-düz.

**Sidebar navigasyonu:** Dashboard · Leads · Conversations · Meeting briefs · Close & Contract (SPRINT 3 rozetli ama **görünür ve gezilebilir**) · Campaign. Girişten sonra alt kullanıcı kartı gerçek oturumu (profil) gösterir.

---

## Ekranlar (spec)

### 1 — Dashboard
- Selamlama ("Good morning, {kullanıcı}") + aktif kampanya bağlamı.
- **7 metrik kartı:** Leads found · Researched · Awaiting approval (amber "your move") · Sent · Replies (+ yanıt oranı) · Meetings · Deals won (+ MRR).
- **Pipeline funnel:** 01 Find → 02 Research → 03 Score → 04 Write; her adımın sayısı + bar. Barlar **lime→sage→forest→koyu forest** geçişli. "Bir adıma tıkla → leads listesini filtrele."
- **"Needs your approval"** listesi: onay bekleyen taslakların firma + kişi + "neden şimdi" özeti.
- Sol altta **"3 agents active"** widget'ı: canlı ajan aktivite satırı (ör. "Research agent is reading Tera Enerji's press coverage…").

### 2 — Campaign
- ICP builder, **cümle formu**: "Find *[rol]* at *[boyut] [sektör]* companies in *[bölge]*" — her değişken bir select.
- **Sinyal çipleri** ("Research agent'ın önceliklendireceği sinyaller"): Fundraise announced, Hiring spike, Agency contract ending, Product launch, Press spike, Market expansion, Rebrand/merger, Leadership change. Çoklu seçim.
- "Matching universe: {N} companies on Apollo · Find agent pulls top {daily_limit}/day".
- **"Save & run campaign"** butonu → `run-campaign`'i tetikler.

### 3 — Leads
- Üstte **status filtre sekmeleri:** Needs approval · Sent · Replied · Meeting booked · Won.
- **Tablo:** Company (logo/inisyal + sektör) | Contact (isim + unvan). Satıra tıkla → lead detay (araştırma özeti + skor + taslak mesaj + durum değiştir).

### 4 — Conversations
- Thread görünümü: gelen yanıt + geçmiş.
- **"AI SUGGESTED REPLY"** kartı: sınıflandırma etiketi (Interested/Objection/Not now) + önerilen yanıt metni.
- Aksiyonlar: **Edit reply · Send reply · Book meeting**.

### 5 — Meeting briefs
- Firma başlığı (sektör · çalışan · konum · domain) + toplantı zamanı/kanal.
- **Key People** (isim, unvan, kısa not) · **Conversation so far** (özet) · **Talking points** (madde madde).

### 6 — Close & Contract *(görünür — SPRINT 3 rozeti bilgi amaçlı, nav kilitli değil)*
- Sol: **Kapanan anlaşmalar** listesi (firma + bedel + durum).
- Sağ: firma başlığı + "Anlaşma kazanıldı" rozeti + **AI'ın doldurduğu sözleşme değişkenleri** (firma, kapsam, bedel, süre, başlangıç) + **belge önizleme** (değişkenler gömülü) + "PDF oluştur" / "Müşteriye gönder".

### 7 — Kimlik doğrulama & hesap *(Faz B0)*
- **/login** (e-posta + şifre), **/signup** (şirket e-postası + şifre + ad), **hesap menüsü** (çıkış / hesap sil).
- Girişsiz kullanıcı korumalı sayfalara erişemez (middleware); giriş yapınca sidebar kullanıcı kartı gerçek profili gösterir.
- **Hesap sil:** onay diyaloğu → Route Handler `supabase.auth.admin.deleteUser` (veri cascade ile gider).

---

## Supabase Veri Modeli

```sql
-- Kimlik: auth.users Supabase tarafından yönetilir. Ek profil verisi:
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Yeni kullanıcı kaydında otomatik profil oluştur
CREATE FUNCTION handle_new_user() RETURNS TRIGGER
  LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icp_role TEXT,
  icp_company_size TEXT,
  icp_industry TEXT,
  icp_geo TEXT,
  signals TEXT[],
  daily_limit INT DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_domain TEXT,
  company_industry TEXT,
  company_size TEXT,
  company_location TEXT,
  contact_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  contact_linkedin TEXT,
  research_summary TEXT,
  why_now TEXT,
  icp_score INT CHECK (icp_score BETWEEN 0 AND 100),
  stage TEXT NOT NULL DEFAULT 'found'
    CHECK (stage IN ('found','researched','scored','drafted','awaiting_approval',
                     'sent','replied','meeting_booked','won','lost')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','linkedin')),
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','sent','received')),
  reply_class TEXT CHECK (reply_class IN ('interested','objection','not_now')),
  suggested_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ,
  duration_min INT DEFAULT 30,
  location TEXT,
  brief_key_people JSONB,
  brief_conversation TEXT,
  brief_talking_points TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE agent_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  agent TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  scope TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'EUR',
  start_date DATE,
  doc_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**RLS (sahiplik bazlı — gerçek auth ile):**
- `profiles`: kullanıcı yalnızca kendi satırını görür/günceller (`id = auth.uid()`).
- `campaigns`: `owner_id = auth.uid()` (tüm işlemler).
- `leads`, `messages`, `meetings`, `agent_activity`, `contracts`: sahiplik zincirini `campaign_id`/`lead_id` üzerinden `campaigns.owner_id = auth.uid()`'e bağlayan politikalarla korunur. Örn:
  ```sql
  ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
  CREATE POLICY leads_owner ON leads USING (
    EXISTS (SELECT 1 FROM campaigns c WHERE c.id = leads.campaign_id AND c.owner_id = auth.uid())
  );
  ```
- Trigger.dev/Make sunucu tarafı yazımları **service-role key** ile RLS'i baypas eder (yalnızca sunucuda).

---

## Backend Çalışma Katmanı (mimari hatırlatma)

- **Trigger.dev'de yalnızca `run-campaign`** var: Find (Apollo) → Research (Firecrawl+Tavily) → Score → Write zincirini **tek görevde** birleştirir (aralarında insan onayı yok). Sonucu Supabase'e `stage='awaiting_approval'` yazar. Make bunu tek webhook'la tetikler.
- **Reply sınıflandırma · Brief · Sözleşme doldurma** kod değil: **Make native `ai-local-agent`** (tek Claude çağrısı → yapılandırılmış JSON). Referans desen: `flow-mail-analysis-hackathon-yzta` (birebir kopyalanmaz, sıfırdan kurulur).
- **Send · Book meeting · Contract e-postası:** Make native modüller (e-posta / Cal.com / Google Docs). İnsan onay noktaları burada.
- **Frontend'in bunları tetiklemesi:** panel → Next.js Route Handler (`app/api/*`) → Make/Trigger.dev webhook. Ayrı bir API sunucusu (FastAPI) yok.

---

## Sonraki Promptlar

### Faz A — Mock veriyle frontend (Sprint 2 başı)

**Prompt A1 — Scaffold + layout + tema**
Next.js 16 (App Router, TS) + Tailwind v4 projesini `hallederiz/` içine kur (shadcn kullanma, bileşenleri elle yaz). `design-tokens.css`'i içe aktarıp Tailwind theme'ine bağla (Orman & Limon). Uygulama kabuğunu oluştur: sol sidebar (marka "Hallederiz" + spark logo — tagline yok, nav item'ları, "3 agents active" widget'ı, alt kullanıcı kartı) + sağ içerik alanı + üst arama/aksiyon bar. Tüm veriler şimdilik `lib/mock.ts`'ten gelsin. `npm run dev` ile başlat, sidebar ve boş içerik alanının göründüğünü doğrula.

**Prompt A2 — Dashboard (mock)**
Dashboard sayfasını spec'e göre kur: 7 metrik kartı + pipeline funnel (lime→forest geçişli barlar, tıklanınca Leads'e yönlendirir) + "Needs your approval" listesi + canlı "agents active" satırı. Mock veriyle doldur. Ekran görüntüsüyle doğrula.

**Prompt A3 — Campaign builder (mock)**
Campaign sayfasını kur: cümle-formu ICP builder (rol/boyut/sektör/bölge select'leri) + çoklu-seçim sinyal çipleri + "Matching universe" satırı + "Save & run campaign" butonu (şimdilik sadece state günceller). Doğrula.

**Prompt A4 — Leads (mock)**
Leads sayfasını kur: status filtre sekmeleri (Needs approval / Sent / Replied / Meeting booked / Won) + firma-kontak tablosu. Satıra tıklayınca sağdan açılan detay drawer (araştırma özeti + skor + taslak mesaj + durum değiştir). Client-side filtre. Doğrula.

**Prompt A5 — Conversations (mock)**
Conversations sayfasını kur: thread görünümü + "AI SUGGESTED REPLY" kartı (sınıflandırma etiketi + önerilen yanıt) + Edit / Send / Book meeting butonları. Doğrula.

**Prompt A6 — Meeting briefs (mock)**
Meeting briefs sayfasını kur: firma başlığı + Key People + Conversation so far + Talking points. Doğrula.

**Prompt A7 — Close & Contract (mock, görünür)**
Close & Contract nav kilidini kaldır (görünür ve gezilebilir, SPRINT 3 rozeti bilgi amaçlı kalsın). Sayfayı kur: sol "Kapanan anlaşmalar" listesi + sağ sözleşme (firma başlığı + "Anlaşma kazanıldı" + AI'ın doldurduğu değişkenler + belge önizleme + PDF/Gönder). Doğrula.

### Faz B — Gerçek backend'e bağlama

**Prompt B0 — Kimlik doğrulama & hesap**
Supabase Auth'u (e-posta/şifre) aç. `/signup` (şirket e-postası + şifre + ad — `full_name` metadata), `/login`, çıkış ve **hesap silme** akışlarını kur. `@supabase/ssr` ile cookie tabanlı oturum + korumalı sayfalar için middleware. Sidebar kullanıcı kartını mock yerine gerçek `profiles` verisinden besle. Hesap silme için Route Handler (`supabase.auth.admin.deleteUser`, service-role, sunucuda) + onay diyaloğu. Kaydol → giriş → çıkış → hesap sil akışını uçtan uca doğrula.

**Prompt B1 — Supabase şema + seed**
Yeni Supabase projesine bağlan; yukarıdaki tabloları (`profiles` + `campaigns` + `leads` + `messages` + `meetings` + `agent_activity` + `contracts`), `handle_new_user` trigger'ını ve **sahiplik bazlı RLS** politikalarını oluştur. Mevcut mock veriyi (bir test kullanıcısına ait) tablolara seed et. Bana dashboard'da adım adım ne yapacağımı (SQL Editor nerede, API key nereden, `.env.local`'e ne eklenecek — anon + service-role) anlat.

**Prompt B2 — Frontend'i Supabase'e bağla**
Dashboard, Leads, Conversations ve Meeting briefs ekranlarını `lib/mock.ts` yerine Supabase'ten okuyacak şekilde bağla (server components + gerektiğinde realtime). "agents active" widget'ını `agent_activity` tablosundan besle. Her ekranın gerçek veriyle çalıştığını doğrula.

**Prompt B3 — `run-campaign` (Trigger.dev)**
Trigger.dev'de `run-campaign` görevini yaz: girdi bir `campaign_id`; Apollo'dan firma çek (Find) → Firecrawl+Tavily+Claude ile araştır ("neden şimdi") → ICP skorla → e-posta + LinkedIn taslağı yaz → Supabase'e `leads` (stage `awaiting_approval`) + `messages` (status `draft`) + `agent_activity` yaz. Tek gerçek firmayla uçtan uca test et, run log'unu göster.

**Prompt B4 — Make: tetikleme + onaylı gönderim**
Make'te iki akış kur: (a) Campaign "Save & run" → webhook → `run-campaign`'i POST et. (b) Panelde onay → Make native e-posta modülüyle gönder → `messages.status='sent'`, `leads.stage='sent'`. Gerçek inbox'a düştüğünü göster.

**Prompt B5 — Reply sınıflandırma (Make native `ai-local-agent`)**
Make'te native e-posta tetikleyici + `ai-local-agent`: gelen yanıtı `interested/objection/not_now` diye sınıflandır + `suggested_reply` üret → `messages` (direction `inbound`) + `leads.stage='replied'`. Conversations ekranını bu veriye bağla; Edit/Send butonlarını çalıştır.

**Prompt B6 — Toplantı + Brief (Make native)**
"Book meeting" → Make native Cal.com modülüyle rezervasyon → `meetings`. Ardından `ai-local-agent` ile brief üret (Key People / Conversation so far / Talking points) → `meetings` brief alanları + `leads.stage='meeting_booked'`. Meeting briefs ekranını bağla.

### Faz C — Sprint 3 + deploy

**Prompt C1 — Close & Contract'ı backend'e bağla**
(Ekran Faz A/A7'de kuruldu.) "Deal won" → Make native `ai-local-agent` sözleşme değişkenlerini (firma, kapsam, bedel, tarih) doldur → Google Docs şablonundan PDF → e-posta ile gönder → `contracts` + `leads.stage='won'`. Mevcut Close & Contract ekranını bu gerçek veriye bağla.

**Prompt C2 — Cilalama + deploy**
Boş durumlar, yükleniyor iskeletleri, hata durumları, responsive kontrol. Vercel'e deploy et. Dogfooding demosu + 3 dk YouTube videosu için akışı uçtan uca bir kez çalıştır.

---

## Doğrulama (uçtan uca demo)
1 gerçek firma gir → araştırma + skor + taslak → onayla → e-posta gönder → inbox'ta göster → panelde aktiviteyi göster → yanıt gelsin → sınıflandırılsın → toplantı ayarlansın → brief üretilsin → "Deal won" → sözleşme gönderilsin. Canlı deploy URL'i üzerinden.
