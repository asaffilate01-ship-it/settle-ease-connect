import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { QueueItem } from "@/components/portal/queue-row";
import type { ActivityEntry } from "@/components/portal/activity-item";

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_internal", {
    _user_id: context.userId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: internal staff only");
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

// ---------- Ops console ----------

const WINDOWS = { today: 1, "7d": 7, "30d": 30 } as const;
type WindowKey = keyof typeof WINDOWS;

export const getOpsConsole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        window: z.enum(["today", "7d", "30d"]).default("today"),
        scope: z.enum(["all", "mine"]).default("all"),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = Date.now();
    const windowDays = WINDOWS[data.window as WindowKey];
    const windowStart = new Date(now - windowDays * 86_400_000).toISOString();
    const prevWindowStart = new Date(now - windowDays * 2 * 86_400_000).toISOString();
    const day = 86_400_000;

    // Force non-admins to their own scope
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const scope: "all" | "mine" = data.scope === "mine" || !isAdmin ? "mine" : "all";
    const meFilter = scope === "mine" ? context.userId : null;

    const [
      leadsWindow,
      leadsPrev,
      leadsWon,
      leadsWonPrev,
      casesActive,
      casesStalled,
      invoicesOpen,
      leadsForContact,
      allLeadsForSpark,
      allCasesForSpark,
      unassignedLeads,
      staleContactedLeads,
      stalledCasesList,
      expiringInvites,
      openBugs,
      pendingQuotes,
      recentLeadUpdates,
      recentCaseUpdates,
      recentInvoiceUpdates,
      recentBugUpdates,
      profilesLookup,
    ] = await Promise.all([
      // KPI: leads this window
      supabaseAdmin
        .from("insurance_leads")
        .select("id, created_at, status, assigned_to, updated_at")
        .gte("created_at", windowStart),
      supabaseAdmin
        .from("insurance_leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", prevWindowStart)
        .lt("created_at", windowStart),
      supabaseAdmin
        .from("insurance_leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "won")
        .gte("updated_at", windowStart),
      supabaseAdmin
        .from("insurance_leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "won")
        .gte("updated_at", prevWindowStart)
        .lt("updated_at", windowStart),
      supabaseAdmin
        .from("cases")
        .select("id, updated_at, case_manager_user_id, status", { count: "exact" }),
      supabaseAdmin
        .from("cases")
        .select("id", { count: "exact", head: true })
        .lt("updated_at", new Date(now - 2 * day).toISOString())
        .not("status", "in", "(closed,cancelled)"),
      supabaseAdmin
        .from("case_invoices")
        .select("amount_cents, status")
        .in("status", ["pending", "held_escrow"]),
      // First-contact latency: contacted leads in the window
      supabaseAdmin
        .from("insurance_leads")
        .select("created_at, updated_at, status")
        .neq("status", "new")
        .gte("created_at", windowStart)
        .limit(500),
      // Sparkline data — last 14 days of leads
      supabaseAdmin
        .from("insurance_leads")
        .select("created_at")
        .gte("created_at", new Date(now - 14 * day).toISOString())
        .limit(2000),
      supabaseAdmin
        .from("cases")
        .select("created_at")
        .gte("created_at", new Date(now - 14 * day).toISOString())
        .limit(2000),
      // Queue: unassigned leads
      supabaseAdmin
        .from("insurance_leads")
        .select("id, full_name, email, benefit_amount, status, created_at, assigned_to")
        .is("assigned_to", null)
        .in("status", ["new", "contacted"])
        .order("created_at", { ascending: true })
        .limit(20),
      // Queue: contacted leads with no update > 24h
      supabaseAdmin
        .from("insurance_leads")
        .select("id, full_name, email, status, updated_at, assigned_to")
        .eq("status", "contacted")
        .lt("updated_at", new Date(now - day).toISOString())
        .order("updated_at", { ascending: true })
        .limit(20),
      // Queue: stalled cases > 48h
      supabaseAdmin
        .from("cases")
        .select("id, status, updated_at, case_manager_user_id")
        .lt("updated_at", new Date(now - 2 * day).toISOString())
        .not("status", "in", "(closed,cancelled)")
        .order("updated_at", { ascending: true })
        .limit(20),
      // Queue: invites expiring within 3 days
      supabaseAdmin
        .from("role_invitations")
        .select("id, email, role, expires_at, invited_by")
        .is("accepted_at", null)
        .lt("expires_at", new Date(now + 3 * day).toISOString())
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true })
        .limit(20),
      // Queue: open P1 bugs
      supabaseAdmin
        .from("bug_reports")
        .select("id, title, severity, status, created_at, assigned_to")
        .in("status", ["open", "in_progress"])
        .in("severity", ["high", "critical"])
        .order("created_at", { ascending: true })
        .limit(20),
      // Queue: pending quotes > 7d (sent but not yet accepted/declined)
      supabaseAdmin
        .from("case_quotes")
        .select("id, case_id, amount_cents, status, created_at, last_nudged_at")
        .eq("status", "sent")
        .lt("created_at", new Date(now - 7 * day).toISOString())
        .order("created_at", { ascending: true })
        .limit(20),
      // Activity feed sources
      supabaseAdmin
        .from("insurance_leads")
        .select("id, full_name, status, updated_at, assigned_to")
        .order("updated_at", { ascending: false })
        .limit(15),
      supabaseAdmin
        .from("cases")
        .select("id, status, updated_at, case_manager_user_id")
        .order("updated_at", { ascending: false })
        .limit(15),
      supabaseAdmin
        .from("case_invoices")
        .select("id, status, updated_at, amount_cents, case_id")
        .order("updated_at", { ascending: false })
        .limit(15),
      supabaseAdmin
        .from("bug_reports")
        .select("id, title, status, updated_at, assigned_to")
        .order("updated_at", { ascending: false })
        .limit(15),
      // Profile lookup for actor names
      supabaseAdmin.from("profiles").select("id, full_name").limit(500),
    ]);

    const profileNames = new Map<string, string>();
    (profilesLookup.data ?? []).forEach((p: any) => {
      profileNames.set(p.id, p.full_name ?? "Someone");
    });
    const nameOf = (id: string | null | undefined) =>
      id ? profileNames.get(id) ?? "Staff" : null;

    // ----- KPIs -----
    const leadsCount = (leadsWindow.data ?? []).length;
    const leadsPrevCount = leadsPrev.count ?? 0;
    const leadsDeltaPct = pctDelta(leadsCount, leadsPrevCount);
    const wonCount = leadsWon.count ?? 0;
    const wonPrevCount = leadsWonPrev.count ?? 0;
    const wonDeltaPct = pctDelta(wonCount, wonPrevCount);

    const activeCases = (casesActive.data ?? []).filter(
      (c: any) => c.status !== "closed" && c.status !== "cancelled",
    );
    const stalledCount = casesStalled.count ?? 0;

    const outstandingCents = (invoicesOpen.data ?? []).reduce(
      (s: number, i: any) => s + (i.amount_cents ?? 0),
      0,
    );

    // avg time-to-first-contact (hours) among contacted-window leads
    const contactLatencies = (leadsForContact.data ?? [])
      .map((l: any) => (new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()) / 3_600_000)
      .filter((h: number) => h >= 0 && h < 24 * 30);
    const avgFirstContactHours =
      contactLatencies.length > 0
        ? contactLatencies.reduce((s: number, h: number) => s + h, 0) / contactLatencies.length
        : null;

    const kpis = {
      leads: {
        value: leadsCount,
        deltaPct: leadsDeltaPct,
        sparkline: bucketPerDay(allLeadsForSpark.data ?? [], 14, "created_at"),
      },
      won: {
        value: wonCount,
        deltaPct: wonDeltaPct,
        sparkline: [] as number[],
      },
      active_cases: {
        value: activeCases.length,
        deltaPct: null as number | null,
        sparkline: bucketPerDay(allCasesForSpark.data ?? [], 14, "created_at"),
      },
      stalled_cases: {
        value: stalledCount,
        deltaPct: null as number | null,
        sparkline: [] as number[],
      },
      outstanding_amount_cents: {
        value: outstandingCents,
        deltaPct: null as number | null,
        sparkline: [] as number[],
      },
      avg_first_contact_hours: {
        value: avgFirstContactHours,
        deltaPct: null as number | null,
        sparkline: [] as number[],
      },
    };

    // ----- Queue -----
    const queue: QueueItem[] = [];

    (unassignedLeads.data ?? []).forEach((l: any) => {
      queue.push({
        kind: "lead",
        id: l.id,
        title: l.full_name || l.email,
        subtitle: `€${Number(l.benefit_amount ?? 0).toLocaleString("de-DE")} · unassigned`,
        severity: ageDays(l.created_at) > 1 ? "critical" : "high",
        ageSeconds: ageSeconds(l.created_at),
        ownerName: null,
        actionHref: "/portal/leads",
        actionLabel: "Assign",
      });
    });

    (staleContactedLeads.data ?? []).forEach((l: any) => {
      if (meFilter && l.assigned_to && l.assigned_to !== meFilter) return;
      queue.push({
        kind: "lead",
        id: l.id,
        title: l.full_name || l.email,
        subtitle: "Contacted, no update for 24h+",
        severity: "high",
        ageSeconds: ageSeconds(l.updated_at),
        ownerName: nameOf(l.assigned_to),
        actionHref: "/portal/leads",
        actionLabel: "Follow up",
      });
    });

    (stalledCasesList.data ?? []).forEach((c: any) => {
      if (meFilter && c.case_manager_user_id && c.case_manager_user_id !== meFilter) return;
      queue.push({
        kind: "case",
        id: c.id,
        title: `Case ${c.id.slice(0, 8)}`,
        subtitle: `Stage: ${c.status ?? "—"} · stalled ${Math.floor(ageDays(c.updated_at))}d`,
        severity: ageDays(c.updated_at) > 5 ? "critical" : "high",
        ageSeconds: ageSeconds(c.updated_at),
        ownerName: nameOf(c.case_manager_user_id),
        actionHref: `/app/cases/${c.id}`,
        actionLabel: "Open",
      });
    });

    (expiringInvites.data ?? []).forEach((inv: any) => {
      const daysLeft = Math.max(0, (new Date(inv.expires_at).getTime() - now) / day);
      queue.push({
        kind: "invite",
        id: inv.id,
        title: inv.email,
        subtitle: `Role ${inv.role} · expires in ${Math.round(daysLeft)}d`,
        severity: daysLeft < 1 ? "critical" : "normal",
        ageSeconds: Math.abs(now - new Date(inv.expires_at).getTime()) / 1000,
        ownerName: nameOf(inv.invited_by),
        actionHref: "/portal/admin/invite",
        actionLabel: "Resend",
      });
    });

    (openBugs.data ?? []).forEach((b: any) => {
      if (meFilter && b.assigned_to && b.assigned_to !== meFilter) return;
      queue.push({
        kind: "bug",
        id: b.id,
        title: b.title,
        subtitle: `${b.severity} · ${b.status}`,
        severity: b.severity === "critical" ? "critical" : "high",
        ageSeconds: ageSeconds(b.created_at),
        ownerName: nameOf(b.assigned_to),
        actionHref: "/app/bugs",
        actionLabel: "Triage",
      });
    });

    (pendingQuotes.data ?? []).forEach((q: any) => {
      queue.push({
        kind: "quote",
        id: q.id,
        title: `Quote €${((q.amount_cents ?? 0) / 100).toLocaleString("de-DE")}`,
        subtitle: `Awaiting client · ${Math.floor(ageDays(q.created_at))}d`,
        severity: ageDays(q.created_at) > 14 ? "critical" : "normal",
        ageSeconds: ageSeconds(q.created_at),
        ownerName: null,
        actionHref: `/app/cases/${q.case_id}`,
        actionLabel: "Nudge",
      });
    });

    queue.sort((a, b) => {
      const sev = { critical: 0, high: 1, normal: 2 } as const;
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return b.ageSeconds - a.ageSeconds;
    });

    // ----- My work -----
    const myWork: QueueItem[] = queue.filter(
      (q) =>
        q.ownerName ===
        (profileNames.get(context.userId) ?? "___never___"),
    );

    // ----- Activity -----
    const activity: ActivityEntry[] = [];
    (recentLeadUpdates.data ?? []).forEach((l: any) => {
      activity.push({
        kind: "lead",
        id: l.id,
        actor: nameOf(l.assigned_to) ?? "System",
        verb: `set lead to`,
        target: `${l.status} — ${l.full_name}`,
        at: l.updated_at,
        href: "/portal/leads",
      });
    });
    (recentCaseUpdates.data ?? []).forEach((c: any) => {
      activity.push({
        kind: "case",
        id: c.id,
        actor: nameOf(c.case_manager_user_id) ?? "System",
        verb: `moved case to`,
        target: `${c.status} — ${c.id.slice(0, 8)}`,
        at: c.updated_at,
        href: `/app/cases/${c.id}`,
      });
    });
    (recentInvoiceUpdates.data ?? []).forEach((iv: any) => {
      activity.push({
        kind: "invoice",
        id: iv.id,
        actor: "Billing",
        verb: `set invoice to`,
        target: `${iv.status} · €${((iv.amount_cents ?? 0) / 100).toLocaleString("de-DE")}`,
        at: iv.updated_at,
        href: `/app/cases/${iv.case_id}`,
      });
    });
    (recentBugUpdates.data ?? []).forEach((b: any) => {
      activity.push({
        kind: "bug",
        id: b.id,
        actor: nameOf(b.assigned_to) ?? "System",
        verb: `updated bug`,
        target: b.title,
        at: b.updated_at,
        href: "/app/bugs",
      });
    });
    activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return {
      window: data.window,
      scope,
      is_admin: !!isAdmin,
      kpis,
      queue: queue.slice(0, 25),
      my_work: myWork.slice(0, 10),
      activity: activity.slice(0, 12),
    };
  });

