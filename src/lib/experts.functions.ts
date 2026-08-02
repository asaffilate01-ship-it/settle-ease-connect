import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2, requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_internal", {
    _user_id: context.userId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: internal staff only");
}

const CompensationSchema = z.enum(["referral_fee", "wholesale", "direct_bill"]);

// -------- Invitations --------

export const listExpertInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const { data, error } = await context.supabase
      .from("expert_invitations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createExpertInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        email: z.string().email().max(200),
        full_name: z.string().min(2).max(200),
        profession: z.string().min(2).max(120),
        compensation_model: CompensationSchema.default("referral_fee"),
        referral_fee_pct: z.number().min(0).max(50).nullable().optional(),
        wholesale_rate_eur: z.number().min(0).max(10000).nullable().optional(),
        hourly_rate_eur: z.number().min(0).max(10000).nullable().optional(),
        languages: z.array(z.string()).default(["de", "en"]),
        city: z.string().max(120).optional().nullable(),
        bundesland: z.string().max(120).optional().nullable(),
        personal_message: z.string().max(1000).optional().nullable(),
        days_valid: z.number().int().min(1).max(365).default(30),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const token =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expires = new Date(Date.now() + data.days_valid * 86400000).toISOString();
    const { data: inserted, error } = await context.supabase
      .from("expert_invitations")
      .insert({
        token,
        email: data.email.toLowerCase(),
        full_name: data.full_name,
        profession: data.profession,
        compensation_model: data.compensation_model,
        referral_fee_pct: data.referral_fee_pct ?? null,
        wholesale_rate_eur: data.wholesale_rate_eur ?? null,
        hourly_rate_eur: data.hourly_rate_eur ?? null,
        languages: data.languages,
        city: data.city ?? null,
        bundesland: data.bundesland ?? null,
        personal_message: data.personal_message ?? null,
        expires_at: expires,
        invited_by: context.userId,
      })
      .select("id, token")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id, token: inserted.token };
  });

export const revokeExpertInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const { error } = await context.supabase
      .from("expert_invitations")
      .delete()
      .eq("id", data.id)
      .is("accepted_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Fetch a single invitation by token (used by the accept page — pre-signup).
// Uses the public/anon read via supabaseAdmin because RLS blocks pre-accept reads.
export const getExpertInvitationByToken = createServerFn({ method: "GET" })
  .validator((raw: unknown) => z.object({ token: z.string().min(10) }).parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv, error } = await supabaseAdmin
      .from("expert_invitations")
      .select(
        "id, email, full_name, profession, compensation_model, referral_fee_pct, wholesale_rate_eur, hourly_rate_eur, languages, city, bundesland, personal_message, expires_at, accepted_at",
      )
      .eq("token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inv) return { ok: false as const, reason: "not_found" as const };
    if (inv.accepted_at) return { ok: false as const, reason: "already_accepted" as const };
    if (new Date(inv.expires_at) < new Date())
      return { ok: false as const, reason: "expired" as const };
    return { ok: true as const, invitation: inv };
  });

export const acceptExpertInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ token: z.string().min(10) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: newId, error } = await context.supabase.rpc("accept_expert_invitation", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    return { ok: true, expert_id: newId as string };
  });

// -------- Payouts --------

export const listExpertPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z.object({ expert_id: z.string().uuid().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("expert_payouts")
      .select(
        "id, expert_id, case_id, period_month, kind, description, gross_eur, rate, amount_eur, currency, status, paid_at, payment_reference, notes, created_at, expert:experts(full_name, profession)",
      )
      .order("period_month", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.expert_id) q = q.eq("expert_id", data.expert_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createExpertPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        expert_id: z.string().uuid(),
        case_id: z.string().uuid().optional().nullable(),
        kind: z.enum(["referral_fee", "wholesale_markup", "hourly", "bonus", "adjustment"]),
        description: z.string().max(500).optional().nullable(),
        gross_eur: z.number().min(0).default(0),
        rate: z.number().min(0).max(1).optional().nullable(),
        amount_eur: z.number(),
        period_month: z.string().optional(), // YYYY-MM-DD
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const payload: any = {
      expert_id: data.expert_id,
      case_id: data.case_id ?? null,
      kind: data.kind,
      description: data.description ?? null,
      gross_eur: data.gross_eur,
      rate: data.rate ?? null,
      amount_eur: data.amount_eur,
      notes: data.notes ?? null,
      created_by: context.userId,
    };
    if (data.period_month) payload.period_month = data.period_month;
    const { error } = await context.supabase.from("expert_payouts").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateExpertPayoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "paid", "void"]),
        payment_reference: z.string().max(200).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const patch: any = { status: data.status };
    if (data.status === "paid") {
      patch.paid_at = new Date().toISOString();
      if (data.payment_reference) patch.payment_reference = data.payment_reference;
    }
    const { error } = await context.supabase.from("expert_payouts").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
