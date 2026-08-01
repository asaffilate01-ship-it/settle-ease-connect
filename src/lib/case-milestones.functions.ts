import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Case milestones: progress tracking visible to the client and the case team. */

const STATUSES = ["pending", "in_progress", "done", "blocked", "skipped"] as const;

export const listCaseMilestones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ caseId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("can_access_case", {
      _user_id: context.userId,
      _case_id: data.caseId,
    });
    if (!allowed) throw new Error("Not authorised for this case.");
    const { data: rows, error } = await context.supabase
      .from("case_milestones")
      .select(
        "id, case_id, code, title, description, status, position, target_at, completed_at, created_at",
      )
      .eq("case_id", data.caseId)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const saveCaseMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        caseId: z.string().uuid(),
        code: z.string().trim().min(2).max(60),
        title: z.string().trim().min(2).max(160),
        description: z.string().max(2000).nullable().optional(),
        status: z.enum(STATUSES).default("pending"),
        position: z.coerce.number().int().min(0).max(200).default(0),
        targetAt: z.string().nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("can_access_case", {
      _user_id: context.userId,
      _case_id: data.caseId,
    });
    if (!allowed) throw new Error("Not authorised for this case.");

    const row: Record<string, unknown> = {
      case_id: data.caseId,
      code: data.code,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      position: data.position,
      target_at: data.targetAt ?? null,
      completed_at: data.status === "done" ? new Date().toISOString() : null,
      completed_by: data.status === "done" ? context.userId : null,
    };

    if (data.id) {
      const { error } = await (context.supabase.from("case_milestones") as any)
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await (context.supabase.from("case_milestones") as any)
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const setMilestoneStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(STATUSES) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase.from("case_milestones") as any)
      .update({
        status: data.status,
        completed_at: data.status === "done" ? new Date().toISOString() : null,
        completed_by: data.status === "done" ? context.userId : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
