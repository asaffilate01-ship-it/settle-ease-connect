import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; to?: string };

export function PortalHeader({
  eyebrow = "Staff portal",
  title,
  subtitle,
  crumbs,
  actions,
  tabs,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          {(crumbs?.length ?? 0) > 0 ? (
            <nav className="flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <Link to="/portal" className="hover:text-foreground">
                {eyebrow}
              </Link>
              {crumbs!.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 opacity-50" />
                  {c.to ? (
                    <Link to={c.to as any} className="hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-foreground/80">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : (
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-1 truncate font-display text-2xl font-semibold sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && (
        <div className="-mx-4 overflow-x-auto border-b border-border/60 px-4 sm:mx-0 sm:px-0">
          {tabs}
        </div>
      )}
    </div>
  );
}
