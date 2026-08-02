import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAal2 } from "@/lib/aal2-middleware";
import { z } from "zod";

export const VAULT_CATEGORIES = [
  "passport",
  "visa",
  "residence_card",
  "national_id",
  "birth_cert",
  "marriage_cert",
  "death_cert",
  "divorce_cert",
  "driving_licence",
  "vehicle_docs",
  "bank_details",
  "insurance",
  "tax",
  "benefits",
  "social_security",
  "medical",
  "education",
  "employment",
  "property",
  "rental",
  "will_testament",
  "power_of_attorney",
  "advance_directive",
  "other",
] as const;

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export const SENSITIVE_CATEGORIES: VaultCategory[] = [
  "bank_details",
  "tax",
  "benefits",
  "social_security",
  "medical",
  "will_testament",
  "power_of_attorney",
  "advance_directive",
];

export const VAULT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const VAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;

const VaultDocumentInput = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(VAULT_CATEGORIES),
  label: z.string().trim().min(1).max(160),
  issuer: z.string().trim().max(160).nullable().optional(),
  document_number: z.string().trim().max(160).nullable().optional(),
  issue_date: z.string().date().nullable().optional(),
  expiry_date: z.string().date().nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  storage_path: z.string().max(500).nullable().optional(),
  file_name: z.string().trim().max(240).nullable().optional(),
  mime_type: z.enum(VAULT_ALLOWED_MIME_TYPES).nullable().optional(),
  file_size: z.number().int().positive().max(VAULT_MAX_FILE_BYTES).nullable().optional(),
  notes: z.string().trim().max(3000).nullable().optional(),
});

async function queueVaultScan(documentId: string, storagePath: string) {
  const production = process.env.NODE_ENV === "production";
  const scannerUrl = process.env["VAULT_SCANNER_URL"];
  const scannerToken = process.env["VAULT_SCANNER_BEARER_TOKEN"];
  const appUrl = process.env["APP_URL"];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!production && process.env["VAULT_SCANNER_MODE"] === "trusted-development") {
    const { error } = await (supabaseAdmin as any)
      .from("vault_documents")
      .update({
        scan_status: "clean",
        scan_completed_at: new Date().toISOString(),
        scan_message: "Trusted development bypass",
      })
      .eq("id", documentId);
    if (error) throw new Error(error.message);
    return;
  }
  if (!scannerUrl || !scannerToken || !appUrl) {
    throw new Error("Vault scanning is not configured. The file was not retained.");
  }

  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from("vault")
    .createSignedUrl(storagePath, 600);
  if (signedError) throw new Error("Could not prepare the file for security scanning.");

  const response = await fetch(scannerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${scannerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId,
      downloadUrl: signed.signedUrl,
      callbackUrl: new URL("/api/internal/vault-scan-result", appUrl).toString(),
    }),
  });
  if (!response.ok) throw new Error("The security scanner did not accept the upload.");
}

// ---------- DOCUMENTS ----------

export const listVaultDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vault_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createVaultDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) => VaultDocumentInput.parse(raw))
  .handler(async ({ data, context }) => {
    const hasFile = Boolean(data.storage_path);
    if (hasFile && (!data.mime_type || !data.file_name || !data.file_size)) {
      throw new Error("File metadata is incomplete.");
    }
    const expectedPrefix = `${context.userId}/${data.id}/`;
    if (hasFile && (!data.id || !data.storage_path?.startsWith(expectedPrefix))) {
      throw new Error("Invalid vault storage path.");
    }

    const { data: row, error } = await (context.supabase as any)
      .from("vault_documents")
      .insert({
        ...data,
        owner_user_id: context.userId,
        scan_status: hasFile ? "pending" : "not_required",
      })
      .select()
      .single();
    if (error) throw error;
    await context.supabase.from("vault_access_log").insert({
      vault_owner_user_id: context.userId,
      accessed_by_user_id: context.userId,
      document_id: row.id,
      action: "upload",
    });

    if (hasFile && data.storage_path) {
      try {
        await queueVaultScan(row.id, data.storage_path);
      } catch (scanError) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.storage.from("vault").remove([data.storage_path]);
        await (supabaseAdmin as any).from("vault_documents").delete().eq("id", row.id);
        throw scanError;
      }
    }
    return row;
  });

export const createVaultUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        fileName: z.string().trim().min(1).max(240),
        mimeType: z.enum(VAULT_ALLOWED_MIME_TYPES),
        fileSize: z.number().int().positive().max(VAULT_MAX_FILE_BYTES),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!safeName || safeName === "." || safeName === "..") throw new Error("Invalid file name.");
    const path = `${context.userId}/${data.id}/${safeName}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("vault")
      .createSignedUploadUrl(path);
    if (error) throw new Error("Could not prepare a secure upload.");
    return { path, token: signed.token };
  });

export const deleteVaultDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("vault_documents")
      .select("storage_path")
      .eq("id", data.id)
      .single();
    if (doc?.storage_path) {
      await context.supabase.storage.from("vault").remove([doc.storage_path]);
    }
    const { error } = await context.supabase.from("vault_documents").delete().eq("id", data.id);
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
  .middleware([requireSupabaseAal2])
  .validator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await (context.supabase as any)
      .from("vault_documents")
      .select("id, storage_path, owner_user_id, scan_status")
      .eq("id", data.id)
      .single();
    if (error || !doc?.storage_path) throw new Error("Document not found");
    if (doc.scan_status !== "clean") {
      throw new Error("This document is not available until its security scan passes.");
    }
    const { data: signed, error: sErr } = await context.supabase.storage
      .from("vault")
      .createSignedUrl(doc.storage_path, 60);
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
  .middleware([requireSupabaseAal2])
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
  .middleware([requireSupabaseAal2])
  .validator(
    (d: {
      invite_email: string;
      full_name: string;
      relationship?: string | null;
      phone?: string | null;
      access_rule: "immediate" | "on_incapacity" | "on_death";
      verification_method: "case_manager" | "multi_deputy";
      min_confirmations?: number;
      allowed_categories: string[];
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("vault_deputies")
      .insert({
        ...data,
        owner_user_id: context.userId,
        min_confirmations: data.min_confirmations ?? 2,
      })
      .select()
      .single();
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
  .middleware([requireSupabaseAal2])
  .validator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vault_deputies")
      .update({ status: "revoked", access_granted: false })
      .eq("id", data.id)
      .eq("owner_user_id", context.userId);
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
  .middleware([requireSupabaseAal2])
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
  .middleware([requireSupabaseAal2])
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
