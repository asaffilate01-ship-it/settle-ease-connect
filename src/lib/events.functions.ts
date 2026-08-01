import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const EVENT_CATEGORIES = [
  "advice_clinic",
  "community_gathering",
  "trip",
  "workshop",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const ADVICE_TOPICS = ["health", "tax", "legal", "benefits", "general"] as const;

export type CommunityEvent = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  sub_category: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  address: string | null
  city: string | null;
  max_attendees: number | null;
  fee_eur: number;
  is_members_only: boolean;
  image_url: string | null;
  status: string;
};

/** Publishable-key client for public reads during SSR / anonymous visitors. */
function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const EVENT_COLUMNS =
  "id, title, description, category, sub_category, event_date, end_date, location, address, city, max_attendees, fee_eur, is_members_only, image_url, status";

/** Public: upcoming published events, optionally filtered by category. */
export const listUpcomingEvents = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<CommunityEvent[]> => {
    let query = publicClient()
      .from("community_events")
      .select(EVENT_COLUMNS)
      .eq("status", "published")
      .gte("event_date", new Date(Date.now() - 6 * 3600_000).toISOString())
      .order("event_date", { ascending: true })
      .limit(200);

    if (data.category) query = query.eq("category", data.category);

    const { data: rows, error } = await query;
    if (error) {
      console.error("[events] public list failed", error.message);
      return [];
    }
    return (rows ?? []).map((r) => ({ ...r, fee_eur: Number(r.fee_eur) })) as CommunityEvent[];
  });

/** Public: a single published event. */
export const getPublicEvent = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<CommunityEvent | null> => {
    const { data: row, error } = await publicClient()
      .from("community_events")
      .select(EVENT_COLUMNS)
      .eq("id", data.id)
      .eq("status", "published")
      .maybeSingle();
    if (error || !row) return null;
    return { ...row, fee_eur: Number(row.fee_eur) } as CommunityEvent;
  });

export type MyRegistration = {
  id: string;
  event_id: string;
  status: string;
  guests: number;
  created_at: string;
  event: CommunityEvent | null;
};

export const myRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyRegistration[]> => {
    const { data, error } = await context.supabase
      .from("event_registrations")
      .select(`id, event_id, status, guests, created_at, event:community_events(${EVENT_COLUMNS})`)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as MyRegistration[];
  });

export const registerForEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        eventId: z.string().uuid(),
        guests: z.number().int().min(0).max(6).default(0),
        notes: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: event, error: evErr } = await context.supabase
      .from("community_events")
      .select("id, status, is_members_only, event_date")
      .eq("id", data.eventId)
      .maybeSingle();
    if (evErr || !event) throw new Error("Event not found");
    if (event.status !== "published") throw new Error("This event is not open for registration");

    if (event.is_members_only) {
      const { data: sub } = await context.supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", context.userId)
        .in("status", ["active", "trialing", "past_due"])
        .limit(1)
        .maybeSingle();
      if (!sub) throw new Error("This event is for members only — activate a plan to register");
    }

    const { data: row, error } = await context.supabase
      .from("event_registrations")
      .upsert(
        {
          event_id: data.eventId,
          user_id: context.userId,
          status: "registered",
          guests: data.guests,
          notes: data.notes ?? null,
        },
        { onConflict: "event_id,user_id" },
      )
      .select("id, status")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, status: row.status as "registered" | "waitlist" };
  });

export const cancelRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ registrationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("id", data.registrationId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ───────────────────────── staff console ─────────────────────────

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data: staff } = await context.supabase.rpc("is_internal", {
    _user_id: context.userId,
  });
  if (!staff) throw new Error("Forbidden: staff only");
}

export const listAllEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertInternal(context);
    const { data, error } = await context.supabase
      .from("community_events")
      .select(`${EVENT_COLUMNS}, created_at, registrations:event_registrations(id, status)`)
      .order("event_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((e: any) => ({
      ...e,
      fee_eur: Number(e.fee_eur),
      registered_count: (e.registrations ?? []).filter(
        (r: any) => r.status === "registered" || r.status === "attended",
      ).length,
      waitlist_count: (e.registrations ?? []).filter((r: any) => r.status === "waitlist").length,
    }));
  });

const eventInput = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional().nullable(),
  category: z.enum(EVENT_CATEGORIES),
  sub_category: z.string().max(40).optional().nullable(),
  event_date: z.string().min(4),
  end_date: z.string().min(4).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  max_attendees: z.number().int().min(1).max(10000).optional().nullable(),
  fee_eur: z.number().min(0).max(10000).default(0),
  is_members_only: z.boolean().default(false),
  image_url: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "published", "cancelled", "completed"]).default("draft"),
});

export const saveEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid().optional(), values: eventInput }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    if (data.id) {
      const { error } = await context.supabase
        .from("community_events")
        .update(data.values)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("community_events")
      .insert({ ...data.values, organiser_user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const { error } = await context.supabase.from("community_events").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listEventRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ eventId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const { data: rows, error } = await context.supabase
      .from("event_registrations")
      .select("id, user_id, status, guests, notes, created_at")
      .eq("event_id", data.eventId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const ids = [...new Set((rows ?? []).map((r: any) => r.user_id))];
    const { data: profs } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as any[] };
    const nameOf = new Map<string, string | null>(
      (profs ?? []).map((p: any) => [p.id, p.full_name]),
    );
    return (rows ?? []).map((r: any) => ({ ...r, full_name: nameOf.get(r.user_id) ?? null }));
  });

export const setRegistrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        registrationId: z.string().uuid(),
        status: z.enum(["registered", "attended", "cancelled", "waitlist"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertInternal(context);
    const { error } = await context.supabase
      .from("event_registrations")
      .update({ status: data.status })
      .eq("id", data.registrationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
