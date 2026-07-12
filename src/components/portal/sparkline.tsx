import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  width = 96,
  height = 28,
  className,
  strokeClassName = "stroke-primary",
  fillClassName = "fill-primary/10",
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeClassName?: string;
  fillClassName?: string;
}) {
  if (!values || values.length === 0) {
    return <div className={cn("h-7 w-24", className)} />;
  }
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / span) * height;
    return [x, y] as const;
  });
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${width.toFixed(2)},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      aria-hidden="true"
    >
      <path d={areaPath} className={fillClassName} />
      <path
        d={linePath}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClassName}
      />
    </svg>
  );
}
