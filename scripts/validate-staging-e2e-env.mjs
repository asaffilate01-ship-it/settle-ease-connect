const roleNames = ["MEMBER", "STAFF", "AGENT", "EXPERT"];
const required = [
  "STAGING_URL",
  ...roleNames.flatMap((role) => [`E2E_${role}_EMAIL`, `E2E_${role}_PASSWORD`]),
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) fail(`Staging acceptance configuration is incomplete:\n- ${missing.join("\n- ")}`);

let stagingUrl;
try {
  stagingUrl = new URL(process.env.STAGING_URL);
} catch {
  fail("STAGING_URL must be an absolute URL.");
}
if (stagingUrl.protocol !== "https:") fail("STAGING_URL must use HTTPS.");
if (
  stagingUrl.hostname === "beistandplus.de" ||
  stagingUrl.hostname === "www.beistandplus.de"
) {
  fail("Authenticated acceptance tests must target staging, never the production hostname.");
}
if (
  stagingUrl.hostname === "localhost" ||
  stagingUrl.hostname.endsWith(".localhost") ||
  stagingUrl.hostname.endsWith(".lovable.app")
) {
  fail("STAGING_URL must use the reviewed staging domain, not localhost or a preview host.");
}

const emails = new Set();
for (const role of roleNames) {
  const email = process.env[`E2E_${role}_EMAIL`];
  const password = process.env[`E2E_${role}_PASSWORD`];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`E2E_${role}_EMAIL is invalid.`);
  if (password.length < 12) fail(`E2E_${role}_PASSWORD must contain at least 12 characters.`);
  if (emails.has(email.toLowerCase())) fail("Each staging role must use a distinct account.");
  emails.add(email.toLowerCase());
}

console.log(`Staging acceptance configuration passed for ${stagingUrl.origin}.`);

function fail(message) {
  console.error(message);
  process.exit(1);
}
