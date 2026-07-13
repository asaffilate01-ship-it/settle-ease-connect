import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Check, Users, User, HeartHandshake, GraduationCap, BadgePercent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FuneralCoverPlans } from "@/components/funeral-cover-plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — BeistandPlus" },
      {
        name: "description",
        content:
          "Simple monthly plans for individuals and families in Germany. Household discounts for 2 adults + 3 kids or up to 4 adults + 3 kids. Third-party fees always separate.",
      },
      { property: "og:title", content: "Pricing — BeistandPlus" },
      {
        property: "og:description",
        content: "From €5/month solo. Family plans from €9/month. Case management from €25/month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://beistandplus.de/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://beistandplus.de/pricing" }],
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

type HouseholdKey = "individual" | "family" | "family_plus";
const HOUSEHOLD_ICONS: Record<HouseholdKey, React.ReactNode> = {
  individual: <User className="h-4 w-4" />,
  family: <Users className="h-4 w-4" />,
  family_plus: <HeartHandshake className="h-4 w-4" />,
};

function Pricing() {
  const { t } = useTranslation();
  const HOUSEHOLD_TABS: { key: HouseholdKey; label: string; note: string }[] = [
    { key: "individual", label: t("pages.pricing.individual"), note: t("pages.pricing.noteIndividual") },
    { key: "family", label: t("pages.pricing.family"), note: t("pages.pricing.noteFamily") },
    { key: "family_plus", label: t("pages.pricing.extended"), note: t("pages.pricing.noteExtended") },
  ];
  const [household, setHousehold] = useState<HouseholdKey>("family");

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
          <h1 className="display-hero text-balance mt-3 font-semibold">
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
        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {/* Community (free) tier */}
          <div className="relative flex flex-col rounded-2xl border border-dashed border-teal/50 bg-card p-6 shadow-soft">
            <div className="absolute -top-3 left-6 rounded-full bg-teal px-3 py-1 text-xs font-semibold text-[oklch(0.16_0.04_250)]">
              Free · Community
            </div>
            <div className="font-display text-2xl font-semibold">Community</div>
            <div className="text-sm text-muted-foreground">
              A safety net for anyone in Germany — no card required.
            </div>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display display-lg font-semibold">€0</span>
              <span className="text-sm text-muted-foreground">/ forever</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Funded by paying members and NGO / municipal partners
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm leading-relaxed">
              {[
                "AI letter translator & explainer — any German letter, 13 languages",
                "Benefit-eligibility checker (Kindergeld, Wohngeld, Bürgergeld, Elterngeld)",
                "Prefilled Anmeldung / Ummeldung / Abmeldung forms",
                "Life-event playbooks and knowledge base",
                "1 case per year with a real case manager (subject to fair-use review)",
                "Multi-faith community & provider directory",
                "Pay-per-use interpreter booking (no subscription needed)",
                "Community forum — help from other members, moderated by our team",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-6 border-teal/40 text-foreground hover:bg-teal/10">
              <Link to="/auth">Start free</Link>
            </Button>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Refugees, asylum seekers and Bürgergeld recipients — Community stays free for as long as
              you need it, no questions asked.
            </div>
          </div>

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
                  <span className="font-display display-lg font-semibold">€{plan.monthly_price_eur}</span>
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

        {/* Trust link */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Every plan is backed by our{" "}
          <Link to="/trust" className="font-semibold text-primary underline-offset-4 hover:underline">
            published SLAs, licences and refund promises →
          </Link>
        </div>

        {/* Launch scope */}
        <div className="mt-24 rounded-2xl border border-border/60 bg-parchment/50 p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
            What we help with at launch
          </div>
          <h2 className="display-lg text-balance mt-3 font-semibold">
            Bereavement, benefits, housing, pensions and paperwork — done properly, in your language.
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            BeistandPlus launches with the moments that matter most: help through a death in the family,
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

        {/* Bereavement / funeral cover — full premium matrix */}
        <div className="mt-10">
          <FuneralCoverPlans />
        </div>

        {/* Student discount */}
        <div className="mt-10 grid gap-6 rounded-2xl border border-accent/40 bg-accent/10 p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/80">
              <GraduationCap className="h-4 w-4" /> International students
            </div>
            <h3 className="display-md mt-2 font-semibold">
              30% off any plan with a valid student ID
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Upload your student card or enrolment certificate (Immatrikulationsbescheinigung). We verify within 24 hours,
              apply the discount automatically, and renew it each semester on request.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-gradient-primary">
              <Link to="/students">
                <BadgePercent className="mr-2 h-4 w-4" /> Learn more
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/student-discount">Verify now</Link>
            </Button>
          </div>
        </div>

        {/* Third-party fees note */}
        <div className="mt-10 rounded-2xl border border-border/60 bg-parchment/50 p-8">
          <h3 className="display-md font-semibold">Third-party fees are always separate</h3>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Lawyer, notary, doctor, tax adviser and government fees are quoted transparently in your case
            and paid via the platform (escrow) or directly. Your subscription covers BeistandPlus's help —
            never the third party's work. Insurance premiums are billed by the insurer, not by us.
          </p>
        </div>



        {/* Providers strip */}
        <div className="mt-10 grid gap-6 rounded-2xl border border-border/60 bg-parchment/50 p-8 lg:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
              For providers
            </div>
            <h2 className="display-lg text-balance mt-3 font-semibold">
              Vetted experts free. Public directory free too.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Regulated experts (lawyers, notaries, tax, doctors) join by invitation and earn on referral fees.
              Any qualified service provider can list in our public directory for free — contact details are only shown to paying BeistandPlus members.
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
