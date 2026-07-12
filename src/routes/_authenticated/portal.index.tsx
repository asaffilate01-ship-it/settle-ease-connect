import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getOpsConsole } from "@/lib/portal.functions";
import { PortalHeader } from "@/components/portal/portal-header";
import { KpiTile } from "@/components/portal/kpi-tile";
import { QueueRow, type QueueItem, type QueueItemKind } from "@/components/portal/queue-row";
import { ActivityItem } from "@/components/portal/activity-item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Radio } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({ meta: [{ title: "Operations console — Beistand" }] }),
  component: OpsConsole,
});

const KIND_LABEL: Record<QueueItemKind, string> = {
  lead: "Leads",
  case: "Cases",
  invite: "Invites",
  bug: "Bugs",
  quote: "Quotes",
  invoice: "Invoices",
};

function OpsConsole() {
  const { roles } = useCurrentUser();
  const isAdmin = roles.includes("admin");
  const [win, setWin] = useState<"today" | "7d" | "30d">("today");
  const [scope, setScope] = useState<"all" | "mine">(isAdmin ? "all" : "mine");
  const [kindFilter, setKindFilter] = useState<"all" | QueueItemKind>("all");

  const load = useServerFn(getOpsConsole);
  const q = useQuery({
    queryKey: ["ops-console", win, scope],
    queryFn: () => load({ data: { window: win, scope } }),
    refetchInterval: 60_000,
  });

  const data = q.data;
  const queue: QueueItem[] = data?.queue ?? [];
  const filteredQueue = kindFilter === "all" ? queue : queue.filter((r) => r.kind === kindFilter);
  const kindCounts = queue.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});

  const outstanding = data?.kpis.outstanding_amount_cents.value ?? 0;
  const avgHrs = data?.kpis.avg_first_contact_hours.value;

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Operations"
        title="Operations console"
        subtitle="Priority queue, live KPIs, and team activity for the case-manager team."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
              <Radio className="h-3 w-3 animate-pulse" /> Live · 60s
            </span>
            <Select value={win} onValueChange={(v) => setWin(v as any)}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Select value={scope} onValueChange={(v) => setScope(v as any)}>
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="mine">Just me</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        }
      />

      {q.isLoading && (
        <div className="grid place-items-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {q.error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {(q.error as Error).message}
        </div>
      )}

      {data && (
        <div className="grid gap-4 lg:grid-cols-3">
          <KpiTile
            label={win === "today" ? "New leads today" : "New leads"}
            value={data.kpis.leads.value}
            deltaPct={data.kpis.leads.deltaPct}
            deltaLabel="vs previous"
            sparkline={data.kpis.leads.sparkline}
            to="/portal/leads"
          />
          <KpiTile
            label="Leads won"
            value={data.kpis.won.value}
            deltaPct={data.kpis.won.deltaPct}
            deltaLabel="vs previous"
            to="/portal/leads"
          />
          <KpiTile
            label="Active cases"
            value={data.kpis.active_cases.value}
            sparkline={data.kpis.active_cases.sparkline}
            to="/app/cases"
          />
          <KpiTile
            label="Stalled cases"
            value={data.kpis.stalled_cases.value}
            hint="No update in 48h+"
            intent="inverse"
            to="/app/cases"
          />
          <KpiTile
            label="Outstanding invoices"
            value={`€${(outstanding / 100).toLocaleString("de-DE", { maximumFractionDigits: 0 })}`}
            hint="Sent + overdue"
            intent="inverse"
          />
          <KpiTile
            label="Avg first-contact time"
            value={avgHrs == null ? "—" : `${avgHrs.toFixed(1)}h`}
            hint="Lead created → first status change"
            intent="inverse"
          />
        </div>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Priority queue */}
          <section className="rounded-2xl border border-border/60 bg-card shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <div>
                <h2 className="font-display text-base font-semibold">Needs attention</h2>
                <p className="text-xs text-muted-foreground">
                  Ranked by urgency. Click any row to act.
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <ChipButton
                  active={kindFilter === "all"}
                  onClick={() => setKindFilter("all")}
                  count={queue.length}
                >
                  All
                </ChipButton>
                {(Object.keys(KIND_LABEL) as QueueItemKind[]).map((k) => {
                  const c = kindCounts[k] ?? 0;
                  if (c === 0) return null;
                  return (
                    <ChipButton
                      key={k}
                      active={kindFilter === k}
                      onClick={() => setKindFilter(k)}
                      count={c}
                    >
                      {KIND_LABEL[k]}
                    </ChipButton>
                  );
                })}
              </div>
            </div>
            {filteredQueue.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                🎉 Nothing on fire. Great job.
              </div>
            ) : (
              <div>
                {filteredQueue.map((item) => (
                  <QueueRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </section>

          {/* Right column */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-border/60 bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <div>
                  <h2 className="font-display text-base font-semibold">My work</h2>
                  <p className="text-xs text-muted-foreground">Assigned to you</p>
                </div>
                <Badge variant="outline">{data.my_work.length}</Badge>
              </div>
              {data.my_work.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nothing assigned to you right now.
                </div>
              ) : (
                data.my_work.map((item) => (
                  <QueueRow key={`mine-${item.kind}-${item.id}`} item={item} />
                ))
              )}
            </section>

            <section className="rounded-2xl border border-border/60 bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <h2 className="font-display text-base font-semibold">Team activity</h2>
                <Link to="/portal/leads" className="text-xs text-primary hover:underline">
                  Details →
                </Link>
              </div>
              {data.activity.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No recent activity.
                </div>
              ) : (
                data.activity.map((entry) => (
                  <ActivityItem key={`${entry.kind}-${entry.id}-${entry.at}`} entry={entry} />
                ))
              )}
            </section>
          </div>
        </div>
      )}

      {data && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/portal/leads">Insurance inbox</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/portal/knowledge">Knowledge base</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/portal/experts">Expert roster</Link>
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" asChild>
                <Link to="/portal/admin/users">Users & roles</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/portal/admin/invite">Invitations</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/60 bg-background text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
      <span className="tabular-nums text-[10px] opacity-70">{count}</span>
    </button>
  );
}
