import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, AlertTriangle, Clock, Users2 } from "lucide-react";
import { getMyDesk } from "@/lib/case-manager-desk.functions";
import { PortalHeader } from "@/components/portal/portal-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/portal/my-desk")({
  head: () => ({ meta: [{ title: "My desk — BeistandPlus" }] }),
  component: MyDesk,
});

function slaTone(state: string) {
  if (state === "breached") return "destructive" as const;
  if (state === "at_risk") return "outline" as const;
  return "secondary" as const;
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function MyDesk() {
  const load = useServerFn(getMyDesk);
  const q = useQuery({
    queryKey: ["my-desk"],
    queryFn: () => load({}),
    refetchInterval: 60_000,
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your desk…
      </div>
    );
  }
  if (q.error || !q.data) {
    return <div className="p-6 text-sm text-destructive">Failed to load desk.</div>;
  }
  const d = q.data;

  return (
    <div className="space-y-6">
      <PortalHeader
        eyebrow="Case manager"
        title="My desk"
        subtitle="Your open cases, tasks due, and pending partner responses — refreshed every 60 s."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Users2 className="h-3.5 w-3.5" /> Open cases
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{d.openCasesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" /> SLA breached
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
              {d.breachedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Tasks overdue
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{d.overdueTaskCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Partner invites pending
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {d.pendingPartners.length}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My cases</CardTitle>
          </CardHeader>
          <CardContent>
            {d.myCases.length === 0 ? (
              <div className="text-sm text-muted-foreground">No open cases assigned to you.</div>
            ) : (
              <ul className="divide-y">
                {d.myCases.map((c) => (
                  <li
                    key={c.case_id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <Link
                      to="/app/cases/$caseId"
                      params={{ caseId: c.case_id }}
                      className="min-w-0 flex-1 truncate hover:underline"
                    >
                      {c.title}
                      <span className="ml-2 text-xs text-muted-foreground">
                        · {c.current_stage ?? c.status}
                      </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge variant={slaTone(c.sla_state)} className="text-[10px]">
                        {c.sla_state}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{fmtDate(c.sla_due_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks due (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {d.myTasks.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nothing due in the next 7 days.</div>
            ) : (
              <ul className="divide-y">
                {d.myTasks.map((t) => {
                  const overdue = t.due_at && new Date(t.due_at) < new Date();
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Link
                        to="/app/cases/$caseId"
                        params={{ caseId: t.case_id }}
                        className="min-w-0 flex-1 truncate hover:underline"
                      >
                        {t.title}
                      </Link>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {overdue ? (
                          <Badge variant="destructive" className="text-[10px]">
                            overdue
                          </Badge>
                        ) : null}
                        <span className="text-xs text-muted-foreground">{fmtDate(t.due_at)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending partner responses</CardTitle>
        </CardHeader>
        <CardContent>
          {d.pendingPartners.length === 0 ? (
            <div className="text-sm text-muted-foreground">No pending partner invitations.</div>
          ) : (
            <ul className="divide-y">
              {d.pendingPartners.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link
                    to="/app/cases/$caseId"
                    params={{ caseId: p.case_id }}
                    className="min-w-0 flex-1 truncate hover:underline"
                  >
                    Case {p.case_id.slice(0, 8)} · {p.role}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    invited {fmtDate(p.invited_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
