import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2, requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import {
  assertSandboxPayoutLedgerEnabled,
  normalizeSubscriptionPlanCode,
  resolveAllowedReturnUrl,
  resolveStripeEnvironment,
} from "@/lib/payments-policy";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

async function assertFinance(context: { supabase: any; userId: string }) {
  const [{ data: admin }, { data: finance }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "finance" }),
  ]);
  if (!admin && !finance) throw new Error("Forbidden: finance or admin role required");
}

export const listEscrowInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .validator((d: { status?: "held_escrow" | "released" | "paid" } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertFinance(context);
    const status = data.status ?? "held_escrow";
    const { data: rows, error } = await context.supabase
      .from("case_invoices")
      .select(
        "id, case_id, expert_id, amount_eur, vat_eur, platform_fee_eur, payout_to_expert_eur, status, paid_at, released_at, created_at, experts!inner(full_name, email, profession, compensation_model)",
      )
      .eq("status", status)
      .order("paid_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const releaseEscrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) =>
    z
      .object({
        invoiceId: z.string().uuid(),
        notes: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertFinance(context);
    assertSandboxPayoutLedgerEnabled();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: releasedAt, error } = await (supabaseAdmin as any).rpc("queue_invoice_payout", {
      _invoice_id: data.invoiceId,
      _actor_user_id: context.userId,
      _notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true, released_at: releasedAt as string };
  });

/**
 * Auto-release all `held_escrow` invoices whose `paid_at` is older than N days
 * (default 14). Staff-only v1 SLA — a case manager clicks the button.
 */
export const autoReleaseEligibleEscrow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) =>
    z.object({ olderThanDays: z.number().int().min(1).max(90).default(14) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertFinance(context);
    assertSandboxPayoutLedgerEnabled();
    const cutoff = new Date(Date.now() - data.olderThanDays * 86_400_000).toISOString();
    const { data: eligible, error } = await context.supabase
      .from("case_invoices")
      .select("id, case_id, expert_id, amount_eur, payout_to_expert_eur")
      .eq("status", "held_escrow")
      .not("expert_id", "is", null)
      .lt("paid_at", cutoff);
    if (error) throw new Error(error.message);

    const released: string[] = [];
    const failed: { id: string; reason: string }[] = [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const inv of eligible ?? []) {
      const { error: releaseError } = await (supabaseAdmin as any).rpc("queue_invoice_payout", {
        _invoice_id: inv.id,
        _actor_user_id: context.userId,
        _notes: `Auto-released after ${data.olderThanDays}d SLA`,
      });
      if (releaseError) {
        failed.push({ id: inv.id, reason: releaseError.message });
        continue;
      }
      released.push(inv.id);
    }
    return { released_count: released.length, failed_count: failed.length, failed };
  });

const STUDENT_COUPON_ID = "STUDENT20";

async function ensureStudentCoupon(stripe: ReturnType<typeof createStripeClient>): Promise<string> {
  try {
    const existing = await stripe.coupons.retrieve(STUDENT_COUPON_ID);
    if (existing && !existing.deleted) return existing.id;
  } catch {
    // not found — create
  }
  const created = await stripe.coupons.create({
    id: STUDENT_COUPON_ID,
    percent_off: 20,
    duration: "forever",
    name: "Verified student — 20% off",
  });
  return created.id;
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      priceId: string;
      returnUrl: string;
      environment?: StripeEnv;
      clientPlatform?: "web" | "ios" | "android";
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      if (data.clientPlatform === "ios" || data.clientPlatform === "android") {
        throw new Error("Mobile purchases are disabled until native store billing is approved");
      }
      const { supabase, userId, claims } = context;
      if (!normalizeSubscriptionPlanCode(data.priceId)) {
        throw new Error("Unsupported subscription plan");
      }
      const { data: configuredPlan, error: planError } = await supabase
        .from("subscription_plans")
        .select("code")
        .eq("code", data.priceId)
        .eq("active", true)
        .maybeSingle();
      if (planError || !configuredPlan) {
        throw new Error("Subscription plan is not active");
      }

      const stripe = createStripeClient(resolveStripeEnvironment());
      const returnUrl = resolveAllowedReturnUrl(
        data.returnUrl,
        "/checkout/return?session_id={CHECKOUT_SESSION_ID}",
      );

      const prices = await stripe.prices.list({
        lookup_keys: [data.priceId],
        active: true,
        expand: ["data.product"],
      });
      if (!prices.data.length) throw new Error(`Price not found: ${data.priceId}`);
      const stripePrice = prices.data[0];
      if (stripePrice.type !== "recurring" || stripePrice.currency !== "eur") {
        throw new Error("Configured plan must be a recurring EUR price");
      }

      const email = (claims as { email?: string } | null)?.email ?? undefined;
      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      // Student discount: 20% off tiers only, when user has an approved student verification.
      let discountCoupon: string | undefined;
      const { data: student } = await supabase
        .from("student_verifications")
        .select("status, valid_until")
        .eq("user_id", userId)
        .eq("status", "approved")
        .maybeSingle();
      const stillValid =
        student && (!student.valid_until || new Date(student.valid_until as string) > new Date());
      if (stillValid) {
        discountCoupon = await ensureStudentCoupon(stripe);
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: returnUrl,
        customer: customerId,
        ...(discountCoupon && { discounts: [{ coupon: discountCoupon }] }),
        metadata: { userId, priceId: data.priceId },
        subscription_data: { metadata: { userId, priceId: data.priceId } },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      returnUrl?: string;
      environment?: StripeEnv;
      clientPlatform?: "web" | "ios" | "android";
    }) => data,
  )
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    if (data.clientPlatform === "ios" || data.clientPlatform === "android") {
      return { error: "Billing management is available on the web account" };
    }
    const { supabase, userId } = context;
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !sub?.stripe_customer_id) {
      return { error: "No billing account found. Complete a checkout first." };
    }
    try {
      const stripe = createStripeClient(resolveStripeEnvironment());
      const returnUrl = resolveAllowedReturnUrl(data.returnUrl, "/app/account");
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
