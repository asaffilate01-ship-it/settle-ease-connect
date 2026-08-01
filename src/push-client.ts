import { createHmac } from "node:crypto";

export function createPartnerSignature(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function partnerRetryDelayMinutes(attemptNumber: number) {
  return Math.min(5 * 2 ** Math.max(attemptNumber - 1, 0), 12 * 60);
}
