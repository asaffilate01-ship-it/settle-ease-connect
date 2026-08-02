import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2 as requireSupabaseAuth } from "@/lib/aal2-middleware";

const LEAD_STAGES = [
  "new",
  "contact_attempted",
  "assessed",
  "consented",
  "service_identified",
  "membership_proposed",
  "insurance_referral_offered",
  "referred_to_partner",
  "partner_outcome",
  "onboarded",
  "ongoing",
  "lost",
] as const;
const LEAD_TYPES = [
  "general",
  "membership",
  "insurance",
  "funeral",
  "legal",
  "tax",
  "benefits",
  "immigration",
  "translation",
  "healthcare",
  "other",
] as const;
const CONSENT_PURPOSES = [
  "marketing",
  "contact",
  "insurance_referral",
  "data_share_partner",
  "regulated_advice",
] as const;
const ACTIVITY_KINDS = ["call", "email", "whatsapp", "sms", "meeting", "note", "system"] as const;
const COMPLAINT_STATUSES = ["open", "in_review", "resolved", "rejected", "withdrawn"] as const;

async function ensureInternal(supabase: any, userId: string) {
  const { data: ok } = await supabase.rpc("is_internal", { _user_id: userId });
  if (!ok) throw new Error("Forbidden: internal staff only");
}

// ================== INBOX ==================
export const crmInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureInternal(context.supabase, context.userId);
    const now = new Date().toISOString();
    const [newLeads, unassigned, followUpsDue, slaBreached, openComplaints, stageCounts] =
      await Promise.all([
        context.supabase
          .from("crm_leads")
          .select("id,reference,lead_type,stage,priority,language,created_at,owner_user_id,notes")
          .order("created_at", { ascending: false })
          .limit(20),
        context.supabase
          .from("crm_leads")
          .select("id,reference,lead_type,stage,created_at")
          .is("owner_user_id", null)
          .limit(20),
        context.supabase
          .from("crm_follow_ups")
          .select("id,title,due_at,channel,assignee_user_id,lead_id,contact_id,user_id")
          .eq("done", false)
          .lte("due_at", now)
          .order("due_at")
          .limit(30),
        context.supabase
          .from("crm_leads")
          .select("id,reference,lead_type,stage,sla_due_at")
          .lte("sla_due_at", now)
          .not("stage", "in", "(onboarded,ongoing,lost)")
          .limit(20),
        context.supabase
          .from("crm_complaints")
          .select("id,reference,subject,severity,status,opened_at")
          .eq("status", "open")
          .limit(20),
        context.supabase.from("crm_leads").select("stage"),
      ]);
    const counts: Record<string, number> = {};
    (stageCounts.data ?? []).forEach((r: { stage: string }) => {
      counts[r.stage] = (counts[r.stage] ?? 0) + 1;
    });
    return {
      newLeads: newLeads.data ?? [],
      unassigned: unassigned.data ?? [],
      followUpsDue: followUpsDue.data ?? [],
      slaBreached: slaBreached.data ?? [],
      openComplaints: openComplaints.data ?? [],
      stageCounts: counts,
    };
  });

