import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { enforcePublicRateLimit } from "@/lib/public-rate-limit.server";

const Input = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(5).max(5000),
  language: z.string().max(8).default("de"),
  page: z.string().max(200).optional(),
});

/**
 * Public contact form submission. Writes to `contact_messages` (staff-only
 * reads) using the service client after validating and rate-limiting input.
 */
export const submitContactMessage = createServerFn({ method: "POST" })
  .validator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }) => {
    await enforcePublicRateLimit({
      scope: "public-contact",
      limit: 5,
      windowSeconds: 3600,
      subject: data.email.toLowerCase(),
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      full_name: data.fullName,
      email: data.email,
      message: data.message,
      language: data.language,
      page: data.page ?? null,
    });
    if (error) throw new Error(error.message);

    // Mirror into the staff enquiry inbox so it enters the SLA workflow.
    const { error: enquiryError } = await (supabaseAdmin.from("enquiries") as any).insert({
      full_name: data.fullName,
      email: data.email,
      subject: data.message.slice(0, 80),
      message: data.message,
      language: data.language,
      source_page: data.page ?? null,
      status: "new",
      priority: "normal",
    });
    if (enquiryError) throw new Error(enquiryError.message);

    return { ok: true };
  });
