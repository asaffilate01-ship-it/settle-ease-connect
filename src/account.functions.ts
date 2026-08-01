/**
 * Rough German income-tax refund estimator.
 *
 * Not a filing tool — it exists to give the visitor an actionable number on
 * the /tax landing so they'll book a callback with our Taxfix / Wundertax
 * partner. Real filing happens in-partner. All numbers are conservative and
 * intentionally rounded to the nearest €10.
 *
 * Rules encoded (2024 tax year, updated annually):
 *  - Basic allowance (Grundfreibetrag): €11,604
 *  - Simplified progressive tax (5 brackets, close to §32a EStG)
 *  - Werbungskosten flat: €1,230 (auto-applied)
 *  - Commute allowance: €0.30 first 20km, €0.38 above (~230 working days)
 *  - Home-office lump sum: €6/day, capped at 210 days (€1,260)
 *  - Child allowance (Kinderfreibetrag): €6,384 per child (both parents)
 *  - Church tax: +9% on income tax (Bayern/BaWü use 8% — averaged out)
 */

export interface TaxInput {
  gross_income_eur: number;
  tax_class: 1 | 2 | 3 | 4 | 5 | 6;
  church_tax: boolean;
  children_count: number;
  commute_km: number;
  home_office_days: number;
  additional_deductions: number;
  employment_status:
    | "employee"
    | "freelancer"
    | "self_employed"
    | "student"
    | "job_seeker"
    | "pensioner"
    | "mixed";
}

const BASIC_ALLOWANCE = 11_604;
const WERBUNGSKOSTEN_FLAT = 1_230;
const CHILD_ALLOWANCE = 6_384;
const HOME_OFFICE_PER_DAY = 6;
const HOME_OFFICE_CAP_DAYS = 210;
const WORK_DAYS = 230;

function incomeTax(taxable: number): number {
  // §32a EStG 2024 — piecewise formula, simplified.
  if (taxable <= BASIC_ALLOWANCE) return 0;
  if (taxable <= 17_005) {
    const y = (taxable - BASIC_ALLOWANCE) / 10_000;
    return (922.98 * y + 1_400) * y;
  }
  if (taxable <= 66_760) {
    const z = (taxable - 17_005) / 10_000;
    return (181.19 * z + 2_397) * z + 1_025.38;
  }
  if (taxable <= 277_825) {
    return 0.42 * taxable - 10_602.13;
  }
  return 0.45 * taxable - 18_936.88;
}

/** Rough monthly PAYE withholding by class — used only to model refunds. */
function estimatePayrollWithholding(gross: number, taxClass: number): number {
  if (gross <= BASIC_ALLOWANCE) return 0;
  const base = incomeTax(gross);
  // Class 1/4 ≈ single-earner baseline. Class 3 (higher earner in a couple) is
  // under-withheld; class 5 (partner) is over-withheld. Class 2 gets a small
  // relief; class 6 (second job) is punishing. Rough multipliers for a UX-only
  // estimate — the point is to show a plausible refund, not to file.
  const multiplier =
    taxClass === 3 ? 0.72
    : taxClass === 5 ? 1.18
    : taxClass === 6 ? 1.30
    : taxClass === 2 ? 0.95
    : 1.0;
  return base * multiplier;
}

export function estimateTaxRefund(input: TaxInput): {
  refund: number;
  taxable_income: number;
  total_deductions: number;
  income_tax_owed: number;
  withheld_estimate: number;
} {
  const commuteAllowance =
    Math.min(input.commute_km, 20) * 0.3 * WORK_DAYS +
    Math.max(0, input.commute_km - 20) * 0.38 * WORK_DAYS;

  const homeOffice = Math.min(input.home_office_days, HOME_OFFICE_CAP_DAYS) * HOME_OFFICE_PER_DAY;

  const workExpenses = Math.max(
    WERBUNGSKOSTEN_FLAT,
    commuteAllowance + homeOffice + input.additional_deductions,
  );

  const childAllowance = input.children_count * CHILD_ALLOWANCE;

  const totalDeductions = workExpenses + childAllowance;
  const taxable = Math.max(0, input.gross_income_eur - totalDeductions);

  const owedIncomeTax = incomeTax(taxable);
  const owedTotal = input.church_tax ? owedIncomeTax * 1.09 : owedIncomeTax;

  // Self-employed / freelancers pay quarterly — no PAYE — so refund model
  // reduces to "how much lower than your Vorauszahlung this ends up being".
  const isPaye = input.employment_status === "employee" || input.employment_status === "mixed";
  const withheld = isPaye ? estimatePayrollWithholding(input.gross_income_eur, input.tax_class) : owedTotal;

  const refund = withheld - owedTotal;

  return {
    refund: Math.round(refund / 10) * 10,
    taxable_income: Math.round(taxable),
    total_deductions: Math.round(totalDeductions),
    income_tax_owed: Math.round(owedTotal),
    withheld_estimate: Math.round(withheld),
  };
}
