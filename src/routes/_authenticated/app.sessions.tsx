import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMySessions, listMyFactors } from "@/lib/session-activity.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const listSessions = useServerFn(listMySessions);
  const listFactors = useServerFn(listMyFactors);
  const { data: sessions = [] } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: () => listSessions(),
  });
  const { data: factors } = useQuery({
    queryKey: ["my-factors"],
    queryFn: () => listFactors(),
  });

  async function signOutOtherDevices() {
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) return toast.error(error.message);
    toast.success("Other device sessions have been signed out");
  }

  const allFactors = [...(factors?.totp ?? []), ...(factors?.phone ?? [])] as any[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">Sessions & security</h1>
        <p className="text-sm text-muted-foreground">
          Review authentication activity and protect access to your account.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 font-medium">
          <KeyRound className="h-4 w-4" /> Authenticator factors
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          BeistandPlus currently supports authenticator-app codes. Passkeys are not enabled yet.
        </p>
        <div className="mt-3 space-y-2">
          {allFactors.length === 0 && (
            <p className="text-sm text-muted-foreground">No verified factor is enrolled.</p>
          )}
          {allFactors.map((f: any) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm"
            >
              <div>
                {f.friendly_name ??
                  (f.factor_type === "totp" ? "Authenticator app" : f.factor_type)}
              </div>
              <Badge variant="outline">{f.status}</Badge>
            </div>
          ))}
        </div>
        <Button asChild className="mt-4">
          <Link to="/app/settings">Manage two-factor authentication</Link>
        </Button>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <Shield className="h-4 w-4" /> Security activity
          </div>
          <Button variant="outline" size="sm" onClick={signOutOtherDevices}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out other devices
          </Button>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          This is an event history, not a live device inventory. Signing out other devices revokes
          their refresh sessions.
        </p>
        <div className="space-y-2">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent security events.</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-sm"
            >
              <div>
                <div className="font-medium">{s.event}</div>
                <div className="text-xs text-muted-foreground">
                  {s.device_label ?? s.user_agent ?? "Unknown device"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
