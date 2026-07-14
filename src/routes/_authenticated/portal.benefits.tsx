import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getBenefitsConsole } from "@/lib/portal.functions";
import { SubConsoleTabs, EmptyTab, useSubConsoleTab } from "@/components/portal/sub-console-tabs";

export const Route = createFileRoute("/_authenticated/portal/benefits")({
  head: () => ({ meta: [{ title: "Benefits console — Staff" }] }),
  component: BenefitsConsole,
});

function BenefitsConsole() {
  const fn = useServerFn(getBenefitsConsole);
  const { data, isLoading } = useQuery({ queryKey: ["portal", "benefits"], queryFn: () => fn() });
  const [tab, setTab] = useSubConsoleTab();

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <HeartHandshake className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">Benefits operations</h1>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        Benefit applications, referrals, and funeral-cover leads.
      </p>

      <SubConsoleTabs active={tab} onChange={setTab} />

      {tab === "leads" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <Kpi label="Referral leads" value={data.referralTotal} />
            <Kpi label="Open referrals" value={data.openReferrals} tone="primary" />
            <Kpi label="Funeral leads" value={data.funeralTotal} />
            <Kpi label="Open funeral" value={data.openFuneral} tone="primary" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <List title="Recent referrals" rows={data.recentReferrals} labelKey="referred_email" subKey="product" />
            <List title="Recent funeral leads" rows={data.recentFuneral} labelKey="full_name" subKey="plan_type" />
          </div>
        </div>
      )}

      {tab === "quotes" && (
        <EmptyTab>Benefit-related quotes (funeral cover, group cover) are issued by carrier partners on approved leads.</EmptyTab>
      )}
      {tab === "callbacks" && (
        <EmptyTab>Benefits leads are processed via referral partners — no in-app callback queue.</EmptyTab>
      )}
      {tab === "reconciliation" && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Kpi label="Referral leads" value={data.referralTotal} />
          <Kpi label="Open referrals" value={data.openReferrals} tone="primary" />
          <Kpi label="Funeral leads" value={data.funeralTotal} />
          <Kpi label="Open funeral" value={data.openFuneral} tone="primary" />
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone = "muted" }: { label: string; value: string | number; tone?: "muted" | "primary" }) {
  const cls = tone === "primary" ? "border-primary/20 bg-primary/5 text-primary" : "border-border/60 bg-muted/40";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function List({ title, rows, labelKey, subKey }: { title: string; rows: any[]; labelKey: string; subKey: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">{rows.length}</span>
      </div>
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium">{r[labelKey] ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{r[subKey] ?? "—"}</div>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">{r.status ?? "new"}</Badge>
          </div>
        ))}
        {rows.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No data.</div>}
      </div>
    </div>
  );
}
