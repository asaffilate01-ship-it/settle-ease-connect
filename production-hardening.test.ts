import { describe, expect, it } from "vitest";
import { hasAal2 } from "../src/lib/auth-assurance";
import {
  normalizeSubscriptionPlanCode,
  resolveAllowedReturnUrl,
} from "../src/lib/payments-policy";
import { partnerDemosEnabled } from "../src/lib/partners/types";

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

describe("payment return URLs", () => {
  it("accepts same-origin and explicitly allowed origins", () => {
    expect(
      resolveAllowedReturnUrl(undefined, "/app/account", "https://beistandplus.de"),
    ).toBe("https://beistandplus.de/app/account");
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

describe("partner demo safety", () => {
  it("cannot enable simulated partner results in production", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousDemoFlag = process.env.ENABLE_PARTNER_DEMOS;
    process.env.ENABLE_PARTNER_DEMOS = "true";

    process.env.NODE_ENV = "development";
    expect(partnerDemosEnabled()).toBe(true);
    process.env.NODE_ENV = "production";
    expect(partnerDemosEnabled()).toBe(false);

    process.env.NODE_ENV = previousNodeEnv;
    if (previousDemoFlag === undefined) delete process.env.ENABLE_PARTNER_DEMOS;
    else process.env.ENABLE_PARTNER_DEMOS = previousDemoFlag;
  });
});
