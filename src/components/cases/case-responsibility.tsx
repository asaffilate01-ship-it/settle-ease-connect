import { CheckCircle2, CirclePause, Hand, UserRound, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const RESPONSIBILITY: Record<
  string,
  { label: string; detail: string; tone: string; icon: typeof Hand }
> = {
  new: {
    label: "With BeistandPlus",
    detail: "The team will review the new case.",
    tone: "border-blue-500/30 bg-blue-500/10 text-blue-800",
    icon: UsersRound,
  },
  triage: {
    label: "With BeistandPlus",
    detail: "The team is assessing the next step.",
    tone: "border-blue-500/30 bg-blue-500/10 text-blue-800",
    icon: UsersRound,
  },
  in_progress: {
    label: "With BeistandPlus",
    detail: "Work is in progress; updates appear here.",
    tone: "border-primary/30 bg-primary/10 text-primary",
    icon: UsersRound,
  },
  awaiting_client: {
    label: "Waiting for you",
    detail: "Open the conversation or tasks to see what is needed.",
    tone: "border-purple-500/30 bg-purple-500/10 text-purple-800",
    icon: Hand,
  },
  awaiting_expert: {
    label: "With a provider",
    detail: "An assigned expert or provider is expected to respond.",
    tone: "border-orange-500/30 bg-orange-500/10 text-orange-800",
    icon: UserRound,
  },
  on_hold: {
    label: "Paused",
    detail: "The case is paused; the conversation should explain why.",
    tone: "border-border bg-muted text-muted-foreground",
    icon: CirclePause,
  },
  completed: {
    label: "Completed",
    detail: "The recorded work is complete.",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800",
    icon: CheckCircle2,
  },
  closed: {
    label: "Closed",
    detail: "The case is closed.",
    tone: "border-border bg-muted text-muted-foreground",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    detail: "No further work is scheduled.",
    tone: "border-border bg-muted text-muted-foreground",
    icon: CirclePause,
  },
};

export function CaseResponsibility({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const state = RESPONSIBILITY[status] ?? RESPONSIBILITY.in_progress;
  const Icon = state.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border",
        compact ? "px-2.5 py-1.5" : "p-4",
        state.tone,
      )}
    >
      <Icon className={cn("shrink-0", compact ? "mt-0.5 h-3.5 w-3.5" : "mt-0.5 h-4 w-4")} />
      <div className="min-w-0">
        <div className={cn("font-medium", compact ? "text-xs" : "text-sm")}>{state.label}</div>
        {!compact && <p className="mt-0.5 text-xs opacity-80">{state.detail}</p>}
      </div>
    </div>
  );
}
