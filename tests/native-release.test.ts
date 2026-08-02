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

  it("wires verified app links and the iOS privacy manifest into store projects", () => {
    const android = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
    const entitlements = readFileSync("ios/App/App/App.entitlements", "utf8");
    const privacy = readFileSync("ios/App/App/PrivacyInfo.xcprivacy", "utf8");
    const xcodeProject = readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8");

    expect(android).toContain('android:autoVerify="true"');
    expect(android).toContain('android:scheme="https" android:host="beistandplus.de"');
    expect(entitlements).toContain("com.apple.developer.associated-domains");
    expect(entitlements).toContain("applinks:beistandplus.de");
    expect(privacy).toContain("NSPrivacyAccessedAPICategoryUserDefaults");
    expect(privacy).toContain("CA92.1");
    expect(xcodeProject).toContain("PrivacyInfo.xcprivacy in Resources");
    expect(xcodeProject).toContain("CODE_SIGN_ENTITLEMENTS = App/App.entitlements;");
  });

  it("requires release security workflows and retention operations", () => {
    const envValidator = readFileSync("scripts/validate-production-env.mjs", "utf8");
    const securityWorkflow = readFileSync(".github/workflows/security.yml", "utf8");
    expect(envValidator).toContain('"RETENTION_WORKER_SECRET"');
    expect(envValidator).toContain('"OBSERVABILITY_BEARER_TOKEN"');
    expect(securityWorkflow).toContain("github/codeql-action/analyze@v4");
    expect(securityWorkflow).toContain("dependency-review-action@v5");
  });

  it("patches the Capacitor Xcode toolchain UUID advisory without changing app runtime code", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    expect(packageJson.overrides.xcode.uuid).toBe("11.1.1");
    expect(packageLock.packages["node_modules/uuid"].version).toBe("11.1.1");
  });
});
