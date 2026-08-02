import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getExpertInvitationByToken, acceptExpertInvitation } from "@/lib/experts.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/expert-invite/$token")({
  head: () => ({
    meta: [
      { title: "Expert invitation — BeistandPlus" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ExpertInvitePage,
});

function ExpertInvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const fetchInv = useServerFn(getExpertInvitationByToken);
  const acceptFn = useServerFn(acceptExpertInvitation);

  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setSessionChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["expert-invitation", token],
    queryFn: () => fetchInv({ data: { token } }),
  });

  const accept = useMutation({
    mutationFn: () => acceptFn({ data: { token } }),
    onSuccess: () => {
      toast.success("Invitation accepted — your profile is awaiting verification");
      navigate({ to: "/app" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-14 sm:py-20">
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-10">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking invitation…
            </div>
          )}
          {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}
          {data && !data.ok && (
            <div className="space-y-3">
              <h1 className="font-display text-2xl font-semibold">
                {data.reason === "expired"
                  ? "This invitation has expired"
                  : data.reason === "already_accepted"
                    ? "This invitation was already accepted"
                    : "Invitation not found"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Please contact the BeistandPlus team to request a new link.
              </p>
              <Button asChild variant="outline">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          )}
          {data && data.ok && (
            <div className="space-y-5">
              <div>
                <Badge variant="secondary" className="mb-3 text-[10px] uppercase tracking-wider">
                  Expert invitation
                </Badge>
                <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Welcome, {data.invitation.full_name}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  You&apos;ve been invited to begin provider onboarding as a{" "}
                  <strong>{data.invitation.profession}</strong>.
                </p>
              </div>

              {data.invitation.personal_message && (
                <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm italic">
                  "{data.invitation.personal_message}"
                </div>
              )}

              <div className="rounded-xl border border-border/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Compensation terms
                </div>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Model</dt>
                    <dd className="font-medium">{data.invitation.compensation_model}</dd>
                  </div>
                  {data.invitation.referral_fee_pct != null && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Referral fee</dt>
                      <dd className="font-medium">{data.invitation.referral_fee_pct}%</dd>
                    </div>
                  )}
                  {data.invitation.wholesale_rate_eur != null && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Wholesale rate</dt>
                      <dd className="font-medium">€{data.invitation.wholesale_rate_eur}/hr</dd>
                    </div>
                  )}
                  {data.invitation.hourly_rate_eur != null && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Hourly rate</dt>
                      <dd className="font-medium">€{data.invitation.hourly_rate_eur}/hr</dd>
                    </div>
                  )}
                </dl>
              </div>

              {!sessionChecked ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : !session ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sign in or create your account with <strong>{data.invitation.email}</strong> to
                    accept.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/auth" search={{ redirect: `/expert-invite/${token}` } as any}>
                      Sign in / Create account
                    </Link>
                  </Button>
                </div>
              ) : session.user?.email?.toLowerCase() !== data.invitation.email.toLowerCase() ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  You're signed in as <strong>{session.user?.email}</strong>. This invitation is for{" "}
                  <strong>{data.invitation.email}</strong>. Please sign out and sign in with the
                  invited address.
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => accept.mutate()}
                  disabled={accept.isPending}
                >
                  {accept.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Accept & create profile
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
