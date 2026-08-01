import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

const ACCESS_LEVELS = ["updates", "documents", "collaborator"] as const;

async function sha256(value: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

export const listFamilyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const [cases, grants] = await Promise.all([
      client
        .from("cases")
        .select("id, reference, title, status, updated_at")
        .eq("client_user_id", context.userId)
        .order("updated_at", { ascending: false }),
      client
        .from("case_family_access")
        .select(
          "id, case_id, invited_name, invited_email, relationship, access_level, can_message, status, expires_at, accepted_at, created_at",
        )
        .eq("owner_user_id", context.userId)
        .order("created_at", { ascending: false }),
    ]);
    if (cases.error) throw new Error(cases.error.message);
    if (grants.error) throw new Error(grants.error.message);
    return { cases: cases.data ?? [], grants: grants.data ?? [] };
  });

export const inviteFamilyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        caseId: z.string().uuid(),
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(200),
        relationship: z.string().trim().max(80).optional().nullable(),
        accessLevel: z.enum(ACCESS_LEVELS),
        canMessage: z.boolean().default(false),
        expiresInDays: z.number().int().min(1).max(90).default(14),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data: ownedCase } = await client
      .from("cases")
      .select("id")
      .eq("id", data.caseId)
      .eq("client_user_id", context.userId)
      .maybeSingle();
    if (!ownedCase) throw new Error("You can only invite people to your own case.");

    const { randomBytes } = await import("node:crypto");
    const token = randomBytes(32).toString("base64url");
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + data.expiresInDays * 86_400_000).toISOString();

    await client
      .from("case_family_access")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("case_id", data.caseId)
      .eq("invited_email", data.email.toLowerCase())
      .in("status", ["pending", "accepted"]);

    const { data: row, error } = await client
      .from("case_family_access")
      .insert({
        case_id: data.caseId,
        owner_user_id: context.userId,
        invited_name: data.name,
        invited_email: data.email.toLowerCase(),
        relationship: data.relationship ?? null,
        access_level: data.accessLevel,
        can_message: data.canMessage,
        invitation_token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select("id, case_id, invited_name, invited_email, access_level, expires_at")
      .single();
    if (error) throw new Error(error.message);
    return { grant: row, invitationPath: `/family-invite/${token}` };
  });

export const revokeFamilyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const client = context.supabase as unknown as SupabaseClient;
    const { error } = await client
      .from("case_family_access")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const acceptFamilyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ token: z.string().min(20).max(200) }).parse(raw))
  .handler(async ({ data, context }) => {
    const hash = await sha256(data.token);
    const { data: caseId, error } = await context.supabase.rpc(
      "accept_case_family_invitation" as never,
      {
        _token_hash: hash,
      } as never,
    );
    if (error) throw new Error(error.message);
    return { caseId: caseId as unknown as string };
  });
