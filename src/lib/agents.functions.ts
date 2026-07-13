import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Get agent profile (self) ----------
export const getMyAgentProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

// ---------- KPI summary for the agent dashboard ----------
export const getMyAgentKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ count: totalClients }, { data: commissions }] = await Promise.all([
      supabase
        .from("agent_referrals")
        .select("id", { count: "exact", head: true })
        .eq("agent_user_id", userId),
      supabase
        .from("agent_commissions")
        .select("gross_eur, commission_eur, status, period_month")
        .eq("agent_user_id", userId),
    ]);

    const rows = commissions ?? [];
    const totalEarned = rows
      .filter((r) => r.status === "paid")
      .reduce((s, r) => s + Number(r.commission_eur ?? 0), 0);
    const pending = rows
      .filter((r) => r.status !== "paid")
      .reduce((s, r) => s + Number(r.commission_eur ?? 0), 0);
    const mtd = (() => {
      const now = new Date();
      const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
      return rows
        .filter((r) => r.period_month === start)
        .reduce((s, r) => s + Number(r.commission_eur ?? 0), 0);
    })();

    return {
      totalClients: totalClients ?? 0,
      totalEarnedEur: Number(totalEarned.toFixed(2)),
      pendingEur: Number(pending.toFixed(2)),
      mtdEur: Number(mtd.toFixed(2)),
    };
  });

// ---------- List referrals ----------
export const listMyReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("agent_referrals")
      .select("id, referred_user_id, referred_email, source, product, status, notes, created_at")
      .eq("agent_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- List commissions ----------
export const listMyCommissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("agent_commissions")
      .select("id, period_month, product, gross_eur, commission_rate, commission_eur, status, paid_at, notes")
      .eq("agent_user_id", userId)
      .order("period_month", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- Log a manual referral (agent adds a lead by email) ----------
export const addManualReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        referredEmail: z.string().email(),
        product: z.enum(["subscription_basic", "subscription_plus", "subscription_complete", "funeral_cover", "group_cover"]),
        notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("agent_referrals").insert({
      agent_user_id: userId,
      referred_email: data.referredEmail.toLowerCase(),
      product: data.product,
      source: "manual",
      status: "pending",
      notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
