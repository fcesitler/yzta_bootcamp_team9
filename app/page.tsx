import { activeCampaign, currentUser, metrics } from "@/lib/mock";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { ApprovalList } from "@/components/dashboard/approval-list";

export default function DashboardPage() {
  const firstName = currentUser.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-baseline justify-between gap-6">
        <h1 className="text-[28px] font-medium leading-tight tracking-tight text-text-strong">
          Günaydın, {firstName}
        </h1>
        <p className="text-[15px] text-text-muted">
          Kampanya:{" "}
          <span className="font-medium text-text-strong">
            {activeCampaign.name}
          </span>
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      <div className="mt-4">
        <PipelineFunnel />
      </div>

      <div className="mt-4">
        <ApprovalList />
      </div>
    </div>
  );
}
