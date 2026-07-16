import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Insurance triage → partner API push.
 * Staff records the handoff intent; for real delivery this would call the
 * partner's REST endpoint. For now we log the push and mark it 'queued'.
 */
export const pushInsuranceLeadToPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    leadId: z.string().uuid(),
    partnerCode: z.string().min(1).max(40),
    endpoint: z.string().url().max(500),
    dryRun: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
    if (!internal) throw new Error("Staff only.");

    // Load lead (RLS: only staff can access via triage policy)
    const { data: lead, error } = await context.supabase
      .from("insurance_leads")
      .select("id, contact_name, contact_email, contact_phone, triage_route, product_interest, city, bundesland, notes, stage, created_at")
      .eq("id", data.leadId)
      .maybeSingle();
    if (error || !lead) throw new Error("Lead not found");

    const payload = {
      partner: data.partnerCode,
      submitted_at: new Date().toISOString(),
      lead: {
        name: lead.contact_name,
        email: lead.contact_email,
        phone: lead.contact_phone,
        interest: lead.product_interest,
        route: lead.triage_route,
        location: [lead.city, lead.bundesland].filter(Boolean).join(", "),
        notes: lead.notes,
      },
    };

    let status: "queued" | "sent" | "failed" = "queued";
    let responseStatus: number | null = null;
    let responseBody: unknown = null;
    if (!data.dryRun) {
      try {
        const res = await fetch(data.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        responseStatus = res.status;
        responseBody = await res.text().catch(() => null);
        status = res.ok ? "sent" : "failed";
      } catch (e: any) {
        status = "failed";
        responseBody = { error: String(e?.message ?? e) };
      }
    }

    const { data: row } = await context.supabase.from("partner_api_pushes").insert({
      lead_id: data.leadId,
      partner_code: data.partnerCode,
      endpoint: data.endpoint,
      request_payload: payload,
      response_status: responseStatus,
      response_body: responseBody as any,
      status,
      sent_by: context.userId,
    }).select().single();

    return { push: row, dryRun: data.dryRun };
  });

export const listPartnerPushes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("partner_api_pushes")
      .select("id, lead_id, partner_code, endpoint, status, response_status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });
