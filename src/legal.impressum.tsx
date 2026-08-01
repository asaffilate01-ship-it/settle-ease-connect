// Partner API layer — shared types
// Adapters live under src/lib/partners/*. Every adapter conforms to one of
// these interfaces so the calling code (server functions, UI) doesn't care
// whether it is talking to a live partner or an explicitly enabled local demo.

export type PartnerMode = "live" | "sandbox" | "mock" | "disabled";

export function partnerDemosEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_PARTNER_DEMOS === "true";
}

export type PartnerStatus = {
  slug: string;
  name: string;
  category: "insurance" | "tax" | "care" | "translation" | "banking" | "housing";
  mode: PartnerMode;
  configured: boolean;
  // Human-readable description of what still needs to happen for `live`.
  gap?: string;
};

export type InsuranceQuoteInput = {
  product: "public_health" | "private_health" | "expat_health" | "liability" | "household" | "legal" | "life" | "dental" | "disability";
  dob: string; // YYYY-MM-DD
  postcode: string;
  familyStatus: "single" | "couple" | "family";
  monthlyIncomeEur?: number;
  hasResidencePermit?: boolean;
  language?: string;
};

export type InsuranceQuote = {
  partner: string;
  productLabel: string;
  monthlyPremiumEur: number;
  currency: "EUR";
  commissionEur: number; // what BeistandPlus receives, shown transparently
  deepLink: string; // resume purchase on partner site with the pre-filled quote
  disclaimers: string[];
};

export type TaxHandoffInput = {
  taxYear: number;
  language: string;
  grossIncomeEur: number;
  hasChildren: boolean;
  workedInMultipleStates?: boolean;
  needsHumanReview?: boolean;
};

export type TaxHandoff = {
  partner: string;
  handoffUrl: string; // pre-filled tax wizard on partner side
  estimatedRefundEur: number;
  feeEur: number;
  refundOrFree: boolean;
  humanReviewIncluded: boolean;
};

export type CareTranslationBooking = {
  language: string;
  modality: "phone" | "video" | "on_site";
  specialism: "medical" | "legal" | "administrative" | "bereavement" | "general";
  startAt: string; // ISO
  durationMinutes: number;
  city?: string;
};

export type CareTranslationConfirmation = {
  partner: string;
  bookingId: string;
  interpreterInitials: string; // never full name until check-in
  costEur: number;
  meetingUrl?: string;
  cancellationPolicy: string;
};
