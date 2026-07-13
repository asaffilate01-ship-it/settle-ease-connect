import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { submitGroupCoverLead } from "@/lib/group-cover-leads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, ShieldCheck } from "lucide-react";

type LegalForm = "ev" | "gmbh" | "ag" | "gug" | "other";
type PremiumModel = "obligatory_flat" | "obligatory_by_age" | "facultative";
type PremiumPayer = "org_pays_all" | "member_pays_all" | "co_pay";

export function GroupCoverIntake() {
  const [orgName, setOrgName] = useState("");
  const [legalForm, setLegalForm] = useState<LegalForm>("ev");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [memberCount, setMemberCount] = useState<number>(10_000);
  const [ageBracketNote, setAgeBracketNote] = useState(
    "Approx: 30% under 35, 45% 35–60, 20% 60–75, 5% 75+",
  );
  const [benefit, setBenefit] = useState<number>(20_000);
  const [premiumModel, setPremiumModel] = useState<PremiumModel>("obligatory_flat");
  const [premiumPayer, setPremiumPayer] = useState<PremiumPayer>("member_pays_all");
  const [fiduciary, setFiduciary] = useState(true);
  const [sepa, setSepa] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      submitGroupCoverLead({
        data: {
          organization_name: orgName,
          legal_form: legalForm,
          contact_name: contactName,
          email,
          phone: phone || null,
          member_count: memberCount,
          age_bracket_note: ageBracketNote || null,
          target_benefit_eur: benefit,
          premium_model: premiumModel,
          premium_payer: premiumPayer,
          wants_fiduciary_flow: fiduciary,
          has_sepa_setup: sepa,
          notes: notes || null,
        },
      }),
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Request received — a broker will be in touch within 2 working days.");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Something went wrong — please try again.");
    },
  });

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h3 className="mt-4 font-display text-xl font-semibold">Thanks — we've got your brief.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A licensed §34d GewO broker will review your organisation profile and reach out within
          2 working days with a shortlist of cover providers (regulated under German law) willing
          to bid on the group framework agreement.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-parchment/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-foreground/80">
        <ShieldCheck className="h-3.5 w-3.5" />
        Broker intake · Group cover framework
      </div>
      <h3 className="mt-3 font-display text-xl font-semibold">
        Brief a commercial broker for your group policy
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We route this to a licensed §34d GewO broker who tenders the mandate to our panel of
        Sterbegeld cover providers regulated under German law. No obligation — you review the bids.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Organisation name">
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required maxLength={160} />
        </Field>
        <Field label="Legal form">
          <Select value={legalForm} onValueChange={(v) => setLegalForm(v as LegalForm)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ev">e.V. (registered association)</SelectItem>
              <SelectItem value="gug">gGmbH / non-profit</SelectItem>
              <SelectItem value="gmbh">GmbH</SelectItem>
              <SelectItem value="ag">AG</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Primary contact">
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required maxLength={120} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
        </Field>
        <Field label="Phone (optional)">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
        </Field>
        <Field label="Members to cover">
          <Input
            type="number"
            min={50}
            max={1_000_000}
            value={memberCount}
            onChange={(e) => setMemberCount(parseInt(e.target.value || "0", 10))}
            required
          />
        </Field>
        <Field label="Target payout per member (€)">
          <Select value={String(benefit)} onValueChange={(v) => setBenefit(parseInt(v, 10))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5_000, 8_000, 10_000, 15_000, 20_000].map((n) => (
                <SelectItem key={n} value={String(n)}>€{n.toLocaleString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Premium structure">
          <Select value={premiumModel} onValueChange={(v) => setPremiumModel(v as PremiumModel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="obligatory_flat">Obligatory · blended flat rate</SelectItem>
              <SelectItem value="obligatory_by_age">Obligatory · age-banded</SelectItem>
              <SelectItem value="facultative">Facultative · opt-in (needs §34d)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Who pays the premium?">
          <Select value={premiumPayer} onValueChange={(v) => setPremiumPayer(v as PremiumPayer)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="org_pays_all">Organisation covers 100%</SelectItem>
              <SelectItem value="member_pays_all">Members pay via dues</SelectItem>
              <SelectItem value="co_pay">Co-pay (split)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mt-4">
        <Label className="text-xs font-medium text-muted-foreground">
          Rough age breakdown of the pool
        </Label>
        <Textarea
          className="mt-1"
          rows={2}
          value={ageBracketNote}
          onChange={(e) => setAgeBracketNote(e.target.value)}
          maxLength={600}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={fiduciary} onCheckedChange={(v) => setFiduciary(v === true)} />
          <span>
            <strong>Fiduciary payout flow:</strong> cover provider pays the association, we settle
            the funeral director, the balance goes to the nominated beneficiary.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={sepa} onCheckedChange={(v) => setSepa(v === true)} />
          <span>We already run SEPA direct debit for membership dues.</span>
        </label>
      </div>

      <div className="mt-4">
        <Label className="text-xs font-medium text-muted-foreground">
          Anything else the broker should know?
        </Label>
        <Textarea
          className="mt-1"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          placeholder="e.g. religious burial requirements, repatriation corridors, existing carrier…"
        />
      </div>

      <Button
        type="submit"
        className="mt-6 bg-gradient-primary"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Sending…" : "Request broker consultation"}
      </Button>

      <p className="mt-3 text-[11px] text-muted-foreground">
        BeistandPlus routes the brief to a licensed §34d GewO broker. We never underwrite — the
        cover provider issues any binding offer.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