function pctDelta(current: number, prev: number): number | null {
  if (prev === 0) return current === 0 ? 0 : 100;
  return ((current - prev) / prev) * 100;
}

function ageSeconds(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}
function ageDays(iso: string) {
  return ageSeconds(iso) / 86_400;
}

function bucketPerDay(rows: any[], days: number, field: string): number[] {
  const buckets = new Array(days).fill(0);
  const now = Date.now();
  rows.forEach((r) => {
    const t = new Date(r[field]).getTime();
    const idx = days - 1 - Math.floor((now - t) / 86_400_000);
    if (idx >= 0 && idx < days) buckets[idx] += 1;
  });
  return buckets;
}

// ---------- Existing endpoints kept for /portal/leads ----------

export const listInsuranceLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const { data, error } = await context.supabase
      .from("insurance_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "quoted", "won", "lost", "spam"]),
      notes: z.string().max(2000).optional().nullable(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const patch: { status: string; notes?: string | null } = { status: data.status };
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await context.supabase
      .from("insurance_leads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Kept as a backward-compatible thin wrapper so any lingering imports don't break.
export const getPortalOverview = getOpsConsole;

// Suppress unused-import lint for the admin helper — retained for future
// admin-only endpoints in later portal-rebuild steps.
void assertAdmin;

// ---------- Financials / P&L ----------

export const getFinancials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ months: z.number().int().min(1).max(24).default(6) }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const supa = context.supabase;
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (data.months - 1), 1));
    const startIso = start.toISOString();

    const [invoicesRes, payoutsRes, commissionsRes, subsRes, plansRes] = await Promise.all([
      supa.from("case_invoices")
        .select("amount_eur, vat_eur, platform_fee_eur, payout_to_expert_eur, status, paid_at, released_at, created_at, expert_id")
        .gte("created_at", startIso),
      supa.from("expert_payouts")
        .select("amount_eur, status, period_month, paid_at, created_at, expert_id, kind"),
      supa.from("agent_commissions")
        .select("commission_eur, gross_eur, status, period_month, paid_at, agent_user_id"),
      supa.from("subscriptions")
        .select("plan_code, status, created_at, canceled_at"),
      supa.from("subscription_plans").select("code, monthly_price_eur, name"),
    ]);

    if (invoicesRes.error) throw new Error(invoicesRes.error.message);
    if (payoutsRes.error) throw new Error(payoutsRes.error.message);
    if (commissionsRes.error) throw new Error(commissionsRes.error.message);

    const invoices = invoicesRes.data ?? [];
    const payouts = payoutsRes.data ?? [];
    const commissions = commissionsRes.data ?? [];
    const subs = subsRes.data ?? [];
    const plans = plansRes.data ?? [];
    const planPrice: Record<string, number> = {};
    plans.forEach((p: any) => { planPrice[p.code] = Number(p.monthly_price_eur ?? 0); });

    // Build month buckets
    const buckets: { key: string; label: string; start: Date; end: Date }[] = [];
    for (let i = 0; i < data.months; i++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      buckets.push({
        key,
        label: d.toLocaleString("en", { month: "short", year: "2-digit", timeZone: "UTC" }),
        start: d,
        end: next,
      });
    }

    // MRR: sum of active subs at start of each month
    const activeSubs = subs.filter((s: any) => s.status === "active" || s.status === "trialing" || s.status === "past_due");

    const rows = buckets.map((b) => {
      const inRange = (iso: string | null | undefined) => {
        if (!iso) return false;
        const t = new Date(iso).getTime();
        return t >= b.start.getTime() && t < b.end.getTime();
      };
      const inPeriod = (period: string | null | undefined) => period && period.startsWith(b.key);

      const paidInvoices = invoices.filter((i: any) => inRange(i.paid_at));
      const invoiceRevenue = paidInvoices.reduce((s: number, i: any) => s + Number(i.amount_eur ?? 0), 0);
      const platformFees = paidInvoices.reduce((s: number, i: any) => s + Number(i.platform_fee_eur ?? 0), 0);
      const expertPayoutsForInvoices = paidInvoices.reduce((s: number, i: any) => s + Number(i.payout_to_expert_eur ?? 0), 0);

      // Subscription MRR: subs created before period end AND not canceled before period start
      const subMrr = activeSubs
        .filter((s: any) => new Date(s.created_at).getTime() < b.end.getTime())
        .filter((s: any) => !s.canceled_at || new Date(s.canceled_at).getTime() >= b.start.getTime())
        .reduce((sum: number, s: any) => sum + (planPrice[s.plan_code] ?? 0), 0);

      const payoutExpense = payouts
        .filter((p: any) => inPeriod(p.period_month) || inRange(p.paid_at))
        .reduce((s: number, p: any) => s + Number(p.amount_eur ?? 0), 0);

      const commissionExpense = commissions
        .filter((c: any) => inPeriod(c.period_month))
        .reduce((s: number, c: any) => s + Number(c.commission_eur ?? 0), 0);

      const revenue = invoiceRevenue + subMrr;
      const cogs = expertPayoutsForInvoices + commissionExpense;
      const gross = revenue - cogs;

      return {
        key: b.key,
        label: b.label,
        subscriptionRevenue: round2(subMrr),
        invoiceRevenue: round2(invoiceRevenue),
        revenue: round2(revenue),
        platformFees: round2(platformFees),
        expertPayouts: round2(payoutExpense || expertPayoutsForInvoices),
        agentCommissions: round2(commissionExpense),
        cogs: round2(cogs),
        grossProfit: round2(gross),
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        revenue: acc.revenue + r.revenue,
        subscriptionRevenue: acc.subscriptionRevenue + r.subscriptionRevenue,
        invoiceRevenue: acc.invoiceRevenue + r.invoiceRevenue,
        expertPayouts: acc.expertPayouts + r.expertPayouts,
        agentCommissions: acc.agentCommissions + r.agentCommissions,
        platformFees: acc.platformFees + r.platformFees,
        grossProfit: acc.grossProfit + r.grossProfit,
      }),
      { revenue: 0, subscriptionRevenue: 0, invoiceRevenue: 0, expertPayouts: 0, agentCommissions: 0, platformFees: 0, grossProfit: 0 },
    );

    // Outstanding expenses
    const pendingPayouts = payouts
      .filter((p: any) => p.status === "pending" || p.status === "approved")
      .reduce((s: number, p: any) => s + Number(p.amount_eur ?? 0), 0);
    const pendingCommissions = commissions
      .filter((c: any) => c.status !== "paid")
      .reduce((s: number, c: any) => s + Number(c.commission_eur ?? 0), 0);
    const heldEscrow = invoices
      .filter((i: any) => i.status === "held_escrow")
      .reduce((s: number, i: any) => s + Number(i.payout_to_expert_eur ?? 0), 0);

    return {
      months: rows,
      totals: {
        revenue: round2(totals.revenue),
        subscriptionRevenue: round2(totals.subscriptionRevenue),
        invoiceRevenue: round2(totals.invoiceRevenue),
        expertPayouts: round2(totals.expertPayouts),
        agentCommissions: round2(totals.agentCommissions),
        platformFees: round2(totals.platformFees),
        grossProfit: round2(totals.grossProfit),
      },
      outstanding: {
        pendingExpertPayouts: round2(pendingPayouts),
        pendingAgentCommissions: round2(pendingCommissions),
        heldInEscrow: round2(heldEscrow),
      },
      activeSubscriptions: activeSubs.length,
    };
  });

export const listRecentExpenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const supa = context.supabase;
    const [payouts, comms] = await Promise.all([
      supa.from("expert_payouts")
        .select("id, amount_eur, status, kind, description, period_month, paid_at, created_at, experts(full_name, profession)")
        .order("created_at", { ascending: false })
        .limit(50),
      supa.from("agent_commissions")
        .select("id, commission_eur, gross_eur, status, product, period_month, paid_at, created_at, agent_user_id")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    return {
      payouts: payouts.data ?? [],
      commissions: comms.data ?? [],
    };
  });

function round2(n: number) { return Math.round(n * 100) / 100; }

// ---------- Domain consoles (tax / benefits / medical / new-arrivals) ----------

export const getTaxConsole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const supa = context.supabase;
    const { data: leads } = await supa
      .from("tax_leads")
      .select("id, full_name, email, tax_year, gross_income_eur, estimated_refund_eur, status, source, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const rows = leads ?? [];
    const byStatus: Record<string, number> = {};
    rows.forEach((r: any) => { byStatus[r.status ?? "new"] = (byStatus[r.status ?? "new"] ?? 0) + 1; });
    const totalRefund = rows.reduce((s: number, r: any) => s + Number(r.estimated_refund_eur ?? 0), 0);
    const won = rows.filter((r: any) => r.status === "filed" || r.status === "won").length;
    return {
      total: rows.length,
      byStatus,
      estRefundTotal: Math.round(totalRefund),
      won,
      conversion: rows.length ? Math.round((won / rows.length) * 100) : 0,
      leads: rows.slice(0, 50),
    };
  });

