import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";

const routes = [
  "statutory",
  "private",
  "student",
  "employee",
  "self_employed",
  "family",
  "needs_regulated_assessment",
] as const;

export const listInsuranceLeadsForTriage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .validator((d: { onlyUntriaged?: boolean }) =>
    z.object({ onlyUntriaged: z.boolean().optional().default(true) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("insurance_leads")
      .select(
        "id, full_name, email, phone, product_line, preferred_language, age, triage_route, triage_notes, triage_at, stage, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.onlyUntriaged) q = q.is("triage_route", null);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const setTriage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        route: z.enum(routes),
        notes: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("insurance_leads")
      .update({
        triage_route: data.route,
        triage_notes: data.notes ?? null,
        triage_by: context.userId,
        triage_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const triageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("insurance_leads")
      .select("triage_route")
      .limit(2000);
    if (error) throw error;
    const counts: Record<string, number> = { untriaged: 0 };
    for (const r of routes) counts[r] = 0;
    for (const row of data ?? []) {
      const k = (row as any).triage_route as string | null;
      if (!k) counts.untriaged += 1;
      else counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  });

export const TRIAGE_ROUTES = routes;
