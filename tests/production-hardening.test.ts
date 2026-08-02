import { describe, expect, it } from "vitest";
import { hasAal2 } from "../src/lib/auth-assurance";
import { normalizeSubscriptionPlanCode, resolveAllowedReturnUrl } from "../src/lib/payments-policy";
import { applySecurityHeaders } from "../src/lib/security-headers";
import { readFileSync } from "node:fs";

describe("authentication assurance", () => {
  it("accepts only an AAL2 claim", () => {
    expect(hasAal2({ aal: "aal2" })).toBe(true);
    expect(hasAal2({ aal: "aal1" })).toBe(false);
    expect(hasAal2({})).toBe(false);
    expect(hasAal2(null)).toBe(false);
  });
});

describe("subscription entitlement mapping", () => {
  it("maps only known tier lookup keys", () => {
    expect(normalizeSubscriptionPlanCode("basic_monthly")).toBe("basic");
    expect(normalizeSubscriptionPlanCode("plus_yearly")).toBe("plus");
    expect(normalizeSubscriptionPlanCode("complete")).toBe("complete");
    expect(normalizeSubscriptionPlanCode("funeral_cover_10000")).toBeNull();
    expect(normalizeSubscriptionPlanCode("enterprise")).toBeNull();
  });
});

describe("checkout product boundary", () => {
  it("allows only active recurring EUR subscription plans", () => {
    const source = readFileSync(
      new URL("../src/lib/payments.functions.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("Unsupported subscription plan");
    expect(source).toContain('.eq("active", true)');
    expect(source).toContain('stripePrice.type !== "recurring"');
    expect(source).toContain('stripePrice.currency !== "eur"');
  });
});

describe("payment return URLs", () => {
  it("accepts same-origin and explicitly allowed origins", () => {
    expect(resolveAllowedReturnUrl(undefined, "/app/account", "https://beistandplus.de")).toBe(
      "https://beistandplus.de/app/account",
    );
    expect(
      resolveAllowedReturnUrl(
        "https://members.beistandplus.de/return",
        "/app/account",
        "https://beistandplus.de",
        ["https://members.beistandplus.de"],
      ),
    ).toBe("https://members.beistandplus.de/return");
  });

  it("rejects an attacker-controlled return origin", () => {
    expect(() =>
      resolveAllowedReturnUrl(
        "https://attacker.example/collect",
        "/app/account",
        "https://beistandplus.de",
      ),
    ).toThrow("Invalid payment return URL");
  });
});

describe("security headers", () => {
  it("sets clickjacking, content and transport protections", () => {
    const secured = applySecurityHeaders(new Response("ok"), true);
    expect(secured.headers.get("x-frame-options")).toBe("DENY");
    expect(secured.headers.get("x-content-type-options")).toBe("nosniff");
    expect(secured.headers.get("strict-transport-security")).toContain("max-age=63072000");
    expect(secured.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(secured.headers.get("content-security-policy")).toContain("https://checkout.stripe.com");
    expect(secured.headers.get("content-security-policy")).not.toContain("*.lovable.app");
  });
});
