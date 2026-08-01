import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAal2 } from "@/integrations/supabase/aal2-middleware";

export const listCaseTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("case_templates")
      .select("id, template_code, name, description, case_type, expected_duration_days, risk_level, active")
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return data ?? [];
  });

export const getCaseTemplate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAal2])
  .validator((d: { templateCode: string }) => z.object({ templateCode: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: tpl, error } = await supabase
      .from("case_templates")
      .select("*")
      .eq("template_code", data.templateCode)
      .maybeSingle();
    if (error) throw error;
    if (!tpl) return null;
    const { data: stages } = await supabase
      .from("case_template_stages")
      .select("id, code, position, name, description, sla_hours, required_consent, requires_role")
      .eq("template_id", tpl.id)
      .order("position");
    const stageIds = (stages ?? []).map((s) => s.id);
    const { data: tasks } = stageIds.length
      ? await supabase
          .from("case_template_tasks")
          .select("id, stage_id, position, title, description, assignee_role, offset_hours, required, requires_document")
          .in("stage_id", stageIds)
          .order("position")
      : { data: [] as never[] };
    return { template: tpl, stages: stages ?? [], tasks: tasks ?? [] };
  });

export const applyCaseTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAal2])
  .validator((d: { caseId: string; templateCode: string }) =>
    z.object({ caseId: z.string().uuid(), templateCode: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("apply_case_template", {
      _case_id: data.caseId,
      _template_code: data.templateCode,
    });
    if (error) throw error;
    return { tasksCreated: result ?? 0 };
  });
