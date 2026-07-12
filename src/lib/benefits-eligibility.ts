// Rule-based German benefits eligibility engine.
// Figures reflect 2026 rates published by BMFSFJ, BMAS, BMWSB and BAföG-Amt.
// This is an indicative estimator — not legal advice.

export type BenefitInputs = {
  householdSize: number;               // total persons in household
  childrenUnder18: number;
  residence:
    | "blue_card"
    | "family_reunion"
    | "student_visa"
    | "permanent"
    | "eu_citizen"
    | "other";
  monthlyIncome: number;               // gross household income, EUR / month
  employment:
    | "employed"
    | "self_employed"
    | "job_seeking"
    | "student"
    | "retired";
  housing: "rented" | "owned" | "social_housing";
};

export type BenefitVerdict = {
  key: string;
  eligible: boolean;
  confidence: "likely" | "possible" | "unlikely";
  estimatedMonthly: number;            // 0 if not eligible
  amountLabel: string;                 // human string, e.g. "€500 / month"
  reasons: string[];                   // supporting facts
  blockers: string[];                  // why not eligible / why capped
};

const LEGAL_RESIDENCE = new Set([
  "blue_card",
  "family_reunion",
  "student_visa",
  "permanent",
  "eu_citizen",
]);

function hasLegalResidence(r: BenefitInputs["residence"]) {
  return LEGAL_RESIDENCE.has(r);
}

function fmt(n: number) {
  return `€${Math.round(n).toLocaleString("de-DE")}`;
}

// 2026 Bürgergeld Regelsätze
const BUERGERGELD_ADULT = 563;
const BUERGERGELD_PARTNER = 506;
const BUERGERGELD_CHILD = 390; // simplified average across age brackets
// Warm rent proxy per household size (very rough national average, warm)
const RENT_PROXY: Record<number, number> = {
  1: 550, 2: 720, 3: 880, 4: 1020, 5: 1180,
};

