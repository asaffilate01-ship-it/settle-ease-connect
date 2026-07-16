import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Heart, Coins, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  campaignAttribution, csatDashboard, listCommissionRows,
  reconcileCommissions, markCommissionPaid,
} from "@/lib/crm-analytics.functions";

const attributionQ = queryOptions({ queryKey: ["crm-attribution"], queryFn: () => campaignAttribution() });
const csatQ = queryOptions({ queryKey: ["crm-csat"], queryFn: () => csatDashboard() });
const commissionQ = queryOptions({ queryKey: ["crm-commission"], queryFn: () => listCommissionRows() });

export const Route = createFileRoute("/_authenticated/portal/analytics")({
  head: () => ({ meta: [{ title: "CRM Analytics — BeistandPlus" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(attributionQ),
      context.queryClient.ensureQueryData(csatQ),
      context.queryClient.ensureQueryData(commissionQ),
    ]);
  },
  component: AnalyticsPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

const eur = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="display-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" /> CRM analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Campaign attribution, customer satisfaction, and partner commission reconciliation.
        </p>
      </header>

      <Tabs defaultValue="attribution">
        <TabsList>
          <TabsTrigger value="attribution"><BarChart3 className="h-4 w-4 mr-1" /> Attribution</TabsTrigger>
          <TabsTrigger value="csat"><Heart className="h-4 w-4 mr-1" /> CSAT / NPS</TabsTrigger>
          <TabsTrigger value="reconciliation"><Coins className="h-4 w-4 mr-1" /> Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="attribution" className="mt-4"><AttributionPanel /></TabsContent>
        <TabsContent value="csat" className="mt-4"><CsatPanel /></TabsContent>
        <TabsContent value="reconciliation" className="mt-4"><ReconciliationPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function AttributionPanel() {
  const { data } = useSuspenseQuery(attributionQ);
  const totalLeads = data.reduce((s, r) => s + r.leads, 0);
  const totalConverted = data.reduce((s, r) => s + r.converted, 0);
  const totalRevenue = data.reduce((s, r) => s + r.revenue_eur, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Leads (UTM)" value={totalLeads.toString()} />
        <Kpi label="Converted to members" value={totalConverted.toString()} />
        <Kpi label="Revenue attributed" value={eur(totalRevenue)} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">By campaign</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>
                  <th className="p-3">Source</th>
                  <th className="p-3">Medium</th>
                  <th className="p-3">Campaign</th>
                  <th className="p-3 text-right">Leads</th>
                  <th className="p-3 text-right">Converted</th>
                  <th className="p-3 text-right">CVR</th>
                  <th className="p-3 text-right">Revenue</th>
                  <th className="p-3 text-right">LTV / member</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No UTM-tagged leads yet.</td></tr>
                ) : data.map((r, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-3">{r.utm_source ?? "—"}</td>
                    <td className="p-3">{r.utm_medium ?? "—"}</td>
                    <td className="p-3">{r.utm_campaign ?? "—"}</td>
                    <td className="p-3 text-right">{r.leads}</td>
                    <td className="p-3 text-right">{r.converted}</td>
                    <td className="p-3 text-right">{r.conversion_rate}%</td>
                    <td className="p-3 text-right">{eur(r.revenue_eur)}</td>
                    <td className="p-3 text-right">{eur(r.ltv_eur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CsatPanel() {
  const { data } = useSuspenseQuery(csatQ);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Responses" value={data.count.toString()} />
        <Kpi label="Avg score" value={data.averageScore.toString()} />
        <Kpi label="NPS" value={data.nps.toString()} />
        <Kpi label="Promoters / Passives / Detractors" value={`${data.promoters} · ${data.passives} · ${data.detractors}`} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent feedback</CardTitle></CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No responses yet.</p>
          ) : (
            <ul className="divide-y">
              {data.recent.map((r) => (
                <li key={r.id} className="py-2 flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0">{r.score}/10</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      {r.nps_category ?? "—"} · {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : ""}
                    </div>
                    {r.comments ? <p className="text-sm mt-0.5">{r.comments}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReconciliationPanel() {
  const { data } = useSuspenseQuery(commissionQ);
  const qc = useQueryClient();
  const reconcileFn = useServerFn(reconcileCommissions);
  const markPaidFn = useServerFn(markCommissionPaid);
  const [csv, setCsv] = useState("");

  const reconcile = useMutation({
    mutationFn: (payload: { csv: string }) => reconcileFn({ data: payload }),
    onSuccess: (r) => {
      toast.success(`Reconciled: ${r.matched} matched, ${r.unmatched} unmatched`);
      setCsv("");
      qc.invalidateQueries({ queryKey: ["crm-commission"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: (leadId: string) => markPaidFn({ data: { leadId } }),
    onSuccess: () => {
      toast.success("Marked paid");
      qc.invalidateQueries({ queryKey: ["crm-commission"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Total" value={eur(data.totals.total)} />
        <Kpi label="Paid" value={eur(data.totals.paid)} tone="emerald" />
        <Kpi label="Due" value={eur(data.totals.due)} tone="amber" />
        <Kpi label="Pending" value={eur(data.totals.pending)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Import partner statement (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Columns: <code>policy_reference,amount_paid,paid_at</code>. Rows are matched by <code>policy_reference</code>.
          </p>
          <Textarea
            rows={6}
            placeholder="policy_reference,amount_paid,paid_at&#10;POL-12345,120.00,2026-07-01"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="font-mono text-xs"
          />
          <Button disabled={!csv || reconcile.isPending} onClick={() => reconcile.mutate({ csv })}>
            {reconcile.isPending ? "Reconciling…" : "Reconcile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Commission ledger</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Partner</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Policy ref</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No commission rows yet.</td></tr>
                ) : data.rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="p-3">{r.full_name ?? r.email}</td>
                    <td className="p-3">{r.carrier_partner ?? "—"}</td>
                    <td className="p-3">{r.product_line ?? "—"}</td>
                    <td className="p-3 font-mono text-xs">{r.policy_reference ?? "—"}</td>
                    <td className="p-3"><Badge variant="outline">{r.stage}</Badge></td>
                    <td className="p-3 text-right">{eur(Number(r.commission_amount ?? 0))}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={
                        r.commission_status === "paid" ? "border-emerald-500/40 text-emerald-600"
                        : r.commission_status === "due" ? "border-amber-500/40 text-amber-600"
                        : ""
                      }>{r.commission_status ?? "pending"}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      {r.commission_status !== "paid" ? (
                        <Button size="sm" variant="outline" onClick={() => markPaid.mutate(r.id)}>Mark paid</Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" }) {
  const toneCls =
    tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold ${toneCls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
