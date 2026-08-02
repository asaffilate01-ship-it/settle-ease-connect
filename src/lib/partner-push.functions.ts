import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAal2 as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Insurance triage → partner API push.
 *
 * Staff never call partner endpoints inline: the lead is queued on
 * `partner_api_pushes` and the signed delivery worker
 * (`/api/internal/partner-deliveries`) performs the HTTPS call with signature,
 * timestamp, idempotency key, retries and dead-letter handling.
 */
export const pushInsuranceLeadToPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        leadId: z.string().uuid(),
        partnerCode: z.string().min(1).max(40),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", {
      _user_id: context.userId,
    });
    if (!internal) throw new Error("Staff only.");

    const { data: endpoint, error: endpointError } = await context.supabase
      .from("partner_endpoints")
      .select("id, endpoint_url, active")
      .eq("partner_code", data.partnerCode)
      .maybeSingle();
    if (endpointError) throw new Error(endpointError.message);
    if (!endpoint) {
      throw new Error(
        "This partner has no registered delivery endpoint. Register it in the delivery centre first.",
      );
    }
    if (!endpoint.active) throw new Error("This partner endpoint is currently disabled.");

    const { data: lead, error } = await context.supabase
      .from("insurance_leads")
      .select("id, full_name, email, phone, triage_route, product_line, notes, stage, created_at")
      .eq("id", data.leadId)
      .maybeSingle();
    if (error || !lead) throw new Error("Lead not found");

    const payload = {
      partner: data.partnerCode,
      submitted_at: new Date().toISOString(),
      lead: {
        id: lead.id,
        name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        interest: lead.product_line,
        route: lead.triage_route,
        notes: lead.notes,
      },
    };

    const { data: row, error: insertError } = await context.supabase
      .from("partner_api_pushes")
      .insert({
        lead_id: data.leadId,
        partner_code: data.partnerCode,
        endpoint: endpoint.endpoint_url,
        endpoint_id: endpoint.id,
        idempotency_key: `lead-${data.leadId}-${Date.now()}`,
        request_payload: payload,
        status: "queued",
        sent_by: context.userId,
      })
      .select("id, status, partner_code, created_at")
      .single();
    if (insertError) throw new Error(insertError.message);

    return { push: row, queued: true };
  });

export const listPartnerPushes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("partner_api_pushes")
      .select(
        "id, lead_id, partner_code, endpoint, status, response_status, attempt_count, next_attempt_at, last_error, delivered_at, dead_lettered_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });
