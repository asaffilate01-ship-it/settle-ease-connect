import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LeadSchema = z.object({
  contact_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  household_kind: z.enum(["individual", "family", "extended"]).default("family"),
  adults_count: z.number().int().min(1).max(6),
  children_count: z.number().int().min(0).max(10),
  target_benefit_eur: z.number().int().min(5000).max(50000).default(20000),
  city: z.string().trim().max(120).optional().nullable(),
  bundesland: z.string().trim().max(80).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_internal", {
    _user_id: context.userId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const submitFuneralLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => LeadSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("funeral_leads")
      .insert({
        user_id: userId,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone ?? null,
        household_kind: data.household_kind,
        adults_count: data.adults_count,
        children_count: data.children_count,
        target_benefit_eur: data.target_benefit_eur,
        city: data.city ?? null,
        bundesland: data.bundesland ?? null,
        notes: data.notes ?? null,
        status: "new",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listMyFuneralLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("funeral_leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMyFuneralPolicies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("funeral_policies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listFuneralLeadsInternal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        status: z
          .enum(["new", "contacted", "quoted", "bound", "declined", "withdrawn"])
          .optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    let q = context.supabase
      .from("funeral_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const setFuneralLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum([
          "new",
          "contacted",
          "quoted",
          "bound",
          "declined",
          "withdrawn",
        ]),
        internal_notes: z.string().trim().max(4000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const patch: { status: typeof data.status; internal_notes?: string | null } = {
      status: data.status,
    };
    if (data.internal_notes !== undefined)
      patch.internal_notes = data.internal_notes;
    const { error } = await context.supabase
      .from("funeral_leads")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PolicySchema = z.object({
  user_id: z.string().uuid(),
  lead_id: z.string().uuid().optional().nullable(),
  policy_number: z.string().trim().max(80).optional().nullable(),
  insurer_name: z.string().trim().min(2).max(160),
  benefit_eur: z.number().int().min(1000).max(200000),
  premium_eur: z.number().min(0).max(100000),
  premium_cadence: z
    .enum(["monthly", "quarterly", "yearly", "single"])
    .default("monthly"),
  household_kind: z.enum(["individual", "family", "extended"]).default("family"),
  adults_covered: z.number().int().min(1).max(6),
  children_covered: z.number().int().min(0).max(10),
  start_date: z.string().optional().nullable(),
  renewal_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z
    .enum(["pending", "active", "lapsed", "cancelled", "claimed"])
    .default("pending"),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const createFuneralPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PolicySchema.parse(raw))
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const { data: row, error } = await context.supabase
      .from("funeral_policies")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listFuneralPoliciesInternal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const { data, error } = await context.supabase
      .from("funeral_policies")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
