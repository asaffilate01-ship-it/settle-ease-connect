import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listCommunityPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("community_posts")
      .select(
        "id, title, body, category, city, language, status, reply_count, created_at, author_user_id",
      )
      .neq("status", "hidden")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        title: z.string().min(3).max(160),
        body: z.string().min(5).max(4000),
        category: z.string().min(1).max(40).default("general"),
        city: z.string().max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("community_posts")
      .insert({ ...data, author_user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listPostReplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ postId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("community_replies")
      .select("id, body, is_staff, created_at, author_user_id")
      .eq("post_id", data.postId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const replyToPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        postId: z.string().uuid(),
        body: z.string().min(1).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", {
      _user_id: context.userId,
    });
    const { data: row, error } = await context.supabase
      .from("community_replies")
      .insert({
        post_id: data.postId,
        body: data.body,
        author_user_id: context.userId,
        is_staff: !!internal,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
