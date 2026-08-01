import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { acceptPartnerInvitation, getPartnerInvitationByToken } from "@/lib/partner.functions";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partner-invite/$token")({
  head: () => ({
    meta: [
      { title: "Partner invitation — BeistandPlus" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PartnerInvitePage,
});

function PartnerInvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const fetchInvitation = useServerFn(getPartnerInvitationByToken);
  const acceptInvitation = useServerFn(acceptPartnerInvitation);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionChecked(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionChecked(true);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const invitationQuery = useQuery({
    queryKey: ["partner-invitation", token],
    queryFn: () => fetchInvitation({ data: { token } }),
  });
  const accept = useMutation({
    mutationFn: () => acceptInvitation({ data: { token } }),
    onSuccess: () => {
      toast.success("Partner access activated");
      navigate({ to: "/partner" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const result = invitationQuery.data;
  return (
    <main className="min-h-screen bg-background px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-10">
        {invitationQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking invitation…
          </div>
        )}
        {invitationQuery.error && (
          <p role="alert" className="text-sm text-destructive">
            {(invitationQuery.error as Error).message}
          </p>
        )}
        {result && !result.ok && (
          <div className="space-y-3">
            <h1 className="font-display text-2xl font-semibold">
              {result.reason === "expired"
                ? "This invitation has expired"
                : result.reason === "already_accepted"
                  ? "This invitation was already accepted"
                  : "Invitation not found"}
            </h1>
            <p className="text-sm text-muted-foreground">Ask the inviting organisation for a new link.</p>
            <Button asChild variant="outline"><Link to="/">Back to home</Link></Button>
          </div>
        )}
        {result?.ok && (
          <div className="space-y-5">
            <div>
              <Badge variant="secondary" className="mb-3 text-[10px] uppercase tracking-wider">
                Partner invitation
              </Badge>
              <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                Join {result.invitation.organisation.trading_name || result.invitation.organisation.legal_name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Accept access as {result.invitation.is_admin ? "an organisation administrator" : "a partner user"}.
              </p>
            </div>

            {!sessionChecked ? (
              <p className="text-sm text-muted-foreground">Checking your session…</p>
            ) : !session ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in or create an account with <strong>{result.invitation.email}</strong> to accept.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth" search={{ redirect: `/partner-invite/${token}` } as never}>
                    Sign in / Create account
                  </Link>
                </Button>
              </div>
            ) : session.user.email?.toLowerCase() !== result.invitation.email.toLowerCase() ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
                You are signed in as <strong>{session.user.email}</strong>. This invitation is for{" "}
                <strong>{result.invitation.email}</strong>.
              </p>
            ) : (
              <Button className="w-full" onClick={() => accept.mutate()} disabled={accept.isPending}>
                {accept.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating…</>
                  : <><CheckCircle2 className="mr-2 h-4 w-4" /> Accept partner access</>}
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
