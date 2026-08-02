import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Check, FileQuestion, Languages, Receipt, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { RegulatedNotice } from "@/components/regulated-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitTaxLead } from "@/lib/tax-lead.functions";

export const Route = createFileRoute("/tax")({
  head: () => ({
    meta: [
      { title: "German tax information and professional referrals — BeistandPlus" },
      {
        name: "description",
        content:
          "Organise questions about a German tax return and optionally request contact about an independent professional referral.",
      },
      { property: "og:title", content: "Tax information and professional referrals" },
      {
        property: "og:description",
        content:
          "No automated refund promise. A receiving professional confirms scope, status and fees directly.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://beistandplus.de/tax" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/tax" }],
  }),
  component: TaxPage,
});

type EmploymentStatus =
  "employee" | "freelancer" | "self_employed" | "student" | "job_seeker" | "pensioner" | "mixed";

const EMPLOYMENT_OPTIONS: Array<{ value: EmploymentStatus; label: string }> = [
  { value: "employee", label: "Employee" },
  { value: "freelancer", label: "Freelancer" },
  { value: "self_employed", label: "Self-employed / trade" },
  { value: "mixed", label: "Employment plus other income" },
  { value: "student", label: "Student" },
  { value: "job_seeker", label: "Between jobs" },
  { value: "pensioner", label: "Pensioner" },
];

function TaxPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[oklch(0.16_0.04_250)] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_15%_15%,oklch(0.72_0.18_190/0.35),transparent),radial-gradient(45%_55%_at_85%_25%,oklch(0.68_0.22_25/0.22),transparent)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                <Receipt className="h-3.5 w-3.5" /> Tax information · referral only
              </div>
              <h1 className="display-hero mt-4 text-balance font-semibold">
                Prepare the right questions before choosing tax help.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/70">
                BeistandPlus can organise your enquiry and contact preference. We do not calculate a
                promised refund, file a return or provide tax advice.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <Chip icon={Languages}>Multilingual intake</Chip>
                <Chip icon={ShieldCheck}>No refund guarantee</Chip>
                <Chip icon={FileQuestion}>Professional confirms scope and fees</Chip>
              </div>
              <Button
                asChild
                size="lg"
                className="mt-8 bg-teal text-[oklch(0.16_0.04_250)] hover:bg-teal/90"
              >
                <a href="#tax-referral">
                  Request contact <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-elevated backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                Before sharing documents
              </p>
              <ul className="mt-4 space-y-4 text-sm text-white/85">
                {[
                  "Confirm who will provide the service and whether they are authorised for the work.",
                  "Ask for the engagement scope, fees and privacy information in writing.",
                  "Do not send tax IDs, payslips or account details through this public form.",
                  "Use the professional's secure channel for documents after you choose them.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              Service boundaries
            </p>
            <h2 className="display-lg mt-3 text-balance font-semibold">
              No automated estimate is shown.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Tax rules, allowances and filing obligations change. An accurate result depends on
              facts and records that a qualified professional must review for the relevant year.
            </p>
            <Link
              to="/trust"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Read all service boundaries <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <TaxReferralForm />
        </section>

        <RegulatedNotice domain="tax" />
      </main>
      <SiteFooter />
    </div>
  );
}

function Chip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/85">
      <Icon className="h-3.5 w-3.5 text-teal" />
      {children}
    </span>
  );
}

function TaxReferralForm() {
  const submit = useServerFn(submitTaxLead);
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    tax_year: currentYear,
    employment_status: "employee" as EmploymentStatus,
    preferred_language: "en",
    preferred_contact: "email" as "email" | "phone" | "whatsapp",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          tax_year: form.tax_year,
          employment_status: form.employment_status,
          gross_income_eur: null,
          tax_class: null,
          church_tax: false,
          has_children: false,
          children_count: 0,
          commute_km: null,
          home_office_days: null,
          additional_deductions: null,
          estimated_refund_eur: null,
          preferred_language: form.preferred_language,
          preferred_contact: form.preferred_contact,
          partner_referral: "unsure" as const,
          notes: form.notes.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Tax referral request received.");
      setForm((current) => ({ ...current, full_name: "", email: "", phone: "", notes: "" }));
    },
    onError: (error: Error) => toast.error(error.message || "Could not submit request"),
  });

  return (
    <form
      id="tax-referral"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:grid-cols-2 sm:p-8"
    >
      <div className="sm:col-span-2">
        <h2 className="font-display text-2xl font-semibold">Request contact about a referral</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share contact details and a short non-sensitive summary only.
        </p>
      </div>
      <Field label="Full name" htmlFor="tax-name">
        <Input
          id="tax-name"
          required
          value={form.full_name}
          onChange={(event) => setForm({ ...form, full_name: event.target.value })}
        />
      </Field>
      <Field label="Email" htmlFor="tax-email">
        <Input
          id="tax-email"
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </Field>
      <Field label="Phone (optional)" htmlFor="tax-phone">
        <Input
          id="tax-phone"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
      </Field>
      <Field label="Tax year" htmlFor="tax-year">
        <select
          id="tax-year"
          value={form.tax_year}
          onChange={(event) => setForm({ ...form, tax_year: Number(event.target.value) })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {Array.from({ length: 5 }, (_, index) => currentYear - index).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Work situation" htmlFor="tax-work">
        <select
          id="tax-work"
          value={form.employment_status}
          onChange={(event) =>
            setForm({ ...form, employment_status: event.target.value as EmploymentStatus })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {EMPLOYMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Preferred contact" htmlFor="tax-contact">
        <select
          id="tax-contact"
          value={form.preferred_contact}
          onChange={(event) =>
            setForm({
              ...form,
              preferred_contact: event.target.value as typeof form.preferred_contact,
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </Field>
      <Field label="Preferred language" htmlFor="tax-language">
        <Input
          id="tax-language"
          maxLength={5}
          value={form.preferred_language}
          onChange={(event) => setForm({ ...form, preferred_language: event.target.value })}
          placeholder="en"
        />
      </Field>
      <div className="sm:col-span-2">
        <Label htmlFor="tax-notes">Short summary (optional)</Label>
        <Textarea
          id="tax-notes"
          rows={3}
          maxLength={2000}
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          placeholder="Do not include tax IDs, bank details or document contents."
        />
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs text-muted-foreground">
          Submitting does not appoint an adviser or create a filing engagement.
        </p>
        <Button type="submit" disabled={mutation.isPending} className="bg-gradient-primary">
          {mutation.isPending ? "Sending…" : "Request contact"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
