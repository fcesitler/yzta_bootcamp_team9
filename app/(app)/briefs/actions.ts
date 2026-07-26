"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ContractInput {
  scope: string;
  amount: number;
  currency: string;
  billing: string;
  term: string;
  start_date: string;
}

export async function closeDeal(leadId: string, input: ContractInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const admin = createAdminClient();

  const { error: stageErr } = await admin
    .from("leads")
    .update({ stage: "won" })
    .eq("id", leadId);
  if (stageErr) return { error: "Lead güncellenemedi." };

  const { error: contractErr } = await admin.from("contracts").insert({
    owner_id: user.id,
    lead_id: leadId,
    scope: input.scope,
    amount: input.amount,
    currency: input.currency,
    billing: input.billing,
    term: input.term,
    start_date: input.start_date,
    status: "draft",
  });
  if (contractErr) return { error: "Sözleşme oluşturulamadı." };

  revalidatePath("/briefs");
  revalidatePath("/close");
  return { success: true };
}

export async function loseDeal(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .update({ stage: "lost" })
    .eq("id", leadId);
  if (error) return { error: "Lead güncellenemedi." };

  revalidatePath("/briefs");
  return { success: true };
}
