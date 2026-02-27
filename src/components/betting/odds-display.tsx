import { cn } from "@/lib/utils";

interface OddsDisplayProps {
  odds: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Color thresholds based on risk level
function getOddsColorClass(odds: number): string {
  if (odds < 2) return "text-green-400";
  if (odds <= 3.5) return "text-yellow-400";
  return "text-red-400";
}

const sizeClasses = {
  sm: "text-sm font-semibold",
  md: "text-base font-bold",
  lg: "text-2xl font-black tracking-tight",
};

export function OddsDisplay({ odds, size = "md", className }: OddsDisplayProps) {
  const colorClass = getOddsColorClass(odds);

  return (
    <span className={cn(sizeClasses[size], colorClass, "tabular-nums", className)}>
      {odds.toFixed(2)}x
    </span>
  );
}
