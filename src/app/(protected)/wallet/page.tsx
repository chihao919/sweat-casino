"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { SCTransaction, TransactionType, Profile } from "@/types";
import { formatSC } from "@/lib/sc/engine";
import { format, parseISO } from "date-fns";
import { Coins, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

// ── Badge config per transaction type
const typeConfig: Record<
  TransactionType,
  { label: string; className: string }
> = {
  [TransactionType.SIGNUP_BONUS]: {
    label: "Signup Bonus",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  [TransactionType.ACTIVITY_EARNED]: {
    label: "Activity Reward",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  [TransactionType.SURVIVAL_TAX]: {
    label: "Survival Tax",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  [TransactionType.BET_PLACED]: {
    label: "Bet Placed",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  [TransactionType.BET_WON]: {
    label: "Bet Won",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  [TransactionType.BET_REFUND]: {
    label: "Bet Refund",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  [TransactionType.POOL_ENTRY]: {
    label: "Pool Entry",
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  [TransactionType.POOL_PAYOUT]: {
    label: "Pool Payout",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
};

// Transaction types that represent money going out
const NEGATIVE_TYPES = new Set<TransactionType>([
  TransactionType.SURVIVAL_TAX,
  TransactionType.BET_PLACED,
  TransactionType.POOL_ENTRY,
]);

type FilterType = "all" | "rewards" | "bets" | "tax";

const filterGroups: Record<FilterType, TransactionType[] | null> = {
  all: null,
  rewards: [
    TransactionType.SIGNUP_BONUS,
    TransactionType.ACTIVITY_EARNED,
    TransactionType.BET_WON,
    TransactionType.BET_REFUND,
    TransactionType.POOL_PAYOUT,
  ],
  bets: [
    TransactionType.BET_PLACED,
    TransactionType.BET_WON,
    TransactionType.BET_REFUND,
    TransactionType.POOL_ENTRY,
    TransactionType.POOL_PAYOUT,
  ],
  tax: [TransactionType.SURVIVAL_TAX],
};

export default function WalletPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<SCTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function fetchWalletData() {
      const supabase = createClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const [profileRes, txRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single<Profile>(),
          supabase
            .from("sc_transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (txRes.data) setTransactions(txRes.data as SCTransaction[]);
      } catch (err) {
        console.error("WalletPage: failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWalletData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const types = filterGroups[filter];
    if (!types) return transactions;
    return transactions.filter((tx) => types.includes(tx.type));
  }, [transactions, filter]);

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = filteredTransactions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  // Reset page when filter changes
  function handleFilterChange(value: string) {
    setFilter(value as FilterType);
    setPage(0);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-xl bg-neutral-800" />
        <Skeleton className="h-96 w-full rounded-xl bg-neutral-800" />
      </div>
    );
  }

  const teamColor = profile?.team_id ? "red" : "neutral";
  const borderColorClass =
    teamColor === "red" ? "border-red-600/50" : "border-neutral-600/50";

  return (
    <div className="space-y-5">
      {/* Balance hero */}
      <Card className={cn("border-2 bg-neutral-900", borderColorClass)}>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <div className="flex size-14 items-center justify-center rounded-full bg-yellow-950/50 ring-2 ring-yellow-600/30">
            <Coins className="size-7 text-yellow-500" />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              Current Balance
            </p>
            <p className="mt-1 text-5xl font-black tabular-nums text-white">
              {profile ? formatSC(profile.sc_balance) : "$0.00 SC"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card className="border-neutral-800 bg-neutral-900">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-neutral-300">
            Transaction History
          </CardTitle>
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-8 w-32 border-neutral-700 bg-neutral-800 text-xs text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-neutral-900 text-neutral-200">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="rewards">Rewards</SelectItem>
              <SelectItem value="bets">Bets</SelectItem>
              <SelectItem value="tax">Tax</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="p-0">
          {paginatedTransactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Coins className="size-8 text-neutral-700" />
              <p className="text-sm text-neutral-500">No transactions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 hover:bg-transparent">
                    <TableHead className="text-xs text-neutral-500">Date</TableHead>
                    <TableHead className="text-xs text-neutral-500">Type</TableHead>
                    <TableHead className="hidden text-xs text-neutral-500 sm:table-cell">
                      Description
                    </TableHead>
                    <TableHead className="text-right text-xs text-neutral-500">
                      Amount
                    </TableHead>
                    <TableHead className="hidden text-right text-xs text-neutral-500 sm:table-cell">
                      Balance After
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((tx) => {
                    const config = typeConfig[tx.type];
                    const isNegative = NEGATIVE_TYPES.has(tx.type);
                    return (
                      <TableRow
                        key={tx.id}
                        className="border-neutral-800 hover:bg-neutral-800/50"
                      >
                        <TableCell className="text-xs text-neutral-400">
                          {format(parseISO(tx.created_at), "MMM d")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] whitespace-nowrap", config.className)}
                          >
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-neutral-400 sm:table-cell">
                          {tx.description ?? "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right text-sm font-bold tabular-nums",
                            isNegative ? "text-red-400" : "text-green-400"
                          )}
                        >
                          {isNegative ? "-" : "+"}
                          {Math.abs(tx.amount).toFixed(2)} SC
                        </TableCell>
                        <TableCell className="hidden text-right text-xs tabular-nums text-neutral-400 sm:table-cell">
                          {tx.balance_after.toFixed(2)} SC
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-3">
              <p className="text-xs text-neutral-500">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-30"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
