import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyChannels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: memberships, error } = await context.supabase
      .from("channel_members")
      .select("channel_id, last_read_at, muted, message_channels!inner(id, kind, name, case_id, created_by, last_message_at, created_at)")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const channels = (memberships ?? []).map((m: any) => ({
      ...m.message_channels,
      last_read_at: m.last_read_at,
      muted: m.muted,
    }));
    // sort by last_message_at desc
    channels.sort((a: any, b: any) => (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at));
    return channels;
  });

export const getChannel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { data: channel, error } = await context.supabase
      .from("message_channels")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const { data: members } = await context.supabase
      .from("channel_members")
      .select("user_id, role, joined_at, muted, last_read_at")
      .eq("channel_id", data.id);
    const ids = (members ?? []).map((m: any) => m.user_id);
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids)
      : { data: [] as any[] };
    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const merged = (members ?? []).map((m: any) => ({ ...m, profile: profMap.get(m.user_id) ?? null }));
    return { channel, members: merged };
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z.object({ channel_id: z.string().uuid(), limit: z.number().min(1).max(200).optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("channel_messages")
      .select("*, attachments:message_attachments(*)")
      .eq("channel_id", data.channel_id)
      .order("created_at", { ascending: true })
      .limit(data.limit ?? 100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        channel_id: z.string().uuid(),
        body: z.string().min(1).max(4000),
        reply_to_id: z.string().uuid().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString();
    const { data: row, error } = await context.supabase
      .from("channel_messages")
      .insert({
        channel_id: data.channel_id,
        sender_user_id: context.userId,
        body: data.body,
        reply_to_id: data.reply_to_id,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase
      .from("message_channels")
      .update({ last_message_at: now, updated_at: now })
      .eq("id", data.channel_id);
    // notify other members (best-effort; RLS: caller is member so this is allowed)
    const { data: members } = await context.supabase
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", data.channel_id)
      .neq("user_id", context.userId);
    if (members && members.length) {
      const preview = data.body.slice(0, 120);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: notifErr } = await supabaseAdmin.from("notifications").insert(
        members.map((m: any) => ({
          user_id: m.user_id,
          kind: "message",
          title: "New message",
          body: preview,
          link: `/app/messages/${data.channel_id}`,
          entity_type: "channel",
          entity_id: data.channel_id,
        })),
      );
      if (notifErr) console.error("notification fan-out failed:", notifErr.message);
    }
    return row;
  });

export const markChannelRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ channel_id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("channel_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("channel_id", data.channel_id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z
      .object({
        kind: z.enum(["group", "direct", "case"]),
        name: z.string().max(120).optional(),
        case_id: z.string().uuid().optional(),
        member_user_ids: z.array(z.string().uuid()).default([]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: ch, error } = await context.supabase
      .from("message_channels")
      .insert({ kind: data.kind, name: data.name, case_id: data.case_id, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const memberIds = Array.from(new Set([context.userId, ...data.member_user_ids]));
    await context.supabase.from("channel_members").insert(
      memberIds.map((uid) => ({
        channel_id: ch.id,
        user_id: uid,
        role: uid === context.userId ? "owner" : "member",
      })),
    );
    return { id: ch.id };
  });

export const addChannelMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z.object({ channel_id: z.string().uuid(), user_id: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    // Only channel owners, existing members, or internal staff may add anyone
    // (including themselves). Prevents any signed-in user from silently
    // joining a private case/DM channel just by knowing its UUID.
    const { data: channel, error: chErr } = await context.supabase
      .from("message_channels")
      .select("id, created_by")
      .eq("id", data.channel_id)
      .maybeSingle();
    if (chErr) throw new Error(chErr.message);
    if (!channel) throw new Error("Channel not found");

    const isCreator = channel.created_by === context.userId;
    const { data: myMembership } = await context.supabase
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", data.channel_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    const isMember = !!myMembership;
    const { data: internalFlag } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
    const isInternal = internalFlag === true;

    if (!isCreator && !isMember && !isInternal) {
      throw new Error("Forbidden: only channel owners, members, or staff can add members");
    }

    const { error } = await context.supabase.from("channel_members").insert({
      channel_id: data.channel_id,
      user_id: data.user_id,
      role: "member",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
