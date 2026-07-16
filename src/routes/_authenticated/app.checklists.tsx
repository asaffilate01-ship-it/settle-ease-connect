import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { checklists } from "@/lib/mock-data";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyChecklistProgress, toggleChecklistItem } from "@/lib/checklists.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/checklists")({
  component: ChecklistsPage,
});

const progressQuery = queryOptions({
  queryKey: ["checklist-progress"],
  queryFn: () => listMyChecklistProgress(),
});

function ChecklistsPage() {
  const [activeKey, setActiveKey] = useState(checklists[0].key);
  const active = checklists.find((c) => c.key === activeKey)!;
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery(progressQuery);
  const toggleFn = useServerFn(toggleChecklistItem);
  const mut = useMutation({
    mutationFn: (v: { item_id: string; done: boolean }) =>
      toggleFn({ data: { template_key: activeKey, item_id: v.item_id, done: v.done } }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["checklist-progress"] });
      const prev = qc.getQueryData<typeof rows>(["checklist-progress"]);
      qc.setQueryData<typeof rows>(["checklist-progress"], (old = []) => {
        const others = old.filter((r) => !(r.template_key === activeKey && r.item_id === v.item_id));
        return [...others, { template_key: activeKey, item_id: v.item_id, done: v.done, done_at: v.done ? new Date().toISOString() : null }];
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
    for (const r of rows) if (r.template_key === activeKey) m[r.item_id] = r.done;
    return m;
  }, [rows, activeKey]);

  const total = active.items.length;
  const doneCount = active.items.filter((i) => doneMap[i.id] ?? i.done).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display-lg font-semibold">Checklists</h1>
        <p className="text-sm text-muted-foreground">Personalised step-by-steps for every stage of life in Germany.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {checklists.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveKey(c.key)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              c.key === activeKey
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">{active.title}</h2>
            <p className="text-sm text-muted-foreground">{active.description}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-semibold">{doneCount}/{total}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">complete</div>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-primary transition-all"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>

        <div className="mt-6 space-y-2">
          {active.items.map((i) => {
            const isDone = doneMap[i.id] ?? i.done;
            return (
              <label key={i.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-4 hover:border-primary/40">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(e) => mut.mutate({ item_id: i.id, done: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <div className="flex-1">
                  <div className={`text-sm ${isDone ? "text-muted-foreground line-through" : "font-medium"}`}>
                    {i.title}
                  </div>
                  {i.note && <div className="mt-0.5 text-xs text-muted-foreground">{i.note}</div>}
                </div>
                <Button size="sm" variant="ghost">Help</Button>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
