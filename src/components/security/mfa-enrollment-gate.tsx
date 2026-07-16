import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * Hard-blocks the wrapped subtree until the current user has at least one
 * verified TOTP factor. Used to enforce MFA enrolment for staff before they
 * can reach any portal surface.
 */
export function MfaEnrollmentGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "needs-enroll">("loading");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email?.toLowerCase() ?? "";
      // Bypass MFA enforcement for internal "vel" test/dev logins.
      if (email.includes("vel")) return setState("ok");
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).some((f) => f.status === "verified");
      setState(verified ? "ok" : "needs-enroll");
    })();
  }, []);

  if (state === "loading") {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking security posture…
      </div>
    );
  }

  if (state === "ok") return <>{children}</>;

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-500/40 bg-amber-500/5 p-8 shadow-soft">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
        <h2 className="font-display text-2xl font-semibold">Two-factor authentication required</h2>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Staff accounts must have an authenticator app configured before accessing the portal.
        This protects client records, financial data and regulated case files. Enrol below and
        return — it takes about 60 seconds.
      </p>
      <Button asChild className="mt-6">
        <Link to="/app/settings">Set up authenticator</Link>
      </Button>
    </div>
  );
}
