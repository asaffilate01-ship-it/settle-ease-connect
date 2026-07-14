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

/** Helper — resolve the caller's expert row id, or null. */
async function myExpertId(context: { supabase: any; userId: string }): Promise<string | null> {
  const { data } = await context.supabase
    .from("experts")
    .select("id")
    .eq("user_id", context.userId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** Quotes the caller has issued (draft/sent/accepted/…) across all cases. */
export const listMyExpertQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const expertId = await myExpertId(context);
    if (!expertId) return [];
    const { data, error } = await context.supabase
      .from("case_quotes")
      .select(
        "id, case_id, title, description, amount_eur, vat_pct, compensation_model, platform_fee_pct, platform_fee_eur, status, sent_at, responded_at, created_at, last_nudged_at, cases:case_id (reference, title)",
      )
      .eq("expert_id", expertId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((q: any) => ({
      ...q,
      case_reference: q.cases?.reference ?? null,
      case_title: q.cases?.title ?? null,
    }));
  });

/** Invoices raised on the caller's cases (money owed to them). */
export const listMyExpertInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const expertId = await myExpertId(context);
    if (!expertId) return [];
    const { data, error } = await context.supabase
      .from("case_invoices")
      .select(
        "id, case_id, quote_id, amount_eur, vat_eur, platform_fee_eur, payout_to_expert_eur, status, paid_at, released_at, created_at, cases:case_id (reference, title)",
      )
      .eq("expert_id", expertId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((i: any) => ({
      ...i,
      case_reference: i.cases?.reference ?? null,
      case_title: i.cases?.title ?? null,
    }));
  });

/** Full case detail scoped to the caller (must be assigned or primary expert on the case). */
export const getMyExpertCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ caseId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const expertId = await myExpertId(context);
    if (!expertId) throw new Error("No expert profile");

    const { data: caseRow, error: caseErr } = await context.supabase
      .from("cases")
      .select("id, reference, title, case_type, status, summary, urgent, language, city, bundesland, opened_at, updated_at, primary_expert_id")
      .eq("id", data.caseId)
      .maybeSingle();
    if (caseErr) throw new Error(caseErr.message);
    if (!caseRow) throw new Error("Case not found");

    // Access check: must be primary or in case_assignments
    const isPrimary = (caseRow as any).primary_expert_id === expertId;
    let isAssignee = false;
    if (!isPrimary) {
      const { data: asg } = await context.supabase
        .from("case_assignments")
        .select("id, role, status")
        .eq("case_id", data.caseId)
        .eq("assignee_expert_id", expertId)
        .limit(1);
      isAssignee = (asg ?? []).length > 0;
    }
    if (!isPrimary && !isAssignee) throw new Error("Access denied");

    const [tasksRes, docsRes, quotesRes, invoicesRes, msgsRes, eventsRes] = await Promise.all([
      context.supabase
        .from("case_tasks")
        .select("id, title, status, priority, due_date, assignee_user_id, created_at")
        .eq("case_id", data.caseId)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("case_documents")
        .select("id, file_name, mime_type, size_bytes, visible_to_expert, created_at")
        .eq("case_id", data.caseId)
        .eq("visible_to_expert", true)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase
        .from("case_quotes")
        .select("id, title, amount_eur, status, sent_at, created_at")
        .eq("case_id", data.caseId)
        .eq("expert_id", expertId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("case_invoices")
        .select("id, amount_eur, payout_to_expert_eur, status, paid_at, released_at, created_at")
        .eq("case_id", data.caseId)
        .eq("expert_id", expertId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("case_messages")
        .select("id, sender_user_id, body, internal_note, created_at")
        .eq("case_id", data.caseId)
        .eq("internal_note", false)
        .order("created_at", { ascending: false })
        .limit(30),
      context.supabase
        .from("case_events")
        .select("id, event_type, actor_user_id, payload, created_at")
        .eq("case_id", data.caseId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return {
      case: caseRow,
      role: isPrimary ? "primary_expert" : "assignee",
      tasks: tasksRes.data ?? [],
      documents: docsRes.data ?? [],
      quotes: quotesRes.data ?? [],
      invoices: invoicesRes.data ?? [],
      messages: msgsRes.data ?? [],
      events: eventsRes.data ?? [],
    };
  });

/** Profession-keyed home widget data. Keys off `experts.profession`. */
export const getMyProfessionActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: me } = await context.supabase
      .from("experts")
      .select("id, profession, compensation_model")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!me) return { profession: null, bucket: "generic" as const, items: [] as any[] };
    const expertId = (me as any).id;
    const profession = String((me as any).profession ?? "").toLowerCase();

    const REGULATED = ["lawyer", "accountant", "notary", "doctor"];
    const WHOLESALE = ["translator", "funeral_director", "social_worker"];
    const COMMUNITY = ["mosque", "church", "temple", "hospital"];

    const bucket = REGULATED.includes(profession)
      ? ("regulated" as const)
      : WHOLESALE.includes(profession)
        ? ("wholesale" as const)
        : COMMUNITY.includes(profession)
          ? ("community" as const)
          : ("generic" as const);

    if (bucket === "regulated") {
      // Referral-fee log: recent quotes with compensation_model 'referral_fee'
      const { data } = await context.supabase
        .from("case_quotes")
        .select("id, case_id, title, amount_eur, platform_fee_eur, status, created_at, cases:case_id (reference, title)")
        .eq("expert_id", expertId)
        .eq("compensation_model", "referral_fee")
        .order("created_at", { ascending: false })
        .limit(10);
      return { profession, bucket, items: data ?? [] };
    }
    if (bucket === "wholesale") {
      // Wholesale jobs: quotes with compensation_model 'wholesale' and open assignments
      const { data } = await context.supabase
        .from("case_quotes")
        .select("id, case_id, title, amount_eur, status, created_at, cases:case_id (reference, title)")
        .eq("expert_id", expertId)
        .in("compensation_model", ["wholesale", "direct_bill"])
        .order("created_at", { ascending: false })
        .limit(10);
      return { profession, bucket, items: data ?? [] };
    }
    if (bucket === "community") {
      // Community requests: active assignments where this expert (mosque/church/etc) is added
      const { data } = await context.supabase
        .from("case_assignments")
        .select("id, case_id, role, status, assigned_at, notes, cases:case_id (reference, title, case_type)")
        .eq("assignee_expert_id", expertId)
        .in("status", ["pending", "accepted"])
        .order("assigned_at", { ascending: false })
        .limit(10);
      return { profession, bucket, items: data ?? [] };
    }
    return { profession, bucket, items: [] as any[] };
  });

