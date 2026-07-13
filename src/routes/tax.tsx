import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { submitTaxLead } from "@/lib/tax-lead.functions";
import { estimateTaxRefund, type TaxInput } from "@/lib/tax-estimator";
import {
  Calculator,
  ArrowRight,
  ArrowLeft,
  Check,
  Languages,
  ShieldCheck,
  Receipt,
  Sparkles,
  Info,
  Home,
  Car,
  Baby,
  Building2,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/tax")({
  head: () => ({
    meta: [
      { title: "German tax refund, guided in your language — BeistandPlus" },
      {
        name: "description",
        content:
          "Get an instant refund estimate for your German Steuererklärung and let a vetted partner (Taxfix, Wundertax or a local Steuerberater) file it for you. 19 languages, one flat price, refund-or-free.",
      },
      { property: "og:title", content: "German tax refund, guided in your language" },
      {
        property: "og:description",
        content:
          "The average German employee gets €1,095 back. Estimate your refund in 90 seconds, then let our partner file it for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaxLanding,
});

type Employment = TaxInput["employment_status"];

const EMPLOYMENT_OPTIONS: { key: Employment; label: string; hint: string }[] = [
  { key: "employee",     label: "Employee (Angestellt)",       hint: "Payroll job — biggest refund pool." },
  { key: "freelancer",   label: "Freelancer (Freiberufler)",   hint: "Invoicing clients, no payroll." },
  { key: "self_employed",label: "Self-employed (Gewerbe)",     hint: "Registered trade or shop." },
  { key: "mixed",        label: "Employee + side income",      hint: "Payroll plus freelancing." },
  { key: "student",      label: "Student",                     hint: "Mini-job / working student." },
  { key: "job_seeker",   label: "Currently between jobs",      hint: "Worked part of the year." },
  { key: "pensioner",    label: "Pensioner (Rentner)",         hint: "Pension income." },
];

function TaxLanding() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <Wizard />
      <Trust />
      <Faq />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[oklch(0.16_0.04_250)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_15%_15%,oklch(0.72_0.18_190/0.35),transparent),radial-gradient(45%_55%_at_85%_25%,oklch(0.68_0.22_25/0.22),transparent)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
            <Receipt className="h-3.5 w-3.5" /> Steuererklärung · in your language
          </div>
          <h1 className="display-hero text-balance mt-4 font-semibold">
            The average German employee gets <span className="text-teal">€1,095 back.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/70">
            Most expats never file — the forms are only in German. In 90 seconds, we'll estimate
            what the Finanzamt owes you. Then a vetted partner (Taxfix, Wundertax or a local
            Steuerberater) files it for you, in your language, for one flat price.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <HeroChip icon={Languages}>19 languages</HeroChip>
            <HeroChip icon={Sparkles}>Refund-or-free promise</HeroChip>
            <HeroChip icon={ShieldCheck}>StBerG-compliant partners</HeroChip>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-teal text-[oklch(0.16_0.04_250)] hover:bg-teal/90">
              <a href="#estimator">
                Start my estimate <ArrowRight className="ml-2 h-4 w-4 rtl-flip" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/trust">How we're regulated</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-elevated backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
            One flat price, three ways to file
          </div>
          <ul className="mt-4 space-y-4 text-sm text-white/85">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal/20 text-teal font-semibold">1</span>
              <div>
                <div className="font-semibold">DIY with Taxfix or Wundertax — €39</div>
                <div className="text-white/60">We import your details into the partner app so you keep going in your language.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal/20 text-teal font-semibold">2</span>
              <div>
                <div className="font-semibold">Guided by our team — €79</div>
                <div className="text-white/60">A case manager fills the forms with you over voice / WhatsApp / video.</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal/20 text-teal font-semibold">3</span>
              <div>
                <div className="font-semibold">Full Steuerberater — from €149</div>
                <div className="text-white/60">Complex cases (self-employed, rentals, crypto) go to a licensed tax advisor.</div>
              </div>
            </li>
          </ul>
          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
            BeistandPlus Plus &amp; Complete subscribers save 20% on all three.
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroChip({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-white/85">
      <Icon className="h-3.5 w-3.5 text-teal" /> {children}
    </span>
  );
}

type WizardStep = 0 | 1 | 2 | 3 | 4;

function Wizard() {
  const [step, setStep] = useState<WizardStep>(0);
  const [input, setInput] = useState<TaxInput & { tax_year: number }>({
    tax_year: 2024,
    employment_status: "employee",
    gross_income_eur: 42_000,
    tax_class: 1,
    church_tax: false,
    children_count: 0,
    commute_km: 12,
    home_office_days: 40,
    additional_deductions: 0,
  });

  const result = useMemo(() => estimateTaxRefund(input), [input]);

  return (
    <section id="estimator" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
          Refund estimator
        </div>
        <h2 className="display-lg text-balance mt-3 font-semibold">Answer 5 short questions.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
          No sign-up, no upload. This is a plain-English estimate to show you whether it's worth
          filing — the actual return runs through our licensed partner.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
          <Stepper current={step} total={5} />

          <div className="mt-6 min-h-[320px]">
            {step === 0 && <StepEmployment input={input} setInput={setInput} />}
            {step === 1 && <StepIncome input={input} setInput={setInput} />}
            {step === 2 && <StepFamily input={input} setInput={setInput} />}
            {step === 3 && <StepCommute input={input} setInput={setInput} />}
            {step === 4 && <StepExtras input={input} setInput={setInput} />}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => (s > 0 ? ((s - 1) as WizardStep) : s))}
              disabled={step === 0}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
            </Button>
            {step < 4 ? (
              <Button size="sm" onClick={() => setStep((s) => (s + 1) as WizardStep)}>
                Next <ArrowRight className="ml-1.5 h-3.5 w-3.5 rtl-flip" />
              </Button>
            ) : (
              <a
                href="#book"
                className="inline-flex items-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                Book my filing <ArrowRight className="ml-1.5 h-3.5 w-3.5 rtl-flip" />
              </a>
            )}
          </div>
        </div>

        <ResultPanel result={result} input={input} />
      </div>

      <BookingForm input={input} estimated={result.refund} />
    </section>
  );
}

function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-primary" : "bg-border/60"}`}
        />
      ))}
      <div className="ml-3 text-xs font-semibold text-muted-foreground">
        Step {current + 1} / {total}
      </div>
    </div>
  );
}

