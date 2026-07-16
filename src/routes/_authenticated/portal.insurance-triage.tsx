import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Download, Info, ShieldAlert, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  listInsuranceLeadsForTriage,
  setTriage,
  triageStats,
  TRIAGE_ROUTES,
} from "@/lib/insurance-triage.functions";
import { exportInsuranceLeadsCsv } from "@/lib/insurance-export.functions";

const leadsQ = queryOptions({
  queryKey: ["triage", "leads"],
  queryFn: () => listInsuranceLeadsForTriage({ data: { onlyUntriaged: true } }),
});
const statsQ = queryOptions({ queryKey: ["triage", "stats"], queryFn: () => triageStats() });

export const Route = createFileRoute("/_authenticated/portal/insurance-triage")({
  head: () => ({ meta: [{ title: "Insurance Triage — BeistandPlus" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(leadsQ),
      context.queryClient.ensureQueryData(statsQ),
    ]),
  component: TriagePage,
  errorComponent: ({ error }) => (
    <div className="p-6 flex items-center gap-2 text-destructive">
      <AlertTriangle className="h-5 w-5" /> {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

const ROUTE_META: Record<string, { label: string; hint: string; tone: string }> = {
  statutory: {
    label: "Statutory (GKV)",
    hint: "Income below threshold, employee, family insured. Refer to GKV signup / Familienversicherung support.",
    tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  private: {
    label: "Private (PKV)",
    hint: "Above threshold, self-employed, civil servant. Requires regulated advisor — hand to DELA / licensed broker.",
    tone: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  student: {
    label: "Student",
    hint: "Under 30 / enrolled. Statutory student rate — direct enrolment guidance.",
    tone: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  },
  employee: {
    label: "Employee (standard)",
    hint: "Employer handles statutory contribution. Provide onboarding checklist.",
    tone: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  },
  self_employed: {
    label: "Self-employed",
    hint: "Choice between PKV/GKV. Regulated advice required for PKV — route to licensed advisor.",
    tone: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  family: {
    label: "Family insured",
    hint: "Family co-insurance (Familienversicherung). Guidance only, no advice.",
    tone: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  },
  needs_regulated_assessment: {
    label: "Needs regulated assessment",
    hint: "Complex case (chronic conditions, prior PKV, cross-border). Hand to licensed advisor.",
    tone: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

function TriagePage() {
  const { data: leads } = useSuspenseQuery(leadsQ);
  const { data: stats } = useSuspenseQuery(statsQ);
  const exportCsv = useServerFn(exportInsuranceLeadsCsv);

  async function handleExport() {
    try {
      const res = await exportCsv({});
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `insurance-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.count} leads`);
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="display-lg font-semibold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" /> Health insurance triage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Route customers to the correct path. BeistandPlus is an introducer — not a regulated advisor.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </header>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Not advice</AlertTitle>
        <AlertDescription>
          Triage records the customer's category based on facts they provide. It is not insurance advice or a suitability
          assessment. Regulated advice must be provided by a licensed advisor (DELA or authorised broker).
        </AlertDescription>
      </Alert>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Untriaged" value={stats.untriaged ?? 0} highlight />
        {TRIAGE_ROUTES.map((r) => (
          <StatCard key={r} label={ROUTE_META[r].label} value={stats[r] ?? 0} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Untriaged leads ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nothing to triage — good work.</p>
          ) : (
            <div className="divide-y">
              {leads.map((lead) => (
                <TriageRow key={lead.id} lead={lead} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/50" : ""}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function TriageRow({ lead }: { lead: any }) {
  const [route, setRoute] = useState<string>("");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const doSet = useServerFn(setTriage);

  const mut = useMutation({
    mutationFn: () => doSet({ data: { id: lead.id, route: route as any, notes: notes || undefined } }),
    onSuccess: () => {
      toast.success("Triage recorded");
      qc.invalidateQueries({ queryKey: ["triage"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{lead.full_name}</div>
          <div className="text-xs text-muted-foreground">
            {lead.email}
            {lead.phone && <> · {lead.phone}</>}
            {lead.age && <> · Age {lead.age}</>}
            {lead.product_line && <> · {lead.product_line}</>}
            {lead.preferred_language && <> · {lead.preferred_language.toUpperCase()}</>}
          </div>
        </div>
        <Badge variant="outline">{lead.stage}</Badge>
      </div>

      <div className="grid gap-2 md:grid-cols-[240px_1fr_auto] items-start">
        <Select value={route} onValueChange={setRoute}>
          <SelectTrigger><SelectValue placeholder="Select route…" /></SelectTrigger>
          <SelectContent>
            {TRIAGE_ROUTES.map((r) => (
              <SelectItem key={r} value={r}>{ROUTE_META[r].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          rows={2}
          placeholder="Factual notes only (income band, employer, family status). No advice."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button disabled={!route || mut.isPending} onClick={() => mut.mutate()}>
          Record
        </Button>
      </div>

      {route && (
        <Alert className={ROUTE_META[route].tone}>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">{ROUTE_META[route].hint}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
