import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, User, Users, HeartHandshake, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/**
 * Funeral / bereavement cover — product overview.
 *
 * Coverage: €20,000 default benefit per insured adult — matches the DELA
 * cooperative €20k Sterbegeld tarif we broker into. Children under 18 are
 * included at no additional premium on family / extended-family plans
 * (DELA free-child rider).
 */

type Household = "individual" | "family" | "extended";

export function FuneralCoverPlans({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Household>("family");

  const TABS: { key: Household; label: string; icon: React.ReactNode; note: string }[] = [
    { key: "individual", label: t("funeralCover.tabs.individual", "Individual"), icon: <User className="h-4 w-4" />, note: t("funeralCover.tabs.individualNote", "1 adult · €20k benefit") },
    { key: "family", label: t("funeralCover.tabs.family", "Family"), icon: <Users className="h-4 w-4" />, note: t("funeralCover.tabs.familyNote", "2 adults + up to 3 children under 18 · €20k per adult · children included free") },
    { key: "extended", label: t("funeralCover.tabs.extended", "Extended family"), icon: <HeartHandshake className="h-4 w-4" />, note: t("funeralCover.tabs.extendedNote", "Up to 4 adults + up to 3 children under 18 · €20k per adult · children included free") },
  ];

  const COVERAGE: string[] = t("funeralCover.coverage", {
    returnObjects: true,
    defaultValue: [
      "€20,000 benefit per insured adult — paid on death, no medical exam required for standard tarifs",
      "Direct settlement of funeral director, cemetery, mosque / church / temple, cremation, coffin, flowers, catering and death-certificate fees against original invoices",
      "Full repatriation of the body abroad (approved transport casket, embalming, consular NOC, airline cargo, receiving director in the home country)",
      "Sworn translations, estate paperwork, Standesamt, embassy / consulate coordination — all invoiced through the case file",
      "Every euro itemised in your BeistandPlus case file so the family sees exactly where the money went",
      "Any balance remaining after all approved and regulated expenses are settled is paid to your nominated beneficiary via SEPA, in Germany or abroad, in their local currency",
      "24/7 multilingual case manager assigned within 1 hour of a claim being opened",
    ],
  }) as unknown as string[];

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-parchment/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("funeralCover.badge", "Sterbegeld · Cover regulated under German law")}
          </div>
          <h2 className="display-lg mt-3 font-semibold">
            {t("funeralCover.headline", "Approved & regulated expenses cover from about €24/month")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t(
              "funeralCover.subhead",
              "A €20,000 benefit per insured adult — enough to cover the full costs of the funeral and burial or last rites, plus repatriation if required, with any balance going to your nominated beneficiary. The family never has to find the money at the hardest moment.",
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-border/60 bg-parchment/60 p-1">
          {TABS.map((tab_) => (
            <button
              key={tab_.key}
              onClick={() => setTab(tab_.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tab === tab_.key
                  ? "bg-gradient-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              type="button"
            >
              {tab_.icon}
              {tab_.label}
            </button>
          ))}
        </div>
        <div className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-foreground">
          {TABS.find((t_) => t_.key === tab)?.note}
        </div>
      </div>


      {!compact && (
        <>
          <div className="mt-8">
            <h3 className="font-display text-xl font-semibold">{t("funeralCover.coverageTitle", "What the €20,000 covers — via BeistandPlus")}</h3>
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
            <strong className="text-foreground">{t("funeralCover.howLabel", "How it works:")}</strong>{" "}
            {t(
              "funeralCover.howBody",
              "the provider settles every approved and regulated invoice in full — funeral, burial or last rites, and repatriation if required — and any balance is paid to the nominated beneficiary within 14 days.",
            )}
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/contact">{t("funeralCover.ctaTalk", "Talk to a case manager")}</Link>
        </Button>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        {t(
          "funeralCover.introducer",
          "BeistandPlus acts as introducer (Tippgeber / §34d GewO broker where applicable). Premiums are paid directly to the cover provider; BeistandPlus never underwrites. The subscription and the cover premium are billed separately.",
        )}
      </p>
    </div>
  );
}
