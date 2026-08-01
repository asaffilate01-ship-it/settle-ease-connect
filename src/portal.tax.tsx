import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Receipt, TrendingUp, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTaxConsole } from "@/lib/portal.functions";
import { SubConsoleTabs, EmptyTab, useSubConsoleTab } from "@/components/portal/sub-console-tabs";

export const Route = createFileRoute("/_authenticated/portal/tax")({
  head: () => ({ meta: [{ title: "Tax console — Staff" }] }),
  component: TaxConsole,
});

function TaxConsole() {
  const fn = useServerFn(getTaxConsole);
  const { data, isLoading } = useQuery({ queryKey: ["portal", "tax"], queryFn: () => fn() });
  const [tab, setTab] = useSubConsoleTab();

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">Tax operations</h1>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        Tax leads pipeline, estimated refunds, and filings status across BeistandPlus tax admins.
      </p>

      <SubConsoleTabs active={tab} onChange={setTab} />

      {tab === "leads" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <Kpi label="Total leads" value={data.total} />
            <Kpi label="Est. refund pool" value={`€${data.estRefundTotal.toLocaleString()}`} tone="primary" />
            <Kpi label="Filed / won" value={data.won} tone="success" />
            <Kpi label="Conversion" value={`${data.conversion}%`} icon={<TrendingUp className="h-4 w-4" />} />
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="mb-3 font-medium">Pipeline by status</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.byStatus).map(([s, n]) => (
                <Badge key={s} variant="outline" className="gap-1 text-xs">
                  {s} <span className="tabular-nums">· {n as number}</span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="font-medium">Recent leads</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-border/40">
              {data.leads.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.full_name || l.email || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      Tax year {l.tax_year ?? "—"} · Income €{Number(l.gross_income_eur ?? 0).toLocaleString()} · {l.source ?? "web"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm tabular-nums text-emerald-700">
                      {l.estimated_refund_eur ? `€${Number(l.estimated_refund_eur).toLocaleString()}` : "—"}
                    </span>
                    <Badge variant={l.status === "filed" || l.status === "won" ? "default" : "secondary"} className="text-[10px] uppercase">
                      {l.status === "filed" || l.status === "won" ? <CheckCircle2 className="mr-1 h-3 w-3" /> : null}
                      {l.status ?? "new"}
                    </Badge>
                  </div>
                </div>
              ))}
              {data.leads.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">No tax leads yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "quotes" && (
        <EmptyTab>Tax filings are quoted via the case workspace. Open a lead to send a quote.</EmptyTab>
      )}
      {tab === "callbacks" && (
        <EmptyTab>No callback queue for tax leads — advisors reach out via message on the case.</EmptyTab>
      )}
      {tab === "reconciliation" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Filed / won" value={data.won} tone="success" />
          <Kpi label="Est. refund pool" value={`€${data.estRefundTotal.toLocaleString()}`} tone="primary" />
          <Kpi label="Conversion" value={`${data.conversion}%`} />
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone = "muted", icon }: { label: string; value: string | number; tone?: "muted" | "primary" | "success"; icon?: React.ReactNode }) {
  const cls =
    tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : tone === "primary" ? "border-primary/20 bg-primary/5 text-primary"
    : "border-border/60 bg-muted/40";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide opacity-80">
        <span>{label}</span>{icon}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
