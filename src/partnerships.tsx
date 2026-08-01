import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { normalizeSubscriptionPlanCode } from "@/lib/payments-policy";

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error("Supabase webhook configuration is missing");
    supabaseClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

function subscriptionPlanCode(subscription: Stripe.Subscription): "basic" | "plus" | "complete" {
  const item = subscription.items.data[0];
  const raw =
    item?.price.lookup_key
    ?? item?.price.metadata?.lovable_external_id
    ?? subscription.metadata?.priceId
    ?? "";
  const plan = normalizeSubscriptionPlanCode(raw);
  if (!plan) throw new Error(`Unsupported subscription price: ${raw || "unknown"}`);
  return plan;
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) throw new Error(`Subscription ${subscription.id} has no userId metadata`);

  const item = subscription.items.data[0];
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;
  const payload = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    plan_code: subscriptionPlanCode(subscription),
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  const database = getSupabase();
  const { data: existing, error: lookupError } = await database
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const result = existing
    ? await database.from("subscriptions").update(payload).eq("id", existing.id)
    : await database.from("subscriptions").insert(payload);
  if (result.error) throw result.error;
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, env: StripeEnv) {
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
  if (error) throw error;
}

async function claimEvent(event: Stripe.Event, env: StripeEnv): Promise<boolean> {
  const database = getSupabase();
  const { error: insertError } = await database.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
    environment: env,
    status: "processing",
  });
  if (!insertError) return true;
  if (insertError.code !== "23505") throw insertError;

  const { data: existing, error: lookupError } = await database
    .from("stripe_webhook_events")
    .select("status, received_at")
    .eq("event_id", event.id)
    .single();
  if (lookupError) throw lookupError;
  if (existing.status === "succeeded") return false;

  // A worker can terminate after claiming an event but before marking it
  // failed. Treat a five-minute-old processing claim as abandoned so Stripe's
  // retry can recover it. Matching the old timestamp makes the lease takeover
  // safe when multiple retries arrive together.
  const staleProcessingClaim =
    existing.status === "processing"
    && Date.now() - new Date(existing.received_at).getTime() > 5 * 60_000;
  if (existing.status !== "failed" && !staleProcessingClaim) return false;

  const { data: reclaimed, error: retryError } = await database
    .from("stripe_webhook_events")
    .update({
      status: "processing",
      error_message: null,
      received_at: new Date().toISOString(),
      processed_at: null,
    })
    .eq("event_id", event.id)
    .eq("status", existing.status)
    .eq("received_at", existing.received_at)
    .select("event_id")
    .maybeSingle();
  if (retryError) throw retryError;
  return Boolean(reclaimed);
}

async function finishEvent(eventId: string, status: "succeeded" | "failed", error?: string) {
  const { error: updateError } = await getSupabase()
    .from("stripe_webhook_events")
    .update({
      status,
      error_message: error?.slice(0, 1000) ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
  if (updateError) throw updateError;
}

async function processEvent(event: Stripe.Event, env: StripeEnv) {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object as Stripe.Subscription, env);
      return;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, env);
      return;
    default:
      return;
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return new Response("Invalid webhook environment", { status: 400 });
        }
        const env: StripeEnv = rawEnv;

        let event: Stripe.Event;
        try {
          event = await verifyWebhook(request, env);
        } catch (error) {
          console.error("[webhook] signature verification failed", error);
          return new Response("Invalid webhook signature", { status: 400 });
        }

        try {
          if (!(await claimEvent(event, env))) {
            return Response.json({ received: true, duplicate: true });
          }
          await processEvent(event, env);
          await finishEvent(event.id, "succeeded");
          return Response.json({ received: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown webhook failure";
          console.error("[webhook] processing failed", event.id, message);
          try {
            await finishEvent(event.id, "failed", message);
          } catch (ledgerError) {
            console.error("[webhook] could not update event ledger", ledgerError);
          }
          return new Response("Webhook processing failed", { status: 500 });
        }
      },
    },
  },
});
