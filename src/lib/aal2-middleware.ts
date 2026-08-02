import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hasAal2 } from "@/lib/auth-assurance";

/**
 * Server-enforced MFA boundary for regulated or high-impact operations.
 * UI gates improve the experience; this middleware is the security control.
 */
export const requireSupabaseAal2 = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    if (!hasAal2(context.claims as Record<string, unknown>)) {
      throw new Error("MFA required: verify your authenticator and try again");
    }
    return next();
  });
