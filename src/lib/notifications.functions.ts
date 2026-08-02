import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSupabaseAal2 } from "@/lib/aal2-middleware";

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z.object({ limit: z.number().min(1).max(200).optional() }).parse(raw ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const unreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count, error } = await context.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return count ?? 0;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const q = context.supabase.from("notifications").update({ read_at: new Date().toISOString() });
    const { error } = data.all
      ? await q.eq("user_id", context.userId).is("read_at", null)
      : await q.eq("id", data.id!).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        kind: z.string(),
        title: z.string().min(1),
        body: z.string().optional(),
        link: z.string().optional(),
        entity_type: z.string().optional(),
        entity_id: z.string().uuid().optional(),
        metadata: z.record(z.any()).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    if (data.user_id !== context.userId) {
      const { data: internal } = await context.supabase.rpc("is_internal", {
        _user_id: context.userId,
      });
      if (!internal) throw new Error("Forbidden");
    }
    const { error } = await context.supabase.from("notifications").insert({
      user_id: data.user_id,
      kind: data.kind,
      title: data.title,
      body: data.body,
      link: data.link,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      metadata: data.metadata ?? {},
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        platform: z.enum(["web", "ios", "android"]),
        endpoint: z.string().url().optional(),
        p256dh: z.string().optional(),
        auth: z.string().optional(),
        device_token: z.string().optional(),
        user_agent: z.string().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const row = { ...data, user_id: context.userId, last_seen_at: new Date().toISOString() };
    // upsert by endpoint or device_token
    const match = data.endpoint
      ? { endpoint: data.endpoint }
      : data.device_token
        ? { device_token: data.device_token }
        : null;
    if (match) {
      const { data: existing } = await context.supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", context.userId)
        .match(match)
        .maybeSingle();
      if (existing) {
        await context.supabase.from("push_subscriptions").update(row).eq("id", existing.id);
        return { ok: true, id: existing.id };
      }
    }
    const { data: inserted, error } = await context.supabase
      .from("push_subscriptions")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

export const getMyPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data;
  });

export const upsertPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        email_enabled: z.boolean().optional(),
        push_enabled: z.boolean().optional(),
        inapp_enabled: z.boolean().optional(),
        categories: z.record(z.boolean()).optional(),
        quiet_hours_start: z.number().min(0).max(23).nullable().optional(),
        quiet_hours_end: z.number().min(0).max(23).nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notification_preferences")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendPushToUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((raw: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        title: z.string().min(1),
        body: z.string().optional(),
        link: z.string().optional(),
        tag: z.string().optional(),
        kind: z.string().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    // Only internal staff may fan-out to arbitrary users; everyone else may push themselves (test).
    if (data.user_id !== context.userId) {
      const { data: internal } = await context.supabase.rpc("is_internal", {
        _user_id: context.userId,
      });
      if (!internal) throw new Error("Forbidden");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, platform, endpoint, p256dh, auth, device_token")
      .eq("user_id", data.user_id)
      .in("platform", ["web", "ios", "android"]);
    if (error) throw new Error(error.message);
    if (!subs?.length) return { ok: true, sent: 0 };

    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      link: data.link,
      tag: data.tag,
      kind: data.kind,
    });

    let sent = 0;
    const webSubscriptions = subs.filter(
      (subscription) => subscription.platform === "web" && subscription.endpoint,
    );
    if (webSubscriptions.length) {
      const webpush = (await import("web-push")).default;
      const publicKey = process.env.VAPID_PUBLIC_KEY!;
      const privateKey = process.env.VAPID_PRIVATE_KEY!;
      const subject = process.env.VAPID_SUBJECT || "mailto:security@beistandplus.de";
      if (!publicKey || !privateKey) throw new Error("VAPID keys not configured");
      webpush.setVapidDetails(subject, publicKey, privateKey);

      await Promise.all(
        webSubscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint!,
                keys: { p256dh: subscription.p256dh!, auth: subscription.auth! },
              },
              payload,
            );
            sent += 1;
          } catch (sendError: any) {
            if (sendError?.statusCode === 404 || sendError?.statusCode === 410) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", subscription.id);
            } else {
              console.warn("[push] web delivery failed", sendError?.statusCode);
            }
          }
        }),
      );
    }

    const nativeSubscriptions = subs.filter(
      (subscription) => subscription.platform !== "web" && subscription.device_token,
    );
    if (nativeSubscriptions.length) {
      const endpoint = process.env.NATIVE_PUSH_DELIVERY_ENDPOINT;
      const bearer = process.env.NATIVE_PUSH_DELIVERY_BEARER_TOKEN;
      if (!endpoint || !bearer || new URL(endpoint).protocol !== "https:") {
        throw new Error("Native push delivery is not configured");
      }
      await Promise.all(
        nativeSubscriptions.map(async (subscription) => {
          const response = await fetch(endpoint, {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.timeout(10_000),
            headers: {
              Authorization: `Bearer ${bearer}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              platform: subscription.platform,
              deviceToken: subscription.device_token,
              title: data.title,
              body: data.body,
              link: data.link,
              tag: data.tag,
              kind: data.kind,
            }),
          });
          if (response.status === 404 || response.status === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", subscription.id);
            return;
          }
          if (!response.ok) throw new Error(`Native push gateway returned ${response.status}`);
          sent += 1;
        }),
      );
    }

    return { ok: true, sent };
  });
