import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("sensitive-data governance", () => {
  it("quarantines new vault files and only permits clean downloads", () => {
    const migration = source("supabase/migrations/20260802201000_vault_privacy_ai_governance.sql");
    const vault = source("src/lib/vault.functions.ts");
    expect(migration).toContain("ALTER COLUMN scan_status SET DEFAULT 'pending'");
    expect(migration).toContain("vd.scan_status = 'clean'");
    expect(migration).toContain('DROP POLICY IF EXISTS "vault owner uploads own files"');
    expect(vault).toContain("createSignedUploadUrl(path)");
    expect(vault).toContain('doc.scan_status !== "clean"');
  });

  it("limits vault file type and size at the server and storage bucket", () => {
    const migration = source("supabase/migrations/20260802201000_vault_privacy_ai_governance.sql");
    const vault = source("src/lib/vault.functions.ts");
    expect(vault).toContain('"application/pdf"');
    expect(vault).toContain("10 * 1024 * 1024");
    expect(migration).toContain("10485760");
    expect(migration).not.toContain("application/msword");
  });

  it("authenticates scanner callbacks and removes rejected objects", () => {
    const callback = source("src/routes/api/internal/vault-scan-result.ts");
    expect(callback).toContain("timingSafeEqual");
    expect(callback).toContain('input.status === "rejected"');
    expect(callback).toContain('.from("vault").remove');
  });

  it("requires versioned consent and does not retain AI prompts", () => {
    const governance = source("src/lib/ai-governance.functions.ts");
    const ai = source("src/lib/ai.functions.ts");
    const family = source("src/lib/assistant.functions.ts");
    expect(governance).toContain('AI_PROVIDER_DPA_CONFIRMED"] !== "true"');
    expect(governance).toContain("notice_version !== AI_NOTICE_VERSION");
    expect(ai).toContain("input_excerpt: null");
    expect(family).toContain("input_excerpt: null");
    expect(ai).not.toContain("input_excerpt: data.text.slice");
    expect(family).not.toContain("input_excerpt: data.question.slice");
  });

  it("uses one AAL2-gated privacy request workflow", () => {
    const governance = source("src/lib/governance.functions.ts");
    const panel = source("src/components/settings/privacy-panel.tsx");
    const page = source("src/routes/_authenticated/app.privacy-requests.tsx");
    expect(governance).toContain("listMyPrivacyRequests = createServerFn");
    expect(governance).toContain(".middleware([requireSupabaseAal2])");
    expect(panel).toContain('to="/app/privacy-requests"');
    expect(page).toContain("<Aal2Gate");
    expect(panel).not.toContain("exportMyData");
  });
});
