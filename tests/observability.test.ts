import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRequestId,
  finalizeRequestResponse,
  reportServerError,
  sanitizeError,
} from "../src/lib/observability.server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("production observability", () => {
  it("uses a safe caller request ID and replaces malformed values", () => {
    const supplied = new Request("https://beistandplus.de/app", {
      headers: { "x-request-id": "edge:request-123" },
    });
    const malformed = new Request("https://beistandplus.de/app", {
      headers: { "x-request-id": "not safe request" },
    });

    expect(createRequestId(supplied)).toBe("edge:request-123");
    expect(createRequestId(malformed)).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("redacts credentials and personal email addresses from errors", () => {
    const sanitized = sanitizeError(
      new Error("token=super-secret authorization:Bearer abc123 user@example.com"),
    );

    expect(sanitized.message).toContain("token=[redacted]");
    expect(sanitized.message).toContain("authorization=[redacted]");
    expect(sanitized.message).toContain("[redacted-email]");
    expect(JSON.stringify(sanitized)).not.toContain("super-secret");
    expect(JSON.stringify(sanitized)).not.toContain("user@example.com");
  });

  it("reports only the request method and pathname, never query data", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const request = new Request(
      "https://beistandplus.de/app/cases?token=never-log-this&email=user@example.com",
      { method: "POST" },
    );

    await reportServerError(new Error("Unexpected failure"), {
      request,
      requestId: "request-123",
      source: "server-entry",
      status: 500,
      bindings: { APP_VERSION: "1.0.0", OBSERVABILITY_ENVIRONMENT: "test" },
    });

    const event = JSON.parse(String(logged.mock.calls[0]?.[0]));
    expect(event.request).toEqual({ method: "POST", path: "/app/cases" });
    expect(JSON.stringify(event)).not.toContain("never-log-this");
    expect(JSON.stringify(event)).not.toContain("user@example.com");
  });

  it("adds trace and timing headers to every response", () => {
    const response = finalizeRequestResponse(new Response("ok"), "request-123", performance.now());
    expect(response.headers.get("x-request-id")).toBe("request-123");
    expect(response.headers.get("server-timing")).toMatch(/^app;dur=\d+\.\d$/);
  });
});
