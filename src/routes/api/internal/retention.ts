import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";

function authorised(request: Request) {
  const expected = process.env["RETENTION_WORKER_SECRET"] ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const Route = createFileRoute("/api/internal/retention")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorised(request)) {
          return Response.json({ error: "Unauthorised" }, { status: 401 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await (supabaseAdmin as any).rpc("purge_expired_ai_analyses");
          if (error) throw error;
          return Response.json({
            ok: true,
            expiredAiAnalysesRemoved: typeof data === "number" ? data : 0,
            completedAt: new Date().toISOString(),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Retention worker failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
