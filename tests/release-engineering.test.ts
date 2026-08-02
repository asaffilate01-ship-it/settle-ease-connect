import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const commitSha = "a".repeat(40);
const artifactUrl = "https://github.com/example/settle-ease-connect/actions/runs/123";

describe("release evidence gate", () => {
  it("accepts complete, current staging evidence for the exact commit", () => {
    const directory = mkdtempSync(join(tmpdir(), "beistand-release-"));
    const file = join(directory, "evidence.json");
    const output = join(directory, "resolved.json");
    const staging = evidence("staging");
    staging.commitSha = "FROM_WORKFLOW";
    writeFileSync(file, JSON.stringify(staging));

    const result = run("scripts/validate-release-evidence.mjs", [
      "--file",
      file,
      "--environment",
      "staging",
      "--commit",
      commitSha,
      "--native",
      "none",
      "--output",
      output,
    ]);
    const resolved = JSON.parse(readFileSync(output, "utf8"));
    rmSync(directory, { recursive: true, force: true });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Release evidence passed");
    expect(resolved.commitSha).toBe(commitSha);
  });

  it("blocks production when a mandatory external control is not evidenced", () => {
    const directory = mkdtempSync(join(tmpdir(), "beistand-release-"));
    const file = join(directory, "evidence.json");
    const production = evidence("production");
    production.checks.legalApproval = false;
    writeFileSync(file, JSON.stringify(production));

    const result = run("scripts/validate-release-evidence.mjs", [
      "--file",
      file,
      "--environment",
      "production",
      "--commit",
      commitSha,
      "--native",
      "none",
    ]);
    rmSync(directory, { recursive: true, force: true });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("checks.legalApproval must be true");
  });
});

describe("native domain associations", () => {
  it("generates and verifies Apple and Android association files from release identities", () => {
    const directory = mkdtempSync(join(tmpdir(), "beistand-native-"));
    const nativeEnvironment = {
      CAPACITOR_SERVER_URL: "https://beistandplus.de",
      APPLE_TEAM_ID: "A1B2C3D4E5",
      IOS_BUNDLE_ID: "de.beistandplus.app",
      ANDROID_PACKAGE_NAME: "de.beistandplus.app",
      ANDROID_SHA256_FINGERPRINTS: fingerprint(),
    };

    const generated = run("scripts/native-app-links.mjs", ["--write", `--root=${directory}`], {
      ...process.env,
      ...nativeEnvironment,
    });
    const checked = run("scripts/native-app-links.mjs", ["--check", `--root=${directory}`], {
      ...process.env,
      ...nativeEnvironment,
    });
    const apple = readFileSync(
      join(directory, "public", ".well-known", "apple-app-site-association"),
      "utf8",
    );
    const android = readFileSync(
      join(directory, "public", ".well-known", "assetlinks.json"),
      "utf8",
    );
    rmSync(directory, { recursive: true, force: true });

    expect(generated.status).toBe(0);
    expect(checked.status).toBe(0);
    expect(apple).toContain("A1B2C3D4E5.de.beistandplus.app");
    expect(android).toContain(fingerprint());
  });

  it("rejects non-SHA-256 Android signing fingerprints", () => {
    const result = run("scripts/native-app-links.mjs", ["--check"], {
      ...process.env,
      CAPACITOR_SERVER_URL: "https://beistandplus.de",
      APPLE_TEAM_ID: "A1B2C3D4E5",
      IOS_BUNDLE_ID: "de.beistandplus.app",
      ANDROID_PACKAGE_NAME: "de.beistandplus.app",
      ANDROID_SHA256_FINGERPRINTS: "NOT-A-FINGERPRINT",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Invalid Android SHA-256 signing fingerprint");
  });

  it("allows an iOS-only release without Android signing material", () => {
    const directory = mkdtempSync(join(tmpdir(), "beistand-native-ios-"));
    const result = run(
      "scripts/native-app-links.mjs",
      ["--write", "--targets=ios", `--root=${directory}`],
      {
        ...process.env,
        CAPACITOR_SERVER_URL: "https://beistandplus.de",
        APPLE_TEAM_ID: "A1B2C3D4E5",
        IOS_BUNDLE_ID: "de.beistandplus.app",
        ANDROID_PACKAGE_NAME: "",
        ANDROID_SHA256_FINGERPRINTS: "",
      },
    );
    const androidFile = join(directory, "public", ".well-known", "assetlinks.json");

    expect(result.status).toBe(0);
    expect(existsSync(androidFile)).toBe(false);
    rmSync(directory, { recursive: true, force: true });
  });
});

describe("guarded release workflow", () => {
  it("uses protected environments, exact evidence and post-deployment checks", () => {
    const workflow = readFileSync(".github/workflows/release.yml", "utf8");
    expect(workflow).toContain("environment:\n      name: ${{ inputs.environment }}");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain('--commit "$GITHUB_SHA"');
    expect(workflow).toContain("npm run verify:production");
    expect(workflow).toContain("npm run release:verify-deployment");
    expect(workflow).toContain('"DEPLOY $TARGET_ENVIRONMENT"');
  });

  it("refuses post-deployment verification for an insecure origin", () => {
    const result = run("scripts/verify-deployment.mjs", [], {
      ...process.env,
      APP_URL: "http://beistandplus.de",
      APP_VERSION: "1.0.0",
      READINESS_TOKEN: "r".repeat(32),
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("reviewed HTTPS deployment origin");
  });
});

function evidence(environment: "staging" | "production") {
  return {
    schemaVersion: 1,
    environment,
    version: "1.0.0",
    commitSha,
    appUrl: `https://${environment}.beistandplus.de`,
    evaluatedAt: new Date(Date.now() - 60_000).toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    migration: "20260802202000_case_workflow_security.sql",
    releaseTargets: { web: true, ios: false, android: false },
    approval: { releaseManager: "Release Owner", security: "Security Owner", legal: "Counsel" },
    rollback: {
      owner: "Release Owner",
      threshold: "More than 1% failed requests for five minutes",
      procedure: "Rollback the Cloudflare deployment and database migration",
      backupVerifiedAt: new Date(Date.now() - 60_000).toISOString(),
    },
    checks: {
      quality: true,
      security: true,
      databaseMigrations: true,
      rlsMatrix: true,
      anonymousWrites: true,
      rollbackTest: true,
      backupsAndRestore: true,
      monitoring: true,
      incidentResponse: true,
      accessibility: true,
      credentialRotation: true,
      legalApproval: true,
      providerContracts: true,
      livePayments: true,
      emailAuthentication: true,
      partnerDelivery: true,
      penetrationTest: true,
      nativeSigning: false,
      nativeDeviceTests: false,
      storeCompliance: false,
      appLinks: false,
    },
    artifacts: {
      qualityRunUrl: artifactUrl,
      securityRunUrl: artifactUrl,
      migrationEvidenceUrl: artifactUrl,
      restoreEvidenceUrl: artifactUrl,
      sbomUrl: artifactUrl,
      legalApprovalUrl: artifactUrl,
      penetrationTestUrl: artifactUrl,
      nativeTestEvidenceUrl: "",
    },
  };
}

function fingerprint() {
  return Array.from({ length: 32 }, (_, index) => index.toString(16).padStart(2, "0"))
    .join(":")
    .toUpperCase();
}

function run(script: string, args: string[], env = process.env) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
  });
}
