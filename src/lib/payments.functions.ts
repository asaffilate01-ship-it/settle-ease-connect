import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data: staff } = await context.supabase.rpc("is_internal", {
    _user_id: context.userId,
  });
  if (!staff) throw new Error("Forbidden: staff only");
}

export const listEscrowInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: "held_escrow" | "released" | "paid" } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertInternal(context);
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
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      invoiceId: z.string().uuid(),
      notes: z.string().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const { data: inv, error: invErr } = await context.supabase
      .from("case_invoices")
      .select("id, case_id, expert_id, amount_eur, payout_to_expert_eur, platform_fee_eur, status")
      .eq("id", data.invoiceId)
      .single();
    if (invErr || !inv) throw new Error("Invoice not found");
    if (inv.status !== "held_escrow" && inv.status !== "paid") {
      throw new Error(`Cannot release from status "${inv.status}"`);
    }
    const releasedAt = new Date().toISOString();
    const { error: updErr } = await context.supabase
      .from("case_invoices")
      .update({ status: "released", released_at: releasedAt })
      .eq("id", inv.id);
    if (updErr) throw new Error(updErr.message);

    const payoutAmount = inv.payout_to_expert_eur ?? inv.amount_eur;
    const { error: payErr } = await context.supabase.from("expert_payouts").insert({
      expert_id: inv.expert_id,
      case_id: inv.case_id,
      invoice_id: inv.id,
      period_month: releasedAt.slice(0, 7) + "-01",
      kind: "escrow_release",
      description: data.notes ?? "Escrow released to expert",
      gross_eur: inv.amount_eur,
      amount_eur: payoutAmount,
      currency: "EUR",
      status: "pending",
      created_by: context.userId,
    });
    if (payErr) throw new Error(payErr.message);
    return { ok: true, released_at: releasedAt };
  });

const STUDENT_COUPON_ID = "STUDENT20";
const TIER_PRICE_PREFIXES = ["basic", "plus", "complete"] as const;

function isTierPriceId(priceId: string): boolean {
  // Tier lookup keys start with basic/plus/complete; funeral cover starts with "funeral_cover_"
  if (priceId.startsWith("funeral_cover_")) return false;
  return TIER_PRICE_PREFIXES.some((p) => priceId === p || priceId.startsWith(`${p}_`));
}

async function ensureStudentCoupon(
  stripe: ReturnType<typeof createStripeClient>,
): Promise<string> {
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
  .inputValidator((data: {
    priceId: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const { supabase, userId, claims } = context;
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId], expand: ["data.product"] });
      if (!prices.data.length) throw new Error(`Price not found: ${data.priceId}`);
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      const email = (claims as { email?: string } | null)?.email ?? undefined;
      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      // Student discount: 20% off tiers only, when user has an approved student verification.
      let discountCoupon: string | undefined;
      if (isTierPriceId(data.priceId)) {
        const { data: student } = await supabase
          .from("student_verifications")
          .select("status, valid_until")
          .eq("user_id", userId)
          .eq("status", "approved")
          .maybeSingle();
        const stillValid = student && (!student.valid_until || new Date(student.valid_until as string) > new Date());
        if (stillValid) {
          discountCoupon = await ensureStudentCoupon(stripe);
        }
      }

      let productDescription: string | undefined;
      if (!isRecurring) {
        const productId = typeof stripePrice.product === "string"
          ? stripePrice.product
          : (stripePrice.product as { id: string }).id;
        const product = await stripe.products.retrieve(productId);
        productDescription = product.name;
      }

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        ...(discountCoupon && { discounts: [{ coupon: discountCoupon }] }),
        ...(!isRecurring && productDescription && {
          payment_intent_data: { description: productDescription },
        }),
        metadata: { userId, priceId: data.priceId },
        ...(isRecurring && {
          subscription_data: { metadata: { userId, priceId: data.priceId } },
        }),
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
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
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
