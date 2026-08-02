const raw = process.env.CAPACITOR_SERVER_URL?.trim();
if (!raw) {
  console.error("CAPACITOR_SERVER_URL is required for a mobile sync.");
  process.exit(1);
}
let url;
try {
  url = new URL(raw);
} catch {
  console.error("CAPACITOR_SERVER_URL must be an absolute URL.");
  process.exit(1);
}
if (url.protocol !== "https:") {
  console.error("CAPACITOR_SERVER_URL must use HTTPS.");
  process.exit(1);
}
if (/lovable\.app$|lovableproject\.com$/.test(url.hostname)) {
  console.error("Use the production custom domain, not a Lovable preview domain.");
  process.exit(1);
}
console.log(`Mobile shell will load ${url.origin}.`);
