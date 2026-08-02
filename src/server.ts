import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  createRequestId,
  finalizeRequestResponse,
  reportServerError,
} from "./lib/observability.server";
import { applySecurityHeaders } from "./lib/security-headers";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
type ExecutionContextLike = { waitUntil?: (promise: Promise<unknown>) => void };

async function normalizeCatastrophicSsrResponse(
  response: Response,
  request: Request,
  requestId: string,
  bindings: Record<string, unknown> | undefined,
  context: ExecutionContextLike,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.clone().text() : "";
  const swallowed = isH3SwallowedErrorBody(body);
  const error = swallowed
    ? (consumeLastCapturedError() ?? new Error("SSR request failed inside the server runtime."))
    : new Error(`Server response returned status ${response.status}.`);

  queueErrorReport(
    context,
    reportServerError(error, {
      request,
      requestId,
      source: "ssr-response",
      status: response.status,
      bindings,
    }),
  );

  return swallowed
    ? new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      })
    : response;
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const startedAt = performance.now();
    const requestId = createRequestId(request);
    const bindings = isRecord(env) ? env : undefined;
    const context = isRecord(ctx) ? (ctx as ExecutionContextLike) : {};
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(
        response,
        request,
        requestId,
        bindings,
        context,
      );
      return applySecurityHeaders(finalizeRequestResponse(normalized, requestId, startedAt));
    } catch (error) {
      queueErrorReport(
        context,
        reportServerError(error, {
          request,
          requestId,
          source: "server-entry",
          status: 500,
          bindings,
        }),
      );
      return applySecurityHeaders(
        finalizeRequestResponse(
          new Response(renderErrorPage(), {
            status: 500,
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
          requestId,
          startedAt,
        ),
      );
    }
  },
};

function queueErrorReport(context: ExecutionContextLike, promise: Promise<void>): void {
  if (typeof context.waitUntil === "function") {
    context.waitUntil(promise);
  } else {
    void promise;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
