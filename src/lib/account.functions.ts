import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyAccountSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: userInfo } = await context.supabase.auth.getUser();
    const email = userInfo?.user?.email ?? null;
    const { supabase, userId } = context;

    const [subRes, planRes, casesRes, docsRes, deputiesRes, insRes, taxRes, familyRes, trustedRes] =
      await Promise.all([
        supabase
          .from("subscriptions")
          .select(
            "plan_code, status, current_period_end, current_period_start, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, environment, created_at, updated_at",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("subscription_plans")
          .select("code, name, tagline, monthly_price_eur, features, plan_group")
          .eq("active", true),
        supabase
          .from("cases")
          .select("id, title, status, created_at, case_type, reference")
          .or(`client_user_id.eq.${userId},case_manager_user_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("vault_documents")
          .select("id, title, category, is_sensitive, created_at")
          .eq("owner_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("vault_deputies")
          .select("id, invite_email, full_name, access_rule, status, allowed_categories")
          .eq("owner_user_id", userId),
        email
          ? supabase
              .from("insurance_leads")
              .select(
                "id, product_line, status, created_at, estimated_premium_min, estimated_premium_max",
              )
              .eq("email", email)
              .order("created_at", { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] as any[], error: null }),
        supabase
          .from("tax_leads")
          .select("id, tax_year, status, created_at, estimated_refund_eur")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("family_members")
          .select("id, full_name, relationship, covered_by_subscription")
          .eq("client_user_id", userId),
        supabase
          .from("trusted_contacts")
          .select("id, name, relationship, email, phone")
          .eq("client_user_id", userId),
      ]);

    const plan = subRes.data?.plan_code
      ? (planRes.data ?? []).find((p) => p.code === subRes.data!.plan_code) ?? null
      : null;

    return {
      subscription: subRes.data
        ? {
            ...subRes.data,
            plan: plan ?? null,
          }
        : null,
      allPlans: planRes.data ?? [],
      cases: casesRes.data ?? [],
      documents: docsRes.data ?? [],
      deputies: deputiesRes.data ?? [],
      insuranceLeads: insRes.data ?? [],
      taxLeads: taxRes.data ?? [],
      familyMembers: familyRes.data ?? [],
      trustedContacts: trustedRes.data ?? [],
    };
  });

export const getMyAuditTrail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ limit: z.number().min(1).max(500).optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("audit_log")
      .select("id, action, entity_type, entity_id, actor_email, metadata, created_at")
      .or(`actor_user_id.eq.${userId},subject_user_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
