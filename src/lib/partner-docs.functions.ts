import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Record a partner compliance document after the client has uploaded to storage.
// Authorises: caller must be an active admin of the target partner org.
export const recordPartnerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        category: z.enum([
          "licence",
          "insurance",
          "registration",
          "bank_details",
          "vat",
          "gdpr",
          "other",
        ]),
        title: z.string().min(1).max(200),
        storagePath: z.string().min(1),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
        notes: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: membership, error: memErr } = await supabase
      .from("partner_users")
      .select("id, is_admin, status")
      .eq("user_id", userId)
      .eq("org_id", data.orgId)
      .eq("status", "active")
      .maybeSingle();
    if (memErr) throw memErr;
    if (!membership || !membership.is_admin) throw new Error("Only partner admins may upload documents");

    const { data: row, error } = await supabase
      .from("partner_documents")
      .insert({
        org_id: data.orgId,
        category: data.category,
        title: data.title,
        storage_path: data.storagePath,
        valid_from: data.validFrom ?? null,
        valid_until: data.validUntil ?? null,
        notes: data.notes ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const deletePartnerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // RLS enforces admin-of-same-org via existing partner_documents policies
    const { error } = await context.supabase.from("partner_documents").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
