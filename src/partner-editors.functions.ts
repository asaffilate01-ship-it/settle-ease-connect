import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const CASE_TYPES = [
  "bereavement",
  "visa_application",
  "visa_extension",
  "nationality",
  "family_reunification",
  "benefits_claim",
  "housing",
  "tax",
  "education",
  "healthcare",
  "translation",
  "driving",
  "business",
  "other",
] as const;
const CASE_STATUSES = [
  "new",
  "triage",
  "in_progress",
  "awaiting_client",
  "awaiting_expert",
  "on_hold",
  "completed",
  "closed",
  "cancelled",
] as const;

type PlanGroup = "none" | "basic" | "plus" | "complete";
const PLAN_RANK: Record<PlanGroup, number> = { none: 0, basic: 1, plus: 2, complete: 3 };

async function getActivePlanGroup(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<PlanGroup> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_code, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub?.plan_code) return "none";
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("plan_group")
    .eq("code", sub.plan_code)
    .maybeSingle();
  const g = (plan?.plan_group as PlanGroup | undefined) ?? "basic";
  return g;
}

async function requirePlan(
  supabase: SupabaseClient<Database>,
  userId: string,
  required: PlanGroup,
) {
  const current = await getActivePlanGroup(supabase, userId);
  if (PLAN_RANK[current] < PLAN_RANK[required]) {
    throw new Error(`This feature requires the ${required} plan. Please upgrade to continue.`);
  }
}

export const listCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cases")
      .select(
        "id, reference, title, case_type, status, urgent, city, bundesland, language, client_user_id, case_manager_user_id, opened_at, updated_at",
      )
      .order("urgent", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const client = context.supabase as any;
    const [
      caseRow,
      tasks,
      messages,
      events,
      participants,
      documents,
      quotes,
      invoices,
      profiles,
      milestones,
      canManage,
    ] = await Promise.all([
      context.supabase.from("cases").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("case_tasks")
        .select("*")
        .eq("case_id", data.id)
        .order("done")
        .order("due_at", { nullsFirst: false }),
      context.supabase.from("case_messages").select("*").eq("case_id", data.id).order("created_at"),
      context.supabase
        .from("case_events")
        .select("*")
        .eq("case_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50),
      context.supabase.from("case_participants").select("*").eq("case_id", data.id),
      context.supabase
        .from("case_documents")
        .select("*")
        .eq("case_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("case_quotes")
        .select("*")
        .eq("case_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("case_invoices")
        .select("*")
        .eq("case_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase.from("profiles").select("id, full_name, avatar_url").limit(500),
      client.from("case_milestones").select("*").eq("case_id", data.id).order("position"),
      client.rpc("can_manage_case", { _user_id: context.userId, _case_id: data.id }),
    ]);
    if (caseRow.error) throw new Error(caseRow.error.message);
    if (!caseRow.data) throw new Error("Case not found");
    return {
      case: caseRow.data,
      tasks: tasks.data ?? [],
      messages: messages.data ?? [],
      events: events.data ?? [],
      participants: participants.data ?? [],
      documents: documents.data ?? [],
      quotes: quotes.data ?? [],
      invoices: invoices.data ?? [],
      profiles: profiles.data ?? [],
      milestones: milestones.data ?? [],
      canManage: Boolean(canManage.data),
    };
  });

export const createCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        title: z.string().min(3).max(200),
        case_type: z.enum(CASE_TYPES),
        summary: z.string().max(4000).optional().nullable(),
        urgent: z.boolean().default(false),
        language: z.string().min(2).max(5).default("en"),
        city: z.string().max(120).optional().nullable(),
        bundesland: z.string().max(120).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Enforce paid-tier gating server-side. Client-side Paywall is UX only.
    const { data: isInternal } = await context.supabase.rpc("is_internal", {
      _user_id: context.userId,
    });
    if (!isInternal) {
      await requirePlan(context.supabase, context.userId, "complete");
    }
    const { data: row, error } = await context.supabase
      .from("cases")
      .insert({ ...data, client_user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("case_events").insert({
      case_id: row.id,
      event_type: "case.created",
      payload: {},
      actor_user_id: context.userId,
    });
    return row;
  });

export const updateCaseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(CASE_STATUSES) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { status: typeof data.status; closed_at?: string } = { status: data.status };
    if (data.status === "closed" || data.status === "completed")
      patch.closed_at = new Date().toISOString();
    const { error } = await context.supabase.from("cases").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("case_events").insert({
      case_id: data.id,
      event_type: "case.status",
      payload: { to: data.status },
      actor_user_id: context.userId,
    });
    return { ok: true };
  });

export const sendCaseMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        case_id: z.string().uuid(),
        body: z.string().min(1).max(4000),
        internal_note: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Non-internal callers must hold an active Complete-tier subscription.
    const { data: isInternal } = await context.supabase.rpc("is_internal", {
      _user_id: context.userId,
    });
    if (!isInternal) {
      await requirePlan(context.supabase, context.userId, "complete");
    }
    const { data: row, error } = await context.supabase
      .from("case_messages")
      .insert({ ...data, sender_user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Fan out notifications to other case members (best-effort, via admin to bypass RLS INSERT gate)
    try {
      const [{ data: c }, { data: parts }] = await Promise.all([
        context.supabase
          .from("cases")
          .select("client_user_id, case_manager_user_id, title, reference")
          .eq("id", data.case_id)
          .maybeSingle(),
        context.supabase.from("case_participants").select("user_id").eq("case_id", data.case_id),
      ]);
      const recipients = new Set<string>();
      if (c?.case_manager_user_id) recipients.add(c.case_manager_user_id);
      if (!data.internal_note && c?.client_user_id) recipients.add(c.client_user_id);
      (parts ?? []).forEach((p: any) => {
        if (p.user_id) recipients.add(p.user_id);
      });
      recipients.delete(context.userId);
      if (recipients.size) {
        const preview = data.body.slice(0, 120);
        const label = c?.reference ? `Case ${c.reference}` : (c?.title ?? "Case");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: notifErr } = await supabaseAdmin.from("notifications").insert(
          Array.from(recipients).map((uid) => ({
            user_id: uid,
            kind: data.internal_note ? "case_internal" : "case_message",
            title: `${label}: new message`,
            body: preview,
            link: `/app/cases/${data.case_id}`,
            entity_type: "case",
            entity_id: data.case_id,
          })),
        );
        if (notifErr) console.error("case notification fan-out failed:", notifErr.message);
      }
    } catch (e) {
      console.error("case notification fan-out threw:", e);
    }
    return row;
  });

