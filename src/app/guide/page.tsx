"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  CloudRain,
  Skull,
  Swords,
  Target,
  TrendingUp,
  Footprints,
  ArrowRight,
  HelpCircle,
  Trophy,
  Coins,
  Timer,
  Snowflake,
  Thermometer,
  Wind,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

// -----------------------------------------------------------------------
// FAQ Accordion Item
// -----------------------------------------------------------------------
function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-white hover:text-red-400 transition-colors"
      >
        <span className="font-medium">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-4 text-zinc-400 leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Step Card (for onboarding)
// -----------------------------------------------------------------------
function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex shrink-0 flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white">
          {step}
        </div>
        {step < 5 && <div className="mt-2 h-full w-px bg-zinc-700" />}
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 text-white">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="mt-1 text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Main Guide Page
// -----------------------------------------------------------------------
export default function GuidePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.12)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tight">
            🎰 汗水賭場
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            用汗水下注，讓跑步變成一場賭局
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login">
              <Button className="bg-red-600 hover:bg-red-700 font-semibold">
                立即加入
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                進入首頁
              </Button>
            </Link>
          </div>
        </div>

        {/* ============================================================= */}
        {/* SECTION 1: Game Rules                                         */}
        {/* ============================================================= */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold">遊戲規則</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* SC Economy */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  $SC 汗水幣
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>
                  每跑 <Badge variant="secondary">1 公里</Badge> 賺取{" "}
                  <Badge className="bg-yellow-600/20 text-yellow-400">
                    10 $SC
                  </Badge>
                </p>
                <p className="mt-2">
                  註冊即贈{" "}
                  <span className="font-semibold text-yellow-400">
                    100 $SC
                  </span>{" "}
                  起始資金，用跑步累積更多籌碼！
                </p>
              </CardContent>
            </Card>

            {/* Weather Bonus */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <CloudRain className="h-5 w-5 text-blue-400" />
                  天氣加成 1.5x
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p className="mb-2">在惡劣天氣下跑步，獎勵翻 1.5 倍！</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="border-blue-800 text-blue-400"
                  >
                    <CloudRain className="mr-1 h-3 w-3" />
                    暴雨
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-purple-800 text-purple-400"
                  >
                    <Zap className="mr-1 h-3 w-3" />
                    雷暴
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-red-800 text-red-400"
                  >
                    <Thermometer className="mr-1 h-3 w-3" />
                    極端高溫 &gt;35°C
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-cyan-800 text-cyan-400"
                  >
                    <Snowflake className="mr-1 h-3 w-3" />
                    極端低溫 &lt;0°C
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-teal-800 text-teal-400"
                  >
                    <Wind className="mr-1 h-3 w-3" />
                    強風 &gt;10 m/s
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/30 text-white"
                  >
                    <Snowflake className="mr-1 h-3 w-3" />
                    下雪
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  * 多重天氣不疊加，最高 1.5x
                </p>
              </CardContent>
            </Card>

            {/* Survival Tax */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Skull className="h-5 w-5 text-red-500" />
                  生存稅
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>
                  每週一結算，若上週跑量不足{" "}
                  <Badge variant="secondary">5 公里</Badge>，將被扣除餘額的{" "}
                  <span className="font-semibold text-red-400">5%</span>{" "}
                  作為生存稅。
                </p>
                <p className="mt-2">
                  不跑就淘汰！你的 $SC 會慢慢蒸發 💀
                </p>
              </CardContent>
            </Card>

            {/* Team Battle */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Swords className="h-5 w-5 text-orange-500" />
                  隊伍對決
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>
                  註冊後自動分配到{" "}
                  <span className="font-semibold text-red-400">🐂 紅牛隊</span>{" "}
                  或{" "}
                  <span className="font-semibold text-zinc-200">
                    🐻‍❄️ 白熊隊
                  </span>
                  ，一旦分配不可更換。
                </p>
                <p className="mt-2">
                  <span className="font-medium text-white">調整分數</span> =
                  總公里數 × 活躍率
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  光靠少數人衝距離沒用，團隊活躍率才是關鍵！
                </p>
              </CardContent>
            </Card>

            {/* Personal Bets */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Target className="h-5 w-5 text-green-500" />
                  跟自己對賭
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>
                  設定目標（例如：本週跑 20km），押上 $SC 作為賭注。
                </p>
                <p className="mt-2">
                  達標獲得{" "}
                  <span className="font-semibold text-green-400">
                    1.5x ~ 5.0x
                  </span>{" "}
                  賠率派彩，失敗則賭注歸零。目標越難，賠率越高！
                </p>
              </CardContent>
            </Card>

            {/* Betting Pools */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  公開賭池
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-400">
                <p>
                  預測市場：「紅牛隊本週能跑超過 500km 嗎？」
                </p>
                <p className="mt-2">
                  選擇<span className="text-green-400">看多</span>或
                  <span className="text-red-400">看空</span>
                  ，投入 $SC。結算後贏家按比例分配整個賭池。
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  * 零抽成！100% 由玩家分配（Pari-mutuel 模式）
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Season */}
          <Card className="mt-4 border-zinc-800 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Trophy className="h-5 w-5 text-yellow-500" />
                賽季制度
              </CardTitle>
            </CardHeader>
            <CardContent className="text-zinc-400">
              <p>
                每個賽季為期 <span className="font-semibold text-white">3 個月</span>。
                賽季結束時，勝利隊伍的成員將獲得額外 $SC 賽季獎勵。
                新賽季開始時，所有人保留 $SC 餘額繼續戰鬥！
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator className="mb-16 bg-zinc-800" />

        {/* ============================================================= */}
        {/* SECTION 2: Getting Started                                    */}
        {/* ============================================================= */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-2">
            <Footprints className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold">新手上路</h2>
          </div>

          <div className="ml-1">
            <StepCard
              step={1}
              icon={<ArrowRight className="h-4 w-4 text-red-400" />}
              title="Google 登入"
              description="點擊「使用 Google 登入」，一鍵註冊。系統自動送你 100 $SC 起始資金。"
            />
            <StepCard
              step={2}
              icon={<Swords className="h-4 w-4 text-orange-400" />}
              title="加入隊伍"
              description="系統自動將你分配到紅牛隊 🐂 或白熊隊 🐻‍❄️，與隊友並肩作戰。分配後不可更換，這就是「共同命運」機制。"
            />
            <StepCard
              step={3}
              icon={<Footprints className="h-4 w-4 text-green-400" />}
              title="連結 Strava"
              description="到「個人資料」頁面連結你的 Strava 帳號。之後每次跑步完成，系統會自動同步你的跑步數據並發放 $SC。"
            />
            <StepCard
              step={4}
              icon={<Target className="h-4 w-4 text-blue-400" />}
              title="開始下注"
              description="到「下注」頁面跟自己對賭或加入公開賭池。押上你的 $SC，用行動證明自己！"
            />
            <StepCard
              step={5}
              icon={<Timer className="h-4 w-4 text-yellow-400" />}
              title="保持活躍"
              description="每週至少跑 5 公里避免生存稅。查看首頁的隊伍對決面板，和隊友一起衝排名！"
            />
          </div>
        </section>

        <Separator className="mb-16 bg-zinc-800" />

        {/* ============================================================= */}
        {/* SECTION 3: FAQ                                                */}
        {/* ============================================================= */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold">常見問題</h2>
          </div>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="px-6 py-2">
              <FAQItem
                question="$SC 可以換成真錢嗎？"
                answer="不行。$SC 是遊戲內虛擬貨幣，僅用於汗水賭場內的下注和競賽，沒有現實貨幣價值。"
              />
              <FAQItem
                question="我可以換隊伍嗎？"
                answer="不行。隊伍在註冊時自動分配且不可更換，這是「共同命運」設計的核心——你必須和隊友一起努力。"
              />
              <FAQItem
                question="沒有 Strava 可以玩嗎？"
                answer="目前需要 Strava 來自動記錄跑步數據。未來可能支援手動輸入或其他平台。建議先下載 Strava（免費），用手機 GPS 記錄跑步即可。"
              />
              <FAQItem
                question="天氣加成怎麼判定的？"
                answer="系統在你跑步時自動查詢起點位置的即時天氣（OpenWeatherMap API）。符合暴雨、雷暴、極端溫度、強風或下雪任一條件，即可獲得 1.5x 加成。多重條件不疊加。"
              />
              <FAQItem
                question="生存稅什麼時候扣？"
                answer="每週一 00:00 自動結算。系統檢查你上週（週一至週日）的總跑量，不足 5 公里則扣除餘額的 5%。最低扣 1 $SC（如果餘額大於 0）。"
              />
              <FAQItem
                question="下注輸了怎麼辦？"
                answer="個人賭注：未達標則賭金歸零。公開賭池：選錯邊則投入金額歸零，由贏家分配。但別擔心，繼續跑步就能賺回來！"
              />
              <FAQItem
                question="賠率怎麼算的？"
                answer="個人賭注：根據你的歷史平均表現計算，目標越有挑戰性賠率越高（1.5x~5.0x）。公開賭池：動態賠率 = 總賭池 ÷ 你選的那邊的總額，隨其他玩家加入而變動。"
              />
              <FAQItem
                question="賽季獎勵怎麼發？"
                answer="每個賽季為期 3 個月。賽季結束時，調整分數（總公里 × 活躍率）較高的隊伍獲勝，該隊全體成員獲得額外 $SC 獎勵。"
              />
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h3 className="mb-4 text-xl font-bold">準備好用汗水下注了嗎？</h3>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 font-bold text-lg px-8"
            >
              🎰 立即加入汗水賭場
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-zinc-600">
          <p>Sweat Casino © 2026 — 你的汗水，你的籌碼</p>
        </div>
      </div>
    </div>
  );
}
