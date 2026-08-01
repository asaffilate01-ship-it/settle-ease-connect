import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ContactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(4000),
  preferredLanguage: z.string().trim().min(2).max(8).optional(),
  website: z.string().max(0).optional(),
});

export const submitContactEnquiry = createServerFn({ method: "POST" })
  .validator((raw: unknown) => ContactSchema.parse(raw))
  .handler(async ({ data }) => {
    const { enforceRateLimit, rejectBotField } = await import("@/lib/public-api-guard.server");
    rejectBotField(data.website);
    await enforceRateLimit({ scope: "contact", limit: 5, windowSeconds: 3600 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_enquiries" as never).insert({
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      message: data.message,
      preferred_language: data.preferredLanguage ?? null,
      source: "contact_page",
    } as never);
    if (error) throw new Error("We could not save your message. Please email us instead.");
    return { ok: true as const };
  });
