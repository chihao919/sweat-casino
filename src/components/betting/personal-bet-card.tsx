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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "進行中", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  active:  { label: "進行中", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  won:     { label: "贏了",   className: "bg-green-500/20 text-green-400 border-green-500/30" },
  lost:    { label: "輸了",   className: "bg-red-500/20 text-red-400 border-red-500/30" },
  cancelled: { label: "已取消", className: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30" },
};

const DEFAULT_STATUS = {
  label: "未知",
  className: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
};

// Map both frontend enum and DB actual values
const betTypeLabel: Record<string, string> = {
  [BetType.OVER]: "看多",
  [BetType.UNDER]: "看空",
  [BetType.EXACT]: "精準",
  distance: "看多",
  count: "次數",
};

function calculateProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function PersonalBetCard({ bet }: PersonalBetCardProps) {
  const status = statusConfig[bet.status] || DEFAULT_STATUS;
  const progressPercent = calculateProgressPercent(bet.current_value, bet.target_value);
  // Support both frontend type (period_end) and DB type (end_date)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endDate = (bet as any).end_date as string | undefined;
  const betEndDate = bet.period_end || endDate || bet.created_at;
  const timeRemaining = formatDistanceToNow(new Date(betEndDate), { addSuffix: true });

  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-200">
          {betTypeLabel[bet.bet_type] || bet.bet_type} {bet.target_value.toFixed(1)} km
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
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">賭注</p>
            <p className="mt-0.5 text-sm font-bold text-white">{formatSC(bet.stake)}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">賠率</p>
            <div className="mt-0.5">
              <OddsDisplay odds={bet.odds} size="sm" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">派彩</p>
            <p className="mt-0.5 text-sm font-bold text-green-400">
              {formatSC(bet.potential_payout)}
            </p>
          </div>
        </div>

        {/* Time remaining (only shown for active bets) */}
        {(bet.status === BetStatus.PENDING || bet.status === ("active" as BetStatus)) && (
          <p className="text-right text-xs text-neutral-500">剩餘時間：{timeRemaining}</p>
        )}
      </CardContent>
    </Card>
  );
}
