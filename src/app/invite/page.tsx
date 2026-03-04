"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * /invite — Public landing page for recruiting new players.
 *
 * Highlights:
 * - 100% free
 * - Auto-sync from watch (no manual upload)
 * - Team PK & betting gameplay
 * - How to set up watch
 */
export default function InvitePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.15)_0%,_transparent_60%)]" />

      <div className="relative mx-auto max-w-lg px-5 py-10">
        {/* Hero */}
        <div className="text-center">
          <div className="text-7xl">🎰</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight">
            汗水賭場
          </h1>
          <p className="mt-3 text-xl text-red-400 font-bold">
            用汗水下注，讓跑步變成一場賭局
          </p>
          <p className="mt-2 text-base text-zinc-400">
            3 月 11 日（週三）正式開賽 🔥
          </p>
        </div>

        {/* 100% Free banner */}
        <Card className="mt-8 border-green-900/50 bg-gradient-to-r from-green-950/50 to-zinc-900">
          <CardContent className="py-5 text-center">
            <p className="text-3xl font-black text-green-400">💰 完全免費</p>
            <p className="mt-2 text-base text-zinc-300">
              不用花一毛錢！Strava、遊戲內貨幣，全部免費
            </p>
          </CardContent>
        </Card>

        {/* Pain point → Solution */}
        <div className="mt-8 space-y-4">
          <h2 className="text-center text-2xl font-black">
            😤 以前跑步好麻煩
          </h2>

          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-bold text-zinc-200">跑完還要手動上傳紀錄</p>
                  <p className="text-sm text-zinc-500">忘記按上傳，成績就消失了</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-bold text-zinc-200">跑完就結束了，沒有動力</p>
                  <p className="text-sm text-zinc-500">缺少持續跑步的理由</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-bold text-zinc-200">一個人跑太無聊</p>
                  <p className="text-sm text-zinc-500">沒有競爭，沒有陪伴</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-center text-2xl font-black pt-2">
            ✅ 汗水賭場幫你解決
          </h2>

          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⌚</span>
                <div>
                  <p className="font-bold text-green-400">手錶自動同步，跑完即上傳</p>
                  <p className="text-sm text-zinc-400">
                    串聯 Apple Watch、Garmin 或手機，跑完自動同步到遊戲，不用手動操作！
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-bold text-green-400">每公里賺 $SC，累積虛擬貨幣</p>
                  <p className="text-sm text-zinc-400">
                    每跑 1km = 10 $SC｜惡劣天氣跑步 = 1.5 倍獎勵！
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚔️</span>
                <div>
                  <p className="font-bold text-green-400">紅白對決，團隊 PK</p>
                  <p className="text-sm text-zinc-400">
                    自動分成紅牛隊 🐂 vs 白熊隊 🐻‍❄️，每週比拼誰跑得多！
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎲</span>
                <div>
                  <p className="font-bold text-green-400">下注對賭，挑戰自己</p>
                  <p className="text-sm text-zinc-400">
                    用 $SC 對自己下注：「這週我要跑 20km」。成功加倍奉還，失敗全部沒收！
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💀</span>
                <div>
                  <p className="font-bold text-green-400">不跑就扣錢！生存淘汰稅</p>
                  <p className="text-sm text-zinc-400">
                    每週跑不到 5km？扣 5% $SC！逼你出門動起來
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to set up watch */}
        <div className="mt-10">
          <h2 className="text-center text-2xl font-black">
            ⌚ 手錶設定超簡單
          </h2>
          <p className="mt-2 text-center text-base text-zinc-400">
            只要 3 步驟，以後跑步自動同步
          </p>

          <div className="mt-5 space-y-4">
            {/* Step 1 */}
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-black">
                  1
                </div>
                <div>
                  <p className="font-bold text-white text-lg">下載 Strava（免費）</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    到 App Store 或 Google Play 搜尋「Strava」，下載並用 Google 帳號註冊。
                    <span className="text-green-400 font-semibold"> 選免費方案就好！</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-black">
                  2
                </div>
                <div>
                  <p className="font-bold text-white text-lg">連結你的手錶</p>
                  <div className="mt-2 space-y-2 text-sm text-zinc-400">
                    <p>
                      <span className="text-white font-semibold">⌚ Apple Watch：</span>
                      Strava App → 設定 → 應用程式與裝置 → 開啟 Apple Health 同步。或直接在手錶安裝 Strava App。
                    </p>
                    <p>
                      <span className="text-white font-semibold">🏃 Garmin：</span>
                      Garmin Connect App → 設定 → 第三方應用 → 連結 Strava。
                    </p>
                    <p>
                      <span className="text-white font-semibold">📱 沒手錶？</span>
                      沒關係！直接用手機開 Strava 跑步一樣可以！
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-black">
                  3
                </div>
                <div>
                  <p className="font-bold text-white text-lg">登入汗水賭場，串聯 Strava</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    用 Google 帳號登入網站，按「連結 Strava」授權。
                    <span className="text-green-400 font-semibold"> 之後跑步完成就自動計分！</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center space-y-4">
          <Link href="/login">
            <Button className="h-16 w-full bg-red-600 text-xl font-black text-white hover:bg-red-500 shadow-lg shadow-red-900/30">
              🎰 立即加入汗水賭場
            </Button>
          </Link>

          <div className="flex gap-3">
            <Link href="/players" className="flex-1">
              <Button
                variant="outline"
                className="h-12 w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                👀 查看報名名單
              </Button>
            </Link>
            <Link href="/guide" className="flex-1">
              <Button
                variant="outline"
                className="h-12 w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                📖 完整規則
              </Button>
            </Link>
          </div>

          <p className="text-sm text-zinc-600">
            完全免費 • 不用付費訂閱 • 用汗水下注 💦
          </p>
        </div>
      </div>
    </div>
  );
}
