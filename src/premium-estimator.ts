import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createPartnerSignature, partnerRetryDelayMinutes } from "@/lib/partner-delivery-policy";
import { assertPartnerEndpointAllowed } from "@/lib/partner-endpoint-guard.server";
import type { SupabaseClient } from "@supabase/supabase-js";

type ClaimedPush = {
  id: string;
  endpoint_id: string;
  request_payload: unknown;
  attempt_count: number;
  idempotency_key: string;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function processPartnerDeliveryQueue(batchSize = 10) {
  const database = supabaseAdmin as unknown as SupabaseClient;
  const workerId = `web-${randomUUID()}`;
  const { data: claimed, error: claimError } = await database.rpc("claim_partner_deliveries", {
    _worker_id: workerId,
    _batch_size: Math.min(Math.max(batchSize, 1), 25),
  });
  if (claimError) throw new Error(claimError.message);

  const summary = { claimed: 0, delivered: 0, retrying: 0, deadLettered: 0 };
  for (const push of (claimed ?? []) as ClaimedPush[]) {
    summary.claimed += 1;
    const started = Date.now();
    let responseStatus: number | null = null;
    let responseExcerpt: string | null = null;
    let failure: string | null = null;

    const { data: endpoint } = await database
      .from("partner_endpoints")
      .select("endpoint_url, signing_secret_env, max_attempts, timeout_ms, active")
      .eq("id", push.endpoint_id)
      .maybeSingle();

    if (!endpoint?.active) {
      failure = "Partner endpoint is disabled or missing.";
    } else {
      const signingSecret = process.env[endpoint.signing_secret_env];
      if (!signingSecret) {
        failure = `Signing secret ${endpoint.signing_secret_env} is not configured.`;
      } else {
        const body = JSON.stringify(push.request_payload ?? {});
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = createPartnerSignature(signingSecret, timestamp, body);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), endpoint.timeout_ms);
        try {
          const endpointUrl = assertPartnerEndpointAllowed(endpoint.endpoint_url);
          const response = await fetch(endpointUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "BeistandPlus-Partner-Delivery/1.0",
              "X-Beistand-Timestamp": timestamp,
              "X-Beistand-Signature": `v1=${signature}`,
              "Idempotency-Key": push.idempotency_key,
            },
            body,
            signal: controller.signal,
            redirect: "error",
          });
          responseStatus = response.status;
          responseExcerpt = (await response.text().catch(() => "")).slice(0, 2000);
          if (!response.ok) failure = `Partner returned HTTP ${response.status}.`;
        } catch (error) {
          failure = errorMessage(error).slice(0, 1000);
        } finally {
          clearTimeout(timer);
        }
      }
    }

    await database.from("partner_delivery_attempts").insert({
      push_id: push.id,
      attempt_number: push.attempt_count,
      response_status: responseStatus,
      response_excerpt: responseExcerpt,
      error_message: failure,
      duration_ms: Date.now() - started,
    });

    if (!failure) {
      summary.delivered += 1;
      await database
        .from("partner_api_pushes")
        .update({
          status: "sent",
          response_status: responseStatus,
          response_body: responseExcerpt ? { excerpt: responseExcerpt } : null,
          delivered_at: new Date().toISOString(),
          last_error: null,
          locked_at: null,
          locked_by: null,
        })
        .eq("id", push.id)
        .eq("locked_by", workerId);
      continue;
    }

    const maxAttempts = endpoint?.max_attempts ?? 6;
    const deadLetter = push.attempt_count >= maxAttempts;
    const delayMinutes = partnerRetryDelayMinutes(push.attempt_count);
    if (deadLetter) summary.deadLettered += 1;
    else summary.retrying += 1;
    await database
      .from("partner_api_pushes")
      .update({
        status: deadLetter ? "dead_letter" : "retrying",
        response_status: responseStatus,
        last_error: failure,
        next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
        dead_lettered_at: deadLetter ? new Date().toISOString() : null,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", push.id)
      .eq("locked_by", workerId);
  }
  return summary;
}