export const getBenefitsConsole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const supa = context.supabase;
    const [refRes, funRes] = await Promise.all([
      supa.from("referral_leads")
        .select("id, referred_email, product, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supa.from("funeral_leads")
        .select("id, full_name, email, status, created_at, plan_type")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const referrals = refRes.data ?? [];
    const funeral = funRes.data ?? [];
    return {
      referralTotal: referrals.length,
      funeralTotal: funeral.length,
      openReferrals: referrals.filter((r: any) => r.status === "pending" || r.status === "new").length,
      openFuneral: funeral.filter((r: any) => r.status !== "closed" && r.status !== "converted").length,
      recentReferrals: referrals.slice(0, 25),
      recentFuneral: funeral.slice(0, 25),
    };
  });

export const getMedicalConsole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const supa = context.supabase;
    const [expertsRes, casesRes] = await Promise.all([
      supa.from("experts")
        .select("id, full_name, profession, city, status, verified")
        .in("profession", ["doctor", "translator", "medical_translator", "nurse", "therapist"])
        .limit(100),
      supa.from("cases")
        .select("id, title, status, priority, updated_at, client_user_id")
        .ilike("title", "%medical%")
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);
    const experts = expertsRes.data ?? [];
    const cases = casesRes.data ?? [];
    return {
      totalExperts: experts.length,
      verifiedExperts: experts.filter((e: any) => e.verified).length,
      activeCases: cases.filter((c: any) => c.status !== "closed" && c.status !== "cancelled").length,
      experts: experts.slice(0, 20),
      cases,
    };
  });

