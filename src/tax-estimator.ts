import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function makeCode() {
  return "M" + Math.random().toString(36).slice(2, 9).toUpperCase();
}

export const getMyReferralSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rows } = await supabase
      .from("member_referrals")
      .select("id, referred_email, code, status, reward_type, reward_value_eur, rewarded_at, created_at")
      .eq("referrer_user_id", userId)
      .order("created_at", { ascending: false });
    const list = rows ?? [];
    const totals = {
      pending: list.filter((r) => r.status === "pending" || r.status === "signed_up").length,
      subscribed: list.filter((r) => r.status === "subscribed" || r.status === "rewarded").length,
      rewardEur: list
        .filter((r) => r.status === "rewarded")
        .reduce((s, r) => s + Number(r.reward_value_eur ?? 0), 0),
    };
    return { referrals: list, totals };
  });

export const createMemberReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ email: z.string().email().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const code = makeCode();
    const { data: row, error } = await context.supabase
      .from("member_referrals")
      .insert({
        referrer_user_id: context.userId,
        referred_email: data.email.toLowerCase(),
        code,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
