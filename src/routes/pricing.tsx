import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Check, Users, User, HeartHandshake, GraduationCap, BadgePercent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FuneralCoverPlans } from "@/components/funeral-cover-plans";
import { useStripeCheckout } from "@/hooks/use-stripe-checkout";

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
        content: "Basic €5/mo · Plus €10/mo · Complete €25/mo. Household discounts for couples and families. Third-party fees always separate.",
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
    "Newcomer's Guide to Germany — first-30-days roadmap from airport to Anmeldung",
    "Anmeldung / Ummeldung / Abmeldung checklists with prefilled forms and Bürgeramt finder",
    "Tax ID (Steuer-ID), EWR & German bank-account starter guides (N26, DKB, Sparkasse, comdirect walkthroughs)",
    "Health insurance 101 — GKV vs PKV explained, TK/AOK/Barmer signup guides (mandatory cover)",
    "Housing starter kit — WG-Gesucht & ImmoScout scripts, Schufa, Mietvertrag red flags, Kaution rules",
    "Work & visa basics — Blue Card, Chancenkarte, freelance (Freiberufler), Anerkennung of qualifications",
    "Driving in Germany — licence conversion by country, Führerschein rules, ADAC, car registration",
    "Getting connected — SIM & mobile plans, DSL/fibre, GEZ Rundfunkbeitrag, Deutsche Post & DHL basics",
    "Daily life essentials — Mülltrennung (recycling), Pfand, Sunday quiet rules, Hausordnung, tipping",
    "Public transport — Deutschlandticket, Deutsche Bahn, BVG/MVG/HVV, bike rules and Fahrradstraßen",
    "Family & schools — Kita spots, Schulpflicht, Gymnasium/Realschule/Hauptschule, Kindergeld basics",
    "Integration & language — Integrationskurs eligibility, VHS courses, B1/B2 pathways, free apps",
    "Cultural & social norms — greetings, punctuality, Feierabend, Duzen/Siezen, public holidays by Bundesland",
    "Emergency numbers & first-response (112 / 110 / 116 117), pharmacy Notdienst, ER vs Hausarzt",
    "Knowledge base: benefits, visas, health, housing, schools, driving — searchable in your language",
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
    "Funeral cover advisory (optional add-on up to €20,000 payout — underwritten separately)",
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
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
            {t("pages.pricing.eyebrow")}
          </div>
          <h1 className="display-hero text-balance mt-3 font-semibold">
            {t("pages.pricing.title")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("pages.pricing.subtitle")}
          </p>
        </div>

        {/* Household toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-border/60 bg-card p-1 shadow-soft">
            {HOUSEHOLD_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setHousehold(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  household === tab.key
                    ? "bg-gradient-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {HOUSEHOLD_ICONS[tab.key]}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-muted-foreground">
          {HOUSEHOLD_TABS.find((tab) => tab.key === household)?.note}
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {/* Community (free) tier */}
          <div className="relative flex flex-col rounded-2xl border border-dashed border-teal/50 bg-card p-6 shadow-soft">
            <div className="absolute -top-3 left-6 rounded-full bg-teal px-3 py-1 text-xs font-semibold text-[oklch(0.16_0.04_250)]">
              {t("pages.pricing.communityBadge")}
            </div>
            <div className="font-display text-2xl font-semibold">{t("pages.pricing.communityName")}</div>
            <div className="text-sm text-muted-foreground">
              {t("pages.pricing.communityDesc")}
            </div>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display display-lg font-semibold">€0</span>
              <span className="text-sm text-muted-foreground">{t("pages.pricing.forever")}</span>
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
              <Link to="/auth">{t("pages.pricing.startFree")}</Link>
            </Button>
            <div className="mt-3 text-[11px] text-muted-foreground">
              Refugees, asylum seekers and Bürgergeld recipients — Community stays free for as long as
              you need it, no questions asked.
            </div>
          </div>

          {isLoading && (
            <div className="col-span-3 text-center text-muted-foreground text-sm">{t("pages.pricing.loading")}</div>
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
                    {t("pages.pricing.mostPopular")}
                  </div>
                )}
                {savings > 0 && (
                  <div className={`absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold ${
                    highlight ? "bg-background text-primary" : "bg-success/15 text-success border border-success/40"
                  }`}>
                    {t("pages.pricing.save", { percent: savings })}
                  </div>
                )}
                <div className="font-display text-2xl font-semibold">{meta.title}</div>
                <div className={`text-sm ${highlight ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
                  {plan.tagline}
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display display-lg font-semibold">€{plan.monthly_price_eur}</span>
                  <span className={`text-sm ${highlight ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
                    {t("pages.pricing.perMonth")}
                  </span>
                </div>
                <div className={`mt-1 text-xs ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
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
                            highlight ? "text-primary-foreground/90" : "text-primary/80"
                          }`}
                        >
                          {f}
                        </li>
                      );
                    }
                    return (
                      <li key={f} className={`flex items-start gap-2 text-sm leading-relaxed ${highlight ? "text-primary-foreground" : ""}`}>
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-primary-foreground" : "text-success"}`} />
                        <span>{f}</span>
                      </li>
                    );
                  })}
                </ul>
                <Button
                  asChild
                  className={`mt-6 ${highlight ? "bg-background text-primary hover:bg-background/90" : "bg-gradient-primary"}`}
                >
                  <Link to="/app">{t("pages.pricing.choose", { name: meta.title })}</Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Funeral cover add-on toggle */}
        <BereavementAddOn />

        {/* Trust link */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Every plan is backed by our{" "}
          <Link to="/trust" className="font-semibold text-primary underline-offset-4 hover:underline">
            published SLAs, licences and refund promises →
          </Link>
        </div>

        {/* Launch scope */}
        <div className="mt-24 rounded-2xl border border-border/60 bg-parchment/50 p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
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
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
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

type CoverBandKey = "individual" | "small_family" | "large_family";
const COVER_BANDS: {
  key: CoverBandKey;
  label: string;
  household: string;
  addOnEur: number;
  priceId: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "individual",
    label: "Individual",
    household: "1 adult · €20,000 payout",
    addOnEur: 16,
    priceId: "funeral_cover_individual_monthly",
    icon: <User className="h-4 w-4" />,
  },
  {
    key: "small_family",
    label: "Family",
    household: "Up to 2 adults + 3 children · €20,000 per adult · children co-covered",
    addOnEur: 28,
    priceId: "funeral_cover_family_monthly",
    icon: <Users className="h-4 w-4" />,
  },
  {
    key: "large_family",
    label: "Extended family",
    household: "Up to 4 adults + 3 children · €20,000 per adult · children co-covered",
    addOnEur: 52,
    priceId: "funeral_cover_family_plus_monthly",
    icon: <HeartHandshake className="h-4 w-4" />,
  },
];

