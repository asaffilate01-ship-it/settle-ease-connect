import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_internal", {
    _user_id: context.userId,
  });
  if (error) throw new Error(error.message);
  return !!data;
}

export const listBugReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const isInternal = await assertInternal(context);
    const query = context.supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (!isInternal) {
      query.eq("reporter_id", context.userId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!isInternal) return data ?? [];

    // For internal staff, enrich with reporter full_name from profiles.
    const reporterIds = [...new Set((data ?? []).map((r) => r.reporter_id))];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", reporterIds.length ? reporterIds : [context.userId]);
    const nameMap = new Map<string, string>();
    (profiles ?? []).forEach((p) => nameMap.set(p.id, p.full_name ?? ""));
    return (data ?? []).map((r) => ({
      ...r,
      full_name: nameMap.get(r.reporter_id) ?? "",
    }));
  });

export const createBugReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        title: z.string().min(3).max(200),
        description: z.string().max(5000).optional().nullable(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        source_route: z.string().max(500).optional().nullable(),
        user_agent: z.string().max(2000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("bug_reports").insert({
      reporter_id: context.userId,
      title: data.title,
      description: data.description ?? null,
      severity: data.severity,
      source_route: data.source_route ?? null,
      user_agent: data.user_agent ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateBugReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
        assigned_to: z.string().uuid().optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const isInternal = await assertInternal(context);
    const patch: { status: string; assigned_to?: string | null } = {
      status: data.status,
    };
    if (isInternal && data.assigned_to !== undefined) {
      patch.assigned_to = data.assigned_to ?? null;
    }
    let query = context.supabase.from("bug_reports").update(patch);
    if (!isInternal) {
      query = query.eq("reporter_id", context.userId);
    }
    const { error } = await query.eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBugReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bug_reports")
      .delete()
      .eq("id", data.id)
      .eq("reporter_id", context.userId)
      .eq("status", "open");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
