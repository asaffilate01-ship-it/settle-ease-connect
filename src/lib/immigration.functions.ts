import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
  return !!data;
}

/* -------- Embassies -------- */

export const listEmbassies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ q: z.string().optional(), city: z.string().optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase.from("embassies").select("*").eq("active", true).order("country");
    if (data.city) query = query.eq("city", data.city);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const filtered = data.q
      ? (rows ?? []).filter((r: any) =>
          [r.country, r.city, r.country_code, ...(r.languages ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(data.q!.toLowerCase()),
        )
      : rows ?? [];
    return filtered;
  });

export const upsertEmbassy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        country: z.string().min(1),
        country_code: z.string().min(2).max(3),
        mission_type: z.enum(["embassy", "consulate_general", "honorary_consulate"]),
        city: z.string().min(1),
        address: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        emergency_phone: z.string().optional().nullable(),
        visa_services: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
        notes: z.string().optional().nullable(),
        active: z.boolean().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertInternal(context))) throw new Error("Forbidden");
    if (data.id) {
      const { id, ...patch } = data;
      const { error } = await context.supabase.from("embassies").update(patch as any).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: inserted, error } = await context.supabase
      .from("embassies")
      .insert(data as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted?.id };
  });

/* -------- Family members -------- */

export const listFamily = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("family_members")
      .select("*")
      .eq("client_user_id", context.userId)
      .order("date_of_birth", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertFamily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        relationship: z.enum(["spouse", "partner", "child", "parent", "sibling", "other"]),
        full_name: z.string().min(1).max(120),
        date_of_birth: z.string().optional().nullable(),
        nationality: z.string().optional().nullable(),
        residency_status: z.string().optional().nullable(),
        passport_number: z.string().optional().nullable(),
        arrival_date: z.string().optional().nullable(),
        added_to_health_insurance_id: z.string().uuid().optional().nullable(),
        covered_by_subscription: z.boolean().optional(),
        notes: z.string().optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const payload: any = { ...data, client_user_id: context.userId };
    if (data.id) {
      const { id, ...patch } = payload;
      const { error } = await context.supabase.from("family_members").update(patch).eq("id", id).eq("client_user_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: inserted, error } = await context.supabase.from("family_members").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted?.id };
  });

export const deleteFamily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("family_members").delete().eq("id", data.id).eq("client_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------- Emergency alerts -------- */

export const listEmergencyAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("emergency_alerts")
      .select("*, profiles:client_user_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const raiseEmergencyAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        client_user_id: z.string().uuid(),
        reason: z.enum(["deceased", "hospitalised", "missing", "crisis", "unable_to_contact", "other"]),
        description: z.string().max(2000).optional().nullable(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("emergency_alerts").insert({
      client_user_id: data.client_user_id,
      raised_by_user_id: context.userId,
      reason: data.reason,
      description: data.description ?? null,
      status: "open",
    } as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateEmergencyAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "acknowledged", "resolved"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    if (!(await assertInternal(context))) throw new Error("Forbidden");
    const patch: any = { status: data.status };
    if (data.status === "acknowledged") {
      patch.acknowledged_by = context.userId;
      patch.acknowledged_at = new Date().toISOString();
    }
    if (data.status === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await context.supabase.from("emergency_alerts").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
