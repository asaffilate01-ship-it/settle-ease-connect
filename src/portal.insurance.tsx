import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Shield, PhoneCall, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInsuranceConsole } from "@/lib/portal.functions";
import { SubConsoleTabs, EmptyTab, useSubConsoleTab } from "@/components/portal/sub-console-tabs";

export const Route = createFileRoute("/_authenticated/portal/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance Ops — Portal" },
      { name: "description", content: "Insurance leads pipeline, callbacks and active policies for insurance admins." },
    ],
  }),
  component: InsuranceConsole,
});

function InsuranceConsole() {
  const fn = useServerFn(getInsuranceConsole);
  const { data, isLoading } = useQuery({ queryKey: ["portal", "insurance"], queryFn: () => fn() });
  const [tab, setTab] = useSubConsoleTab();

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">Insurance operations</h1>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        Insurance leads pipeline, pending callbacks, and the active policy book — scoped to the insurance admin console.
      </p>

      <SubConsoleTabs active={tab} onChange={setTab} />

      {tab === "leads" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Total leads" value={data.leadTotal} />
            <Kpi label="Open" value={data.openLeads} tone="primary" />
            <Kpi label="Callbacks" value={data.callbackCount} icon={<PhoneCall className="h-4 w-4" />} />
            <Kpi label="Converted" value={data.converted} tone="success" />
            <Kpi label="Conversion" value={`${data.conversion}%`} icon={<TrendingUp className="h-4 w-4" />} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h2 className="mb-3 font-medium">Pipeline by status</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.byStatus).map(([s, n]) => (
                  <Badge key={s} variant="outline" className="gap-1 text-xs">
                    {s} <span className="tabular-nums">· {n as number}</span>
                  </Badge>
                ))}
                {Object.keys(data.byStatus).length === 0 && (
                  <span className="text-sm text-muted-foreground">No leads yet.</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <h2 className="mb-3 font-medium">By product</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.byProduct).map(([p, n]) => (
                  <Badge key={p} variant="outline" className="gap-1 text-xs">
                    {p} <span className="tabular-nums">· {n as number}</span>
                  </Badge>
                ))}
                {Object.keys(data.byProduct).length === 0 && (
                  <span className="text-sm text-muted-foreground">No products yet.</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="font-medium">Recent leads</h2>
            </div>
            <div className="max-h-[500px] divide-y divide-border/40 overflow-y-auto">
              {data.leads.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.full_name || l.email || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.product_line ?? "—"}
                      {l.carrier_partner ? ` · ${l.carrier_partner}` : ""}
                      {" · "}
                      {l.estimated_premium_min != null || l.estimated_premium_max != null
                        ? `est. €${Number(l.estimated_premium_min ?? 0)}${l.estimated_premium_max ? `–€${l.estimated_premium_max}` : ""}/mo`
                        : ""}
                      {l.source ? ` · ${l.source}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{l.status ?? "new"}</Badge>
                  </div>
                </div>
              ))}
              {data.leads.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No leads yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "quotes" && (
        <EmptyTab>Insurance quotes are issued by carrier partners once a callback is completed.</EmptyTab>
      )}

      {tab === "callbacks" && (
        <div className="rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-4 py-3">
            <h2 className="font-medium">Callbacks queue</h2>
          </div>
          <div className="max-h-[500px] divide-y divide-border/40 overflow-y-auto">
            {data.callbacks.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.full_name || c.email || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.product_line ?? "—"} · {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {data.callbacks.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No callbacks pending.</div>
            )}
          </div>
        </div>
      )}

      {tab === "reconciliation" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Est. monthly pipeline" value={`€${data.monthlyPipeline.toLocaleString()}`} tone="primary" />
            <Kpi label="Active health policies" value={data.activePolicies.health} />
            <Kpi label="Active funeral policies" value={data.activePolicies.funeral} />
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="font-medium">Recent policies</h2>
            </div>
            <div className="max-h-[420px] divide-y divide-border/40 overflow-y-auto">
              {[
                ...data.recentHealth.map((h: any) => ({
                  id: `h-${h.id}`,
                  title: `${h.kasse ?? "Health"} — ${h.kind ?? ""}`,
                  sub: `${h.tariff ?? ""}${h.monthly_premium_cents ? ` · €${(h.monthly_premium_cents / 100).toFixed(2)}/mo` : ""}`,
                  when: h.updated_at,
                })),
                ...data.recentFuneral.map((f: any) => ({
                  id: `f-${f.id}`,
                  title: `${f.insurer_name ?? "Funeral"}`,
                  sub: `${f.benefit_eur ? `€${f.benefit_eur} cover` : ""}${f.premium_eur ? ` · €${f.premium_eur}/mo` : ""}${f.status ? ` · ${f.status}` : ""}`,
                  when: f.updated_at,
                })),
              ]
                .sort((a, b) => (new Date(b.when).getTime() - new Date(a.when).getTime()))
                .slice(0, 20)
                .map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{row.title}</div>
                      <div className="text-xs text-muted-foreground">{row.sub}</div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {row.when ? new Date(row.when).toLocaleDateString() : ""}
                    </div>
                  </div>
                ))}
              {data.recentHealth.length === 0 && data.recentFuneral.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No active policies yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number | string;
  tone?: "primary" | "success";
  icon?: React.ReactNode;
}) {
  const toneCls =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-emerald-600 dark:text-emerald-300"
        : "";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-semibold ${toneCls}`}>{value}</div>
    </div>
  );
}
