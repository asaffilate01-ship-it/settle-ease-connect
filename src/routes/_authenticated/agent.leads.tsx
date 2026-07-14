import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAgentFunnel } from "@/lib/agents.functions";
import { TrendingUp, Users, Send, CreditCard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/agent/leads")({
  head: () => ({ meta: [{ title: "Leads & funnel — Agent" }] }),
  component: LeadsPage,
});

const STAGE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  invited: Send,
  signed_up: Users,
  subscribed: CreditCard,
  paying: CheckCircle2,
};

function LeadsPage() {
  const fn = useServerFn(getMyAgentFunnel);
  const { data, isLoading } = useQuery({
    queryKey: ["agent", "funnel"],
    queryFn: () => fn(),
  });

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  const maxCount = Math.max(1, ...data.stages.map((s) => s.count));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-semibold">Leads &amp; funnel</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Track every lead from first invite to paying subscriber. Optimise where you're losing conversion.
        </p>
      </div>

      {/* Top summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Last 30 days" value={data.recent30d} hint="new leads" />
        <SummaryCard label="Churned" value={data.churned} hint="canceled subs" tone="danger" />
        <SummaryCard label="Paid earnings" value={`€${data.earnings.paidEur.toFixed(2)}`} hint="lifetime" tone="success" />
        <SummaryCard label="Pending" value={`€${data.earnings.pendingEur.toFixed(2)}`} hint="commissions" tone="muted" />
      </div>

      {/* Funnel */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-4 font-medium">Conversion funnel</h2>
        <div className="space-y-3">
          {data.stages.map((s, i) => {
            const Icon = STAGE_ICON[s.key] ?? Send;
            const pct = Math.round((s.count / maxCount) * 100);
            const dropoff = i > 0 ? data.stages[i - 1].count - s.count : 0;
            const stageRate = i > 0 && data.stages[i - 1].count
              ? Math.round((s.count / data.stages[i - 1].count) * 100)
              : 100;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="flex w-40 shrink-0 items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{s.label}</span>
                </div>
                <div className="flex-1">
                  <div className="relative h-9 overflow-hidden rounded-md bg-muted/40">
                    <div
                      className="h-full bg-gradient-to-r from-primary/70 to-primary/40 transition-all"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                      <span className="font-semibold tabular-nums">{s.count}</span>
                      {i > 0 && (
                        <span className="text-muted-foreground">
                          {stageRate}% conv{dropoff > 0 ? ` · ${dropoff} dropped` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 border-t border-border/40 pt-4 sm:grid-cols-3 text-xs">
          <ConvStat label="Invite → Signup" value={`${data.conv.inviteToSignup}%`} />
          <ConvStat label="Signup → Subscribe" value={`${data.conv.signupToSub}%`} />
          <ConvStat label="Subscribe → Paying" value={`${data.conv.subToPaying}%`} />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard title="By product" data={data.byProduct} />
        <BreakdownCard title="By source" data={data.bySource} />
      </div>

      {/* Recent leads */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-4 py-3 flex items-center justify-between">
          <h2 className="font-medium">Recent leads</h2>
          <span className="text-xs text-muted-foreground">{data.referrals.length} shown</span>
        </div>
        <div className="max-h-[500px] overflow-y-auto divide-y divide-border/40">
          {data.referrals.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{r.referred_email ?? "—"}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {r.product} · {r.source ?? "manual"} · {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge variant={r.status === "converted" ? "default" : r.status === "pending" ? "secondary" : "outline"} className="text-[10px] uppercase">
                {r.status}
              </Badge>
            </div>
          ))}
          {data.referrals.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No leads yet. Share your referral link to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "muted" | "success" | "danger";
}) {
  const cls =
    tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : tone === "danger" ? "border-red-200 bg-red-50 text-red-800"
    : tone === "muted" ? "border-border/60 bg-muted/40"
    : "border-primary/20 bg-primary/5 text-primary";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-70">{hint}</div>}
    </div>
  );
}

function ConvStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/60 px-3 py-2">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="mb-3 font-medium">{title}</h3>
      {entries.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">No data yet.</div>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, n]) => {
            const pct = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{key}</span>
                  <span className="text-muted-foreground tabular-nums">{n} · {pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-muted/40">
                  <div className="h-full bg-primary/60" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
