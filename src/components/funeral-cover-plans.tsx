import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegulatedNotice } from "@/components/regulated-notice";

export function FuneralCoverPlans({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-parchment/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
        <ShieldCheck className="h-3.5 w-3.5" /> Licensed-provider referral
      </div>
      <h2 className="display-lg mt-3 font-semibold">Funeral cover, confirmed by the provider.</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        BeistandPlus can prepare and refer your enquiry. We do not show sample premiums as
        quotations, and no cover is active until a licensed provider issues documents that you
        accept.
      </p>
      {!compact && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "Eligibility and health questions come from the provider",
            "Benefit, exclusions and waiting period are shown before acceptance",
            "Premiums are paid under the provider's payment arrangement",
            "You keep the policy documents and cancellation information",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {item}
            </div>
          ))}
        </div>
      )}
      <div className="mt-6">
        <RegulatedNotice domain="insurance" />
      </div>
      <Button asChild className="mt-6">
        <Link to="/group-cover">
          How referrals work <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
