import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptFamilyAccess } from "@/lib/family-access.functions";

export const Route = createFileRoute("/_authenticated/family-invite/$token")({
  component: FamilyInvitePage,
});

function FamilyInvitePage() {
  const { token } = Route.useParams();
  const acceptFn = useServerFn(acceptFamilyAccess);
  const navigate = useNavigate();
  const accept = useMutation({
    mutationFn: () => acceptFn({ data: { token } }),
    onSuccess: (result) =>
      navigate({ to: "/app/cases/$caseId", params: { caseId: result.caseId } }),
  });
  return (
    <div className="grid min-h-screen place-items-center bg-muted/20 p-4">
      <div className="w-full max-w-lg rounded-3xl border bg-card p-8 text-center shadow-soft">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <UsersRound className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold">Join the family workspace</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Accepting gives this signed-in account the exact case permissions selected by the person
          who invited you.
        </p>
        <div className="mt-5 rounded-xl border bg-muted/30 p-3 text-left text-xs text-muted-foreground">
          <ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />
          Your sign-in email must match the invitation. Access expires automatically and can be
          revoked.
        </div>
        {accept.isError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {(accept.error as Error).message}
          </div>
        )}
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => accept.mutate()}
          disabled={accept.isPending}
        >
          {accept.isPending ? (
            "Accepting…"
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Accept invitation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
