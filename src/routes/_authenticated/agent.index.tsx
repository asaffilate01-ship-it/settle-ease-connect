import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyAgentKpis, getMyAgentProfile, listMyReferrals } from "@/lib/agents.functions";

export const Route = createFileRoute("/_authenticated/agent/")({
  head: () => ({ meta: [{ title: "Agent — overview" }] }),
  component: AgentHome,
});

function AgentHome() {
  const kpiFn = useServerFn(getMyAgentKpis);
  const profileFn = useServerFn(getMyAgentProfile);
  const refsFn = useServerFn(listMyReferrals);

  const kpis = useQuery({ queryKey: ["agent", "kpis"], queryFn: () => kpiFn() });
  const profile = useQuery({ queryKey: ["agent", "profile"], queryFn: () => profileFn() });
  const referrals = useQuery({ queryKey: ["agent", "referrals"], queryFn: () => refsFn() });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">Welcome{profile.data?.display_name ? `, ${profile.data.display_name}` : ""}</h1>
        <p className="mt-1 text-muted-foreground">
          Sell subscriptions and funeral cover. Earn{" "}
          <strong>{profile.data?.commission_rate ?? 5}%</strong> recurring on every referred client.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Clients" value={kpis.data?.totalClients ?? 0} />
        <Kpi label="This month" value={`€${(kpis.data?.mtdEur ?? 0).toFixed(2)}`} />
        <Kpi label="Pending" value={`€${(kpis.data?.pendingEur ?? 0).toFixed(2)}`} />
        <Kpi label="Paid to date" value={`€${(kpis.data?.totalEarnedEur ?? 0).toFixed(2)}`} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Recent referrals</h2>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Email</th>
                <th className="p-3">Product</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(referrals.data ?? []).slice(0, 10).map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{r.referred_email ?? "—"}</td>
                  <td className="p-3">{r.product ?? "—"}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                </tr>
              ))}
              {(referrals.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No referrals yet. Share your link from the “Referral link” tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
