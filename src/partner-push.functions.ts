import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";

// ---------- Get agent profile (self) ----------
export const getMyAgentProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
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
  .middleware([requireSupabaseAal2])
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
  .middleware([requireSupabaseAal2])
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
  .middleware([requireSupabaseAal2])
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
  .middleware([requireSupabaseAal2])
  .validator((input) =>
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

    // Verify the caller is an active agent (not just role-assigned).
    const { data: active, error: activeErr } = await supabase.rpc("is_active_agent", { _user_id: userId });
    if (activeErr) throw new Error(activeErr.message);
    if (!active) throw new Error("Your agent account is not active. Contact BeistandPlus to reactivate.");

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

// ---------- Funnel (referrals grouped by stage) ----------
export const getMyAgentFunnel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [refsRes, subsRes, commsRes] = await Promise.all([
      supabase.from("agent_referrals")
        .select("id, referred_email, product, status, source, created_at, referred_user_id")
        .eq("agent_user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("subscriptions")
        .select("user_id, plan_code, status, created_at")
        .eq("referring_agent_user_id", userId),
      supabase.from("agent_commissions")
        .select("status, commission_eur, period_month")
        .eq("agent_user_id", userId),
    ]);
    const referrals = refsRes.data ?? [];
    const subs = subsRes.data ?? [];
    const comms = commsRes.data ?? [];

    const invited = referrals.length;
    const signedUp = referrals.filter((r) => r.referred_user_id).length;
    const subscribed = subs.filter((s) => ["active", "trialing"].includes(s.status)).length;
    const churned = subs.filter((s) => ["canceled", "past_due"].includes(s.status)).length;

    const stages = [
      { key: "invited", label: "Invited", count: invited },
      { key: "signed_up", label: "Signed up", count: signedUp },
      { key: "subscribed", label: "Subscribed", count: subscribed },
      { key: "paying", label: "Paying (30d+)", count: subs.filter((s) => s.status === "active" && Date.now() - new Date(s.created_at).getTime() > 30 * 86_400_000).length },
    ];

    // Conversion rates
    const conv = {
      inviteToSignup: invited ? Math.round((signedUp / invited) * 100) : 0,
      signupToSub: signedUp ? Math.round((subscribed / signedUp) * 100) : 0,
      subToPaying: subscribed ? Math.round((stages[3].count / subscribed) * 100) : 0,
    };

    // Group by product for top-of-funnel breakdown
    const byProduct: Record<string, number> = {};
    referrals.forEach((r) => { byProduct[r.product ?? "other"] = (byProduct[r.product ?? "other"] ?? 0) + 1; });

    // Group by source
    const bySource: Record<string, number> = {};
    referrals.forEach((r) => { bySource[r.source ?? "other"] = (bySource[r.source ?? "other"] ?? 0) + 1; });

    // Recent 30d
    const cutoff = Date.now() - 30 * 86_400_000;
    const recent = referrals.filter((r) => new Date(r.created_at).getTime() > cutoff).length;

    const paidComm = comms.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_eur ?? 0), 0);
    const pendingComm = comms.filter((c) => c.status !== "paid").reduce((s, c) => s + Number(c.commission_eur ?? 0), 0);

    return {
      stages,
      conv,
      byProduct,
      bySource,
      recent30d: recent,
      churned,
      earnings: { paidEur: Math.round(paidComm * 100) / 100, pendingEur: Math.round(pendingComm * 100) / 100 },
      referrals: referrals.slice(0, 100),
    };
  });
