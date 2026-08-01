import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";

export const writeAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        action: z.string().min(1),
        entity_type: z.string().optional(),
        entity_id: z.string().optional(),
        subject_user_id: z.string().uuid().optional(),
        metadata: z.record(z.any()).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: me } = await context.supabase.auth.getUser();
    const { error } = await context.supabase.from("audit_log").insert({
      actor_user_id: context.userId,
      actor_email: me?.user?.email ?? null,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      subject_user_id: data.subject_user_id,
      metadata: data.metadata ?? {},
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        limit: z.number().min(1).max(500).optional(),
        entity_type: z.string().optional(),
        entity_id: z.string().optional(),
        actor: z.string().uuid().optional(),
        q: z.string().optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.entity_type) q = q.eq("entity_type", data.entity_type);
    if (data.entity_id) q = q.eq("entity_id", data.entity_id);
    if (data.actor) q = q.eq("actor_user_id", data.actor);
    if (data.q) q = q.ilike("action", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
