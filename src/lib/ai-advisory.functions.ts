import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAal2 as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  ADVISORY_DOMAINS,
  advisorySystemPrompt,
  callAdvisoryGateway,
  ADVISORY_MODEL,
} from "./ai-advisory.server";

const domainEnum = z.enum(ADVISORY_DOMAINS);

async function assertInternal(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_internal", { _user_id: userId });
  if (!data) throw new Error("Staff only.");
}

/** Generate an AI advisory draft. Never sent to a client until a human approves it. */
export const generateAdvisoryDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        caseId: z.string().uuid().optional(),
        domain: domainEnum,
        question: z.string().min(10).max(4000),
        clientContext: z.string().max(8000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context.supabase, context.userId);

    const draft = await callAdvisoryGateway([
      { role: "system", content: advisorySystemPrompt(data.domain) },
      {
        role: "user",
        content: `Question from case handler: ${data.question}${
          data.clientContext
            ? `\n\nCase context provided by the handler:\n${data.clientContext}`
            : ""
        }`,
      },
    ]);

    const { data: row, error } = await context.supabase
      .from("ai_advisory_drafts")
      .insert({
        case_id: data.caseId ?? null,
        domain: data.domain,
        question: data.question,
        draft_text: draft,
        model: ADVISORY_MODEL,
        status: "pending",
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listAdvisoryDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        status: z.enum(["pending", "approved", "rejected", "sent", "all"]).default("pending"),
        caseId: z.string().uuid().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context.supabase, context.userId);
    let q = context.supabase
      .from("ai_advisory_drafts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.caseId) q = q.eq("case_id", data.caseId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Human review. Approving optionally posts the (possibly edited) text to the case thread. */
export const reviewAdvisoryDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        editedText: z.string().min(10).max(20000).optional(),
        reviewNotes: z.string().max(2000).optional(),
        sendToCase: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context.supabase, context.userId);

    const { data: existing, error: readErr } = await context.supabase
      .from("ai_advisory_drafts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!existing) throw new Error("Draft not found.");
    if (existing.status === "sent") throw new Error("This draft has already been sent.");

    const finalText = data.editedText ?? existing.draft_text;
    const shouldSend = data.decision === "approved" && data.sendToCase && !!existing.case_id;

    const { data: row, error } = await context.supabase
      .from("ai_advisory_drafts")
      .update({
        draft_text: finalText,
        status: shouldSend ? "sent" : data.decision,
        review_notes: data.reviewNotes ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        sent_at: shouldSend ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (shouldSend) {
      const { error: msgErr } = await context.supabase.from("case_messages").insert({
        case_id: existing.case_id as string,
        sender_user_id: context.userId,
        body: finalText,
        internal_note: false,
      });
      if (msgErr) throw new Error(`Draft approved but could not be posted: ${msgErr.message}`);
    }

    await context.supabase.rpc("log_audit_event", {
      _action: shouldSend ? "ai_advisory_sent" : `ai_advisory_${data.decision}`,
      _entity_type: "ai_advisory_drafts",
      _entity_id: data.id,
      _subject_user_id: undefined,
      _metadata: { domain: existing.domain, case_id: existing.case_id },
    });

    return row;
  });
