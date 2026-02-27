import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OddsDisplay } from "@/components/betting/odds-display";
import { PersonalBet, BetStatus, BetType } from "@/types";
import { formatSC } from "@/lib/sc/engine";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PersonalBetCardProps {
  bet: PersonalBet;
}

const statusConfig: Record<BetStatus, { label: string; className: string }> = {
  [BetStatus.PENDING]: {
    label: "Active",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  [BetStatus.WON]: {
    label: "Won",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  [BetStatus.LOST]: {
    label: "Lost",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  [BetStatus.CANCELLED]: {
    label: "Cancelled",
    className: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
  },
};

const betTypeLabel: Record<BetType, string> = {
  [BetType.OVER]: "Over",
  [BetType.UNDER]: "Under",
  [BetType.EXACT]: "Exact",
};

function calculateProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function PersonalBetCard({ bet }: PersonalBetCardProps) {
  const status = statusConfig[bet.status];
  const progressPercent = calculateProgressPercent(bet.current_value, bet.target_value);
  const timeRemaining = formatDistanceToNow(new Date(bet.period_end), { addSuffix: true });

  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-200">
          {betTypeLabel[bet.bet_type]} {bet.target_value.toFixed(1)} km
        </CardTitle>
        <Badge
          variant="outline"
          className={cn("text-xs font-medium", status.className)}
        >
          {status.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>
              {bet.current_value.toFixed(1)} / {bet.target_value.toFixed(1)} km
            </span>
            <span className="font-semibold text-white">{progressPercent}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2 bg-neutral-800 [&>div]:bg-red-500"
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Stake</p>
            <p className="mt-0.5 text-sm font-bold text-white">{formatSC(bet.stake)}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Odds</p>
            <div className="mt-0.5">
              <OddsDisplay odds={bet.odds} size="sm" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Payout</p>
            <p className="mt-0.5 text-sm font-bold text-green-400">
              {formatSC(bet.potential_payout)}
            </p>
          </div>
        </div>

        {/* Time remaining (only shown for active bets) */}
        {bet.status === BetStatus.PENDING && (
          <p className="text-right text-xs text-neutral-500">Ends {timeRemaining}</p>
        )}
      </CardContent>
    </Card>
  );
}
