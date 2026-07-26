-- Realtime: app tablolarını supabase_realtime publication'ına ekle.
-- components/realtime-refresh.tsx bu tablolardaki postgres_changes olaylarını dinler.
-- Idempotent — tekrar çalıştırmak güvenli. (2026-07-24'te Supabase'e uygulandı.)

do $$ begin
  alter publication supabase_realtime add table public.leads;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.agent_activity;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.campaigns;
exception when duplicate_object then null; end $$;
