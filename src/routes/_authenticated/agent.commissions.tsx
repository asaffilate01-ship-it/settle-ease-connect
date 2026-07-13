import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyCommissions } from "@/lib/agents.functions";

export const Route = createFileRoute("/_authenticated/agent/commissions")({
  head: () => ({ meta: [{ title: "Agent — commissions" }] }),
  component: AgentCommissions,
});

function AgentCommissions() {
  const listFn = useServerFn(listMyCommissions);
  const { data = [] } = useQuery({ queryKey: ["agent", "commissions"], queryFn: () => listFn() });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Commissions</h1>
        <p className="mt-1 text-muted-foreground">
          Paid monthly, calculated as 5% of the monthly subscription fee for each client you referred.
          Third-party costs (insurance, funeral) are excluded from the commission base.
        </p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Period</th>
              <th className="p-3">Product</th>
              <th className="p-3 text-right">Gross</th>
              <th className="p-3 text-right">Rate</th>
              <th className="p-3 text-right">Commission</th>
              <th className="p-3">Status</th>
              <th className="p-3">Paid at</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-t border-border/40">
                <td className="p-3">{r.period_month}</td>
                <td className="p-3">{r.product}</td>
                <td className="p-3 text-right tabular-nums">€{Number(r.gross_eur).toFixed(2)}</td>
                <td className="p-3 text-right tabular-nums">{Number(r.commission_rate).toFixed(2)}%</td>
                <td className="p-3 text-right font-medium tabular-nums">€{Number(r.commission_eur).toFixed(2)}</td>
                <td className="p-3 capitalize">{r.status}</td>
                <td className="p-3 text-muted-foreground">{r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No commissions yet — they appear after your first referred client's subscription is billed.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
