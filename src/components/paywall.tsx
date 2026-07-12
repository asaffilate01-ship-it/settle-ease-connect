import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { tierForFeature, tierMeets, useSubscription, type PlanGroup } from "@/lib/subscription";

const TIER_LABEL: Record<PlanGroup, string> = {
  none: "No plan",
  basic: "Basic",
  plus: "Plus",
  complete: "Complete",
};

const TIER_PRICE: Record<PlanGroup, string> = {
  none: "—",
  basic: "€5",
  plus: "€10",
  complete: "€25",
};

export function PlanChip() {
  const s = useSubscription();
  if (s.loading) return null;
  const tone =
    s.planGroup === "complete"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : s.planGroup === "plus"
        ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
        : s.planGroup === "basic"
          ? "bg-sky-500/15 text-sky-600 dark:text-sky-300"
          : "bg-muted text-muted-foreground";
  return (
    <Link to="/app/upgrade" className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone} hover:opacity-90`}>
      <Sparkles className="h-3 w-3" />
      {TIER_LABEL[s.planGroup]}{s.planGroup !== "none" && ` · ${TIER_PRICE[s.planGroup]}/mo`}
    </Link>
  );
}

/** Wrap protected feature content; renders upgrade card when tier is insufficient. */
export function PaywallGuard({
  feature,
  requires,
  children,
  compact,
}: {
  feature?: string;
  requires?: PlanGroup;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const s = useSubscription();
  const required = requires ?? (feature ? tierForFeature(feature) : "basic");
  if (s.loading) {
    return <div className="rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">Loading…</div>;
  }
  if (tierMeets(s.planGroup, required)) return <>{children}</>;
  return <UpgradeCard current={s.planGroup} required={required} compact={compact} />;
}

export function UpgradeCard({
  current,
  required,
  compact,
}: {
  current: PlanGroup;
  required: PlanGroup;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 ${compact ? "p-4" : "p-6"} text-center`}>
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
        <Lock className="h-5 w-5" />
      </div>
      <div className="mt-3 font-display text-lg font-semibold">
        {TIER_LABEL[required]} plan needed
      </div>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        You're on {TIER_LABEL[current]}. Upgrade to {TIER_LABEL[required]} ({TIER_PRICE[required]}/mo) to unlock this feature.
      </p>
      <Link
        to="/app/upgrade"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        View plans
      </Link>
    </div>
  );
}

/** Small lock icon indicating a locked feature — for inline use in cards. */
export function LockedBadge({ required }: { required: PlanGroup }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      <Lock className="h-2.5 w-2.5" /> {TIER_LABEL[required]}
    </span>
  );
}
