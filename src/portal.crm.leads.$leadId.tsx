import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCrmLead, advanceCrmLeadStage, addCrmActivity, scheduleFollowUp } from "@/lib/crm.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertTriangle, ShieldCheck, CalendarClock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STAGES = [
  "new","contact_attempted","assessed","consented","service_identified",
  "membership_proposed","insurance_referral_offered","referred_to_partner",
  "partner_outcome","onboarded","ongoing","lost",
] as const;

const REGULATED = new Set(["referred_to_partner", "partner_outcome"]);

export const Route = createFileRoute("/_authenticated/portal/crm/leads/$leadId")({
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = Route.useParams();
  const fn = useServerFn(getCrmLead);
  const stageFn = useServerFn(advanceCrmLeadStage);
  const actFn = useServerFn(addCrmActivity);
  const followUpFn = useServerFn(scheduleFollowUp);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["crm-lead", leadId],
    queryFn: () => fn({ data: { id: leadId } }),
  });

  const stageMut = useMutation({
    mutationFn: (stage: (typeof STAGES)[number]) => stageFn({ data: { id: leadId, stage } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-lead", leadId] }); toast.success("Stage updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [note, setNote] = useState("");
  const noteMut = useMutation({
    mutationFn: () => actFn({ data: { lead_id: leadId, kind: "note", body: note } }),
    onSuccess: () => { setNote(""); qc.invalidateQueries({ queryKey: ["crm-lead", leadId] }); toast.success("Note added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [followTitle, setFollowTitle] = useState("");
  const [followWhen, setFollowWhen] = useState("");
  const followMut = useMutation({
    mutationFn: () => followUpFn({ data: { title: followTitle, due_at: new Date(followWhen).toISOString(), lead_id: leadId } }),
    onSuccess: () => { setFollowTitle(""); setFollowWhen(""); qc.invalidateQueries({ queryKey: ["crm-lead", leadId] }); toast.success("Follow-up scheduled"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const l = data.lead;
  const subjectName = data.contact?.full_name ?? data.profile?.full_name ?? "Unknown";

  return (
    <div className="space-y-6">
      <Link to="/portal/crm/leads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Leads
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{l.reference}</div>
            <div className="text-2xl font-semibold">{subjectName}</div>
            <div className="mt-1 text-sm text-muted-foreground">{l.lead_type} · {l.language ?? "—"} · priority {l.priority}</div>
          </div>
          <Badge className="text-sm">{l.stage}</Badge>
        </CardContent>
      </Card>

      {REGULATED.has(l.stage) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-600" />
          <div>
            <div className="font-semibold text-amber-800 dark:text-amber-300">Regulated stage</div>
            <div className="text-xs text-muted-foreground">
              This lead has crossed into regulated insurance territory. Only certified insurance advisors may action further changes.
              Introductory support staff should not give advice on product suitability.
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) noteMut.mutate(); }} className="space-y-2">
              <Textarea placeholder="Add a note or call log…" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" />
              <div className="flex justify-end">
                <Button size="sm" type="submit" disabled={noteMut.isPending || !note.trim()}>Log note</Button>
              </div>
            </form>
            <div className="space-y-2">
              {data.activities.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              {data.activities.map((a: any) => (
                <div key={a.id} className="rounded-lg border border-border/60 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase text-muted-foreground">{a.kind}{a.subject ? ` · ${a.subject}` : ""}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.occurred_at).toLocaleString()}</span>
                  </div>
                  {a.body && <div className="mt-1 whitespace-pre-wrap">{a.body}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Advance stage</CardTitle></CardHeader>
            <CardContent>
              <Select value={l.stage} onValueChange={(v) => stageMut.mutate(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{s.replaceAll("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                <AlertTriangle className="mr-1 inline h-3 w-3" /> Insurance-referral stages require an active consent record.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Follow-up</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (followTitle && followWhen) followMut.mutate(); }}>
                <Input placeholder="What to do…" value={followTitle} onChange={(e) => setFollowTitle(e.target.value)} />
                <Input type="datetime-local" value={followWhen} onChange={(e) => setFollowWhen(e.target.value)} />
                <Button size="sm" type="submit" disabled={followMut.isPending || !followTitle || !followWhen} className="w-full">Schedule</Button>
              </form>
              <div className="mt-3 space-y-1">
                {data.followUps.map((f: any) => (
                  <div key={f.id} className="text-xs flex justify-between">
                    <span className={f.done ? "line-through text-muted-foreground" : ""}>{f.title}</span>
                    <span className="text-muted-foreground">{new Date(f.due_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Consents on file</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {data.consents.length === 0 && <p className="text-muted-foreground text-xs">None. Advance to "consented" only after recording consent on the contact page.</p>}
              {data.consents.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{c.purpose.replaceAll("_", " ")}</span>
                  <Badge variant={c.revoked_at ? "secondary" : "outline"} className="text-[10px]">
                    {c.revoked_at ? "revoked" : "active"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
