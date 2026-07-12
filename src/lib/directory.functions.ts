import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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
    let q = supabase
      .from("directory_listings")
      .select("id, business_name, category, subcategory, description, city, bundesland, languages, website, phone, email, logo_url, featured")
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("business_name");
    if (data.category) q = q.eq("category", data.category);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    const { data: rows, error } = await q;
    if (error) return { listings: [], error: error.message };
    return { listings: rows ?? [], error: null };
  });
