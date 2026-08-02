import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, Circle, Flag, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  listCaseMilestones,
  saveCaseMilestone,
  setMilestoneStatus,
} from "@/lib/case-milestones.functions";

type Milestone = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  target_at: string | null;
  completed_at: string | null;
};

/** Case milestones with visible progress for the client and the case team. */
export function CaseMilestones({ caseId }: { caseId: string }) {
  const listFn = useServerFn(listCaseMilestones);
  const saveFn = useServerFn(saveCaseMilestone);
  const statusFn = useServerFn(setMilestoneStatus);
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["case-milestones", caseId],
    queryFn: () => listFn({ data: { caseId } }),
  });
  const milestones = (data ?? []) as Milestone[];
  const done = milestones.filter((item) => item.status === "done").length;
  const pct = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  const refresh = () => qc.invalidateQueries({ queryKey: ["case-milestones", caseId] });

  const add = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          caseId,
          code:
            title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .slice(0, 60) || "milestone",
          title,
          status: "pending",
          position: milestones.length,
        },
      }),
    onSuccess: async () => {
      setTitle("");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const toggle = useMutation({
    mutationFn: (item: Milestone) =>
      statusFn({ data: { id: item.id, status: item.status === "done" ? "in_progress" : "done" } }),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <Flag className="h-4 w-4 text-primary" /> Milestones
        </div>
        <Badge variant="outline">{pct}% complete</Badge>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading milestones…</p>
        ) : milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones set for this case yet.</p>
        ) : (
          milestones.map((item) => (
            <button
              key={item.id}
              onClick={() => toggle.mutate(item)}
              className="flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition hover:bg-muted/30"
            >
              {item.status === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
              <span className="min-w-0">
                <span className={item.status === "done" ? "line-through opacity-70" : ""}>
                  {item.title}
                </span>
                {item.target_at && (
                  <span className="block text-xs text-muted-foreground">
                    Target {new Date(item.target_at).toLocaleDateString()}
                  </span>
                )}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a milestone…"
        />
        <Button onClick={() => add.mutate()} disabled={!title.trim() || add.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
