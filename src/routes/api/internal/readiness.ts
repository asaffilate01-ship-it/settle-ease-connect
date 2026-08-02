import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";

function authorised(request: Request): boolean {
  const expected = process.env.READINESS_TOKEN ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const Route = createFileRoute("/api/internal/readiness")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorised(request)) return Response.json({ status: "unauthorised" }, { status: 401 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin.from("subscription_plans").select("id").limit(1);
          if (error) throw error;
          return Response.json(
            { status: "ready", database: "ok" },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json({ status: "not_ready", database: "unavailable" }, { status: 503 });
        }
      },
    },
  },
});
