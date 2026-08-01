import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * GDPR / DSAR workflows: portable data export, deletion requests and the
 * member-visible request history. All reads run as the member (RLS).
 */

export const listMyPrivacyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("privacy_requests")
      .select("id, kind, status, reason, created_at, processed_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Article 20 portability: returns the member's own records as JSON. */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const uid = context.userId;

    const [profile, cases, documents, subscriptions, tasks, checklists, registrations, requests] =
      await Promise.all([
        sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
        sb.from("cases").select("*").eq("client_user_id", uid),
        sb.from("vault_documents").select("id, title, category, created_at").eq("owner_user_id", uid),
        sb.from("subscriptions").select("*").eq("user_id", uid),
        sb.from("case_tasks").select("id, case_id, title, status, due_date").limit(500),
        sb.from("user_checklist_progress").select("*").eq("user_id", uid),
        sb.from("event_registrations").select("*").eq("user_id", uid),
        sb.from("privacy_requests").select("*").eq("user_id", uid),
      ]);

    // Log the export as a fulfilled request so there is an auditable trail.
    await sb.from("privacy_requests").insert({
      user_id: uid,
      kind: "export",
      status: "completed",
      reason: "Self-service data export",
      processed_at: new Date().toISOString(),
    });

    return {
      generatedAt: new Date().toISOString(),
      subject: { userId: uid },
      profile: profile.data ?? null,
      cases: cases.data ?? [],
      documents: documents.data ?? [],
      subscriptions: subscriptions.data ?? [],
      tasks: tasks.data ?? [],
      checklistProgress: checklists.data ?? [],
      eventRegistrations: registrations.data ?? [],
      privacyRequests: requests.data ?? [],
    };
  });

/** Article 17 erasure request — queued for staff review (retention/legal holds apply). */
export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ reason: z.string().trim().max(1000).optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("privacy_requests")
      .select("id")
      .eq("user_id", context.userId)
      .eq("kind", "deletion")
      .in("status", ["pending", "in_progress"])
      .maybeSingle();
    if (existing) return { id: existing.id, alreadyOpen: true };

    const { data: row, error } = await context.supabase
      .from("privacy_requests")
      .insert({
        user_id: context.userId,
        kind: "deletion",
        reason: data.reason ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, alreadyOpen: false };
  });

export const cancelPrivacyRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("privacy_requests")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
