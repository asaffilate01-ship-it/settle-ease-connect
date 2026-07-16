import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- SLA dashboard ----------
export const listSlaCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await (supabase as any)
      .from("case_sla_status")
      .select("*")
      .in("sla_state", ["breached", "at_risk", "on_track"])
      .order("sla_due_at", { ascending: true, nullsFirst: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as Array<{
      case_id: string;
      title: string;
      status: string;
      priority: string | null;
      risk_level: string | null;
      current_stage: string | null;
      template_code: string | null;
      case_manager_user_id: string | null;
      sla_due_at: string | null;
      sla_state: string;
      hours_remaining: number | null;
    }>;
  });

// ---------- Appointments ----------
export const listUpcomingAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { caseId?: string; days?: number }) =>
    z.object({ caseId: z.string().uuid().optional(), days: z.number().int().min(1).max(90).default(30) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const until = new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString();
    let q = supabase
      .from("case_appointments")
      .select("id, case_id, title, description, location, meeting_url, starts_at, ends_at, status, attendee_user_ids, attendee_emails, reminder_minutes")
      .lte("starts_at", until)
      .gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at", { ascending: true });
    if (data.caseId) q = q.eq("case_id", data.caseId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const createAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        caseId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        meetingUrl: z.string().url().optional().or(z.literal("")),
        startsAt: z.string(),
        endsAt: z.string(),
        attendeeEmails: z.array(z.string().email()).optional().default([]),
        reminderMinutes: z.number().int().min(0).max(1440).optional().default(60),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("case_appointments")
      .insert({
        case_id: data.caseId,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        meeting_url: data.meetingUrl || null,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        attendee_emails: data.attendeeEmails,
        reminder_minutes: data.reminderMinutes,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return row;
  });

export const updateAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("case_appointments")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------- Case closure ----------
export const closeCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        caseId: z.string().uuid(),
        reason: z.string().min(3),
        summary: z.string().min(10),
        outcome: z.enum(["resolved", "referred", "declined", "withdrawn", "no_contact", "other"]),
        followUpNeeded: z.boolean().optional().default(false),
        followUpNotes: z.string().optional(),
        requestCsat: z.boolean().optional().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const report = {
      outcome: data.outcome,
      summary: data.summary,
      follow_up_needed: data.followUpNeeded,
      follow_up_notes: data.followUpNotes ?? null,
      closed_by: context.userId,
      closed_at: new Date().toISOString(),
    };
    const { error } = await (context.supabase as any).rpc("close_case", {
      _case_id: data.caseId,
      _closure_reason: data.reason,
      _closure_report: report,
      _request_csat: data.requestCsat,
    });
    if (error) throw error;
    return { ok: true };
  });

// ---------- Open cases (for pickers) ----------
export const listOpenCases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cases")
      .select("id, title, status, current_stage, priority, sla_due_at")
      .not("status", "in", "(closed,cancelled)")
      .order("sla_due_at", { ascending: true, nullsFirst: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });
