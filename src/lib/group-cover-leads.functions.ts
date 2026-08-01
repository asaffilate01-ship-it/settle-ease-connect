import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GroupLeadSchema = z.object({
  organization_name: z.string().trim().min(2).max(160),
  legal_form: z.enum(["ev", "gmbh", "ag", "gug", "other"]),
  contact_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  member_count: z.number().int().min(50).max(1_000_000),
  age_bracket_note: z.string().trim().max(600).optional().nullable(),
  target_benefit_eur: z.number().int().min(3_000).max(20_000),
  premium_model: z.enum(["obligatory_flat", "obligatory_by_age", "facultative"]),
  premium_payer: z.enum(["org_pays_all", "member_pays_all", "co_pay"]),
  wants_fiduciary_flow: z.boolean(),
  has_sepa_setup: z.boolean(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const submitGroupCoverLead = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => GroupLeadSchema.parse(raw))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const notesPayload = JSON.stringify(
      {
        kind: "group_cover_intake",
        organization_name: data.organization_name,
        legal_form: data.legal_form,
        contact_name: data.contact_name,
        phone: data.phone ?? null,
        member_count: data.member_count,
        age_bracket_note: data.age_bracket_note ?? null,
        premium_model: data.premium_model,
        premium_payer: data.premium_payer,
        wants_fiduciary_flow: data.wants_fiduciary_flow,
        has_sepa_setup: data.has_sepa_setup,
        free_notes: data.notes ?? null,
      },
      null,
      2,
    );

    const { error } = await supabase.from("insurance_leads").insert({
      full_name: data.contact_name,
      email: data.email,
      phone: data.phone ?? null,
      benefit_amount: data.target_benefit_eur,
      preferred_language: "de",
      notes: notesPayload,
      source: "group_cover",
      status: "new",
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
