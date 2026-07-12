import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Check, Users, User, HeartHandshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Beistand" },
      {
        name: "description",
        content:
          "Simple monthly plans for individuals and families in Germany. Household discounts for 2 adults + 3 kids or up to 4 adults + 3 kids. Third-party fees always separate.",
      },
      { property: "og:title", content: "Pricing — Beistand" },
      {
        property: "og:description",
        content: "From €5/month solo. Family plans from €9/month. Case management from €25/month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

type Plan = {
  code: string;
  name: string;
  tagline: string | null;
  monthly_price_eur: number;
  features: string[] | null;
  household_kind: "individual" | "family" | "family_plus";
  plan_group: string;
  max_adults: number;
  max_children: number;
  sort_order: number;
};

const GROUP_ORDER = ["basic", "plus", "complete"];
const GROUP_META: Record<string, { title: string; badge?: string; inherits?: string }> = {
  basic: { title: "Basic" },
  plus: { title: "Plus", inherits: "Basic" },
  complete: { title: "Complete", badge: "Most popular", inherits: "Plus" },
};

// Full feature matrix per tier — shown on every household variant.
const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    "Personal life-admin vault (documents, IDs, permits, contracts) — encrypted, GDPR-hosted in Germany",
    "Deadline & renewal tracker (visa, Aufenthaltstitel, passport, insurance, MOT/TÜV, tenancy)",
    "11-language interface — DE · EN · TR · UR · HI · PA · PS · AR · KU · RU · UK",
    "Anmeldung / Ummeldung / Abmeldung checklists with prefilled forms",
    "Tax ID, EWR & bank-account starter guides",
    "Knowledge base: benefits, visas, health, housing, schools, driving",
    "AI assistant for German letters — translate, summarise, draft a reply",
    "Life-event playbooks: birth, marriage, illness, injury, redundancy, death",
    "Trusted contacts (nominate 3 emergency people, in priority order)",
    "Community events, mosque / church / temple / gurdwara directory",
    "Email support · reply within 2 working days",
  ],
  plus: [
    "Everything in Basic, plus:",
    "Personal case manager assigned to your household",
    "Priority chat & phone support · reply within 4 working hours",
    "Benefits filed for you: Kindergeld, Elterngeld, Wohngeld, Bürgergeld, BAföG",
    "Pension guidance (statutory Rente, Riester, Rürup, Betriebsrente, private)",
    "Health-insurance comparison and switching (GKV ↔ PKV, Zusatz, dependants)",
    "Employment help: German CV, Anerkennung of foreign qualifications, interview prep",
    "Housing support: WG & apartment search, Sozialwohnung advice, deposit letters",
    "Sworn-translation coordination (documents, certificates, medical letters)",
    "Doctor & hospital appointment booking with an interpreter",
    "Ausländerbehörde bookings and escort (visa extensions, change of purpose)",
    "Tax pre-check and Steuererklärung handover to a vetted Steuerberater",
    "Family & dependants: add spouse, children and parents to the household as they arrive",
    "Full referral & partner discounts (movers, insurers, currency transfer, airlines)",
  ],
  complete: [
    "Everything in Plus, plus:",
    "24/7 human bereavement & emergency line — case manager on the phone within 1 hour",
    "End-to-end death admin: Standesamt, funeral director, mosque / church / temple, cemetery, embassy, airline, insurer, employer, banks",
    "Repatriation coordination (zinc coffin, embalming, consular NOC, airline cargo, receiving director abroad)",
    "Immigration desk: visas, residence permits, naturalisation, repatriation, embassy & consulate contacts across Germany",
    "Lawyer, notary, tax adviser and doctor concierge — vetted, quoted, paid through platform escrow",
    "Bereavement cover advisory (optional insurance add-on up to €10,000 payout — underwritten separately)",
    "Full transparent invoicing — every third-party euro itemised, with remaining balance paid to your nominated beneficiary",
    "Life-plan review twice a year with your case manager",
    "Digital deputy access — a trusted person can act for you in illness or after death",
    "White-glove new-arrival onboarding: airport pickup coordination, first-week schedule, SIM, bank, GP",
    "Case audit trail, timestamped, exportable for lawyers, insurers or courts",
    "Priority access to new services as we launch them",
  ],
};

