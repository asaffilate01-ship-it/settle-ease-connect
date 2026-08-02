import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const sha = "a".repeat(40);

describe("dependency lockfile provenance", () => {
  it("accepts the committed public-registry lockfile", () => {
    const result = spawnSync(process.execPath, ["scripts/validate-lockfile.mjs"], {
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Lockfile provenance passed");
  });

  it("rejects a hosting-platform package mirror", () => {
    const directory = mkdtempSync(join(tmpdir(), "beistand-lockfile-"));
    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({ name: "test", version: "1.0.0" }),
    );
    writeFileSync(
      join(directory, "package-lock.json"),
      JSON.stringify({
        name: "test",
        version: "1.0.0",
        lockfileVersion: 3,
        packages: {
          "": { name: "test", version: "1.0.0" },
          "node_modules/example": {
            version: "1.0.0",
            resolved: "https://example.pkg.dev/sandbox-npm-cache/example-1.0.0.tgz",
            integrity: `sha512-${"a".repeat(64)}`,
          },
        },
      }),
    );

    const result = spawnSync(process.execPath, [resolve("scripts/validate-lockfile.mjs")], {
      cwd: directory,
      encoding: "utf8",
    });
    rmSync(directory, { recursive: true, force: true });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("only the public npm registry is allowed");
  });
});

describe("staging acceptance evidence", () => {
  it("writes commit-bound evidence without account credentials", () => {
    const directory = mkdtempSync(join(tmpdir(), "beistand-staging-evidence-"));
    const output = join(directory, "evidence.json");
    const result = spawnSync(process.execPath, ["scripts/write-staging-acceptance-evidence.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        STAGING_URL: "https://staging.beistandplus.de",
        GITHUB_SHA: sha,
        GITHUB_RUN_ID: "12345",
        GITHUB_RUN_ATTEMPT: "2",
        GITHUB_REPOSITORY: "example/settle-ease-connect",
        GITHUB_SERVER_URL: "https://github.com",
        STAGING_EVIDENCE_OUTPUT: output,
      },
    });
    const evidence = JSON.parse(readFileSync(output, "utf8"));
    rmSync(directory, { recursive: true, force: true });

    expect(result.status).toBe(0);
    expect(evidence.commitSha).toBe(sha);
    expect(evidence.workflowRunUrl).toBe(
      "https://github.com/example/settle-ease-connect/actions/runs/12345",
    );
    expect(evidence.checks.workforceIsolation).toBe(true);
    expect(JSON.stringify(evidence)).not.toContain("PASSWORD");
    expect(JSON.stringify(evidence)).not.toContain("EMAIL");
  });

  it("refuses to issue staging evidence for the production hostname", () => {
    const result = spawnSync(process.execPath, ["scripts/write-staging-acceptance-evidence.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        STAGING_URL: "https://beistandplus.de",
        GITHUB_SHA: sha,
        GITHUB_RUN_ID: "12345",
        GITHUB_REPOSITORY: "example/settle-ease-connect",
      },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("cannot target production");
  });
});
