import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  deltaPct,
  deltaLabel,
  sparkline,
  to,
  hint,
  intent = "neutral",
}: {
  label: string;
  value: ReactNode;
  deltaPct?: number | null;
  deltaLabel?: string;
  sparkline?: number[];
  to?: string;
  hint?: string;
  /** neutral: up=green, down=red. inverse: up=red, down=green (for stalled cases, overdue). */
  intent?: "neutral" | "inverse";
}) {
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const positive = hasDelta && deltaPct! > 0.5;
  const negative = hasDelta && deltaPct! < -0.5;
  const good = intent === "inverse" ? negative : positive;
  const bad = intent === "inverse" ? positive : negative;
  const deltaClass = good
    ? "text-success"
    : bad
      ? "text-destructive"
      : "text-muted-foreground";

  const Wrapper: any = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition",
        to && "hover:border-primary/40 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline
            values={sparkline}
            width={72}
            height={22}
            strokeClassName={good ? "stroke-success" : bad ? "stroke-destructive" : "stroke-primary"}
            fillClassName={good ? "fill-success/10" : bad ? "fill-destructive/10" : "fill-primary/10"}
          />
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">{value}</div>
        {hasDelta && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium tabular-nums", deltaClass)}>
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : negative ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {positive || negative
              ? `${Math.abs(deltaPct!).toFixed(0)}%`
              : "flat"}
          </div>
        )}
      </div>
      {(hint || deltaLabel) && (
        <div className="mt-1 text-xs text-muted-foreground">
          {deltaLabel && <span className="mr-1">{deltaLabel}</span>}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </Wrapper>
  );
}
