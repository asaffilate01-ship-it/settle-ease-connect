import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORY = z.enum([
  "funeral_director",
  "lawyer",
  "translator",
  "religious_org",
  "hospital",
  "airline",
  "driving_school",
  "childcare",
  "relocation",
  "other",
]);

const TRANSLATOR_TYPE = z.enum([
  "general",
  "interpreting",
  "certified",
  "sworn",
  "medical",
  "authority_appointment",
  "urgent_phone",
]);

// ============ Service categories ============
export const listPartnerCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orgId: string }) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("partner_service_categories")
      .select("*")
      .eq("org_id", data.orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

export const addPartnerCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        category: CATEGORY,
        translatorServiceType: TRANSLATOR_TYPE.optional(),
        swornCourts: z.array(z.string().min(1)).max(20).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("partner_service_categories").insert({
      org_id: data.orgId,
      category: data.category,
      translator_service_type: data.translatorServiceType ?? null,
      sworn_courts: data.swornCourts ?? [],
      active: true,
    });
    if (error) throw error;
    return { ok: true };
  });

export const updatePartnerCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        active: z.boolean().optional(),
        swornCourts: z.array(z.string().min(1)).max(20).optional(),
        translatorServiceType: TRANSLATOR_TYPE.nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.active !== undefined) patch.active = data.active;
    if (data.swornCourts !== undefined) patch.sworn_courts = data.swornCourts;
    if (data.translatorServiceType !== undefined) patch.translator_service_type = data.translatorServiceType;
    const { error } = await context.supabase
      .from("partner_service_categories")
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const removePartnerCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("partner_service_categories").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ Service regions ============
export const listPartnerRegions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orgId: string }) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("partner_service_regions")
      .select("*")
      .eq("org_id", data.orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

export const addPartnerRegion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        city: z.string().optional(),
        bundesland: z.string().optional(),
        postalPrefix: z.string().max(5).optional(),
        radiusKm: z.number().int().positive().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("partner_service_regions").insert({
      org_id: data.orgId,
      city: data.city || null,
      bundesland: data.bundesland || null,
      postal_prefix: data.postalPrefix || null,
      radius_km: data.radiusKm ?? null,
    });
    if (error) throw error;
    return { ok: true };
  });

export const removePartnerRegion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("partner_service_regions").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ Availability ============
export const listPartnerAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orgId: string }) => z.object({ orgId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("partner_availability")
      .select("*")
      .eq("org_id", data.orgId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw error;
    return rows ?? [];
  });

export const addPartnerAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        acceptsUrgent: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.startTime >= data.endTime) throw new Error("End time must be after start time");
    const { error } = await context.supabase.from("partner_availability").insert({
      org_id: data.orgId,
      weekday: data.weekday,
      start_time: data.startTime,
      end_time: data.endTime,
      accepts_urgent: data.acceptsUrgent,
    });
    if (error) throw error;
    return { ok: true };
  });

export const removePartnerAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("partner_availability").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ Internal: document verification queue ============
export const listPartnerDocsPendingReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: isStaff } = await supabase.rpc("is_internal", { _user_id: userId });
    if (!isStaff) throw new Error("Forbidden");
    const { data, error } = await supabase
      .from("partner_documents")
      .select("id, org_id, title, category, status, storage_path, valid_until, created_at, partner_organisations(legal_name, trading_name)")
      .in("status", ["pending", "submitted", "under_review"])
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const reviewPartnerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        notes: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: isStaff } = await supabase.rpc("is_internal", { _user_id: userId });
    if (!isStaff) throw new Error("Forbidden");
    const { error } = await supabase
      .from("partner_documents")
      .update({
        status: data.decision,
        notes: data.notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
