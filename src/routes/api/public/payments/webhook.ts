import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { resolveStripeEnvironment } from "@/lib/payments-policy";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("[webhook] no userId in subscription metadata", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    subscription.metadata?.priceId ||
    item?.price?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  const { error } = await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        plan_code: priceId,
        status: subscription.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
  if (error) throw new Error(error.message);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
  if (error) throw new Error(error.message);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[webhook] invalid env:", rawEnv);
          return Response.json({ error: "invalid environment" }, { status: 400 });
        }
        const env: StripeEnv = rawEnv;
        if (env !== resolveStripeEnvironment()) {
          return Response.json({ error: "environment is not enabled" }, { status: 404 });
        }
        let eventId: string | null = null;
        try {
          const event = await verifyWebhook(request, env);
          eventId = event.id;
          const { data: claimed, error: claimError } = await getSupabase().rpc(
            "claim_stripe_webhook_event",
            {
              _event_id: event.id,
              _event_type: event.type,
              _environment: env,
            },
          );
          if (claimError) {
            throw new Error(claimError.message);
          }
          if (!claimed) {
            return Response.json({ received: true, duplicate: true });
          }
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
              await handleSubscriptionUpsert(event.data.object, env);
              break;
            case "customer.subscription.deleted":
              await handleSubscriptionDeleted(event.data.object, env);
              break;
            default:
              console.log("[webhook] unhandled event:", event.type);
          }
          const { error: completionError } = await getSupabase()
            .from("stripe_webhook_events")
            .update({
              status: "succeeded",
              processed_at: new Date().toISOString(),
              error_message: null,
            })
            .eq("event_id", event.id)
            .eq("environment", env);
          if (completionError) throw new Error(completionError.message);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[webhook] error:", e);
          if (eventId) {
            const { error: failureStatusError } = await getSupabase()
              .from("stripe_webhook_events")
              .update({
                status: "failed",
                processed_at: new Date().toISOString(),
                error_message:
                  e instanceof Error ? e.message.slice(0, 1000) : "Webhook processing failed",
              })
              .eq("event_id", eventId)
              .eq("environment", env)
              .eq("status", "processing");
            if (failureStatusError) {
              console.error(
                "[webhook] could not persist failed status:",
                failureStatusError.message,
              );
            }
          }
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
