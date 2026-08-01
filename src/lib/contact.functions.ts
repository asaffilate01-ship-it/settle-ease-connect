import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  .inputValidator((raw: unknown) => Input.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Basic flood protection: max 5 messages per email per hour.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
      throw new Error("Too many messages sent recently. Please try again later.");
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      full_name: data.fullName,
      email: data.email,
      message: data.message,
      language: data.language,
      page: data.page ?? null,
    });
    if (error) throw new Error(error.message);

    return { ok: true };
  });
