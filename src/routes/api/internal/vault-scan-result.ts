import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Result = z.object({
  documentId: z.string().uuid(),
  status: z.enum(["clean", "rejected", "error"]),
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
  message: z.string().max(500).optional(),
});

function authorised(request: Request) {
  const expected = process.env["VAULT_SCANNER_WEBHOOK_SECRET"] ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const Route = createFileRoute("/api/internal/vault-scan-result")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorised(request)) {
          return Response.json({ error: "Unauthorised" }, { status: 401 });
        }
        try {
          const input = Result.parse(await request.json());
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: document, error: readError } = await (supabaseAdmin as any)
            .from("vault_documents")
            .select("id, storage_path, scan_status")
            .eq("id", input.documentId)
            .single();
          if (readError || !document) {
            return Response.json({ error: "Document not found" }, { status: 404 });
          }
          if (document.scan_status !== "pending" && document.scan_status !== "error") {
            return Response.json({ ok: true, unchanged: true });
          }

          if (input.status === "rejected" && document.storage_path) {
            await supabaseAdmin.storage.from("vault").remove([document.storage_path]);
          }
          const { error: updateError } = await (supabaseAdmin as any)
            .from("vault_documents")
            .update({
              scan_status: input.status,
              scan_completed_at: new Date().toISOString(),
              scan_message: input.message ?? null,
              checksum: input.sha256 ?? null,
              ...(input.status === "rejected" ? { storage_path: null } : {}),
            })
            .eq("id", input.documentId);
          if (updateError) throw updateError;
          return Response.json({ ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid scan result";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
