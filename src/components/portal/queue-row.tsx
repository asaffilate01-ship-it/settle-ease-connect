import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  Bug,
  FileText,
  Mail,
  Receipt,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type QueueItemKind = "lead" | "case" | "invite" | "bug" | "quote" | "invoice";

export type QueueItem = {
  kind: QueueItemKind;
  id: string;
  title: string;
  subtitle: string;
  severity: "critical" | "high" | "normal";
  ageSeconds: number;
  ownerName: string | null;
  actionHref: string;
  actionLabel: string;
};

const ICON: Record<QueueItemKind, LucideIcon> = {
  lead: FileText,
  case: Briefcase,
  invite: Mail,
  bug: Bug,
  quote: Receipt,
  invoice: Receipt,
};

function formatAge(seconds: number) {
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  const days = Math.floor(seconds / 86_400);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export function QueueRow({ item }: { item: QueueItem }) {
  const Icon = ICON[item.kind];
  const severityDot =
    item.severity === "critical"
      ? "bg-destructive"
      : item.severity === "high"
        ? "bg-amber-500"
        : "bg-muted-foreground/40";

  return (
    <Link
      to={item.actionHref}
      className="group flex items-center gap-3 border-b border-border/40 px-4 py-3 text-sm transition last:border-0 hover:bg-muted/40"
    >
      <div className="relative shrink-0">
        <span
          className={cn(
            "absolute -left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full",
            severityDot,
          )}
        />
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <div className="truncate font-medium">{item.title}</div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {item.kind}
          </div>
        </div>
        <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
      </div>
      <div className="hidden shrink-0 text-right text-xs sm:block">
        <div className="tabular-nums text-muted-foreground">{formatAge(item.ageSeconds)}</div>
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
          <UserRound className="h-3 w-3" />
          <span className="truncate max-w-[8rem]">{item.ownerName ?? "Unassigned"}</span>
        </div>
      </div>
      <div className="shrink-0 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs font-medium group-hover:border-primary/40 group-hover:text-primary">
        {item.actionLabel}
      </div>
    </Link>
  );
}
