import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Factor = { id: string; friendly_name?: string | null; status: string; factor_type: string };

export function MfaSection() {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [pending, setPending] = useState<null | { factorId: string; qr: string; secret: string }>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    setLoading(false);
    if (error) return toast.error(error.message);
    setFactors((data?.totp ?? []) as Factor[]);
  }

  useEffect(() => { refresh(); }, []);

  async function startEnroll() {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setEnrolling(false);
    if (error) return toast.error(error.message);
    setPending({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify() {
    if (!pending) return;
    setVerifying(true);
    const { data: chal, error: cErr } = await supabase.auth.mfa.challenge({ factorId: pending.factorId });
    if (cErr || !chal) { setVerifying(false); return toast.error(cErr?.message ?? "Challenge failed"); }
    const { error } = await supabase.auth.mfa.verify({ factorId: pending.factorId, challengeId: chal.id, code });
    setVerifying(false);
    if (error) return toast.error(error.message);
    toast.success("Two-factor authentication enabled");
    setPending(null); setCode("");
    refresh();
  }

  async function cancelPending() {
    if (!pending) return;
    await supabase.auth.mfa.unenroll({ factorId: pending.factorId });
    setPending(null); setCode("");
  }

  async function remove(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) return toast.error(error.message);
    toast.success("Factor removed");
    refresh();
  }

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h2 className="font-display text-xl font-semibold">Two-factor authentication</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Add an authenticator app (Google Authenticator, 1Password, Authy) as a second step at sign-in.
      </p>

      {loading ? (
        <div className="mt-4 flex items-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {verified.length === 0 ? (
            <p className="text-sm text-muted-foreground">No authenticator enrolled yet.</p>
          ) : (
            verified.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-primary/40 text-primary">TOTP</Badge>
                  <span className="text-sm">{f.friendly_name || "Authenticator app"}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>
                  <Trash2 className="mr-1 h-4 w-4" /> Remove
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {pending ? (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium">Scan this QR code in your authenticator app</p>
          <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {pending.qr && (
              <img src={pending.qr} alt="TOTP QR code" className="h-40 w-40 rounded-md bg-white p-2" />
            )}
            <div className="text-xs text-muted-foreground">
              <p>Or enter this secret manually:</p>
              <code className="mt-1 block break-all rounded bg-muted px-2 py-1 text-[11px]">{pending.secret}</code>
            </div>
          </div>
          <div className="mt-4 max-w-xs">
            <Label htmlFor="totpCode">6-digit code</Label>
            <Input id="totpCode" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={verify} disabled={code.length !== 6 || verifying}>
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify & enable
            </Button>
            <Button variant="ghost" onClick={cancelPending}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button onClick={startEnroll} disabled={enrolling} variant={verified.length > 0 ? "outline" : "default"}>
            {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {verified.length > 0 ? "Add another authenticator" : "Enable authenticator app"}
          </Button>
        </div>
      )}
    </div>
  );
}
