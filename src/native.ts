// Rough monthly premium estimates for German Sterbegeldversicherung (lifelong).
// Based on published rate tables from Monuta, DELA, Nürnberger, IDEAL (2024–2025).
// Displayed as a range — this is a Tippgeber-safe indication, NOT a binding quote.

// Base monthly premium in EUR for €10,000 benefit, non-smoker, no waiting period.
const BASE_BY_AGE: Array<[number, number]> = [
  [25, 12], [30, 14], [35, 17], [40, 22], [45, 29],
  [50, 38], [55, 50], [60, 65], [65, 85], [70, 110], [75, 145], [80, 190],
];

function interpolate(age: number): number {
  if (age <= BASE_BY_AGE[0][0]) return BASE_BY_AGE[0][1];
  const last = BASE_BY_AGE[BASE_BY_AGE.length - 1];
  if (age >= last[0]) return last[1];
  for (let i = 0; i < BASE_BY_AGE.length - 1; i++) {
    const [a1, p1] = BASE_BY_AGE[i];
    const [a2, p2] = BASE_BY_AGE[i + 1];
    if (age >= a1 && age <= a2) {
      const ratio = (age - a1) / (a2 - a1);
      return p1 + (p2 - p1) * ratio;
    }
  }
  return last[1];
}

export interface EstimateInput {
  age: number;
  benefitAmount: number; // EUR
  tobacco: boolean;
  waitingPeriodMonths: number; // 0 or 24
}

export interface EstimateResult {
  min: number;
  max: number;
}

export function estimatePremium(input: EstimateInput): EstimateResult {
  const base10k = interpolate(input.age);
  let premium = base10k * (input.benefitAmount / 10000);
  if (input.tobacco) premium *= 1.4;
  if (input.waitingPeriodMonths >= 24) premium *= 0.8;

  // Insurer spread across major providers is roughly ±18%
  const min = Math.round(premium * 0.85);
  const max = Math.round(premium * 1.18);
  return { min, max };
}
