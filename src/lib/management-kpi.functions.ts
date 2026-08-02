import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ManagementKpis = {
  newLeads30d: number;
  activeLeads: number;
  convertedLeads30d: number;
  conversionRatePct: number;
  activeMembers: number;
  mrrEur: number;
  delaReferrals30d: number;
  delaAcceptanceRatePct: number;
  insuranceReferrals30d: number;
  insuranceTriageBacklog: number;
  activeCases: number;
  breachedCases: number;
  closedCases30d: number;
  avgResolutionDays: number | null;
  csatAvg: number | null;
  csatCount30d: number;
  openComplaints: number;
  staffWorkload: Array<{ user_id: string; name: string | null; open_cases: number }>;
  providerPerformance: Array<{
    org_id: string;
    name: string;
    accepted: number;
    declined: number;
    pending: number;
  }>;
  revenueByPartner: Array<{ org_id: string | null; name: string; commission_eur: number }>;
};

export const getManagementKpis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagementKpis> => {
    const sb = context.supabase;
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      leadsAll,
      leadsWon,
      subs,
      plans,
      delaAll,
      insAll,
      insUntriaged,
      casesAll,
      complaints,
      csat,
      assignments,
      partners,
    ] = await Promise.all([
      sb.from("crm_leads").select("id,status,created_at,owner_user_id"),
      sb
        .from("crm_leads")
        .select("id,status,updated_at")
        .in("status", ["won"])
        .gte("updated_at", since30),
      sb
        .from("subscriptions")
        .select("user_id,plan_code,status")
        .in("status", ["active", "trialing", "past_due"]),
      sb.from("subscription_plans").select("code,monthly_price_eur"),
      sb.from("dela_referrals").select("id,status,created_at"),
      sb.from("insurance_leads").select("id,stage,created_at,triage_route"),
      sb
        .from("insurance_leads")
        .select("id", { count: "exact", head: true })
        .is("triage_route", null),
      sb.from("cases").select("id,status,case_manager_user_id,created_at,closed_at,sla_due_at"),
      sb.from("crm_complaints").select("id,status"),
      sb.from("crm_satisfaction").select("score,created_at").not("score", "is", null),
      sb.from("case_assignments").select("partner_org_id,accepted_at,declined_at,invited_at"),
      sb.from("partner_organisations").select("id,legal_name,trading_name"),
    ]);

    const leads = leadsAll.data ?? [];
    const newLeads30d = leads.filter((l: any) => l.created_at >= since30).length;
    const activeLeads = leads.filter(
      (l: any) => !["won", "lost", "disqualified"].includes(l.status),
    ).length;
    const convertedLeads30d = leadsWon.data?.length ?? 0;
    const conversionRatePct =
      newLeads30d > 0 ? Math.round((convertedLeads30d / newLeads30d) * 100) : 0;

    const planPrice = new Map<string, number>();
    for (const p of plans.data ?? []) planPrice.set(p.code, Number(p.monthly_price_eur ?? 0));
    const activeMembers = subs.data?.length ?? 0;
    const mrrEur = Math.round(
      (subs.data ?? []).reduce((sum: number, s: any) => sum + (planPrice.get(s.plan_code) ?? 0), 0),
    );

    const dela = delaAll.data ?? [];
    const delaReferrals30d = dela.filter((r: any) => r.created_at >= since30).length;
    const delaSent = dela.filter((r: any) =>
      [
        "sent",
        "partner_ack",
        "application_submitted",
        "policy_accepted",
        "policy_declined",
        "commission_due",
        "commission_paid",
        "renewed",
      ].includes(r.status),
    ).length;
    const delaAccepted = dela.filter((r: any) =>
      ["policy_accepted", "commission_due", "commission_paid", "renewed"].includes(r.status),
    ).length;
    const delaAcceptanceRatePct = delaSent > 0 ? Math.round((delaAccepted / delaSent) * 100) : 0;

    const ins = insAll.data ?? [];
    const insuranceReferrals30d = ins.filter((r: any) => r.created_at >= since30).length;
    const insuranceTriageBacklog = insUntriaged.count ?? 0;

    const cases = casesAll.data ?? [];
    const openStatuses = ["open", "in_progress", "active", "awaiting", "assigned"];
    const activeCases = cases.filter((c: any) => c.status !== "closed").length;
    const now = Date.now();
    const breachedCases = cases.filter(
      (c: any) => c.status !== "closed" && c.sla_due_at && new Date(c.sla_due_at).getTime() < now,
    ).length;
    const closed30 = cases.filter(
      (c: any) => c.status === "closed" && c.closed_at && c.closed_at >= since30,
    );
    const closedCases30d = closed30.length;
    const durations = closed30
      .filter((c: any) => c.created_at && c.closed_at)
      .map(
        (c: any) =>
          (new Date(c.closed_at).getTime() - new Date(c.created_at).getTime()) / 86_400_000,
      );
    const avgResolutionDays =
      durations.length > 0
        ? Math.round(
            (durations.reduce((a: number, b: number) => a + b, 0) / durations.length) * 10,
          ) / 10
        : null;

    const csatRows = csat.data ?? [];
    const csatCount30d = csatRows.filter((r: any) => r.created_at >= since30).length;
    const csatAvg =
      csatRows.length > 0
        ? Math.round(
            (csatRows.reduce((sum: number, r: any) => sum + Number(r.score), 0) / csatRows.length) *
              10,
          ) / 10
        : null;

    const openComplaints = (complaints.data ?? []).filter(
      (c: any) => !["closed", "resolved"].includes(c.status),
    ).length;

    // Staff workload — open cases per case_manager_user_id
    const workloadMap = new Map<string, number>();
    for (const c of cases) {
      if (c.status !== "closed" && c.case_manager_user_id) {
        workloadMap.set(c.case_manager_user_id, (workloadMap.get(c.case_manager_user_id) ?? 0) + 1);
      }
    }
    const workloadUserIds = [...workloadMap.keys()];
    const profs =
      workloadUserIds.length > 0
        ? await sb.from("profiles").select("id,full_name").in("id", workloadUserIds)
        : { data: [] as any[] };
    const nameOf = new Map<string, string | null>();
    for (const p of profs.data ?? []) nameOf.set(p.id, p.full_name);
    const staffWorkload = [...workloadMap.entries()]
      .map(([user_id, open_cases]) => ({ user_id, name: nameOf.get(user_id) ?? null, open_cases }))
      .sort((a, b) => b.open_cases - a.open_cases)
      .slice(0, 10);

    // Provider performance
    const partnerName = new Map<string, string>();
    for (const p of partners.data ?? []) partnerName.set(p.id, p.trading_name ?? p.legal_name);
    const perfMap = new Map<string, { accepted: number; declined: number; pending: number }>();
    for (const a of assignments.data ?? []) {
      if (!a.partner_org_id) continue;
      const row = perfMap.get(a.partner_org_id) ?? { accepted: 0, declined: 0, pending: 0 };
      if (a.accepted_at) row.accepted += 1;
      else if (a.declined_at) row.declined += 1;
      else if (a.invited_at) row.pending += 1;
      perfMap.set(a.partner_org_id, row);
    }
    const providerPerformance = [...perfMap.entries()]
      .map(([org_id, v]) => ({ org_id, name: partnerName.get(org_id) ?? "—", ...v }))
      .sort((a, b) => b.accepted + b.pending - (a.accepted + a.pending))
      .slice(0, 10);

    // Revenue by partner — from agent_commissions grouped by referred_user_id → not partner. Skip: return empty.
    const revenueByPartner: ManagementKpis["revenueByPartner"] = [];

    return {
      newLeads30d,
      activeLeads,
      convertedLeads30d,
      conversionRatePct,
      activeMembers,
      mrrEur,
      delaReferrals30d,
      delaAcceptanceRatePct,
      insuranceReferrals30d,
      insuranceTriageBacklog,
      activeCases,
      breachedCases,
      closedCases30d,
      avgResolutionDays,
      csatAvg,
      csatCount30d,
      openComplaints,
      staffWorkload,
      providerPerformance,
      revenueByPartner,
    };
  });
