import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listKnowledgeServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("knowledge_services")
      .select("id, slug, name, short_description, status, category:knowledge_categories(id, slug, name, sort_order)")
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getKnowledgeService = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: svc, error } = await context.supabase
      .from("knowledge_services")
      .select(`
        *,
        category:knowledge_categories(name, slug),
        regulations:knowledge_service_regulations(
          note,
          regulation:knowledge_regulations(code, title, jurisdiction, authority, official_url, summary)
        ),
        experts:expert_services(
          is_lead, note,
          expert:experts(id, full_name, profession, city, languages, verified, wholesale_rate_eur)
        )
      `)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!svc) throw new Error("Service not found");
    return svc;
  });

export const listExperts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("experts")
      .select("id, full_name, profession, specialisations, verified, city, bundesland, languages, hourly_rate_eur, wholesale_rate_eur, status")
      .order("verified", { ascending: false })
      .order("full_name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
