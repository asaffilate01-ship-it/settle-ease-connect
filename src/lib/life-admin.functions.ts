import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TABLES = ["employment_records", "pensions", "health_insurance", "trusted_contacts"] as const;
type TableName = (typeof TABLES)[number];

async function assertInternal(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
  return !!data;
}

export const listLifeAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        table: z.enum(TABLES),
        clientUserId: z.string().uuid().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const isInternal = await assertInternal(context);
    const target = data.clientUserId && isInternal ? data.clientUserId : context.userId;
    const { data: rows, error } = await context.supabase
      .from(data.table)
      .select("*")
      .eq("client_user_id", target)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertLifeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        table: z.enum(TABLES),
        id: z.string().uuid().optional(),
        clientUserId: z.string().uuid().optional(),
        values: z.record(z.string(), z.any()),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const isInternal = await assertInternal(context);
    const owner = data.clientUserId && isInternal ? data.clientUserId : context.userId;
    const payload: any = { ...data.values, client_user_id: owner };
    if (data.id) {
      const { error } = await context.supabase.from(data.table).update(payload as any).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from(data.table)
      .insert(payload as any)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted?.id };
  });

export const deleteLifeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ table: z.enum(TABLES), id: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
