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
        content:
          "Basic €5/mo · Plus €10/mo · Complete €25/mo. Household discounts for couples and families. Third-party fees always separate.",
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

type HouseholdKey = "individual" | "family" | "family_plus";
const HOUSEHOLD_ICONS: Record<HouseholdKey, React.ReactNode> = {
  individual: <User className="h-4 w-4" />,
  family: <Users className="h-4 w-4" />,
  family_plus: <HeartHandshake className="h-4 w-4" />,
};

function Pricing() {
  const { t } = useTranslation();
  const HOUSEHOLD_TABS: { key: HouseholdKey; label: string; note: string }[] = [
    {
      key: "individual",
      label: t("pages.pricing.individual"),
      note: t("pages.pricing.noteIndividual"),
    },
    { key: "family", label: t("pages.pricing.family"), note: t("pages.pricing.noteFamily") },
    {
      key: "family_plus",
      label: t("pages.pricing.extended"),
      note: t("pages.pricing.noteExtended"),
    },
  ];
  const [household, setHousehold] = useState<HouseholdKey>("individual");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select(
          "code, name, tagline, monthly_price_eur, features, household_kind, plan_group, max_adults, max_children, sort_order",
        )
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });

  const columns = useMemo(() => {
    return GROUP_ORDER.map((group) => {
      const plan = plans.find((p) => p.plan_group === group && p.household_kind === household);
      const individual = plans.find(
        (p) => p.plan_group === group && p.household_kind === "individual",
      );
      const savings =
        plan && individual && household !== "individual"
          ? Math.max(
              0,
              Math.round(
                (1 -
                  plan.monthly_price_eur /
                    (individual.monthly_price_eur * (household === "family" ? 2 : 4))) *
                  100,
              ),
            )
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
            Prices and included software features come from the active subscription catalogue. Human
            support and third-party referrals are available only where separately confirmed.
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
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {isLoading && (
            <div className="col-span-3 text-center text-muted-foreground text-sm">
              {t("pages.pricing.loading")}
            </div>
          )}
          {!isLoading &&
            columns.map(({ group, plan, savings }) => {
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
                    <div
                      className={`absolute -top-3 right-6 rounded-full px-3 py-1 text-xs font-semibold ${
                        highlight
                          ? "bg-background text-primary"
                          : "bg-success/15 text-success border border-success/40"
                      }`}
                    >
                      {t("pages.pricing.save", { percent: savings })}
                    </div>
                  )}
                  <div className="font-display text-2xl font-semibold">{meta.title}</div>
                  <div
                    className={`text-sm ${highlight ? "text-primary-foreground/85" : "text-muted-foreground"}`}
                  >
                    {plan.tagline}
                  </div>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display display-lg font-semibold">
                      €{plan.monthly_price_eur}
                    </span>
                    <span
                      className={`text-sm ${highlight ? "text-primary-foreground/85" : "text-muted-foreground"}`}
                    >
                      {t("pages.pricing.perMonth")}
                    </span>
                  </div>
                  <div
                    className={`mt-1 text-xs ${highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    Covers up to {plan.max_adults} adult{plan.max_adults > 1 ? "s" : ""}
                    {plan.max_children > 0 ? ` + ${plan.max_children} kids under 18` : ""}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {(plan.features ?? []).map((f) => {
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
                        <li
                          key={f}
                          className={`flex items-start gap-2 text-sm leading-relaxed ${highlight ? "text-primary-foreground" : ""}`}
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-primary-foreground" : "text-success"}`}
                          />
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

        {/* Trust link */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Review our{" "}
          <Link
            to="/trust"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            security controls and service boundaries →
          </Link>
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
              20% off eligible tier subscriptions with approved student status
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Upload your student card or enrolment certificate (Immatrikulationsbescheinigung).
              Once approved and still valid, the eligible checkout discount is applied
              automatically.
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
            Lawyer, notary, doctor, tax adviser and government fees are quoted transparently in your
            case by the provider and paid directly to that provider. Your subscription covers
            BeistandPlus's help — never the third party's work. Insurance premiums are billed by the
            insurer, not by us.
          </p>
        </div>

        {/* Providers strip */}
        <div className="mt-10 grid gap-6 rounded-2xl border border-border/60 bg-parchment/50 p-8 lg:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
              For providers
            </div>
            <h2 className="display-lg text-balance mt-3 font-semibold">
              Provider directory and onboarding.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Providers can apply for a directory profile. Publication does not make BeistandPlus
              their regulator or guarantee availability; users receive the provider's own identity,
              scope and fee information before contracting.
            </p>
            <Link
              to="/directory"
              className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              See the directory →
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            <Row label="Regulated professionals" note="Status disclosed by provider" />
            <Row label="Service providers" note="Scope and fees confirmed directly" />
            <Row label="Public directory application" note="Subject to review" />
            <Row label="Community organisations" note="Introductions where available" />
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
