import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanGroup = "none" | "basic" | "plus" | "complete";

const RANK: Record<PlanGroup, number> = { none: 0, basic: 1, plus: 2, complete: 3 };

export type SubscriptionInfo = {
  planCode: string | null;
  planGroup: PlanGroup;
  planName: string | null;
  status: string | null;
  monthlyPrice: number | null;
  currentPeriodEnd: string | null;
  loading: boolean;
};

/** Feature key → minimum plan tier required. */
export const FEATURE_TIER: Record<string, PlanGroup> = {
  overview: "basic",
  assistant: "basic",
  checklists: "basic",
  documents: "basic",
  community: "none",
  providers: "basic",
  benefits: "basic",
  bugs: "basic",
  settings: "basic",
  // Plus (€10)
  insurance: "plus",
  tax: "plus",
  visa: "plus",
  driving: "plus",
  education: "plus",
  // Complete (€25)
  cases: "complete",
  bereavement: "complete",
  dedicated_manager: "complete",
};

export function tierMeets(current: PlanGroup, required: PlanGroup): boolean {
  return RANK[current] >= RANK[required];
}

export function tierForFeature(feature: string): PlanGroup {
  return FEATURE_TIER[feature] ?? "basic";
}

export function useSubscription(): SubscriptionInfo {
  const [info, setInfo] = useState<SubscriptionInfo>({
    planCode: null,
    planGroup: "none",
    planName: null,
    status: null,
    monthlyPrice: null,
    currentPeriodEnd: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) {
        if (!cancelled) setInfo((s) => ({ ...s, loading: false }));
        return;
      }
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_code, status, current_period_end")
        .eq("user_id", uid)
        .in("status", ["active", "trialing", "past_due"])
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sub) {
        if (!cancelled) setInfo({ planCode: null, planGroup: "none", planName: null, status: null, monthlyPrice: null, currentPeriodEnd: null, loading: false });
        return;
      }
      const { data: plan } = sub.plan_code
        ? await supabase
            .from("subscription_plans")
            .select("plan_group, name, monthly_price_eur")
            .eq("code", sub.plan_code)
            .maybeSingle()
        : { data: null };
      if (cancelled) return;
      setInfo({
        planCode: sub.plan_code,
        planGroup: ((plan?.plan_group as PlanGroup) ?? "basic"),
        planName: plan?.name ?? null,
        status: sub.status,
        monthlyPrice: plan?.monthly_price_eur ? Number(plan.monthly_price_eur) : null,
        currentPeriodEnd: sub.current_period_end,
        loading: false,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return info;
}
