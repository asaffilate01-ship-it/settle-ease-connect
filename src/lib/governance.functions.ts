import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Governance server functions: DPO privacy-request console, member-facing
 * privacy requests, and the compliance action register.
 *
 * Auditors get read-only visibility (`readOnly: true`); staff with an internal
 * role, compliance or dpo may write.
 */

type Ctx = { supabase: any; userId: string };

async function accessLevel(context: Ctx) {
  const [internal, auditor, compliance, dpo] = await Promise.all([
    context.supabase.rpc("is_internal", { _user_id: context.userId }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "auditor" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "compliance" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "dpo" }),
  ]);
  const canWrite = Boolean(internal.data || compliance.data || dpo.data);
  const canRead = canWrite || Boolean(auditor.data);
  return { canRead, canWrite };
}

const PRIVACY_TYPES = [
  "access",
  "rectification",
  "erasure",
  "portability",
  "restriction",
  "objection",
  "consent_withdrawal",
] as const;

const PRIVACY_STATUSES = [
  "submitted",
  "identity_check",
  "in_review",
  "waiting_requester",
  "fulfilled",
  "declined",
] as const;

/* ------------------------- DPO console ------------------------- */

export const listPrivacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { canRead, canWrite } = await accessLevel(context as Ctx);
    if (!canRead) throw new Error("Not authorised for the privacy console.");
    const { data, error } = await context.supabase
      .from("privacy_requests")
      .select(
        "id, request_type, requester_email, description, status, due_at, created_at, resolution, identity_verified, assigned_to",
      )
      .order("due_at", { ascending: true })
      .limit(300);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], readOnly: !canWrite };
  });

export const updatePrivacyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(PRIVACY_STATUSES),
        resolution: z.string().max(5000).nullable().optional(),
        identityVerified: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { canWrite } = await accessLevel(context as Ctx);
    if (!canWrite) throw new Error("This console is read-only for your role.");
    const patch: Record<string, unknown> = {
      status: data.status,
      resolution: data.resolution ?? null,
    };
    if (data.identityVerified) patch["identity_verified"] = true;
    if (data.status === "fulfilled" || data.status === "declined") {
      patch["processed_at"] = new Date().toISOString();
      patch["processed_by"] = context.userId;
    }
    const { error } = await context.supabase
      .from("privacy_requests")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------- Member-facing ------------------------- */

export const listMyPrivacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("privacy_requests")
      .select("id, request_type, description, status, created_at, due_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const submitPrivacyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        requestType: z.enum(PRIVACY_TYPES),
        description: z.string().trim().min(10).max(5000),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const email = (context.claims as Record<string, unknown> | undefined)?.["email"];
    const { data: row, error } = await context.supabase
      .from("privacy_requests")
      .insert({
        user_id: context.userId,
        kind: "request",
        request_type: data.requestType,
        requester_email: typeof email === "string" ? email : null,
        description: data.description,
        reason: data.description.slice(0, 500),
        status: "submitted",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

/* ------------------------- Compliance register ------------------------- */

const CATEGORIES = [
  "general",
  "gdpr",
  "security",
  "legal_copy",
  "partner_due_diligence",
  "incident",
  "access_review",
  "retention",
] as const;
const STATUSES = [
  "open",
  "in_progress",
  "blocked",
  "ready_for_review",
  "closed",
  "accepted_risk",
] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const listComplianceActions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { canRead, canWrite } = await accessLevel(context as Ctx);
    if (!canRead) throw new Error("Not authorised for the compliance console.");
    const { data, error } = await context.supabase
      .from("compliance_actions")
      .select(
        "id, title, description, category, severity, status, due_at, resolution, owner_user_id, created_at, updated_at",
      )
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], readOnly: !canWrite };
  });

export const saveComplianceAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(3).max(200),
        description: z.string().max(5000).nullable().optional(),
        category: z.enum(CATEGORIES),
        severity: z.enum(SEVERITIES),
        status: z.enum(STATUSES),
        dueAt: z.string().nullable().optional(),
        resolution: z.string().max(5000).nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { canWrite } = await accessLevel(context as Ctx);
    if (!canWrite) throw new Error("This console is read-only for your role.");
    const row = {
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      severity: data.severity,
      status: data.status,
      due_at: data.dueAt ?? null,
      resolution: data.resolution ?? null,
      closed_at: data.status === "closed" ? new Date().toISOString() : null,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("compliance_actions")
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("compliance_actions")
      .insert({ ...row, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });
