import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";
import { enforceRateLimit } from "@/lib/public-api-guard.server";

async function invitationTokenHash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// ============ Partner side ============
export const getMyPartnerOrg = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: link } = await supabase
      .from("partner_users")
      .select("org_id, is_admin, role_title, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("is_admin", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!link) return null;
    const { data: org } = await supabase
      .from("partner_organisations")
      .select("*")
      .eq("id", link.org_id)
      .maybeSingle();
    return { link, org };
  });

export const listMyPartnerDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string }) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("partner_documents")
      .select("*")
      .eq("org_id", data.orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const listMyPartnerCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { orgId: string }) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("case_assignments")
      .select(
        "id, case_id, role, status, invited_at, accepted_at, declined_at, decline_reason, cases!inner(id, title, status, current_stage, priority, sla_due_at)",
      )
      .eq("partner_org_id", data.orgId)
      .order("invited_at", { ascending: false });
    if (error) throw error;
    return rows ?? [];
  });

export const respondToCaseInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        assignmentId: z.string().uuid(),
        response: z.enum(["accept", "decline"]),
        declineReason: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const patch =
      data.response === "accept"
        ? { accepted_at: now, status: "accepted", declined_at: null, decline_reason: null }
        : { declined_at: now, status: "declined", decline_reason: data.declineReason ?? null };
    const { error } = await context.supabase.from("case_assignments").update(patch).eq("id", data.assignmentId);
    if (error) throw error;
    return { ok: true };
  });

// ============ Internal admin side ============
export const listPartnerOrgs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("partner_organisations")
      .select("id, legal_name, trading_name, primary_category, city, bundesland, status, verified, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createPartnerOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) =>
    z
      .object({
        legalName: z.string().min(2),
        tradingName: z.string().optional(),
        primaryCategory: z.enum([
          "funeral_director",
          "lawyer",
          "translator",
          "religious_org",
          "hospital",
          "airline",
          "driving_school",
          "childcare",
          "relocation",
          "other",
        ]),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        city: z.string().optional(),
        bundesland: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("partner_organisations")
      .insert({
        legal_name: data.legalName,
        trading_name: data.tradingName ?? null,
        primary_category: data.primaryCategory,
        contact_email: data.contactEmail ?? null,
        contact_phone: data.contactPhone ?? null,
        city: data.city ?? null,
        bundesland: data.bundesland ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const setPartnerOrgStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "active", "suspended", "offboarded"]),
        verified: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { status: typeof data.status; verified?: boolean } = { status: data.status };
    if (data.verified !== undefined) patch.verified = data.verified;
    const { error } = await context.supabase.from("partner_organisations").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const invitePartnerUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        email: z.string().email(),
        isAdmin: z.boolean().optional().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const [{ data: internal }, { data: orgAdmin }] = await Promise.all([
      context.supabase.rpc("is_internal", { _user_id: context.userId }),
      context.supabase.rpc("is_partner_admin", {
        _user_id: context.userId,
        _org_id: data.orgId,
      }),
    ]);
    if (!internal && !orgAdmin) throw new Error("Forbidden: partner admin required");

    const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
    const expiresAt = new Date(Date.now() + 14 * 86_400_000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("partner_invitations" as never).insert({
      org_id: data.orgId,
      email: data.email.toLowerCase(),
      is_admin: data.isAdmin,
      token_hash: await invitationTokenHash(token),
      invited_by: context.userId,
      expires_at: expiresAt,
    } as never);
    if (error) throw error;
    return { ok: true, token, expiresAt };
  });

export const getPartnerInvitationByToken = createServerFn({ method: "GET" })
  .validator((raw: unknown) => z.object({ token: z.string().min(40).max(160) }).parse(raw))
  .handler(async ({ data }) => {
    await enforceRateLimit({ scope: "partner-invitation-lookup", limit: 30, windowSeconds: 3600 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invitation, error } = await supabaseAdmin
      .from("partner_invitations" as never)
      .select("id, org_id, email, is_admin, expires_at, accepted_at")
      .eq("token_hash", await invitationTokenHash(data.token))
      .maybeSingle();
    if (error) throw error;
    if (!invitation) return { ok: false as const, reason: "not_found" as const };
    const row = invitation as {
      id: string;
      org_id: string;
      email: string;
      is_admin: boolean;
      expires_at: string;
      accepted_at: string | null;
    };
    if (row.accepted_at) return { ok: false as const, reason: "already_accepted" as const };
    if (new Date(row.expires_at) <= new Date()) {
      return { ok: false as const, reason: "expired" as const };
    }
    const { data: organisation, error: orgError } = await supabaseAdmin
      .from("partner_organisations")
      .select("legal_name, trading_name")
      .eq("id", row.org_id)
      .single();
    if (orgError) throw orgError;
    return { ok: true as const, invitation: { ...row, organisation } };
  });

export const acceptPartnerInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ token: z.string().min(40).max(160) }).parse(raw))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invitation, error: lookupError } = await supabaseAdmin
      .from("partner_invitations" as never)
      .select("id")
      .eq("token_hash", await invitationTokenHash(data.token))
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!invitation) throw new Error("Invitation not found");
    const { data: orgId, error } = await context.supabase.rpc(
      "accept_partner_invitation" as never,
      { _invitation_id: (invitation as { id: string }).id } as never,
    );
    if (error) throw error;
    return { ok: true as const, orgId: orgId as string };
  });
