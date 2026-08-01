import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Plus } from "lucide-react";
import { Aal2Gate } from "@/components/security/aal2-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listComplianceActions, saveComplianceAction } from "@/lib/governance.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/compliance")({
  component: CompliancePage,
});
const CATEGORIES = [
  "general",
  "gdpr",
  "security",
  "legal_copy",
  "partner_due_diligence",
  "incident",
  "access_review",
  "retention",
] as const;
const STATUSES = [
  "open",
  "in_progress",
  "blocked",
  "ready_for_review",
  "closed",
  "accepted_risk",
] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;
type ComplianceAction = {
  id?: string;
  title: string;
  description: string | null;
  category: (typeof CATEGORIES)[number];
  severity: (typeof SEVERITIES)[number];
  status: (typeof STATUSES)[number];
  due_at: string | null;
  resolution: string | null;
};

function CompliancePage() {
  const listFn = useServerFn(listComplianceActions);
  const saveFn = useServerFn(saveComplianceAction);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-actions"],
    queryFn: () => listFn(),
  });
  const rows = (data?.rows ?? []) as ComplianceAction[];
  const [editing, setEditing] = useState<ComplianceAction | null>(null);
  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          id: editing!.id,
          title: editing!.title,
          description: editing!.description || null,
          category: editing!.category,
          severity: editing!.severity,
          status: editing!.status,
          dueAt: editing!.due_at ? new Date(editing!.due_at).toISOString() : null,
          resolution: editing!.resolution || null,
        },
      }),
    onSuccess: async () => {
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["compliance-actions"] });
      toast.success("Compliance action saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const overdue = rows.filter(
    (row) => row.due_at && new Date(row.due_at) < new Date() && row.status !== "closed",
  ).length;
  return (
    <Aal2Gate reason="Compliance actions contain restricted operational evidence. Confirm MFA to continue.">
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <ClipboardCheck className="h-4 w-4" /> Governance
            </div>
            <h1 className="display-lg mt-1 font-semibold">Compliance console</h1>
            <p className="text-sm text-muted-foreground">
              Track controls, incidents, reviews, evidence and remediation ownership.
            </p>
          </div>
          {!data?.readOnly && (
            <Button
              onClick={() =>
                setEditing({
                  title: "",
                  description: "",
                  category: "general",
                  severity: "medium",
                  status: "open",
                  due_at: "",
                  resolution: "",
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New action
            </Button>
          )}
        </header>
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi
            label="Open actions"
            value={rows.filter((row) => !["closed", "accepted_risk"].includes(row.status)).length}
          />
          <Kpi
            label="Critical"
            value={
              rows.filter((row) => row.severity === "critical" && row.status !== "closed").length
            }
            danger
          />
          <Kpi label="Overdue" value={overdue} danger={overdue > 0} />
        </div>
        {editing && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
            className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2"
          >
            <Field label="Title">
              <Input
                required
                value={editing.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={editing.due_at?.slice(0, 10) ?? ""}
                onChange={(event) => setEditing({ ...editing, due_at: event.target.value })}
              />
            </Field>
            <Field label="Category">
              <Choice
                value={editing.category}
                values={CATEGORIES}
                onChange={(value) => setEditing({ ...editing, category: value })}
              />
            </Field>
            <Field label="Severity">
              <Choice
                value={editing.severity}
                values={SEVERITIES}
                onChange={(value) => setEditing({ ...editing, severity: value })}
              />
            </Field>
            <Field label="Status">
              <Choice
                value={editing.status}
                values={STATUSES}
                onChange={(value) => setEditing({ ...editing, status: value })}
              />
            </Field>
            <div />
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea
                  rows={4}
                  value={editing.description ?? ""}
                  onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Resolution / decision">
                <Textarea
                  rows={3}
                  value={editing.resolution ?? ""}
                  onChange={(event) => setEditing({ ...editing, resolution: event.target.value })}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                Save action
              </Button>
            </div>
          </form>
        )}
        <section className="overflow-hidden rounded-2xl border bg-card">
          {isLoading ? (
            <div className="p-8 text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">No compliance actions.</div>
          ) : (
            <div className="divide-y">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  disabled={data?.readOnly}
                  onClick={() => setEditing({ ...row })}
                  className="flex w-full flex-wrap items-center gap-4 p-4 text-left hover:bg-muted/30 disabled:cursor-default"
                >
                  <Severity value={row.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.category.replace(/_/g, " ")} · due{" "}
                      {row.due_at ? new Date(row.due_at).toLocaleDateString() : "not set"}
                    </div>
                  </div>
                  <Badge variant="outline">{row.status.replace(/_/g, " ")}</Badge>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </Aal2Gate>
  );
}
function Kpi({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-4 ${danger && value ? "border-red-500/30" : ""}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-display text-3xl font-semibold ${danger && value ? "text-red-700" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
function Choice<T extends string>({
  value,
  values,
  onChange,
}: {
  value: T;
  values: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {values.map((item) => (
          <SelectItem key={item} value={item}>
            {item.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function Severity({ value }: { value: string }) {
  const danger = value === "critical" || value === "high";
  return (
    <div
      className={`grid h-9 w-9 place-items-center rounded-xl ${danger ? "bg-red-500/10 text-red-700" : "bg-muted text-muted-foreground"}`}
    >
      {danger ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
    </div>
  );
}
