import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { BereavementQuoteWidget } from "@/components/bereavement-quote-widget";
import { FuneralCoverPlans } from "@/components/funeral-cover-plans";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const Route = createFileRoute("/bereavement-cover")({
  head: () => ({
    meta: [
      { title: "Bereavement Cover — €10,000 Sterbegeld | BeistandPlus" },
      { name: "description", content: "Bereavement insurance from €12/month. €10,000 benefit paid directly to funeral directors, balance to your beneficiary — in Germany or abroad." },
      { property: "og:title", content: "Bereavement Cover — BeistandPlus" },
      { property: "og:description", content: "Full funeral costs covered. Direct payment to funeral directors, transparent invoicing, balance to beneficiary." },
    ],
  }),
  component: BereavementCover,
});

const includes = [
  "€10,000 default benefit (adjustable €2k–€20k)",
  "Direct payment to funeral director — no upfront cost to family",
  "Transparent line-item invoicing throughout",
  "Balance paid to named beneficiary via SEPA",
  "Coverage for burial in Germany or repatriation abroad",
  "Multilingual case manager assigned on day one of a claim",
  "Coordinates with mosque, church, temple or consulate",
  "No age cap up to 80; simplified underwriting available",
];

const insurers = [
  { name: "Monuta", note: "Funeral-director network built-in" },
  { name: "DELA", note: "Migrant-family focus, multilingual" },
  { name: "Nürnberger", note: "Flexible underwriting" },
  { name: "IDEAL", note: "Bonus-tier premiums" },
  { name: "HanseMerkur", note: "Vorsorge Plus product" },
];

function BereavementCover() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <Badge variant="secondary" className="uppercase tracking-wider">Sterbegeldversicherung</Badge>
        <h1 className="display-hero text-balance mt-4 font-semibold">
          Bereavement cover, done properly.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          €10,000 paid directly to the funeral director. Any balance goes to your named beneficiary
          in Germany or abroad. Estimate your premium below — a case manager takes it from there.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <BereavementQuoteWidget />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <FuneralCoverPlans />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="display-lg text-balance font-semibold">What's included</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {includes.map((item) => (
            <div key={item} className="flex gap-3">
              <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="display-lg text-balance font-semibold">Underwritten by partner insurers</h2>
        <p className="mt-2 text-muted-foreground">
          We compare offers from Germany's leading Sterbegeld providers so you don't have to.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insurers.map((i) => (
            <Card key={i.name} className="p-5">
              <div className="font-semibold">{i.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{i.note}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="display-lg text-balance font-semibold">Claim flow when it matters</h2>
        <ol className="mt-8 space-y-4">
          {[
            "Family opens a claim in BeistandPlus (60-second form).",
            "Case manager assigned within 15 minutes; notifies insurer.",
            "Sterbeurkunde collected; funeral director from vetted directory engaged.",
            "Insurer pays funeral director directly — family pays nothing upfront.",
            "Line-item invoices posted to the family dashboard in real time.",
            "Any remaining balance transferred to the named beneficiary via SEPA.",
          ].map((step, i) => (
            <li key={step} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <div className="pt-1">{step}</div>
            </li>
          ))}
        </ol>
        <div className="mt-10 rounded-lg border-l-4 border-primary bg-accent/30 p-5 text-sm text-muted-foreground">
          BeistandPlus acts as introducer (Tippgeber / §34d GewO broker where applicable). Advice and
          binding offers come from the licensed partner insurer. See our{" "}
          <Link to="/legal/terms" className="underline">terms</Link> and{" "}
          <Link to="/legal/privacy" className="underline">privacy notice</Link>.
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
