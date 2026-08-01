import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  severity: string;
  link_url: string | null;
  visible_from: string;
  visible_until: string | null;
};

const COLUMNS = "id, title, body, audience, severity, link_url, visible_from, visible_until";

/** Public notice board (audience = 'all', inside the visibility window). */
export const listPublicAnnouncements = createServerFn({ method: "GET" }).handler(
  async (): Promise<Announcement[]> => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const client = createClient<Database>(url, key, {
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
    const { data, error } = await client
      .from("announcements")
      .select(COLUMNS)
      .eq("audience", "all")
      .order("visible_from", { ascending: false })
      .limit(20);
    if (error) {
      console.error("[announcements] public read failed", error.message);
      return [];
    }
    return (data ?? []) as Announcement[];
  },
);

/** Member notice board — RLS returns 'all' plus the tier audiences. */
export const listMemberAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Announcement[]> => {
    const { data, error } = await context.supabase
      .from("announcements")
      .select(COLUMNS)
      .order("visible_from", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as Announcement[];
  });

const announcementInput = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(2).max(4000),
  audience: z.enum(["all", "basic", "plus", "complete", "staff"]).default("all"),
  severity: z.enum(["info", "success", "warning", "critical"]).default("info"),
  link_url: z.string().max(500).optional().nullable(),
  visible_from: z.string().min(4),
  visible_until: z.string().min(4).optional().nullable(),
});

export const saveAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid().optional(), values: announcementInput }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase
        .from("announcements")
        .update(data.values)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("announcements")
      .insert({ ...data.values, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
