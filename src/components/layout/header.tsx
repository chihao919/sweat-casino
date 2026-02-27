"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Coins,
  User,
  Wallet,
  LogOut,
  Menu,
  LayoutDashboard,
  Trophy,
  Dices,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TeamBadge } from "@/components/teams/team-badge";
import { createClient } from "@/lib/supabase/client";
import { formatSC } from "@/lib/sc/engine";
import { Profile } from "@/types";

interface HeaderProps {
  profile: Profile | null;
}

const mobileNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/betting", label: "Betting", icon: Dices },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

function getInitials(profile: Profile): string {
  const name = profile.display_name ?? profile.username ?? "SC";
  return name.slice(0, 2).toUpperCase();
}

function buildTeamInfo(profile: Profile) {
  if (!profile.team) return null;
  // Determine emoji based on team name convention
  const name = profile.team.name.toLowerCase();
  const emoji = name.includes("red") ? "🐂" : "🐻‍❄️";
  return { name: profile.team.name, color: profile.team.color, emoji };
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out. Please try again.");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  const teamInfo = profile ? buildTeamInfo(profile) : null;
  const balanceDisplay = profile ? formatSC(profile.sc_balance) : "$0.00 SC";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-screen-lg items-center justify-between px-4">
        {/* Left: Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-black tracking-tight text-white hover:opacity-80 transition-opacity"
        >
          <span>🎰</span>
          <span>Sweat Casino</span>
        </Link>

        {/* Center: Team badge (hidden on mobile, shown md+) */}
        {teamInfo && (
          <div className="hidden md:block">
            <TeamBadge team={teamInfo} size="md" />
          </div>
        )}

        {/* Right: Balance + Avatar */}
        <div className="flex items-center gap-3">
          {profile && (
            <>
              {/* SC Balance chip */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-yellow-600/40 bg-yellow-950/40 px-3 py-1">
                <Coins className="size-3.5 text-yellow-500" />
                <span className="text-sm font-bold tabular-nums text-yellow-300">
                  {balanceDisplay}
                </span>
              </div>

              {/* Avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-neutral-700 hover:ring-red-600 transition-all focus:outline-none">
                    <Avatar className="size-8">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-neutral-800 text-xs font-bold text-white">
                        {getInitials(profile)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-48 border-neutral-800 bg-neutral-900 text-neutral-200"
                >
                  <DropdownMenuLabel className="text-xs text-neutral-400">
                    {profile.display_name ?? profile.username ?? "Athlete"}
                  </DropdownMenuLabel>

                  {/* Mobile: show balance inside dropdown */}
                  <div className="sm:hidden flex items-center gap-1.5 px-2 py-1.5">
                    <Coins className="size-3.5 text-yellow-500" />
                    <span className="text-sm font-bold tabular-nums text-yellow-300">
                      {balanceDisplay}
                    </span>
                  </div>

                  <DropdownMenuSeparator className="bg-neutral-800" />

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex cursor-pointer items-center gap-2">
                      <User className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="flex cursor-pointer items-center gap-2">
                      <Wallet className="size-4" />
                      Wallet
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-neutral-800" />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex cursor-pointer items-center gap-2 text-red-400 focus:text-red-400"
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Mobile menu hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-neutral-400 hover:text-white"
              >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64 border-neutral-800 bg-neutral-950 p-0">
              <SheetHeader className="border-b border-neutral-800 px-5 py-4">
                <SheetTitle className="text-left text-lg font-black text-white">
                  🎰 Sweat Casino
                </SheetTitle>
                {teamInfo && (
                  <div className="pt-1">
                    <TeamBadge team={teamInfo} size="sm" />
                  </div>
                )}
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-3">
                {mobileNavLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                  >
                    <Icon className="size-5" />
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