export const createCaseTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        case_id: z.string().uuid(),
        title: z.string().min(1).max(240),
        description: z.string().max(2000).optional().nullable(),
        assignee_user_id: z.string().uuid().optional().nullable(),
        due_at: z.string().datetime().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("case_tasks")
      .insert({ ...data, created_by: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleCaseTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid(), done: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("case_tasks")
      .update({ done: data.done, done_at: data.done ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    void context;
    return { ok: true };
  });

export const createCaseMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        caseId: z.string().uuid(),
        title: z.string().trim().min(1).max(240),
        description: z.string().trim().max(2000).optional().nullable(),
        targetAt: z.string().datetime().optional().nullable(),
        visibleToClient: z.boolean().default(true),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const client = context.supabase as any;
    const { data: last } = await client
      .from("case_milestones")
      .select("position")
      .eq("case_id", data.caseId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: row, error } = await client
      .from("case_milestones")
      .insert({
        case_id: data.caseId,
        title: data.title,
        description: data.description ?? null,
        target_at: data.targetAt ?? null,
        visible_to_client: data.visibleToClient,
        position: (last?.position ?? 0) + 10,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("case_events").insert({
      case_id: data.caseId,
      event_type: "case.milestone_created",
      payload: { milestone_id: row.id, title: row.title },
      actor_user_id: context.userId,
    });
    return row;
  });

export const updateCaseMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        caseId: z.string().uuid(),
        status: z.enum(["upcoming", "current", "completed", "blocked", "skipped"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const client = context.supabase as any;
    const patch = {
      status: data.status,
      completed_at: data.status === "completed" ? new Date().toISOString() : null,
      completed_by: data.status === "completed" ? context.userId : null,
    };
    const { error } = await client
      .from("case_milestones")
      .update(patch)
      .eq("id", data.id)
      .eq("case_id", data.caseId);
    if (error) throw new Error(error.message);
    await context.supabase.from("case_events").insert({
      case_id: data.caseId,
      event_type: "case.milestone_status",
      payload: { milestone_id: data.id, status: data.status },
      actor_user_id: context.userId,
    });
    return { ok: true };
  });
