import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

async function requireInternal(context: { supabase: SupabaseClient; userId: string }) {
  const { data } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
  if (!data) throw new Error("Staff only.");
}

async function requireAdmin(context: { supabase: SupabaseClient; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Administrator access required.");
}

export const listPartnerEndpoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    await requireInternal(context);
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("partner_endpoints")
      .select("*")
      .order("display_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const savePartnerEndpoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        partnerCode: z
          .string()
          .trim()
          .regex(/^[a-z0-9_-]+$/)
          .max(40),
        displayName: z.string().trim().min(2).max(120),
        endpointUrl: z
          .string()
          .url()
          .refine((value) => value.startsWith("https://"), "HTTPS is required"),
        signingSecretEnv: z
          .string()
          .trim()
          .regex(/^[A-Z][A-Z0-9_]+$/)
          .max(120),
        active: z.boolean(),
        maxAttempts: z.number().int().min(1).max(12).default(6),
        timeoutMs: z.number().int().min(1000).max(30000).default(10000),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { assertPartnerEndpointAllowed } = await import("@/lib/partner-endpoint-guard.server");
    const endpointUrl = assertPartnerEndpointAllowed(data.endpointUrl);
    const client = context.supabase as unknown as SupabaseClient;
    const payload = {
      partner_code: data.partnerCode,
      display_name: data.displayName,
      endpoint_url: endpointUrl,
      signing_secret_env: data.signingSecretEnv,
      active: data.active,
      max_attempts: data.maxAttempts,
      timeout_ms: data.timeoutMs,
    };
    const result = data.id
      ? await client.from("partner_endpoints").update(payload).eq("id", data.id)
      : await client.from("partner_endpoints").insert({ ...payload, created_by: context.userId });
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });

export const pushInsuranceLeadToPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        leadId: z.string().uuid(),
        endpointId: z.string().uuid(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireInternal(context);
    const client = context.supabase as unknown as SupabaseClient;
    const [{ data: lead, error: leadError }, { data: endpoint, error: endpointError }] =
      await Promise.all([
        client
          .from("insurance_leads")
          .select(
            "id, full_name, email, phone, triage_route, product_line, notes, stage, created_at",
          )
          .eq("id", data.leadId)
          .maybeSingle(),
        client
          .from("partner_endpoints")
          .select("id, partner_code, display_name, endpoint_url, active")
          .eq("id", data.endpointId)
          .maybeSingle(),
      ]);
    if (leadError || !lead) throw new Error("Lead not found.");
    if (endpointError || !endpoint || !endpoint.active)
      throw new Error("Partner endpoint is unavailable.");

    const payload = {
      schema_version: "2026-08-01",
      partner: endpoint.partner_code,
      submitted_at: new Date().toISOString(),
      lead: {
        id: lead.id,
        name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        interest: lead.product_line,
        route: lead.triage_route,
        notes: lead.notes,
      },
    };
    const idempotencyKey = crypto.randomUUID();
    const { data: row, error } = await client
      .from("partner_api_pushes")
      .insert({
        lead_id: data.leadId,
        endpoint_id: endpoint.id,
        partner_code: endpoint.partner_code,
        endpoint: endpoint.endpoint_url,
        request_payload: payload,
        status: "queued",
        idempotency_key: idempotencyKey,
        next_attempt_at: new Date().toISOString(),
        sent_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { push: row };
  });

export const listPartnerPushes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    await requireInternal(context);
    const client = context.supabase as unknown as SupabaseClient;
    const [{ data: pushes, error }, { data: attempts }] = await Promise.all([
      client
        .from("partner_api_pushes")
        .select(
          "id, lead_id, endpoint_id, partner_code, endpoint, status, response_status, attempt_count, next_attempt_at, last_error, delivered_at, dead_lettered_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      client
        .from("partner_delivery_attempts")
        .select(
          "id, push_id, attempt_number, response_status, error_message, duration_ms, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300),
    ]);
    if (error) throw new Error(error.message);
    return { pushes: pushes ?? [], attempts: attempts ?? [] };
  });

export const retryPartnerPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await requireInternal(context);
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client
      .from("partner_api_pushes")
      .update({
        status: "retrying",
        next_attempt_at: new Date().toISOString(),
        last_error: null,
        dead_lettered_at: null,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", data.id)
      .in("status", ["failed", "dead_letter"]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
