import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Benefit, BenefitCategory } from "@/data/german-benefits";

/**
 * Public read of the persistent benefits catalogue (public.benefits_catalogue).
 * Uses the server publishable client so it works during SSR and for
 * unauthenticated visitors. Active rows only, ordered by sort_order.
 */
export const listBenefitsCatalogue = createServerFn({ method: "GET" }).handler(
  async (): Promise<Benefit[]> => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false },
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
      .from("benefits_catalogue")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[benefits_catalogue] read failed", error);
      return [];
    }

    return (data ?? []).map((row: any) => {
      const payload = (row.payload ?? {}) as {
        forms?: Benefit["forms"];
        documents?: Benefit["documents"];
        proofs?: Benefit["proofs"];
      };
      return {
        key: row.key,
        name: row.name,
        german: row.german,
        summary: row.summary,
        monthly: row.monthly ?? undefined,
        category: row.category as BenefitCategory,
        authority: row.authority,
        eligibleIf: row.eligible_if ?? [],
        forms: payload.forms ?? [],
        documents: payload.documents ?? [],
        proofs: payload.proofs ?? [],
        applyUrl: row.apply_url ?? undefined,
        notes: row.notes ?? undefined,
      } satisfies Benefit;
    });
  },
);
