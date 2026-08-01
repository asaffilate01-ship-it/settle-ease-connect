import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { enforceRateLimit, rejectBotField } from "@/lib/public-api-guard.server";

const CallbackSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(4).max(40).optional().nullable(),
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
  website: z.string().max(0).optional(),
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
    rejectBotField(data.website);
    await enforceRateLimit({
      scope: "insurance-callback",
      limit: 5,
      windowSeconds: 3600,
    });
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase.from("insurance_leads").insert({
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
