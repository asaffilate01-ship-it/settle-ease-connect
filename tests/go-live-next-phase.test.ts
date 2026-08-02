import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("next-phase release gates", () => {
  it("compiles both native projects and retains unsigned CI artifacts", () => {
    const workflow = read(".github/workflows/native.yml");
    expect(workflow).toContain("Android debug build");
    expect(workflow).toContain("testDebugUnitTest assembleDebug");
    expect(workflow).toContain("iOS simulator build");
    expect(workflow).toContain("CODE_SIGNING_ALLOWED=NO");
    expect(workflow).toContain("actions/upload-artifact@v7");
  });

  it("keeps authenticated acceptance in the protected staging environment", () => {
    const workflow = read(".github/workflows/staging-acceptance.yml");
    const config = read("playwright.staging.config.ts");
    expect(workflow).toContain("name: staging");
    expect(workflow).toContain("secrets.E2E_MEMBER_PASSWORD");
    expect(workflow).toContain("secrets.E2E_STAFF_PASSWORD");
    expect(workflow).toContain("secrets.E2E_AGENT_PASSWORD");
    expect(workflow).toContain("secrets.E2E_EXPERT_PASSWORD");
    expect(config).toContain('trace: "off"');
    expect(config).toContain('video: "off"');
    expect(config).toContain('screenshot: "off"');
    expect(config).toContain('devices["Pixel 7"]');
    expect(workflow).toContain("scripts/write-staging-acceptance-evidence.mjs");
    expect(workflow).toContain("retention-days: 365");
  });

  it("fails early when a hosting mirror rewrites the dependency lockfile", () => {
    const policy = read(".github/workflows/policy.yml");
    const setup = read(".github/actions/setup-node-project/action.yml");
    const packageJson = JSON.parse(read("package.json"));
    expect(policy).toContain("node scripts/validate-lockfile.mjs");
    expect(setup).toContain("node scripts/validate-lockfile.mjs");
    expect(setup).toContain("npm ci");
    expect(packageJson.packageManager).toBe("npm@10.9.8");
    expect(packageJson.scripts["security:sbom"]).toContain("--package-lock-only");
    expect(packageJson.scripts["security:sbom"]).toContain("--output-reproducible");
    expect(packageJson.scripts["security:sbom"]).toContain("--validate");
  });

  it("refuses staging tests against production and preview hosts", () => {
    const validator = read("scripts/validate-staging-e2e-env.mjs");
    expect(validator).toContain('stagingUrl.hostname === "beistandplus.de"');
    expect(validator).toContain('.endsWith(".lovable.app")');
    expect(validator).toContain("Each staging role must use a distinct account");
  });

  it("uses current Node 24 GitHub Action majors consistently", () => {
    const quality = read(".github/workflows/quality.yml");
    const security = read(".github/workflows/security.yml");
    const release = read(".github/workflows/release.yml");
    expect(quality).toContain("actions/upload-artifact@v7");
    expect(security).toContain("github/codeql-action/analyze@v4");
    expect(security).toContain("dependency-review-action@v5");
    expect(security).toContain("actions/upload-artifact@v7");
    expect(release).toContain("actions/upload-artifact@v7");
  });

  it("keeps major dependencies out of unattended launch updates", () => {
    const dependabot = read(".github/dependabot.yml");
    expect(dependabot).toContain('dependency-name: "*"');
    expect(dependabot).toContain("version-update:semver-major");
    expect(dependabot).toContain("dependency-name: stripe");
    expect(dependabot).toContain("version-update:semver-minor");
  });

  it("ships a fail-closed staging evidence template", () => {
    const evidence = JSON.parse(read("release/evidence.staging.example.json"));
    expect(evidence.environment).toBe("staging");
    expect(evidence.commitSha).toBe("FROM_WORKFLOW");
    expect(evidence.releaseTargets).toEqual({ web: true, ios: false, android: false });
    expect(Object.values(evidence.checks).every((value) => value === false)).toBe(true);
  });

  it("keeps browser artifacts that may contain staging data out of source control", () => {
    const gitignore = read(".gitignore");
    expect(gitignore).toContain("/playwright-report/");
    expect(gitignore).toContain("/test-results/");
    expect(gitignore).toContain("/release/staging-acceptance.evidence.json");
  });
});
