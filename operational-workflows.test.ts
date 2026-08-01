import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createPartnerSignature,
  partnerRetryDelayMinutes,
} from "../src/lib/partner-delivery-policy";

describe("partner delivery policy", () => {
  it("signs the timestamp and exact body deterministically", () => {
    expect(createPartnerSignature("secret", "1700000000", '{"ok":true}')).toBe(
      "c1afc7c2df3db0690d7d75954610ed1a1d959ce96355ccb8c0a8bc09fd0cfc27",
    );
  });

  it("uses capped exponential retry delays", () => {
    expect(partnerRetryDelayMinutes(1)).toBe(5);
    expect(partnerRetryDelayMinutes(2)).toBe(10);
    expect(partnerRetryDelayMinutes(6)).toBe(160);
    expect(partnerRetryDelayMinutes(20)).toBe(720);
  });
});

describe("operational migration safeguards", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20260801180000_operational_workflows.sql", import.meta.url),
    "utf8",
  );

  it("stores invitation tokens as hashes and binds acceptance to email", () => {
    expect(sql).toContain("invitation_token_hash text NOT NULL UNIQUE");
    expect(sql).toContain("lower(grant_row.invited_email) <> actor_email");
    expect(sql).not.toContain("invitation_token text");
  });

  it("limits document and messaging access for family guests", () => {
    expect(sql).toContain("case documents respect family grant");
    expect(sql).toContain("case message send respects family grant");
    expect(sql).toContain("public.family_case_grant(auth.uid(), case_id, 'documents')");
  });

  it("keeps delivery claims service-role only", () => {
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.claim_partner_deliveries(text, integer)");
    expect(sql).toContain("TO service_role");
  });

  it("uses data-minimized audit events for operational records", () => {
    expect(sql).toContain("FUNCTION public.audit_operational_change()");
    expect(sql).toContain("safe_metadata := jsonb_strip_nulls");
    expect(sql).not.toContain("EXECUTE FUNCTION public.audit_row_change()'");
  });
});
