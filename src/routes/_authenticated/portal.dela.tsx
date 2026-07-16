import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  listDelaReferrals, getDelaReferral, startDelaReferral, recordDelaConsent,
  updateDelaBasicInfo, sendDelaToPartner, updateDelaOutcome,
  DELA_DISCLOSURE_VERSION, DELA_PRIVACY_NOTICE_VERSION,
} from "@/lib/dela.functions";

const listQ = queryOptions({ queryKey: ["dela-referrals"], queryFn: () => listDelaReferrals() });
const detailQ = (id: string) => queryOptions({
  queryKey: ["dela-referral", id],
  queryFn: () => getDelaReferral({ data: { id } }),
  enabled: Boolean(id),
});

export const Route = createFileRoute("/_authenticated/portal/dela")({
  head: () => ({ meta: [{ title: "DELA Referrals — BeistandPlus" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listQ),
  component: DelaPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

const STAGES = [
  "draft","disclosure_shown","marketing_consent","info_collected","contact_method_selected",
  "sent_to_partner","partner_acknowledged","application_submitted","policy_accepted",
  "policy_declined","commission_due","commission_paid","cancelled","renewed",
] as const;

function DelaPage() {
  const { data: referrals } = useSuspenseQuery(listQ);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> DELA referrals
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Regulated funeral-expense insurance referral to DELA / authorised intermediary. BeistandPlus is an introducer only — we do not advise, recommend or interpret policy wording.
        </p>
      </header>

      <UnlicensedBanner />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-2">
          <NewReferralCard onCreated={(id) => setSelectedId(id)} />
          <div className="rounded-lg border">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">Recent referrals</div>
            <ul className="max-h-[500px] overflow-y-auto">
              {referrals.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">No referrals yet.</li>
              )}
              {referrals.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 border-b last:border-b-0 ${selectedId === r.id ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{r.reference}</span>
                      <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{r.full_name ?? r.email ?? "—"}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div>{selectedId ? <ReferralDetail id={selectedId} /> : <EmptyState />}</div>
      </div>
    </div>
  );
}

function UnlicensedBanner() {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-amber-800 dark:text-amber-200">Introducer only — no advice</p>
          <p className="text-xs text-muted-foreground mt-1">
            Unlicensed staff must not recommend a policy, compare products as advice, state suitability,
            interpret exclusions, change insurer wording, or complete regulated declarations for the customer.
            Post-consent stages are database-enforced to licensed advisors only.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      Select or create a referral to begin the compliance flow.
    </div>
  );
}

function NewReferralCard({ onCreated }: { onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const startFn = useServerFn(startDelaReferral);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const start = useMutation({
    mutationFn: () => startFn({ data: { fullName, email: email || undefined, phone: phone || undefined } }),
    onSuccess: (row) => {
      toast.success("Disclosure recorded — referral opened");
      qc.invalidateQueries({ queryKey: ["dela-referrals"] });
      onCreated(row.id);
      setFullName(""); setEmail(""); setPhone("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Start a new DELA referral</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <p className="text-[11px] text-muted-foreground">
          Clicking <em>Show disclosure &amp; start</em> confirms the customer has been shown the referral disclosure
          (v{DELA_DISCLOSURE_VERSION}) and the privacy notice (v{DELA_PRIVACY_NOTICE_VERSION}).
        </p>
        <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button className="w-full" disabled={!fullName || start.isPending} onClick={() => start.mutate()}>
          {start.isPending ? "Recording…" : "Show disclosure & start"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReferralDetail({ id }: { id: string }) {
  const { data: r } = useSuspenseQuery(detailQ(id));
  const qc = useQueryClient();
  const consentFn = useServerFn(recordDelaConsent);
  const infoFn = useServerFn(updateDelaBasicInfo);
  const sendFn = useServerFn(sendDelaToPartner);
  const outcomeFn = useServerFn(updateDelaOutcome);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["dela-referral", id] });
    qc.invalidateQueries({ queryKey: ["dela-referrals"] });
  };

  const [evidence, setEvidence] = useState("Customer confirmed marketing consent verbally on call, recorded in notes.");
  const [age, setAge] = useState<string>("");
  const [postcode, setPostcode] = useState("");
  const [household, setHousehold] = useState("");
  const [contactMethod, setContactMethod] = useState<string>("");
  const [contactTime, setContactTime] = useState("");
  const [policyRef, setPolicyRef] = useState("");
  const [premium, setPremium] = useState("");
  const [benefit, setBenefit] = useState("");
  const [commission, setCommission] = useState("");

  const consentMut = useMutation({
    mutationFn: () => consentFn({ data: { referralId: id, evidence } }),
    onSuccess: () => { toast.success("Consent recorded"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const infoMut = useMutation({
    mutationFn: (payload: { withContact: boolean }) => infoFn({ data: {
      referralId: id,
      age: age ? Number(age) : undefined,
      householdKind: household || undefined,
      postcode: postcode || undefined,
      contactMethod: payload.withContact ? (contactMethod as "email" | "phone" | "whatsapp" | "post") : undefined,
      contactTimePreference: payload.withContact ? (contactTime || undefined) : undefined,
    } }),
    onSuccess: () => { toast.success("Saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const sendMut = useMutation({
    mutationFn: () => sendFn({ data: { referralId: id } }),
    onSuccess: (row) => { toast.success(`Referral ${row.reference} sent to partner`); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const outcomeMut = useMutation({
    mutationFn: (payload: Parameters<typeof outcomeFn>[0]["data"]) => outcomeFn({ data: payload }),
    onSuccess: () => { toast.success("Outcome updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!r) return <EmptyState />;

  const currentIdx = STAGES.indexOf(r.status);
  const hasConsent = Boolean(r.marketing_consent_at);
  const hasContact = Boolean(r.contact_method);
  const isSent = Boolean(r.sent_to_partner_at);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-mono">{r.reference}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{r.full_name ?? r.email ?? "—"}</p>
            </div>
            <Badge variant="outline">{r.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-wrap gap-1 text-[11px]">
            {STAGES.map((s, i) => (
              <li key={s} className={`px-2 py-1 rounded ${
                i < currentIdx ? "bg-emerald-500/10 text-emerald-700"
                : i === currentIdx ? "bg-primary/10 text-primary font-medium"
                : "bg-muted text-muted-foreground"
              }`}>{s}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Stage 1: disclosure — always shown as evidence */}
      <StageCard step="1" title="Referral disclosure displayed" done={Boolean(r.disclosure_shown_at)}>
        <p>Version <b>{r.disclosure_version ?? "—"}</b> at {r.disclosure_shown_at ? new Date(r.disclosure_shown_at).toLocaleString() : "—"}. Privacy notice <b>{r.privacy_notice_version ?? "—"}</b>.</p>
      </StageCard>

      {/* Stage 2: marketing consent */}
      <StageCard step="2" title="Marketing consent obtained" done={hasConsent}>
        {hasConsent ? (
          <p>Consent recorded {new Date(r.marketing_consent_at!).toLocaleString()}: <em>{r.marketing_consent_evidence}</em></p>
        ) : (
          <div className="space-y-2">
            <Textarea rows={2} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Consent evidence (how/where/when)" />
            <Button size="sm" onClick={() => consentMut.mutate()} disabled={consentMut.isPending || !evidence}>
              Record consent
            </Button>
          </div>
        )}
      </StageCard>

      {/* Stage 3: basic non-advisory info */}
      <StageCard step="3" title="Basic non-advisory information" done={Boolean(r.age || r.postcode || r.household_kind)}>
        <p className="text-[11px] text-muted-foreground mb-2">
          <Lock className="h-3 w-3 inline mr-1" /> Only name, contactable details, age, household composition and postcode. Do not collect health / suitability data — DELA collects that directly.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          <Input placeholder="Household (single/family)" value={household} onChange={(e) => setHousehold(e.target.value)} />
          <Input placeholder="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
        </div>
        <Button size="sm" className="mt-2" onClick={() => infoMut.mutate({ withContact: false })} disabled={infoMut.isPending}>Save</Button>
      </StageCard>

      {/* Stage 4: contact method */}
      <StageCard step="4" title="Customer selects contact method" done={hasContact}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={contactMethod} onValueChange={setContactMethod}>
            <SelectTrigger><SelectValue placeholder="Contact method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="post">Post</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Preferred time (e.g. weekdays after 18:00)" value={contactTime} onChange={(e) => setContactTime(e.target.value)} />
        </div>
        <Button size="sm" className="mt-2" onClick={() => infoMut.mutate({ withContact: true })} disabled={!contactMethod || infoMut.isPending}>Confirm contact method</Button>
        {hasContact ? <p className="text-xs text-muted-foreground mt-2">Preferred: {r.contact_method} · {r.contact_time_preference ?? "no time set"}</p> : null}
      </StageCard>

      {/* Stage 5: send */}
      <StageCard step="5" title="Send referral securely to DELA" done={isSent}>
        {isSent ? (
          <p>Sent {new Date(r.sent_to_partner_at!).toLocaleString()} · reference <b className="font-mono">{r.reference}</b></p>
        ) : (
          <div>
            <p className="text-[11px] text-muted-foreground mb-2">Requires marketing consent and contact method.</p>
            <Button size="sm" onClick={() => sendMut.mutate()} disabled={!hasConsent || !hasContact || sendMut.isPending}>
              Send to DELA <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </StageCard>

      {/* Advisor-only outcome recording */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Licensed advisor only — policy outcome & commission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Database-enforced. Only users with role <code>insurance_admin</code> or <code>admin</code> can record the fields below.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!isSent || outcomeMut.isPending}
              onClick={() => outcomeMut.mutate({ referralId: id, status: "partner_acknowledged" })}>
              Partner acknowledged
            </Button>
            <Button size="sm" variant="outline" disabled={outcomeMut.isPending}
              onClick={() => outcomeMut.mutate({ referralId: id, status: "application_submitted" })}>
              Application submitted
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Input placeholder="Policy reference" value={policyRef} onChange={(e) => setPolicyRef(e.target.value)} />
            <Input placeholder="Monthly premium €" type="number" value={premium} onChange={(e) => setPremium(e.target.value)} />
            <Input placeholder="Benefit amount €" type="number" value={benefit} onChange={(e) => setBenefit(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={outcomeMut.isPending} onClick={() => outcomeMut.mutate({
              referralId: id, status: "policy_accepted",
              policyReference: policyRef || undefined,
              monthlyPremiumEur: premium ? Number(premium) : undefined,
              benefitAmountEur: benefit ? Number(benefit) : undefined,
            })}>
              Record policy accepted
            </Button>
            <Button size="sm" variant="outline" disabled={outcomeMut.isPending}
              onClick={() => outcomeMut.mutate({ referralId: id, status: "policy_declined" })}>
              Policy declined
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Commission € (due)" type="number" value={commission} onChange={(e) => setCommission(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={outcomeMut.isPending}
                onClick={() => outcomeMut.mutate({ referralId: id, status: "commission_due", commissionAmountEur: commission ? Number(commission) : undefined })}>
                Commission due
              </Button>
              <Button size="sm" disabled={outcomeMut.isPending}
                onClick={() => outcomeMut.mutate({ referralId: id, status: "commission_paid" })}>
                Commission paid
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={outcomeMut.isPending}
              onClick={() => outcomeMut.mutate({ referralId: id, status: "cancelled", cancellationReason: "Customer cancelled" })}>
              Cancelled
            </Button>
            <Button size="sm" variant="outline" disabled={outcomeMut.isPending}
              onClick={() => outcomeMut.mutate({ referralId: id, status: "renewed" })}>
              Renewed
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StageCard({ step, title, done, children }: { step: string; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">{children}</CardContent>
    </Card>
  );
}
