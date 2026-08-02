import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ Campaign attribution ============
export const campaignAttribution = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    // Pull recent contacts with utm
    const { data: contacts, error } = await supabase
      .from("crm_contacts")
      .select(
        "id, email, utm_source, utm_medium, utm_campaign, source, created_at, merged_into_user_id",
      )
      .not("utm_source", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw error;

    const rows = contacts ?? [];
    const buckets = new Map<
      string,
      {
        key: string;
        utm_source: string | null;
        utm_medium: string | null;
        utm_campaign: string | null;
        leads: number;
        converted: number;
        memberIds: string[];
      }
    >();
    for (const c of rows) {
      const key = `${c.utm_source ?? ""}|${c.utm_medium ?? ""}|${c.utm_campaign ?? ""}`;
      let b = buckets.get(key);
      if (!b) {
        b = {
          key,
          utm_source: c.utm_source,
          utm_medium: c.utm_medium,
          utm_campaign: c.utm_campaign,
          leads: 0,
          converted: 0,
          memberIds: [],
        };
        buckets.set(key, b);
      }
      b.leads += 1;
      if (c.merged_into_user_id) {
        b.converted += 1;
        b.memberIds.push(c.merged_into_user_id);
      }
    }

    // Fetch subscription revenue for merged members
    const allMemberIds = [...new Set([...buckets.values()].flatMap((b) => b.memberIds))];
    const subByUser = new Map<
      string,
      { plan_code: string | null; monthly: number; months: number }
    >();
    if (allMemberIds.length) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, plan_code, status, current_period_start, created_at")
        .in("user_id", allMemberIds);
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("code, monthly_price_eur");
      const priceMap = new Map<string, number>();
      for (const p of plans ?? []) priceMap.set(p.code, Number(p.monthly_price_eur ?? 0));
      for (const s of subs ?? []) {
        const monthly = priceMap.get(s.plan_code ?? "") ?? 0;
        const startedAt = s.created_at ? new Date(s.created_at) : new Date();
        const months = Math.max(
          1,
          Math.round((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)),
        );
        subByUser.set(s.user_id, { plan_code: s.plan_code, monthly, months });
      }
    }

    return [...buckets.values()]
      .map((b) => {
        const revenue = b.memberIds.reduce((sum, uid) => {
          const s = subByUser.get(uid);
          return s ? sum + s.monthly * s.months : sum;
        }, 0);
        const ltv = b.converted ? revenue / b.converted : 0;
        const cvr = b.leads ? b.converted / b.leads : 0;
        return {
          utm_source: b.utm_source,
          utm_medium: b.utm_medium,
          utm_campaign: b.utm_campaign,
          leads: b.leads,
          converted: b.converted,
          revenue_eur: Math.round(revenue * 100) / 100,
          ltv_eur: Math.round(ltv * 100) / 100,
          conversion_rate: Math.round(cvr * 10000) / 100,
        };
      })
      .sort((a, b) => b.leads - a.leads);
  });

// ============ CSAT / NPS dashboard ============
export const csatDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("crm_satisfaction")
      .select("id, case_id, score, nps_category, comments, submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    const rows = data ?? [];
    const totals = { promoters: 0, passives: 0, detractors: 0 };
    let sum = 0;
    for (const r of rows) {
      sum += Number(r.score ?? 0);
      const cat = (r.nps_category ?? "").toLowerCase();
      if (cat === "promoter" || Number(r.score) >= 9) totals.promoters += 1;
      else if (cat === "passive" || Number(r.score) >= 7) totals.passives += 1;
      else totals.detractors += 1;
    }
    const n = rows.length || 1;
    const nps = ((totals.promoters - totals.detractors) / n) * 100;
    return {
      count: rows.length,
      averageScore: Math.round((sum / n) * 10) / 10,
      nps: Math.round(nps),
      promoters: totals.promoters,
      passives: totals.passives,
      detractors: totals.detractors,
      recent: rows.slice(0, 20),
    };
  });

// ============ Commission reconciliation ============
export const listCommissionRows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("insurance_leads")
      .select(
        "id, full_name, email, carrier_partner, product_line, stage, commission_amount, commission_status, policy_reference, updated_at",
      )
      .not("commission_amount", "is", null)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    const rows = data ?? [];
    const totals = rows.reduce(
      (acc, r) => {
        const amt = Number(r.commission_amount ?? 0);
        acc.total += amt;
        if (r.commission_status === "paid") acc.paid += amt;
        else if (r.commission_status === "due") acc.due += amt;
        else acc.pending += amt;
        return acc;
      },
      { total: 0, paid: 0, due: 0, pending: 0 },
    );
    return { rows, totals };
  });

export const reconcileCommissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { csv: string }) => z.object({ csv: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    // CSV columns expected: policy_reference,amount_paid,paid_at
    const lines = data.csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2)
      throw new Error("CSV must include a header row and at least one data row");
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idxRef = header.indexOf("policy_reference");
    const idxAmt = header.indexOf("amount_paid");
    if (idxRef < 0 || idxAmt < 0)
      throw new Error("CSV must have columns: policy_reference, amount_paid, paid_at");

    let matched = 0;
    let unmatched = 0;
    const { supabase } = context;
    for (const line of lines.slice(1)) {
      const parts = line.split(",").map((c) => c.trim());
      const ref = parts[idxRef];
      const amt = Number(parts[idxAmt]);
      if (!ref || Number.isNaN(amt)) {
        unmatched += 1;
        continue;
      }
      const { data: hit, error } = await supabase
        .from("insurance_leads")
        .update({ commission_status: "paid", commission_amount: amt })
        .eq("policy_reference", ref)
        .select("id");
      if (error) throw error;
      if (hit && hit.length) matched += 1;
      else unmatched += 1;
    }
    return { matched, unmatched };
  });

export const markCommissionPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { leadId: string }) => z.object({ leadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("insurance_leads")
      .update({ commission_status: "paid" })
      .eq("id", data.leadId);
    if (error) throw error;
    return { ok: true };
  });
