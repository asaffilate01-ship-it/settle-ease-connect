import { createHash, randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Secure family-access invitations.
 *
 * Only the token hash is stored; the raw token exists once in the invitation
 * link returned to the case owner. Grants carry an access level, optional
 * messaging right and a hard expiry, and can be revoked at any time.
 */

const ACCESS_LEVELS = ["updates", "documents", "collaborator"] as const;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const listFamilyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: cases, error } = await context.supabase
      .from("cases")
      .select("id, reference, title, status, updated_at")
      .eq("client_user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const { data: grants } = await context.supabase
      .from("case_access_grants")
      .select(
        "id, case_id, invited_name, invited_email, relationship, access_level, can_message, status, expires_at, accepted_at, created_at",
      )
      .eq("owner_user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    return { cases: cases ?? [], grants: grants ?? [] };
  });

export const inviteFamilyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        caseId: z.string().uuid(),
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(200),
        relationship: z.string().trim().max(80).optional().or(z.literal("")),
        accessLevel: z.enum(ACCESS_LEVELS),
        canMessage: z.boolean().default(false),
        expiresInDays: z.coerce.number().int().min(1).max(90).default(14),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: ownedCase, error: caseError } = await context.supabase
      .from("cases")
      .select("id")
      .eq("id", data.caseId)
      .eq("client_user_id", context.userId)
      .maybeSingle();
    if (caseError) throw new Error(caseError.message);
    if (!ownedCase) throw new Error("You can only invite people to your own cases.");

    const token = randomBytes(32).toString("base64url");
    const { error } = await (context.supabase.from("case_access_grants") as any).insert({
      case_id: data.caseId,
      owner_user_id: context.userId,
      invited_name: data.name,
      invited_email: data.email.toLowerCase(),
      relationship: data.relationship || null,
      access_level: data.accessLevel,
      can_message: data.canMessage,
      token_hash: hashToken(token),
      status: "invited",
      expires_at: new Date(Date.now() + data.expiresInDays * 86_400_000).toISOString(),
    });
    if (error) throw new Error(error.message);

    return { invitationPath: `/family-invite/${token}` };
  });

export const revokeFamilyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase.from("case_access_grants") as any)
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const acceptFamilyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ token: z.string().min(10).max(200) }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: caseId, error } = await context.supabase.rpc("accept_case_access_grant", {
      _token_hash: hashToken(data.token),
    });
    if (error) throw new Error(error.message);
    if (!caseId) throw new Error("This invitation is invalid, expired or already used.");
    return { caseId: caseId as string };
  });
