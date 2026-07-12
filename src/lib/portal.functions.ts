import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_internal", {
    _user_id: context.userId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: internal staff only");
}

export const getPortalOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      users, cases, leads, invites, experts, directory, quotes, invoices,
      recentLeads, recentCases,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("cases").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("insurance_leads").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("role_invitations").select("id", { count: "exact", head: true })
        .is("accepted_at", null).gt("expires_at", new Date().toISOString()),
      supabaseAdmin.from("experts").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("directory_listings").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("case_quotes").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("case_invoices").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("insurance_leads")
        .select("id, full_name, email, benefit_amount, estimated_premium_min, estimated_premium_max, status, created_at, preferred_language")
        .order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("cases")
        .select("id, status, created_at, client_user_id")
        .order("created_at", { ascending: false }).limit(10),
    ]);

    return {
      counts: {
        users: users.count ?? 0,
        cases: cases.count ?? 0,
        leads: leads.count ?? 0,
        pending_invitations: invites.count ?? 0,
        experts: experts.count ?? 0,
        directory_listings: directory.count ?? 0,
        quotes: quotes.count ?? 0,
        invoices: invoices.count ?? 0,
      },
      recent_leads: recentLeads.data ?? [],
      recent_cases: recentCases.data ?? [],
    };
  });

export const listInsuranceLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const { data, error } = await context.supabase
      .from("insurance_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new","contacted","quoted","won","lost","spam"]),
      notes: z.string().max(2000).optional().nullable(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const patch: { status: string; notes?: string | null } = { status: data.status };
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await context.supabase
      .from("insurance_leads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