function BereavementAddOn() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [band, setBand] = useState<CoverBandKey>("small_family");
  const active = COVER_BANDS.find((b) => b.key === band)!;
  const { openCheckout, checkoutElement } = useStripeCheckout();

  async function handleAddCover() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.href = "/auth?redirect=/pricing";
      return;
    }
    openCheckout({
      priceId: active.priceId,
      title: `Funeral cover — ${active.label}`,
    });
  }

  return (
    <div className="mt-12 rounded-2xl border border-primary/30 bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/80">
            Optional add-on
          </div>
          <h3 className="display-md mt-2 font-semibold">Funeral cover — flat €20,000 per adult</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add regulated funeral cover (regulated under German law) to any plan. Flat €20,000 sum
            per adult, no health questions, funeral director settled directly and any balance
            transferred to your nominated beneficiary. Prices below are indicative — the final rate
            is confirmed on enrolment.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-parchment/60 px-3 py-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          {enabled ? "Add-on selected" : "Add cover to my plan"}
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COVER_BANDS.map((b) => {
          const isActive = b.key === band;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setBand(b.key)}
              className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
                isActive
                  ? "border-primary bg-accent/20 shadow-soft"
                  : "border-border/60 bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-2 text-primary">
                {b.icon}
                <span className="text-xs font-semibold uppercase tracking-widest">{b.label}</span>
              </div>
              <div className="font-display text-2xl font-semibold">
                +€{b.addOnEur}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{t("pages.pricing.perMonth")}</span>
              </div>
              <div className="text-xs text-muted-foreground">{b.household}</div>
            </button>
          );
        })}
      </div>

      {enabled && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-accent/10 p-4 text-sm">
          <div>
            <span className="font-semibold text-foreground">Selected:</span> {active.label} · +€
            {active.addOnEur}/mo. €20,000 per insured adult.
          </div>
          <Button onClick={handleAddCover} className="bg-gradient-primary">
            Subscribe to cover
          </Button>
        </div>
      )}

      <div className="mt-3 text-[11px] text-muted-foreground">
        Cover regulated under German law. Add-on price is billed alongside your BeistandPlus
        subscription; children are co-covered on the family bands at no extra premium.
      </div>
      {checkoutElement}
    </div>
  );
}


