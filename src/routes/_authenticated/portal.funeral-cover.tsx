import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { HeartHandshake, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  listFuneralLeadsInternal,
  setFuneralLeadStatus,
  listFuneralPoliciesInternal,
} from "@/lib/funeral-cover.functions";

export const Route = createFileRoute("/_authenticated/portal/funeral-cover")({
  head: () => ({ meta: [{ title: "Funeral cover queue — Staff" }] }),
  component: FuneralCoverAdmin,
});

type StatusKey = "new" | "contacted" | "quoted" | "bound" | "declined" | "withdrawn";

const STATUSES: { key: StatusKey; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "quoted", label: "Quoted" },
  { key: "bound", label: "Bound" },
  { key: "declined", label: "Declined" },
  { key: "withdrawn", label: "Withdrawn" },
];

function FuneralCoverAdmin() {
  const [tab, setTab] = useState<"leads" | "policies">("leads");
  const [status, setStatus] = useState<StatusKey>("new");

  const listLeads = useServerFn(listFuneralLeadsInternal);
  const listPolicies = useServerFn(listFuneralPoliciesInternal);
  const setStatusFn = useServerFn(setFuneralLeadStatus);
  const qc = useQueryClient();

  const leads = useQuery({
    queryKey: ["portal", "funeral", "leads", status],
    queryFn: () => listLeads({ data: { status } }),
    enabled: tab === "leads",
  });

  const policies = useQuery({
    queryKey: ["portal", "funeral", "policies"],
    queryFn: () => listPolicies(),
    enabled: tab === "policies",
  });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: StatusKey; internal_notes?: string }) =>
      setStatusFn({ data: v }),
    onSuccess: () => {
      toast.success("Lead updated");
      qc.invalidateQueries({ queryKey: ["portal", "funeral", "leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <HeartHandshake className="h-4 w-4" /> Funeral cover
        </div>
        <h1 className="display-lg mt-1 font-semibold">Family funeral cover — leads &amp; policies</h1>
        <p className="text-sm text-muted-foreground">
          Household leads from the upgrade page flow here for triage. Once an underwriter binds the policy, log it under "Policies" so the family sees it in-app.
        </p>
      </header>

      <div className="flex gap-2 border-b border-border/60">
        <button
          onClick={() => setTab("leads")}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === "leads" ? "border-primary text-ink" : "border-transparent text-muted-foreground"}`}
        >
          Leads
        </button>
        <button
          onClick={() => setTab("policies")}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === "policies" ? "border-primary text-ink" : "border-transparent text-muted-foreground"}`}
        >
          Bound policies
        </button>
      </div>

      {tab === "leads" && (
        <>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`rounded-full border px-3 py-1 text-xs ${status === s.key ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground"}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {leads.isLoading ? (
            <div className="rounded-2xl border p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (leads.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Nothing in the {status} queue.
            </div>
          ) : (
            <ul className="space-y-3">
              {(leads.data as any[]).map((row) => (
                <LeadCard
                  key={row.id}
                  row={row}
                  onSet={(next, notes) => mut.mutate({ id: row.id, status: next, internal_notes: notes })}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "policies" && (
        <>
          {policies.isLoading ? (
            <div className="rounded-2xl border p-6 text-sm text-muted-foreground">Loading…</div>
          ) : (policies.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No bound policies yet. When an underwriter confirms cover, log it here so the family sees it.
            </div>
          ) : (
            <ul className="space-y-3">
              {(policies.data as any[]).map((p) => (
                <li key={p.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-display text-lg font-semibold">{p.insurer_name}</span>
                    {p.policy_number && (
                      <span className="text-xs text-muted-foreground">#{p.policy_number}</span>
                    )}
                    <Badge variant="outline" className="capitalize">{p.status}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    €{Number(p.benefit_eur).toLocaleString()} benefit · €{Number(p.premium_eur).toFixed(2)} / {p.premium_cadence}
                    {" · "}{p.adults_covered} adult{p.adults_covered === 1 ? "" : "s"}
                    {p.children_covered > 0 && ` + ${p.children_covered} child${p.children_covered === 1 ? "" : "ren"}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function LeadCard({ row, onSet }: { row: any; onSet: (status: StatusKey, notes?: string) => void }) {
  const [notes, setNotes] = useState<string>(row.internal_notes ?? "");
  return (
    <li className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-lg font-semibold">{row.contact_name}</span>
            <Badge variant="outline" className="capitalize">{row.status}</Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
              {row.household_kind} · €{Number(row.target_benefit_eur).toLocaleString()}
            </Badge>
          </div>
          <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
            <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {row.email}</span>
            {row.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {row.phone}</span>}
            {(row.city || row.bundesland) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {[row.city, row.bundesland].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {row.adults_count} adult{row.adults_count === 1 ? "" : "s"}
            {row.children_count > 0 && ` + ${row.children_count} child${row.children_count === 1 ? "" : "ren"}`}
          </div>
          {row.notes && <p className="mt-2 whitespace-pre-line text-sm text-foreground/85">{row.notes}</p>}
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes (visible to staff only)"
            className="mt-3 min-h-16 text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          {(["contacted", "quoted", "bound", "declined"] as StatusKey[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={row.status === s ? "default" : "outline"}
              onClick={() => onSet(s, notes)}
              className="capitalize"
            >
              Mark {s}
            </Button>
          ))}
        </div>
      </div>
    </li>
  );
}
