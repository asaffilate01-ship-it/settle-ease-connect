// Rule-based German benefits eligibility engine.
// Figures reflect 2026 rates published by BMFSFJ, BMAS, BMWSB, BMG, BAföG-Amt,
// Bundesagentur für Arbeit and Deutsche Rentenversicherung.
// Indicative estimator — not legal advice.

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
  // Extended inputs (all optional so existing callers keep working).
  ageYears?: number;                   // adult age
  isSingleParent?: boolean;
  disabilityGdB?: number;              // 0, 20, 30, 40, 50, 60, 70, 80, 90, 100
  careLevel?: 0 | 1 | 2 | 3 | 4 | 5;   // Pflegegrad
  sickWeeks?: number;                  // continuous illness weeks
  unemploymentMonthsInsured?: number;  // months of AV in last 30 months
};

export type BenefitVerdict = {
  key: string;
  eligible: boolean;
  confidence: "likely" | "possible" | "unlikely";
  estimatedMonthly: number;            // 0 if not eligible or informational
  amountLabel: string;                 // e.g. "€500 / month"
  reasons: string[];
  blockers: string[];
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
const BUERGERGELD_CHILD = 390;
const RENT_PROXY: Record<number, number> = { 1: 550, 2: 720, 3: 880, 4: 1020, 5: 1180 };
// 2026 Pflegegeld (home care) amounts by Pflegegrad
const PFLEGEGELD: Record<number, number> = { 0: 0, 1: 0, 2: 347, 3: 599, 4: 800, 5: 990 };

export function evaluateBenefits(i: BenefitInputs): BenefitVerdict[] {
  const legal = hasLegalResidence(i.residence);
  const size = Math.min(i.householdSize, 5);
  const rent = RENT_PROXY[size] ?? 1180;
  const gdB = i.disabilityGdB ?? 0;
  const pg = i.careLevel ?? 0;
  const sickWeeks = i.sickWeeks ?? 0;
  const insuredMonths = i.unemploymentMonthsInsured ?? 0;

  // ---------- Kindergeld ----------
  const kgAmount = i.childrenUnder18 * 255;
  const kg: BenefitVerdict = mk("kindergeld", legal && i.childrenUnder18 > 0, kgAmount);
  if (i.childrenUnder18 === 0) kg.blockers.push("No children under 18 in household");
  if (!legal) kg.blockers.push("Requires legal residence permit");
  if (kg.eligible) {
    kg.reasons.push(`${i.childrenUnder18} child(ren) × €255 (2026 rate)`);
    kg.reasons.push("Registered address (Anmeldung) required");
  }

  // ---------- Elterngeld ----------
  const elPossible = legal && i.childrenUnder18 > 0 && i.employment !== "retired";
  const elAmount = elPossible ? Math.min(1800, Math.max(300, Math.round(i.monthlyIncome * 0.65))) : 0;
  const el = mk("elterngeld", elPossible, elAmount, elPossible ? "possible" : "unlikely");
  if (elPossible) {
    el.reasons.push("65 % of prior net income");
    el.reasons.push("Only if baby under 14 months");
  } else {
    el.blockers.push("Requires a baby under 14 months and reduced hours");
  }

  // ---------- Kinderzuschlag ----------
  const kizMin = i.householdSize >= 2 ? 900 : 600;
  const kizMax = 900 + (i.householdSize - 1) * 500 + i.childrenUnder18 * 297;
  const kizEligible =
    legal && i.childrenUnder18 > 0 && i.monthlyIncome >= kizMin && i.monthlyIncome <= kizMax;
  const kizAmount = kizEligible
    ? Math.min(i.childrenUnder18 * 297, Math.round(i.childrenUnder18 * 297 * (1 - (i.monthlyIncome - kizMin) / (kizMax - kizMin))))
    : 0;
  const kiz = mk("kinderzuschlag", kizEligible && kizAmount > 0, kizAmount);
  if (i.childrenUnder18 === 0) kiz.blockers.push("Requires at least one child under 18");
  if (i.monthlyIncome < kizMin) kiz.blockers.push(`Income below minimum ${fmt(kizMin)} / month`);
  if (i.monthlyIncome > kizMax) kiz.blockers.push(`Income above ceiling ${fmt(kizMax)} / month`);
  if (kiz.eligible) kiz.reasons.push(`Up to €297 × ${i.childrenUnder18} children, tapered by income`);

  // ---------- Wohngeld ----------
  const wohngeldCap: Record<number, number> = { 1: 1750, 2: 2350, 3: 2900, 4: 3450, 5: 4000 };
  const cap = wohngeldCap[size] ?? 4000;
  const isRenter = i.housing === "rented";
  const notOnBG = i.employment !== "job_seeking" || i.monthlyIncome > 0;
  const whEligible = legal && isRenter && notOnBG && i.monthlyIncome > 0 && i.monthlyIncome <= cap;
  const whAmount = whEligible
    ? Math.min(800, Math.max(100, Math.round(rent * 0.3 * ((cap - i.monthlyIncome) / cap) + 120)))
    : 0;
  const wh = mk("wohngeld", whEligible, whAmount);
  if (!isRenter) wh.blockers.push("Only for renters");
  if (!legal) wh.blockers.push("Requires legal residence");
  if (i.monthlyIncome > cap) wh.blockers.push(`Income above ${fmt(cap)} / month cap`);
  if (wh.eligible) {
    wh.reasons.push(`Household of ${i.householdSize} under ${fmt(cap)} income cap`);
    wh.reasons.push("Rental contract with registered address");
  }

  // ---------- Bürgergeld ----------
  const bgNeed =
    BUERGERGELD_ADULT +
    (i.householdSize >= 2 ? BUERGERGELD_PARTNER : 0) +
    Math.max(0, i.childrenUnder18) * BUERGERGELD_CHILD +
    (i.housing === "rented" || i.housing === "social_housing" ? rent : 0);
  const bgEligible =
    legal &&
    (i.employment === "job_seeking" ||
      (i.employment !== "retired" && i.monthlyIncome < bgNeed * 0.8));
  const bgAmount = bgEligible ? Math.max(0, Math.round(bgNeed - i.monthlyIncome)) : 0;
  const bg = mk("buergergeld", bgEligible && bgAmount > 0, bgAmount);
  if (!legal) bg.blockers.push("Requires legal residence");
  if (i.employment === "student") bg.blockers.push("Students generally excluded — apply for BAföG");
  if (bgAmount === 0 && legal) bg.blockers.push("Household income covers Regelbedarf");
  if (bg.eligible) {
    bg.reasons.push(`Regelbedarf ${fmt(bgNeed)} minus income ${fmt(i.monthlyIncome)}`);
    bg.reasons.push("Rent, heating and health insurance covered separately");
  }

  // ---------- BAföG ----------
  const bafogEligible = legal && i.employment === "student" && i.monthlyIncome < 2500;
  const bafogAmount = bafogEligible ? Math.max(300, Math.min(992, 992 - Math.round(i.monthlyIncome * 0.25))) : 0;
  const bafog = mk("bafog", bafogEligible, bafogAmount);
  if (i.employment !== "student") bafog.blockers.push("Only for enrolled students");
  if (!legal) bafog.blockers.push("Requires legal residence");
  if (i.employment === "student" && i.monthlyIncome >= 2500) bafog.blockers.push("Household income above BAföG threshold");
  if (bafog.eligible) {
    bafog.reasons.push("Max €992 / month (50 % grant, 50 % interest-free loan)");
    bafog.reasons.push("Enrolment at a recognised university");
  }

  // ---------- Gesetzliche Rente ----------
  const renteEligible = i.employment === "retired";
  const rente = mk("rente", renteEligible, 0, renteEligible ? "possible" : "unlikely");
  rente.amountLabel = renteEligible ? "Based on contribution years" : "—";
  if (renteEligible) {
    rente.reasons.push("Requires 5+ years of contributions");
    rente.reasons.push("Foreign years may count via bilateral agreements");
  } else {
    rente.blockers.push("Only shown once retired");
  }

  // ---------- Erwerbsminderungsrente ----------
  const emRente = mk("erwerbsminderungsrente", gdB >= 50 && i.employment !== "retired", 0, "possible");
  emRente.amountLabel = emRente.eligible ? "≈ 34–75 % of average net" : "—";
  if (emRente.eligible) emRente.reasons.push("GdB ≥ 50 & inability to work ≥ 6 h/day");
  else emRente.blockers.push("Requires medically confirmed reduced earning capacity");

  // ---------- Schwerbehindertenausweis ----------
  const swb = mk("schwerbehindertenausweis", gdB >= 50, 0, gdB >= 50 ? "likely" : "unlikely");
  swb.amountLabel = "—";
  if (swb.eligible) swb.reasons.push(`GdB ${gdB} qualifies for Schwerbehindertenausweis`);
  else if (gdB >= 20) swb.blockers.push("GdB below 50 — only tax allowance applies");
  else swb.blockers.push("No recognised GdB");

  // ---------- Behinderten-Pauschbetrag ----------
  const bpMonthly = gdB >= 100 ? 617 : gdB >= 80 ? 267 : gdB >= 50 ? 117 : gdB >= 20 ? 32 : 0;
  const bp = mk("behinderten_pauschbetrag", gdB >= 20, bpMonthly, gdB >= 20 ? "likely" : "unlikely");
  bp.amountLabel = gdB >= 20 ? `≈ ${fmt(bpMonthly)} / month tax saving` : "—";
  if (bp.eligible) bp.reasons.push(`GdB ${gdB} → annual Pauschbetrag ${fmt(bpMonthly * 12)}`);
  else bp.blockers.push("Requires recognised GdB of at least 20");

  // ---------- Pflegegeld ----------
  const pgAmount = PFLEGEGELD[pg] ?? 0;
  const pgEligible = pg >= 2;
  const pgf = mk("pflegegeld", pgEligible, pgAmount);
  if (pgEligible) pgf.reasons.push(`Pflegegrad ${pg} → ${fmt(pgAmount)} / month for home care`);
  else pgf.blockers.push("Requires Pflegegrad 2 or higher");

  // ---------- Pflegegrad (informational) ----------
  const pgrad = mk("pflegegrad", pg > 0, 0, pg > 0 ? "likely" : "possible");
  pgrad.amountLabel = pg > 0 ? `Pflegegrad ${pg} recognised` : "Assessment required";
  if (pg > 0) pgrad.reasons.push("Confirmed by MDK assessment");
  else pgrad.blockers.push("Request MDK visit via Pflegekasse");

  // ---------- Krankengeld ----------
  const kgAmountDaily = Math.min(120, Math.round((i.monthlyIncome / 30) * 0.7));
  const kgEligible = i.employment === "employed" && sickWeeks >= 6;
  const kgSick = mk("krankengeld", kgEligible, kgAmountDaily * 30);
  kgSick.amountLabel = kgEligible ? `≈ ${fmt(kgAmountDaily * 30)} / month (70 % gross)` : "—";
  if (kgEligible) kgSick.reasons.push(`${sickWeeks} weeks of continuous AU — after employer's Lohnfortzahlung`);
  else if (sickWeeks < 6) kgSick.blockers.push("Employer pays first 6 weeks (Lohnfortzahlung)");
  else if (i.employment !== "employed") kgSick.blockers.push("Only for statutorily insured employees");

  // ---------- ALG I ----------
  const algEligible = i.employment === "job_seeking" && insuredMonths >= 12;
  const algAmount = algEligible ? Math.min(2900, Math.round(i.monthlyIncome * 0.6)) : 0;
  const alg = mk("arbeitslosengeld1", algEligible, algAmount);
  if (algEligible) alg.reasons.push(`60 % of last net (67 % with children) up to ~${fmt(2900)}`);
  else if (i.employment !== "job_seeking") alg.blockers.push("Only for people registered arbeitsuchend");
  else alg.blockers.push("Need 12 months of AV contributions in last 30 months");

  // ---------- Grundsicherung im Alter/EM ----------
  const gruSiNeed = bgNeed;
  const gruSiEligible =
    legal &&
    ((i.employment === "retired" && i.monthlyIncome < gruSiNeed) ||
      (gdB >= 50 && i.monthlyIncome < gruSiNeed));
  const gruSiAmount = gruSiEligible ? Math.max(0, Math.round(gruSiNeed - i.monthlyIncome)) : 0;
  const gruSi = mk("grundsicherung_alter_em", gruSiEligible && gruSiAmount > 0, gruSiAmount);
  if (gruSi.eligible) gruSi.reasons.push(`Fills gap to Regelbedarf ${fmt(gruSiNeed)}`);
  else gruSi.blockers.push("Only for retirees or people with reduced earning capacity below Regelbedarf");

  // ---------- Entlastungsbetrag Alleinerziehende ----------
  const eaBase = 4260 + Math.max(0, i.childrenUnder18 - 1) * 240;
  const eaEligible = !!i.isSingleParent && i.childrenUnder18 > 0;
  const ea = mk("entlastungsbetrag_ae", eaEligible, Math.round(eaBase * 0.3 / 12), eaEligible ? "likely" : "unlikely");
  ea.amountLabel = eaEligible ? `≈ ${fmt(Math.round(eaBase * 0.3 / 12))} / month tax saving` : "—";
  if (eaEligible) ea.reasons.push(`Allowance €${eaBase} / year in Steuerklasse II`);
  else ea.blockers.push("Only for single parents living alone with a child");

  // ---------- Rundfunkbeitrag-Befreiung ----------
  const rbEligible =
    i.employment === "job_seeking" ||
    (gdB >= 80) ||
    (bg.eligible) ||
    (bafog.eligible);
  const rb = mk("rundfunkbefreiung", rbEligible, 18);
  rb.amountLabel = rbEligible ? "€18.36 / month saving" : "—";
  if (rbEligible) rb.reasons.push("Recipient of qualifying benefit or Merkzeichen RF");
  else rb.blockers.push("Requires qualifying benefit decision or Merkzeichen RF");

  // Informational rows (no eligibility rule, always shown so users see requirements).
  const info = (key: string, note: string): BenefitVerdict =>
    mk(key, false, 0, "possible", note, "—");

  return [
    kg, el, kiz, ea,
    wh, info("wbs", "State-set income limits vary per Bundesland"),
    info("heizkostenzuschuss", "Paid automatically to Wohngeld / BAföG recipients"),
    bg,
    info("sozialhilfe", "For those unable to work < 3 h/day but not entitled to Bürgergeld"),
    gruSi,
    bafog,
    info("aufstiegs_bafog", "For Meister / Techniker / Fachwirt upskilling"),
    info("bildungspaket", "Unlocked when household receives Bürgergeld, Wohngeld or KiZ"),
    rente, emRente,
    info("hinterbliebenenrente", "For spouses / children after the insured person's death"),
    swb, bp,
    info("blindengeld", "Requires Merkzeichen BI or TBl"),
    info("eingliederungshilfe", "Individualised via Bedarfsermittlung"),
    kgSick,
    info("verletztengeld", "For work accidents / recognised occupational diseases"),
    info("reha", "Requires doctor's Befundbericht + DRV / GKV approval"),
    info("haushaltshilfe", "GKV pays substitute when parent hospitalised"),
    pgrad, pgf,
    info("verhinderungspflege", "Up to €1,612 / year substitute care"),
    alg,
    info("mutterschaftsgeld", "Paid by Krankenkasse 6 weeks before / 8 weeks after birth"),
    info("unterhaltsvorschuss", "For single parents when other parent doesn't pay"),
    info("steuerklassenwechsel", "For married couples — one-time election"),
    info("kinderfreibetrag", "Applied automatically by Finanzamt if more favourable than Kindergeld"),
    info("pflege_pauschbetrag", "€600–€1,800 / year for unpaid family carers"),
    info("doppelte_haushaltsfuehrung", "Up to €1,000 / month deductible"),
    rb,
    info("sozialversicherungsausweis", "Issued automatically on first employment"),
    info("krankenversicherung", "Mandatory for all residents"),
  ];
}

// Helper to build a verdict with defaults.
function mk(
  key: string,
  eligible: boolean,
  estimatedMonthly: number,
  confidence: BenefitVerdict["confidence"] = eligible ? "likely" : "unlikely",
  amountLabelOverride?: string,
  fallbackLabel: string = "—",
): BenefitVerdict {
  return {
    key,
    eligible,
    confidence,
    estimatedMonthly: eligible ? estimatedMonthly : 0,
    amountLabel:
      amountLabelOverride ??
      (eligible && estimatedMonthly > 0 ? `${fmt(estimatedMonthly)} / month` : fallbackLabel),
    reasons: [],
    blockers: [],
  };
}

export function totalMonthly(verdicts: BenefitVerdict[]) {
  return verdicts.filter((v) => v.eligible).reduce((sum, v) => sum + v.estimatedMonthly, 0);
}
