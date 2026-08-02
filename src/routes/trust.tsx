import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  Lock,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { publicLegal } from "@/lib/public-config";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Security, privacy and service boundaries — BeistandPlus" },
      {
        name: "description",
        content:
          "The controls implemented in BeistandPlus, the limits of its referral services, and the deployment evidence required before launch.",
      },
      { property: "og:title", content: "Security and service boundaries — BeistandPlus" },
      {
        property: "og:description",
        content: "Implemented controls, clear referral boundaries and deployment responsibilities.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://beistandplus.de/trust" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/trust" }],
  }),
  component: TrustPage,
});

const CODE_CONTROLS = [
  {
    icon: KeyRound,
    title: "Server-enforced MFA",
    body: "High-impact vault, finance, compliance and administrative operations require a current AAL2 session on the server.",
  },
  {
    icon: Lock,
    title: "Database access boundaries",
    body: "Supabase row-level policies limit access by owner, assignment, participant, deputy or an explicit expiring family grant.",
  },
  {
    icon: ShieldCheck,
    title: "Payment integrity",
    body: "Webhook event IDs are recorded for idempotency, return URLs are allowlisted and live expert payouts are disabled.",
  },
  {
    icon: Server,
    title: "Abuse and delivery controls",
    body: "Public endpoints use database-backed rate limits. Partner deliveries are HTTPS-only, host-allowlisted, signed and retry-safe.",
  },
  {
    icon: FileCheck2,
    title: "Audit evidence",
    body: "Sensitive operations record bounded event metadata without copying message bodies, invitation tokens or partner payloads.",
  },
  {
    icon: Users,
    title: "Family access",
    body: "Invitations are email-bound, expiring and revocable. A family role alone does not grant access to every case.",
  },
];

const SERVICE_BOUNDARIES = [
  "BeistandPlus is not an insurer and does not provide insurance advice or underwrite cover.",
  "Funeral and health-insurance enquiries are referrals only; the receiving provider confirms its identity, regulatory status, price and terms.",
  "BeistandPlus is not a law firm or tax-advisory practice. Regulated advice must come from the professional who contracts with you.",
  "A directory listing, category selection or automated estimate is not a recommendation, quote, approval or guarantee.",
  "Third-party fees, availability and response times are confirmed by the provider before you proceed.",
];

const DEPLOYMENT_EVIDENCE = [
  "Verified company, register, VAT, management and data-protection contact details",
  "Executed contracts, licences and data-processing terms for every enabled external provider",
  "Documented hosting regions, subprocessors, retention schedule and international-transfer safeguards",
  "Restore-tested backups, monitoring, alerting, incident response and named on-call owners",
  "Role-by-role RLS acceptance tests, accessibility review and independent security testing",
  "Published support hours and service commitments backed by staffed operational capacity",
];

function TrustPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[oklch(0.16_0.04_250)] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_20%_10%,oklch(0.72_0.18_190/0.35),transparent),radial-gradient(50%_50%_at_90%_30%,oklch(0.68_0.22_25/0.25),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal">
                <ShieldCheck className="h-3.5 w-3.5" /> Trust & accountability
              </div>
              <h1 className="display-hero mt-4 text-balance font-semibold">
                Security claims should be specific. Service boundaries should be obvious.
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/70">
                This page separates controls implemented in the product from legal, provider and
                operational evidence that must be verified for each production deployment.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                {[
                  "AAL2 for sensitive actions",
                  "Row-level database policies",
                  "Signed partner delivery",
                  "Referral-only insurance",
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/85"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
            Implemented in the repository
          </p>
          <h2 className="display-lg mt-3 max-w-3xl text-balance font-semibold">
            Defence in depth for sensitive workflows.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CODE_CONTROLS.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-parchment/50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                Service boundaries
              </p>
              <h2 className="display-lg mt-3 text-balance font-semibold">
                What BeistandPlus does not claim to be.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Regulated work remains with the independently responsible provider. A referral is
                not a substitute for product documents or professional advice.
              </p>
            </div>
            <ul className="space-y-3">
              {SERVICE_BOUNDARIES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 text-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="rounded-3xl border border-warning/30 bg-warning/10 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-warning-foreground" />
              <div>
                <h2 className="display-md font-semibold">
                  Production evidence is deployment-specific.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Source code alone cannot prove licences, legal identity, staffed service levels,
                  hosting location, backup recovery or partner contracts.
                </p>
                <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                  {DEPLOYMENT_EVIDENCE.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span aria-hidden className="mt-1 text-primary">
                        •
                      </span>{" "}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[oklch(0.16_0.04_250)] px-8 py-12 text-white shadow-elevated">
            <h2 className="display-md font-semibold">
              Need privacy, security or procurement information?
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Use the contact form and include the organisation and evidence you need. We will not
              represent a certification or contract as complete until it can be documented.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-teal text-[oklch(0.16_0.04_250)] hover:bg-teal/90">
                <Link to="/contact">Contact us</Link>
              </Button>
              {publicLegal.privacyEmail && (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={`mailto:${publicLegal.privacyEmail}`}>Privacy contact</a>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
