import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Stethoscope, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMedicalConsole } from "@/lib/portal.functions";
import { SubConsoleTabs, EmptyTab, useSubConsoleTab } from "@/components/portal/sub-console-tabs";

export const Route = createFileRoute("/_authenticated/portal/medical")({
  head: () => ({ meta: [{ title: "Medical console — Staff" }] }),
  component: MedicalConsole,
});

function MedicalConsole() {
  const fn = useServerFn(getMedicalConsole);
  const { data, isLoading } = useQuery({ queryKey: ["portal", "medical"], queryFn: () => fn() });
  const [tab, setTab] = useSubConsoleTab();

  if (isLoading || !data) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold">Medical operations</h1>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">
        Medical roster (doctors, translators, therapists) and active medical cases.
      </p>

      <SubConsoleTabs active={tab} onChange={setTab} />

      {tab === "leads" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Medical experts" value={data.totalExperts} />
            <Kpi label="Verified" value={data.verifiedExperts} tone="success" />
            <Kpi label="Active cases" value={data.activeCases} tone="primary" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-3 font-medium">Roster</div>
              <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
                {data.experts.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium flex items-center gap-1.5">
                        {e.full_name}
                        {e.verified && <ShieldCheck className="h-3 w-3 text-emerald-600" />}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {e.profession} · {e.city ?? "—"}
                      </div>
                    </div>
                    <Badge
                      variant={e.status === "active" ? "outline" : "secondary"}
                      className="text-[10px] uppercase"
                    >
                      {e.status}
                    </Badge>
                  </div>
                ))}
                {data.experts.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No medical experts yet.
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="border-b border-border/60 px-4 py-3 font-medium">Cases</div>
              <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
                {data.cases.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Priority {c.priority ?? "—"}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {c.status}
                    </Badge>
                  </div>
                ))}
                {data.cases.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No active medical cases.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "quotes" && (
        <EmptyTab>Medical quotes are issued per case in the expert workspace.</EmptyTab>
      )}
      {tab === "callbacks" && (
        <EmptyTab>
          Medical requests are routed through case messaging, not a callback queue.
        </EmptyTab>
      )}
      {tab === "reconciliation" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Verified experts" value={data.verifiedExperts} tone="success" />
          <Kpi label="Active cases" value={data.activeCases} tone="primary" />
          <Kpi label="Total roster" value={data.totalExperts} />
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
  tone?: "muted" | "primary" | "success";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "primary"
        ? "border-primary/20 bg-primary/5 text-primary"
        : "border-border/60 bg-muted/40";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
