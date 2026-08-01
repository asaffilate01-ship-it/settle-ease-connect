import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowSeconds: number;
  identifier?: string;
};

function requestIdentifier(): string {
  const request = getRequest();
  const headers = request?.headers;
  const forwarded = headers?.get("cf-connecting-ip")
    ?? headers?.get("x-real-ip")
    ?? headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = headers?.get("user-agent")?.slice(0, 160) ?? "unknown-agent";
  return `${forwarded ?? "unknown-ip"}|${userAgent}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<void> {
  const keyHash = await sha256(options.identifier ?? requestIdentifier());
  const { data, error } = await supabaseAdmin.rpc(
    "consume_public_rate_limit" as never,
    {
      _scope: options.scope,
      _key_hash: keyHash,
      _limit: options.limit,
      _window_seconds: options.windowSeconds,
    } as never,
  );
  if (error) throw new Error("Rate-limit service unavailable");
  if (!data) throw new Error("TOO_MANY_REQUESTS: please wait before trying again");
}

export function rejectBotField(value: unknown): void {
  if (typeof value === "string" && value.trim().length > 0) {
    throw new Error("Invalid submission");
  }
}
