import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";

// Aggregated "my desk" view for a case manager or staff member.
export const getMyDesk = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const nowIso = new Date().toISOString();
    const soonIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. My open cases (with SLA state via view)
    const { data: myCases } = await (supabase as any)
      .from("case_sla_status")
      .select("case_id, title, status, priority, current_stage, sla_due_at, sla_state, hours_remaining")
      .eq("case_manager_user_id", userId)
      .in("sla_state", ["breached", "at_risk", "on_track"])
      .order("sla_due_at", { ascending: true, nullsFirst: false })
      .limit(50);

    // 2. Tasks assigned to me, not done, due within 7 days (or overdue)
    const { data: myTasks } = await supabase
      .from("case_tasks")
      .select("id, case_id, title, due_at, status, progress_pct")
      .eq("assignee_user_id", userId)
      .eq("done", false)
      .lte("due_at", soonIso)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(50);

    // 3. Cases I manage where partner invitation is pending (invited, no accepted/declined)
    const { data: managedCaseIdRows } = await supabase
      .from("cases")
      .select("id")
      .eq("case_manager_user_id", userId)
      .not("status", "in", "(closed,cancelled)")
      .limit(500);
    const caseIds = (managedCaseIdRows ?? []).map((c) => c.id);
    let pendingPartners: Array<{
      id: string;
      case_id: string;
      partner_org_id: string | null;
      role: string;
      invited_at: string | null;
    }> = [];
    if (caseIds.length > 0) {
      const { data } = await supabase
        .from("case_assignments")
        .select("id, case_id, partner_org_id, role, invited_at, status, accepted_at, declined_at")
        .in("case_id", caseIds)
        .eq("status", "invited")
        .is("accepted_at", null)
        .is("declined_at", null)
        .order("invited_at", { ascending: true, nullsFirst: false })
        .limit(50);
      pendingPartners = (data ?? []) as any;
    }

    // 4. Overdue counts
    const breachedCount = (myCases ?? []).filter((c: any) => c.sla_state === "breached").length;
    const overdueTaskCount = (myTasks ?? []).filter(
      (t: any) => t.due_at && t.due_at < nowIso,
    ).length;

    return {
      myCases: (myCases ?? []) as Array<{
        case_id: string;
        title: string;
        status: string;
        priority: string | null;
        current_stage: string | null;
        sla_due_at: string | null;
        sla_state: string;
        hours_remaining: number | null;
      }>,
      myTasks: (myTasks ?? []) as Array<{
        id: string;
        case_id: string;
        title: string;
        due_at: string | null;
        status: string;
        progress_pct: number;
      }>,
      pendingPartners,
      breachedCount,
      overdueTaskCount,
      openCasesCount: (myCases ?? []).length,
    };
  });
