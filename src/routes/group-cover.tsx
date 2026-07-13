import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupCoverIntake } from "@/components/group-cover-intake";
import {
  Building2,
  Users,
  Wallet,
  Clock,
  ShieldCheck,
  HeartHandshake,
  Check,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/group-cover")({
  head: () => ({
    meta: [
      { title: "Group Bereavement Cover — €20,000 Sterbegeld for Associations | BeistandPlus" },
      {
        name: "description",
        content:
          "Group Sterbegeld cover for associations, employers and communities — regulated under German law. €20,000 per member, no health questions, 3–7 day payout, fiduciary funeral flow. Broker-tendered to our panel of regulated cover providers.",
      },
      { property: "og:title", content: "Group Bereavement Cover — BeistandPlus" },
      {
        property: "og:description",
        content:
          "€20,000 collective bereavement benefit per member. Waived health questions, waived waiting period, direct funeral settlement, balance to beneficiary.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupCoverPage,
});

const insurers = [
  { name: "DELA", note: "Cooperative · free child co-cover under 20 · migrant-family focus" },
  { name: "Solidar VVaG", note: "Originated as a corporate group fund · deep group experience" },
  { name: "Münchener Verein", note: "Flexible group terms · senior-friendly bands" },
  { name: "ERGO", note: "Large-scale institutional tenders · repatriation add-ons" },
  { name: "Allianz", note: "For very large mandates (25k+ lives) · corporate-grade SLAs" },
  { name: "HanseMerkur", note: "Vorsorge Plus bolt-ons available on the group frame" },
];

const tiers = [
  {
    title: "Tier 1 · Single member",
    icon: <Users className="h-5 w-5" />,
    detail: "Adults 18–75, one insured life, €20,000 payout.",
    example: "Age 30: ~€21–23/mo retail · Age 55: ~€60–70/mo · Age 75: ~€150–180/mo",
    subsidised: "After 15–30% group discount: typically 20–30% cheaper across every age band.",
  },
  {
    title: "Tier 2 · Couple",
    icon: <HeartHandshake className="h-5 w-5" />,
    detail: "Both adults on the group tariff at their respective ages, €20k each.",
    example: "Father 35 (~€25) + Mother 30 (~€22) ≈ €47/mo retail baseline.",
    subsidised: "Group frame: ~€33–40/mo for the couple after institutional discount.",
  },
  {
    title: "Tier 3 · Family",
    icon: <Building2 className="h-5 w-5" />,
    detail: "2 adults + up to 3 children under 20 — kids co-insured free on the family tarif.",
    example: "Same €47/mo as the couple tier — children add €0 at the €3k baseline.",
    subsidised:
      "Broker negotiates a rider to lift the child payout from €3k to the full €20k for a small top-up.",
  },
];

const flatRate = [
  "€35 flat / member / month across the whole pool (blended rate)",
  "Younger members subsidise older ones — actuarially balanced",
  "One SEPA-Corporate mandate per member, one bulk wire to the cover provider",
  "Fluctuation clause: monthly CSV updates auto-adjust the global invoice",
];

const payoutFlow = [
  {
    step: 1,
    title: "Death registered",
    body: "Family or the case manager uploads the Sterbeurkunde and the member's certificate copy in the BeistandPlus portal.",
  },
  {
    step: 2,
    title: "Cover provider wires €20,000 to our fiduciary account",
    body: "Because the association is the named primary beneficiary with a fiduciary clause, no Erbschein is required. Payout typically lands in 3–7 working days.",
  },
  {
    step: 3,
    title: "Funeral director settled directly",
    body: "We pay the vetted funeral director against itemised invoices (avg. €4,200–€8,000 depending on region and burial type).",
  },
  {
    step: 4,
    title: "Balance to the nominated beneficiary",
    body: "Any remainder (frequently >€12,000) is transferred by SEPA to the member's chosen beneficiary within 14 days of the funeral settlement — in Germany or abroad.",
  },
];

const legalNotes = [
  "Obligatory model (recommended): coverage written into the association statutes — no §34d broker licence required by the association itself.",
  "Facultative / opt-in model: triggers §34d GewO licence obligation for the association as an intermediary.",
  "Premiums include the 19% German Versicherungssteuer — the association never adds VAT on top.",
  "Fiduciary payouts sit in a ring-fenced Treuhandkonto, legally separate from the association's operating cash.",
  "Non-profit (gemeinnützig) associations: premium portions are not tax-deductible donations for members.",
];

function GroupCoverPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <Badge variant="secondary" className="uppercase tracking-wider">
          Group Sterbegeld cover · regulated under German law
        </Badge>
        <h1 className="display-hero text-balance mt-4 font-semibold">
          One group policy. €20,000 per member. No health questions.
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          A collective bereavement policy your association, employer or community can hold as the
          single policyholder — with the cover provider bound to accept every member, waived waiting
          periods, and funeral settlement handled by us on day one of a claim.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-gradient-primary">
            <a href="#intake">Brief a broker <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/bereavement-cover">Individual cover instead</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={ShieldCheck} label="100% acceptance" value="No health Qs" note="Risk spread across the pool" />
          <Stat icon={Clock} label="Waiting period" value="0 months" note="Waived at group scale" />
          <Stat icon={Wallet} label="Wholesale discount" value="15–30%" note="Below consumer rates" />
          <Stat icon={Users} label="Free child cover" value="Under 20" note="Cooperative rider" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="display-lg font-semibold">Why a group VVaG plan beats retail buying</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            "100% guaranteed collective acceptance — chronic illness or pre-existing conditions never trigger a premium hike or rejection.",
            "Waiting period waived: retail plans without health checks enforce 6–36 months; a group block of thousands of lives lets an institutional broker negotiate 0 months for the initial enrollment.",
            "Wholesale bulk discount of 15–30% versus retail — no acquisition or marketing cost baked into the group premium.",
            "One monthly bulk invoice from the cover provider. One SEPA batch from your treasury. Fluctuation clause handles joiners and leavers automatically.",
            "Mutuals (VVaG) have no shareholders — surplus flows back into the pool as premium buffers.",
            "Multilingual case manager, direct funeral settlement, fiduciary balance to the family — all inside BeistandPlus.",
          ].map((line) => (
            <div key={line} className="flex gap-3">
              <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm">{line}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="display-lg font-semibold">Three-tier member structure</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A clean pricing spine that maps onto how households actually look. Broker negotiates the
          final group tariff — the ranges below are retail baselines before institutional discount.
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
              <div className="mt-3 rounded-md bg-parchment/50 p-3 text-xs">
                <div className="font-semibold text-foreground">Retail example</div>
                <div className="mt-1 text-muted-foreground">{t.example}</div>
              </div>
              <div className="mt-3 rounded-md border border-primary/20 bg-accent/20 p-3 text-xs">
                <div className="font-semibold text-foreground">In a group frame</div>
                <div className="mt-1 text-muted-foreground">{t.subsidised}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Optional: blended flat rate</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            For simple bookkeeping, most large mandates settle on a single flat premium so every
            member pays the same regardless of age. Recommended when the pool skews younger.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {flatRate.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="display-lg font-semibold">Payout flow — how we handle the funeral</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The association is named as the <em>primary beneficiary with a fiduciary mandate</em>{" "}
          (Widerrufliches Bezugsrecht mit Treuhandauftrag). Every member names their family
          beneficiary for the surplus.
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
          policy the payout bypasses the German inheritance process (no Erbschein) and lands in{" "}
          <strong className="text-foreground">3–7 working days</strong>. Without a named
          beneficiary the money is held up 3–6 months waiting for a certificate of inheritance —
          which is precisely why the fiduciary clause exists.
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="display-lg font-semibold">Cover providers we tender to</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your brief goes to a licensed commercial §34d GewO broker who runs a formal tender with
          these regulated German cover providers. You review the bids; nothing is binding until you sign.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insurers.map((i) => (
            <Card key={i.name} className="p-5">
              <div className="font-semibold">{i.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{i.note}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="display-lg font-semibold">Legal &amp; tax notes for the association</h2>
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
            A print-ready template members sign at enrolment — designating the association
            as revocable beneficiary with a fiduciary mandate, and naming the family
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
