import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyChecklistProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_checklist_progress")
      .select("template_key, item_id, done, done_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      template_key: z.string().min(1).max(80),
      item_id: z.string().min(1).max(80),
      done: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_checklist_progress")
      .upsert({
        user_id: context.userId,
        template_key: data.template_key,
        item_id: data.item_id,
        done: data.done,
        done_at: data.done ? new Date().toISOString() : null,
      }, { onConflict: "user_id,template_key,item_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
