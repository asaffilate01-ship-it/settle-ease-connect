import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Lock,
  Scale,
  Server,
  FileCheck2,
  Clock,
  Users,
  HeartHandshake,
  BadgeCheck,
  Landmark,
  Stethoscope,
  Building2,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust, compliance & SLAs — BeistandPlus" },
      {
        name: "description",
        content:
          "How BeistandPlus is regulated, vetted and held accountable: broker licences, data protection, expert vetting criteria, and the response times we promise every household.",
      },
      { property: "og:title", content: "Trust, compliance & SLAs — BeistandPlus" },
      {
        property: "og:description",
        content:
          "Broker licences, DSGVO, vetted experts, published SLAs and refund promises. Maintained by BeistandPlus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trust,
});

function Trust() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[oklch(0.16_0.04_250)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_20%_10%,oklch(0.72_0.18_190/0.35),transparent),radial-gradient(50%_50%_at_90%_30%,oklch(0.68_0.22_25/0.25),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
              <ShieldCheck className="h-3.5 w-3.5" /> Trust & compliance
            </div>
            <h1 className="display-hero text-balance mt-4 font-semibold">
              Built to be checked. Held to what we promise.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/70">
              This page is maintained by BeistandPlus to answer the security, privacy and regulatory
              questions families and referral partners ask us most. It reflects controls that are
              live in the product today — not a marketing wish-list.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <Chip>DSGVO / GDPR aligned</Chip>
              <Chip>Data hosted in Germany</Chip>
              <Chip>§34d GewO broker partner</Chip>
              <Chip>Encrypted vault (AES-256)</Chip>
              <Chip>Vetted experts only</Chip>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & licence badges */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionEyebrow>Licences & registrations</SectionEyebrow>
        <h2 className="display-lg text-balance mt-3 max-w-3xl font-semibold">
          The paperwork behind the platform.
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          BeistandPlus is not an insurer and does not give regulated legal or tax advice directly.
          Regulated work is placed with licensed partners; every quote you receive names the
          regulated entity, its registration number and the fee structure.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BadgeCard
            icon={Scale}
            title="§34d GewO insurance broker"
            body="Insurance products are placed by our tied broker partner (Versicherungsmakler, §34d GewO). Registration number and status shown on every insurance quote."
            status="Partner-licensed"
          />
          <BadgeCard
            icon={Landmark}
            title="BaFin-regulated underwriters"
            body="Bereavement, life and health cover is underwritten only by BaFin-supervised carriers (e.g. established German life insurers). We disclose the carrier before you sign."
            status="Disclosed per policy"
          />
          <BadgeCard
            icon={Lock}
            title="DSGVO / GDPR aligned"
            body="Full DSGVO one-pager, Verzeichnis von Verarbeitungstätigkeiten, and a named Data Protection contact reachable at privacy@beistandplus.de."
            status="Live"
          />
          <BadgeCard
            icon={Server}
            title="German data residency"
            body="Application data, vault documents and backups stored in EU regions with German sub-processors where available. No transfer to third countries without an adequacy decision or SCCs."
            status="Live"
          />
          <BadgeCard
            icon={FileCheck2}
            title="ISO 27001 roadmap"
            body="Information Security Management System (ISMS) is being built to ISO 27001 controls. External audit is scheduled — we will not claim certification until it is issued."
            status="In progress"
          />
          <BadgeCard
            icon={BadgeCheck}
            title="Steuerberater partnerships"
            body="Tax filings are handed off to Steuerberatergesellschaften registered with the Steuerberaterkammer. We never file returns ourselves."
            status="Partner-licensed"
          />
        </div>
      </section>

      {/* Vetting criteria */}
      <section className="bg-parchment/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionEyebrow>How we vet experts</SectionEyebrow>
          <h2 className="display-lg text-balance mt-3 max-w-3xl font-semibold">
            No expert reaches your case until they clear all five checks.
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            The badge on a provider's profile is not decorative. Every regulated expert on
            BeistandPlus completes the checks below before we accept a single referral for them.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Check step="1" title="Licence & registration" body="Bar chamber, notary chamber, BÄK, Steuerberaterkammer or §34d GewO number verified at source." />
            <Check step="2" title="Professional indemnity" body="Current Berufshaftpflicht policy on file with sum insured appropriate to the service line." />
            <Check step="3" title="References" body="Minimum three client references from the last 24 months, contacted directly." />
            <Check step="4" title="Language competence" body="Working proficiency in at least one of our supported languages, tested in a live case simulation." />
            <Check step="5" title="Background & sanctions" body="Führungszeugnis for consumer-facing experts, EU/UN sanctions screen at onboarding and annually." />
          </div>
        </div>
      </section>

      {/* SLAs */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionEyebrow>Service level promises</SectionEyebrow>
        <h2 className="display-lg text-balance mt-3 max-w-3xl font-semibold">
          Response times we publish — and refund against.
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          If we miss an SLA, tell us. Members on Plus and Complete are automatically credited
          against the following month's subscription. Emergency line breaches are refunded in full.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-0 border-b border-border/60 bg-parchment/50 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <div>Promise</div>
            <div>Community (free)</div>
            <div>Plus</div>
            <div>Complete</div>
          </div>
          {SLAs.map((r) => (
            <div key={r.label} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center gap-0 border-b border-border/60 px-6 py-4 text-sm last:border-b-0">
              <div className="font-medium">{r.label}</div>
              <div className="text-muted-foreground">{r.community}</div>
              <div>{r.plus}</div>
              <div className="font-semibold text-primary">{r.complete}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Money-back promises */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Promise
            icon={HeartHandshake}
            title="Free until we save you money"
            body="If we file a benefit (Kindergeld, Elterngeld, Wohngeld, Bürgergeld) and it is rejected on the first substantive decision, that case is free — no subscription charge for the month."
          />
          <Promise
            icon={Stethoscope}
            title="Interpreter no-show refund"
            body="If a booked interpreter does not attend your medical or authority appointment on time, we refund the session and pay for the rebooking."
          />
          <Promise
            icon={Building2}
            title="Visa rejection cover"
            body="If a visa extension or Blue Card renewal we prepared is rejected on procedural grounds we could have prevented, we refund the case-management fee for that case."
          />
        </div>
      </section>

      {/* Data & incident response */}
      <section className="bg-parchment/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionEyebrow>Data & incident response</SectionEyebrow>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Lock className="h-4 w-4 text-primary" /> How your data is protected
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Vault documents encrypted at rest (AES-256) and in transit (TLS 1.3).</li>
                <li>• Multi-factor authentication required for sensitive categories (bank, medical, will, POA).</li>
                <li>• Row-level access control — every read is logged in an immutable audit trail.</li>
                <li>• Case managers see only cases assigned to them; nobody browses the vault at will.</li>
                <li>• Deputies act under per-category scope rules you set: immediate, on incapacity or on death.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-primary" /> If something goes wrong
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Security incident? Write to <span className="font-mono">security@beistandplus.de</span>.</li>
                <li>• Suspected data breach: DSGVO Art. 33 notification to the LfDI within 72h.</li>
                <li>• Vulnerability disclosure welcome — coordinated disclosure, no legal action against good-faith researchers.</li>
                <li>• Complaints: <Link to="/legal/complaints" className="text-primary underline-offset-4 hover:underline">/legal/complaints</Link> — first response within 5 working days.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-[oklch(0.16_0.04_250)] px-8 py-14 text-white shadow-elevated">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(50%_50%_at_80%_20%,oklch(0.72_0.18_190/0.35),transparent)]" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                Have a due-diligence checklist?
              </div>
              <h2 className="display-md mt-2 font-semibold">
                Partners, NGOs and municipal case-workers — we'll answer everything in writing.
              </h2>
              <p className="mt-2 max-w-2xl text-white/70 text-sm">
                Send us your security, DPA or procurement questionnaire and a named security lead
                will respond within 5 working days.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-teal text-[oklch(0.16_0.04_250)] hover:bg-teal/90">
                <Link to="/contact">Request DPA / security pack</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link to="/pricing">See plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

const SLAs: { label: string; community: string; plus: string; complete: string }[] = [
  { label: "First response to a new enquiry", community: "Best-effort, community", plus: "Within 4 working hours", complete: "Within 2 working hours" },
  { label: "Case manager assigned", community: "n/a", plus: "Within 24 hours", complete: "Within 4 hours" },
  { label: "Emergency / bereavement line", community: "Signposting only", plus: "Business hours", complete: "24/7, on call within 1 hour" },
  { label: "Document review turnaround", community: "AI translate only", plus: "1 working day", complete: "Same day" },
  { label: "Complaint acknowledged", community: "5 working days", plus: "2 working days", complete: "1 working day" },
];

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-white/85">
      {children}
    </span>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
      {children}
    </div>
  );
}

function BadgeCard({
  icon: Icon,
  title,
  body,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
          {status}
        </span>
      </div>
      <div className="mt-4 font-display text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Check({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">
          {step}
        </span>
        {title}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Promise({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/30 text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-base font-semibold">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
