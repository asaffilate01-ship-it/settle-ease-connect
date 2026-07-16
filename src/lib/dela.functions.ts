import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Regulatory version pins — update when disclosure or privacy notice text changes.
export const DELA_DISCLOSURE_VERSION = "2026-07-v1";
export const DELA_PRIVACY_NOTICE_VERSION = "2026-07-v1";

// ============ Create draft & record disclosure ============
export const startDelaReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    userId?: string; contactId?: string; crmLeadId?: string;
    fullName?: string; email?: string; phone?: string; preferredLanguage?: string;
  }) => z.object({
    userId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(),
    crmLeadId: z.string().uuid().optional(),
    fullName: z.string().max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    preferredLanguage: z.string().max(10).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("dela_referrals")
      .insert({
        user_id: data.userId ?? null,
        contact_id: data.contactId ?? null,
        crm_lead_id: data.crmLeadId ?? null,
        status: "disclosure_shown",
        disclosure_shown_at: new Date().toISOString(),
        disclosure_version: DELA_DISCLOSURE_VERSION,
        privacy_notice_shown_at: new Date().toISOString(),
        privacy_notice_version: DELA_PRIVACY_NOTICE_VERSION,
        full_name: data.fullName ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        preferred_language: data.preferredLanguage ?? null,
        created_by: userId,
      })
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

// ============ Marketing consent ============
export const recordDelaConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { referralId: string; evidence: string }) => z.object({
    referralId: z.string().uuid(),
    evidence: z.string().min(3).max(1000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { data: row, error } = await context.supabase
      .from("dela_referrals")
      .update({
        status: "marketing_consent",
        marketing_consent_at: now,
        marketing_consent_evidence: data.evidence,
      })
      .eq("id", data.referralId)
      .select("*")
      .single();
    if (error) throw error;

    // Persist to append-only consent ledger
    await context.supabase.from("crm_consents").insert({
      user_id: row.user_id,
      contact_id: row.contact_id,
      purpose: "marketing",
      method: "portal",
      evidence: data.evidence,
      granted_at: now,
      language: row.preferred_language ?? "en",
    });
    return row;
  });

// ============ Basic info + contact method ============
export const updateDelaBasicInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    referralId: string; age?: number; householdKind?: string; postcode?: string;
    contactMethod?: "email" | "phone" | "whatsapp" | "post"; contactTimePreference?: string;
  }) => z.object({
    referralId: z.string().uuid(),
    age: z.number().int().min(0).max(120).optional(),
    householdKind: z.string().max(40).optional(),
    postcode: z.string().max(10).optional(),
    contactMethod: z.enum(["email","phone","whatsapp","post"]).optional(),
    contactTimePreference: z.string().max(200).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const nextStatus = data.contactMethod ? "contact_method_selected" : "info_collected";
    const { data: row, error } = await context.supabase
      .from("dela_referrals")
      .update({
        age: data.age ?? null,
        household_kind: data.householdKind ?? null,
        postcode: data.postcode ?? null,
        contact_method: data.contactMethod ?? null,
        contact_time_preference: data.contactTimePreference ?? null,
        status: nextStatus,
      })
      .eq("id", data.referralId)
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

// ============ Send to partner (referral ID generated on insert; this stamps the send) ============
export const sendDelaToPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { referralId: string; partnerId?: string }) => z.object({
    referralId: z.string().uuid(),
    partnerId: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Enforce that consent has been recorded before sending
    const { data: existing, error: readErr } = await context.supabase
      .from("dela_referrals")
      .select("id, marketing_consent_at, contact_method")
      .eq("id", data.referralId)
      .single();
    if (readErr) throw readErr;
    if (!existing.marketing_consent_at) throw new Error("Marketing consent required before sending referral");
    if (!existing.contact_method) throw new Error("Contact method must be selected before sending referral");

    const { data: row, error } = await context.supabase
      .from("dela_referrals")
      .update({
        status: "sent_to_partner",
        sent_to_partner_at: new Date().toISOString(),
        partner_id: data.partnerId ?? null,
      })
      .eq("id", data.referralId)
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

// ============ Partner acknowledgment / policy outcome — advisor-only via DB trigger ============
export const updateDelaOutcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    referralId: string;
    status?: "partner_acknowledged" | "application_submitted" | "policy_accepted" | "policy_declined" | "commission_due" | "commission_paid" | "cancelled" | "renewed";
    partnerCaseReference?: string;
    policyReference?: string;
    monthlyPremiumEur?: number;
    benefitAmountEur?: number;
    commissionAmountEur?: number;
    cancellationReason?: string;
  }) => z.object({
    referralId: z.string().uuid(),
    status: z.enum([
      "partner_acknowledged","application_submitted","policy_accepted","policy_declined",
      "commission_due","commission_paid","cancelled","renewed",
    ]).optional(),
    partnerCaseReference: z.string().max(200).optional(),
    policyReference: z.string().max(200).optional(),
    monthlyPremiumEur: z.number().min(0).max(10000).optional(),
    benefitAmountEur: z.number().min(0).max(10_000_000).optional(),
    commissionAmountEur: z.number().min(0).max(1_000_000).optional(),
    cancellationReason: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: Partial<{
      status: typeof data.status;
      partner_acknowledged_at: string;
      application_submitted_at: string;
      policy_accepted_at: string;
      policy_declined_at: string;
      commission_paid_at: string;
      cancelled_at: string;
      renewed_at: string;
      partner_case_reference: string;
      policy_reference: string;
      monthly_premium_eur: number;
      benefit_amount_eur: number;
      commission_amount_eur: number;
      cancellation_reason: string;
    }> = {};
    const now = new Date().toISOString();
    if (data.status) patch.status = data.status;
    if (data.status === "partner_acknowledged") patch.partner_acknowledged_at = now;
    if (data.status === "application_submitted") patch.application_submitted_at = now;
    if (data.status === "policy_accepted") patch.policy_accepted_at = now;
    if (data.status === "policy_declined") patch.policy_declined_at = now;
    if (data.status === "commission_paid") patch.commission_paid_at = now;
    if (data.status === "cancelled") patch.cancelled_at = now;
    if (data.status === "renewed") patch.renewed_at = now;
    if (data.partnerCaseReference) patch.partner_case_reference = data.partnerCaseReference;
    if (data.policyReference) patch.policy_reference = data.policyReference;
    if (data.monthlyPremiumEur !== undefined) patch.monthly_premium_eur = data.monthlyPremiumEur;
    if (data.benefitAmountEur !== undefined) patch.benefit_amount_eur = data.benefitAmountEur;
    if (data.commissionAmountEur !== undefined) patch.commission_amount_eur = data.commissionAmountEur;
    if (data.cancellationReason) patch.cancellation_reason = data.cancellationReason;

    const { data: row, error } = await context.supabase
      .from("dela_referrals")
      .update(patch)
      .eq("id", data.referralId)
      .select("*")
      .single();
    // DB trigger will raise 'Only licensed insurance advisors...' for unlicensed users
    if (error) throw new Error(error.message);
    return row;
  });

// ============ Lists ============
export const listDelaReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("dela_referrals")
      .select("id, reference, status, full_name, email, contact_method, sent_to_partner_at, policy_reference, commission_amount_eur, commission_status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const getDelaReferral = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("dela_referrals")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return row;
  });

// ============ Health-insurance triage ============
export const HEALTH_TRIAGE_ROUTES = [
  "statutory","private","student","employee","self_employed","family","needs_regulated_assessment",
] as const;

export const setHealthTriage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { insuranceLeadId: string; route: (typeof HEALTH_TRIAGE_ROUTES)[number]; notes?: string }) =>
    z.object({
      insuranceLeadId: z.string().uuid(),
      route: z.enum(HEALTH_TRIAGE_ROUTES),
      notes: z.string().max(2000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("insurance_leads")
      .update({
        triage_route: data.route,
        triage_notes: data.notes ?? null,
        triage_by: context.userId,
        triage_at: new Date().toISOString(),
      })
      .eq("id", data.insuranceLeadId)
      .select("id, triage_route, triage_notes, triage_at")
      .single();
    if (error) throw error;
    return row;
  });
