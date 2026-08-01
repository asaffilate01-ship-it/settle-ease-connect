// Taxfix / Wundertax handoff adapter.
// Produces a pre-filled deep link into the partner's guided tax wizard.
// The production path is disabled until a partner identifier is configured.

import { partnerDemosEnabled, type PartnerStatus, type TaxHandoff, type TaxHandoffInput } from "./types";

export function taxfixStatus(): PartnerStatus {
  const configured = Boolean(process.env.TAXFIX_PARTNER_ID);
  const demo = partnerDemosEnabled();
  return {
    slug: "taxfix",
    name: "Taxfix (guided tax refund)",
    category: "tax",
    mode: configured ? "live" : demo ? "mock" : "disabled",
    configured,
    gap: configured ? undefined : demo ? "Local demo handoff is enabled." : "No contracted tax handoff is configured.",
  };
}

export async function handoffToTaxfix(input: TaxHandoffInput): Promise<TaxHandoff> {
  const partnerId = process.env.TAXFIX_PARTNER_ID;
  if (!partnerId && !partnerDemosEnabled()) {
    throw new Error("Tax partner handoff is not available.");
  }
  const params = new URLSearchParams({
    partner: partnerId ?? "beistandplus-preview",
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
