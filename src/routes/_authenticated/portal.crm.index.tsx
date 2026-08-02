import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { crmInbox, completeFollowUp } from "@/lib/crm.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/crm/")({
  component: CrmInbox,
});

function CrmInbox() {
  const fn = useServerFn(crmInbox);
  const doneFn = useServerFn(completeFollowUp);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["crm-inbox"], queryFn: () => fn() });
  const mut = useMutation({
    mutationFn: (id: string) => doneFn({ data: { id, done: true } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-inbox"] });
      toast.success("Follow-up completed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data)
    return <div className="text-sm text-muted-foreground">Loading inbox…</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New leads"
          value={data.newLeads.length}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatCard
          label="Unassigned"
          value={data.unassigned.length}
          tone="warn"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Follow-ups due"
          value={data.followUpsDue.length}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="SLA at risk"
          value={data.slaBreached.length}
          tone="danger"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follow-ups due</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.followUpsDue.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing due — nice work.</p>
            )}
            {data.followUpsDue.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{f.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(f.due_at).toLocaleString()} · {f.channel ?? "any"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mut.mutate(f.id)}
                  disabled={mut.isPending}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Done
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.newLeads.length === 0 && (
              <p className="text-sm text-muted-foreground">No new leads yet.</p>
            )}
            {data.newLeads.slice(0, 8).map((l) => (
              <Link
                key={l.id}
                to="/portal/crm/leads/$leadId"
                params={{ leadId: l.id }}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm hover:bg-accent/10"
              >
                <div>
                  <div className="font-medium">{l.reference}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.lead_type} · {l.language ?? "—"}
                  </div>
                </div>
                <Badge variant="outline">{l.stage}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.stageCounts).map(([s, n]) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}: {n}
                </Badge>
              ))}
              {Object.keys(data.stageCounts).length === 0 && (
                <p className="text-sm text-muted-foreground">No leads yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open complaints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.openComplaints.length === 0 && (
              <p className="text-sm text-muted-foreground">No open complaints.</p>
            )}
            {data.openComplaints.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.reference} · {c.severity}
                  </div>
                </div>
                <Badge variant="destructive">{c.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "warn" | "danger";
}) {
  const toneClass =
    tone === "danger" ? "text-destructive" : tone === "warn" ? "text-amber-600" : "text-primary";
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-full bg-muted ${toneClass}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
