import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin delivery centre: register partner endpoints (URL + secret env NAME,
 * never the secret value), inspect queue health and retry failures.
 */

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Admin only.");
}

export const listPartnerEndpoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as any);
    const [{ data: endpoints }, { data: pushes }] = await Promise.all([
      context.supabase
        .from("partner_endpoints")
        .select(
          "id, partner_code, label, endpoint_url, signing_secret_env, max_attempts, timeout_ms, active, notes, created_at",
        )
        .order("created_at", { ascending: false }),
      context.supabase
        .from("partner_api_pushes")
        .select(
          "id, partner_code, status, attempt_count, response_status, last_error, next_attempt_at, delivered_at, dead_lettered_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const rows = pushes ?? [];
    return {
      endpoints: endpoints ?? [],
      pushes: rows,
      health: {
        queued: rows.filter((row: any) => row.status === "queued").length,
        retrying: rows.filter((row: any) => row.status === "retrying").length,
        deadLetter: rows.filter((row: any) => row.status === "dead_letter").length,
        delivered: rows.filter((row: any) => row.status === "sent").length,
      },
    };
  });

export const savePartnerEndpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        partnerCode: z.string().trim().min(2).max(40),
        label: z.string().trim().min(2).max(120),
        endpointUrl: z.string().url().max(500).startsWith("https://", "HTTPS is required"),
        signingSecretEnv: z
          .string()
          .trim()
          .regex(/^[A-Z0-9_]{8,80}$/, "Use the environment-variable NAME, not the secret value"),
        maxAttempts: z.coerce.number().int().min(1).max(12).default(6),
        timeoutMs: z.coerce.number().int().min(1000).max(30_000).default(10_000),
        active: z.boolean().default(true),
        notes: z.string().max(2000).nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as any);
    const row = {
      partner_code: data.partnerCode,
      label: data.label,
      endpoint_url: data.endpointUrl,
      signing_secret_env: data.signingSecretEnv,
      max_attempts: data.maxAttempts,
      timeout_ms: data.timeoutMs,
      active: data.active,
      notes: data.notes ?? null,
    };
    if (data.id) {
      const { error } = await (context.supabase.from("partner_endpoints") as any)
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await (context.supabase.from("partner_endpoints") as any)
      .insert({ ...row, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const retryPartnerPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as any);
    const { error } = await (context.supabase.from("partner_api_pushes") as any)
      .update({
        status: "queued",
        next_attempt_at: new Date().toISOString(),
        dead_lettered_at: null,
        last_error: null,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPushAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ pushId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as any);
    const { data: rows, error } = await context.supabase
      .from("partner_delivery_attempts")
      .select("id, attempt_number, response_status, response_excerpt, error_message, duration_ms, created_at")
      .eq("push_id", data.pushId)
      .order("attempt_number", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
