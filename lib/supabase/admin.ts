import { createClient } from "@supabase/supabase-js";

// Sunucu tarafı, RLS'i baypas eden servis-rol istemcisi.
// SADECE server action / route handler / Trigger.dev içinde kullan — asla client'a sızdırma.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
