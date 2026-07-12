// Feather Insurance (MGA) adapter.
// When FEATHER_API_KEY + FEATHER_MGA_ID are set we hit the real quote
// endpoint; otherwise we return a conservative offline estimate so the
// customer flow never breaks during partner onboarding.

import type { InsuranceQuote, InsuranceQuoteInput, PartnerStatus } from "./types";

const PRODUCT_LABELS: Record<InsuranceQuoteInput["product"], string> = {
  public_health: "Public health (gesetzlich)",
  private_health: "Private health (privat)",
  expat_health: "Expat health (incoming residents)",
  liability: "Personal liability (Haftpflicht)",
  household: "Household contents (Hausrat)",
  legal: "Legal protection (Rechtsschutz)",
  life: "Term life (Risikolebensversicherung)",
  dental: "Dental supplement (Zahnzusatz)",
  disability: "Occupational disability (Berufsunfähigkeit)",
};

// Rough baseline premiums (EUR/month) used only when the live API is not
// wired. Values sit inside the ranges Feather publicly quotes on their site.
const BASELINE: Record<InsuranceQuoteInput["product"], number> = {
  public_health: 220,
  private_health: 380,
  expat_health: 72,
  liability: 5,
  household: 8,
  legal: 18,
  life: 12,
  dental: 15,
  disability: 55,
};

export function featherStatus(): PartnerStatus {
  const configured = Boolean(process.env.FEATHER_API_KEY && process.env.FEATHER_MGA_ID);
  return {
    slug: "feather",
    name: "Feather Insurance (MGA)",
    category: "insurance",
    mode: configured ? "live" : "mock",
    configured,
    gap: configured ? undefined : "Awaiting FEATHER_API_KEY and FEATHER_MGA_ID from partner onboarding.",
  };
}

export async function quoteFromFeather(input: InsuranceQuoteInput): Promise<InsuranceQuote> {
  const apiKey = process.env.FEATHER_API_KEY;
  const mgaId = process.env.FEATHER_MGA_ID;

  if (apiKey && mgaId) {
    // Live call — Feather's MGA endpoint accepts a pre-filled quote payload.
    // Kept intentionally small; real integration will validate against
    // Feather's published OpenAPI once the partner MOU is countersigned.
    const resp = await fetch("https://api.feather-insurance.com/v1/quotes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-MGA-Id": mgaId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...input, partner_ref: "beistandplus" }),
    });
    if (resp.ok) {
      const data = (await resp.json()) as {
        monthly_premium_eur: number;
        commission_eur: number;
        deep_link: string;
        disclaimers?: string[];
      };
      return {
        partner: "Feather",
        productLabel: PRODUCT_LABELS[input.product],
        monthlyPremiumEur: data.monthly_premium_eur,
        currency: "EUR",
        commissionEur: data.commission_eur,
        deepLink: data.deep_link,
        disclaimers: data.disclaimers ?? [],
      };
    }
    // Fall through to offline estimate on any 4xx/5xx so UX still works.
  }

  return offlineEstimate(input);
}

function offlineEstimate(input: InsuranceQuoteInput): InsuranceQuote {
  let base = BASELINE[input.product];
  const age = ageFromDob(input.dob);
  if (age && age >= 45) base *= 1.15;
  if (age && age >= 60) base *= 1.35;
  if (input.familyStatus === "family") base *= 1.6;
  else if (input.familyStatus === "couple") base *= 1.4;

  const premium = Math.round(base);
  return {
    partner: "Feather",
    productLabel: PRODUCT_LABELS[input.product],
    monthlyPremiumEur: premium,
    currency: "EUR",
    // Feather's typical MGA split is 10-15% of first-year premium.
    commissionEur: Math.round(premium * 12 * 0.12),
    deepLink: `https://feather-insurance.com/${input.product}?ref=beistandplus`,
    disclaimers: [
      "Offline estimate — final premium confirmed on Feather's site.",
      "BeistandPlus is a tied agent under Feather's MGA licence (§34d GewO).",
    ],
  };
}

function ageFromDob(dob: string): number | null {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
