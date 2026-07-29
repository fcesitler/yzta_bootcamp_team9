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

  // getUser() yerine getClaims(): middleware zaten oturumu doğruladı, burada
  // ikinci bir ağ gidiş-dönüşü yapmaya gerek yok — JWT yerel doğrulanıyor.
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const userEmail = claims?.claims?.email as string | undefined;

  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company, role, onboarded_at")
    .eq("id", userId)
    .single();

  if (!profile?.onboarded_at) redirect("/onboarding");

  const fullName = profile?.full_name ?? userEmail ?? "Kullanıcı";
  const initials = fullName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const userInfo = {
    name: fullName,
    email: userEmail ?? "",
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
