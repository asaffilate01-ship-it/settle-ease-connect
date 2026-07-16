import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listCopyAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("regulated_copy_audit")
      .select("id, surface, route_path, domain, status, findings, reviewer_user_id, reviewed_at, notes, updated_at")
      .order("domain")
      .order("surface");
    return data ?? [];
  });

export const updateCopyAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "approved", "needs_revision", "blocked"]),
    notes: z.string().max(4000).optional(),
    findings: z.array(z.object({ severity: z.enum(["info", "warn", "block"]), text: z.string().max(600) })).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("regulated_copy_audit")
      .update({
        status: data.status,
        notes: data.notes ?? null,
        findings: data.findings ?? [],
        reviewer_user_id: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
