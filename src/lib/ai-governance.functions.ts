import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2, requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const AI_NOTICE_VERSION = "2026-08-02";
export const AI_PROVIDER = "lovable-ai-gateway";
export const AI_PURPOSES = ["family_guidance", "document_analysis", "staff_knowledge"] as const;
export type AiPurpose = (typeof AI_PURPOSES)[number];

type AiContext = { supabase: any; userId: string };

export async function assertAiProcessingAllowed(context: AiContext, purpose: AiPurpose) {
  if (process.env["AI_PROCESSING_ENABLED"] !== "true") {
    throw new Error("AI processing is currently disabled.");
  }
  if (process.env["AI_PROVIDER_DPA_CONFIRMED"] !== "true") {
    throw new Error("AI processing is unavailable until the provider agreement is confirmed.");
  }
  const { data, error } = await context.supabase
    .from("ai_processing_consents")
    .select("consented, purposes, notice_version")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.consented || !data.purposes?.includes(purpose)) {
    throw new Error("Enable this AI purpose in Settings before continuing.");
  }
  if (data.notice_version !== AI_NOTICE_VERSION) {
    throw new Error("Review the updated AI notice in Settings before continuing.");
  }
}

export const getMyAiConsent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("ai_processing_consents")
      .select("consented, purposes, notice_version, provider, consented_at, withdrawn_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      data ?? {
        consented: false,
        purposes: [],
        notice_version: AI_NOTICE_VERSION,
        provider: AI_PROVIDER,
        consented_at: null,
        withdrawn_at: null,
      }
    );
  });

export const updateMyAiConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        consented: z.boolean(),
        purposes: z.array(z.enum(AI_PURPOSES)).max(AI_PURPOSES.length),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const purposes = data.consented ? [...new Set(data.purposes)] : [];
    if (data.consented && purposes.length === 0) {
      throw new Error("Choose at least one AI purpose.");
    }
    const now = new Date().toISOString();
    const { error } = await (context.supabase as any).from("ai_processing_consents").upsert({
      user_id: context.userId,
      consented: data.consented,
      purposes,
      notice_version: AI_NOTICE_VERSION,
      provider: AI_PROVIDER,
      consented_at: data.consented ? now : null,
      withdrawn_at: data.consented ? null : now,
      updated_at: now,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
