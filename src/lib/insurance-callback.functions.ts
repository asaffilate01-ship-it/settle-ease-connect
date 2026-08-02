import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforcePublicRateLimit } from "@/lib/public-rate-limit.server";

const CallbackSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(4).max(40).optional().nullable(),
  product_line: z.enum([
    "expat_health",
    "liability",
    "household",
    "legal_expenses",
    "term_life",
    "bereavement",
    "pet",
    "other",
  ]),
  preferred_contact: z.enum(["email", "phone", "whatsapp"]).default("email"),
  preferred_language: z.string().max(5).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

/**
 * Public insurance callback capture used on `/insurance`.
 * Writes to `insurance_leads` with product_line / preferred_contact set;
 * funeral-specific columns (age, benefit_amount, etc.) are nullable so a
 * general MGA callback can be captured without those fields.
 */
export const submitInsuranceCallback = createServerFn({ method: "POST" })
  .validator((raw: unknown) => CallbackSchema.parse(raw))
  .handler(async ({ data }) => {
    await enforcePublicRateLimit({
      scope: "insurance-referral",
      limit: 5,
      windowSeconds: 3600,
      subject: data.email.toLowerCase(),
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("insurance_leads").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      product_line: data.product_line,
      preferred_contact: data.preferred_contact,
      preferred_language: data.preferred_language ?? "de",
      notes: data.notes ?? null,
      source: "insurance_landing",
      status: "new",
    } as never);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
