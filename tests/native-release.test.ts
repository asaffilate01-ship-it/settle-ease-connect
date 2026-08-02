import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveNativeDeepLink } from "../src/lib/native";

describe("native release safeguards", () => {
  it("accepts only owned routes and origins", () => {
    expect(resolveNativeDeepLink("beistandplus://app/cases/abc")).toBe("/app/cases/abc");
    expect(resolveNativeDeepLink("beistandplus://portal/cases?q=open")).toBe(
      "/portal/cases?q=open",
    );
    expect(resolveNativeDeepLink("https://beistandplus.de/auth", "https://beistandplus.de")).toBe(
      "/auth",
    );
    expect(resolveNativeDeepLink("https://attacker.example/app", "https://beistandplus.de")).toBe(
      null,
    );
    expect(resolveNativeDeepLink("javascript:alert(1)")).toBe(null);
    expect(resolveNativeDeepLink("beistandplus://unknown/path")).toBe(null);
  });

  it("registers the custom scheme in both native projects", () => {
    const android = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
    const ios = readFileSync("ios/App/App/Info.plist", "utf8");
    expect(android).toContain('android:scheme="beistandplus"');
    expect(android).toContain("android.intent.category.BROWSABLE");
    expect(ios).toContain("CFBundleURLSchemes");
    expect(ios).toContain("<string>beistandplus</string>");
  });

  it("requires release security workflows and retention operations", () => {
    const envValidator = readFileSync("scripts/validate-production-env.mjs", "utf8");
    const securityWorkflow = readFileSync(".github/workflows/security.yml", "utf8");
    expect(envValidator).toContain('"RETENTION_WORKER_SECRET"');
    expect(securityWorkflow).toContain("github/codeql-action/analyze@v3");
    expect(securityWorkflow).toContain("dependency-review-action@v4");
  });
});
