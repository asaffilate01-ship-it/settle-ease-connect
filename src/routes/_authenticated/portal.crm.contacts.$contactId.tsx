import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getCrmContact,
  getCrmUserRecord,
  addCrmActivity,
  scheduleFollowUp,
  recordConsent,
  revokeConsent,
} from "@/lib/crm.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ShieldCheck,
  PhoneCall,
  Mail,
  MessageSquare,
  CalendarClock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/crm/contacts/$contactId")({
  component: ContactDetail,
});

function ContactDetail() {
  const { contactId } = Route.useParams();
  const isUser = contactId.startsWith("u:");
  const rawId = isUser ? contactId.slice(2) : contactId;

  return isUser ? <UserRecord userId={rawId} /> : <PropectRecord contactId={rawId} />;
}

function PropectRecord({ contactId }: { contactId: string }) {
  const fn = useServerFn(getCrmContact);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["crm-contact", contactId],
    queryFn: () => fn({ data: { id: contactId } }),
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const c = data.contact;

  return (
    <div className="space-y-6">
      <Link
        to="/portal/crm/contacts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <div className="text-2xl font-semibold">{c.full_name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {[c.email, c.phone, c.city].filter(Boolean).join(" · ") || "No contact details"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="uppercase">
              {c.preferred_language}
            </Badge>
            {c.source && <Badge variant="secondary">Source: {c.source}</Badge>}
            {c.campaign && <Badge variant="secondary">Campaign: {c.campaign}</Badge>}
            {c.merged_into_user_id && <Badge variant="default">Merged → member</Badge>}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="leads">Leads ({data.leads.length})</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups ({data.followUps.length})</TabsTrigger>
          <TabsTrigger value="consents">Consents ({data.consents.length})</TabsTrigger>
          <TabsTrigger value="complaints">Complaints ({data.complaints.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <AddActivityForm
            contactId={contactId}
            onDone={() => qc.invalidateQueries({ queryKey: ["crm-contact", contactId] })}
          />
          <ActivityList items={data.activities} />
        </TabsContent>

        <TabsContent value="leads">
          <div className="space-y-2">
            {data.leads.length === 0 && (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            )}
            {data.leads.map((l: any) => (
              <Link
                key={l.id}
                to="/portal/crm/leads/$leadId"
                params={{ leadId: l.id }}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm hover:bg-accent/10"
              >
                <span className="font-medium">
                  {l.reference} · {l.lead_type}
                </span>
                <Badge variant="outline">{l.stage}</Badge>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="followups">
          <ScheduleFollowUpForm
            contactId={contactId}
            onDone={() => qc.invalidateQueries({ queryKey: ["crm-contact", contactId] })}
          />
          <div className="mt-3 space-y-2">
            {data.followUps.map((f: any) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(f.due_at).toLocaleString()}
                  </div>
                </div>
                {f.done ? <Badge variant="secondary">Done</Badge> : <Badge>Open</Badge>}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consents">
          <ConsentPanel contactId={contactId} consents={data.consents} />
        </TabsContent>

        <TabsContent value="complaints">
          <div className="space-y-2">
            {data.complaints.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
            {data.complaints.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{c.subject}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.reference} · {c.severity}
                  </div>
                </div>
                <Badge>{c.status}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserRecord({ userId }: { userId: string }) {
  const fn = useServerFn(getCrmUserRecord);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["crm-user", userId],
    queryFn: () => fn({ data: { userId } }),
  });
  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const p = data.profile;

  return (
    <div className="space-y-6">
      <Link
        to="/portal/crm/contacts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-semibold">{p?.full_name ?? "(no name)"}</div>
              <Badge className="bg-primary/15 text-primary">
                <ShieldCheck className="mr-1 h-3 w-3" /> Member
              </Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {[p?.city].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="uppercase">
              {p?.preferred_language ?? "—"}
            </Badge>
            {data.roles.map((r: string) => (
              <Badge key={r} variant="secondary">
                {r}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="household">Household ({data.family.length})</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="cases">Cases ({data.cases.length})</TabsTrigger>
          <TabsTrigger value="insurance">Insurance ({data.insuranceLeads.length})</TabsTrigger>
          <TabsTrigger value="funeral">
            Funeral ({data.funeralLeads.length + data.funeralPolicies.length})
          </TabsTrigger>
          <TabsTrigger value="consents">Consents ({data.consents.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="complaints">Complaints ({data.complaints.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <Row k="Name" v={p?.full_name} />
              <Row k="City" v={p?.city} />
              <Row k="Language" v={p?.preferred_language} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification preferences</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                {JSON.stringify(data.notifPrefs ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="household">
          <div className="space-y-2">
            {data.family.length === 0 && (
              <p className="text-sm text-muted-foreground">No household members recorded.</p>
            )}
            {data.family.map((m: any) => (
              <div key={m.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <div className="font-medium">
                  {m.full_name}{" "}
                  <span className="text-xs text-muted-foreground">· {m.relationship}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {[m.nationality, m.residency_status].filter(Boolean).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plan">
          <div className="space-y-2">
            {data.subscriptions.length === 0 && (
              <p className="text-sm text-muted-foreground">No subscription.</p>
            )}
            {data.subscriptions.map((s: any) => (
              <div key={s.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{s.plan_code}</div>
                  <Badge>{s.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Renews{" "}
                  {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cases">
          <div className="space-y-2">
            {data.cases.map((c: any) => (
              <Link
                key={c.id}
                to="/app/cases/$caseId"
                params={{ caseId: c.id }}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm hover:bg-accent/10"
              >
                <div>
                  <div className="font-medium">
                    {c.reference} · {c.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.case_type} · {c.language}
                  </div>
                </div>
                <Badge variant={c.urgent ? "destructive" : "outline"}>{c.status}</Badge>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insurance">
          <div className="space-y-2">
            {data.insuranceLeads.length === 0 && (
              <p className="text-sm text-muted-foreground">No insurance referrals.</p>
            )}
            {data.insuranceLeads.map((i: any) => (
              <div key={i.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{i.product_line ?? "Insurance"}</div>
                  <Badge>{i.stage ?? i.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {i.carrier_partner ?? "—"} · commission €{i.commission_amount ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="funeral">
          <div className="space-y-2">
            {[...data.funeralLeads, ...data.funeralPolicies].length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing recorded.</p>
            )}
            {data.funeralPolicies.map((f: any) => (
              <div key={f.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Policy {f.policy_number ?? f.id.slice(0, 8)}</div>
                  <Badge>{f.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consents">
          <ConsentPanel userId={userId} consents={data.consents} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <AddActivityForm
            userId={userId}
            onDone={() => qc.invalidateQueries({ queryKey: ["crm-user", userId] })}
          />
          <ActivityList items={data.activities} />
        </TabsContent>

        <TabsContent value="complaints">
          <div className="space-y-2">
            {data.complaints.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
            {data.complaints.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{c.subject}</div>
                  <div className="text-xs text-muted-foreground">{c.reference}</div>
                </div>
                <Badge>{c.status}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v ?? "—"}</span>
    </div>
  );
}

function ActivityList({ items }: { items: any[] }) {
  const icon = (k: string) =>
    k === "call" ? (
      <PhoneCall className="h-3.5 w-3.5" />
    ) : k === "email" ? (
      <Mail className="h-3.5 w-3.5" />
    ) : (
      <MessageSquare className="h-3.5 w-3.5" />
    );
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
      {items.map((a) => (
        <div key={a.id} className="rounded-lg border border-border/60 p-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
              {icon(a.kind)} {a.kind}
              {a.direction ? ` · ${a.direction}` : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(a.occurred_at).toLocaleString()}
            </div>
          </div>
          {a.subject && <div className="mt-1 font-medium">{a.subject}</div>}
          {a.body && <div className="mt-1 whitespace-pre-wrap text-sm">{a.body}</div>}
        </div>
      ))}
    </div>
  );
}

function AddActivityForm({
  contactId,
  userId,
  onDone,
}: {
  contactId?: string;
  userId?: string;
  onDone: () => void;
}) {
  const fn = useServerFn(addCrmActivity);
  const [kind, setKind] = useState<"call" | "email" | "whatsapp" | "sms" | "meeting" | "note">(
    "note",
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const mut = useMutation({
    mutationFn: () =>
      fn({
        data: {
          contact_id: contactId ?? null,
          user_id: userId ?? null,
          kind,
          subject: subject || null,
          body: body || null,
        },
      }),
    onSuccess: () => {
      toast.success("Logged");
      setSubject("");
      setBody("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div className="flex flex-wrap gap-2">
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["note", "call", "email", "whatsapp", "sms", "meeting"].map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 min-w-40"
            />
          </div>
          <Textarea
            placeholder="What happened?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-20"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Logging…" : "Log"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ScheduleFollowUpForm({
  contactId,
  userId,
  onDone,
}: {
  contactId?: string;
  userId?: string;
  onDone: () => void;
}) {
  const fn = useServerFn(scheduleFollowUp);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const mut = useMutation({
    mutationFn: () =>
      fn({
        data: {
          title,
          due_at: new Date(when).toISOString(),
          contact_id: contactId ?? null,
          user_id: userId ?? null,
          channel: null,
          notes: null,
        },
      }),
    onSuccess: () => {
      toast.success("Follow-up scheduled");
      setTitle("");
      setWhen("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" /> Schedule follow-up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <Input
            placeholder="What to do…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-40"
            required
            minLength={2}
          />
          <Input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            required
            className="w-52"
          />
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : "Schedule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const PURPOSES = [
  "marketing",
  "contact",
  "insurance_referral",
  "data_share_partner",
  "regulated_advice",
] as const;

function ConsentPanel({
  contactId,
  userId,
  consents,
}: {
  contactId?: string;
  userId?: string;
  consents: any[];
}) {
  const grant = useServerFn(recordConsent);
  const revoke = useServerFn(revokeConsent);
  const qc = useQueryClient();
  const key = userId ? ["crm-user", userId] : ["crm-contact", contactId!];

  const grantMut = useMutation({
    mutationFn: (purpose: (typeof PURPOSES)[number]) =>
      grant({
        data: {
          contact_id: contactId ?? null,
          user_id: userId ?? null,
          purpose,
          method: "manual",
          language: null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success("Consent recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const revokeMut = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success("Consent revoked");
    },
  });

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grant consent</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => (
            <Button
              key={p}
              size="sm"
              variant="outline"
              onClick={() => grantMut.mutate(p)}
              disabled={grantMut.isPending}
            >
              + {p.replaceAll("_", " ")}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {consents.length === 0 && (
          <p className="text-sm text-muted-foreground">No consent records yet.</p>
        )}
        {consents.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm"
          >
            <div>
              <div className="font-medium capitalize">{c.purpose.replaceAll("_", " ")}</div>
              <div className="text-xs text-muted-foreground">
                Granted {new Date(c.granted_at).toLocaleString()} {c.method ? `· ${c.method}` : ""}
                {c.revoked_at && <> · revoked {new Date(c.revoked_at).toLocaleString()}</>}
              </div>
            </div>
            {!c.revoked_at && (
              <Button size="sm" variant="ghost" onClick={() => revokeMut.mutate(c.id)}>
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
