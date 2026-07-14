import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listDirectoryListings = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; city?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const supabase = publicClient();
    // Public browsing never returns PII (email/phone/address). Owner contact
    // details are visible only after opening a listing when signed-in, via a
    // separate owner-scoped path — not implemented here.
    let q = supabase
      .from("directory_listings")
      .select("id, business_name, category, subcategory, description, city, bundesland, languages, website, logo_url, featured")
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("business_name");
    if (data.category) q = q.eq("category", data.category);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    const { data: rows, error } = await q;
    if (error) return { listings: [], error: error.message };
    return { listings: rows ?? [], error: null };
  });


const listingSchema = z.object({
  business_name: z.string().min(2).max(200),
  category: z.string().min(2).max(80),
  subcategory: z.string().max(80).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  bundesland: z.string().max(120).optional().nullable(),
  languages: z.array(z.string()).default([]),
  website: z.string().url().optional().nullable().or(z.literal("")),
  phone: z.string().max(60).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().max(300).optional().nullable(),
  logo_url: z.string().url().optional().nullable().or(z.literal("")),
});

export const listMyDirectoryListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Owner PII (email/phone/address) is no longer granted to the authenticated
    // role at the column level. Use the admin client (RLS/grants bypassed)
    // scoped strictly to this user's own rows.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("directory_listings")
      .select("*")
      .eq("owner_user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createDirectoryListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listingSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Free listings go through staff moderation before appearing publicly.
    const { data: row, error } = await context.supabase
      .from("directory_listings")
      .insert({ ...data, owner_user_id: context.userId, status: "pending" })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

/* -------- Staff moderation queue -------- */

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId, _role: "admin",
  });
  if (!data) {
    const { data: staff } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
    if (!staff) throw new Error("Forbidden: staff only");
  }
}

export const listDirectoryModerationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: "pending" | "active" | "rejected" | "suspended" } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("directory_listings")
      .select("*")
      .eq("status", data.status ?? "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const setDirectoryListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "active", "rejected", "suspended"]),
      note: z.string().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("directory_listings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateDirectoryListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    listingSchema.partial().extend({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("directory_listings")
      .update(patch)
      .eq("id", id)
      .eq("owner_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDirectoryListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("directory_listings")
      .delete()
      .eq("id", data.id)
      .eq("owner_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
