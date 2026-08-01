import { createHmac } from "node:crypto";

/** HMAC-SHA256 over `<unix timestamp>.<raw body>` — see OPERATIONAL_RELEASE.md §3. */
export function createPartnerSignature(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/** Exponential backoff: 5, 10, 20, 40 … minutes, capped at 12 hours. */
export function partnerRetryDelayMinutes(attemptNumber: number) {
  return Math.min(5 * 2 ** Math.max(attemptNumber - 1, 0), 12 * 60);
}
