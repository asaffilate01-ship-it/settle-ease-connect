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

describe("release correction migration", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20260801220000_production_release_corrections.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("removes historical privileged demonstration users", () => {
    expect(sql).toContain("DELETE FROM auth.users");
    expect(sql).toContain("admin@beistand.de");
  });

  it("binds family acceptance to the invited email without creating an observer participant", () => {
    const acceptance = sql.slice(
      sql.indexOf("CREATE OR REPLACE FUNCTION public.accept_case_access_grant"),
    );
    expect(acceptance).toContain("lower(grant_row.invited_email) <> actor_email");
    expect(acceptance).not.toContain("INSERT INTO public.case_participants");
  });

  it("enforces document, messaging and financial boundaries for family guests", () => {
    expect(sql).toContain('CREATE POLICY "case documents respect family grant"');
    expect(sql).toContain('CREATE POLICY "case message send respects family grant"');
    expect(sql).toContain('CREATE POLICY "quotes exclude family guests"');
    expect(sql).toContain('CREATE POLICY "invoices exclude family guests"');
  });

  it("prevents direct anonymous inserts from bypassing server rate limits", () => {
    expect(sql).toContain("REVOKE INSERT ON public.insurance_leads FROM anon, authenticated");
    expect(sql).toContain("REVOKE INSERT ON public.tax_leads FROM anon, authenticated");
    expect(sql).toContain("REVOKE INSERT ON public.contact_messages FROM anon, authenticated");
  });
});

describe("Stripe webhook retry claim", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20260801221000_stripe_webhook_retry_claim.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const webhook = readFileSync(
    new URL("../src/routes/api/public/payments/webhook.ts", import.meta.url),
    "utf8",
  );

  it("atomically reclaims failed or stale events without replaying successful events", () => {
    expect(sql).toContain("ON CONFLICT (event_id) DO UPDATE");
    expect(sql).toContain("status = 'failed'");
    expect(sql).toContain("interval '15 minutes'");
    expect(webhook).toContain('"claim_stripe_webhook_event"');
    expect(webhook).not.toContain('claimError.code === "23505"');
  });
});

describe("catalogue and verification hardening", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20260801222000_catalog_and_verification_hardening.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("makes directory and student-review writes server-owned", () => {
    expect(sql).toContain(
      "REVOKE INSERT, UPDATE ON public.student_verifications FROM authenticated",
    );
    expect(sql).toContain("REVOKE INSERT, UPDATE ON public.directory_listings FROM authenticated");
    expect(sql).toContain("auth.jwt()->>'aal' = 'aal2'");
  });

  it("binds expert invitations to the authenticated email", () => {
    expect(sql).toContain("invitation email does not match authenticated account");
    expect(sql).toContain("lower(coalesce(auth.jwt()->>'email', '')) <> lower(inv.email)");
    expect(sql).toContain("inv.languages, inv.city, inv.bundesland, 'paused', false");
  });

  it("publishes only bounded subscription catalogue claims", () => {
    expect(sql).toContain("Draft translation and summary tools when configured");
    expect(sql).toContain("No guaranteed response time, appointment, outcome");
  });
});
