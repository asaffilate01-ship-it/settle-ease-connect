import type { ReactNode } from "react";
import { Aal2Gate } from "@/components/security/aal2-gate";

/**
 * Requires a currently verified AAL2 session for staff portal access. The
 * server functions still enforce AAL2 independently; this gate provides the
 * enrollment/challenge experience before protected screens load.
 */
export function MfaEnrollmentGate({ children }: { children: ReactNode }) {
  return (
    <Aal2Gate reason="Staff access contains personal, financial and case data. Verify your authenticator before continuing.">
      {children}
    </Aal2Gate>
  );
}
