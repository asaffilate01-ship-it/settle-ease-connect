const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://checkout.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
];

export function applySecurityHeaders(
  response: Response,
  production = process.env.NODE_ENV === "production",
): Response {
  const headers = new Headers(response.headers);
  const directives = production ? [...CSP_DIRECTIVES, "upgrade-insecure-requests"] : CSP_DIRECTIVES;
  headers.set("Content-Security-Policy", directives.join("; "));
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(self), payment=(self)",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-site");
  if (production)
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
