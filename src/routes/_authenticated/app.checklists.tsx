import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { checklists } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/app/checklists")({
  component: ChecklistsPage,
});

function ChecklistsPage() {
  const [activeKey, setActiveKey] = useState(checklists[0].key);
  const active = checklists.find((c) => c.key === activeKey)!;
  const [done, setDone] = useState<Record<string, boolean>>(
    Object.fromEntries(active.items.map((i) => [i.id, i.done])),
  );

  const total = active.items.length;
  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Checklists</h1>
        <p className="text-sm text-muted-foreground">Personalised step-by-steps for every stage of life in Germany.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {checklists.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setActiveKey(c.key);
              setDone(Object.fromEntries(c.items.map((i) => [i.id, i.done])));
            }}
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
          {active.items.map((i) => (
            <label key={i.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-4 hover:border-primary/40">
              <input
                type="checkbox"
                checked={done[i.id] ?? false}
                onChange={(e) => setDone((d) => ({ ...d, [i.id]: e.target.checked }))}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <div className="flex-1">
                <div className={`text-sm ${done[i.id] ? "text-muted-foreground line-through" : "font-medium"}`}>
                  {i.title}
                </div>
                {i.note && <div className="mt-0.5 text-xs text-muted-foreground">{i.note}</div>}
              </div>
              <Button size="sm" variant="ghost">Help</Button>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