type StepProps = {
  input: TaxInput & { tax_year: number };
  setInput: React.Dispatch<React.SetStateAction<TaxInput & { tax_year: number }>>;
};

function StepEmployment({ input, setInput }: StepProps) {
  return (
    <div>
      <div className="font-display text-lg font-semibold">What did you do for money last year?</div>
      <p className="mt-1 text-sm text-muted-foreground">Pick the closest match. Mixed situations get flagged for a case manager.</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {EMPLOYMENT_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setInput((i) => ({ ...i, employment_status: o.key }))}
            className={`rounded-xl border p-4 text-left transition ${
              input.employment_status === o.key
                ? "border-primary bg-primary/5 shadow-elevated"
                : "border-border/60 bg-card hover:-translate-y-0.5 hover:shadow-elevated"
            }`}
          >
            <div className="font-display text-sm font-semibold">{o.label}</div>
            <p className="mt-1 text-xs text-muted-foreground">{o.hint}</p>
          </button>
        ))}
      </div>
      <div className="mt-5">
        <Label htmlFor="tax-year">Tax year</Label>
        <select
          id="tax-year"
          value={input.tax_year}
          onChange={(e) => setInput((i) => ({ ...i, tax_year: Number(e.target.value) }))}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:max-w-xs"
        >
          {[2024, 2023, 2022, 2021].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">You can file up to 4 years back without penalty.</p>
      </div>
    </div>
  );
}

