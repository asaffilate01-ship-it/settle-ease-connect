import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCaseAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ case_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("case_assignments")
      .select("*")
      .eq("case_id", data.case_id)
      .order("assigned_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(
      new Set((rows ?? []).map((r: any) => r.assignee_user_id).filter(Boolean)),
    );
    const { data: profs } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids)
      : { data: [] as any[] };
    const pmap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return (rows ?? []).map((r: any) => ({ ...r, profile: pmap.get(r.assignee_user_id) ?? null }));
  });

export const upsertAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        case_id: z.string().uuid(),
        assignee_user_id: z.string().uuid().optional(),
        assignee_expert_id: z.string().uuid().optional(),
        role: z.string().min(1),
        scope: z.string().max(500).optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const payload: any = {
      ...data,
      assigned_by: context.userId,
      assigned_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("case_assignments")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("case_assignments")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (data.assignee_user_id) {
      await context.supabase.from("notifications").insert({
        user_id: data.assignee_user_id,
        kind: "assignment",
        title: "You've been assigned to a case",
        body: `${data.role}${data.scope ? ` — ${data.scope}` : ""}`,
        link: `/app/cases/${data.case_id}`,
        entity_type: "case",
        entity_id: data.case_id,
      });
    }
    return row;
  });

export const respondAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["accepted", "declined", "completed"]),
        notes: z.string().max(2000).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const patch: any = {
      status: data.status,
      responded_at: new Date().toISOString(),
      notes: data.notes,
    };
    if (data.status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await context.supabase
      .from("case_assignments")
      .update(patch)
      .eq("id", data.id)
      .eq("assignee_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------- Gantt-ready tasks -------- */

export const listCaseTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ case_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("case_tasks")
      .select("*")
      .eq("case_id", data.case_id)
      .order("start_at", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/**
 * Cross-case capacity view for the signed-in case manager: every open case
 * they own, plus its dated tasks, plotted on a shared timeline.
 */
export const listMyCapacity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: cases, error: casesErr } = await context.supabase
      .from("cases")
      .select("id, reference, title, case_type, status, urgent, opened_at, updated_at")
      .eq("case_manager_user_id", context.userId)
      .not("status", "in", "(closed,cancelled,completed)")
      .order("urgent", { ascending: false })
      .order("opened_at", { ascending: false });
    if (casesErr) throw new Error(casesErr.message);
    const ids = (cases ?? []).map((c: any) => c.id);
    if (ids.length === 0) return { cases: [], tasks: [] };
    const { data: tasks, error: taskErr } = await context.supabase
      .from("case_tasks")
      .select("id, case_id, title, status, start_at, due_at, progress_pct, assignee_user_id")
      .in("case_id", ids)
      .order("start_at", { ascending: true, nullsFirst: false });
    if (taskErr) throw new Error(taskErr.message);
    return { cases: cases ?? [], tasks: tasks ?? [] };
  });

export const upsertCaseTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        case_id: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        assignee_user_id: z.string().uuid().optional(),
        start_at: z.string().datetime().nullable().optional(),
        due_at: z.string().datetime().nullable().optional(),
        depends_on: z.string().uuid().nullable().optional(),
        progress_pct: z.number().min(0).max(100).optional(),
        estimated_hours: z.number().min(0).max(9999).optional(),
        status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const patch: any = { ...data };
    if (patch.status === "done") {
      patch.done = true;
      patch.done_at = new Date().toISOString();
      patch.progress_pct = 100;
    }
    if (data.id) {
      const { error } = await context.supabase.from("case_tasks").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("case_tasks")
      .insert({ ...patch, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
