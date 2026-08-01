import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ContactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(3).max(200),
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
    const { data: enquiry, error } = await supabaseAdmin
      .from("contact_enquiries" as never)
      .insert({
        full_name: data.fullName,
        email: data.email.toLowerCase(),
        subject: data.subject,
        message: data.message,
        preferred_language: data.preferredLanguage ?? null,
        source: "contact_page",
      } as never)
      .select("id")
      .single();
    if (error) throw new Error("We could not save your message. Please email us instead.");
    const teamEmail = process.env.CONTACT_TEAM_EMAIL;
    if (teamEmail) {
      try {
        const { deliverTransactionalEmail } = await import("@/lib/email-delivery.server");
        await deliverTransactionalEmail({
          to: teamEmail,
          subject: `New enquiry: ${data.subject}`,
          text: `${data.fullName} (${data.email})\n\n${data.message}`,
          replyTo: data.email,
          metadata: { enquiryId: String((enquiry as { id?: string } | null)?.id ?? "") },
        });
      } catch (notificationError) {
        console.error("[contact] team notification failed", notificationError);
      }
    }
    return { ok: true as const };
  });
