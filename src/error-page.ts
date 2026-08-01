export function assertPartnerEndpointAllowed(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Partner endpoints must use HTTPS.");
  const allowed = (process.env.PARTNER_DELIVERY_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) throw new Error("Partner endpoint allowlist is not configured.");
  const hostname = url.hostname.toLowerCase();
  if (!allowed.includes(hostname)) throw new Error(`Partner endpoint host ${hostname} is not allowlisted.`);
  return url.toString();
}

