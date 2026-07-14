import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns everything the current user is already claiming / applying for
 * across the platform: won insurance policies, filed tax leads, and active
 * cases (Bürgergeld, Wohngeld, Kindergeld, immigration etc.). Feeds the
 * unified "Currently claimed" section on the benefits page.
 */
export const listMyClaimedBenefits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [insurance, tax, cases] = await Promise.all([
      supabase
        .from("insurance_leads")
        .select("id, product, status, benefit_amount, updated_at, provider_key")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("tax_leads")
        .select("id, tax_year, status, estimated_refund_eur, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("cases")
        .select("id, reference, title, case_type, status, updated_at")
        .eq("client_user_id", userId)
        .not("status", "in", "(closed,cancelled)")
        .order("updated_at", { ascending: false }),
    ]);

    return {
      insurance: (insurance.data ?? []).map((r: any) => ({
        id: r.id,
        product: r.product,
        provider: r.provider_key,
        status: r.status,
        monthly_eur: r.benefit_amount ?? null,
        updated_at: r.updated_at,
      })),
      tax: (tax.data ?? []).map((r: any) => ({
        id: r.id,
        tax_year: r.tax_year,
        status: r.status,
        estimated_refund_eur: r.estimated_refund_eur ?? null,
        updated_at: r.updated_at,
      })),
      cases: (cases.data ?? []).map((r: any) => ({
        id: r.id,
        reference: r.reference,
        title: r.title,
        case_type: r.case_type,
        status: r.status,
        updated_at: r.updated_at,
      })),
    };
  });
