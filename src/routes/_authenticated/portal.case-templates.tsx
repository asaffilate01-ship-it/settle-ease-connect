import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, Clock, ListTodo, Workflow } from "lucide-react";
import { toast } from "sonner";
import {
  listCaseTemplates,
  getCaseTemplate,
  applyCaseTemplate,
} from "@/lib/case-templates.functions";

const templatesQuery = queryOptions({
  queryKey: ["case-templates"],
  queryFn: () => listCaseTemplates(),
});

const templateDetailQuery = (code: string) =>
  queryOptions({
    queryKey: ["case-template", code],
    queryFn: () => getCaseTemplate({ data: { templateCode: code } }),
    enabled: Boolean(code),
  });

export const Route = createFileRoute("/_authenticated/portal/case-templates")({
  head: () => ({ meta: [{ title: "Case Templates — BeistandPlus" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(templatesQuery),
  component: CaseTemplatesPage,
  errorComponent: ({ error }) => (
    <div className="p-6">
      <AlertTriangle className="h-5 w-5" /> {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function riskTone(risk: string | null) {
  if (risk === "high") return "bg-red-500/10 text-red-600 border-red-500/20";
  if (risk === "low") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  return "bg-muted text-muted-foreground";
}

function CaseTemplatesPage() {
  const { data: templates } = useSuspenseQuery(templatesQuery);
  const [selected, setSelected] = useState<string | null>(templates[0]?.template_code ?? null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display-lg font-semibold flex items-center gap-2">
          <Workflow className="h-6 w-6 text-primary" /> Case templates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Structured journeys: stages, tasks, SLAs, and consent gates. Apply a template to any case
          to auto-populate its task list.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-2">
          {templates.map((t) => (
            <button
              key={t.template_code}
              onClick={() => setSelected(t.template_code)}
              className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                selected === t.template_code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="font-medium text-sm">{t.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{t.case_type}</span>
                {t.expected_duration_days ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {t.expected_duration_days}d
                  </span>
                ) : null}
                <Badge variant="outline" className={`text-[10px] ${riskTone(t.risk_level)}`}>
                  {t.risk_level ?? "normal"}
                </Badge>
              </div>
            </button>
          ))}
        </aside>
        <div>
          {selected ? (
            <TemplateDetail code={selected} />
          ) : (
            <p className="text-muted-foreground">Select a template.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateDetail({ code }: { code: string }) {
  const { data } = useSuspenseQuery(templateDetailQuery(code));
  const applyFn = useServerFn(applyCaseTemplate);
  const [caseId, setCaseId] = useState("");

  const applyMut = useMutation({
    mutationFn: (payload: { caseId: string }) =>
      applyFn({ data: { caseId: payload.caseId, templateCode: code } }),
    onSuccess: (r) => {
      toast.success(`Applied — ${r.tasksCreated} tasks created`);
      setCaseId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data) return <p className="text-muted-foreground">Template details unavailable.</p>;
  const { template, stages, tasks } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            </div>
            <Badge variant="outline">{template.template_code}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Case UUID to apply this template to…"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              className="max-w-md"
            />
            <Button
              onClick={() => applyMut.mutate({ caseId })}
              disabled={!caseId || applyMut.isPending}
            >
              {applyMut.isPending ? (
                "Applying…"
              ) : (
                <>
                  Apply template <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Requires access to the case. Populates <code>case_tasks</code> from stage tasks below
            and sets the case's <code>template_code</code> + <code>current_stage</code>.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <ListTodo className="h-4 w-4" /> Stages & tasks
        </h2>
        <ol className="space-y-3">
          {stages.map((s, idx) => {
            const stageTasks = tasks.filter((t) => t.stage_id === s.id);
            return (
              <li key={s.id} className="rounded-lg border border-border bg-card">
                <div className="border-b border-border/60 px-4 py-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{s.name}</span>
                  {s.sla_hours ? (
                    <Badge variant="outline" className="text-[10px]">
                      SLA {s.sla_hours}h
                    </Badge>
                  ) : null}
                  {s.required_consent ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-500/40 text-amber-600"
                    >
                      consent: {s.required_consent}
                    </Badge>
                  ) : null}
                  {s.requires_role ? (
                    <Badge variant="outline" className="text-[10px]">
                      role: {s.requires_role}
                    </Badge>
                  ) : null}
                </div>
                {s.description ? (
                  <p className="px-4 pt-2 text-xs text-muted-foreground">{s.description}</p>
                ) : null}
                {stageTasks.length ? (
                  <ul className="px-4 py-2 space-y-1">
                    {stageTasks.map((t) => (
                      <li key={t.id} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <div>
                          <span>{t.title}</span>
                          {t.description ? (
                            <span className="text-muted-foreground"> — {t.description}</span>
                          ) : null}
                          {t.offset_hours ? (
                            <span className="text-[11px] text-muted-foreground">
                              {" "}
                              (+{t.offset_hours}h)
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-2 text-xs text-muted-foreground italic">
                    No pre-populated tasks — configure per case.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
