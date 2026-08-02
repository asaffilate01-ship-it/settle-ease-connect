import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforcePublicRateLimit } from "@/lib/public-rate-limit.server";

const TaxLeadSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(4).max(40).optional().nullable(),
  tax_year: z.number().int().min(2019).max(2030),
  employment_status: z.enum([
    "employee",
    "freelancer",
    "self_employed",
    "student",
    "job_seeker",
    "pensioner",
    "mixed",
  ]),
  gross_income_eur: z.number().nonnegative().max(10_000_000).optional().nullable(),
  tax_class: z.number().int().min(1).max(6).optional().nullable(),
  church_tax: z.boolean().default(false),
  has_children: z.boolean().default(false),
  children_count: z.number().int().min(0).max(15).default(0),
  commute_km: z.number().nonnegative().max(500).optional().nullable(),
  home_office_days: z.number().int().min(0).max(365).optional().nullable(),
  additional_deductions: z.number().nonnegative().max(200_000).optional().nullable(),
  estimated_refund_eur: z.number().max(50_000).optional().nullable(),
  preferred_language: z.string().max(5).optional(),
  preferred_contact: z.enum(["email", "phone", "whatsapp"]).default("email"),
  partner_referral: z
    .enum(["taxfix", "wundertax", "steuergo", "advisor", "unsure"])
    .optional()
    .nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/** Public, rate-limited request for contact about a possible tax-professional referral. */
export const submitTaxLead = createServerFn({ method: "POST" })
  .validator((raw: unknown) => TaxLeadSchema.parse(raw))
  .handler(async ({ data }) => {
    await enforcePublicRateLimit({
      scope: "tax-referral",
      limit: 5,
      windowSeconds: 3600,
      subject: data.email.toLowerCase(),
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("tax_leads").insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      tax_year: data.tax_year,
      employment_status: data.employment_status,
      gross_income_eur: data.gross_income_eur ?? null,
      tax_class: data.tax_class ?? null,
      church_tax: data.church_tax,
      has_children: data.has_children,
      children_count: data.children_count,
      commute_km: data.commute_km ?? null,
      home_office_days: data.home_office_days ?? null,
      additional_deductions: data.additional_deductions ?? null,
      estimated_refund_eur: data.estimated_refund_eur ?? null,
      preferred_language: data.preferred_language ?? "de",
      preferred_contact: data.preferred_contact,
      partner_referral: data.partner_referral ?? null,
      notes: data.notes ?? null,
      source: "tax_landing",
      status: "new",
    } as never);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
