import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  .inputValidator((d: { orgId: string }) => z.object({ orgId: z.string().uuid() }).parse(d))
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
  .inputValidator((d: { orgId: string }) => z.object({ orgId: z.string().uuid() }).parse(d))
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
  .inputValidator((d: unknown) =>
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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("partner_organisations")
      .select("id, legal_name, trading_name, primary_category, city, bundesland, status, verified, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createPartnerOrg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        email: z.string().email(),
        isAdmin: z.boolean().optional().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    // Look up an existing user by email through public.profiles is not possible without admin.
    // For now, just record the invitation email; when they sign up + accept, an admin links them.
    const { error } = await context.supabase.from("partner_users").insert({
      org_id: data.orgId,
      user_id: context.userId, // temp placeholder — real link done when the invitee accepts
      is_admin: data.isAdmin,
      status: "invited",
      invited_email: data.email,
      invited_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { ok: true };
  });
