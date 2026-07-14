import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Returns the caller's expert row (or null if they don't have one). */
export const getMyExpertProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("experts")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyExpertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        full_name: z.string().min(2).max(200).optional(),
        phone: z.string().max(50).optional().nullable(),
        city: z.string().max(120).optional().nullable(),
        bundesland: z.string().max(120).optional().nullable(),
        bio: z.string().max(4000).optional().nullable(),
        specialisations: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
        availability_notes: z.string().max(2000).optional().nullable(),
        hourly_rate_eur: z.number().min(0).max(10000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("experts")
      .update(data)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Cases assigned to the caller (as primary expert OR via case_assignments). */
export const listMyExpertCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: me } = await context.supabase
      .from("experts")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!me) return [];
    const expertId = (me as { id: string }).id;

    const { data: primary } = await context.supabase
      .from("cases")
      .select("id, reference, title, case_type, status, urgent, opened_at, updated_at, city")
      .eq("primary_expert_id", expertId);

    const { data: assignments } = await context.supabase
      .from("case_assignments")
      .select("case_id, role, status")
      .eq("assignee_expert_id", expertId);

    const assignedIds = Array.from(new Set((assignments ?? []).map((a: any) => a.case_id)));
    const missing = assignedIds.filter((id) => !(primary ?? []).some((c: any) => c.id === id));
    const { data: extra } = missing.length
      ? await context.supabase
          .from("cases")
          .select("id, reference, title, case_type, status, urgent, opened_at, updated_at, city")
          .in("id", missing)
      : { data: [] as any[] };

    const roleByCase = new Map(
      (assignments ?? []).map((a: any) => [a.case_id, { role: a.role, status: a.status }]),
    );

    return [...(primary ?? []), ...(extra ?? [])].map((c: any) => ({
      ...c,
      assignment_role: roleByCase.get(c.id)?.role ?? "primary_expert",
      assignment_status: roleByCase.get(c.id)?.status ?? null,
    }));
  });

/** Payout history for the caller. */
export const listMyPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: me } = await context.supabase
      .from("experts")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!me) return [];
    const { data, error } = await context.supabase
      .from("expert_payouts")
      .select("id, case_id, period_month, kind, description, gross_eur, rate, amount_eur, currency, status, paid_at, created_at")
      .eq("expert_id", (me as { id: string }).id)
      .order("period_month", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Aggregate dashboard KPIs for the caller. */
export const getMyExpertKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: me } = await context.supabase
      .from("experts")
      .select("id, verified, status, compensation_model")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!me) {
      return {
        hasProfile: false,
        activeCases: 0,
        openAssignments: 0,
        paidYtdEur: 0,
        pendingEur: 0,
        verified: false,
        status: null as string | null,
        compensation: null as string | null,
      };
    }
    const expertId = (me as any).id;
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

    const [
      { count: activeCases },
      { count: openAssignments },
      { data: payouts },
    ] = await Promise.all([
      context.supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("primary_expert_id", expertId)
        .not("status", "in", "(closed,cancelled,completed)"),
      context.supabase
        .from("case_assignments")
        .select("id", { count: "exact", head: true })
        .eq("assignee_expert_id", expertId)
        .in("status", ["pending", "accepted"]),
      context.supabase
        .from("expert_payouts")
        .select("amount_eur, status, paid_at, created_at")
        .eq("expert_id", expertId),
    ]);

    let paidYtdEur = 0;
    let pendingEur = 0;
    for (const p of (payouts ?? []) as any[]) {
      const amt = Number(p.amount_eur ?? 0);
      if (p.status === "paid" && p.paid_at && p.paid_at >= yearStart) paidYtdEur += amt;
      if (p.status === "pending" || p.status === "approved") pendingEur += amt;
    }

    return {
      hasProfile: true,
      activeCases: activeCases ?? 0,
      openAssignments: openAssignments ?? 0,
      paidYtdEur,
      pendingEur,
      verified: (me as any).verified ?? false,
      status: (me as any).status,
      compensation: (me as any).compensation_model,
    };
  });
