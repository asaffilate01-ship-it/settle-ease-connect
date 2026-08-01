/**
 * Partner delivery endpoint allow-list.
 *
 * Only hostnames registered in PARTNER_DELIVERY_ALLOWED_HOSTS may receive a
 * signed delivery, and only over HTTPS. Wildcards are intentionally not
 * supported — see OPERATIONAL_RELEASE.md §3.
 */
export function assertPartnerEndpointAllowed(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Partner endpoint is not a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("Partner endpoints must use HTTPS.");
  }
  const allowed = (process.env["PARTNER_DELIVERY_ALLOWED_HOSTS"] ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) {
    throw new Error("PARTNER_DELIVERY_ALLOWED_HOSTS is not configured.");
  }
  if (!allowed.includes(url.hostname.toLowerCase())) {
    throw new Error(`Partner host ${url.hostname} is not on the delivery allow-list.`);
  }
  return url.toString();
}
