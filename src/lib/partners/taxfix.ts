// Taxfix / Wundertax handoff adapter.
// Produces a pre-filled deep link into the partner's guided tax wizard.
// Real API keys arrive after StBerG-compliant partner MOU is countersigned;
// until then we generate an unauthenticated deep link with query hints.

import type { PartnerStatus, TaxHandoff, TaxHandoffInput } from "./types";

export function taxfixStatus(): PartnerStatus {
  const configured = Boolean(process.env.TAXFIX_PARTNER_ID);
  return {
    slug: "taxfix",
    name: "Taxfix (guided tax refund)",
    category: "tax",
    mode: configured ? "live" : "mock",
    configured,
    gap: configured ? undefined : "Awaiting TAXFIX_PARTNER_ID and Kooperationsvertrag countersignature.",
  };
}

export async function handoffToTaxfix(input: TaxHandoffInput): Promise<TaxHandoff> {
  const partnerId = process.env.TAXFIX_PARTNER_ID ?? "beistandplus-preview";
  const params = new URLSearchParams({
    partner: partnerId,
    lang: input.language,
    year: String(input.taxYear),
    gross: String(input.grossIncomeEur),
    children: input.hasChildren ? "1" : "0",
    review: input.needsHumanReview ? "1" : "0",
  });
  // Conservative refund estimate — Taxfix's own median-refund published data
  // sits around EUR 1063; we scale by gross income and family status.
  const base = input.grossIncomeEur > 60000 ? 1600 : input.grossIncomeEur > 40000 ? 1200 : 850;
  const estimatedRefundEur = Math.round(base * (input.hasChildren ? 1.25 : 1));
  return {
    partner: "Taxfix",
    handoffUrl: `https://taxfix.de/start?${params.toString()}`,
    estimatedRefundEur,
    // Taxfix charges EUR 39.99 for the standard filing; scale up when human review.
    feeEur: input.needsHumanReview ? 79 : 39.99,
    refundOrFree: true,
    humanReviewIncluded: input.needsHumanReview ?? false,
  };
}
