import { createHmac } from "node:crypto";

export function createPartnerSignature(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
}

export function partnerRetryDelayMinutes(attempt: number): number {
  const safeAttempt = Math.max(1, Math.floor(attempt));
  return Math.min(5 * 2 ** (safeAttempt - 1), 720);
}
