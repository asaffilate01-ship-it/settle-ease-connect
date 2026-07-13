import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, User, Users, HeartHandshake, ShieldCheck } from "lucide-react";
import { estimatePremium } from "@/lib/premium-estimator";
import { Button } from "@/components/ui/button";

/**
 * Funeral / bereavement cover — premium matrix.
 *
 * Individual and family plans built on top of `estimatePremium` (which
 * interpolates published rate tables from DELA, Monuta, Nürnberger, IDEAL,
 * HanseMerkur 2024–2025). Ranges are Tippgeber-safe indications, never
 * binding quotes.
 *
 * Coverage: €20,000 default benefit per insured adult — matches the DELA
 * cooperative €20k Sterbegeld tarif we broker into. Children under 20 are
 * included at no additional premium on family / extended-family plans
 * (DELA free-child rider).
 */

const ADULT_AGE_BANDS = [30, 40, 50, 60, 70] as const;
const BENEFIT_EUR = 20_000;

function bandFor(age: number) {
  return estimatePremium({
    age,
    benefitAmount: BENEFIT_EUR,
    tobacco: false,
    waitingPeriodMonths: 0,
  });
}

function fmt(n: number) {
  return `€${n.toFixed(0)}`;
}

type Household = "individual" | "family" | "extended";

const TABS: { key: Household; label: string; icon: React.ReactNode; note: string }[] = [
  { key: "individual", label: "Individual", icon: <User className="h-4 w-4" />, note: "1 adult · €20k benefit" },
  { key: "family", label: "Family", icon: <Users className="h-4 w-4" />, note: "2 adults + up to 3 children under 20 · €20k per adult" },
  { key: "extended", label: "Extended family", icon: <HeartHandshake className="h-4 w-4" />, note: "Up to 4 adults + 3 children under 20 · €20k per adult" },
];

const COVERAGE = [
  "€20,000 benefit per insured adult — paid on death, no medical exam required for standard tarifs",
  "Direct settlement of funeral director, cemetery, mosque / church / temple, cremation, coffin, flowers, catering and death-certificate fees against original invoices",
  "Full repatriation of the body abroad (zinc coffin, embalming, consular NOC, airline cargo, receiving director in the home country)",
  "Sworn translations, estate paperwork, Standesamt, embassy / consulate coordination — all invoiced through the case file",
  "Every euro itemised in your BeistandPlus case file so the family sees exactly where the money went",
  "Any balance remaining after all approved and regulated expenses are settled is paid to your nominated beneficiary via SEPA, in Germany or abroad, in their local currency",
  "24/7 multilingual case manager assigned within 1 hour of a claim being opened",
];

export function FuneralCoverPlans({ compact = false }: { compact?: boolean }) {
  const [tab, setTab] = useState<Household>("family");

  const rows = useMemo(() => {
    if (tab === "individual") {
      return ADULT_AGE_BANDS.map((age) => {
        const b = bandFor(age);
        return {
          label: `Age ${age}`,
          detail: "1 adult · €20,000 payout",
          min: b.min,
          max: b.max,
        };
      });
    }
    if (tab === "family") {
      // 2 adults, matched-age approximation, kids included free on DELA.
      return ADULT_AGE_BANDS.slice(0, 4).map((age) => {
        const b = bandFor(age);
        return {
          label: `Both adults age ${age}`,
          detail: "2 adults + up to 3 children · €20k per adult",
          min: b.min * 2,
          max: b.max * 2,
        };
      });
    }
    // extended: up to 4 adults, model as 2 pairs at chosen age
    return ADULT_AGE_BANDS.slice(0, 4).map((age) => {
      const b = bandFor(age);
      return {
        label: `All 4 adults age ${age}`,
        detail: "4 adults + up to 3 children · €20k per adult",
        min: b.min * 4,
        max: b.max * 4,
      };
    });
  }, [tab]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-parchment/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sterbegeldversicherung · Underwritten by regulated German insurers
          </div>
          <h2 className="display-lg mt-3 font-semibold">
            Approved & regulated expenses cover from about €24/month
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A €20,000 benefit per insured adult — enough to cover the full costs of the funeral and
            burial or last rites, plus repatriation if required, with any balance going to your
            nominated beneficiary. The family never has to find the money at the hardest moment.
          </p>
        </div>
      </div>

      {/* Household toggle */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-border/60 bg-parchment/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-gradient-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              type="button"
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {TABS.find((t) => t.key === tab)?.note}
        </div>
      </div>

      {/* Premium matrix */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-parchment/60 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Composition</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">Cover</th>
              <th className="px-4 py-3 text-right font-semibold">Estimated monthly premium</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium">{r.label}</td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{r.detail}</td>
                <td className="px-4 py-3 text-right font-display font-semibold">
                  {fmt(r.min)}–{fmt(r.max)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/ mo</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Ranges reflect published 2024–2025 rate tables from our panel of regulated German Sterbegeld insurers
        for non-smokers with no waiting period on a €20,000 benefit. Actual premium depends on age, health
        declaration, smoker status and chosen waiting period; children under 20 are included at no
        additional premium on the family and extended-family tarifs. Not a binding quote — the
        licensed partner insurer issues the offer.
      </p>

      {!compact && (
        <>
          <div className="mt-8">
            <h3 className="font-display text-xl font-semibold">What the €20,000 covers — via BeistandPlus</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {COVERAGE.map((c) => (
                <div key={c} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-sm">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border-l-4 border-primary bg-accent/20 p-4 text-sm">
            <strong className="text-foreground">How it works:</strong> the insurer settles every
            approved and regulated invoice in full — funeral, burial or last rites, and repatriation
            if required — and{" "}
            <strong className="text-foreground">any balance is paid to the nominated beneficiary</strong>{" "}
            within 14 days.
          </div>

        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="bg-gradient-primary">
          <Link to="/bereavement-cover">Estimate my premium</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/contact">Talk to a case manager</Link>
        </Button>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        BeistandPlus acts as introducer (Tippgeber / §34d GewO broker where applicable). Premiums are paid
        directly to the insurer; BeistandPlus never underwrites. The subscription and the insurance premium
        are billed separately.
      </p>
    </div>
  );
}
