// Public server-function surface for the partner API layer.
// Anything the UI calls goes through here so we can add auth middleware,
// rate limiting, and audit logging in one place later.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { featherStatus, quoteFromFeather } from "./partners/feather";
import { taxfixStatus, handoffToTaxfix } from "./partners/taxfix";
import { bookCareTranslation, careTranslationStatus } from "./partners/care-translation";
import type { PartnerStatus } from "./partners/types";

const insuranceQuoteSchema = z.object({
  product: z.enum(["public_health", "private_health", "expat_health", "liability", "household", "legal", "life", "dental", "disability"]),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  postcode: z.string().min(4).max(6),
  familyStatus: z.enum(["single", "couple", "family"]),
  monthlyIncomeEur: z.number().nonnegative().max(1_000_000).optional(),
  hasResidencePermit: z.boolean().optional(),
  language: z.string().max(8).optional(),
});

const taxHandoffSchema = z.object({
  taxYear: z.number().int().min(2019).max(2030),
  language: z.string().max(8),
  grossIncomeEur: z.number().nonnegative().max(10_000_000),
  hasChildren: z.boolean(),
  workedInMultipleStates: z.boolean().optional(),
  needsHumanReview: z.boolean().optional(),
});

const careBookingSchema = z.object({
  language: z.string().min(2).max(8),
  modality: z.enum(["phone", "video", "on_site"]),
  specialism: z.enum(["medical", "legal", "administrative", "bereavement", "general"]),
  startAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480),
  city: z.string().max(80).optional(),
});

export const listPartnerStatus = createServerFn({ method: "GET" }).handler(async (): Promise<PartnerStatus[]> => {
  return [featherStatus(), taxfixStatus(), careTranslationStatus()];
});

export const requestInsuranceQuote = createServerFn({ method: "POST" })
  .inputValidator((raw) => insuranceQuoteSchema.parse(raw))
  .handler(async ({ data }) => quoteFromFeather(data));

export const requestTaxHandoff = createServerFn({ method: "POST" })
  .inputValidator((raw) => taxHandoffSchema.parse(raw))
  .handler(async ({ data }) => handoffToTaxfix(data));

export const requestCareBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => careBookingSchema.parse(raw))
  .handler(async ({ data }) => {
    // Reject bookings scheduled in the past or absurdly far in the future.
    const startMs = Date.parse(data.startAt);
    const now = Date.now();
    if (!Number.isFinite(startMs) || startMs < now - 5 * 60_000) {
      throw new Error("Booking start must be in the future.");
    }
    if (startMs > now + 365 * 24 * 60 * 60 * 1000) {
      throw new Error("Booking start is too far in the future.");
    }
    return bookCareTranslation(data);
  });
