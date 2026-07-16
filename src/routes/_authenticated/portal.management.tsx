import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getManagementKpis } from "@/lib/management-kpi.functions";
import { PortalHeader } from "@/components/portal/portal-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal/management")({
  head: () => ({ meta: [{ title: "Management dashboard — BeistandPlus" }] }),
  component: ManagementDashboard,
});

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}

function ManagementDashboard() {
  const load = useServerFn(getManagementKpis);
  const q = useQuery({
    queryKey: ["management-kpis"],
    queryFn: () => load({}),
    refetchInterval: 60_000,
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading KPIs…
      </div>
    );
  }
  if (q.error || !q.data) {
    return <div className="p-6 text-sm text-destructive">Failed to load KPIs.</div>;
  }
  const d = q.data;

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Management"
        title="Executive dashboard"
        subtitle="Growth, revenue, referrals, operations, and quality — refreshed every 60 s."
      />

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Growth & revenue</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="New leads (30d)" value={d.newLeads30d} sub={`${d.activeLeads} still active`} />
          <Kpi label="Conversion rate" value={`${d.conversionRatePct}%`} sub={`${d.convertedLeads30d} won / 30d`} />
          <Kpi label="Active members" value={d.activeMembers} />
          <Kpi label="MRR" value={`€${d.mrrEur.toLocaleString()}`} />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Referrals</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="DELA referrals (30d)" value={d.delaReferrals30d} />
          <Kpi label="DELA acceptance rate" value={`${d.delaAcceptanceRatePct}%`} />
          <Kpi label="Insurance referrals (30d)" value={d.insuranceReferrals30d} />
          <Kpi label="Triage backlog" value={d.insuranceTriageBacklog} sub="Untriaged leads" />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Case operations</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Active cases" value={d.activeCases} />
          <Kpi label="SLA breaches" value={d.breachedCases} sub={d.breachedCases > 0 ? "Attention required" : "On track"} />
          <Kpi label="Closed (30d)" value={d.closedCases30d} />
          <Kpi label="Avg resolution" value={d.avgResolutionDays !== null ? `${d.avgResolutionDays} d` : "—"} />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Quality</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="CSAT (avg)" value={d.csatAvg !== null ? d.csatAvg : "—"} sub={`${d.csatCount30d} responses / 30d`} />
          <Kpi label="Open complaints" value={d.openComplaints} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Staff workload — top 10</CardTitle></CardHeader>
          <CardContent>
            {d.staffWorkload.length === 0 ? (
              <div className="text-sm text-muted-foreground">No open cases assigned yet.</div>
            ) : (
              <ul className="divide-y">
                {d.staffWorkload.map((s) => (
                  <li key={s.user_id} className="flex items-center justify-between py-2 text-sm">
                    <span>{s.name ?? s.user_id.slice(0, 8)}</span>
                    <Badge variant="secondary">{s.open_cases} open</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Provider performance — top 10</CardTitle></CardHeader>
          <CardContent>
            {d.providerPerformance.length === 0 ? (
              <div className="text-sm text-muted-foreground">No partner assignments yet.</div>
            ) : (
              <ul className="divide-y">
                {d.providerPerformance.map((p) => (
                  <li key={p.org_id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate pr-2">{p.name}</span>
                    <span className="flex gap-1.5 text-xs">
                      <Badge variant="secondary">✓ {p.accepted}</Badge>
                      <Badge variant="outline">… {p.pending}</Badge>
                      <Badge variant="destructive">✕ {p.declined}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
