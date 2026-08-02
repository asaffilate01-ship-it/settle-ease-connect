const required = [
  "APP_URL",
  "APP_VERSION",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "LOVABLE_API_KEY",
  "VAPID_PUBLIC_KEY",
  "VITE_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "VITE_NATIVE_PUSH_ENABLED",
  "PAYMENTS_ENV",
  "VITE_PAYMENTS_CLIENT_TOKEN",
  "RATE_LIMIT_SALT",
  "READINESS_TOKEN",
  "VITE_PUBLIC_LEGAL_NAME",
  "VITE_PUBLIC_LEGAL_STREET",
  "VITE_PUBLIC_LEGAL_POSTAL_CITY",
  "VITE_PUBLIC_MANAGING_DIRECTOR",
  "VITE_PUBLIC_REGISTER_COURT",
  "VITE_PUBLIC_REGISTER_NUMBER",
  "VITE_PUBLIC_VAT_ID",
  "VITE_PUBLIC_EDITORIAL_RESPONSIBLE",
  "VITE_PUBLIC_SUPPORT_EMAIL",
  "VITE_PUBLIC_LEGAL_EMAIL",
  "VITE_PUBLIC_PRIVACY_EMAIL",
  "VITE_PUBLIC_DPO_EMAIL",
  "PARTNER_DELIVERY_WORKER_SECRET",
  "PARTNER_DELIVERY_ALLOWED_HOSTS",
  "EMAIL_DELIVERY_ENDPOINT",
  "EMAIL_DELIVERY_BEARER_TOKEN",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TEAM_EMAIL",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) fail(`Production configuration is incomplete:\n- ${missing.join("\n- ")}`);
if (process.env.NODE_ENV !== "production") fail("NODE_ENV must be 'production'.");
if (process.env.PAYMENTS_ENV !== "live") fail("PAYMENTS_ENV must be 'live' for production.");

const appUrl = absoluteHttps("APP_URL");
absoluteHttps("EMAIL_DELIVERY_ENDPOINT");

if (
  process.env.VITE_SUPABASE_URL !== process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY !== process.env.SUPABASE_PUBLISHABLE_KEY
)
  fail("Client and server Supabase URL/publishable-key values must match.");
if (process.env.VITE_VAPID_PUBLIC_KEY !== process.env.VAPID_PUBLIC_KEY) {
  fail("Client and server VAPID public keys must match.");
}
if (process.env.VITE_NATIVE_PUSH_ENABLED === "true") {
  absoluteHttps("NATIVE_PUSH_DELIVERY_ENDPOINT");
  if ((process.env.NATIVE_PUSH_DELIVERY_BEARER_TOKEN?.length ?? 0) < 32) {
    fail(
      "NATIVE_PUSH_DELIVERY_BEARER_TOKEN must contain at least 32 characters when native push is enabled.",
    );
  }
} else if (process.env.VITE_NATIVE_PUSH_ENABLED !== "false") {
  fail("VITE_NATIVE_PUSH_ENABLED must be 'true' or 'false'.");
}

if (process.env.ENABLE_SANDBOX_PAYOUT_LEDGER === "true") {
  fail("ENABLE_SANDBOX_PAYOUT_LEDGER must be false in production.");
}
if (process.env.ENABLE_PARTNER_DEMOS === "true") {
  fail("ENABLE_PARTNER_DEMOS must be false in production.");
}

for (const name of [
  "RATE_LIMIT_SALT",
  "READINESS_TOKEN",
  "PARTNER_DELIVERY_WORKER_SECRET",
  "EMAIL_DELIVERY_BEARER_TOKEN",
]) {
  if ((process.env[name]?.length ?? 0) < 32) fail(`${name} must contain at least 32 characters.`);
}

const livePaymentVariables = ["STRIPE_LIVE_API_KEY", "PAYMENTS_LIVE_WEBHOOK_SECRET"];
const missingPayments = livePaymentVariables.filter((name) => !process.env[name]?.trim());
if (missingPayments.length > 0 || !process.env.VITE_PAYMENTS_CLIENT_TOKEN.startsWith("pk_live_")) {
  fail("Live Stripe client, API and webhook credentials must be configured together.");
}
if (!process.env.STRIPE_LIVE_API_KEY.startsWith("sk_live_")) {
  fail("STRIPE_LIVE_API_KEY must be a live secret key.");
}
if (!process.env.PAYMENTS_LIVE_WEBHOOK_SECRET.startsWith("whsec_")) {
  fail("PAYMENTS_LIVE_WEBHOOK_SECRET must be a Stripe webhook signing secret.");
}
if (!/^(mailto:|https:\/\/)/.test(process.env.VAPID_SUBJECT)) {
  fail("VAPID_SUBJECT must start with mailto: or https://.");
}

const allowedOrigins = (process.env.PAYMENTS_ALLOWED_RETURN_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
for (const origin of allowedOrigins) {
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.origin !== origin)
    fail("Payment return allowlist entries must be HTTPS origins.");
}
if (!allowedOrigins.includes(appUrl.origin)) {
  fail("PAYMENTS_ALLOWED_RETURN_ORIGINS must include the APP_URL origin.");
}

console.log("Production environment checks passed.");

function absoluteHttps(name) {
  let value;
  try {
    value = new URL(process.env[name]);
  } catch {
    fail(`${name} must be an absolute URL.`);
  }
  if (value.protocol !== "https:") fail(`${name} must use HTTPS.`);
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
