import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

/**
 * Gates children behind AAL2 (verified TOTP challenge in the current session).
 * - If the user has no verified TOTP factor: prompts them to enable it in Settings.
 * - If AAL is already aal2: renders children.
 * - Otherwise: prompts for a 6-digit code and challenges/verifies the factor.
 */
export function Aal2Gate({ children, reason }: { children: ReactNode; reason?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "needs-enroll" | "needs-challenge">(
    "loading",
  );
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function evaluate() {
    setState("loading");
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") return setState("ok");
    const { data: fs } = await supabase.auth.mfa.listFactors();
    const verified = (fs?.totp ?? []).find((f) => f.status === "verified");
    if (!verified) return setState("needs-enroll");
    setFactorId(verified.id);
    setState("needs-challenge");
  }

  useEffect(() => {
    evaluate();
  }, []);

  async function submit() {
    if (!factorId) return;
    setBusy(true);
    const { data: chal, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr || !chal) {
      setBusy(false);
      return toast.error(cErr?.message ?? "Challenge failed");
    }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: chal.id, code });
    setBusy(false);
    if (error) return toast.error(error.message);
    setCode("");
    evaluate();
  }

  if (state === "loading") {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking security level…
      </div>
    );
  }

  if (state === "ok") return <>{children}</>;

  if (state === "needs-enroll") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          <h2 className="font-display text-xl font-semibold">Two-factor required</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {reason ?? "This area handles sensitive data."} Please enable an authenticator app before
          continuing.
        </p>
        <Button asChild className="mt-4">
          <Link to="/app/settings">Set up in Settings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h2 className="font-display text-xl font-semibold">Verify it's you</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {reason ?? "Enter the 6-digit code from your authenticator app to continue."}
      </p>
      <div className="mt-4">
        <Label htmlFor="aal2Code">Authenticator code</Label>
        <Input
          id="aal2Code"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          autoFocus
        />
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={submit} disabled={code.length !== 6 || busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify
        </Button>
      </div>
    </div>
  );
}
