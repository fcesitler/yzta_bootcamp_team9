"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const company = formData.get("company") as string;
  const role = formData.get("role") as string;
  const sector = formData.get("sector") as string;

  await supabase
    .from("profiles")
    .update({ company, role, sector, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect("/");
}
