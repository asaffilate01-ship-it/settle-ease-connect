import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";

export type ChecklistTemplateRow = {
  key: string;
  title: string;
  description: string;
  position: number;
  active: boolean;
};

export type ChecklistItemRow = {
  id: string;
  template_key: string;
  item_key: string;
  title: string;
  note: string | null;
  position: number;
};

// -------- Public (authenticated) read: active templates + items ---------

export const listChecklistTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: templates, error: tErr } = await context.supabase
      .from("checklist_templates")
      .select("key, title, description, position, active")
      .order("position", { ascending: true });
    if (tErr) throw new Error(tErr.message);

    const { data: items, error: iErr } = await context.supabase
      .from("checklist_template_items")
      .select("id, template_key, item_key, title, note, position")
      .order("position", { ascending: true });
    if (iErr) throw new Error(iErr.message);

    return {
      templates: (templates ?? []) as ChecklistTemplateRow[],
      items: (items ?? []) as ChecklistItemRow[],
    };
  });

// -------- Staff-only mutations ---------

const templateSchema = z.object({
  key: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "lowercase, digits, hyphens"),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  position: z.number().int().min(0).max(100000).default(100),
  active: z.boolean().default(true),
});

export const upsertChecklistTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) => templateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
    if (!internal) throw new Error("Staff only.");
    const { error } = await context.supabase
      .from("checklist_templates")
      .upsert(data, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteChecklistTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) => z.object({ key: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
    if (!internal) throw new Error("Staff only.");
    const { error } = await context.supabase.from("checklist_templates").delete().eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  template_key: z.string().min(1).max(80),
  item_key: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/i, "letters, digits, hyphens"),
  title: z.string().min(1).max(500),
  note: z.string().max(1000).nullable().optional(),
  position: z.number().int().min(0).max(100000).default(100),
});

export const upsertChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) => itemSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
    if (!internal) throw new Error("Staff only.");
    const payload = {
      ...(data.id ? { id: data.id } : {}),
      template_key: data.template_key,
      item_key: data.item_key,
      title: data.title,
      note: data.note ?? null,
      position: data.position ?? 100,
    };
    const { error } = await context.supabase
      .from("checklist_template_items")
      .upsert(payload, { onConflict: "template_key,item_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: internal } = await context.supabase.rpc("is_internal", { _user_id: context.userId });
    if (!internal) throw new Error("Staff only.");
    const { error } = await context.supabase.from("checklist_template_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
