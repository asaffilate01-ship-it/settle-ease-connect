import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2 as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = [
  "admin",
  "staff",
  "case_manager",
  "insurance_admin",
  "tax_admin",
  "benefits_admin",
  "medical_admin",
  "new_arrival_admin",
  "lawyer",
  "accountant",
  "doctor",
  "notary",
  "translator",
  "social_worker",
  "expert",
  "funeral_director",
  "mosque",
  "church",
  "temple",
  "hospital",
  "beneficiary",
  "family",
  "agent",
] as const;
const RoleSchema = z.enum(ROLES);

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

// -------- Users --------

export const listAppUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (authErr) throw new Error(authErr.message);

    const ids = authList.users.map((u) => u.id);
    const [{ data: roles }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("profiles").select("id, full_name").in("id", ids),
    ]);

    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    const nameMap = new Map<string, string>();
    (profiles ?? []).forEach((p: any) => nameMap.set(p.id, p.full_name ?? ""));

    return authList.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      full_name: nameMap.get(u.id) ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      roles: roleMap.get(u.id) ?? [],
    }));
  });

export const grantUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z.object({ user_id: z.string().uuid(), role: RoleSchema }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) {
      throw new Error("Administrators cannot approve changes to their own roles.");
    }
    const { data: existing, error: existingError } = await (context.supabase as any)
      .from("security_approvals")
      .select("id")
      .eq("action", "role_grant")
      .eq("target_user_id", data.user_id)
      .eq("role", data.role)
      .eq("status", "pending")
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) return { ok: true, pending: true, approvalId: existing.id };

    const { data: request, error } = await (context.supabase as any)
      .from("security_approvals")
      .insert({
        action: "role_grant",
        target_user_id: data.user_id,
        role: data.role,
        requested_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, pending: true, approvalId: request.id };
  });

export const revokeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z.object({ user_id: z.string().uuid(), role: RoleSchema }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) {
      throw new Error("Administrators cannot approve changes to their own roles.");
    }
    const { data: existing, error: existingError } = await (context.supabase as any)
      .from("security_approvals")
      .select("id")
      .eq("action", "role_revoke")
      .eq("target_user_id", data.user_id)
      .eq("role", data.role)
      .eq("status", "pending")
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) return { ok: true, pending: true, approvalId: existing.id };

    const { data: request, error } = await (context.supabase as any)
      .from("security_approvals")
      .insert({
        action: "role_revoke",
        target_user_id: data.user_id,
        role: data.role,
        requested_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, pending: true, approvalId: request.id };
  });

export const listRoleApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await (context.supabase as any)
      .from("security_approvals")
      .select(
        "id, action, target_user_id, role, status, reason, requested_by, requested_at, decided_by, decided_at, decision_note",
      )
      .order("requested_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const decideRoleApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await (context.supabase as any).rpc("decide_role_security_approval", {
      _approval_id: data.id,
      _decision: data.decision,
      _note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Invitations --------

export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("role_invitations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        email: z.string().email().max(200),
        role: RoleSchema,
        note: z.string().max(500).optional(),
        days_valid: z.number().int().min(1).max(365).default(30),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const expires = new Date(Date.now() + data.days_valid * 86400000).toISOString();
    const { error } = await context.supabase.from("role_invitations").insert({
      email: data.email.toLowerCase(),
      role: data.role,
      note: data.note ?? null,
      expires_at: expires,
      invited_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("role_invitations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
