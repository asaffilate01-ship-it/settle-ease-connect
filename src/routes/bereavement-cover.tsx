import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { BereavementQuoteWidget } from "@/components/bereavement-quote-widget";
import { FuneralCoverPlans } from "@/components/funeral-cover-plans";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Check, ShieldCheck, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/bereavement-cover")({
  head: () => ({
    meta: [
      { title: "Bereavement Cover — €20,000 Sterbegeld from DELA | BeistandPlus" },
      { name: "description", content: "Bereavement insurance from about €24/month. €20,000 DELA benefit — funeral settled directly, ~€14,000 balance to your beneficiary in Germany or abroad." },
      { property: "og:title", content: "Bereavement Cover — €20,000 Sterbegeld | BeistandPlus" },
      { property: "og:description", content: "€20,000 DELA cover. Funeral costs settled directly, substantial cash balance to your named beneficiary within 14 days." },
    ],
  }),
  component: BereavementCover,
});

const includes = [
  "€20,000 default DELA benefit (adjustable €5k–€20k)",
  "Direct payment to funeral director — no upfront cost to family",
  "Transparent line-item invoicing throughout",
  "Substantial balance (frequently >€12,000) paid to named beneficiary via SEPA",
  "Coverage for burial in Germany or repatriation abroad",
  "Multilingual case manager assigned on day one of a claim",
  "Coordinates with mosque, church, temple or consulate",
  "Children under 20 co-insured free on DELA family tarif",
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
          €8,000 paid directly to the funeral director. Any balance goes to your named beneficiary
          in Germany or abroad. Estimate your premium below — a case manager takes it from there.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <BereavementQuoteWidget />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <FuneralCoverPlans />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-accent/30 via-card to-card p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="uppercase tracking-wider">
                Group / association cover
              </Badge>
              <h2 className="display-lg mt-3 text-balance font-semibold">
                Covering 10,000 members? Use a group Sterbegeld plan instead.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Associations, employers and communities can hold one policy as the single
                policyholder — with the insurer waiving health questions, waiving the waiting
                period, and paying us as a fiduciary so we settle the funeral and pass the
                balance to the family.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, text: "100% acceptance, no health Qs" },
                  { icon: Users, text: "Free child cover under 20 (DELA)" },
                  { icon: Wallet, text: "15–30% below retail rates" },
                  { icon: Building2, text: "3–7 day payout, fiduciary flow" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-gradient-primary">
                  <Link to="/group-cover">
                    See the group plan <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/group-cover" hash="intake">Brief a broker</Link>
                </Button>
              </div>
            </div>
            <div className="min-w-[220px] rounded-xl border border-border/60 bg-card p-5 text-sm shadow-soft">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Fiduciary payout
              </div>
              <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-primary" />Insurer wires €20k to the association</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-primary" />Funeral director paid directly</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-primary" />Balance to nominated beneficiary in 14 days</li>
              </ol>
            </div>
          </div>
        </div>
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