export const getNewArrivalsConsole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const supa = context.supabase;
    // Reuse immigration leads / cases proxy
    const [casesRes, embRes] = await Promise.all([
      supa.from("cases")
        .select("id, title, status, priority, updated_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supa.from("embassies")
        .select("id, country, city, phone, updated_at")
        .order("updated_at", { ascending: false })
        .limit(20),
    ]);
    const cases = casesRes.data ?? [];
    const embassies = embRes.data ?? [];
    return {
      totalCases: cases.length,
      newThisMonth: cases.filter((c: any) => {
        const d = new Date(c.created_at);
        const now = new Date();
        return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
      }).length,
      openCases: cases.filter((c: any) => c.status !== "closed").length,
      cases: cases.slice(0, 30),
      embassies,
    };
  });

export const getInsuranceConsole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const supa = context.supabase;
    const [leadsRes, callbacksRes, healthRes, funeralRes] = await Promise.all([
      supa.from("insurance_leads")
        .select("id, full_name, email, product, insurer, monthly_eur, status, source, created_at, assigned_to_user_id")
        .order("created_at", { ascending: false })
        .limit(200),
      // insurance-related callbacks live inside insurance_leads via status='callback'
      supa.from("insurance_leads")
        .select("id, full_name, email, product, status, created_at")
        .eq("status", "callback")
        .order("created_at", { ascending: false })
        .limit(50),
      supa.from("health_insurance")
        .select("id, user_id, insurer, plan_type, monthly_eur, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50),
      supa.from("funeral_policies")
        .select("id, user_id, insurer, sum_insured_eur, monthly_eur, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);
    const leads = leadsRes.data ?? [];
    const callbacks = callbacksRes.data ?? [];
    const health = healthRes.data ?? [];
    const funeral = funeralRes.data ?? [];

    const byStatus: Record<string, number> = {};
    leads.forEach((l: any) => {
      const s = l.status ?? "new";
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    });
    const byProduct: Record<string, number> = {};
    leads.forEach((l: any) => {
      const p = l.product ?? "unknown";
      byProduct[p] = (byProduct[p] ?? 0) + 1;
    });
    const monthlyPipeline = leads.reduce(
      (s: number, l: any) => s + Number(l.monthly_eur ?? 0),
      0,
    );
    const converted = leads.filter(
      (l: any) => l.status === "converted" || l.status === "policy_active",
    ).length;

    return {
      leadTotal: leads.length,
      openLeads: leads.filter(
        (l: any) => l.status !== "closed" && l.status !== "converted" && l.status !== "declined",
      ).length,
      callbackCount: callbacks.length,
      converted,
      conversion: leads.length ? Math.round((converted / leads.length) * 100) : 0,
      monthlyPipeline: Math.round(monthlyPipeline),
      byStatus,
      byProduct,
      leads: leads.slice(0, 50),
      callbacks: callbacks.slice(0, 20),
      activePolicies: {
        health: health.length,
        funeral: funeral.length,
      },
      recentHealth: health.slice(0, 15),
      recentFuneral: funeral.slice(0, 15),
    };
  });
