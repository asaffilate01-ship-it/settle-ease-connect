import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, GanttChart, AlertTriangle, ExternalLink } from "lucide-react";
import { listMyCapacity } from "@/lib/assignments.functions";

export const Route = createFileRoute("/_authenticated/portal/capacity")({
  head: () => ({ meta: [{ title: "Capacity — Staff portal" }] }),
  component: CapacityPage,
});

const STATUS_COLOR: Record<string, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-primary",
  blocked: "bg-red-500",
  done: "bg-emerald-500",
};

type Task = {
  id: string;
  case_id: string;
  title: string;
  status: string;
  start_at: string | null;
  due_at: string | null;
  progress_pct: number | null;
  assignee_user_id: string | null;
};

type Case = {
  id: string;
  reference: string | null;
  title: string | null;
  case_type: string | null;
  status: string;
  urgent: boolean;
  opened_at: string;
  updated_at: string;
};

function CapacityPage() {
  const fetchFn = useServerFn(listMyCapacity);
  const { data, isLoading } = useQuery({
    queryKey: ["portal", "capacity"],
    queryFn: () => fetchFn(),
  });

  const cases: Case[] = (data?.cases ?? []) as Case[];
  const tasks: Task[] = (data?.tasks ?? []) as Task[];

  const { min, max, span, totalTasks, overdue } = useMemo(() => {
    const now = Date.now();
    const dated = tasks.filter((t) => t.start_at && t.due_at);
    if (dated.length === 0)
      return {
        min: now,
        max: now + 30 * 86400000,
        span: 30 * 86400000,
        totalTasks: tasks.length,
        overdue: 0,
      };
    const mn = Math.min(...dated.map((t) => new Date(t.start_at!).getTime()), now);
    const mx = Math.max(...dated.map((t) => new Date(t.due_at!).getTime()), now + 14 * 86400000);
    const od = tasks.filter(
      (t) => t.due_at && new Date(t.due_at).getTime() < now && t.status !== "done",
    ).length;
    return { min: mn, max: mx, span: Math.max(1, mx - mn), totalTasks: tasks.length, overdue: od };
  }, [tasks]);

  const tasksByCase = useMemo(() => {
    const m = new Map<string, Task[]>();
    tasks.forEach((t) => {
      const arr = m.get(t.case_id) ?? [];
      arr.push(t);
      m.set(t.case_id, arr);
    });
    return m;
  }, [tasks]);

  // Build 4 weekly tick labels for the timeline header.
  const ticks = useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    const step = span / 4;
    for (let i = 0; i <= 4; i++) {
      const ts = min + step * i;
      out.push({
        label: new Date(ts).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
        pct: (i / 4) * 100,
      });
    }
    return out;
  }, [min, span]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <GanttChart className="h-4 w-4" /> My capacity
        </div>
        <h1 className="display-lg mt-1 font-semibold">Every open case, in one timeline</h1>
        <p className="text-sm text-muted-foreground">
          Every case currently assigned to you, with dated tasks plotted on a shared schedule so you
          can see where the next crunch lands.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label="Open cases"
          value={cases.length.toString()}
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <Kpi
          label="Scheduled tasks"
          value={totalTasks.toString()}
          icon={<GanttChart className="h-4 w-4" />}
        />
        <Kpi
          label="Overdue"
          value={overdue.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={overdue > 0 ? "warn" : undefined}
        />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          Loading capacity…
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          You have no open cases assigned. New cases appear here as soon as they are routed to you.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card p-4">
          <div className="min-w-[820px] space-y-4">
            <div className="grid grid-cols-[240px_1fr] items-center gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Case
              </div>
              <div className="relative h-4">
                {ticks.map((t, i) => (
                  <div
                    key={i}
                    className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground"
                    style={{ left: `${t.pct}%` }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {cases.map((c) => {
              const rows = tasksByCase.get(c.id) ?? [];
              return (
                <div key={c.id} className="rounded-xl border border-border/50 p-3">
                  <div className="mb-2 grid grid-cols-[240px_1fr] items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to="/app/cases/$caseId"
                          params={{ caseId: c.id }}
                          className="truncate text-sm font-semibold text-ink hover:underline"
                        >
                          {c.title ?? c.reference ?? c.id.slice(0, 8)}
                        </Link>
                        {c.urgent && (
                          <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-red-600">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="uppercase tracking-widest">{c.case_type ?? "case"}</span>
                        <span>·</span>
                        <span>{c.status}</span>
                        <Link
                          to="/portal/gantt/$caseId"
                          params={{ caseId: c.id }}
                          className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Detail <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                    <div className="relative h-2 rounded bg-muted/40">
                      {/* Now marker */}
                      <div
                        className="absolute top-0 h-full w-px bg-primary"
                        style={{
                          left: `${Math.max(0, Math.min(100, ((Date.now() - min) / span) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 pl-0">
                    {rows.length === 0 ? (
                      <div className="text-[11px] italic text-muted-foreground">
                        No dated tasks on this case yet.
                      </div>
                    ) : (
                      rows.map((t) => {
                        const hasDates = t.start_at && t.due_at;
                        const left = hasDates
                          ? Math.max(0, ((new Date(t.start_at!).getTime() - min) / span) * 100)
                          : 0;
                        const width = hasDates
                          ? Math.max(
                              1.5,
                              ((new Date(t.due_at!).getTime() - new Date(t.start_at!).getTime()) /
                                span) *
                                100,
                            )
                          : 100;
                        const color = STATUS_COLOR[t.status] ?? "bg-slate-400";
                        return (
                          <div key={t.id} className="grid grid-cols-[240px_1fr] items-center gap-3">
                            <div className="truncate text-xs text-foreground/80">{t.title}</div>
                            <div className="relative h-4 rounded bg-muted/30">
                              {hasDates ? (
                                <div
                                  className={`absolute top-0 h-full rounded ${color}`}
                                  style={{ left: `${left}%`, width: `${width}%` }}
                                >
                                  <div
                                    className="absolute inset-y-0 left-0 bg-black/25"
                                    style={{ width: `${t.progress_pct ?? 0}%` }}
                                  />
                                </div>
                              ) : (
                                <div className="grid h-full place-items-center text-[9px] text-muted-foreground">
                                  no dates
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-card p-4 ${tone === "warn" ? "border-red-500/40 bg-red-500/5" : ""}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
