import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export type UserInfo = {
  name: string;
  email: string;
  role: string;
  initials: string;
};

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: UserInfo;
}) {
  return (
    <div className="flex h-full">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
