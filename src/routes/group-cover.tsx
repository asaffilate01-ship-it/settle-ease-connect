import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupCoverIntake } from "@/components/group-cover-intake";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Building2,
  Users,
  Clock,
  ShieldCheck,
  HeartHandshake,
  Check,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/group-cover")({
  head: () => ({
      meta: [
        { title: "Funeral Cover — €20,000 Sterbegeld | BeistandPlus" },
        {
          name: "description",
          content:
            "Funeral cover regulated under German law. €20,000 per insured, no health questions, 3–7 day payout, direct funeral settlement, balance to your beneficiary.",
        },
        { property: "og:title", content: "Funeral Cover — BeistandPlus" },
      {
        property: "og:description",
        content:
          "€20,000 funeral benefit. Waived health questions, waived waiting period, direct funeral settlement, balance to beneficiary.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupCoverPage,
});


const tiers = [
  {
    title: "Tier 1 · Single",
    icon: <Users className="h-5 w-5" />,
    detail: "One insured adult (18–75), €20,000 flat payout.",
    note: "Fixed monthly rate confirmed at enrolment — no health questions.",
  },
  {
    title: "Tier 2 · Couple",
    icon: <HeartHandshake className="h-5 w-5" />,
    detail: "Both adults insured, €20,000 payout each.",
    note: "Both adults covered on one policy — one direct debit.",
  },
  {
    title: "Tier 3 · Family",
    icon: <Building2 className="h-5 w-5" />,
    detail: "2 adults + up to 3 children under 20 — children co-insured on the family tarif.",
    note: "Children under 20 co-insured at no extra premium.",
  },
];


const payoutFlow = [
  {
    step: 1,
    title: "Death registered",
    body: "Family or the case manager uploads the Sterbeurkunde in the BeistandPlus portal.",
  },
  {
    step: 2,
    title: "Cover provider wires €20,000 to our fiduciary account",
    body: "Because we are named as primary beneficiary with a fiduciary clause, no Erbschein is required. Payout typically lands in 3–7 working days.",
  },
  {
    step: 3,
    title: "Funeral director settled directly",
    body: "We pay the vetted funeral director against itemised invoices (avg. €4,200–€8,000 depending on region and burial type).",
  },
  {
    step: 4,
    title: "Balance to your named beneficiary",
    body: "Any remainder is transferred by SEPA to your chosen beneficiary within 14 days of the funeral settlement — in Germany or abroad.",
  },
];

const legalNotes = [
  "Premiums include the 19% German Versicherungssteuer — never added on top.",
  "Fiduciary payouts sit in a ring-fenced Treuhandkonto, legally separate from operating cash.",
  "You can update your named beneficiary at any time from your BeistandPlus account.",
  "Cover is portable — your policy continues if you move within Germany or the EU.",
];

function GroupCoverPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <Badge variant="secondary" className="uppercase tracking-wider">
          Sterbegeld cover · regulated under German law
        </Badge>
        <h1 className="display-hero text-balance mt-4 font-semibold">
          €20,000 of funeral cover.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          You are covered to €20,000 under German law — with no health questions, no waiting periods, and funeral settlement handled by us from day one of a claim.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-primary">
            <a href="#intake">Get funeral cover <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/bereavement-cover">See individual cover</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat icon={ShieldCheck} label="100% acceptance" value="All ages 18–75" note="No health questions asked" />
          <Stat icon={Clock} label="Waiting period" value="0 months" note="Cover starts on day one" />
          <Stat icon={Users} label="Free child cover" value="Under 20" note="Included on family tarif" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">

        <h2 className="display-lg font-semibold">Three cover tiers</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A clean pricing spine that maps onto how households actually look. Choose the tier that
          fits your family — the rate is fixed at enrolment.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <Card key={t.title} className="p-5">
              <div className="flex items-center gap-2 text-primary">
                {t.icon}
                <span className="text-xs font-semibold uppercase tracking-widest">{t.title.split("·")[0]}</span>
              </div>
              <div className="mt-2 font-display text-lg font-semibold">{t.title.split("·")[1]?.trim()}</div>
              <p className="mt-2 text-sm text-muted-foreground">{t.detail}</p>
              <div className="mt-3 rounded-md border border-primary/20 bg-accent/20 p-3 text-xs">
                <div className="font-semibold text-foreground">Included</div>
                <div className="mt-1 text-muted-foreground">{t.note}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="display-lg font-semibold">Payout flow — how we handle the funeral</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          BeistandPlus is named as the <em>primary beneficiary with a fiduciary mandate</em>{" "}
          (Widerrufliches Bezugsrecht mit Treuhandauftrag). You name your family beneficiary
          for the surplus.
        </p>
        <ol className="mt-6 space-y-4">
          {payoutFlow.map((s) => (
            <li key={s.step} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {s.step}
              </div>
              <div className="pt-1">
                <div className="font-semibold">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-xl border-l-4 border-primary bg-accent/20 p-5 text-sm">
          <strong className="text-foreground">Speed:</strong> when a beneficiary is named on the
          cover the payout bypasses the German inheritance process (no Erbschein) and lands in{" "}
          <strong className="text-foreground">3–7 working days</strong>. Without a named
          beneficiary the money is held up 3–6 months waiting for a certificate of inheritance —
          which is precisely why the fiduciary clause exists.
        </div>
      </section>


      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="display-lg font-semibold">Legal &amp; tax notes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {legalNotes.map((n) => (
            <div key={n} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">{n}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-border/60 bg-parchment/40 p-5 text-sm">
          <div className="font-semibold">Sample fiduciary clause (Treuhandvereinbarung)</div>
          <p className="mt-1 text-muted-foreground">
            A print-ready template you sign at enrolment — designating BeistandPlus
            as revocable beneficiary with a fiduciary mandate, and naming your family
            beneficiary for the surplus.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link to="/group-cover/fiduciary-clause">
              Open template <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="intake" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <GroupCoverIntake />
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{note}</div>
    </div>
  );
}
