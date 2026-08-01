import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

const PRIVACY_TYPES = [
  "access",
  "rectification",
  "erasure",
  "portability",
  "restriction",
  "objection",
  "consent_withdrawal",
] as const;
const PRIVACY_STATUS = [
  "submitted",
  "identity_check",
  "in_review",
  "waiting_requester",
  "fulfilled",
  "declined",
] as const;
const ACTION_STATUS = [
  "open",
  "in_progress",
  "blocked",
  "ready_for_review",
  "closed",
  "accepted_risk",
] as const;
const ACTION_CATEGORY = [
  "general",
  "gdpr",
  "security",
  "legal_copy",
  "partner_due_diligence",
  "incident",
  "access_review",
  "retention",
] as const;
const SEVERITY = ["low", "medium", "high", "critical"] as const;

async function rolesFor(context: { supabase: SupabaseClient; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  return new Set<string>((data ?? []).map((row: { role: string }) => row.role));
}

export const submitPrivacyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        requestType: z.enum(PRIVACY_TYPES),
        description: z.string().trim().min(5).max(4000),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: user } = await context.supabase.auth.getUser();
    const email = user.user?.email;
    if (!email) throw new Error("Your account does not have a verified email address.");
    const client = context.supabase as unknown as SupabaseClient;
    const { data: row, error } = await client
      .from("privacy_requests")
      .insert({
        requester_user_id: context.userId,
        requester_email: email.toLowerCase(),
        request_type: data.requestType,
        description: data.description,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listMyPrivacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("privacy_requests")
      .select("*")
      .eq("requester_user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listPrivacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context);
    if (!["admin", "dpo", "auditor"].some((role) => roles.has(role)))
      throw new Error("DPO or auditor access required.");
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("privacy_requests")
      .select("*")
      .order("due_at")
      .limit(500);
    if (error) throw new Error(error.message);
    return {
      rows: data ?? [],
      readOnly: roles.has("auditor") && !roles.has("admin") && !roles.has("dpo"),
    };
  });

export const updatePrivacyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(PRIVACY_STATUS),
        assignedTo: z.string().uuid().nullable().optional(),
        resolution: z.string().trim().max(8000).nullable().optional(),
        identityVerified: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesFor(context);
    if (!roles.has("admin") && !roles.has("dpo")) throw new Error("DPO access required.");
    const client = context.supabase as unknown as SupabaseClient;
    const patch: Record<string, unknown> = { status: data.status };
    if (data.assignedTo !== undefined) patch.assigned_to = data.assignedTo;
    if (data.resolution !== undefined) patch.resolution = data.resolution;
    if (data.identityVerified) patch.identity_verified_at = new Date().toISOString();
    if (["fulfilled", "declined"].includes(data.status))
      patch.completed_at = new Date().toISOString();
    const { error } = await client.from("privacy_requests").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listComplianceActions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context);
    if (!["admin", "compliance", "auditor"].some((role) => roles.has(role)))
      throw new Error("Compliance or auditor access required.");
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("compliance_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return {
      rows: data ?? [],
      readOnly: roles.has("auditor") && !roles.has("admin") && !roles.has("compliance"),
    };
  });

export const saveComplianceAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(3).max(240),
        description: z.string().trim().max(8000).optional().nullable(),
        category: z.enum(ACTION_CATEGORY),
        severity: z.enum(SEVERITY),
        status: z.enum(ACTION_STATUS),
        dueAt: z.string().datetime().optional().nullable(),
        resolution: z.string().trim().max(8000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const roles = await rolesFor(context);
    if (!roles.has("admin") && !roles.has("compliance"))
      throw new Error("Compliance access required.");
    const client = context.supabase as unknown as SupabaseClient;
    const payload = {
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      severity: data.severity,
      status: data.status,
      due_at: data.dueAt ?? null,
      resolution: data.resolution ?? null,
      closed_at: data.status === "closed" ? new Date().toISOString() : null,
    };
    const result = data.id
      ? await client.from("compliance_actions").update(payload).eq("id", data.id)
      : await client.from("compliance_actions").insert({ ...payload, created_by: context.userId });
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });
