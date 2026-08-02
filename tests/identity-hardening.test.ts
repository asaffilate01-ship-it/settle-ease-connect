import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("identity and privileged-action hardening", () => {
  it("requires AAL2 and a different administrator for role changes", () => {
    const migration = source(
      "supabase/migrations/20260802200000_identity_and_approval_hardening.sql",
    );
    expect(migration).toContain("auth.jwt()->>'aal' <> 'aal2'");
    expect(migration).toContain("approval.requested_by = actor");
    expect(migration).toContain("approval.target_user_id = actor");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("ON CONFLICT (user_id, role) DO NOTHING");
  });

  it("does not represent a TOTP enrolment as a passkey", () => {
    const sessions = source("src/routes/_authenticated/app.sessions.tsx");
    expect(sessions).toContain("Passkeys are not enabled yet");
    expect(sessions).not.toContain('friendlyName: "Passkey');
    expect(sessions).not.toContain("enrollPasskey");
  });

  it("uses a 12-character minimum for newly created and reset passwords", () => {
    const auth = source("src/routes/auth.tsx");
    const reset = source("src/routes/reset-password.tsx");
    expect(auth).toContain("password.length < 12");
    expect(auth).toContain('mode === "signup" ? 12 : undefined');
    expect(reset).toContain("password.length < 12");
    expect(reset).toContain("minLength={12}");
  });

  it("blocks inline script attributes and legacy cross-domain policies", () => {
    const headers = source("src/lib/security-headers.ts");
    expect(headers).toContain("script-src-attr 'none'");
    expect(headers).toContain('"X-Permitted-Cross-Domain-Policies", "none"');
    expect(headers).toContain('"Origin-Agent-Cluster", "?1"');
  });
});
