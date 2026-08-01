const SUBSCRIPTION_PLANS = ["basic", "plus", "complete"] as const;
export type SubscriptionPlanCode = (typeof SUBSCRIPTION_PLANS)[number];

export function normalizeSubscriptionPlanCode(value: string): SubscriptionPlanCode | null {
  return SUBSCRIPTION_PLANS.find(
    (plan) => value === plan || value.startsWith(`${plan}_`),
  ) ?? null;
}

export function resolveAllowedReturnUrl(
  requested: string | undefined,
  fallbackPath: string,
  appUrlValue: string,
  additionalOrigins: string[] = [],
): string {
  const appUrl = new URL(appUrlValue);
  const allowedOrigins = new Set([appUrl.origin, ...additionalOrigins.filter(Boolean)]);
  const candidate = new URL(requested ?? fallbackPath, appUrl);
  if (!allowedOrigins.has(candidate.origin)) {
    throw new Error("Invalid payment return URL");
  }
  return candidate.toString();
}
