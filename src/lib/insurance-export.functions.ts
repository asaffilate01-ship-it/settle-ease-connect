import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAal2 as requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// CSV export of triaged insurance leads for partner handoff.
// Restricted to internal admins/insurance_admins via has_role.
export const exportInsuranceLeadsCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: canRead } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "insurance_admin",
    });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!canRead && !isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabase
      .from("insurance_leads")
      .select(
        "id, created_at, triage_at, triage_route, full_name, email, phone, preferred_language, product_line, age, stage, status",
      )
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;

    const headers = [
      "id",
      "created_at",
      "triage_at",
      "triage_route",
      "full_name",
      "email",
      "phone",
      "language",
      "product_line",
      "age",
      "stage",
      "status",
    ];
    const escape = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = (data ?? []).map((r: any) =>
      [
        r.id,
        r.created_at,
        r.triage_at,
        r.triage_route,
        r.full_name,
        r.email,
        r.phone,
        r.preferred_language,
        r.product_line,
        r.age,
        r.stage,
        r.status,
      ]
        .map(escape)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    return { csv, count: rows.length, generated_at: new Date().toISOString() };
  });
