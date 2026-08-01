import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

const STATUS = ["new", "in_progress", "waiting_customer", "resolved", "spam"] as const;
const PRIORITY = ["low", "normal", "high", "urgent"] as const;

async function requireOperationalStaff(context: { supabase: SupabaseClient; userId: string }) {
  const { data } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
  if (!data) throw new Error("Operational staff access required.");
}

export const listEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        status: z.enum(STATUS).optional(),
        priority: z.enum(PRIORITY).optional(),
        assignedTo: z.string().uuid().optional(),
        unassigned: z.boolean().optional(),
        q: z.string().trim().max(120).optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireOperationalStaff(context);
    const client = context.supabase as unknown as SupabaseClient;
    let query = client
      .from("contact_enquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250);
    if (data.status) query = query.eq("status", data.status);
    if (data.priority) query = query.eq("priority", data.priority);
    if (data.assignedTo) query = query.eq("assigned_to", data.assignedTo);
    if (data.unassigned) query = query.is("assigned_to", null);
    if (data.q) {
      const safe = data.q.replace(/[^\p{L}\p{N}@.\-\s]/gu, " ").trim();
      if (safe)
        query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,subject.ilike.%${safe}%`);
    }
    const [{ data: rows, error }, { data: profiles }] = await Promise.all([
      query,
      client.from("profiles").select("id, full_name, avatar_url").limit(500),
    ]);
    if (error) throw new Error(error.message);
    return { enquiries: rows ?? [], profiles: profiles ?? [] };
  });

export const getEnquiry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await requireOperationalStaff(context);
    const client = context.supabase as unknown as SupabaseClient;
    const [enquiry, notes, profiles] = await Promise.all([
      client.from("contact_enquiries").select("*").eq("id", data.id).maybeSingle(),
      client
        .from("contact_enquiry_notes")
        .select("*")
        .eq("enquiry_id", data.id)
        .order("created_at"),
      client.from("profiles").select("id, full_name, avatar_url").limit(500),
    ]);
    if (enquiry.error) throw new Error(enquiry.error.message);
    if (!enquiry.data) throw new Error("Enquiry not found.");
    return { enquiry: enquiry.data, notes: notes.data ?? [], profiles: profiles.data ?? [] };
  });

export const updateEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(STATUS).optional(),
        priority: z.enum(PRIORITY).optional(),
        assignedTo: z.string().uuid().nullable().optional(),
        tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
      })
      .refine((value) => Object.keys(value).length > 1, "No changes supplied")
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireOperationalStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const { data: before, error: findError } = await admin
      .from("contact_enquiries")
      .select("status, assigned_to")
      .eq("id", data.id)
      .maybeSingle();
    if (findError || !before) throw new Error("Enquiry not found.");

    const patch: Record<string, unknown> = { last_activity_at: new Date().toISOString() };
    if (data.status !== undefined) patch.status = data.status;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.assignedTo !== undefined) patch.assigned_to = data.assignedTo;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.status === "resolved") {
      patch.resolved_at = new Date().toISOString();
      patch.resolved_by = context.userId;
    } else if (data.status) {
      patch.resolved_at = null;
      patch.resolved_by = null;
    }

    const { error } = await admin.from("contact_enquiries").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    const notes: Array<Record<string, unknown>> = [];
    if (data.status && data.status !== before.status) {
      notes.push({
        enquiry_id: data.id,
        author_user_id: context.userId,
        body: `Status changed from ${before.status} to ${data.status}.`,
        note_type: "status_change",
      });
    }
    if (data.assignedTo !== undefined && data.assignedTo !== before.assigned_to) {
      notes.push({
        enquiry_id: data.id,
        author_user_id: context.userId,
        body: data.assignedTo
          ? "Enquiry assigned to a staff member."
          : "Enquiry returned to the unassigned queue.",
        note_type: "assignment",
      });
    }
    if (notes.length) await admin.from("contact_enquiry_notes").insert(notes);
    return { ok: true };
  });

export const addEnquiryNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        enquiryId: z.string().uuid(),
        body: z.string().trim().min(1).max(8000),
        noteType: z.enum(["internal", "customer_reply"]).default("internal"),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireOperationalStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as SupabaseClient;
    const now = new Date().toISOString();
    const { data: row, error } = await admin
      .from("contact_enquiry_notes")
      .insert({
        enquiry_id: data.enquiryId,
        author_user_id: context.userId,
        body: data.body,
        note_type: data.noteType,
        delivery_status: data.noteType === "customer_reply" ? "queued" : null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const enquiryPatch: Record<string, unknown> = { last_activity_at: now };
    if (data.noteType === "customer_reply") {
      enquiryPatch.status = "waiting_customer";
      const { data: enquiry } = await admin
        .from("contact_enquiries")
        .select("first_response_at, email, full_name, subject")
        .eq("id", data.enquiryId)
        .maybeSingle();
      if (!enquiry) {
        await admin
          .from("contact_enquiry_notes")
          .update({ delivery_status: "failed" })
          .eq("id", row.id);
      } else {
        if (!enquiry.first_response_at) enquiryPatch.first_response_at = now;
        try {
          const { deliverTransactionalEmail } = await import("@/lib/email-delivery.server");
          await deliverTransactionalEmail({
            to: enquiry.email,
            subject: `Re: ${enquiry.subject}`,
            text: data.body,
            replyTo: process.env.CONTACT_TEAM_EMAIL,
            metadata: { enquiryId: data.enquiryId, noteId: row.id },
          });
          await admin
            .from("contact_enquiry_notes")
            .update({ delivery_status: "sent" })
            .eq("id", row.id);
        } catch (deliveryError) {
          console.error("[enquiries] customer reply delivery failed", deliveryError);
          await admin
            .from("contact_enquiry_notes")
            .update({ delivery_status: "failed" })
            .eq("id", row.id);
        }
      }
    }
    await admin.from("contact_enquiries").update(enquiryPatch).eq("id", data.enquiryId);
    return row;
  });
