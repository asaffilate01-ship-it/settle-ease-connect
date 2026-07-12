import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const LeadSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().nullable(),
  age: z.number().int().min(18).max(85),
  benefit_amount: z.number().int().min(2000).max(20000),
  tobacco: z.boolean(),
  waiting_period_months: z.number().int().min(0).max(36),
  estimated_premium_min: z.number().min(0).max(500),
  estimated_premium_max: z.number().min(0).max(500),
  preferred_language: z.string().max(5).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const submitInsuranceLead = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => LeadSchema.parse(raw))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase.from("insurance_leads").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      age: data.age,
      benefit_amount: data.benefit_amount,
      tobacco: data.tobacco,
      waiting_period_months: data.waiting_period_months,
      estimated_premium_min: data.estimated_premium_min,
      estimated_premium_max: data.estimated_premium_max,
      preferred_language: data.preferred_language ?? "de",
      notes: data.notes ?? null,
      source: "quote_widget",
      status: "new",
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
