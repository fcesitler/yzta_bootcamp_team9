import {
  getDashboardStats,
  getAgentActivity,
  getDailyActivity,
  getApprovalQueue,
} from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatsGrid, StatItem } from "@/components/dashboard/stats-grid";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ApprovalQueue } from "@/components/dashboard/approval-queue";

export default async function DashboardPage() {
  const [stats, activity, daily, queue, supabase] = await Promise.all([
    getDashboardStats(),
    getAgentActivity(),
    getDailyActivity(14),
    getApprovalQueue(4),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const firstName = (profile?.full_name ?? user?.email ?? "Kullanıcı").split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-baseline justify-between gap-6">
        <h1 className="text-[28px] font-medium leading-tight tracking-tight text-text-strong">
          Günaydın, {firstName}
        </h1>
        {stats.activeCampaign ? (
          <p className="text-[15px] text-text-muted">
            Kampanya:{" "}
            <span className="font-medium text-text-strong">
              {stats.activeCampaign.name}
            </span>
          </p>
        ) : (
          <p className="text-[15px] text-text-muted">Aktif kampanya yok</p>
        )}
      </div>

      {/* Satır 1 — 4 eşit KPI kolonu */}
      <StatsGrid>
        <StatItem><MetricCard metric={stats.metrics[0]!} sparkline /></StatItem>
        {stats.metrics.slice(1).map((m) => (
          <StatItem key={m.label}><MetricCard metric={m} /></StatItem>
        ))}
      </StatsGrid>

      {/* Satır 2 — 14 günlük trend + pipeline (huninin tek kaynağı) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart points={daily} />
        </div>
        <PipelineFunnel stages={stats.pipelineStages} />
      </div>

      {/* Satır 3 — aksiyon kuyruğu + agent aktivitesi */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ApprovalQueue leads={queue.leads} total={queue.total} />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed items={activity.slice(0, 5)} />
        </div>
      </div>
    </div>
  );
}