function StepIncome({ input, setInput }: StepProps) {
  return (
    <div>
      <div className="font-display text-lg font-semibold">Your income &amp; tax class</div>
      <p className="mt-1 text-sm text-muted-foreground">Gross annual income (before tax). Rough number is fine.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="gross">Gross income (€ / year)</Label>
          <Input
            id="gross"
            type="number"
            min={0}
            value={input.gross_income_eur}
            onChange={(e) => setInput((i) => ({ ...i, gross_income_eur: Number(e.target.value) || 0 }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">Look at line 3 of your Lohnsteuerbescheinigung.</p>
        </div>
        <div>
          <Label htmlFor="class">Tax class (Steuerklasse)</Label>
          <select
            id="class"
            value={input.tax_class}
            onChange={(e) => setInput((i) => ({ ...i, tax_class: Number(e.target.value) as TaxInput["tax_class"] }))}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={1}>Class 1 — Single</option>
            <option value={2}>Class 2 — Single parent</option>
            <option value={3}>Class 3 — Married, higher earner</option>
            <option value={4}>Class 4 — Married, similar earnings</option>
            <option value={5}>Class 5 — Married, lower earner</option>
            <option value={6}>Class 6 — Second job</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">Shown on your payslip; class 5 &amp; 6 usually get the biggest refunds.</p>
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <Checkbox
            id="church"
            checked={input.church_tax}
            onCheckedChange={(v) => setInput((i) => ({ ...i, church_tax: v === true }))}
          />
          <Label htmlFor="church" className="cursor-pointer text-sm font-normal">
            I paid Kirchensteuer (church tax)
          </Label>
        </div>
      </div>
    </div>
  );
}

function StepFamily({ input, setInput }: StepProps) {
  return (
    <div>
      <div className="font-display text-lg font-semibold flex items-center gap-2">
        <Baby className="h-5 w-5 text-primary" /> Children
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Each dependent child unlocks a €6,384 Kinderfreibetrag — often worth €1,500–€2,500 in refund.</p>
      <div className="mt-5 max-w-sm">
        <Label htmlFor="kids">Number of children you claim for</Label>
        <Input
          id="kids"
          type="number"
          min={0}
          max={15}
          value={input.children_count}
          onChange={(e) => setInput((i) => ({
            ...i,
            children_count: Math.max(0, Math.min(15, Number(e.target.value) || 0)),
            has_children: (Number(e.target.value) || 0) > 0,
          }))}
        />
      </div>
    </div>
  );
}

function StepCommute({ input, setInput }: StepProps) {
  return (
    <div>
      <div className="font-display text-lg font-semibold flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" /> Commute &amp; home office
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Entfernungspauschale: €0.30/km one-way for the first 20 km, €0.38/km beyond — for ~230 working days.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="km">One-way distance to work (km)</Label>
          <Input
            id="km"
            type="number"
            min={0}
            max={500}
            value={input.commute_km}
            onChange={(e) => setInput((i) => ({ ...i, commute_km: Number(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="hod" className="flex items-center gap-1.5"><Home className="h-4 w-4" /> Home-office days last year</Label>
          <Input
            id="hod"
            type="number"
            min={0}
            max={365}
            value={input.home_office_days}
            onChange={(e) => setInput((i) => ({ ...i, home_office_days: Number(e.target.value) || 0 }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">€6/day, capped at 210 days = €1,260/year.</p>
        </div>
      </div>
    </div>
  );
}

function StepExtras({ input, setInput }: StepProps) {
  return (
    <div>
      <div className="font-display text-lg font-semibold flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" /> Anything else deductible?
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Rough total for other deductions — insurance, training, moving for work, donations, tools.
      </p>
      <div className="mt-5 max-w-sm">
        <Label htmlFor="extras">Additional deductions (€)</Label>
        <Input
          id="extras"
          type="number"
          min={0}
          value={input.additional_deductions}
          onChange={(e) => setInput((i) => ({ ...i, additional_deductions: Number(e.target.value) || 0 }))}
        />
        <p className="mt-1 text-xs text-muted-foreground">Don't stress the exact number — your case manager will refine it.</p>
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  input,
}: {
  result: ReturnType<typeof estimateTaxRefund>;
  input: TaxInput & { tax_year: number };
}) {
  const positive = result.refund > 0;
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-teal/5 p-6 shadow-elevated sm:p-8">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Estimated {positive ? "refund" : "outcome"} · {input.tax_year}
      </div>
      <div className="mt-2 font-display text-5xl font-bold tracking-tight">
        {positive ? "€" : "−€"}
        {Math.abs(result.refund).toLocaleString("de-DE")}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {positive
          ? "That's roughly what the Finanzamt should send back based on what you've entered."
          : "You might owe a small top-up rather than get a refund. Our team can double-check before you file."}
      </p>

      <div className="mt-5 space-y-2 text-sm">
        <ResultRow label="Gross income" value={`€${input.gross_income_eur.toLocaleString("de-DE")}`} />
        <ResultRow label="Deductions applied" value={`€${result.total_deductions.toLocaleString("de-DE")}`} />
        <ResultRow label="Taxable income" value={`€${result.taxable_income.toLocaleString("de-DE")}`} />
        <ResultRow label="Estimated tax owed" value={`€${result.income_tax_owed.toLocaleString("de-DE")}`} />
        <ResultRow label="Estimated withheld" value={`€${result.withheld_estimate.toLocaleString("de-DE")}`} />
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-border/60 bg-card/70 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Estimate only — not a filing. Actual refunds depend on the Finanzamt's assessment. We are
        not a tax advisor; regulated advice comes from our Steuerberater partners.
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-1.5 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function BookingForm({
  input,
  estimated,
}: {
  input: TaxInput & { tax_year: number };
  estimated: number;
}) {
  const submit = useServerFn(submitTaxLead);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    preferred_language: "en",
    preferred_contact: "email" as "email" | "phone" | "whatsapp",
    partner_referral: "unsure" as "taxfix" | "wundertax" | "steuergo" | "advisor" | "unsure",
    notes: "",
  });

  const mut = useMutation({
    mutationFn: () =>
      submit({
        data: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          tax_year: input.tax_year,
          employment_status: input.employment_status,
          gross_income_eur: input.gross_income_eur,
          tax_class: input.tax_class,
          church_tax: input.church_tax,
          has_children: input.children_count > 0,
          children_count: input.children_count,
          commute_km: input.commute_km,
          home_office_days: input.home_office_days,
          additional_deductions: input.additional_deductions,
          estimated_refund_eur: estimated,
          preferred_language: form.preferred_language,
          preferred_contact: form.preferred_contact,
          partner_referral: form.partner_referral,
          notes: form.notes.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Thanks — a tax specialist will be in touch within one working day.");
      setForm((f) => ({ ...f, full_name: "", email: "", phone: "", notes: "" }));
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit request"),
  });

  return (
    <form
      id="book"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.full_name || !form.email) {
          toast.error("Name and email are required");
          return;
        }
        mut.mutate();
      }}
      className="mt-14 grid gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:grid-cols-2 sm:p-8"
    >
      <div className="sm:col-span-2">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
          Book my filing
        </div>
        <h3 className="mt-2 font-display text-2xl font-semibold">Send my estimate to a tax specialist</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll pass your rough numbers to the partner that fits your case. No obligation, no upload
          required at this step.
        </p>
      </div>

      <div>
        <Label htmlFor="tx-name">Full name</Label>
        <Input id="tx-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="tx-email">Email</Label>
        <Input id="tx-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="tx-phone">Phone (optional)</Label>
        <Input id="tx-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="tx-contact">Preferred contact</Label>
        <select
          id="tx-contact"
          value={form.preferred_contact}
          onChange={(e) => setForm({ ...form, preferred_contact: e.target.value as typeof form.preferred_contact })}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="email">Email</option>
          <option value="phone">Phone call</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>
      <div>
        <Label htmlFor="tx-lang">Preferred language</Label>
        <select
          id="tx-lang"
          value={form.preferred_language}
          onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {[["de","Deutsch"],["en","English"],["tr","Türkçe"],["ar","العربية"],["ur","اردو"],["hi","हिन्दी"],["pa","ਪੰਜਾਬੀ"],["ku","Kurdî"],["ru","Русский"],["uk","Українська"],["fa","فارسی"],["pl","Polski"],["zh","中文"],["fr","Français"],["pt-BR","Português (BR)"],["vi","Tiếng Việt"],["sq","Shqip"],["so","Soomaali"],["ti","ትግርኛ"]].map(([v,l]) => (<option key={v} value={v}>{l}</option>))}
        </select>
      </div>
      <div>
        <Label htmlFor="tx-partner">Preferred filing route</Label>
        <select
          id="tx-partner"
          value={form.partner_referral}
          onChange={(e) => setForm({ ...form, partner_referral: e.target.value as typeof form.partner_referral })}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="unsure">Not sure — recommend one</option>
          <option value="taxfix">Taxfix (DIY app, €39)</option>
          <option value="wundertax">Wundertax (DIY web, €39)</option>
          <option value="advisor">Full Steuerberater</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="tx-notes">Anything else we should know? (optional)</Label>
        <Textarea id="tx-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. moved from UK in July, worked as freelancer for 3 months, have rental income in Turkey" />
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Estimate saved with your request: <strong className={estimated >= 0 ? "text-primary" : "text-destructive"}>
            {estimated >= 0 ? "€" : "−€"}{Math.abs(estimated).toLocaleString("de-DE")}
          </strong>
        </p>
        <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary">
          {mut.isPending ? "Sending…" : "Send my estimate"}
        </Button>
      </div>
    </form>
  );
}

function Trust() {
  return (
    <section className="bg-parchment/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
              Why partner instead of file
            </div>
            <h2 className="display-lg text-balance mt-3 font-semibold">We're not a Steuerberater — the pros we work with are.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              The German Tax Consultancy Act (StBerG) reserves paid filing advice for licensed
              Steuerberater and BaFin-approved software providers. BeistandPlus is your language-
              side translator, form-filler and orchestrator — never a substitute for regulated
              advice.
            </p>
            <Link to="/trust" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">
              Full compliance page <ArrowRight className="h-3.5 w-3.5 rtl-flip" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FactCard title="Taxfix &amp; Wundertax" body="BaFin-approved DIY apps. Best for employees with straightforward tax profiles." />
            <FactCard title="Local Steuerberater" body="Licensed advisors handle self-employed, rental, crypto and expat cross-border cases." />
            <FactCard title="Refund-or-free" body="If your filed refund is smaller than our estimate by more than 20%, the guided fee is waived." />
            <FactCard title="StBerG-compliant" body="We handle language and forms — the tax opinion always comes from a licensed party." />
          </div>
        </div>
      </div>
    </section>
  );
}

function FactCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 font-display text-sm font-semibold">
        <Check className="h-4 w-4 text-primary" /> <span dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Faq() {
  const faqs: [string, string][] = [
    ["Do I have to file a tax return in Germany?", "If you're only an employee under class 1 with no side income, filing is voluntary — but 88% of voluntary filers get a refund (average €1,095). If you have side income above €410, multiple employers, or claimed Kurzarbeit / Elterngeld, filing is usually mandatory."],
    ["How far back can I file?", "Voluntary returns can be filed up to 4 years back — so in 2026 you can still file for 2022, 2023, 2024 and 2025. That's why our estimator starts with tax-year selection."],
    ["What if I moved to Germany mid-year?", "You'll file as a partial-year resident, and any foreign income affects your rate through the Progressionsvorbehalt. That's a Steuerberater case — flag it in the notes and we'll route you there."],
    ["Is my data safe?", "Your estimate stays in your browser until you press send. Everything you submit sits under DSGVO, encrypted, and is deleted on request. Read the full trust page for details."],
    ["I don't have a tax ID (Steueridentifikationsnummer) yet.", "You can still start — we'll help you request the ID from the Bundeszentralamt für Steuern in your language. It's needed before filing but not before the estimate."],
  ];
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
        FAQ
      </div>
      <h2 className="display-lg text-balance mt-3 font-semibold">Common questions</h2>
      <div className="mt-8 space-y-3">
        {faqs.map(([q, a]) => (
          <details key={q} className="group rounded-xl border border-border/60 bg-card p-5 shadow-soft">
            <summary className="cursor-pointer list-none font-display text-base font-semibold [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-4">
                {q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  <Calculator className="h-4 w-4" />
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-teal/10 p-6 shadow-elevated">
        <div>
          <div className="font-display text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> 90-second estimate, one working day to callback
          </div>
          <p className="text-sm text-muted-foreground">If we can't beat DIY tax apps on service, we'll say so.</p>
        </div>
        <Button asChild size="lg" className="bg-gradient-primary">
          <a href="#estimator">Start my estimate</a>
        </Button>
      </div>
    </section>
  );
}
