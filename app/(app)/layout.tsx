import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company, role, onboarded_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded_at) redirect("/onboarding");

  const fullName = profile?.full_name ?? user.email ?? "Kullanıcı";
  const initials = fullName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const userInfo = {
    name: fullName,
    email: user.email ?? "",
    role: profile?.role ?? profile?.company ?? "Ajans",
    initials,
  };

  return (
    <AppShell user={userInfo}>
      <RealtimeRefresh />
      {children}
    </AppShell>
  );
}
