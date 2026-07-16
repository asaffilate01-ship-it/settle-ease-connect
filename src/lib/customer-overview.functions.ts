import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Household / customer overview: open cases, next appointments, missing-doc alerts.
export const getCustomerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const nowIso = new Date().toISOString();
    const in30dIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. My open cases (with SLA state)
    const { data: myCasesRaw } = await (supabase as any)
      .from("case_sla_status")
      .select("case_id, title, status, priority, current_stage, sla_due_at, sla_state")
      .eq("client_user_id", userId)
      .not("status", "in", "(closed,cancelled)")
      .order("sla_due_at", { ascending: true, nullsFirst: false })
      .limit(20);
    const myCases = (myCasesRaw ?? []) as Array<{
      case_id: string;
      title: string;
      status: string;
      priority: string | null;
      current_stage: string | null;
      sla_due_at: string | null;
      sla_state: string;
    }>;
    const caseIds = myCases.map((c) => c.case_id);

    // 2. Upcoming appointments in my cases (next 30 days)
    let upcomingAppointments: Array<{
      id: string;
      case_id: string;
      title: string;
      starts_at: string;
      location: string | null;
      meeting_url: string | null;
    }> = [];
    // 3. Cases missing documents
    let missingDocsCases: Array<{ case_id: string; title: string }> = [];

    if (caseIds.length > 0) {
      const [{ data: appts }, { data: docs }] = await Promise.all([
        supabase
          .from("case_appointments")
          .select("id, case_id, title, starts_at, location, meeting_url, status")
          .in("case_id", caseIds)
          .gte("starts_at", nowIso)
          .lte("starts_at", in30dIso)
          .not("status", "eq", "cancelled")
          .order("starts_at", { ascending: true })
          .limit(10),
        supabase.from("case_documents").select("case_id").in("case_id", caseIds),
      ]);
      upcomingAppointments = (appts ?? []) as any;
      const withDocs = new Set((docs ?? []).map((d: any) => d.case_id));
      missingDocsCases = myCases
        .filter((c) => !withDocs.has(c.case_id))
        .map((c) => ({ case_id: c.case_id, title: c.title }));
    }

    // 4. Vault total across household (case_documents rows the user can see)
    const { count: vaultCount } = await supabase
      .from("case_documents")
      .select("id", { count: "exact", head: true });

    // Aggregates
    const breachedCount = myCases.filter((c) => c.sla_state === "breached").length;
    const atRiskCount = myCases.filter((c) => c.sla_state === "at_risk").length;

    return {
      openCases: myCases,
      upcomingAppointments,
      missingDocsCases,
      openCasesCount: myCases.length,
      breachedCount,
      atRiskCount,
      vaultCount: vaultCount ?? 0,
      nextAppointment: upcomingAppointments[0] ?? null,
    };
  });
