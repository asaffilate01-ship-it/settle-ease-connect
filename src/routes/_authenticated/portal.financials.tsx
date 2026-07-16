import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFinancials, listRecentExpenses } from "@/lib/portal.functions";
import { TrendingUp, TrendingDown, Wallet, Receipt, Users, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Aal2Gate } from "@/components/security/aal2-gate";

export const Route = createFileRoute("/_authenticated/portal/financials")({
  head: () => ({ meta: [{ title: "Financials — Staff" }] }),
  component: FinancialsPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function FinancialsPage() {
  const [months, setMonths] = useState(6);
  const finFn = useServerFn(getFinancials);
  const expFn = useServerFn(listRecentExpenses);

  const { data, isLoading } = useQuery({
    queryKey: ["portal", "financials", months],
    queryFn: () => finFn({ data: { months } }),
  });
  const { data: expenses } = useQuery({
    queryKey: ["portal", "financials", "expenses"],
    queryFn: () => expFn(),
  });

  const totals = data?.totals;
  const outstanding = data?.outstanding;
  const rows = data?.months ?? [];
  const lastMonth = rows[rows.length - 1];
  const prevMonth = rows[rows.length - 2];
  const trend = lastMonth && prevMonth && prevMonth.revenue > 0
    ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
    : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-semibold">Financials</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, expenses and P&amp;L across BeistandPlus — subscriptions, case invoices, expert payouts and agent commissions.
          </p>
        </div>
        <div className="flex gap-2">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                months === m ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {isLoading || !totals ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue"
              value={fmt(totals.revenue)}
              hint={`${months}m total`}
              trend={trend}
              icon={<TrendingUp className="h-4 w-4" />}
              tone="primary"
            />
            <KpiCard
              label="Expert payouts"
              value={fmt(totals.expertPayouts)}
              hint="COGS"
              icon={<Users className="h-4 w-4" />}
              tone="muted"
            />
            <KpiCard
              label="Agent commissions"
              value={fmt(totals.agentCommissions)}
              hint="COGS"
              icon={<Receipt className="h-4 w-4" />}
              tone="muted"
            />
            <KpiCard
              label="Gross profit"
              value={fmt(totals.grossProfit)}
              hint={`${totals.revenue ? Math.round((totals.grossProfit / totals.revenue) * 100) : 0}% margin`}
              icon={totals.grossProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              tone={totals.grossProfit >= 0 ? "success" : "danger"}
            />
          </div>

          {/* Outstanding */}
          {outstanding && (
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Outstanding liabilities
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniStat label="Held in escrow" value={fmt(outstanding.heldInEscrow)} />
                <MiniStat label="Pending expert payouts" value={fmt(outstanding.pendingExpertPayouts)} />
                <MiniStat label="Pending agent commissions" value={fmt(outstanding.pendingAgentCommissions)} />
              </div>
            </div>
          )}

          {/* P&L table */}
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="font-medium">Profit &amp; loss — monthly</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Period</th>
                    <th className="px-3 py-2 text-right">Subs MRR</th>
                    <th className="px-3 py-2 text-right">Case invoices</th>
                    <th className="px-3 py-2 text-right">Revenue</th>
                    <th className="px-3 py-2 text-right">Expert payouts</th>
                    <th className="px-3 py-2 text-right">Agent commissions</th>
                    <th className="px-3 py-2 text-right">Platform fees</th>
                    <th className="px-3 py-2 text-right">Gross profit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-t border-border/40">
                      <td className="px-3 py-2 font-medium">{r.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(r.subscriptionRevenue)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(r.invoiceRevenue)}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(r.revenue)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">−{fmt(r.expertPayouts)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">−{fmt(r.agentCommissions)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{fmt(r.platformFees)}</td>
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${r.grossProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {fmt(r.grossProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(totals.subscriptionRevenue)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(totals.invoiceRevenue)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(totals.revenue)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">−{fmt(totals.expertPayouts)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">−{fmt(totals.agentCommissions)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{fmt(totals.platformFees)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${totals.grossProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {fmt(totals.grossProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Recent expenses */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-3 flex items-center justify-between">
                <h2 className="font-medium">Recent expert payouts</h2>
                <span className="text-xs text-muted-foreground">{expenses?.payouts.length ?? 0} items</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border/40">
                {(expenses?.payouts ?? []).slice(0, 20).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.experts?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.experts?.profession ?? p.kind} · {p.period_month?.slice(0, 7) ?? p.created_at?.slice(0, 10)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={p.status === "paid" ? "outline" : "secondary"} className="text-[10px]">
                        {p.status}
                      </Badge>
                      <span className="tabular-nums font-medium">{fmt(Number(p.amount_eur ?? 0))}</span>
                    </div>
                  </div>
                ))}
                {(!expenses?.payouts || expenses.payouts.length === 0) && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No payouts yet.</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-3 flex items-center justify-between">
                <h2 className="font-medium">Recent agent commissions</h2>
                <span className="text-xs text-muted-foreground">{expenses?.commissions.length ?? 0} items</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border/40">
                {(expenses?.commissions ?? []).slice(0, 20).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.product}</div>
                      <div className="text-xs text-muted-foreground">
                        Agent {c.agent_user_id?.slice(0, 8)} · {c.period_month?.slice(0, 7)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={c.status === "paid" ? "outline" : "secondary"} className="text-[10px]">
                        {c.status}
                      </Badge>
                      <span className="tabular-nums font-medium">{fmt(Number(c.commission_eur ?? 0))}</span>
                    </div>
                  </div>
                ))}
                {(!expenses?.commissions || expenses.commissions.length === 0) && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No commissions yet.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  trend,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number;
  icon?: React.ReactNode;
  tone?: "primary" | "muted" | "success" | "danger";
}) {
  const toneClass =
    tone === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : tone === "danger" ? "text-red-700 bg-red-50 border-red-200"
    : tone === "muted" ? "text-muted-foreground bg-muted/40 border-border/60"
    : "text-primary bg-primary/5 border-primary/20";
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide opacity-80">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs opacity-70">
        {hint && <span>{hint}</span>}
        {typeof trend === "number" && trend !== 0 && (
          <span className={trend > 0 ? "text-emerald-700" : "text-red-600"}>
            {trend > 0 ? "▲" : "▼"} {Math.abs(Math.round(trend))}%
          </span>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
