import type { StripeEnv } from "@/lib/stripe.server";

const SUBSCRIPTION_TIERS = ["basic", "plus", "complete"] as const;
type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export function normalizeSubscriptionPlanCode(
  value: string | null | undefined,
): SubscriptionTier | null {
  if (!value) return null;
  return SUBSCRIPTION_TIERS.find((tier) => value === tier || value.startsWith(`${tier}_`)) ?? null;
}

export function resolveStripeEnvironment(): StripeEnv {
  const configured = process.env.PAYMENTS_ENV;
  if (configured === "sandbox" || configured === "live") return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PAYMENTS_ENV must be configured on the server");
  }
  return "sandbox";
}

function configuredOrigins(appUrl: string, extraOrigins?: string[]): Set<string> {
  const fromEnvironment = (process.env.PAYMENTS_ALLOWED_RETURN_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([new URL(appUrl).origin, ...fromEnvironment, ...(extraOrigins ?? [])]);
}

export function resolveAllowedReturnUrl(
  requestedUrl: string | undefined,
  fallbackPath: string,
  appUrl = process.env.APP_URL ?? "http://localhost:3000",
  extraOrigins?: string[],
): string {
  const base = new URL(appUrl);
  const resolved = new URL(requestedUrl ?? fallbackPath, base);
  if (!configuredOrigins(base.href, extraOrigins).has(resolved.origin)) {
    throw new Error("Invalid payment return URL");
  }
  if (resolved.protocol !== "https:" && resolved.hostname !== "localhost") {
    throw new Error("Payment return URL must use HTTPS");
  }
  return resolved.href;
}

export function assertSandboxPayoutLedgerEnabled(): void {
  if (
    resolveStripeEnvironment() !== "sandbox" ||
    process.env.ENABLE_SANDBOX_PAYOUT_LEDGER !== "true"
  ) {
    throw new Error(
      "Payout ledger is disabled. Configure a regulated live payout workflow before releasing funds.",
    );
  }
}
