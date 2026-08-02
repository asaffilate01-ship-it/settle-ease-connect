import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plane, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getNewArrivalsConsole } from "@/lib/portal.functions";
import { SubConsoleTabs, EmptyTab, useSubConsoleTab } from "@/components/portal/sub-console-tabs";

export const Route = createFileRoute("/_authenticated/portal/new-arrivals")({
  head: () => ({ meta: [{ title: "New arrivals — Staff" }] }),
  component: NewArrivalsConsole,
});

function NewArrivalsConsole() {
  const fn = useServerFn(getNewArrivalsConsole);
  const { data, isLoading } = useQuery({
    queryKey: ["portal", "new-arrivals"],
    queryFn: () => fn(),
  });
  const [tab, setTab] = useSubConsoleTab();

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Plane className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">New arrivals</h1>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        Integration playbooks, housing/registration cases, embassy contacts.
      </p>

      <SubConsoleTabs active={tab} onChange={setTab} />

      {tab === "leads" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Total cases" value={data.totalCases} />
            <Kpi label="New this month" value={data.newThisMonth} tone="primary" />
            <Kpi label="Open" value={data.openCases} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-3 font-medium">Recent cases</div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-border/40">
                {data.cases.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Priority {c.priority ?? "—"} · Updated{" "}
                        {new Date(c.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {c.status}
                    </Badge>
                  </div>
                ))}
                {data.cases.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No cases yet.</div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-3 font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Embassies
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-border/40">
                {data.embassies.map((e: any) => (
                  <div key={e.id} className="px-4 py-2.5 text-sm">
                    <div className="font-medium">{e.country}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.city ?? "—"} · {e.phone ?? "no phone"}
                    </div>
                  </div>
                ))}
                {data.embassies.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No embassies configured.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "quotes" && (
        <EmptyTab>
          Relocation quotes are sent per case by assigned experts (immigration, tax, housing).
        </EmptyTab>
      )}
      {tab === "callbacks" && (
        <EmptyTab>New-arrival cases are handled asynchronously via case messaging.</EmptyTab>
      )}
      {tab === "reconciliation" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Total cases" value={data.totalCases} />
          <Kpi label="New this month" value={data.newThisMonth} tone="primary" />
          <Kpi label="Open" value={data.openCases} />
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string | number;
  tone?: "muted" | "primary";
}) {
  const cls =
    tone === "primary"
      ? "border-primary/20 bg-primary/5 text-primary"
      : "border-border/60 bg-muted/40";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
