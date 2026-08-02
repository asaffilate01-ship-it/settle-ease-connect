import { getRequest } from "@tanstack/react-start/server";

function requestAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enforcePublicRateLimit(options: {
  scope: string;
  limit: number;
  windowSeconds: number;
  subject?: string;
}): Promise<void> {
  const request = getRequest();
  if (!request) throw new Error("Request context is unavailable");
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt && process.env.NODE_ENV === "production") {
    throw new Error("Public rate limiting is not configured");
  }
  const address = requestAddress(request);
  const userAgent = request.headers.get("user-agent")?.slice(0, 160) ?? "unknown";
  const keyHash = await sha256(
    `${salt ?? "development"}|${address}|${userAgent}|${options.subject ?? ""}`,
  );
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: allowed, error } = await (supabaseAdmin as any).rpc("consume_public_rate_limit", {
    _scope: options.scope,
    _key_hash: keyHash,
    _limit: options.limit,
    _window_seconds: options.windowSeconds,
  });
  if (error) throw new Error("Rate-limit service is unavailable");
  if (!allowed) throw new Error("Too many requests. Please try again later.");
}
