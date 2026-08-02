import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function expectPolicyRecreationIsIdempotent(sql: string, policy: string, table: string) {
  const drop = `DROP POLICY IF EXISTS "${policy}" ON ${table}`;
  const create = `CREATE POLICY "${policy}"`;
  expect(sql).toContain(drop);
  expect(sql.indexOf(create)).toBeGreaterThan(sql.indexOf(drop));
}

describe("go-live regression controls", () => {
  it("keeps the default-language page visible before hydration", () => {
    const root = source("src/routes/__root.tsx");
    const hook = source("src/hooks/use-language.ts");
    expect(root).toContain("if(s&&l!=='de'){d.setAttribute('data-lang-pending',l)");
    expect(hook).toContain("lang && lang !== DEFAULT_LANG");
  });

  it("uses an unambiguous password locator in the public browser test", () => {
    const browserTest = source("tests/e2e/public-smoke.spec.ts");
    expect(browserTest).toContain('getByLabel("Password", { exact: true })');
  });

  it("recreates overlapping migration policies safely", () => {
    const vault = source("supabase/migrations/20260802201000_vault_privacy_ai_governance.sql");
    const cases = source("supabase/migrations/20260802202000_case_workflow_security.sql");

    expectPolicyRecreationIsIdempotent(
      vault,
      "vault owner reads clean files with assurance",
      "storage.objects",
    );
    expectPolicyRecreationIsIdempotent(
      vault,
      "vault deputy reads allowed clean files with assurance",
      "storage.objects",
    );
    expectPolicyRecreationIsIdempotent(
      vault,
      "members read own AI consent",
      "public.ai_processing_consents",
    );
    expectPolicyRecreationIsIdempotent(
      cases,
      "aal2 internal staff update cases",
      "public.cases",
    );
    expectPolicyRecreationIsIdempotent(
      cases,
      "case messages enforce audience and assurance",
      "public.case_messages",
    );
  });

  it("generates a deterministic CycloneDX artifact in CI", () => {
    const packageJson = JSON.parse(source("package.json")) as {
      version?: string;
      scripts?: Record<string, string>;
    };
    const workflow = source(".github/workflows/security.yml");

    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packageJson.scripts?.["security:sbom"]).toContain("cyclonedx-npm");
    expect(packageJson.scripts?.["security:sbom"]).not.toContain("npm sbom");
    expect(workflow).toContain("- run: npm run security:sbom");
    expect(workflow).not.toContain("npm run security:sbom >");
  });
});
