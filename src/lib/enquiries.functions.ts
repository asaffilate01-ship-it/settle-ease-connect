import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Enquiry inbox with SLA workflow. Staff-only: triage, assignment,
 * status transitions and internal notes.
 */

const STATUSES = [
  "new",
  "acknowledged",
  "in_progress",
  "waiting_client",
  "resolved",
  "closed",
  "spam",
] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

async function requireStaff(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
  if (!data) throw new Error("Staff only.");
}

export const listEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as any);
    const { data, error } = await context.supabase
      .from("enquiries")
      .select(
        "id, full_name, email, phone, topic, subject, message, language, source, status, priority, assigned_to, sla_due_at, first_response_at, resolved_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const assignees = Array.from(
      new Set((data ?? []).map((row: any) => row.assigned_to).filter(Boolean)),
    );
    let staff: Array<{ id: string; full_name: string | null }> = [];
    if (assignees.length > 0) {
      const { data: profiles } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", assignees);
      staff = (profiles ?? []) as typeof staff;
    }
    return { rows: data ?? [], staff };
  });

export const getEnquiry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
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
      .select("id, body, is_internal, author_user_id, created_at")
      .eq("enquiry_id", data.id)
      .order("created_at", { ascending: true });
    return { enquiry, notes: notes ?? [] };
  });

export const updateEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        assignToMe: z.boolean().optional(),
        unassign: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context as any);
    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch["status"] = data.status;
      if (data.status !== "new") patch["first_response_at"] = new Date().toISOString();
      if (data.status === "resolved" || data.status === "closed") {
        patch["resolved_at"] = new Date().toISOString();
      }
    }
    if (data.priority) patch["priority"] = data.priority;
    if (data.assignToMe) patch["assigned_to"] = context.userId;
    if (data.unassign) patch["assigned_to"] = null;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await (context.supabase.from("enquiries") as any)
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addEnquiryNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        enquiryId: z.string().uuid(),
        body: z.string().trim().min(1).max(5000),
        isInternal: z.boolean().default(true),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context as any);
    const { error } = await context.supabase.from("enquiry_notes").insert({
      enquiry_id: data.enquiryId,
      body: data.body,
      is_internal: data.isInternal,
      author_user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
