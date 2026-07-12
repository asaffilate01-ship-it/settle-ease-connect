import { Link } from "@tanstack/react-router";

export type ActivityEntry = {
  kind: "lead" | "case" | "invoice" | "quote" | "bug";
  id: string;
  actor: string;
  verb: string;
  target: string;
  at: string;
  href: string;
};

function relTime(iso: string) {
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86_400)}d ago`;
}

export function ActivityItem({ entry }: { entry: ActivityEntry }) {
  return (
    <Link
      to={entry.href}
      className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5 text-sm last:border-0 hover:bg-muted/40"
    >
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
        {entry.actor.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1 text-xs">
        <span className="font-medium text-foreground">{entry.actor}</span>{" "}
        <span className="text-muted-foreground">{entry.verb}</span>{" "}
        <span className="truncate font-medium text-foreground">{entry.target}</span>
      </div>
      <div className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
        {relTime(entry.at)}
      </div>
    </Link>
  );
}
