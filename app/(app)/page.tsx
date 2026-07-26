import { getDashboardStats, getAgentActivity } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ConversionDonut } from "@/components/dashboard/conversion-donut";

export default async function DashboardPage() {
  const [stats, activity, supabase] = await Promise.all([
    getDashboardStats(),
    getAgentActivity(),
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
    <div className="mx-auto max-w-5xl">
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

      {/* Hero card (row-span-2 on lg) + 6 regular cards */}
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        <MetricCard
          metric={stats.metrics[0]!}
          hero
          className="sm:col-span-4 lg:col-span-1 lg:row-span-2"
        />
        {stats.metrics.slice(1).map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      {/* Pipeline · Conversion gauge · Activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <PipelineFunnel stages={stats.pipelineStages} />
        <ConversionDonut stages={stats.pipelineStages} />
        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}
