"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, Dices, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavTab {
  href: string;
  label: string;
  icon: React.ElementType;
}

const tabs: NavTab[] = [
  { href: "/dashboard", label: "首頁", icon: LayoutDashboard },
  { href: "/leaderboard", label: "排行榜", icon: Trophy },
  { href: "/betting", label: "下注", icon: Dices },
  { href: "/shop", label: "商城", icon: ShoppingBag },
  { href: "/profile", label: "我的", icon: User },
];

interface BottomNavProps {
  // Team color used for active tab highlight ("red" | "white" | null)
  teamColor?: "red" | "white" | null;
}

export function BottomNav({ teamColor = null }: BottomNavProps) {
  const pathname = usePathname();

  function getActiveColorClass(isActive: boolean): string {
    if (!isActive) return "";
    if (teamColor === "red") return "text-red-500";
    if (teamColor === "white") return "text-neutral-100";
    return "text-red-500"; // default accent
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const activeColorClass = getActiveColorClass(isActive);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                isActive
                  ? cn("opacity-100", activeColorClass)
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span>{label}</span>

              {/* Active indicator dot */}
              {isActive && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
                    teamColor === "white" ? "bg-neutral-100" : "bg-red-500"
                  )}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
