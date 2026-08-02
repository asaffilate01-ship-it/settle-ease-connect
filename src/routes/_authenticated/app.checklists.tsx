import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyChecklistProgress, toggleChecklistItem } from "@/lib/checklists.functions";
import { listChecklistTemplates } from "@/lib/checklist-templates.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/checklists")({
  component: ChecklistsPage,
});

const progressQuery = queryOptions({
  queryKey: ["checklist-progress"],
  queryFn: () => listMyChecklistProgress(),
});

const templatesQuery = queryOptions({
  queryKey: ["checklist-templates-public"],
  queryFn: () => listChecklistTemplates(),
});

function ChecklistsPage() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery(progressQuery);
  const { data: tpl } = useQuery(templatesQuery);
  const templates = useMemo(() => (tpl?.templates ?? []).filter((t) => t.active), [tpl]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const effectiveKey = activeKey ?? templates[0]?.key ?? null;

  const items = useMemo(
    () => (tpl?.items ?? []).filter((i) => i.template_key === effectiveKey),
    [tpl, effectiveKey],
  );
  const active = templates.find((t) => t.key === effectiveKey) ?? null;

  const toggleFn = useServerFn(toggleChecklistItem);
  const mut = useMutation({
    mutationFn: (v: { item_id: string; done: boolean }) =>
      toggleFn({ data: { template_key: effectiveKey!, item_id: v.item_id, done: v.done } }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["checklist-progress"] });
      const prev = qc.getQueryData<typeof rows>(["checklist-progress"]);
      qc.setQueryData<typeof rows>(["checklist-progress"], (old = []) => {
        const others = old.filter(
          (r) => !(r.template_key === effectiveKey && r.item_id === v.item_id),
        );
        return [
          ...others,
          {
            template_key: effectiveKey!,
            item_id: v.item_id,
            done: v.done,
            done_at: v.done ? new Date().toISOString() : null,
          },
        ];
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["checklist-progress"], ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["checklist-progress"] }),
  });

  const doneMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const r of rows) if (r.template_key === effectiveKey) m[r.item_id] = r.done;
    return m;
  }, [rows, effectiveKey]);

  const total = items.length;
  const doneCount = items.filter((i) => doneMap[i.item_key]).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">Checklists</h1>
        <p className="text-sm text-muted-foreground">
          Personalised step-by-steps for every stage of life in Germany.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveKey(c.key)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              c.key === effectiveKey
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">{active.title}</h2>
              <p className="text-sm text-muted-foreground">{active.description}</p>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-semibold">
                {doneCount}/{total}
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                complete
              </div>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-primary transition-all"
              style={{ width: total ? `${(doneCount / total) * 100}%` : "0%" }}
            />
          </div>

          <div className="mt-6 space-y-2">
            {items.map((i) => {
              const isDone = doneMap[i.item_key] ?? false;
              return (
                <label
                  key={i.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-4 hover:border-primary/40"
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={(e) => mut.mutate({ item_id: i.item_key, done: e.target.checked })}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="flex-1">
                    <div
                      className={`text-sm ${isDone ? "text-muted-foreground line-through" : "font-medium"}`}
                    >
                      {i.title}
                    </div>
                    {i.note && <div className="mt-0.5 text-xs text-muted-foreground">{i.note}</div>}
                  </div>
                  <Button size="sm" variant="ghost">
                    Help
                  </Button>
                </label>
              );
            })}
            {items.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                No steps yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
