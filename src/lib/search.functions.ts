import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hasAal2 } from "@/lib/auth-assurance";

export type WorkspaceSearchResult = {
  id: string;
  kind: "case" | "provider" | "knowledge" | "contact" | "lead";
  title: string;
  subtitle: string;
  to: string;
};

function matches(query: string, values: Array<string | null | undefined>) {
  return values.some((value) => value?.toLocaleLowerCase().includes(query));
}

export const searchWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => z.object({ query: z.string().trim().min(2).max(100) }).parse(raw))
  .handler(async ({ data, context }) => {
    const query = data.query.toLocaleLowerCase();
    const { data: internal } = await context.supabase.rpc("is_internal", {
      _user_id: context.userId,
    });

    const [cases, providers, services] = await Promise.all([
      context.supabase
        .from("cases")
        .select("id, reference, title, case_type, status, city")
        .order("updated_at", { ascending: false })
        .limit(200),
      (context.supabase as any)
        .from("public_directory_listings")
        .select("id, business_name, category, city")
        .limit(150),
      context.supabase
        .from("knowledge_services")
        .select("id, name, slug, short_description")
        .eq("status", "active")
        .limit(150),
    ]);

    const results: WorkspaceSearchResult[] = [];
    for (const row of cases.data ?? []) {
      if (!matches(query, [row.reference, row.title, row.case_type, row.status, row.city]))
        continue;
      results.push({
        id: `case:${row.id}`,
        kind: "case",
        title: row.title,
        subtitle: `${row.reference} · ${row.status.replaceAll("_", " ")}`,
        to: `/app/cases/${row.id}`,
      });
    }
    for (const row of providers.data ?? []) {
      if (!matches(query, [row.business_name, row.category, row.city])) continue;
      results.push({
        id: `provider:${row.id}`,
        kind: "provider",
        title: row.business_name,
        subtitle: [row.category, row.city].filter(Boolean).join(" · "),
        to: internal ? "/portal/directory" : "/app/providers",
      });
    }
    for (const row of services.data ?? []) {
      if (!matches(query, [row.name, row.slug, row.short_description])) continue;
      results.push({
        id: `knowledge:${row.id}`,
        kind: "knowledge",
        title: row.name,
        subtitle: row.short_description ?? "Service guide",
        to: internal ? `/portal/knowledge/${row.slug}` : "/services",
      });
    }

    if (internal && hasAal2(context.claims as Record<string, unknown>)) {
      const [contacts, leads] = await Promise.all([
        context.supabase
          .from("crm_contacts")
          .select("id, full_name, email, city")
          .order("updated_at", { ascending: false })
          .limit(200),
        context.supabase
          .from("crm_leads")
          .select("id, reference, lead_type, stage")
          .order("updated_at", { ascending: false })
          .limit(200),
      ]);
      for (const row of contacts.data ?? []) {
        if (!matches(query, [row.full_name, row.email, row.city])) continue;
        results.push({
          id: `contact:${row.id}`,
          kind: "contact",
          title: row.full_name || row.email || "CRM contact",
          subtitle: [row.email, row.city].filter(Boolean).join(" · "),
          to: `/portal/crm/contacts/${row.id}`,
        });
      }
      for (const row of leads.data ?? []) {
        if (!matches(query, [row.reference, row.lead_type, row.stage])) continue;
        results.push({
          id: `lead:${row.id}`,
          kind: "lead",
          title: row.reference,
          subtitle: `${row.lead_type.replaceAll("_", " ")} · ${row.stage.replaceAll("_", " ")}`,
          to: `/portal/crm/leads/${row.id}`,
        });
      }
    }

    return results.slice(0, 30);
  });