// ================== CONTACTS ==================
export const listCrmContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ q: z.string().optional(), limit: z.number().default(200) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    let query = context.supabase
      .from("crm_contacts")
      .select(
        "id, full_name, email, phone, preferred_language, city, source, campaign, merged_into_user_id, created_at, tags",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.q && data.q.length > 0) {
      const q = `%${data.q}%`;
      query = query.or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q},city.ilike.${q}`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    // Also fetch profiles (signed-up users) for unified search
    let profileQuery = context.supabase
      .from("profiles")
      .select("id, full_name, preferred_language, city, avatar_url, created_at")
      .limit(50);
    if (data.q && data.q.length > 0) {
      profileQuery = profileQuery.ilike("full_name", `%${data.q}%`);
    }
    const { data: profiles } = await profileQuery;
    return { contacts: rows ?? [], profiles: profiles ?? [] };
  });

export const getCrmContact = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const [contact, leads, activities, consents, followUps, complaints] = await Promise.all([
      context.supabase.from("crm_contacts").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("crm_leads")
        .select("*")
        .eq("contact_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("crm_activities")
        .select("*")
        .eq("contact_id", data.id)
        .order("occurred_at", { ascending: false })
        .limit(100),
      context.supabase
        .from("crm_consents")
        .select("*")
        .eq("contact_id", data.id)
        .order("granted_at", { ascending: false }),
      context.supabase.from("crm_follow_ups").select("*").eq("contact_id", data.id).order("due_at"),
      context.supabase
        .from("crm_complaints")
        .select("*")
        .eq("contact_id", data.id)
        .order("opened_at", { ascending: false }),
    ]);
    if (contact.error) throw new Error(contact.error.message);
    if (!contact.data) throw new Error("Contact not found");
    return {
      contact: contact.data,
      leads: leads.data ?? [],
      activities: activities.data ?? [],
      consents: consents.data ?? [],
      followUps: followUps.data ?? [],
      complaints: complaints.data ?? [],
    };
  });

export const createCrmContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        full_name: z.string().min(2).max(200),
        email: z.string().email().max(320).optional().nullable(),
        phone: z.string().max(50).optional().nullable(),
        preferred_language: z.string().max(5).default("de"),
        city: z.string().max(120).optional().nullable(),
        source: z.string().max(120).optional().nullable(),
        campaign: z.string().max(120).optional().nullable(),
        notes: z.string().max(4000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("crm_contacts")
      .insert({ ...data, created_by: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ================== USER (profile) master record ==================
export const getCrmUserRecord = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const uid = data.userId;
    const [
      profile,
      roles,
      family,
      cases_,
      subs,
      insLeads,
      funLeads,
      funPols,
      complaints,
      consents,
      activities,
      followUps,
      invoices,
      notifPrefs,
    ] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", uid),
      context.supabase.from("family_members").select("*").eq("client_user_id", uid),
      context.supabase
        .from("cases")
        .select("id, reference, title, case_type, status, urgent, opened_at, updated_at, language")
        .or(`client_user_id.eq.${uid},case_manager_user_id.eq.${uid}`)
        .order("updated_at", { ascending: false }),
      context.supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", uid)
        .order("current_period_end", { ascending: false }),
      context.supabase.from("insurance_leads").select("*").eq("assigned_to", uid),
      context.supabase.from("funeral_leads").select("*").eq("user_id", uid),
      context.supabase.from("funeral_policies").select("*").eq("user_id", uid),
      context.supabase
        .from("crm_complaints")
        .select("*")
        .eq("user_id", uid)
        .order("opened_at", { ascending: false }),
      context.supabase
        .from("crm_consents")
        .select("*")
        .eq("user_id", uid)
        .order("granted_at", { ascending: false }),
      context.supabase
        .from("crm_activities")
        .select("*")
        .eq("user_id", uid)
        .order("occurred_at", { ascending: false })
        .limit(100),
      context.supabase.from("crm_follow_ups").select("*").eq("user_id", uid).order("due_at"),
      context.supabase.from("case_invoices").select("*").limit(50),
      context.supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    return {
      profile: profile.data,
      roles: (roles.data ?? []).map((r: { role: string }) => r.role),
      family: family.data ?? [],
      cases: cases_.data ?? [],
      subscriptions: subs.data ?? [],
      insuranceLeads: insLeads.data ?? [],
      funeralLeads: funLeads.data ?? [],
      funeralPolicies: funPols.data ?? [],
      complaints: complaints.data ?? [],
      consents: consents.data ?? [],
      activities: activities.data ?? [],
      followUps: followUps.data ?? [],
      invoices: invoices.data ?? [],
      notifPrefs: notifPrefs.data,
    };
  });

// ================== LEADS ==================
export const listCrmLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        stage: z.enum(LEAD_STAGES).optional(),
        lead_type: z.enum(LEAD_TYPES).optional(),
        owner: z.string().uuid().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    let q = context.supabase
      .from("crm_leads")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (data.stage) q = q.eq("stage", data.stage);
    if (data.lead_type) q = q.eq("lead_type", data.lead_type);
    if (data.owner) q = q.eq("owner_user_id", data.owner);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getCrmLead = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const [lead, activities, followUps, consents] = await Promise.all([
      context.supabase.from("crm_leads").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("crm_activities")
        .select("*")
        .eq("lead_id", data.id)
        .order("occurred_at", { ascending: false }),
      context.supabase.from("crm_follow_ups").select("*").eq("lead_id", data.id).order("due_at"),
      context.supabase.from("crm_consents").select("*").limit(50),
    ]);
    if (lead.error) throw new Error(lead.error.message);
    if (!lead.data) throw new Error("Lead not found");
    // Load related contact/profile if any
    let contact = null;
    if (lead.data.contact_id) {
      const { data: c } = await context.supabase
        .from("crm_contacts")
        .select("*")
        .eq("id", lead.data.contact_id)
        .maybeSingle();
      contact = c;
    }
    let profile = null;
    if (lead.data.user_id) {
      const { data: p } = await context.supabase
        .from("profiles")
        .select("*")
        .eq("id", lead.data.user_id)
        .maybeSingle();
      profile = p;
    }
    const leadRow = lead.data;
    return {
      lead: leadRow,
      activities: activities.data ?? [],
      followUps: followUps.data ?? [],
      consents: (consents.data ?? []).filter(
        (c: { contact_id: string | null; user_id: string | null }) =>
          (leadRow.contact_id && c.contact_id === leadRow.contact_id) ||
          (leadRow.user_id && c.user_id === leadRow.user_id),
      ),
      contact,
      profile,
    };
  });

export const createCrmLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        contact_id: z.string().uuid().optional().nullable(),
        user_id: z.string().uuid().optional().nullable(),
        lead_type: z.enum(LEAD_TYPES).default("general"),
        source: z.string().max(120).optional().nullable(),
        campaign_id: z.string().uuid().optional().nullable(),
        priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
        language: z.string().max(5).optional().nullable(),
        notes: z.string().max(4000).optional().nullable(),
        service_interest: z.array(z.string()).default([]),
        sla_due_at: z.string().datetime().optional().nullable(),
      })
      .refine((v) => v.contact_id || v.user_id, {
        message: "Lead must reference a contact or user",
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("crm_leads")
      .insert({ ...data, created_by: context.userId, owner_user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const advanceCrmLeadStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        stage: z.enum(LEAD_STAGES),
        lost_reason: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);

    // Regulated firewall: past 'referred_to_partner' only insurance_admin/admin can move
    const gatedStages: readonly string[] = ["referred_to_partner", "partner_outcome"];
    if (gatedStages.includes(data.stage)) {
      const [{ data: isAdmin }, { data: isInsAdmin }] = await Promise.all([
        context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
        context.supabase.rpc("has_role", { _user_id: context.userId, _role: "insurance_admin" }),
      ]);
      if (!isAdmin && !isInsAdmin) {
        throw new Error("Only insurance admins can move a lead to regulated stages.");
      }
    }

    // Consent gate for insurance referral
    if (data.stage === "insurance_referral_offered" || data.stage === "referred_to_partner") {
      const { data: lead } = await context.supabase
        .from("crm_leads")
        .select("contact_id,user_id")
        .eq("id", data.id)
        .maybeSingle();
      if (lead) {
        const base = context.supabase
          .from("crm_consents")
          .select("id")
          .eq("purpose", "insurance_referral")
          .is("revoked_at", null);
        const filtered = lead.user_id
          ? base.eq("user_id", lead.user_id)
          : lead.contact_id
            ? base.eq("contact_id", lead.contact_id)
            : null;
        if (filtered) {
          const { data: consents } = await filtered;
          if (!consents || consents.length === 0) {
            throw new Error("Insurance-referral consent is required before this stage.");
          }
        }
      }
    }

    const patch: { stage: typeof data.stage; lost_reason?: string } = { stage: data.stage };
    if (data.stage === "lost" && data.lost_reason) patch.lost_reason = data.lost_reason;
    const { error } = await context.supabase.from("crm_leads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("crm_activities").insert({
      lead_id: data.id,
      kind: "system",
      subject: `Stage → ${data.stage}`,
      actor_user_id: context.userId,
    });
    return { ok: true };
  });

export const assignCrmLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), owner_user_id: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_leads")
      .update({ owner_user_id: data.owner_user_id })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================== ACTIVITIES ==================
export const addCrmActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        lead_id: z.string().uuid().optional().nullable(),
        contact_id: z.string().uuid().optional().nullable(),
        user_id: z.string().uuid().optional().nullable(),
        case_id: z.string().uuid().optional().nullable(),
        kind: z.enum(ACTIVITY_KINDS),
        direction: z.enum(["inbound", "outbound"]).optional().nullable(),
        subject: z.string().max(200).optional().nullable(),
        body: z.string().max(8000).optional().nullable(),
        duration_seconds: z.number().int().min(0).max(86400).optional().nullable(),
        outcome: z.string().max(200).optional().nullable(),
        occurred_at: z.string().datetime().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("crm_activities")
      .insert({ ...data, actor_user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ================== FOLLOW-UPS ==================
export const scheduleFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        title: z.string().min(2).max(240),
        due_at: z.string().datetime(),
        channel: z.string().max(30).optional().nullable(),
        notes: z.string().max(2000).optional().nullable(),
        lead_id: z.string().uuid().optional().nullable(),
        contact_id: z.string().uuid().optional().nullable(),
        user_id: z.string().uuid().optional().nullable(),
        case_id: z.string().uuid().optional().nullable(),
        assignee_user_id: z.string().uuid().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const assignee = data.assignee_user_id ?? context.userId;
    const { data: row, error } = await context.supabase
      .from("crm_follow_ups")
      .insert({ ...data, assignee_user_id: assignee, created_by: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const completeFollowUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), done: z.boolean().default(true) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_follow_ups")
      .update({ done: data.done, done_at: data.done ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================== CONSENTS ==================
export const recordConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        contact_id: z.string().uuid().optional().nullable(),
        user_id: z.string().uuid().optional().nullable(),
        purpose: z.enum(CONSENT_PURPOSES),
        granted: z.boolean().default(true),
        method: z.string().max(60).optional().nullable(),
        evidence: z.string().max(1000).optional().nullable(),
        language: z.string().max(5).optional().nullable(),
      })
      .refine((v) => v.contact_id || v.user_id, {
        message: "Consent requires contact_id or user_id",
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("crm_consents")
      .insert({ ...data, actor_user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const revokeConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_consents")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ================== COMPLAINTS ==================
export const listCrmComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("crm_complaints")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateComplaintStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(COMPLAINT_STATUSES),
        resolution: z.string().max(4000).optional().nullable(),
        satisfaction_score: z.number().int().min(0).max(10).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const patch: {
      status: typeof data.status;
      resolution?: string | null;
      satisfaction_score?: number | null;
      closed_at?: string;
    } = { status: data.status };
    if (data.resolution !== undefined) patch.resolution = data.resolution;
    if (data.satisfaction_score !== undefined) patch.satisfaction_score = data.satisfaction_score;
    if (["resolved", "rejected", "withdrawn"].includes(data.status))
      patch.closed_at = new Date().toISOString();
    const { error } = await context.supabase.from("crm_complaints").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        subject: z.string().min(3).max(240),
        description: z.string().max(4000).optional().nullable(),
        severity: z.enum(["low", "normal", "high", "critical"]).default("normal"),
        contact_id: z.string().uuid().optional().nullable(),
        user_id: z.string().uuid().optional().nullable(),
        case_id: z.string().uuid().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureInternal(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("crm_complaints")
      .insert({ ...data, created_by: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
