type RuntimeBindings = Record<string, unknown> | undefined;

export type ServerErrorSource = "server-entry" | "ssr-response";

export interface ServerErrorContext {
  request: Request;
  requestId: string;
  source: ServerErrorSource;
  status: number;
  bindings?: RuntimeBindings;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 3_000;

export function createRequestId(request: Request): string {
  const supplied = request.headers.get("x-request-id")?.trim();
  return supplied && REQUEST_ID_PATTERN.test(supplied) ? supplied : crypto.randomUUID();
}

export function sanitizeError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  const normalized = error instanceof Error ? error : new Error("Non-Error server exception");
  const stack = normalized.stack ? sanitizeText(normalized.stack, MAX_STACK_LENGTH) : undefined;
  return {
    name: sanitizeText(normalized.name || "Error", 80),
    message: sanitizeText(normalized.message || "Unexpected server error", MAX_MESSAGE_LENGTH),
    ...(stack ? { stack } : {}),
  };
}

export async function reportServerError(
  error: unknown,
  { request, requestId, source, status, bindings }: ServerErrorContext,
): Promise<void> {
  const requestUrl = new URL(request.url);
  const event = {
    schemaVersion: 1,
    event: "server.error",
    occurredAt: new Date().toISOString(),
    requestId,
    source,
    status,
    request: {
      method: request.method,
      path: requestUrl.pathname,
    },
    service: {
      name: "beistandplus",
      version: runtimeValue(bindings, "APP_VERSION") || "unknown",
      environment: runtimeValue(bindings, "OBSERVABILITY_ENVIRONMENT") || "unknown",
    },
    error: sanitizeError(error),
  };

  console.error(JSON.stringify(event));

  const endpoint = runtimeValue(bindings, "OBSERVABILITY_ENDPOINT");
  const bearerToken = runtimeValue(bindings, "OBSERVABILITY_BEARER_TOKEN");
  if (!isHttpsUrl(endpoint) || bearerToken.length < 32) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${bearerToken}`,
        "content-type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify(event),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn(`Observability delivery failed with status ${response.status}.`);
    }
  } catch (deliveryError) {
    const reason = deliveryError instanceof Error ? deliveryError.name : "UnknownError";
    console.warn(`Observability delivery failed: ${reason}.`);
  } finally {
    clearTimeout(timeout);
  }
}

export function finalizeRequestResponse(
  response: Response,
  requestId: string,
  startedAt: number,
): Response {
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);
  headers.set("server-timing", `app;dur=${Math.max(0, performance.now() - startedAt).toFixed(1)}`);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function sanitizeText(value: string, maximumLength: number): string {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[redacted]")
    .replace(
      /\b(password|passwd|secret|token|api[_-]?key|authorization)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[redacted]",
    )
    .slice(0, maximumLength);
}

function runtimeValue(bindings: RuntimeBindings, name: string): string {
  const bindingValue = bindings?.[name];
  if (typeof bindingValue === "string") return bindingValue.trim();
  return process.env[name]?.trim() ?? "";
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
