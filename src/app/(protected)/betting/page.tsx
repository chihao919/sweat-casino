"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PersonalBetCard } from "@/components/betting/personal-bet-card";
import { PoolCard } from "@/components/betting/pool-card";
import { createClient } from "@/lib/supabase/client";
import {
  PersonalBet,
  BettingPool,
  BetStatus,
  BetType,
  PoolStatus,
  PoolSide,
} from "@/types";
import { Plus, Dices } from "lucide-react";
import { useSearchParams } from "next/navigation";

// ── New Bet form state
interface NewBetFormState {
  betType: BetType;
  targetKm: string;
  stakeAmount: string;
}

const DEFAULT_BET_FORM: NewBetFormState = {
  betType: BetType.OVER,
  targetKm: "",
  stakeAmount: "",
};

// ── Join Pool form state
interface JoinPoolFormState {
  side: PoolSide;
  amount: string;
}

function NewBetDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewBetFormState>(DEFAULT_BET_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated.");
      setIsSubmitting(false);
      return;
    }

    const targetValue = parseFloat(form.targetKm);
    const stake = parseFloat(form.stakeAmount);

    if (isNaN(targetValue) || targetValue <= 0 || isNaN(stake) || stake <= 0) {
      toast.error("Please enter valid target km and stake amounts.");
      setIsSubmitting(false);
      return;
    }

    // Fetch active season
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!season) {
      toast.error("No active season found.");
      setIsSubmitting(false);
      return;
    }

    // Calculate simple odds (placeholder — real odds would come from server)
    const odds = form.betType === BetType.OVER ? 1.8 : form.betType === BetType.UNDER ? 2.1 : 3.0;

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 7);

    const { error } = await supabase.from("personal_bets").insert({
      user_id: user.id,
      season_id: season.id,
      bet_type: form.betType,
      target_value: targetValue,
      current_value: 0,
      stake,
      odds,
      potential_payout: parseFloat((stake * odds).toFixed(2)),
      status: BetStatus.PENDING,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    });

    if (error) {
      toast.error("Failed to place bet: " + error.message);
    } else {
      toast.success("Bet placed!");
      setOpen(false);
      setForm(DEFAULT_BET_FORM);
      onCreated();
    }

    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 font-semibold text-white hover:bg-red-700" size="sm">
          <Plus className="mr-1.5 size-4" />
          新增賭注
        </Button>
      </DialogTrigger>

      <DialogContent className="border-neutral-800 bg-neutral-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">跟自己對賭</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-neutral-400">賭注類型</Label>
            <Select
              value={form.betType}
              onValueChange={(v) => setForm((f) => ({ ...f, betType: v as BetType }))}
            >
              <SelectTrigger className="border-neutral-700 bg-neutral-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-900 text-white">
                <SelectItem value={BetType.OVER}>看多 — 我會跑超過目標距離</SelectItem>
                <SelectItem value={BetType.UNDER}>看空 — 我會跑不到目標距離</SelectItem>
                <SelectItem value={BetType.EXACT}>精準 — 我會跑到剛好目標距離</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-neutral-400">目標距離 (km)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="例如 30"
              value={form.targetKm}
              onChange={(e) => setForm((f) => ({ ...f, targetKm: e.target.value }))}
              className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-neutral-400">賭注金額 ($SC)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              placeholder="例如 50"
              value={form.stakeAmount}
              onChange={(e) => setForm((f) => ({ ...f, stakeAmount: e.target.value }))}
              className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? "下注中..." : "下注 🎲"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreatePoolDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a pool title.");
      return;
    }
    setIsSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated.");
      setIsSubmitting(false);
      return;
    }

    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!season) {
      toast.error("No active season found.");
      setIsSubmitting(false);
      return;
    }

    const lockAt = new Date();
    lockAt.setDate(lockAt.getDate() + 3);
    const resolveAt = new Date();
    resolveAt.setDate(resolveAt.getDate() + 7);

    const { error } = await supabase.from("betting_pools").insert({
      season_id: season.id,
      pool_type: "team_win",
      title: title.trim(),
      status: PoolStatus.OPEN,
      total_pool: 0,
      side_a_total: 0,
      side_b_total: 0,
      side_a_label: "Red Bulls",
      side_b_label: "White Bears",
      lock_at: lockAt.toISOString(),
      resolve_at: resolveAt.toISOString(),
    });

    if (error) {
      toast.error("Failed to create pool: " + error.message);
    } else {
      toast.success("Pool created!");
      setOpen(false);
      setTitle("");
      onCreated();
    }

    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800"
          size="sm"
        >
          <Plus className="mr-1.5 size-4" />
          建立賭池
        </Button>
      </DialogTrigger>

      <DialogContent className="border-neutral-800 bg-neutral-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">建立賭池</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-neutral-400">賭池標題</Label>
            <Input
              placeholder="例如：這週誰會贏？"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? "建立中..." : "建立賭池"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardContent className="flex flex-col items-center gap-3 py-12">
        <Dices className="size-10 text-neutral-700" />
        <p className="text-sm text-neutral-400">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function BettingPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "pools" ? "pools" : "my-bets";
  const [bets, setBets] = useState<PersonalBet[]>([]);
  const [pools, setPools] = useState<BettingPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchData() {
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [betsRes, poolsRes] = await Promise.all([
        supabase
          .from("personal_bets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("betting_pools")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (betsRes.data) setBets(betsRes.data as PersonalBet[]);
      if (poolsRes.data) setPools(poolsRes.data as BettingPool[]);
    } catch (err) {
      console.error("BettingPage: failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleJoinPool(pool: BettingPool) {
    // Placeholder — a real implementation would open a dialog to select side & amount
    toast.info(`Joining pool: ${pool.title} — feature coming soon!`);
  }

  const activeBets = bets.filter((b) => b.status === BetStatus.PENDING);
  const completedBets = bets.filter((b) => b.status !== BetStatus.PENDING);
  const openPools = pools.filter((p) => p.status === PoolStatus.OPEN);
  const otherPools = pools.filter((p) => p.status !== PoolStatus.OPEN);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg bg-neutral-800" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl bg-neutral-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full border border-neutral-800 bg-neutral-900">
          <TabsTrigger
            value="my-bets"
            className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            我的賭注
          </TabsTrigger>
          <TabsTrigger
            value="pools"
            className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white"
          >
            公開賭池
          </TabsTrigger>
        </TabsList>

        {/* My Bets tab */}
        <TabsContent value="my-bets" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-300">
              進行中 ({activeBets.length})
            </h2>
            <NewBetDialog onCreated={fetchData} />
          </div>

          {activeBets.length === 0 ? (
            <EmptyState message="還沒有下注，快來跟自己對賭吧！" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeBets.map((bet) => (
                <PersonalBetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}

          {completedBets.length > 0 && (
            <>
              <h2 className="pt-2 text-sm font-semibold text-neutral-300">
                已結束 ({completedBets.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {completedBets.map((bet) => (
                  <PersonalBetCard key={bet.id} bet={bet} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Betting Pools tab */}
        <TabsContent value="pools" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-300">
              開放中 ({openPools.length})
            </h2>
            <CreatePoolDialog onCreated={fetchData} />
          </div>

          {openPools.length === 0 ? (
            <EmptyState message="目前沒有開放的賭池，快來建立一個吧！" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {openPools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} onJoin={handleJoinPool} />
              ))}
            </div>
          )}

          {otherPools.length > 0 && (
            <>
              <h2 className="pt-2 text-sm font-semibold text-neutral-300">
                過往賭池 ({otherPools.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {otherPools.map((pool) => (
                  <PoolCard key={pool.id} pool={pool} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
