import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const VAULT_CATEGORIES = [
  "passport", "visa", "residence_card", "national_id",
  "birth_cert", "marriage_cert", "death_cert", "divorce_cert",
  "driving_licence", "vehicle_docs",
  "bank_details", "insurance", "tax", "benefits", "social_security",
  "medical", "education", "employment", "property", "rental",
  "will_testament", "power_of_attorney", "advance_directive",
  "other",
] as const;

export type VaultCategory = typeof VAULT_CATEGORIES[number];

export const SENSITIVE_CATEGORIES: VaultCategory[] = [
  "bank_details", "tax", "benefits", "social_security",
  "medical", "will_testament", "power_of_attorney", "advance_directive",
];

// ---------- DOCUMENTS ----------

export const listVaultDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vault_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createVaultDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    category: VaultCategory;
    label: string;
    issuer?: string | null;
    document_number?: string | null;
    issue_date?: string | null;
    expiry_date?: string | null;
    country?: string | null;
    storage_path?: string | null;
    file_name?: string | null;
    mime_type?: string | null;
    file_size?: number | null;
    notes?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("vault_documents")
      .insert({ ...data, owner_user_id: context.userId })
      .select()
      .single();
    if (error) throw error;
    await context.supabase.from("vault_access_log").insert({
      vault_owner_user_id: context.userId,
      accessed_by_user_id: context.userId,
      document_id: row.id,
      action: "upload",
    });
    return row;
  });

export const deleteVaultDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("vault_documents").select("storage_path").eq("id", data.id).single();
    if (doc?.storage_path) {
      await context.supabase.storage.from("vault").remove([doc.storage_path]);
    }
    const { error } = await context.supabase
      .from("vault_documents").delete().eq("id", data.id);
    if (error) throw error;
    await context.supabase.from("vault_access_log").insert({
      vault_owner_user_id: context.userId,
      accessed_by_user_id: context.userId,
      document_id: data.id,
      action: "delete",
    });
    return { ok: true };
  });

export const getVaultDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("vault_documents").select("id, storage_path, owner_user_id").eq("id", data.id).single();
    if (error || !doc?.storage_path) throw new Error("Document not found");
    const { data: signed, error: sErr } = await context.supabase.storage
      .from("vault").createSignedUrl(doc.storage_path, 60);
    if (sErr) throw sErr;
    await context.supabase.from("vault_access_log").insert({
      vault_owner_user_id: doc.owner_user_id,
      accessed_by_user_id: context.userId,
      document_id: doc.id,
      action: "download",
    });
    return { url: signed.signedUrl };
  });

// ---------- DEPUTIES ----------

export const listVaultDeputies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vault_deputies")
      .select("*")
      .eq("owner_user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const inviteVaultDeputy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    invite_email: string;
    full_name: string;
    relationship?: string | null;
    phone?: string | null;
    access_rule: "immediate" | "on_incapacity" | "on_death";
    verification_method: "case_manager" | "multi_deputy";
    min_confirmations?: number;
    allowed_categories: string[];
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("vault_deputies")
      .insert({
        ...data,
        owner_user_id: context.userId,
        min_confirmations: data.min_confirmations ?? 2,
      })
      .select().single();
    if (error) throw error;
    await context.supabase.from("vault_access_log").insert({
      vault_owner_user_id: context.userId,
      accessed_by_user_id: context.userId,
      action: "deputy_invite",
      reason: `Invited ${data.full_name} <${data.invite_email}>`,
    });
    return row;
  });

export const revokeVaultDeputy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vault_deputies")
      .update({ status: "revoked", access_granted: false })
      .eq("id", data.id).eq("owner_user_id", context.userId);
    if (error) throw error;
    await context.supabase.from("vault_access_log").insert({
      vault_owner_user_id: context.userId,
      accessed_by_user_id: context.userId,
      action: "deputy_revoke",
    });
    return { ok: true };
  });

// ---------- UNLOCK REQUESTS ----------

export const listVaultUnlockRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vault_unlock_requests")
      .select("*")
      .or(`owner_user_id.eq.${context.userId},requested_by_user_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

// ---------- ACCESS LOG ----------

export const listVaultAccessLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vault_access_log")
      .select("*")
      .eq("vault_owner_user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });
