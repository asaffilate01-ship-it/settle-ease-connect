import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GanttChart } from "lucide-react";
import { listCaseTasks } from "@/lib/assignments.functions";

export const Route = createFileRoute("/_authenticated/portal/gantt/$caseId")({
  head: () => ({ meta: [{ title: "Case Gantt — Staff" }] }),
  component: GanttPage,
});

const STATUS_COLOR: Record<string, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-primary",
  blocked: "bg-red-500",
  done: "bg-emerald-500",
};

function GanttPage() {
  const { caseId } = Route.useParams();
  const listFn = useServerFn(listCaseTasks);
  const { data = [], isLoading } = useQuery({
    queryKey: ["gantt", caseId],
    queryFn: () => listFn({ data: { case_id: caseId } }),
  });

  const { rows, min, max, span } = useMemo(() => {
    const tasks = data as any[];
    const withDates = tasks.filter((t) => t.start_at && t.due_at);
    if (withDates.length === 0) return { rows: tasks, min: 0, max: 0, span: 0 };
    const min = Math.min(...withDates.map((t) => new Date(t.start_at).getTime()));
    const max = Math.max(...withDates.map((t) => new Date(t.due_at).getTime()));
    return { rows: tasks, min, max, span: Math.max(1, max - min) };
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <GanttChart className="h-4 w-4" /> Case timeline
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Gantt · case {caseId.slice(0, 8)}</h1>
        <p className="text-sm text-muted-foreground">
          {span
            ? `${new Date(min).toLocaleDateString()} — ${new Date(max).toLocaleDateString()}`
            : "Add start and due dates to tasks to see them plotted here."}
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">Loading…</div>
      ) : (rows as any[]).length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">No tasks yet</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card p-4">
          <div className="min-w-[720px] space-y-2">
            {(rows as any[]).map((t) => {
              const hasDates = t.start_at && t.due_at && span > 0;
              const left = hasDates ? ((new Date(t.start_at).getTime() - min) / span) * 100 : 0;
              const width = hasDates
                ? Math.max(2, ((new Date(t.due_at).getTime() - new Date(t.start_at).getTime()) / span) * 100)
                : 100;
              const color = STATUS_COLOR[t.status] ?? "bg-slate-400";
              return (
                <div key={t.id} className="grid grid-cols-[220px_1fr_60px] items-center gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.status}</div>
                  </div>
                  <div className="relative h-6 rounded bg-muted/40">
                    {hasDates ? (
                      <div
                        className={`absolute top-0 h-full rounded ${color}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <div className="absolute inset-y-0 left-0 bg-black/20" style={{ width: `${t.progress_pct}%` }} />
                      </div>
                    ) : (
                      <div className="grid h-full place-items-center text-[10px] text-muted-foreground">no dates</div>
                    )}
                  </div>
                  <div className="text-right text-xs tabular-nums text-muted-foreground">{t.progress_pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
