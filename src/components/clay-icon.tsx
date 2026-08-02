import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ClayIcon — 3D claymorphic icon badge.
 * Renders a Lucide icon inside a soft, layered, tactile "clay" surface with
 * inner highlight + outer soft shadow. Six preset tones map to the Ocean Deep palette.
 *
 * @example
 * <ClayIcon icon={Heart} tone="teal" size="lg" />
 */

type ClayTone = "ocean" | "teal" | "aurora" | "coral" | "sun" | "mint" | "ink";
type ClaySize = "sm" | "md" | "lg" | "xl";

const toneStyles: Record<ClayTone, string> = {
  /* Warm terracotta signature */
  coral:
    "bg-[linear-gradient(140deg,oklch(0.72_0.14_45),oklch(0.52_0.16_32))] text-[oklch(0.98_0.01_78)]",
  /* Peach — soft warm surface */
  sun: "bg-[linear-gradient(140deg,oklch(0.9_0.06_75),oklch(0.78_0.11_55))] text-[oklch(0.22_0.05_40)]",
  /* Sage — quiet secondary */
  mint: "bg-[linear-gradient(140deg,oklch(0.68_0.07_150),oklch(0.44_0.07_145))] text-[oklch(0.98_0.011_78)]",
  /* Deep sage as authoritative "ocean" replacement */
  ocean:
    "bg-[linear-gradient(140deg,oklch(0.44_0.07_145),oklch(0.28_0.06_150))] text-[oklch(0.98_0.011_78)]",
  /* Muted sage-teal blend */
  teal: "bg-[linear-gradient(140deg,oklch(0.6_0.07_155),oklch(0.42_0.07_150))] text-[oklch(0.98_0.011_78)]",
  /* Terracotta → peach aurora */
  aurora:
    "bg-[linear-gradient(140deg,oklch(0.62_0.14_38),oklch(0.82_0.09_60))] text-[oklch(0.14_0.02_40)]",
  /* Charcoal ink */
  ink: "bg-[linear-gradient(140deg,oklch(0.28_0.02_40),oklch(0.12_0.015_40))] text-[oklch(0.98_0.011_78)]",
};

const sizeStyles: Record<ClaySize, { box: string; icon: number }> = {
  sm: { box: "h-9 w-9 rounded-xl", icon: 16 },
  md: { box: "h-12 w-12 rounded-2xl", icon: 22 },
  lg: { box: "h-14 w-14 sm:h-16 sm:w-16 rounded-2xl", icon: 28 },
  xl: { box: "h-16 w-16 sm:h-20 sm:w-20 rounded-3xl", icon: 34 },
};

export interface ClayIconProps {
  icon: LucideIcon;
  tone?: ClayTone;
  size?: ClaySize;
  className?: string;
  /** When true, adds a subtle floating idle animation. */
  float?: boolean;
  "aria-label"?: string;
}

export function ClayIcon({
  icon: Icon,
  tone = "ocean",
  size = "lg",
  className,
  float = false,
  "aria-label": ariaLabel,
}: ClayIconProps) {
  const sz = sizeStyles[size];
  return (
    <span
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden shadow-clay transition-transform duration-500 ease-out",
        "hover:-translate-y-0.5 hover:rotate-[-2deg]",
        toneStyles[tone],
        sz.box,
        float && "animate-[clay-float_6s_ease-in-out_infinite]",
        className,
      )}
      style={{
        // subtle top-left specular highlight
        backgroundBlendMode: "normal",
      }}
    >
      {/* specular highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_28%_18%,oklch(1_0_0/0.55),transparent_55%)] mix-blend-screen"
      />
      {/* ambient bottom glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-1 bottom-0 h-1/2 rounded-[inherit] bg-[radial-gradient(ellipse_at_50%_100%,oklch(0_0_0/0.25),transparent_65%)] opacity-60"
      />
      <Icon
        size={sz.icon}
        strokeWidth={2.25}
        className="relative drop-shadow-[0_1px_1px_oklch(0_0_0/0.25)]"
      />
    </span>
  );
}
