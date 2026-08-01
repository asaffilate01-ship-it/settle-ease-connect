import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "./auth-middleware";
import { hasAal2 } from "@/lib/auth-assurance";

/**
 * Server-side MFA enforcement. UI gates improve the experience, but this
 * middleware is the security boundary for sensitive server functions.
 */
export const requireSupabaseAal2 = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    if (!hasAal2(context.claims as Record<string, unknown>)) {
      throw new Error("MFA_REQUIRED: verify your authenticator code and try again");
    }
    return next();
  });
