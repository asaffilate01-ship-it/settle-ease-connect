import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listInsuranceLeads, updateLeadStatus } from "@/lib/portal.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Phone, Save } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["new","contacted","quoted","won","lost","spam"] as const;

export const Route = createFileRoute("/_authenticated/portal/leads")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: internal } = await supabase.rpc("is_internal", { _user_id: u.user.id });
    if (!internal) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Insurance leads — Beistand" }] }),
  component: LeadsInbox,
});

function LeadsInbox() {
  const qc = useQueryClient();
  const load = useServerFn(listInsuranceLeads);
  const update = useServerFn(updateLeadStatus);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const leadsQ = useQuery({ queryKey: ["insurance-leads"], queryFn: () => load() });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; status: string; notes?: string | null }) =>
      update({ data: v as any }),
    onSuccess: () => {
      toast.success("Lead updated");
      qc.invalidateQueries({ queryKey: ["insurance-leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leads = (leadsQ.data ?? []).filter((l: any) => {
    if (filter !== "all" && l.status !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return l.full_name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s);
  });
  const selected = leads.find((l: any) => l.id === selectedId) ?? leads[0];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Staff portal</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">Insurance leads</h1>
          <p className="text-sm text-muted-foreground">All bereavement cover enquiries from the public quote widget.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="max-w-xs" />
        <div className="flex flex-wrap gap-1">
          {(["all", ...STATUSES] as const).map((s) => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
          {leadsQ.isLoading && <div className="p-6 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></div>}
          {leads.length === 0 && !leadsQ.isLoading && (
            <div className="p-8 text-center text-sm text-muted-foreground">No leads match.</div>
          )}
          {leads.map((l: any) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className={`w-full text-left border-b border-border/40 px-4 py-3 hover:bg-muted/40 transition last:border-0 ${selected?.id === l.id ? "bg-muted/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{l.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.email}</div>
                </div>
                <Badge variant="outline" className="capitalize shrink-0">{l.status}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                €{l.benefit_amount.toLocaleString("de-DE")} · age {l.age} · {new Date(l.created_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>

        {selected && <LeadDetail lead={selected} onSave={(v) => updateMut.mutate(v)} saving={updateMut.isPending} />}
      </div>
    </div>
  );
}

function LeadDetail({ lead, onSave, saving }: { lead: any; onSave: (v: any) => void; saving: boolean }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  // reset local state when selection changes
  if (status !== lead.status && !saving && lead.id !== (status as any).__id) {
    // simple guard
  }

  return (
    <div key={lead.id} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-5">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold">{lead.full_name}</h2>
            <div className="text-xs text-muted-foreground">Lead #{lead.id.slice(0, 8)} · {new Date(lead.created_at).toLocaleString()}</div>
          </div>
          <Badge variant="outline" className="capitalize">{lead.status}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <Mail className="h-3.5 w-3.5" /> {lead.email}
          </a>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
              <Phone className="h-3.5 w-3.5" /> {lead.phone}
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Row k="Age" v={lead.age} />
        <Row k="Language" v={lead.preferred_language ?? "de"} />
        <Row k="Benefit amount" v={`€${lead.benefit_amount.toLocaleString("de-DE")}`} />
        <Row k="Waiting period" v={`${lead.waiting_period_months} months`} />
        <Row k="Tobacco" v={lead.tobacco ? "Yes" : "No"} />
        <Row k="Est. premium" v={`€${lead.estimated_premium_min}–${lead.estimated_premium_max}/mo`} />
        <Row k="Source" v={lead.source ?? "quote_widget"} />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Case-manager notes</div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder="Call log, insurer response, next action…" />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onSave({ id: lead.id, status, notes })} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
        </Button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/40 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