export function evaluateBenefits(i: BenefitInputs): BenefitVerdict[] {
  const legal = hasLegalResidence(i.residence);
  const rent = RENT_PROXY[Math.min(i.householdSize, 5)] ?? 1180;

  // ---------- Kindergeld ----------
  const kindergeldAmount = i.childrenUnder18 * 255; // 2026 rate €255 / child
  const kindergeld: BenefitVerdict = {
    key: "kindergeld",
    eligible: legal && i.childrenUnder18 > 0,
    confidence: legal && i.childrenUnder18 > 0 ? "likely" : "unlikely",
    estimatedMonthly: legal && i.childrenUnder18 > 0 ? kindergeldAmount : 0,
    amountLabel:
      legal && i.childrenUnder18 > 0
        ? `${fmt(kindergeldAmount)} / month`
        : "—",
    reasons: [],
    blockers: [],
  };
  if (i.childrenUnder18 === 0) kindergeld.blockers.push("No children under 18 in household");
  if (!legal) kindergeld.blockers.push("Requires legal residence permit");
  if (kindergeld.eligible) {
    kindergeld.reasons.push(`${i.childrenUnder18} child(ren) × €255 (2026 rate)`);
    kindergeld.reasons.push("Registered address (Anmeldung) required");
  }

  // ---------- Elterngeld ----------
  // Indicative only — depends on a child < 14 months. We flag as "possible"
  // when there is at least one child under 18, since we can't ask age here.
  const elterngeldPossible = legal && i.childrenUnder18 > 0 && i.employment !== "retired";
  const elterngeldAmount = elterngeldPossible
    ? Math.min(1800, Math.max(300, Math.round(i.monthlyIncome * 0.65)))
    : 0;
  const elterngeld: BenefitVerdict = {
    key: "elterngeld",
    eligible: elterngeldPossible,
    confidence: elterngeldPossible ? "possible" : "unlikely",
    estimatedMonthly: elterngeldAmount,
    amountLabel: elterngeldPossible ? `${fmt(elterngeldAmount)} / month` : "—",
    reasons: elterngeldPossible
      ? ["65% of prior net income", "Only if baby is under 14 months"]
      : [],
    blockers: elterngeldPossible ? [] : ["Requires a baby under 14 months and reduced hours"],
  };

  // ---------- Wohngeld ----------
  // Simplified 2026 income caps (gross, household size 1..5+)
  const wohngeldCap: Record<number, number> = {
    1: 1750, 2: 2350, 3: 2900, 4: 3450, 5: 4000,
  };
  const cap = wohngeldCap[Math.min(i.householdSize, 5)] ?? 4000;
  const isRenter = i.housing === "rented";
  const notOnBuergergeld = i.employment !== "job_seeking" || i.monthlyIncome > 0;
  const wohngeldEligible =
    legal && isRenter && notOnBuergergeld && i.monthlyIncome > 0 && i.monthlyIncome <= cap;
  // Rough amount: 30% of rent, tapered by (cap - income)/cap
  const wohngeldAmount = wohngeldEligible
    ? Math.min(800, Math.max(100, Math.round(rent * 0.3 * ((cap - i.monthlyIncome) / cap) + 120)))
    : 0;
  const wohngeld: BenefitVerdict = {
    key: "wohngeld",
    eligible: wohngeldEligible,
    confidence: wohngeldEligible ? "likely" : "unlikely",
    estimatedMonthly: wohngeldAmount,
    amountLabel: wohngeldEligible ? `${fmt(wohngeldAmount)} / month` : "—",
    reasons: [],
    blockers: [],
  };
  if (!isRenter) wohngeld.blockers.push("Only for renters");
  if (!legal) wohngeld.blockers.push("Requires legal residence");
  if (i.monthlyIncome > cap)
    wohngeld.blockers.push(`Income above ${fmt(cap)} / month cap for household of ${i.householdSize}`);
  if (wohngeldEligible) {
    wohngeld.reasons.push(`Household of ${i.householdSize} under ${fmt(cap)} income cap`);
    wohngeld.reasons.push("Rental contract with registered address");
  }

  // ---------- Bürgergeld ----------
  const buergergeldNeed =
    BUERGERGELD_ADULT +
    (i.householdSize >= 2 ? BUERGERGELD_PARTNER : 0) +
    Math.max(0, i.childrenUnder18) * BUERGERGELD_CHILD +
    (i.housing === "rented" || i.housing === "social_housing" ? rent : 0);
  const buergergeldEligible =
    legal &&
    (i.employment === "job_seeking" ||
      (i.employment !== "retired" && i.monthlyIncome < buergergeldNeed * 0.8));
  const buergergeldAmount = buergergeldEligible
    ? Math.max(0, Math.round(buergergeldNeed - i.monthlyIncome))
    : 0;
  const buergergeld: BenefitVerdict = {
    key: "buergergeld",
    eligible: buergergeldEligible && buergergeldAmount > 0,
    confidence: buergergeldEligible && buergergeldAmount > 0 ? "likely" : "unlikely",
    estimatedMonthly: buergergeldAmount,
    amountLabel: buergergeldAmount > 0 ? `${fmt(buergergeldAmount)} / month` : "—",
    reasons: [],
    blockers: [],
  };
  if (!legal) buergergeld.blockers.push("Requires legal residence");
  if (i.employment === "student")
    buergergeld.blockers.push("Students generally excluded — apply for BAföG");
  if (buergergeldAmount === 0 && legal)
    buergergeld.blockers.push("Household income covers Regelbedarf");
  if (buergergeld.eligible) {
    buergergeld.reasons.push(
      `Regelbedarf ${fmt(buergergeldNeed)} minus income ${fmt(i.monthlyIncome)}`,
    );
    buergergeld.reasons.push("Rent, heating and health insurance covered separately");
  }

  // ---------- BAföG ----------
  const bafogEligible = legal && i.employment === "student" && i.monthlyIncome < 2500;
  const bafogAmount = bafogEligible
    ? Math.max(300, Math.min(992, 992 - Math.round(i.monthlyIncome * 0.25)))
    : 0;
  const bafog: BenefitVerdict = {
    key: "bafog",
    eligible: bafogEligible,
    confidence: bafogEligible ? "likely" : "unlikely",
    estimatedMonthly: bafogAmount,
    amountLabel: bafogEligible ? `${fmt(bafogAmount)} / month` : "—",
    reasons: [],
    blockers: [],
  };
  if (i.employment !== "student") bafog.blockers.push("Only for enrolled students");
  if (!legal) bafog.blockers.push("Requires legal residence");
  if (i.employment === "student" && i.monthlyIncome >= 2500)
    bafog.blockers.push("Household income above BAföG threshold");
  if (bafog.eligible) {
    bafog.reasons.push("Max €992 / month (50% grant, 50% interest-free loan)");
    bafog.reasons.push("Enrolment at a recognised university");
  }

  // ---------- Gesetzliche Rente ----------
  const renteEligible = i.employment === "retired";
  const rente: BenefitVerdict = {
    key: "rente",
    eligible: renteEligible,
    confidence: renteEligible ? "possible" : "unlikely",
    estimatedMonthly: 0,
    amountLabel: renteEligible ? "Based on contribution years" : "—",
    reasons: renteEligible
      ? [
          "Requires 5+ years of contributions",
          "Foreign years may count via bilateral agreements",
        ]
      : [],
    blockers: renteEligible ? [] : ["Only shown once retired"],
  };

  return [kindergeld, elterngeld, wohngeld, buergergeld, bafog, rente];
}

export function totalMonthly(verdicts: BenefitVerdict[]) {
  return verdicts
    .filter((v) => v.eligible)
    .reduce((sum, v) => sum + v.estimatedMonthly, 0);
}
