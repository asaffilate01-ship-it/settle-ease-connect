import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startLocationShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        mode: z.enum(["normal", "emergency"]),
        case_id: z.string().uuid().optional(),
        alert_id: z.string().uuid().optional(),
        message: z.string().max(500).optional(),
        duration_minutes: z
          .number()
          .min(1)
          .max(24 * 60)
          .default(60),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const expires = new Date(Date.now() + data.duration_minutes * 60_000).toISOString();
    const { data: row, error } = await context.supabase
      .from("location_shares")
      .insert({
        user_id: context.userId,
        mode: data.mode,
        case_id: data.case_id,
        alert_id: data.alert_id,
        message: data.message,
        expires_at: expires,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, expires_at: expires };
  });

export const appendLocationPoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        share_id: z.string().uuid(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        accuracy_m: z.number().optional(),
        speed_mps: z.number().optional(),
        heading: z.number().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { error: insErr } = await context.supabase.from("location_points").insert({
      share_id: data.share_id,
      lat: data.lat,
      lng: data.lng,
      accuracy_m: data.accuracy_m,
      speed_mps: data.speed_mps,
      heading: data.heading,
      captured_at: now,
    });
    if (insErr) throw new Error(insErr.message);
    await context.supabase
      .from("location_shares")
      .update({
        last_lat: data.lat,
        last_lng: data.lng,
        last_accuracy_m: data.accuracy_m,
        last_point_at: now,
      })
      .eq("id", data.share_id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

export const stopLocationShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ share_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("location_shares")
      .update({ status: "stopped", stopped_at: new Date().toISOString() })
      .eq("id", data.share_id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyActiveShares = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("location_shares")
      .select("*")
      .eq("user_id", context.userId)
      .eq("status", "active")
      .order("started_at", { ascending: false });
    return data ?? [];
  });

export const listSharesForCase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ case_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("location_shares")
      .select("*")
      .eq("case_id", data.case_id)
      .order("started_at", { ascending: false });
    return rows ?? [];
  });
