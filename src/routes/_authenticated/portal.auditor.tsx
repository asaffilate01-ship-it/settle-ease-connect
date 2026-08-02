import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, ClipboardCheck, Eye, FileLock2 } from "lucide-react";
import { Aal2Gate } from "@/components/security/aal2-gate";
import { Badge } from "@/components/ui/badge";
import { listAudit } from "@/lib/audit.functions";
import { listComplianceActions, listPrivacyRequests } from "@/lib/governance.functions";

export const Route = createFileRoute("/_authenticated/portal/auditor")({ component: AuditorPage });

type AuditEvent = {
  id: string | number;
  action: string;
  actor_email: string | null;
  actor_user_id: string | null;
  created_at: string;
  entity_type: string | null;
};
type ComplianceEvidence = {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
};
type PrivacyEvidence = {
  id: string;
  request_type: string;
  requester_email: string;
  due_at: string;
  status: string;
};

function AuditorPage() {
  const auditFn = useServerFn(listAudit);
  const complianceFn = useServerFn(listComplianceActions);
  const privacyFn = useServerFn(listPrivacyRequests);
  const audit = useQuery({
    queryKey: ["auditor", "audit"],
    queryFn: () => auditFn({ data: { limit: 100 } }),
  });
  const compliance = useQuery({
    queryKey: ["auditor", "compliance"],
    queryFn: () => complianceFn(),
  });
  const privacy = useQuery({ queryKey: ["auditor", "privacy"], queryFn: () => privacyFn() });
  const actions = (compliance.data?.rows ?? []) as ComplianceEvidence[];
  const requests = (privacy.data?.rows ?? []) as PrivacyEvidence[];
  const events = (audit.data ?? []) as AuditEvent[];
  return (
    <Aal2Gate reason="The independent audit console exposes restricted evidence. Confirm MFA to continue.">
      <div className="space-y-6">
        <header>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Eye className="h-4 w-4" /> Read-only assurance
          </div>
          <h1 className="display-lg mt-1 font-semibold">Auditor console</h1>
          <p className="text-sm text-muted-foreground">
            Immutable evidence view. This role cannot change operational, privacy or compliance
            records.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card icon={ClipboardCheck} label="Compliance actions" value={actions.length} />
          <Card icon={FileLock2} label="Privacy requests" value={requests.length} />
          <Card icon={Activity} label="Recent audit events" value={events.length} />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Open compliance evidence">
            {actions
              .filter((row) => row.status !== "closed")
              .slice(0, 15)
              .map((row) => (
                <Row
                  key={row.id}
                  title={row.title}
                  subtitle={`${row.category.replace(/_/g, " ")} · ${row.severity}`}
                  badge={row.status}
                />
              ))}
          </Panel>
          <Panel title="Data-subject request register">
            {requests.slice(0, 15).map((row) => (
              <Row
                key={row.id}
                title={row.request_type.replace(/_/g, " ")}
                subtitle={`${row.requester_email} · due ${new Date(row.due_at).toLocaleDateString()}`}
                badge={row.status}
              />
            ))}
          </Panel>
        </div>
        <Panel title="Recent immutable audit trail">
          {events.slice(0, 40).map((row) => (
            <Row
              key={row.id}
              title={row.action}
              subtitle={`${row.actor_email ?? row.actor_user_id ?? "system"} · ${new Date(row.created_at).toLocaleString()}`}
              badge={row.entity_type ?? "event"}
            />
          ))}
        </Panel>
      </div>
    </Aal2Gate>
  );
}
function Card({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-4 py-3 font-medium">{title}</div>
      <div className="divide-y">{children}</div>
    </section>
  );
}
function Row({ title, subtitle, badge }: { title: string; subtitle: string; badge: string }) {
  return (
    <div className="flex items-center gap-3 p-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <Badge variant="outline">{badge.replace(/_/g, " ")}</Badge>
    </div>
  );
}
