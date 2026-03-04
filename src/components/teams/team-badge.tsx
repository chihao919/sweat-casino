import { cn } from "@/lib/utils";

interface TeamInfo {
  name: string;
  color: string;
  emoji?: string;
}

interface TeamBadgeProps {
  team: TeamInfo | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Determine if team is "white/neutral" based on color value
function isLightTeam(color: string): boolean {
  const lightColors = ["#e5e5e5", "#f5f5f5", "#ffffff", "#d4d4d4", "white", "neutral"];
  return lightColors.some((c) => color.toLowerCase().includes(c.replace("#", "")));
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-3 py-1 gap-1.5",
  lg: "text-base px-4 py-1.5 gap-2",
};

const dotSizeClasses = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3",
};

export function TeamBadge({ team, size = "md", className }: TeamBadgeProps) {
  if (!team) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-neutral-700 bg-neutral-800 font-medium text-neutral-400",
          sizeClasses[size],
          className
        )}
      >
        <span className={cn("rounded-full bg-neutral-600", dotSizeClasses[size])} />
        未加入隊伍
      </span>
    );
  }

  const light = isLightTeam(team.color);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        // Red Bulls: dark red bg with white text
        // White Bears: light neutral bg with dark text
        light
          ? "border border-neutral-400 bg-neutral-200 text-neutral-900"
          : "border border-red-700 bg-red-600 text-white",
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          "rounded-full",
          dotSizeClasses[size],
          light ? "bg-neutral-500" : "bg-red-200"
        )}
      />
      {team.emoji && <span>{team.emoji}</span>}
      {team.name}
    </span>
  );
}
