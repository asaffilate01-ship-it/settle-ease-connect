import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2 as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Enquiry inbox with SLA workflow. Staff-only: triage, assignment, status
 * transitions, internal notes and queued customer replies.
 */

const STATUSES = ["new", "in_progress", "waiting_customer", "resolved", "spam"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

async function requireStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
  if (!data) throw new Error("Staff only.");
}

export const listEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        status: z.enum(STATUSES).optional(),
        q: z.string().trim().max(200).optional(),
      })
      .default({})
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context as any);
    let query = context.supabase
      .from("enquiries")
      .select(
        "id, full_name, email, phone, subject, message, language, source_page, status, priority, assigned_to, sla_due_at, first_response_at, resolved_at, tags, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (data.status) query = query.eq("status", data.status);
    if (data.q) {
      const term = `%${data.q}%`;
      query = query.or(
        `full_name.ilike.${term},email.ilike.${term},subject.ilike.${term},message.ilike.${term}`,
      );
    }
    const { data: enquiries, error } = await query;
    if (error) throw new Error(error.message);

    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .limit(200);

    return { enquiries: enquiries ?? [], profiles: profiles ?? [] };
  });

export const getEnquiry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await requireStaff(context as any);
    const { data: enquiry, error } = await context.supabase
      .from("enquiries")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!enquiry) throw new Error("Enquiry not found.");
    const { data: notes } = await context.supabase
      .from("enquiry_notes")
      .select("id, body, note_type, delivery_status, author_user_id, created_at")
      .eq("enquiry_id", data.id)
      .order("created_at", { ascending: true });
    return { enquiry, notes: notes ?? [] };
  });

export const updateEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        assignedTo: z.string().uuid().nullable().optional(),
        tags: z.array(z.string().max(40)).max(12).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context as any);
    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch["status"] = data.status;
      if (data.status === "resolved") patch["resolved_at"] = new Date().toISOString();
    }
    if (data.priority) patch["priority"] = data.priority;
    if (data.assignedTo !== undefined) patch["assigned_to"] = data.assignedTo;
    if (data.tags) patch["tags"] = data.tags;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await (context.supabase.from("enquiries") as any)
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addEnquiryNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        enquiryId: z.string().uuid(),
        body: z.string().trim().min(1).max(5000),
        noteType: z.enum(["internal", "reply", "system"]).default("internal"),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context as any);

    let deliveryStatus: string | null = null;
    if (data.noteType === "reply") {
      const { data: enquiry } = await context.supabase
        .from("enquiries")
        .select("email, subject, first_response_at")
        .eq("id", data.enquiryId)
        .maybeSingle();
      if (!enquiry) throw new Error("Enquiry not found.");

      const { sendTransactionalEmail } = await import("@/lib/email-delivery.server");
      const result = await sendTransactionalEmail({
        to: enquiry.email,
        subject: `Re: ${enquiry.subject}`,
        text: data.body,
        metadata: { enquiryId: data.enquiryId },
      });
      deliveryStatus =
        result.status === "sent"
          ? "sent"
          : result.status === "not_configured"
            ? "queued"
            : `failed: ${result.error}`.slice(0, 200);

      if (!enquiry.first_response_at) {
        await (context.supabase.from("enquiries") as any)
          .update({ first_response_at: new Date().toISOString() })
          .eq("id", data.enquiryId);
      }
    }

    const { error } = await (context.supabase.from("enquiry_notes") as any).insert({
      enquiry_id: data.enquiryId,
      body: data.body,
      note_type: data.noteType,
      delivery_status: deliveryStatus,
      author_user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true, deliveryStatus };
  });
