import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
  return !!data;
}

export const listReferralPartners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ category: z.string().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const q = context.supabase.from("referral_partners").select("*").eq("active", true).order("name");
    if (data.category) q.eq("category", data.category);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertReferralPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        slug: z.string().min(2).max(60),
        name: z.string().min(1).max(120),
        category: z.string().min(1).max(60),
        description: z.string().max(500).optional().nullable(),
        website: z.string().url().optional().nullable(),
        url_template: z.string().min(4).max(500),
        commission_model: z.enum(["flat", "percent_first", "percent_recurring", "cpl", "cpa"]),
        commission_rate: z.number().min(0).max(1).default(0),
        commission_flat_cents: z.number().int().min(0).default(0),
        disclose_to_client: z.boolean().default(false),
        active: z.boolean().default(true),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertInternal(context))) throw new Error("Forbidden");
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await context.supabase.from("referral_partners").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: inserted, error } = await context.supabase
      .from("referral_partners")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted?.id };
  });

export const createReferralLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        partner_id: z.string().uuid(),
        case_id: z.string().uuid().optional().nullable(),
        source_page: z.string().max(200).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    // Look up the partner's configured commission — never trust client input.
    const { data: partner, error: pErr } = await context.supabase
      .from("referral_partners")
      .select("commission_model, commission_rate, commission_flat_cents, active")
      .eq("id", data.partner_id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!partner || !partner.active) throw new Error("Partner not found or inactive");

    // Server-computed expected commission (best-effort estimate for flat/cpl/cpa).
    const expected =
      partner.commission_model === "flat" || partner.commission_model === "cpl" || partner.commission_model === "cpa"
        ? Number(partner.commission_flat_cents ?? 0)
        : 0;

    const { data: inserted, error } = await context.supabase
      .from("referral_leads")
      .insert({
        partner_id: data.partner_id,
        client_user_id: context.userId,
        case_id: data.case_id ?? null,
        source_page: data.source_page ?? null,
        commission_expected_cents: expected,
        notes: data.notes ?? null,
        status: "sent",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted?.id };
  });

export const listReferralLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("referral_leads")
      .select("*, referral_partners(name, category, commission_model)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateReferralLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["sent", "clicked", "registered", "converted", "paid", "clawback", "rejected"]).optional(),
        commission_expected_cents: z.number().int().min(0).optional(),
        commission_received_cents: z.number().int().min(0).optional(),
        invoice_reference: z.string().max(120).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertInternal(context))) throw new Error("Forbidden");
    const { id, ...patch } = data;
    const p: Record<string, unknown> = { ...patch };
    if (patch.status === "converted") p.converted_at = new Date().toISOString();
    if (patch.status === "paid") p.paid_at = new Date().toISOString();
    const { error } = await context.supabase.from("referral_leads").update(p as any).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export function buildReferralUrl(template: string, sub: string, ref?: string | null) {
  return template
    .replace("{ref}", encodeURIComponent(ref || "direct"))
    .replace("{sub}", encodeURIComponent(sub || "direct"));
}
