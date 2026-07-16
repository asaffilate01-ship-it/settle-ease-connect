import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const logSessionEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    event: z.enum(["sign_in", "sign_out", "token_refresh", "password_change", "mfa_challenge", "passkey_enrolled", "passkey_removed"]),
    user_agent: z.string().max(500).optional(),
    device_label: z.string().max(120).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("session_activity").insert({
      user_id: context.userId,
      event: data.event,
      user_agent: data.user_agent ?? null,
      device_label: data.device_label ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMySessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("session_activity")
      .select("id, event, user_agent, device_label, ip, location_hint, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

/** List enrolled MFA/passkey factors for the current user via Supabase Auth. */
export const listMyFactors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.auth.mfa.listFactors();
    if (error) throw new Error(error.message);
    return data;
  });
