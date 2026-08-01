import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

export type BillingSubscription = {
  id: string;
  plan_code: string | null;
  plan_name: string | null;
  monthly_price_eur: number | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
};

export type BillingFuneralPolicy = {
  id: string;
  policy_number: string | null;
  insurer_name: string;
  benefit_eur: number;
  premium_eur: number;
  premium_cadence: string;
  household_kind: string;
  adults_covered: number;
  children_covered: number;
  start_date: string | null;
  renewal_date: string | null;
  status: string;
};

export type BillingOverview = {
  subscription: BillingSubscription | null;
  funeralPolicies: BillingFuneralPolicy[];
  monthlyCommitmentEur: number;
};

/** Subscription + funeral cover state straight from the database (RLS-scoped). */
export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingOverview> => {
    const sb = context.supabase;

    const { data: sub } = await sb
      .from("subscriptions")
      .select(
        "id, plan_code, status, current_period_start, current_period_end, cancel_at_period_end, stripe_customer_id",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let planName: string | null = null;
    let monthlyPrice: number | null = null;
    if (sub?.plan_code) {
      const { data: plan } = await sb
        .from("subscription_plans")
        .select("name, monthly_price_eur")
        .eq("code", sub.plan_code)
        .maybeSingle();
      planName = plan?.name ?? null;
      monthlyPrice = plan?.monthly_price_eur != null ? Number(plan.monthly_price_eur) : null;
    }

    const { data: policies } = await sb
      .from("funeral_policies")
      .select(
        "id, policy_number, insurer_name, benefit_eur, premium_eur, premium_cadence, household_kind, adults_covered, children_covered, start_date, renewal_date, status",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    const funeralPolicies = (policies ?? []).map((p) => ({
      ...p,
      premium_eur: Number(p.premium_eur),
    })) as BillingFuneralPolicy[];

    const funeralMonthly = funeralPolicies
      .filter((p) => p.status === "active" || p.status === "pending")
      .reduce((sum, p) => {
        const per = p.premium_cadence === "yearly"
          ? p.premium_eur / 12
          : p.premium_cadence === "quarterly"
            ? p.premium_eur / 3
            : p.premium_cadence === "single"
              ? 0
              : p.premium_eur;
        return sum + per;
      }, 0);

    return {
      subscription: sub
        ? ({ ...sub, plan_name: planName, monthly_price_eur: monthlyPrice } as BillingSubscription)
        : null,
      funeralPolicies,
      monthlyCommitmentEur:
        Math.round(((monthlyPrice ?? 0) + funeralMonthly) * 100) / 100,
    };
  });

export type BillingInvoice = {
  id: string;
  number: string | null;
  status: string | null;
  description: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: string | null;
  due_date: string | null;
  period_end: string | null;
  hosted_invoice_url: string | null;
  pdf_url: string | null;
};

export type BillingUpcoming = {
  amount_due: number;
  currency: string;
  next_payment_attempt: string | null;
  period_end: string | null;
} | null;

export type BillingHistoryResult =
  | {
      invoices: BillingInvoice[];
      upcoming: BillingUpcoming;
      totals: { paidToDate: number; outstanding: number; currency: string };
      has_more: boolean;
    }
  | { error: string };

const ZERO_DECIMAL = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);
const THREE_DECIMAL = new Set(["bhd", "jod", "kwd", "omr", "tnd"]);

function toMajor(amount: number | null | undefined, currency: string): number {
  const value = amount ?? 0;
  const c = (currency ?? "eur").toLowerCase();
  if (ZERO_DECIMAL.has(c)) return value;
  if (THREE_DECIMAL.has(c)) return value / 1000;
  return value / 100;
}

function iso(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function findCustomerIds(
  stripe: ReturnType<typeof createStripeClient>,
  options: { userId: string; email?: string },
): Promise<string[]> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  const ids = new Set<string>();

  const subs = await stripe.subscriptions.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 100,
  });
  for (const sub of subs.data) {
    const customer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (customer) ids.add(customer);
  }

  const customers = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 100,
  });
  for (const c of customers.data) ids.add(c.id);

  if (ids.size === 0 && options.email) {
    const byEmail = await stripe.customers.list({ email: options.email, limit: 100 });
    for (const c of byEmail.data) ids.add(c.id);
  }
  return [...ids];
}

/**
 * Payments made + payments due, straight from Stripe. Returns a serializable
 * `{ error }` shape on Stripe failures so the client can surface the real
 * message instead of a generic 500.
 */
export const getBillingHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        environment: z.enum(["sandbox", "live"]),
        startingAfter: z.string().max(255).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<BillingHistoryResult> => {
    try {
      const stripe = createStripeClient(data.environment as StripeEnv);
      const {
        data: { user },
      } = await context.supabase.auth.getUser();

      const customerIds = await findCustomerIds(stripe, {
        userId: context.userId,
        email: user?.email ?? undefined,
      });

      if (customerIds.length === 0) {
        return {
          invoices: [],
          upcoming: null,
          totals: { paidToDate: 0, outstanding: 0, currency: "eur" },
          has_more: false,
        };
      }

      const invoices: BillingInvoice[] = [];
      let hasMore = false;

      for (const customerId of customerIds) {
        const list = await stripe.invoices.list({
          customer: customerId,
          limit: 50,
          ...(data.startingAfter && { starting_after: data.startingAfter }),
        });
        hasMore = hasMore || list.has_more;
        for (const inv of list.data) {
          const line = inv.lines?.data?.[0];
          invoices.push({
            id: inv.id ?? "",
            number: inv.number ?? null,
            status: inv.status ?? null,
            description:
              inv.description ?? (line as { description?: string } | undefined)?.description ?? null,
            amount_due: toMajor(inv.amount_due, inv.currency),
            amount_paid: toMajor(inv.amount_paid, inv.currency),
            currency: inv.currency,
            created: iso(inv.created),
            due_date: iso(inv.due_date),
            period_end: iso((inv as { period_end?: number }).period_end),
            hosted_invoice_url: inv.hosted_invoice_url ?? null,
            pdf_url: inv.invoice_pdf ?? null,
          });
        }
      }

      invoices.sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));

      let upcoming: BillingUpcoming = null;
      try {
        const openUpcoming = invoices.find((i) => i.status === "open" || i.status === "draft");
        if (openUpcoming) {
          upcoming = {
            amount_due: openUpcoming.amount_due,
            currency: openUpcoming.currency,
            next_payment_attempt: openUpcoming.due_date,
            period_end: openUpcoming.period_end,
          };
        }
      } catch {
        upcoming = null;
      }

      const currency = invoices[0]?.currency ?? "eur";
      const paidToDate =
        Math.round(invoices.reduce((s, i) => s + i.amount_paid, 0) * 100) / 100;
      const outstanding =
        Math.round(
          invoices
            .filter((i) => i.status === "open" || i.status === "uncollectible")
            .reduce((s, i) => s + (i.amount_due - i.amount_paid), 0) * 100,
        ) / 100;

      return {
        invoices,
        upcoming,
        totals: { paidToDate, outstanding, currency },
        has_more: hasMore,
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
