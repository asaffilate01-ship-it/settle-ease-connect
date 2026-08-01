const required = [
  "APP_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "LOVABLE_API_KEY",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "PAYMENTS_ENV",
  "VITE_PAYMENTS_CLIENT_TOKEN",
  "VITE_PUBLIC_LEGAL_NAME",
  "VITE_PUBLIC_LEGAL_STREET",
  "VITE_PUBLIC_LEGAL_POSTAL_CITY",
  "VITE_PUBLIC_MANAGING_DIRECTOR",
  "VITE_PUBLIC_REGISTER_COURT",
  "VITE_PUBLIC_REGISTER_NUMBER",
  "VITE_PUBLIC_EDITORIAL_RESPONSIBLE",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Production configuration is incomplete:\n- ${missing.join("\n- ")}`);
  process.exit(1);
}

if (process.env.PAYMENTS_ENV !== "live") {
  console.error("PAYMENTS_ENV must be 'live' for a production release.");
  process.exit(1);
}

let appUrl;
try {
  appUrl = new URL(process.env.APP_URL);
} catch {
  console.error("APP_URL must be an absolute URL.");
  process.exit(1);
}
if (appUrl.protocol !== "https:") {
  console.error("APP_URL must use HTTPS in production.");
  process.exit(1);
}

if (
  process.env.VITE_SUPABASE_URL !== process.env.SUPABASE_URL
  || process.env.VITE_SUPABASE_PUBLISHABLE_KEY !== process.env.SUPABASE_PUBLISHABLE_KEY
) {
  console.error("Client and server Supabase URL/publishable-key values must match.");
  process.exit(1);
}

if (process.env.ENABLE_SANDBOX_PAYOUT_LEDGER === "true") {
  console.error("ENABLE_SANDBOX_PAYOUT_LEDGER must not be enabled in production.");
  process.exit(1);
}

if (process.env.ENABLE_PARTNER_DEMOS === "true") {
  console.error("ENABLE_PARTNER_DEMOS must not be enabled in production.");
  process.exit(1);
}

const livePaymentVariables = ["STRIPE_LIVE_API_KEY", "PAYMENTS_LIVE_WEBHOOK_SECRET"];
const missingPayments = livePaymentVariables.filter((name) => !process.env[name]?.trim());
if (missingPayments.length > 0 || !process.env.VITE_PAYMENTS_CLIENT_TOKEN.startsWith("pk_live_")) {
  console.error("Live Stripe client, API and webhook credentials must be configured together.");
  process.exit(1);
}

console.log("Production environment checks passed.");
