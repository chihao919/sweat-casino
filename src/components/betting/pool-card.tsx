import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OddsDisplay } from "@/components/betting/odds-display";
import { BettingPool, PoolStatus, PoolType } from "@/types";
import { formatSC } from "@/lib/sc/engine";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PoolCardProps {
  pool: BettingPool;
  onJoin?: (pool: BettingPool) => void;
}

const poolTypeLabel: Record<PoolType, string> = {
  [PoolType.TEAM_WIN]: "Team Win",
  [PoolType.PERSONAL_KM]: "Personal KM",
  [PoolType.WEEKLY_STREAK]: "Weekly Streak",
};

const statusConfig: Record<PoolStatus, { label: string; className: string }> = {
  [PoolStatus.OPEN]: {
    label: "Open",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  [PoolStatus.LOCKED]: {
    label: "Locked",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  [PoolStatus.SETTLED]: {
    label: "Settled",
    className: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
  },
  [PoolStatus.CANCELLED]: {
    label: "Cancelled",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

function calculateOdds(total: number, side: number): number {
  if (side <= 0 || total <= 0) return 1;
  // Pari-mutuel odds: total pool / side amount (simplified)
  return Math.max(1.05, Number((total / side).toFixed(2)));
}

export function PoolCard({ pool, onJoin }: PoolCardProps) {
  const status = statusConfig[pool.status];
  const resolveTime = formatDistanceToNow(new Date(pool.resolve_at), { addSuffix: true });
  const total = pool.side_a_total + pool.side_b_total;

  // Calculate proportional widths for the long/short bar
  const sideAPercent = total > 0 ? Math.round((pool.side_a_total / total) * 100) : 50;
  const sideBPercent = 100 - sideAPercent;

  const oddsA = calculateOdds(total, pool.side_a_total);
  const oddsB = calculateOdds(total, pool.side_b_total);

  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-neutral-700 text-xs text-neutral-400"
              >
                {poolTypeLabel[pool.pool_type]}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs font-medium", status.className)}
              >
                {status.label}
              </Badge>
            </div>
            <CardTitle className="text-sm font-semibold leading-snug text-neutral-100">
              {pool.title}
            </CardTitle>
            {pool.description && (
              <p className="text-xs text-neutral-400">{pool.description}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Side A vs Side B proportional bar */}
        <div className="space-y-2">
          <div className="flex overflow-hidden rounded-full">
            <div
              className="flex h-4 items-center justify-center bg-green-600 text-[10px] font-bold text-white transition-all duration-500"
              style={{ width: `${sideAPercent}%` }}
            >
              {sideAPercent > 20 && `${sideAPercent}%`}
            </div>
            <div
              className="flex h-4 items-center justify-center bg-red-600 text-[10px] font-bold text-white transition-all duration-500"
              style={{ width: `${sideBPercent}%` }}
            >
              {sideBPercent > 20 && `${sideBPercent}%`}
            </div>
          </div>

          {/* Side labels with odds */}
          <div className="flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <p className="font-medium text-neutral-200">{pool.side_a_label}</p>
              <div className="flex items-center gap-1.5">
                <OddsDisplay odds={oddsA} size="sm" />
                <span className="text-neutral-500">({formatSC(pool.side_a_total)})</span>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-medium text-neutral-200">{pool.side_b_label}</p>
              <div className="flex items-center justify-end gap-1.5">
                <OddsDisplay odds={oddsB} size="sm" />
                <span className="text-neutral-500">({formatSC(pool.side_b_total)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pool total and resolve time */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Total Pool</p>
            <p className="text-sm font-bold text-white">{formatSC(pool.total_pool)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Resolves</p>
            <p className="text-xs text-neutral-300">{resolveTime}</p>
          </div>
        </div>

        {/* Join button — only visible when pool is open */}
        {pool.status === PoolStatus.OPEN && onJoin && (
          <Button
            onClick={() => onJoin(pool)}
            className="w-full bg-red-600 font-semibold text-white hover:bg-red-700"
            size="sm"
          >
            Join Pool
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
