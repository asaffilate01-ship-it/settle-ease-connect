import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PolishedCard — premium layered card surface.
 * Uses a soft gradient, hairline border, layered shadow, and a hover lift.
 * Optional `glow` adds a teal accent halo on hover — good for feature cards.
 */

export interface PolishedCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  interactive?: boolean;
  as?: "div" | "article" | "section";
  children: ReactNode;
}

export const PolishedCard = forwardRef<HTMLDivElement, PolishedCardProps>(
  function PolishedCard(
    { glow = false, interactive = true, className, children, as: _as, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-border/70",
          "bg-[linear-gradient(180deg,var(--color-card),oklch(0.955_0.019_72))]",
          "shadow-card",
          interactive &&
            "transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-elevated",
          className,
        )}
        {...rest}
      >
        {/* editorial top hairline */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,oklch(0.56_0.15_38/0.5),transparent)]"
        />
        {/* soft warm paper grain highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_20%_0%,oklch(1_0_0/0.55),transparent_55%)] opacity-70"
        />
        {glow && (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-24 -z-10 rounded-full bg-[radial-gradient(circle,oklch(0.56_0.15_38/0.18),transparent_60%)] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        <div className="relative">{children}</div>
      </div>
    );
  },
);
