import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Beistand" },
      {
        name: "description",
        content:
          "Simple monthly plans for individuals, families and students. Provider portals priced separately.",
      },
      { property: "og:title", content: "Pricing — Beistand" },
      {
        property: "og:description",
        content:
          "Free forever for basics. Premium from €12/month. Family & Student plans available.",
      },
    ],
  }),
  component: Pricing,
});

const tiers = [
  {
    name: "Basic",
    price: "€0",
    period: "forever",
    tagline: "Get started, get settled.",
    features: [
      "AI assistant (100 queries/mo)",
      "Anmeldung & first-30-days checklists",
      "Benefits eligibility checker",
      "Provider directory access",
      "1 document in vault",
    ],
    cta: "Start free",
  },
  {
    name: "Premium",
    price: "€12",
    period: "/ month",
    tagline: "For individuals settling in Germany.",
    highlight: true,
    features: [
      "Unlimited AI assistant",
      "Digital document vault (unlimited)",
      "Visa & permit expiry reminders",
      "Appointment booking assistance",
      "Discounted translation services",
      "Human case manager (business hours)",
    ],
    cta: "Go Premium",
  },
  {
    name: "Family",
    price: "€25",
    period: "/ month",
    tagline: "One plan for the whole household.",
    features: [
      "Everything in Premium",
      "Up to 6 members",
      "School & Kita registration help",
      "Kindergeld & Elterngeld guidance",
      "Emergency bereavement coordination",
      "24/7 human case manager",
    ],
    cta: "Get Family plan",
  },
  {
    name: "Student",
    price: "€8",
    period: "/ month",
    tagline: "Purpose-built for international students.",
    features: [
      "Everything in Premium",
      "Blocked account setup",
      "BAföG guidance",
      "University enrolment support",
      "Semester ticket & permit reminders",
    ],
    cta: "Get Student plan",
  },
];

function Pricing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
            Pricing
          </div>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Care that pays for itself.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Members recover far more than their subscription in benefits
            claimed correctly, appointments not missed, and stress avoided.
          </p>
        </div>
        <div className="mt-16 grid gap-6 lg:grid-cols-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl border p-6 shadow-soft ${
                t.highlight
                  ? "border-primary bg-gradient-primary text-primary-foreground shadow-elevated"
                  : "border-border/60 bg-card"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  Most popular
                </div>
              )}
              <div className="font-display text-2xl font-semibold">{t.name}</div>
              <div className={`text-sm ${t.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {t.tagline}
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-semibold">{t.price}</span>
                <span className={`text-sm ${t.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {t.period}
                </span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${t.highlight ? "text-accent" : "text-success"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-6 ${t.highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-gradient-primary"}`}
              >
                <Link to="/app">{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-24 grid gap-6 rounded-2xl border border-border/60 bg-parchment/50 p-8 lg:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
              For providers
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              Free access for funeral directors, mosques, churches, airlines & more.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Providers don't pay a subscription. Instead, partners commit
              wholesale rates on their services — we pass them through to
              families at fair, transparent prices and take a small margin to
              run the platform.
            </p>
            <Link
              to="/for-providers"
              className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              See partner portals →
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            <Row label="Funeral director portal" note="Free · Wholesale rate card" />
            <Row label="Mosque / Church / Temple portal" note="Free · Community partner" />
            <Row label="Airline & repatriation partner" note="Free · Negotiated fares" />
            <Row label="Hospital & consulate integration" note="Free · Integration MoU" />
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Row({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4">
      <div className="font-medium">{label}</div>
      <div className="font-display text-sm font-semibold text-success">{note}</div>
    </div>
  );
}
