import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/lib/subscription";

type Plan = {
  code: string;
  name: string;
  tagline: string | null;
  monthly_price_eur: number;
  features: string[];
  plan_group: string;
  household_kind: string | null;
};

export const Route = createFileRoute("/_authenticated/app/upgrade")({
  head: () => ({
    meta: [
      { title: "Choose your plan — BeistandPlus" },
      { name: "description", content: "Basic, Plus and Complete plans for German settlement, benefits, tax and case management." },
    ],
  }),
  component: UpgradePage,
});

function UpgradePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [household, setHousehold] = useState<"single" | "family">("single");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const nav = useNavigate();
  const sub = useSubscription();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("code, name, tagline, monthly_price_eur, features, plan_group, household_kind")
        .eq("active", true)
        .order("sort_order");
      setPlans((data ?? []) as Plan[]);
      setLoading(false);
    })();
  }, []);

  async function subscribe(planCode: string) {
    setSubscribing(planCode);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) {
      toast.error("Please sign in first");
      setSubscribing(null);
      return;
    }
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    // Cancel any existing active/trialing sub row for this user, then insert new one.
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", uid)
      .in("status", ["active", "trialing", "past_due"]);
    const { error } = await supabase.from("subscriptions").insert({
      user_id: uid,
      plan_code: planCode,
      status: "trialing",
      current_period_end: periodEnd,
    });
    setSubscribing(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plan activated (trial). Redirecting to your dashboard…");
    setTimeout(() => nav({ to: "/app" }), 600);
  }

  const filtered = plans.filter((p) =>
    household === "family"
      ? p.household_kind === "family" || p.household_kind === "extended"
      : p.household_kind === null || p.household_kind === "single",
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-3 w-3" /> Plans & pricing
        </div>
        <h1 className="display-lg mt-3 font-semibold">Choose the plan that fits your household</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
          Third-party costs (visa fees, notary, funeral director, translations) are always separate and transparent. Upgrade,
          downgrade or cancel any time.
        </p>
        {!sub.loading && sub.planGroup !== "none" && (
          <div className="mt-3 text-xs text-muted-foreground">
            You're currently on <strong className="text-foreground">{sub.planName ?? sub.planCode}</strong>
            {sub.currentPeriodEnd && ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
          </div>
        )}
      </header>

      <div className="mx-auto flex w-fit rounded-xl border p-1 text-sm">
        {(["single", "family"] as const).map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHousehold(h)}
            className={`rounded-lg px-4 py-1.5 font-medium capitalize transition-colors ${
              household === h ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {h === "single" ? "Individual" : "Family"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Loading plans…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const isCurrent = sub.planCode === p.code;
            const highlight = p.plan_group === "plus";
            return (
              <article
                key={p.code}
                className={`flex flex-col rounded-2xl border-2 bg-card p-6 ${
                  highlight ? "border-primary shadow-lg" : "border-border"
                }`}
              >
                {highlight && (
                  <div className="mb-3 inline-flex w-fit rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Most popular
                  </div>
                )}
                <div className="font-display text-2xl font-semibold">{p.name}</div>
                {p.tagline && <div className="mt-1 text-sm text-muted-foreground">{p.tagline}</div>}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold">€{p.monthly_price_eur}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent || subscribing === p.code}
                  onClick={() => subscribe(p.code)}
                  className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isCurrent
                      ? "border bg-muted text-muted-foreground"
                      : highlight
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "border-2 border-primary text-primary hover:bg-primary/5"
                  } disabled:opacity-60`}
                >
                  {isCurrent ? "Current plan" : subscribing === p.code ? "Activating…" : `Choose ${p.name}`}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border bg-muted/30 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Note:</strong> plan changes take effect immediately. This preview activates a
        30-day trial without payment; once Stripe is connected, checkouts will bill your card and manage renewals automatically.
        <Link to="/app/settings" className="ml-1 text-primary hover:underline">Manage billing →</Link>
      </div>
    </div>
  );
}
