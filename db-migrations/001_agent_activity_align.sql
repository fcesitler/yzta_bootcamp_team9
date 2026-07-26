-- agent_activity: canonical "rich" schema
-- run-campaign.ts ve app-side logActivity() bu kolonlara yazar:
--   campaign_id, lead_id, owner_id, step, status, summary, created_at
-- Bu migration canlı tabloyu bu şekle hizalar. Idempotent — tekrar çalıştırmak güvenli.
-- Supabase SQL Editor'de çalıştır.

-- 1) Zengin şema kolonlarını ekle (yoksa)
alter table public.agent_activity add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;
alter table public.agent_activity add column if not exists lead_id     uuid references public.leads(id)     on delete set null;
alter table public.agent_activity add column if not exists owner_id    uuid references auth.users(id)        on delete cascade;
alter table public.agent_activity add column if not exists step        text;
alter table public.agent_activity add column if not exists status      text;
alter table public.agent_activity add column if not exists summary     text;
alter table public.agent_activity add column if not exists created_at  timestamptz not null default now();

-- 2) Eski şema taslaklarından kalan kolonları nullable yap ki
--    onları vermeyen insert'ler patlamasın (agent / action / message).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='agent_activity' and column_name='agent') then
    execute 'alter table public.agent_activity alter column agent drop not null';
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='agent_activity' and column_name='action') then
    execute 'alter table public.agent_activity alter column action drop not null';
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='agent_activity' and column_name='message') then
    execute 'alter table public.agent_activity alter column message drop not null';
  end if;
end $$;

-- 3) Dashboard feed için sıralama indexi
create index if not exists agent_activity_created_at_idx on public.agent_activity (created_at desc);

-- 4) RLS: owner bazlı okuma. Server-side yazımlar service-role ile RLS'i baypas eder;
--    dashboard okuması (anon + oturum) sadece kendi satırlarını görsün.
alter table public.agent_activity enable row level security;

drop policy if exists agent_activity_owner_select on public.agent_activity;
create policy agent_activity_owner_select on public.agent_activity
  for select using (owner_id = auth.uid());