const HOUSEHOLD_TABS: { key: "individual" | "family" | "family_plus"; label: string; icon: React.ReactNode; note: string }[] = [
  { key: "individual", label: "Individual", icon: <User className="h-4 w-4" />, note: "1 adult" },
  { key: "family", label: "Family", icon: <Users className="h-4 w-4" />, note: "2 adults + up to 3 kids under 18" },
  { key: "family_plus", label: "Extended family", icon: <HeartHandshake className="h-4 w-4" />, note: "Up to 4 adults + 3 kids under 18" },
];

function Pricing() {
  const [household, setHousehold] = useState<"individual" | "family" | "family_plus">("family");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("code, name, tagline, monthly_price_eur, features, household_kind, plan_group, max_adults, max_children, sort_order")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });

  const columns = useMemo(() => {
    return GROUP_ORDER.map((group) => {
      const plan = plans.find((p) => p.plan_group === group && p.household_kind === household);
      const individual = plans.find((p) => p.plan_group === group && p.household_kind === "individual");
      const savings =
        plan && individual && household !== "individual"
          ? Math.max(0, Math.round((1 - plan.monthly_price_eur / (individual.monthly_price_eur * (household === "family" ? 2 : 4))) * 100))
          : 0;
      return { group, plan, savings };
    });
  }, [plans, household]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
            Pricing
          </div>
          <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            One subscription. One trusted hand.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Members recover far more than their subscription in benefits claimed correctly,
            appointments not missed, and stress avoided. Household plans discounted for couples and
            families of up to 4 adults + 3 children.
          </p>
        </div>

        {/* Household toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-border/60 bg-card p-1 shadow-soft">
            {HOUSEHOLD_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setHousehold(t.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  household === t.key
                    ? "bg-gradient-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-muted-foreground">
          {HOUSEHOLD_TABS.find((t) => t.key === household)?.note}
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {isLoading && (
            <div className="col-span-3 text-center text-muted-foreground text-sm">Loading plans…</div>
          )}
          {!isLoading && columns.map(({ group, plan, savings }) => {
            if (!plan) return null;
            const meta = GROUP_META[group];
            const highlight = group === "complete";
            return (
              <div
                key={plan.code}
                className={`relative flex flex-col rounded-2xl border p-6 shadow-soft ${
                  highlight
                    ? "border-primary bg-gradient-primary text-primary-foreground shadow-elevated"
                    : "border-border/60 bg-card"
                }`}
              >
                {meta.badge && highlight && (
                  <div className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    {meta.badge}
                  </div>
                )}
                {savings > 0 && (
                  <div className={`absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold ${
                    highlight ? "bg-background text-primary" : "bg-success/20 text-success-foreground border border-success/40"
                  }`}>
                    Save {savings}%
                  </div>
                )}
                <div className="font-display text-2xl font-semibold">{meta.title}</div>
                <div className={`text-sm ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-semibold">€{plan.monthly_price_eur}</span>
                  <span className={`text-sm ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    / month
                  </span>
                </div>
                <div className={`mt-1 text-xs ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  Covers up to {plan.max_adults} adult{plan.max_adults > 1 ? "s" : ""}
                  {plan.max_children > 0 ? ` + ${plan.max_children} children under 18` : ""}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {(PLAN_FEATURES[group] ?? plan.features ?? []).map((f) => {
                    const isInheritLine = /^Everything in .+, plus:$/.test(f);
                    if (isInheritLine) {
                      return (
                        <li
                          key={f}
                          className={`pt-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                            highlight ? "text-accent" : "text-primary/80"
                          }`}
                        >
                          {f}
                        </li>
                      );
                    }
                    return (
                      <li key={f} className="flex items-start gap-2 text-sm leading-relaxed">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-accent" : "text-success"}`} />
                        <span>{f}</span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  asChild
                  className={`mt-6 ${highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-gradient-primary"}`}
                >
                  <Link to="/app">Choose {meta.title}</Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Launch scope */}
        <div className="mt-24 rounded-2xl border border-border/60 bg-parchment/50 p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
            What we help with at launch
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold">
            Bereavement, benefits, housing, pensions and paperwork — done properly, in your language.
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            Beistand launches with the moments that matter most: help through a death in the family,
            applying for benefits, housing and pensions, disability and unemployment claims, tax
            filings, visa extensions, and translation at doctors, GPs, hospitals and banks. Student
            visas and study add-ons come next.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LAUNCH_SCOPE.map((s) => (
              <div key={s} className="rounded-xl border border-border/60 bg-card p-3 text-sm">
                <Check className="mr-2 inline h-4 w-4 text-success" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Bereavement cover & 3rd-party */}
        <div className="mt-10 rounded-2xl border border-border/60 bg-card p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-parchment/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-foreground/80">
                Optional add-on · Underwritten by regulated insurers
              </div>
              <h3 className="mt-3 font-display text-2xl font-semibold">Bereavement cover</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A dedicated insurance policy that pays out up to <strong className="text-foreground">€10,000</strong> on
                death to cover funeral costs and everything around them — so the family never has to
                find the money upfront at the hardest moment.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span><strong className="text-foreground">€10,000 benefit</strong> paid directly to the funeral director and other approved service providers on production of invoices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>Covers funeral, cremation or burial, mosque / church / temple fees, repatriation of the body to the home country, death certificates, sworn translations and estate admin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span><strong className="text-foreground">Full transparent invoicing</strong> — every payment is itemised in your family's case file; nothing goes anywhere without a receipt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>Any balance remaining after all costs are settled is paid to the <strong className="text-foreground">nominated beneficiary</strong> — in Germany or abroad, in their local currency.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>Monthly premium set by the insurer based on age, health, family composition and the members added to the policy.</span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Premiums are paid directly to the insurer. Beistand handles the paperwork, the claim
                and the coordination with providers — never the underwriting.
              </p>
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold">Third-party fees are always separate</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Lawyer, notary, doctor, tax adviser and government fees are quoted transparently in
                your case and paid via the platform (escrow) or directly. Your subscription covers
                Beistand's help — never the third party's work.
              </p>
            </div>
          </div>
        </div>


        {/* Providers strip */}
        <div className="mt-10 grid gap-6 rounded-2xl border border-border/60 bg-parchment/50 p-8 lg:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
              For providers
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              Vetted experts free. Public directory free too.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Regulated experts (lawyers, notaries, tax, doctors) join by invitation and earn on referral fees.
              Any qualified service provider can list in our public directory for free — contact details are only shown to paying Beistand members.
            </p>
            <Link
              to="/directory"
              className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              See the directory →
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            <Row label="Vetted regulated experts" note="Free · Referral fee 10–15%" />
            <Row label="Vetted service providers" note="Free · Wholesale + platform markup" />
            <Row label="Public directory listing" note="Free · Members-only visibility" />
            <Row label="Community partners (mosques, churches, temples)" note="Free" />
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

const LAUNCH_SCOPE = [
  "Bereavement & death admin",
  "Benefits (Bürgergeld, Wohngeld…)",
  "Housing & rental support",
  "Pensions (Rente, private)",
  "Disability benefits",
  "Unemployment support",
  "Tax filings & advice",
  "Visa extensions",
  "Doctor / GP / hospital translation",
  "Bank & finance translation",
  "Blue Card & residence renewals",
  "Kindergeld & Elterngeld",
];

function Row({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4">
      <div className="font-medium">{label}</div>
      <div className="font-display text-sm font-semibold text-success">{note}</div>
    </div>
  );
}
