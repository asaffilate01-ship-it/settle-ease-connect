import { timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { processPartnerDeliveryQueue } from "@/lib/partner-delivery.server";

function authorised(request: Request) {
  const expected = process.env.PARTNER_DELIVERY_WORKER_SECRET;
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
        if (!authorised(request)) return new Response("Unauthorized", { status: 401 });
        try {
          const raw = Number(new URL(request.url).searchParams.get("batch") ?? "10");
          const summary = await processPartnerDeliveryQueue(Number.isFinite(raw) ? raw : 10);
          return Response.json(summary);
        } catch (error) {
          console.error("[partner-delivery] worker failed", error);
          return new Response("Partner delivery worker failed", { status: 500 });
        }
      },
    },
  },
});
