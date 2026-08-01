import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { processPartnerDeliveryQueue } from "@/lib/partner-delivery.server";

function authorised(request: Request) {
  const expected = process.env["PARTNER_DELIVERY_WORKER_SECRET"];
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/internal/partner-deliveries")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorised(request)) {
          return new Response(JSON.stringify({ error: "Unauthorised" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        const url = new URL(request.url);
        const batch = Number.parseInt(url.searchParams.get("batch") ?? "10", 10);
        try {
          const summary = await processPartnerDeliveryQueue(
            Number.isFinite(batch) ? batch : 10,
          );
          return new Response(JSON.stringify({ ok: true, ...summary }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Delivery worker failed";
          return new Response(JSON.stringify({ ok: false, error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