// ---------- Send a quote from the expert portal ----------
export const sendExpertQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        caseId: z.string().uuid(),
        title: z.string().min(2).max(200),
        description: z.string().max(4000).optional().nullable(),
        amountEur: z.number().min(1).max(1_000_000),
        compensationModel: z.enum(["wholesale", "direct_bill", "referral_fee"]).default("direct_bill"),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Resolve expert row
    const { data: me } = await supabase
      .from("experts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!me) throw new Error("You don't have an expert profile.");

    const { data: inserted, error } = await supabase
      .from("case_quotes")
      .insert({
        case_id: data.caseId,
        expert_id: (me as { id: string }).id,
        created_by: userId,
        title: data.title,
        description: data.description ?? null,
        amount_eur: data.amountEur,
        compensation_model: data.compensationModel,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Log a case event (best-effort)
    await supabase.from("case_events").insert({
      case_id: data.caseId,
      event_type: "quote_sent",
      actor_user_id: userId,
      payload: { quote_id: (inserted as { id: string }).id, amount_eur: data.amountEur },
    });

    return { ok: true, id: (inserted as { id: string }).id };
  });

// ---------- Issue an invoice from the expert portal ----------
export const issueExpertInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        caseId: z.string().uuid(),
        amountEur: z.number().min(1).max(1_000_000),
        quoteId: z.string().uuid().optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase
      .from("experts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!me) throw new Error("You don't have an expert profile.");

    // 15% platform fee by default; the escrow console can adjust before release.
    const platformFee = Math.round(data.amountEur * 0.15 * 100) / 100;
    const payout = Math.round((data.amountEur - platformFee) * 100) / 100;

    const { data: inserted, error } = await supabase
      .from("case_invoices")
      .insert({
        case_id: data.caseId,
        expert_id: (me as { id: string }).id,
        quote_id: data.quoteId ?? null,
        amount_eur: data.amountEur,
        platform_fee_eur: platformFee,
        payout_to_expert_eur: payout,
        vat_eur: 0,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("case_events").insert({
      case_id: data.caseId,
      event_type: "invoice_issued",
      actor_user_id: userId,
      payload: { invoice_id: (inserted as { id: string }).id, amount_eur: data.amountEur },
    });

    return { ok: true, id: (inserted as { id: string }).id };
  });
